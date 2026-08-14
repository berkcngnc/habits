import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import React, { createContext, ReactNode, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import { safeHaptics } from '../utils/haptics';
import { setupNotificationInfrastructure, scheduleAllNotifications, invalidateNotificationCache } from '../engine/NotificationEngine';
import { pingActivity } from '../engine/EngagementTracker';
import { getTodayStr, getDaysSince } from '../utils/dateUtils';
import { handleAsyncError } from '../utils/errorHandler';
import { checkTimeAnomaly, saveCurrentTimeState } from '../utils/TimeGuard';
import { useLanguage } from './LanguageContext';
import { calculateLevel, calculateStreak, normalizeHistoryKeys, applyStreakFreezes } from './habitCalculations';
import { useCurrencyPref } from '../hooks/useCurrencyPref';
import { useNotificationResponses } from '../hooks/useNotificationResponses';
import { useAppStateSync } from '../hooks/useAppStateSync';
import { useAchievementsEngine } from '../hooks/useAchievementsEngine';
import { useDailyBonus } from '../hooks/useDailyBonus';
import { buildContext, evaluateAchievements } from '../constants/achievements';
import { syncWidget } from '../widget/widgetSync';
import { buildWidgetSnapshot } from '../widget/snapshot';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type HabitType = 'positive' | 'negative';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface RelapseEntry {
  date: string;
  trigger: string;
}

export interface Habit {
  id: string;
  title: string;
  type?: HabitType; // varsayılan 'positive'
  completed: boolean;
  streak: number;
  startDate: number;
  lastCompletedDate?: string;
  icon?: string;
  color?: string;
  frequency: HabitFrequency;
  customDays?: number[];
  reminderTime?: string;
  history: Record<string, boolean>;
  // Quitting (negative) specific fields
  costPerDay?: number;
  timePerDay?: number; // minutes
  relapseHistory?: RelapseEntry[];
  bestCleanStreak?: number; // days
}

interface UserStats {
  xp: number;
  level: number;
  bestStreak: number;
  totalCompleted: number;
  habitium: number;
  inventory: string[];
  equipped: Record<string, string>;
  personality: string | null;
  pomodoroDailySeconds?: Record<string, number>;
}

export type AchievementRarity = 'easy' | 'hard' | 'legendary' | 'epic';

export interface Achievement {
  id: string;
  icon: string;
  unlocked: boolean;
  color: string;
  rarity: AchievementRarity;
  xpReward: number;
}

export type MotivationState = 'perfect' | 'pending' | 'recovering';

export const MAX_STREAK_FREEZES = 3;

export interface FreezeFeedback {
  habitId: string;
  habitTitle: string;
  daysSaved: number;
  timestamp: number;
}

interface HabitsContextProps {
  habits: Habit[];
  stats: UserStats;
  isLoaded: boolean;
  achievements: Achievement[];
  motivationState: MotivationState;
  currency: string;
  setCurrency: (c: string) => Promise<void>;
  addHabit: (title: string, type: HabitType, icon?: string, color?: string, frequency?: HabitFrequency, reminderTime?: string, customDays?: number[], costPerDay?: number, timePerDay?: number) => void;
  toggleHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  resetNegativeHabit: (id: string, trigger?: string) => void;
  resetAllData: () => Promise<void>;
  reorderHabits: (newOrder: Habit[]) => void;
  recordRelapse: (habitId: string, dateStr: string) => void;
  streakFreezes: number;
  maxStreakFreezes: number;
  addStreakFreeze: () => boolean;
  freezeFeedback: FreezeFeedback | null;
  clearFreezeFeedback: () => void;
  setPersonality: (p: string) => void;
  buyItem: (itemId: string, cost: number) => boolean;
  equipItem: (category: string, itemId: string) => void;
  addPomodoroTime: (seconds: number) => void;
}

const STORAGE_KEY = '@habits_v3';
const STATS_KEY = '@stats_v3';
const ACHIEVEMENTS_KEY = '@achievements_awarded_v1';
const DAILY_BONUS_KEY = '@daily_bonus_v1';
const STREAK_FREEZES_KEY = '@streak_freezes_v1';

const HabitsContext = createContext<HabitsContextProps | undefined>(undefined);

export function HabitsProvider({ children }: { children: ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<UserStats>({
    xp: 0,
    level: 1,
    bestStreak: 0,
    totalCompleted: 0,
    habitium: 0,
    inventory: ['default_body', 'default_background'],
    equipped: { body: 'default_body', background: 'default_background' },
    personality: null,
    pomodoroDailySeconds: {}
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasRecovered, setHasRecovered] = useState(false); // "Pes etmek yok" motivation
  const [streakFreezes, setStreakFreezes] = useState<number>(0);
  const [freezeFeedback, setFreezeFeedback] = useState<FreezeFeedback | null>(null);

  const { currency, setCurrency } = useCurrencyPref();
  const { language, t } = useLanguage();

  // ─── TimeGuard (anti time-travel) ──────────────────────────────────
  const cheatLockRef = useRef(false);
  const alertingRef = useRef(false);
  const triggerCheatAlert = useCallback(() => {
    if (alertingRef.current) return;
    alertingRef.current = true;
    Alert.alert(
      t('timeguard_title'),
      t('timeguard_msg'),
      [{ text: 'OK', onPress: () => { alertingRef.current = false; } }],
      { onDismiss: () => { alertingRef.current = false; } },
    );
  }, [t]);

  /** Returns true if the action should proceed (no anomaly). */
  const passTimeGuard = useCallback(async (): Promise<boolean> => {
    if (cheatLockRef.current) {
      triggerCheatAlert();
      return false;
    }
    const anomaly = await checkTimeAnomaly();
    if (anomaly) {
      cheatLockRef.current = true;
      triggerCheatAlert();
      return false;
    }
    return true;
  }, [triggerCheatAlert]);

  // Bildirim altyapısı (kanallar + kategoriler) — 1 kez
  useEffect(() => {
    setupNotificationInfrastructure();
    // İlk açılış engagement ping — uygulamanın "uyandığını" işaretler ki
    // pasif-agresif eşiği bugünden itibaren sayılsın. AppState 'active'
    // tetiklenmeyebilir (cold start), bu nedenle burada da çağırıyoruz.
    pingActivity().catch(e => handleAsyncError('init pingActivity', e));
  }, []);

  // habits/stats'in en güncel halini effect/listener'lar için tutan ref'ler.
  // flushSave gibi senkron yollarda iki ref birlikte okunduğu için tek effect'te
  // güncellenirler — split olduğunda bir render arası inconsistent state riski vardı.
  const habitsRef = useRef<Habit[]>([]);
  const statsRef = useRef<UserStats>(stats);
  useEffect(() => {
    habitsRef.current = habits;
    statsRef.current = stats;
  }, [habits, stats]);

  // Debounced save handle — exposed via ref so background flush can cancel + run immediately.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // In-flight guard: prevents rapid spam from queueing duplicate toggle/relapse mutations
  // before React commits the previous state. Cleared shortly after each call resolves.
  const inFlightRef = useRef<Set<string>>(new Set());

  // t is an inline function (recreates every render); capture via ref so the
  // widget sync effect can read the latest version without adding it to deps.
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });

  // Dil değiştiğinde bildirimleri yeni dile göre tekrar planla
  useEffect(() => {
    if (isLoaded) {
      invalidateNotificationCache();
      scheduleAllNotifications(habitsRef.current).catch(e => 
        handleAsyncError('languageChange reschedule', e)
      );
    }
  }, [language, isLoaded]);

  // Achievement & daily bonus persistence ref'leri — loadData bunları hidrate eder.
  // Hesaplanan achievements değeri bu noktada henüz yok; aşağıda useAchievementsEngine'i
  // tekrar değil, bu ref'lere bağlı bir effect ile birleştiriyoruz.
  const awardedAchIdsRef = useRef<Set<string>>(new Set());
  const dailyBonusDateRef = useRef('');

  // AsyncStorage Save — 400ms debounce. Tracked via ref so flushSave() can cancel + run immediately.
  useEffect(() => {
    if (!isLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      saveData(habits, stats);
    }, 400);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [habits, stats, isLoaded]);

  // Synchronously cancel any pending debounce and persist the *latest* state.
  // Called when the app is backgrounded — without this, a toggle made <400ms before
  // backgrounding would be lost.
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveData(habitsRef.current, statsRef.current);
  }, []);

  // Persist streakFreezes whenever it changes (post-load)
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STREAK_FREEZES_KEY, String(streakFreezes)).catch(e =>
      handleAsyncError('saveStreakFreezes', e)
    );
  }, [streakFreezes, isLoaded]);

  const loadData = useCallback(async () => {
    try {
      const habitsJSON = await AsyncStorage.getItem(STORAGE_KEY);
      const statsJSON = await AsyncStorage.getItem(STATS_KEY);

      const [awardsRaw, bonusDate, freezesRaw] = await Promise.all([
        AsyncStorage.getItem(ACHIEVEMENTS_KEY),
        AsyncStorage.getItem(DAILY_BONUS_KEY),
        AsyncStorage.getItem(STREAK_FREEZES_KEY),
      ]);
      if (awardsRaw) {
        // Isolated try/catch: a corrupted achievements blob must NOT abort the
        // whole loadData (which would leave habits hidden from the user).
        try {
          const ids = JSON.parse(awardsRaw);
          if (Array.isArray(ids)) {
            awardedAchIdsRef.current = new Set(ids.filter((x): x is string => typeof x === 'string'));
          }
        } catch (e) {
          handleAsyncError('loadData awards parse', e);
          awardedAchIdsRef.current = new Set();
        }
      }
      if (bonusDate) {
        dailyBonusDateRef.current = bonusDate;
      }

      let availableFreezes = 0;
      if (freezesRaw) {
        const parsed = parseInt(freezesRaw, 10);
        if (Number.isFinite(parsed) && parsed >= 0) {
          availableFreezes = Math.min(parsed, MAX_STREAK_FREEZES);
        }
      }

      const today = getTodayStr();

      if (habitsJSON) {
        let loadedHabits: Habit[] = (() => { try { return JSON.parse(habitsJSON); } catch { return []; } })();
        // Collect freeze feedback for ALL habits — was previously overwritten so only
        // the last habit was reported when multiple were saved at once.
        const allFeedback: FreezeFeedback[] = [];

        let streakBreaksCount = 0;
        loadedHabits = loadedHabits.map(h => {
          if (!h.startDate || isNaN(h.startDate)) h.startDate = Date.now();
          if (!h.frequency) h.frequency = 'daily';
          if (!h.type) h.type = 'positive';

          // history null/undefined/non-object olabilir (bozuk veri). Defansif normalize.
          if (!h.history || typeof h.history !== 'object' || Array.isArray(h.history)) {
            h.history = {};
            if (h.lastCompletedDate) h.history[h.lastCompletedDate] = true;
          }

          h.history = normalizeHistoryKeys(h.history);

          if (h.type === 'positive') {
            const beforeStreak = h.streak ?? 0;
            // Auto-freeze: if streak would reset due to missed valid days,
            // consume freezes (1 per missed day) to patch the gap.
            const freezeResult = applyStreakFreezes(
              h.history,
              h.frequency,
              h.customDays,
              availableFreezes
            );
            if (freezeResult.used > 0) {
              h.history = freezeResult.history;
              availableFreezes -= freezeResult.used;
              allFeedback.push({
                habitId: h.id,
                habitTitle: h.title,
                daysSaved: freezeResult.used,
                timestamp: Date.now(),
              });
            }

            const actualStreak = calculateStreak(h.history, h.frequency, h.customDays);
            if (beforeStreak > 0 && actualStreak === 0) {
              streakBreaksCount++;
            }
            const isCompletedToday = !!h.history[today];
            return { ...h, completed: isCompletedToday, streak: actualStreak };
          }
          return h;
        });

        setHabits(loadedHabits);
        setStreakFreezes(availableFreezes);
        if (streakBreaksCount > 0) {
          setStats(prev => {
            const currentHabitium = prev.habitium ?? 0;
            const newHabitium = Math.max(0, currentHabitium - streakBreaksCount);
            return { ...prev, habitium: newHabitium };
          });
        }
        // Aggregate multi-habit freeze feedback into a single banner so no habit
        // is silently dropped. Single-habit case stays identical to prior behaviour.
        if (allFeedback.length === 1) {
          setFreezeFeedback(allFeedback[0]);
        } else if (allFeedback.length > 1) {
          setFreezeFeedback({
            habitId: allFeedback[0].habitId,
            habitTitle: allFeedback.map(f => f.habitTitle).join(', '),
            daysSaved: allFeedback.reduce((sum, f) => sum + f.daysSaved, 0),
            timestamp: Date.now(),
          });
        }
        await scheduleAllNotifications(loadedHabits);
      } else {
        setStreakFreezes(availableFreezes);
      }
      if (statsJSON) {
        try {
          const parsed = JSON.parse(statsJSON);
          setStats({
            xp: parsed.xp ?? 0,
            level: parsed.level ?? 1,
            bestStreak: parsed.bestStreak ?? 0,
            totalCompleted: parsed.totalCompleted ?? 0,
            habitium: parsed.habitium ?? 0,
            inventory: parsed.inventory ?? ['default_body', 'default_background'],
            equipped: parsed.equipped ?? { body: 'default_body', background: 'default_background' },
            personality: parsed.personality ?? null,
            pomodoroDailySeconds: parsed.pomodoroDailySeconds ?? {}
          });
        } catch (e) {
          handleAsyncError('loadData stats parse', e);
        }
      }
    } catch (error) {
      handleAsyncError('loadData', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = async (hList: Habit[], st: UserStats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hList));
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(st));
    } catch (error) {
      handleAsyncError('saveData', error);
    }
  };

  // newStreak = toggle SONRASI streak. Negatif değer veya NaN korumalı.
  const updateStatsForCheck = useCallback((add: boolean, newStreak: number) => {
    const safeStreak = Number.isFinite(newStreak) ? Math.max(0, newStreak) : 0;
    setStats(prev => {
      const newXp = Math.max(0, prev.xp + (add ? 20 : -20));
      const newTotal = Math.max(0, prev.totalCompleted + (add ? 1 : -1));
      const habitiumEarned = add ? 2 : -2;
      const newHabitium = Math.max(0, (prev.habitium ?? 0) + habitiumEarned);
      return {
        ...prev,
        xp: newXp,
        level: calculateLevel(newXp),
        totalCompleted: newTotal,
        bestStreak: Math.max(prev.bestStreak, safeStreak),
        habitium: newHabitium,
      };
    });
  }, []);

  const addHabit = useCallback((title: string, type: HabitType, icon?: string, color?: string, frequency?: HabitFrequency, reminderTime?: string, customDays?: number[], costPerDay?: number, timePerDay?: number) => {
    if (!title.trim()) return;
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    const safeFrequency = frequency || 'daily';
    const safeCustomDays = safeFrequency === 'custom'
      ? (customDays ?? []).filter(d => d >= 0 && d <= 6)
      : undefined;
    const newHabit: Habit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: title.trim(),
      type,
      completed: false,
      streak: 0,
      startDate: Date.now(),
      icon,
      color,
      frequency: safeFrequency,
      customDays: safeCustomDays,
      reminderTime,
      history: {},
      ...(type === 'negative' ? {
        costPerDay: costPerDay || 0,
        timePerDay: timePerDay || 0,
        relapseHistory: [],
        bestCleanStreak: 0,
      } : {}),
    };
    setHabits(prev => {
      const updated = [...prev, newHabit];
      scheduleAllNotifications(updated).catch(e => handleAsyncError('addHabit reschedule', e));
      return updated;
    });
  }, []);

  const toggleHabit = useCallback(async (id: string) => {
    const guardKey = `toggle:${id}`;
    if (inFlightRef.current.has(guardKey)) return;
    inFlightRef.current.add(guardKey);
    try {
      if (!(await passTimeGuard())) return;
      const today = getTodayStr();

      // Pre-compute target state from the latest committed snapshot (habitsRef).
      // updater'ın içinden setStats çağırmak StrictMode/concurrent altında çift
      // güncellemeye yol açıyordu — şimdi tek bir tetikleme ile commit ediyoruz.
      const target = habitsRef.current.find(h => h.id === id);
      if (!target || target.type !== 'positive') return;

      const isNowCompleted = !target.completed;
      const newHistory = { ...target.history };
      if (isNowCompleted) newHistory[today] = true;
      else delete newHistory[today];
      const newStreak = calculateStreak(newHistory, target.frequency, target.customDays);

      if (isNowCompleted) {
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      } else {
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
      }

      setHabits(prev => prev.map(h => h.id === id && h.type === 'positive' ? {
        ...h,
        completed: isNowCompleted,
        streak: newStreak,
        lastCompletedDate: isNowCompleted ? today : undefined,
        history: newHistory,
      } : h));

      // Stats: bestStreak yeni streak'e bakmalı (önceki + tahmini değil).
      updateStatsForCheck(isNowCompleted, newStreak);

      // Reschedule — guardian/nudge kuyruğunu yeni tamamlama durumuna göre
      // yeniden hesapla. Eski streak için zamanlanmış uyarılar boşa düşmesin.
      scheduleAllNotifications(habitsRef.current.map(h => h.id === id ? {
        ...h, completed: isNowCompleted, streak: newStreak, history: newHistory,
      } as typeof h : h)).catch(e => handleAsyncError('toggleHabit reschedule', e));
    } finally {
      setTimeout(() => inFlightRef.current.delete(guardKey), 250);
    }
  }, [updateStatsForCheck, passTimeGuard]);

  const deleteHabit = useCallback((id: string) => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    setHabits(prev => prev.filter(h => h.id !== id));
  }, []);

  const resetNegativeHabit = useCallback(async (id: string, trigger?: string) => {
    const guardKey = `relapse:${id}`;
    if (inFlightRef.current.has(guardKey)) return;
    inFlightRef.current.add(guardKey);
    try {
      if (!(await passTimeGuard())) return;
      safeHaptics.notification(Haptics.NotificationFeedbackType.Error);
      setHasRecovered(true);

      const todayKey = getTodayStr();

      setHabits(prev => prev.map(h => {
        if (h.id === id && h.type === 'negative') {
          const currentCleanDays = getDaysSince(h.startDate);
          const prevBest = h.bestCleanStreak || 0;
          const newRelapseEntry = { date: todayKey, trigger: trigger || 'other' };
          return {
            ...h,
            startDate: Date.now(),
            bestCleanStreak: Math.max(prevBest, currentCleanDays),
            relapseHistory: [...(h.relapseHistory || []), newRelapseEntry],
          };
        }
        return h;
      }));

      setStats(prev => {
        let newXp = prev.xp - 50;
        if (newXp < 0) newXp = 0;
        return { ...prev, xp: newXp, level: calculateLevel(newXp) };
      });
    } finally {
      // Longer cooldown — relapse is destructive and should require a deliberate second tap.
      setTimeout(() => inFlightRef.current.delete(guardKey), 600);
    }
  }, [passTimeGuard]);

  const recordRelapse = useCallback((habitId: string, dateStr: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id === habitId && h.type === 'negative') {
        const history = Array.isArray(h.relapseHistory) ? h.relapseHistory : [];
        return {
          ...h,
          relapseHistory: [...history, { date: dateStr, trigger: 'other' }],
        };
      }
      return h;
    }));
  }, []);

  const resetAllData = useCallback(async () => {
    safeHaptics.notification(Haptics.NotificationFeedbackType.Warning);

    // 1) Bekleyen debounced save'i iptal et — yoksa 400 ms içinde clear()
    //    sonrası eski state geri yazılabilir.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    // 2) In-memory ref'leri sıfırla — bunlar AsyncStorage.clear()'dan etkilenmez
    //    ve achievements memo'su `awardedAchIdsRef.current.has(id)` → unlocked:true
    //    skip path'i nedeniyle başarımları "geri" gösteriyordu.
    awardedAchIdsRef.current = new Set();
    dailyBonusDateRef.current = '';
    cheatLockRef.current = false;
    inFlightRef.current.clear();

    // 3) Persist'i temizle (state setter'larından önce — debounced save tekrar
    //    yazmadan AsyncStorage'ı boşaltırız).
    try {
      await AsyncStorage.clear();
      await Notifications.cancelAllScheduledNotificationsAsync();
      invalidateNotificationCache();
    } catch (e) { handleAsyncError('resetAllData', e); }

    // 4) State'i sıfırla — bu re-render tetikleyince achievements memo'su artık
    //    boş habits + boş awarded set ile her şeyi unlocked:false hesaplar.
    setHabits([]);
    setStats({
      xp: 0,
      level: 1,
      bestStreak: 0,
      totalCompleted: 0,
      habitium: 0,
      inventory: ['default_body', 'default_background'],
      equipped: { body: 'default_body', background: 'default_background' },
      personality: null,
      pomodoroDailySeconds: {}
    });
    setStreakFreezes(0);
    setFreezeFeedback(null);
    setHasRecovered(false);
  }, []);

  const reorderHabits = useCallback((newOrder: Habit[]) => {
    setHabits(newOrder);
  }, []);

  const addStreakFreeze = useCallback((): boolean => {
    let granted = false;
    setStreakFreezes(prev => {
      if (prev >= MAX_STREAK_FREEZES) return prev;
      granted = true;
      return prev + 1;
    });
    if (granted) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    }
    return granted;
  }, []);

  const clearFreezeFeedback = useCallback(() => setFreezeFeedback(null), []);

  // Dinamik Motivasyon State
  const motivationState = useMemo<MotivationState>(() => {
    if (hasRecovered) return 'recovering';
    const positiveHabits = habits.filter(h => h.type === 'positive');
    if (positiveHabits.length > 0 && positiveHabits.every(h => h.completed)) return 'perfect';
    return 'pending';
  }, [habits, hasRecovered]);

  // ─── Başarılar Motoru ───────────────────────────────────────────────
  // Optimizasyon:
  //  1) Ağır işler (perfectStreak taraması, totalSaved, vb.) tek bir
  //     `buildContext()` ile habits/stats başına ÜRETILDIĞINDE bir kez
  //     hesaplanır — başarım başına değil.
  //  2) Halihazırda kazanılmış başarımlar (awardedAchIdsRef.current)
  //     predicate'i atlayarak doğrudan unlocked=true döner; bu sayede
  //     kullanıcı ilerledikçe yapılan iş azalır, artmaz.
  //  3) `awardedAchIdsRef` bir ref olduğu için useMemo onun değişikliğini
  //     izleyemez; ancak engine bir başarımı işaretledikten sonra zaten
  //     stats.xp güncellenir → useMemo bir sonraki render'da yeniden
  //     hesaplanır ve skip mantığı devreye girer.
  const achievements = useMemo<Achievement[]>(() => {
    const ctx = buildContext(habits, stats);
    const evaluated = evaluateAchievements(ctx, awardedAchIdsRef.current);
    return evaluated.map(({ id, unlocked, def }) => ({
      id,
      icon: def.icon,
      color: def.color,
      rarity: def.rarity,
      xpReward: def.xpReward,
      unlocked,
    }));
  }, [habits, stats]);

  // Widget snapshot sync — 600ms debounce, Android only.
  // Placed after the achievements useMemo so all computed values are available.
  // Fires after saveData's 400ms window so AsyncStorage is already up-to-date.
  useEffect(() => {
    if (!isLoaded || Platform.OS !== 'android') return;
    const timer = setTimeout(() => {
      const snapshot = buildWidgetSnapshot({
        habits,
        stats,
        achievements,
        currency,
        language,
        t: tRef.current,
      });
      syncWidget(snapshot).catch(e => handleAsyncError('syncWidget', e));
    }, 600);
    return () => clearTimeout(timer);
  }, [habits, stats, achievements, currency, language, isLoaded]);

  // ─── Background save flush ──────────────────────────────────────────
  // Without this, a toggle/relapse made within the 400 ms debounce window
  // would never reach AsyncStorage if the app were backgrounded in between.
  // Defense in depth: also gate the listener body on isLoadedRef, since the
  // outer effect's `if (!isLoaded) return;` only prevents *registration* —
  // belt-and-suspenders against any future refactor that defers it.
  const isLoadedRef = useRef(false);
  useEffect(() => { isLoadedRef.current = isLoaded; }, [isLoaded]);
  useEffect(() => {
    if (!isLoaded) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (!isLoadedRef.current) return;
      if (state === 'background' || state === 'inactive') {
        flushSave();
      }
    });
    return () => sub.remove();
  }, [isLoaded, flushSave]);

  // ─── TimeGuard foreground/background lifecycle ──────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    // Initial check on app start.
    (async () => {
      const anomaly = await checkTimeAnomaly();
      if (anomaly) {
        cheatLockRef.current = true;
        triggerCheatAlert();
      }
    })();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        saveCurrentTimeState().catch(() => {});
      } else if (state === 'active') {
        checkTimeAnomaly().then(anomaly => {
          if (anomaly) {
            cheatLockRef.current = true;
            triggerCheatAlert();
          } else {
            // Kullanıcı saatini düzelttiyse kilidi kaldır —
            // uygulamayı yeniden başlatmaya gerek kalmasın.
            cheatLockRef.current = false;
          }
        }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [isLoaded, triggerCheatAlert]);

  // ─── Effect/listener hook'ları ──────────────────────────────────────
  useNotificationResponses({ habitsRef, setHabits, setStats });
  useAppStateSync({
    habitsRef,
    onDayChange: () => loadData().catch(e => handleAsyncError('AppState loadData', e)),
  });
  useAchievementsEngine({ achievements, isLoaded, setStats, awardedAchIdsRef });
  useDailyBonus({ habits, isLoaded, setStats, bonusDateRef: dailyBonusDateRef });

  const setPersonality = useCallback((p: string) => {
    setStats(prev => ({ ...prev, personality: p }));
  }, []);

  const buyItem = useCallback((itemId: string, cost: number): boolean => {
    const currentHabitium = statsRef.current.habitium ?? 0;
    const inv = statsRef.current.inventory ?? [];
    if (currentHabitium >= cost && !inv.includes(itemId)) {
      setStats(prev => ({
        ...prev,
        habitium: (prev.habitium ?? 0) - cost,
        inventory: [...(prev.inventory ?? []), itemId]
      }));
      return true;
    }
    return false;
  }, []);

  const equipItem = useCallback((category: string, itemId: string) => {
    setStats(prev => {
      const eq = prev.equipped ?? {};
      return {
        ...prev,
        equipped: {
          ...eq,
          [category]: itemId
        }
      };
    });
  }, []);

  const addPomodoroTime = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    const today = getTodayStr();
    setStats(prev => {
      const prevStats = prev.pomodoroDailySeconds ?? {};
      return {
        ...prev,
        pomodoroDailySeconds: {
          ...prevStats,
          [today]: (prevStats[today] ?? 0) + seconds
        }
      };
    });
  }, []);

  const contextValue = useMemo<HabitsContextProps>(() => ({
    habits, stats, isLoaded, achievements, motivationState,
    currency, setCurrency,
    addHabit, toggleHabit, deleteHabit,
    resetNegativeHabit, resetAllData, reorderHabits, recordRelapse,
    streakFreezes, maxStreakFreezes: MAX_STREAK_FREEZES,
    addStreakFreeze, freezeFeedback, clearFreezeFeedback,
    setPersonality, buyItem, equipItem, addPomodoroTime
  }), [
    habits, stats, isLoaded, achievements, motivationState,
    currency, setCurrency,
    addHabit, toggleHabit, deleteHabit,
    resetNegativeHabit, resetAllData, reorderHabits, recordRelapse,
    streakFreezes, addStreakFreeze, freezeFeedback, clearFreezeFeedback,
    setPersonality, buyItem, equipItem, addPomodoroTime
  ]);

  return (
    <HabitsContext.Provider value={contextValue}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
}
