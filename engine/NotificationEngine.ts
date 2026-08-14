import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { dateToStr, parseLocalDate, getDaysSince, isValidOnDayOfWeek, calculateNegativeStreak } from '../utils/dateUtils';
import { handleAsyncError } from '../utils/errorHandler';
import { translations, LanguageCode } from '../locales';
import { getInactivityDays } from './EngagementTracker';
import {
  pickToneBucket,
  pickToneKeys,
  PASSIVE_AGGRESSIVE_THRESHOLD_DAYS,
  SILENT_MODE_THRESHOLD_DAYS,
} from './ToneScheduler';
import {
  classifyQuittingDay,
  computeQuittingSavings,
  formatMoneySaved,
  formatTimeReclaimed,
  nextMilestone,
  pickQuittingFrame,
  type QuittingDayKind,
  type QuittingFrame,
  type QuittingTimeSlot,
} from '../utils/quittingFormatters';

// ─── Tipler ─────────────────────────────
export interface NotificationSettings {
  enabled: boolean;
  quietHoursStart: string;  // "23:00"
  quietHoursEnd: string;    // "07:00"
  streakGuardianEnabled: boolean;
  smartNudgeEnabled: boolean;
  weeklyPulseEnabled: boolean;
  milestonesEnabled: boolean;
  achievementsEnabled: boolean;
  passiveAggressiveEnabled: boolean;
  maxSnoozeCount: number;
}

interface HabitLike {
  id: string;
  title: string;
  type?: 'positive' | 'negative';
  completed: boolean;
  streak: number;
  startDate: number;
  frequency: string;
  customDays?: number[];
  reminderTime?: string;
  icon?: string;
  color?: string;
  history: Record<string, boolean>;
  // Negatif (bırakma) alışkanlık alanları — opsiyonel
  costPerDay?: number;
  timePerDay?: number;
  bestCleanStreak?: number;
  relapseHistory?: Array<{ date: string; trigger: string }>;
  // P3 — pozitif alışkanlık için per-habit en uzun geçmiş seri.
  // HabitsContext bu alanı scheduleAllNotifications çağrısı öncesi türetir.
  bestStreak?: number;
}

const SETTINGS_KEY = '@notification_settings_v1';
const SETTINGS_CORRUPT_BACKUP_KEY = '@notification_settings_corrupt_v1';
const LANGUAGE_KEY = '@app_language';
const CURRENCY_KEY = '@currency_pref';
const SUPPORTED_LANGS: LanguageCode[] = ['tr', 'en', 'es', 'de', 'fr', 'zh', 'it'];

// Module-level cache — avoids repeated AsyncStorage reads on every scheduleAllNotifications call
let _settingsCache: NotificationSettings | null = null;
let _langCache: LanguageCode | null = null;
let _currencyCache: string | null = null;

export function invalidateNotificationCache(): void {
  _settingsCache = null;
  _langCache = null;
  _currencyCache = null;
}

// Quiet hours: gece 23:00-07:00 — push'ların kullanıcıyı uykusundan
// uyandırmamasını sağlar. maxSnoozeCount=3 spam'e karşı sınır.
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  quietHoursStart: '23:00',
  quietHoursEnd: '07:00',
  streakGuardianEnabled: true,
  smartNudgeEnabled: true,
  weeklyPulseEnabled: true,
  milestonesEnabled: true,
  achievementsEnabled: true,
  passiveAggressiveEnabled: true,
  maxSnoozeCount: 3,
};

// Hatırlatıcı zamanı için "kapalı" sentinel — eski sürümlerden kalan Türkçe
// 'Yok' string'i yerine kullanılır. UI ve engine bu iki değeri de kabul eder.
export const REMINDER_NONE = '__none__';

// ─── Dil Yardımcıları ─────────────────────────────
async function getStoredLanguage(): Promise<LanguageCode> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored as LanguageCode)) {
      return stored as LanguageCode;
    }
  } catch (e) {
    handleAsyncError('getStoredLanguage', e);
  }
  return 'en';
}

// useCurrencyPref ile aynı anahtar — engine bağımsız okuyabilsin diye
// hook'a değil AsyncStorage'a doğrudan bağlanır. Default '₺'.
async function getStoredCurrency(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(CURRENCY_KEY);
    if (stored) return stored;
  } catch (e) {
    handleAsyncError('getStoredCurrency', e);
  }
  return '₺';
}

function createT(lang: LanguageCode) {
  return (key: string, params?: Record<string, string | number>): string => {
    const found = translations[lang]?.[key] ?? translations['en']?.[key];
    if (found === undefined && __DEV__) {
      // Surfaces typos and missing entries (esp. dynamic keys like
      // notif_milestone_${n}_title) instead of silently shipping the raw key
      // to the user's notification.
      console.warn(`[NotificationEngine] missing i18n key: "${key}" (lang=${lang})`);
    }
    let text = found ?? key;
    if (params) {
      Object.keys(params).forEach(p => {
        // Use split/join to avoid regex special-char issues with $ in replacement values
        text = text.split(`{${p}}`).join(String(params[p]));
      });
    }
    return text;
  };
}

/**
 * Returns true only if `key` resolves to a real translation in the active or
 * fallback language — used by callers that want to skip a notification entirely
 * rather than emit a raw key string to the user.
 */
function hasTranslation(lang: LanguageCode, key: string): boolean {
  return (
    translations[lang]?.[key] !== undefined ||
    translations['en']?.[key] !== undefined
  );
}

// ─── Yardımcılar ─────────────────────────────
// HH:mm parse — geçersiz/range dışı değerleri 0'a sabitler (sessiz şekilde
// 25:99 gibi inputlar Date'e bizonore davranışla yansımasın).
const parseTime = (timeStr: string): { hour: number; minute: number } => {
  const [h, m] = (timeStr || '').split(':').map(Number);
  const hour = Number.isFinite(h) && h >= 0 && h <= 23 ? h : 0;
  const minute = Number.isFinite(m) && m >= 0 && m <= 59 ? m : 0;
  return { hour, minute };
};

const todayStr = () => dateToStr(new Date());
// isValidOnDayOfWeek is imported from dateUtils — single source of truth.

// In-memory mutex — birden fazla scheduleAllNotifications çağrısı yarışırsa,
// `cancelAll → schedule` blokları iç içe geçip kuyruğun yarısı kaybolabilir.
// Tek bir queue üzerinden seri çalıştırarak race'i kapatır.
let _scheduleLock: Promise<void> = Promise.resolve();
async function withScheduleLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = _scheduleLock;
  let release!: () => void;
  _scheduleLock = new Promise<void>(resolve => { release = resolve; });
  try {
    await prev;
    return await fn();
  } finally {
    release();
  }
}

// OS izni preflight — UI bypass eden code path'lerinde (boot, addHabit,
// dil değişimi) izin yokken 40 schedule çağrısının ardı ardına fail
// loglaması üretmesini önler.
async function isOsPermissionGranted(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const res = await Notifications.getPermissionsAsync();
    return res.status === 'granted';
  } catch {
    return false;
  }
}

// 1 sn minimum guard — geçmiş zamanlı tetikleri Expo reddediyor. Eskiden 5 sn
// tampon vardı; backgrounding edge-case'lerinde "geleceği" kaçırıyordu.
const safeTrigger = (tgtDate: Date): Notifications.DateTriggerInput => {
  const futureTime = Math.max(Date.now() + 1000, tgtDate.getTime());
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(futureTime),
  } as Notifications.DateTriggerInput;
};

// Risk skoru = streak × 1.5 + bonus
const riskScore = (streak: number): number => {
  let score = streak * 1.5;
  if (streak >= 7) score += 20;
  if (streak >= 30) score += 50;
  return score;
};

// Bekleyen alışkanlıkları virgül + bağlaçla birleştirip body üretir.
// Smart Nudge ve Morning Preview için ortak — scenario param'ı locale key
// prefix'ini ('notif_nudge_body' / 'notif_morning_preview_body') belirler.
// Generic fallback varsa eski count-only body'ye düşülür (eski diller için).
const PENDING_TITLE_MAX = 18;
function truncateTitle(s: string): string {
  return s.length > PENDING_TITLE_MAX ? s.slice(0, PENDING_TITLE_MAX - 1) + '…' : s;
}
function buildPendingHabitsBody(
  pending: HabitLike[],
  scenario: 'nudge' | 'preview',
  lang: LanguageCode,
  t: (k: string, p?: Record<string, string | number>) => string,
): string {
  // Riskli olanlar önce — kullanıcının dikkatine en çok ihtiyaç duyan habit body'nin başında.
  const sorted = [...pending].sort((a, b) => b.streak - a.streak);
  const titles = sorted.map(h => truncateTitle(h.title));
  const prefix = scenario === 'nudge' ? 'notif_nudge_body' : 'notif_morning_preview_body';
  const oneKey = `${prefix}_one`;
  const twoKey = `${prefix}_two`;
  const threeKey = `${prefix}_three`;
  const moreKey = `${prefix}_more`;

  if (titles.length === 1 && hasTranslation(lang, oneKey)) {
    return t(oneKey, { title: titles[0] });
  }
  if (titles.length === 2 && hasTranslation(lang, twoKey)) {
    return t(twoKey, { a: titles[0], b: titles[1] });
  }
  if (titles.length === 3 && hasTranslation(lang, threeKey)) {
    return t(threeKey, { a: titles[0], b: titles[1], c: titles[2] });
  }
  if (titles.length >= 4 && hasTranslation(lang, moreKey)) {
    return t(moreKey, {
      a: titles[0],
      b: titles[1],
      c: titles[2],
      n: titles.length - 2,
    });
  }
  // Fallback: legacy count-only body (eski/eksik çeviriler için).
  return scenario === 'nudge'
    ? t('notif_nudge_body', { count: titles.length })
    : t('notif_nudge_body', { count: titles.length });
}

// Negatif (bırakma) alışkanlıklar için her gün sabah + akşam motivasyon
// bildirimleri planlar. Kazanç çerçevesi (cost > 0 → para, time > 0 → zaman,
// yoksa pure streak). Sınıflandırma classifyQuittingDay üzerinden:
// pre_milestone / post_milestone / plateau / near_record / record_chase.
// Toplam slot bütçesi 21 — round-robin fairness için tarihe göre sort+slice.
function scheduleQuittingDailyMotivation(
  negativeHabits: HabitLike[],
  quietStart: { hour: number; minute: number },
  quietEnd: { hour: number; minute: number },
  currency: string,
  lang: LanguageCode,
  t: (k: string, p?: Record<string, string | number>) => string,
  out: Array<{ content: Notifications.NotificationContentInput; trigger: Notifications.DateTriggerInput }>,
): void {
  const MAX_QUITTING_NOTIFS = 21;
  const DAYS_AHEAD = 7;
  const MILESTONE_SET = new Set([1, 3, 7, 14, 30, 90]);

  // Quiet hours boundary'lerinden 2 saat içeride: default 09:00 ve 21:00.
  // Kullanıcı quiet hours değiştirirse otomatik kayar (ör. 22:00→24:00 → 20:00 akşam).
  const morningHour = (quietEnd.hour + 2) % 24;
  const eveningHour = (quietStart.hour - 2 + 24) % 24;

  // Hours/minutes locale string'leri — formatTimeReclaimed için.
  const hoursShort = t('hours_short');
  const minutesShort = t('minutes_short');

  type Cand = {
    content: Notifications.NotificationContentInput;
    trigger: Notifications.DateTriggerInput;
    sortKey: number;
  };
  const candidates: Cand[] = [];
  const now = Date.now();

  for (const habit of negativeHabits) {
    const currentClean = calculateNegativeStreak(habit.startDate, habit.relapseHistory);
    if (currentClean === 0) continue; // milestone-1 zaten halleder

    const frame: QuittingFrame = pickQuittingFrame(habit.costPerDay, habit.timePerDay);
    const best = habit.bestCleanStreak || 0;

    for (let d = 1; d <= DAYS_AHEAD; d++) {
      const futureDays = currentClean + d;
      // Milestone gününde milestone bildirimi zaten planlanır — çift olmasın.
      if (MILESTONE_SET.has(futureDays)) continue;

      const kind: QuittingDayKind = classifyQuittingDay(futureDays, best);
      const next = nextMilestone(futureDays);
      const remain = best > 0 && futureDays < best ? best - futureDays : 0;
      const savings = computeQuittingSavings(habit.costPerDay, habit.timePerDay, futureDays);

      const params = {
        days: futureDays,
        title: habit.title,
        next: next?.milestone ?? '∞',
        remain,
        money: formatMoneySaved(savings.money, currency),
        timeReclaimed: formatTimeReclaimed(savings.hoursSaved, savings.minutesSaved, hoursShort, minutesShort),
      };

      const slots: Array<{ slot: QuittingTimeSlot; hour: number }> = [
        { slot: 'morning', hour: morningHour },
        { slot: 'evening', hour: eveningHour },
      ];

      for (const { slot, hour } of slots) {
        const trigDate = new Date();
        trigDate.setDate(trigDate.getDate() + d);
        trigDate.setHours(hour, 0, 0, 0);
        if (trigDate.getTime() <= now) continue;

        const titleKey = `notif_quitting_${slot}_${kind}_title`;
        const bodyKey = `notif_quitting_${slot}_${kind}_body_${frame}`;
        // Çevirisi tamamlanmamışsa raw key gönderme.
        if (!hasTranslation(lang, titleKey) || !hasTranslation(lang, bodyKey)) continue;

        candidates.push({
          content: {
            title: t(titleKey, params),
            body: t(bodyKey, params),
            sound: true,
            categoryIdentifier: 'summary',
            data: {
              type: 'quitting_motivation',
              habitId: habit.id,
              habitTitle: habit.title,
              slot,
              kind,
              frame,
              days: futureDays,
            },
            ...(Platform.OS === 'android' ? {
              channelId: 'quitting_motivation',
              ...(habit.color ? { color: habit.color } : {}),
            } : {}),
          },
          trigger: safeTrigger(trigDate),
          sortKey: trigDate.getTime(),
        });
      }
    }
  }

  // Tarihe göre sırala ve cap'le — en yakın N bildirim seçilir, çoklu habit'te
  // doğal round-robin (gün-1'lerin hepsi → gün-2'lerin hepsi → ...) gerçekleşir.
  candidates.sort((a, b) => a.sortKey - b.sortKey);
  for (const c of candidates.slice(0, MAX_QUITTING_NOTIFS)) {
    out.push({ content: c.content, trigger: c.trigger });
  }
}

// Sabah Önizleme — ertesi gün quietEnd + 30dk'da pending habit'lerin
// listesini tek bir bildirimle özetler. settings.smartNudgeEnabled toggle'ı
// altında — yeni settings UI eklemekten kaçınmak için.
function scheduleMorningPreview(
  pendingTomorrow: HabitLike[],
  quietEnd: { hour: number; minute: number },
  lang: LanguageCode,
  t: (k: string, p?: Record<string, string | number>) => string,
  out: Array<{ content: Notifications.NotificationContentInput; trigger: Notifications.DateTriggerInput }>,
): void {
  if (pendingTomorrow.length === 0) return;
  if (!hasTranslation(lang, 'notif_morning_preview_title')) return;

  const triggerDate = new Date();
  triggerDate.setDate(triggerDate.getDate() + 1);
  // quietEnd default 07:00 → preview 07:30. Kullanıcı uyandığında günlük plan hazır.
  triggerDate.setHours(quietEnd.hour, quietEnd.minute + 30, 0, 0);

  const body = buildPendingHabitsBody(pendingTomorrow, 'preview', lang, t);

  out.push({
    content: {
      title: t('notif_morning_preview_title'),
      body,
      sound: false,
      categoryIdentifier: 'summary',
      data: { type: 'morning_preview', count: pendingTomorrow.length },
      ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
    },
    trigger: safeTrigger(triggerDate),
  });
}

// ─── Ayarları Yükle / Kaydet ─────────────────────────────
export async function loadNotificationSettings(): Promise<NotificationSettings> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    handleAsyncError('loadNotificationSettings', e);
    // Forensic backup: stash the corrupt blob so we can debug *what* got written.
    // Without this, the bad JSON is overwritten on next save and the cause is lost.
    if (raw) {
      AsyncStorage.setItem(SETTINGS_CORRUPT_BACKUP_KEY, raw).catch(() => {});
    }
  }
  return DEFAULT_SETTINGS;
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    invalidateNotificationCache();
  } catch (e) {
    handleAsyncError('saveNotificationSettings', e);
  }
}

// ─── Kanal & Kategori Kurulumu (Uygulama Başlangıcında + Dil Değişiminde) ─────────
export async function setupNotificationInfrastructure(): Promise<void> {
  if (Platform.OS === 'web') return;
  const lang = await getStoredLanguage();
  const t = createT(lang);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminder_default', {
      name: t('notif_channel_reminders'),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200],
    });
    await Notifications.setNotificationChannelAsync('streak_guardian', {
      name: t('notif_channel_guardian'),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
    await Notifications.setNotificationChannelAsync('smart_nudge', {
      name: t('notif_channel_nudge'),
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 100],
    });
    await Notifications.setNotificationChannelAsync('motivation', {
      name: t('notif_channel_motivation'),
      importance: Notifications.AndroidImportance.LOW,
    });
    // Bırakma motivasyonu — günlük ses + çift-titreşim. 'motivation' (LOW)
    // çok sessiz kaldığı için ayrı kanal; guardian (3'lü titreşim) ile
    // karışmaması için 2'li paterndir.
    await Notifications.setNotificationChannelAsync('quitting_motivation', {
      name: t('notif_channel_quitting'),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
    });
    // Pomodoro Alarm
    await Notifications.setNotificationChannelAsync('pomodoro_alarm', {
      name: t('notif_channel_pomodoro') || 'Pomodoro Alarm',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
    });
  }

  // Aksiyon butonlu kategoriler — dile göre çevrilmiş
  await Notifications.setNotificationCategoryAsync('habit_reminder', [
    { identifier: 'complete', buttonTitle: t('notif_btn_complete'), options: { opensAppToForeground: false } },
    { identifier: 'snooze', buttonTitle: t('notif_btn_snooze'), options: { opensAppToForeground: false } },
  ]);
  await Notifications.setNotificationCategoryAsync('streak_alert', [
    { identifier: 'complete', buttonTitle: t('notif_btn_complete_now'), options: { opensAppToForeground: false } },
  ]);
  await Notifications.setNotificationCategoryAsync('summary', [
    { identifier: 'open', buttonTitle: t('notif_btn_open'), options: { opensAppToForeground: true } },
  ]);
}

// ─── ANA MOTOR: Tüm Bildirimleri Planla ─────────────────────────────
async function _scheduleAllImpl(habits: HabitLike[]): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!_settingsCache) _settingsCache = await loadNotificationSettings();
  const settings = _settingsCache;
  if (!settings.enabled) return;

  // Engine-level permission preflight — UI bypass eden çağrılar (boot, dil
  // değişimi, addHabit) için izin yoksa erken çık. Aksi halde 40 ardışık
  // schedule çağrısı fail edip log'u doldurur.
  if (!(await isOsPermissionGranted())) return;

  if (!_langCache) _langCache = await getStoredLanguage();
  // getStoredLanguage başarısız olsa bile 'en' döner; null kalmamalı ama
  // hasTranslation çağrılarında defansif olalım.
  const lang: LanguageCode = _langCache ?? 'en';
  const t = createT(lang);

  if (!_currencyCache) _currencyCache = await getStoredCurrency();
  const currency = _currencyCache;

  // Engagement-aware moderasyon — kullanıcı X gündür uygulamaya girmediyse
  // bildirim sıklığını düşür. Duolingo'nun "Bu hatırlatıcılar işe yaramıyor
  // gibi" psikolojik geri çekilme tonu.
  const inactivityDays = await getInactivityDays();

  // Tüm bekleyen bildirimleri iptal et, temiz başla
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 7+ gün inaktif → tamamen sessize al. Kullanıcı uygulamayı açtığında
  // pingActivity tetiklenir → AppState reschedule normale döndürür.
  if (inactivityDays >= SILENT_MODE_THRESHOLD_DAYS) return;

  // 4-6 gün inaktif → reminder/guardian/nudge zincirini kapat. PA toggle açıksa
  // 7 gün sonrasında tek bir "veda" mesajı bırak; kapalıysa sessizce dön.
  if (inactivityDays >= PASSIVE_AGGRESSIVE_THRESHOLD_DAYS) {
    if (settings.passiveAggressiveEnabled) {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      future.setHours(10, 0, 0, 0);
      if (
        hasTranslation(lang, 'notif_passive_aggressive_title') &&
        hasTranslation(lang, 'notif_passive_aggressive_body')
      ) {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: t('notif_passive_aggressive_title'),
              body: t('notif_passive_aggressive_body'),
              sound: false,
              data: { type: 'passive_aggressive' },
              ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
            },
            trigger: safeTrigger(future),
          });
        } catch (e) {
          handleAsyncError('schedulePassiveAggressive', e);
        }
      }
    }
    return;
  }

  const now = new Date();
  const today = now.getDay();
  const todayDate = todayStr();

  const positiveHabits = habits.filter(h => h.type === 'positive');
  const activeToday = positiveHabits.filter(h => isValidOnDayOfWeek(today, h.frequency, h.customDays));
  const pendingToday = activeToday.filter(h => !h.completed);

  const quiet = parseTime(settings.quietHoursStart);
  const quietEnd = parseTime(settings.quietHoursEnd);

  const notificationsToSchedule: Array<{ content: Notifications.NotificationContentInput; trigger: Notifications.DateTriggerInput }> = [];

  // ── 1. Zamanlanmış Hatırlatıcılar ──
  for (const habit of pendingToday) {
    // Eski veride 'Yok' (TR sentinel) olabilir; yenisinde REMINDER_NONE.
    // HH:mm formatına uymayan herhangi bir değer = "kapalı".
    if (!habit.reminderTime || habit.reminderTime === 'Yok' || habit.reminderTime === REMINDER_NONE) continue;
    if (!/^\d{1,2}:\d{2}$/.test(habit.reminderTime)) continue;
    const { hour, minute } = parseTime(habit.reminderTime);
    if (isNaN(hour)) continue;

    const rDate = new Date();
    rDate.setHours(hour, minute, 0, 0);
    if (now.getTime() > rDate.getTime()) {
      rDate.setDate(rDate.getDate() + 1);
      if (!isValidOnDayOfWeek(rDate.getDay(), habit.frequency, habit.customDays)) continue;
    }

    // Tonal seçim — reminder'ın TETIKLENECEĞI saate göre bucket çıkar.
    // 09:00'a kuruluysa "morning", 21:00'a kuruluysa "night".
    // i18n key'leri eksikse legacy streak-tabanlı şablonlara düş (eski diller).
    const bucket = pickToneBucket(rDate, inactivityDays);
    const tone = pickToneKeys(bucket, rDate);

    let title: string = t('notif_reminder_title');
    let body: string;
    if (
      hasTranslation(lang, tone.titleKey) &&
      hasTranslation(lang, tone.bodyKey)
    ) {
      title = t(tone.titleKey);
      body = t(tone.bodyKey, { streak: habit.streak, title: habit.title });
    } else {
      if (habit.streak >= 7) {
        body = t('notif_reminder_long_streak', { streak: habit.streak, title: habit.title });
      } else if (habit.streak >= 1) {
        body = t('notif_reminder_streak', { streak: habit.streak, title: habit.title });
      } else {
        body = t('notif_reminder_first_step', { title: habit.title });
      }
    }

    // P3 — Rekor yakınlığı ve kimlik override: tonal body'nin üstüne deterministik
    // gün-bazlı seçimle daha güçlü çerçeveleme yaz. Günün sayısına bağlı olduğu için
    // aynı kullanıcı aynı gün aynı mesajı görür (bildirim listesinde tutarlı).
    const overrideBestStreak = habit.bestStreak ?? 0;
    if (overrideBestStreak > 0 && habit.streak === overrideBestStreak) {
      // Bugün rekorunu eşitliyor — yarın yeni rekor. Güçlü çerçeveleme.
      if (hasTranslation(lang, 'notif_reminder_record_body_tie')) {
        body = t('notif_reminder_record_body_tie', { title: habit.title, streak: habit.streak });
      }
    } else if (overrideBestStreak > 0 && habit.streak === overrideBestStreak - 1) {
      // Rekoruna 1 gün kaldı.
      if (hasTranslation(lang, 'notif_reminder_record_body_close')) {
        body = t('notif_reminder_record_body_close', { title: habit.title });
      }
    } else if (habit.streak >= 21) {
      // Uzun seri: 1/7 olasılıkla kimlik mesajı (day-of-year mod 7 === 0).
      const dayOfYear = Math.floor(
        (rDate.getTime() - new Date(rDate.getFullYear(), 0, 0).getTime()) / 86400000
      );
      if (dayOfYear % 7 === 0 && hasTranslation(lang, 'notif_reminder_identity_body')) {
        body = t('notif_reminder_identity_body', { title: habit.title });
      }
    }

    notificationsToSchedule.push({
      content: {
        title,
        body,
        sound: true,
        categoryIdentifier: 'habit_reminder',
        data: { habitId: habit.id, habitTitle: habit.title, type: 'reminder', tone: bucket },
        ...(Platform.OS === 'android' ? {
          channelId: 'reminder_default',
          ...(habit.color ? { color: habit.color } : {}),
        } : {}),
      },
      trigger: safeTrigger(rDate),
    });
  }

  // ── 2. Seri Koruyucu ──
  if (settings.streakGuardianEnabled) {
    const atRiskHabits = pendingToday
      .filter(h => h.streak >= 3)
      .sort((a, b) => riskScore(b.streak) - riskScore(a.streak));

    if (atRiskHabits.length > 0) {
      const topRisk = atRiskHabits[0];
      const guardTime = new Date();
      guardTime.setHours(quiet.hour, quiet.minute, 0, 0);
      guardTime.setTime(guardTime.getTime() - 30 * 60 * 1000);
      // Quiet-hours boundary (e.g. 00:30 → guardTime would land in the past at
      // 00:00 → push to tomorrow's slot so the guardian still fires).
      if (guardTime.getTime() <= now.getTime()) {
        guardTime.setDate(guardTime.getDate() + 1);
      }

      if (now.getTime() < guardTime.getTime()) {
        let urgency: string;
        if (topRisk.streak >= 30) urgency = t('notif_guardian_legendary');
        else if (topRisk.streak >= 7) urgency = t('notif_guardian_long_risk');
        else urgency = t('notif_guardian_break');

        notificationsToSchedule.push({
          content: {
            title: t('notif_guardian_title'),
            body: t('notif_guardian_body', { urgency, title: topRisk.title, streak: topRisk.streak }),
            sound: true,
            categoryIdentifier: 'streak_alert',
            data: { habitId: topRisk.id, habitTitle: topRisk.title, type: 'streak_guardian' },
            ...(Platform.OS === 'android' ? { channelId: 'streak_guardian' } : {}),
          },
          trigger: safeTrigger(guardTime),
        });
      }
    }
  }

  // ── 3. Akıllı Dürtme ──
  if (settings.smartNudgeEnabled && pendingToday.length >= 2) {
    const nudgeTime = new Date();
    // (quiet.hour - 1) wraps to -1 when quiet.hour=0; setHours handles that as
    // "yesterday at 23:xx" via Date math. Normalise by computing safely:
    const nudgeHour = (quiet.hour - 1 + 24) % 24;
    nudgeTime.setHours(nudgeHour, quiet.minute, 0, 0);
    // If we wrapped past midnight (quiet.hour was 0), the slot is "today 23:xx"
    // which is later than expected. Either way, push to tomorrow if already past.
    if (nudgeTime.getTime() <= now.getTime()) {
      nudgeTime.setDate(nudgeTime.getDate() + 1);
    }

    if (now.getTime() < nudgeTime.getTime()) {
      const hasStreakAlertSoon = pendingToday.some(h => h.streak >= 3);
      if (!hasStreakAlertSoon || pendingToday.length > 1) {
        // Body artık spesifik habit isimlerini içerir; eski count-only şablon
        // çevirisi olmayan dillerde fallback olarak kalır (buildPendingHabitsBody
        // notif_nudge_body'ye düşer).
        notificationsToSchedule.push({
          content: {
            title: t('notif_nudge_title'),
            body: buildPendingHabitsBody(pendingToday, 'nudge', lang, t),
            sound: false,
            categoryIdentifier: 'summary',
            data: { type: 'smart_nudge', count: pendingToday.length },
            ...(Platform.OS === 'android' ? { channelId: 'smart_nudge' } : {}),
          },
          trigger: safeTrigger(nudgeTime),
        });
      }
    }
  }

  // ── 4. Haftalık Motivasyon ──
  if (settings.weeklyPulseEnabled) {
    // Pazar = 0. (7 - today) % 7 → bugün Pazar ise 0, pazartesi 6, ..., cumartesi 1.
    // Pazar günleyse "bugün değil, gelecek pazar" yapmak için 0 → 7'ye çevir.
    const daysUntilSunday = (7 - today) % 7;
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    nextSunday.setHours(quietEnd.hour + 1, 0, 0, 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return dateToStr(d);
    });

    let totalDone = 0;
    let totalPossible = 0;
    for (const habit of positiveHabits) {
      for (const day of last7Days) {
        const dayOfWeek = parseLocalDate(day).getDay();
        if (isValidOnDayOfWeek(dayOfWeek, habit.frequency, habit.customDays)) {
          totalPossible++;
          if (habit.history?.[day]) totalDone++;
        }
      }
    }
    const pct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    let weeklyBody: string;
    if (pct >= 80) weeklyBody = t('notif_weekly_great', { pct });
    else if (pct < 30) weeklyBody = t('notif_weekly_hard');
    else weeklyBody = t('notif_weekly_normal', { done: totalDone });

    notificationsToSchedule.push({
      content: {
        title: t('notif_weekly_title'),
        body: weeklyBody,
        sound: false,
        categoryIdentifier: 'summary',
        data: { type: 'weekly_pulse' },
        ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
      },
      trigger: safeTrigger(nextSunday),
    });
  }

  // ── 5. Bırakma Milestone Bildirimleri ──
  const negativeHabits = habits.filter(h => h.type === 'negative');
  if (settings.milestonesEnabled) {
  const milestonesDays = [1, 3, 7, 14, 30, 90];

  for (const habit of negativeHabits) {
    const startDate = new Date(habit.startDate);
    const daysSince = getDaysSince(habit.startDate);

    for (const milestone of milestonesDays) {
      if (daysSince < milestone) {
        const milestoneDate = new Date(startDate);
        milestoneDate.setDate(milestoneDate.getDate() + milestone);
        milestoneDate.setHours(10, 0, 0, 0);

        if (milestoneDate.getTime() > now.getTime()) {
          const titleKey = `notif_milestone_${milestone}_title`;
          const bodyKey = `notif_milestone_${milestone}_body`;
          // Skip rather than ship a raw "notif_milestone_X_title" string to the user.
          if (!hasTranslation(lang, titleKey) || !hasTranslation(lang, bodyKey)) {
            break;
          }
          notificationsToSchedule.push({
            content: {
              title: t(titleKey),
              body: `${habit.title} — ${t(bodyKey)}`,
              sound: true,
              categoryIdentifier: 'summary',
              data: { habitId: habit.id, type: 'milestone', milestone },
              ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
            },
            trigger: safeTrigger(milestoneDate),
          });
        }
        break;
      }
    }
  }
  } // end milestonesEnabled

  // ── 6. Bırakma Günlük Motivasyon (Sabah + Akşam) ──
  // milestonesEnabled toggle'ı altında — extra settings UI gerektirmesin.
  if (settings.milestonesEnabled && negativeHabits.length > 0) {
    scheduleQuittingDailyMotivation(
      negativeHabits,
      quiet,
      quietEnd,
      currency,
      lang,
      t,
      notificationsToSchedule,
    );
  }

  // ── 7. Sabah Önizleme ──
  // smartNudgeEnabled toggle'ı altında.
  if (settings.smartNudgeEnabled) {
    const tomorrow = (today + 1) % 7;
    const pendingTomorrow = positiveHabits.filter(h =>
      isValidOnDayOfWeek(tomorrow, h.frequency, h.customDays)
    );
    scheduleMorningPreview(pendingTomorrow, quietEnd, lang, t, notificationsToSchedule);
  }

  // ── 8. Bildirimleri Sınırla ──
  notificationsToSchedule.sort((a, b) => {
    const dateA = a.trigger.date instanceof Date ? a.trigger.date.getTime() : 0;
    const dateB = b.trigger.date instanceof Date ? b.trigger.date.getTime() : 0;
    return dateA - dateB;
  });

  const limitedNotifications = notificationsToSchedule.slice(0, 40);

  // Aggregate scheduling errors: log first 3 in detail, then a summary count.
  // Without this, a partial failure (e.g. 38/40 succeed) leaves no actionable trace.
  let failureCount = 0;
  for (const notif of limitedNotifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: notif.content,
        trigger: notif.trigger,
      });
    } catch (e) {
      failureCount++;
      if (failureCount <= 3) handleAsyncError('scheduleNotification', e);
    }
  }
  if (failureCount > 3) {
    console.warn(`[NotificationEngine] ${failureCount - 3} additional schedule failures suppressed`);
  }
}

// Public entry — paralel çağrıları (toggle + dil değişimi + AppState reschedule)
// mutex altında seri hale getirir. Race-fix.
export async function scheduleAllNotifications(habits: HabitLike[]): Promise<void> {
  return withScheduleLock(() => _scheduleAllImpl(habits));
}

// ─── Başarım Kazanıldı Bildirimi ─────────────────────────────
export async function sendAchievementNotification(achievementId: string, xpReward: number): Promise<void> {
  const settings = await loadNotificationSettings();
  if (!settings.enabled || !settings.achievementsEnabled) return;
  const lang = await getStoredLanguage();
  const t = createT(lang);
  const titleKey = `ach_${achievementId}_title`;
  // If the achievement has no translation, skip rather than push a raw key to the user.
  if (!hasTranslation(lang, titleKey)) return;
  const achievementTitle = t(titleKey);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notif_achievement_title'),
        body: t('notif_achievement_body', { title: achievementTitle, xp: xpReward }),
        sound: true,
        categoryIdentifier: 'summary',
        data: { type: 'achievement' },
        ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
      },
      trigger: safeTrigger(new Date(Date.now() + 1500)),
    });
  } catch (e) {
    handleAsyncError('sendAchievementNotification', e);
  }
}

// ─── Günlük Tamamlama Bonusu Bildirimi ─────────────────────────────
export async function sendDailyBonusNotification(): Promise<void> {
  const settings = await loadNotificationSettings();
  if (!settings.enabled || !settings.achievementsEnabled) return;
  const lang = await getStoredLanguage();
  const t = createT(lang);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notif_daily_bonus_title'),
        body: t('notif_daily_bonus_body'),
        sound: true,
        categoryIdentifier: 'summary',
        data: { type: 'daily_bonus' },
        ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
      },
      trigger: safeTrigger(new Date(Date.now() + 2500)),
    });
  } catch (e) {
    handleAsyncError('sendDailyBonusNotification', e);
  }
}

// ─── Ertele (30dk sonra yeniden bildirim) ─────────────────────────────
export async function snoozeHabitNotification(habitId: string, habitTitle: string): Promise<void> {
  const lang = await getStoredLanguage();
  const t = createT(lang);
  const snoozeDate = new Date(Date.now() + 30 * 60 * 1000);
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notif_snooze_title'),
        body: t('notif_snooze_body', { title: habitTitle }),
        sound: true,
        categoryIdentifier: 'habit_reminder',
        data: { habitId, habitTitle, type: 'snooze_reminder' },
        ...(Platform.OS === 'android' ? { channelId: 'reminder_default' } : {}),
      },
      trigger: safeTrigger(snoozeDate),
    });
  } catch (e) {
    handleAsyncError('snoozeHabitNotification', e);
  }
}

// ─── Pomodoro Timer Alarm ─────────────────────────────
const POMODORO_NOTIFICATION_ID = 'pomodoro_alarm_notif';

export async function schedulePomodoroAlarm(mode: 'work' | 'break', endTimeMs: number): Promise<void> {
  const lang = await getStoredLanguage();
  const t = createT(lang);
  
  const title = mode === 'work' ? t('pomodoro_work_finished') : t('pomodoro_break_finished');
  const body = mode === 'work' ? t('pomodoro_work_finished_body') : t('pomodoro_break_finished_body');

  try {
    // Start notification - just informational
    await Notifications.scheduleNotificationAsync({
      identifier: 'pomodoro_started_notif',
      content: {
        title: t('pomodoro_started'),
        body: t('pomodoro_started_body', { time: new Date(endTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }),
        sound: false,
        categoryIdentifier: 'summary',
        data: { type: 'pomodoro_start' },
        ...(Platform.OS === 'android' ? { channelId: 'motivation' } : {}),
      },
      trigger: null, // trigger immediately
    });

    // End notification - alarm
    await Notifications.scheduleNotificationAsync({
      identifier: POMODORO_NOTIFICATION_ID,
      content: {
        title: title,
        body: body,
        sound: true,
        categoryIdentifier: 'summary',
        data: { type: 'pomodoro_end', mode },
        ...(Platform.OS === 'android' ? { channelId: 'pomodoro_alarm' } : {}),
      },
      trigger: safeTrigger(new Date(endTimeMs)),
    });
  } catch (e) {
    handleAsyncError('schedulePomodoroAlarm', e);
  }
}

export async function cancelPomodoroAlarm(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(POMODORO_NOTIFICATION_ID);
    await Notifications.cancelScheduledNotificationAsync('pomodoro_started_notif');
  } catch (e) {
    handleAsyncError('cancelPomodoroAlarm', e);
  }
}
