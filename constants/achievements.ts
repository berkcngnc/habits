import { dateToStr, isValidOnDayOfWeek, getDaysSince } from '../utils/dateUtils';
import type { Habit, AchievementRarity } from '../context/HabitsContext';

export type AchievementCategory =
  | 'core'
  | 'streak'
  | 'level'
  | 'total'
  | 'quit'
  | 'special';

export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  icon: string;
  color: string;
  rarity: AchievementRarity;
  xpReward: number;
  /**
   * Predicate evaluated against the precomputed context. Should be cheap
   * (O(1) where possible) — heavy work is hoisted into `buildContext` so it
   * runs ONCE per habits/stats change instead of once per achievement.
   */
  evaluate: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  habits: Habit[];
  xp: number;
  level: number;
  bestStreak: number;
  totalCompleted: number;

  // Hoisted, single-pass computations
  bestCleanDays: number;
  totalSaved: number;
  longestPerfectStreak: number;
  uniqueColorCount: number;
  hasEarlyReminder: boolean;
  hasNightReminder: boolean;
  hasWeekendHabit: boolean;
  hasNegativeHabit: boolean;
  hasComebackStreak: number; // longest clean stretch on a habit that previously relapsed
}

// ─────────────────────────────────────────────────────────────────
// Precompute heavy fields ONCE per render. Single pass over habits.
// ─────────────────────────────────────────────────────────────────
export function buildContext(
  habits: Habit[],
  stats: { xp: number; level: number; bestStreak: number; totalCompleted: number },
): AchievementContext {
  let bestCleanDays = 0;
  let totalSaved = 0;
  let hasEarlyReminder = false;
  let hasNightReminder = false;
  let hasWeekendHabit = false;
  let hasNegativeHabit = false;
  let hasComebackStreak = 0;
  const colors = new Set<string>();

  for (const h of habits) {
    if (h.color) colors.add(h.color);
    if (h.frequency === 'weekends') hasWeekendHabit = true;

    if (h.reminderTime && h.reminderTime !== 'Yok') {
      const hour = parseInt(h.reminderTime.split(':')[0], 10);
      if (Number.isFinite(hour)) {
        if (hour < 8) hasEarlyReminder = true;
        if (hour >= 22) hasNightReminder = true;
      }
    }

    if (h.type === 'negative') {
      hasNegativeHabit = true;
      const days = getDaysSince(h.startDate);
      if (days > bestCleanDays) bestCleanDays = days;
      totalSaved += (h.costPerDay || 0) * days;

      // Comeback: relapse'ten sonra temiz kaldığı süre. startDate son
      // relapse'ten sonra reset edilir, yani relapseHistory varsa
      // mevcut clean streak bir comeback'tir.
      const relapses = Array.isArray(h.relapseHistory) ? h.relapseHistory.length : 0;
      if (relapses > 0 && days > hasComebackStreak) {
        hasComebackStreak = days;
      }
    }
  }

  const longestPerfectStreak = computeLongestPerfectStreak(habits);

  return {
    habits,
    xp: stats.xp,
    level: stats.level,
    bestStreak: stats.bestStreak,
    totalCompleted: stats.totalCompleted,
    bestCleanDays,
    totalSaved,
    longestPerfectStreak,
    uniqueColorCount: colors.size,
    hasEarlyReminder,
    hasNightReminder,
    hasWeekendHabit,
    hasNegativeHabit,
    hasComebackStreak,
  };
}

// "Mükemmel gün" = o gün geçerli olan tüm pozitif alışkanlıkların hepsi tamam.
// Geriye doğru max 365 gün tarayıp en uzun ardışık mükemmel gün serisini buluruz.
function computeLongestPerfectStreak(habits: Habit[]): number {
  const positives = habits.filter(h => h.type === 'positive');
  if (positives.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let longest = 0;
  let current = 0;
  const SCAN_DAYS = 366;

  // En eski habit'ten önceki günler için tarama anlamsız.
  let earliestCreate = Infinity;
  for (const h of positives) {
    if (h.startDate < earliestCreate) earliestCreate = h.startDate;
  }

  for (let i = 0; i < SCAN_DAYS; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (d.getTime() < earliestCreate) break;

    const dStr = dateToStr(d);
    const dow = d.getDay();

    let required = 0;
    let done = 0;
    for (const h of positives) {
      const created = dateToStr(new Date(h.startDate));
      if (dStr < created) continue;
      if (!isValidOnDayOfWeek(dow, h.frequency, h.customDays)) continue;
      required++;
      if (h.history?.[dStr]) done++;
    }

    if (required > 0 && required === done) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

// ─────────────────────────────────────────────────────────────────
// Achievement definitions
// ─────────────────────────────────────────────────────────────────
//
// IMPORTANT: existing IDs `a1`-`a16` are preserved verbatim so users who
// already unlocked them don't lose progress. New IDs use descriptive names.
//
export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Core (legacy IDs) ─────────────────────────────────────────
  { id: 'a1',  category: 'core',    icon: 'star',        color: '#f59e0b', rarity: 'easy',      xpReward: 100, evaluate: c => c.habits.length > 0 },
  { id: 'a3',  category: 'level',   icon: 'shield',      color: '#3b82f6', rarity: 'easy',      xpReward: 100, evaluate: c => c.level >= 2 },
  { id: 'a6',  category: 'special', icon: 'sun-o',       color: '#f97316', rarity: 'easy',      xpReward: 100, evaluate: c => c.hasEarlyReminder },
  { id: 'a7',  category: 'special', icon: 'users',       color: '#10b981', rarity: 'easy',      xpReward: 100, evaluate: c => c.habits.length >= 5 },
  { id: 'a8',  category: 'special', icon: 'calendar',    color: '#ec4899', rarity: 'easy',      xpReward: 100, evaluate: c => c.hasWeekendHabit },
  { id: 'a12', category: 'quit',    icon: 'shield',      color: '#64748b', rarity: 'easy',      xpReward: 100, evaluate: c => c.hasNegativeHabit },

  // ── Streak Ladder ─────────────────────────────────────────────
  { id: 'a2',   category: 'streak', icon: 'fire',     color: '#ef4444', rarity: 'easy',      xpReward: 100, evaluate: c => c.bestStreak >= 3 },
  { id: 'a4',   category: 'streak', icon: 'fire',     color: '#f97316', rarity: 'hard',      xpReward: 150, evaluate: c => c.bestStreak >= 7 },
  { id: 's14',  category: 'streak', icon: 'fire',     color: '#fb923c', rarity: 'hard',      xpReward: 200, evaluate: c => c.bestStreak >= 14 },
  { id: 'a9',   category: 'streak', icon: 'diamond',  color: '#a855f7', rarity: 'legendary', xpReward: 250, evaluate: c => c.bestStreak >= 30 },
  { id: 's60',  category: 'streak', icon: 'diamond',  color: '#9333ea', rarity: 'legendary', xpReward: 350, evaluate: c => c.bestStreak >= 60 },
  { id: 's90',  category: 'streak', icon: 'diamond',  color: '#7c3aed', rarity: 'legendary', xpReward: 450, evaluate: c => c.bestStreak >= 90 },
  { id: 's180', category: 'streak', icon: 'star',     color: '#facc15', rarity: 'epic',      xpReward: 700, evaluate: c => c.bestStreak >= 180 },
  { id: 's365', category: 'streak', icon: 'trophy',   color: '#fbbf24', rarity: 'epic',      xpReward: 1500, evaluate: c => c.bestStreak >= 365 },

  // ── Level Ladder ──────────────────────────────────────────────
  { id: 'lv5',   category: 'level', icon: 'shield',      color: '#6366f1', rarity: 'easy',      xpReward: 150, evaluate: c => c.level >= 5 },
  { id: 'lv10',  category: 'level', icon: 'rocket',      color: '#eab308', rarity: 'hard',      xpReward: 250, evaluate: c => c.level >= 10 },
  { id: 'lv20',  category: 'level', icon: 'rocket',      color: '#f59e0b', rarity: 'hard',      xpReward: 350, evaluate: c => c.level >= 20 },
  { id: 'lv50',  category: 'level', icon: 'rocket',      color: '#a855f7', rarity: 'legendary', xpReward: 600, evaluate: c => c.level >= 50 },
  { id: 'lv100', category: 'level', icon: 'rocket',      color: '#3b82f6', rarity: 'legendary', xpReward: 1000, evaluate: c => c.level >= 100 },
  { id: 'lv250', category: 'level', icon: 'certificate', color: '#0ea5e9', rarity: 'epic',      xpReward: 2500, evaluate: c => c.level >= 250 },
  { id: 'lv500', category: 'level', icon: 'certificate', color: '#06b6d4', rarity: 'epic',      xpReward: 5000, evaluate: c => c.level >= 500 },

  // ── Total Completed Ladder ────────────────────────────────────
  { id: 'tc10',   category: 'total', icon: 'check',        color: '#22c55e', rarity: 'easy',      xpReward: 100, evaluate: c => c.totalCompleted >= 10 },
  { id: 'a5',     category: 'total', icon: 'bolt',         color: '#8b5cf6', rarity: 'hard',      xpReward: 150, evaluate: c => c.totalCompleted >= 50 },
  { id: 'tc100',  category: 'total', icon: 'check',        color: '#16a34a', rarity: 'hard',      xpReward: 250, evaluate: c => c.totalCompleted >= 100 },
  { id: 'tc250',  category: 'total', icon: 'check-circle', color: '#15803d', rarity: 'legendary', xpReward: 400, evaluate: c => c.totalCompleted >= 250 },
  { id: 'tc500',  category: 'total', icon: 'check-circle', color: '#166534', rarity: 'legendary', xpReward: 700, evaluate: c => c.totalCompleted >= 500 },
  { id: 'tc1000', category: 'total', icon: 'trophy',       color: '#fbbf24', rarity: 'epic',      xpReward: 1500, evaluate: c => c.totalCompleted >= 1000 },

  // ── XP Milestones ─────────────────────────────────────────────
  { id: 'a10',   category: 'level', icon: 'rocket',      color: '#eab308', rarity: 'legendary', xpReward: 200, evaluate: c => c.xp >= 1000 },
  { id: 'xp5k',  category: 'level', icon: 'rocket',      color: '#f59e0b', rarity: 'legendary', xpReward: 500, evaluate: c => c.xp >= 5000 },
  { id: 'xp10k', category: 'level', icon: 'rocket',      color: '#facc15', rarity: 'epic',      xpReward: 1200, evaluate: c => c.xp >= 10000 },

  // ── Special / Variety ─────────────────────────────────────────
  { id: 'pw',         category: 'special', icon: 'star',        color: '#3b82f6', rarity: 'hard',      xpReward: 250, evaluate: c => c.longestPerfectStreak >= 7 },
  { id: 'pm',         category: 'special', icon: 'star',        color: '#8b5cf6', rarity: 'legendary', xpReward: 600, evaluate: c => c.longestPerfectStreak >= 30 },
  { id: 'night_owl',  category: 'special', icon: 'moon-o',      color: '#6366f1', rarity: 'easy',      xpReward: 100, evaluate: c => c.hasNightReminder },
  { id: 'diverse',    category: 'special', icon: 'paint-brush', color: '#ec4899', rarity: 'easy',      xpReward: 150, evaluate: c => c.uniqueColorCount >= 5 },

  // ── Quitting Ladder ───────────────────────────────────────────
  { id: 'a13',       category: 'quit', icon: 'shield',  color: '#22c55e', rarity: 'hard',      xpReward: 150, evaluate: c => c.bestCleanDays >= 7 },
  { id: 'a14',       category: 'quit', icon: 'diamond', color: '#0ea5e9', rarity: 'legendary', xpReward: 250, evaluate: c => c.bestCleanDays >= 30 },
  { id: 'q90',       category: 'quit', icon: 'diamond', color: '#0284c7', rarity: 'legendary', xpReward: 500, evaluate: c => c.bestCleanDays >= 90 },
  { id: 'q365',      category: 'quit', icon: 'trophy',  color: '#fbbf24', rarity: 'epic',      xpReward: 2000, evaluate: c => c.bestCleanDays >= 365 },
  { id: 'comeback7', category: 'quit', icon: 'heart',   color: '#10b981', rarity: 'hard',      xpReward: 200, evaluate: c => c.hasComebackStreak >= 7 },
  { id: 'comeback30',category: 'quit', icon: 'heart',   color: '#059669', rarity: 'legendary', xpReward: 400, evaluate: c => c.hasComebackStreak >= 30 },

  // ── Saving (cost) ─────────────────────────────────────────────
  { id: 'a16',     category: 'quit', icon: 'money', color: '#16a34a', rarity: 'hard',      xpReward: 150, evaluate: c => c.totalSaved >= 1000 },
  { id: 'saver5k', category: 'quit', icon: 'money', color: '#15803d', rarity: 'legendary', xpReward: 350, evaluate: c => c.totalSaved >= 5000 },
  { id: 'saver10k',category: 'quit', icon: 'money', color: '#166534', rarity: 'epic',      xpReward: 800, evaluate: c => c.totalSaved >= 10000 },
];

// "Master of all" — diğer tüm başarımlar açıldığında açılır. Hep en sonda
// dönüyoruz ki diğerleri evaluate edildikten sonra hesaplanabilsin.
export const MASTER_ACHIEVEMENT: AchievementDef = {
  id: 'a11',
  category: 'core',
  icon: 'certificate',
  color: '#06b6d4',
  rarity: 'epic',
  xpReward: 9999,
  // evaluate dummy — runtime'da diğerlerine göre belirlenir
  evaluate: () => false,
};

/**
 * Already-unlocked achievements (id'leri awardedIds set'inde) için predicate
 * tekrar çalıştırılmaz — sadece `unlocked: true` olarak döndürülür. Bu,
 * başarım sayısı arttıkça her render'da yapılan işin O(unawarded) kalmasını
 * sağlar; kazanılmış başarımlar ücretsiz hale gelir.
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  awardedIds: Set<string>,
): { id: string; unlocked: boolean; def: AchievementDef }[] {
  const result = ACHIEVEMENTS.map(def => {
    if (awardedIds.has(def.id)) {
      return { id: def.id, unlocked: true, def };
    }
    return { id: def.id, unlocked: def.evaluate(ctx), def };
  });

  // "Master of all": diğerlerinin tümü açılınca açılır.
  const masterUnlocked = awardedIds.has(MASTER_ACHIEVEMENT.id) || result.every(r => r.unlocked);
  result.push({ id: MASTER_ACHIEVEMENT.id, unlocked: masterUnlocked, def: MASTER_ACHIEVEMENT });
  return result;
}
