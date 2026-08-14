import { HabitFrequency, RelapseEntry } from "../context/HabitsContext";

// Yerel saat diliminde bugünün gününü YYYY-MM-DD olarak döner (UTC değil).
// Not: Cihaz timezone'una bağlıdır — kullanıcı gece yarısı civarında zaman dilimi
// değiştirirse aynı takvim günü iki kez ya da hiç görünmeyebilir. Streak/history
// anahtarı olarak bu format kullanılır; yapısı bozulursa AsyncStorage @habits_v3
// resetlenmelidir.
export const getTodayStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const todayDay = (): number => new Date().getDay();

// İki zaman damgası arasındaki takvim günü farkı (yerel TZ, DST güvenli)
// new Date(y,m,d) 3-argüman formu local midnight'ı setHours'tan daha güvenilir üretir.
// Math.round ±1 saatlik DST kaymasını doğru karşılar (23h→0.958→1, 25h→1.041→1).
export const diffInCalendarDays = (
  a: number | Date,
  b: number | Date,
): number => {
  const da = a instanceof Date ? a : new Date(a);
  const db = b instanceof Date ? b : new Date(b);
  const dayA = new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime();
  const dayB = new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime();
  return Math.round((dayA - dayB) / (1000 * 60 * 60 * 24));
};

export const getDaysSince = (timestamp?: number): number => {
  if (!timestamp || isNaN(timestamp)) return 0;
  return Math.max(0, diffInCalendarDays(Date.now(), timestamp));
};

// Date nesnesini yerel TZ'de YYYY-MM-DD stringine çevirir (toISOString UTC döner)
export const dateToStr = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// YYYY-MM-DD string'ini yerel TZ'de doğru parse eder (new Date('2025-04-23') UTC olur).
// Geçersiz girdide today döner ve __DEV__'de yüksek sesli warn — silent streak reset
// problemini gizlememek için. Yeni kod parseLocalDateStrict() kullanmalı.
export const parseLocalDate = (dateStr: string): Date => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) {
    if (__DEV__) console.warn('[dateUtils] Invalid date format, falling back to today:', dateStr);
    return new Date();
  }
  const [, y, m, d] = match.map(Number);
  return new Date(y, m - 1, d);
};

// Strict varyant — geçersiz girdide null. Streak/relapse gibi sessiz reset toleransı
// olmayan yerlerde tercih edin.
export const parseLocalDateStrict = (dateStr: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return new Date(y, m - 1, d);
};

const parseLocalDateStr = parseLocalDate;

export const isDayValid = (
  dateStr: string,
  frequency: HabitFrequency,
  customDays?: number[],
): boolean => {
  const day = parseLocalDateStr(dateStr).getDay();
  if (frequency === "weekdays") return day >= 1 && day <= 5;
  if (frequency === "weekends") return day === 0 || day === 6;
  if (frequency === "custom") return !!customDays?.length && customDays.includes(day);
  return true;
};

export const isHabitValidToday = (
  freq: string = "daily",
  customDays?: number[],
): boolean => {
  const day = todayDay();
  if (freq === "weekdays") return day >= 1 && day <= 5;
  if (freq === "weekends") return day === 0 || day === 6;
  if (freq === "custom") return !!customDays?.length && customDays.includes(day);
  return true;
};

// Frequency check for an arbitrary day-of-week number (0=Sun … 6=Sat).
// Centralises the logic used by NotificationEngine, stats screen, and HabitsContext.
export const isValidOnDayOfWeek = (
  dayOfWeek: number,
  frequency: HabitFrequency | string,
  customDays?: number[],
): boolean => {
  if (frequency === "weekdays") return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (frequency === "weekends") return dayOfWeek === 0 || dayOfWeek === 6;
  if (frequency === "custom") return !!customDays?.length && customDays.includes(dayOfWeek);
  return true; // daily
};

// Eski AsyncStorage verisinde string formatı olabilir — güvenli okuma için yardımcı
const getRelapseDate = (entry: RelapseEntry | string): string =>
  typeof entry === "string" ? entry : entry.date;

export const calculateNegativeStreak = (
  startDate: string | number,
  relapseHistory?: RelapseEntry[],
): number => {
  // Geçersiz string startDate'te today'e düşmek streak'i sıfırlardı — strict parse
  // başarısız olursa Date.now()'a fallback (yeni alışkanlık varsayımı).
  const start =
    typeof startDate === "number"
      ? startDate
      : (parseLocalDateStrict(startDate as string)?.getTime() ?? Date.now());
  let latestRelapse = start;

  if (relapseHistory && relapseHistory.length > 0) {
    // Geçersiz relapse tarihlerini sıralama öncesi at — stale veri streak'i bozmasın.
    const valid = (relapseHistory as (RelapseEntry | string)[])
      .map(e => parseLocalDateStrict(getRelapseDate(e))?.getTime())
      .filter((t): t is number => typeof t === "number");
    if (valid.length > 0) {
      latestRelapse = Math.max(...valid);
    }
  }

  return Math.max(0, diffInCalendarDays(Date.now(), latestRelapse));
};
