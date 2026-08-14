import { calculateStreak, MAX_LEVEL } from '../context/habitCalculations';
import {
  calculateNegativeStreak,
  diffInCalendarDays,
  dateToStr,
  getDaysSince,
  getTodayStr,
  isDayValid,
  parseLocalDateStrict,
} from '../utils/dateUtils';
import type { Habit } from '../context/HabitsContext';
import type { LanguageCode } from '../locales';

export const WIDGET_SNAPSHOT_VERSION = 2;

const MILESTONES = [1, 3, 7, 14, 30, 90, 365] as const;

export interface SnapshotPositiveHabit {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  streak: number;
  completedToday: boolean;
  isAtRisk: boolean;
  isValidToday: boolean;
  daysSinceLast: number;
}

export interface SnapshotNegativeHabit {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  daysClean: number;
  daysCleanLabel: string;
  moneySaved: number;
  minutesSaved: number;
  currentMilestoneDay: number;
  currentMilestoneText: string;
  nextMilestoneDays: number;
}

export interface WidgetSnapshot {
  v: typeof WIDGET_SNAPSHOT_VERSION;
  generatedAt: number;
  lang: LanguageCode;
  currency: string;

  user: {
    isNew: boolean;
    hasPositive: boolean;
    hasNegative: boolean;
    xp: number;
    level: number;
    xpInLevel: number;
    xpToNextLevel: number;
    totalCompleted: number;
  };

  positiveHabits: SnapshotPositiveHabit[];
  negativeHabits: SnapshotNegativeHabit[];

  achievement: {
    latestId: string | null;
    latestTitle: string | null;
  };

  todayProgress: {
    completed: number;
    total: number;
  };

  weeklyHeatmap: number[];

  isDark: boolean;
}

export interface SnapshotInput {
  habits: Habit[];
  stats: {
    xp: number;
    level: number;
    totalCompleted: number;
  };
  achievements: Array<{ id: string; unlocked: boolean }>;
  achievementUnlockTimes?: Record<string, number>;
  currency: string;
  language: LanguageCode;
  isDark?: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function buildWidgetSnapshot(input: SnapshotInput): WidgetSnapshot {
  const { habits, stats, achievements, achievementUnlockTimes = {}, currency, language, t } = input;
  const isDark = input.isDark ?? true;
  const today = getTodayStr();

  const positives = habits.filter(h => (h.type ?? 'positive') === 'positive');
  const negatives = habits.filter(h => h.type === 'negative');

  const isNew =
    habits.length === 0 || (habits.length <= 2 && stats.totalCompleted < 5);

  // ─── Positive habits ────────────────────────────────────────────
  const positiveHabits: SnapshotPositiveHabit[] = positives.map(h => {
    const streak = calculateStreak(h.history ?? {}, h.frequency, h.customDays);
    const completedToday = !!h.history?.[today];
    const validToday = isDayValid(today, h.frequency, h.customDays);
    const isAtRisk = validToday && !completedToday && streak >= 3;
    const lastTs = h.lastCompletedDate
      ? parseLocalDateStrict(h.lastCompletedDate)?.getTime() ?? h.startDate
      : h.startDate;
    const daysSinceLast = getDaysSince(lastTs);
    return {
      id: h.id,
      title: h.title,
      icon: h.icon,
      color: h.color,
      streak,
      completedToday,
      isAtRisk,
      isValidToday: validToday,
      daysSinceLast,
    };
  });

  // ─── Negative habits ────────────────────────────────────────────
  const negativeHabits: SnapshotNegativeHabit[] = negatives.map(h => {
    const daysClean = calculateNegativeStreak(h.startDate, h.relapseHistory);
    const moneySaved = Math.max(0, Math.floor((h.costPerDay ?? 0) * daysClean));
    const minutesSaved = Math.max(0, Math.floor((h.timePerDay ?? 0) * daysClean));

    const lastReached = [...MILESTONES].reverse().find(m => m <= daysClean) ?? 0;
    const currentMilestoneText = lastReached
      ? t(`health_${lastReached}d`)
      : t('health_default');
    const nextMilestone = MILESTONES.find(m => m > daysClean);
    const nextMilestoneDays = nextMilestone ? nextMilestone - daysClean : 0;
    const daysCleanLabel = t('widget_label_day_count', { n: daysClean });

    return {
      id: h.id,
      title: h.title,
      icon: h.icon,
      color: h.color,
      daysClean,
      daysCleanLabel,
      moneySaved,
      minutesSaved,
      currentMilestoneDay: lastReached,
      currentMilestoneText,
      nextMilestoneDays,
    };
  });

  // ─── Achievement: latest unlocked ───────────────────────────────
  const unlockedIds = achievements.filter(a => a.unlocked).map(a => a.id);
  let latestId: string | null = null;
  if (unlockedIds.length > 0) {
    const withTimes = unlockedIds
      .map(id => ({ id, ts: achievementUnlockTimes[id] ?? 0 }))
      .sort((a, b) => b.ts - a.ts);
    latestId = withTimes[0].id;
  }
  const latestTitle = latestId ? t(`ach_${latestId}_title`) : null;

  // ─── Today's progress (positive habits valid for today) ──────────
  const validForToday = positives.filter(h =>
    isDayValid(today, h.frequency, h.customDays),
  );
  const completedTodayCount = validForToday.filter(h => h.history?.[today]).length;

  // ─── Weekly heatmap (last 7 days, including today) ──────────────
  const weeklyHeatmap: number[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const dStr = dateToStr(d);
    const validHabits = positives.filter(h =>
      isDayValid(dStr, h.frequency, h.customDays),
    );
    if (validHabits.length === 0) {
      weeklyHeatmap.push(0);
      continue;
    }
    const done = validHabits.filter(h => h.history?.[dStr]).length;
    weeklyHeatmap.push(done / validHabits.length);
  }
  if (weeklyHeatmap.every(v => v === 0)) weeklyHeatmap.length = 0;

  // ─── XP / level progress ────────────────────────────────────────
  const xpInLevel = stats.level >= MAX_LEVEL ? 100 : stats.xp % 100;
  const xpToNextLevel = stats.level >= MAX_LEVEL ? 0 : 100 - xpInLevel;

  return {
    v: WIDGET_SNAPSHOT_VERSION,
    generatedAt: Date.now(),
    lang: language,
    currency,

    user: {
      isNew,
      hasPositive: positives.length > 0,
      hasNegative: negatives.length > 0,
      xp: stats.xp,
      level: stats.level,
      xpInLevel,
      xpToNextLevel,
      totalCompleted: stats.totalCompleted,
    },

    positiveHabits,
    negativeHabits,

    achievement: {
      latestId,
      latestTitle,
    },

    todayProgress: {
      completed: completedTodayCount,
      total: validForToday.length,
    },

    weeklyHeatmap,
    isDark,
  };
}

// Re-export for callers that need the diff helper without pulling dateUtils.
export { diffInCalendarDays };
