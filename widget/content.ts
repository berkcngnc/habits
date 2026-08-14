import type { WidgetSnapshot } from './snapshot';

export type WidgetContentType =
  | 'streak_spotlight'
  | 'at_risk'
  | 'up_next'
  | 'daily_progress'
  | 'weekly_heatmap'
  | 'xp_progress'
  | 'latest_achievement'
  | 'money_saved'
  | 'time_reclaimed'
  | 'body_milestone'
  | 'clean_streak';

/**
 * Tags decide which contents conflict within the same widget render.
 * Items sharing any tag are kept apart so the widget shows variety.
 * Arrays allow future types to span multiple dimensions
 * (e.g. both 'progress' and 'positive_habit').
 */
export type CompatTag =
  | 'positive_habit'
  | 'negative_habit'
  | 'progress'
  | 'achievement'
  | 'stats';

interface BaseContent {
  /** Unique within a snapshot — habit-scoped where applicable. */
  id: string;
  weight: number;
  tags: CompatTag[];
}

export type WidgetContent =
  | (BaseContent & { type: 'streak_spotlight'; data: { habitId: string; title: string; icon: string | null; color: string | null; streak: number } })
  | (BaseContent & { type: 'at_risk'; data: { habitId: string; title: string; icon: string | null; color: string | null; streak: number } })
  | (BaseContent & { type: 'up_next'; data: { habitId: string; title: string; icon: string | null; color: string | null } })
  | (BaseContent & { type: 'daily_progress'; data: { completed: number; total: number } })
  | (BaseContent & { type: 'weekly_heatmap'; data: { values: number[] } })
  | (BaseContent & { type: 'xp_progress'; data: { level: number; xpInLevel: number; xpToNextLevel: number } })
  | (BaseContent & { type: 'latest_achievement'; data: { achievementId: string; title: string } })
  | (BaseContent & { type: 'money_saved'; data: { habitId: string; title: string; amount: number; currency: string } })
  | (BaseContent & { type: 'time_reclaimed'; data: { habitId: string; title: string; minutes: number } })
  | (BaseContent & { type: 'body_milestone'; data: { habitId: string; title: string; days: number; daysLabel: string; text: string } })
  | (BaseContent & { type: 'clean_streak'; data: { habitId: string; title: string; days: number } });

// ─── Generators ─────────────────────────────────────────────────────

export function buildPositiveContents(snapshot: WidgetSnapshot): WidgetContent[] {
  const out: WidgetContent[] = [];

  for (const h of snapshot.positiveHabits) {
    if (h.streak >= 1) {
      out.push({
        id: `streak_spotlight:${h.id}`,
        type: 'streak_spotlight',
        // Longer streak → slightly higher weight, capped to keep variety.
        weight: 1 + Math.min(h.streak / 10, 2),
        tags: ['positive_habit'],
        data: {
          habitId: h.id,
          title: h.title,
          icon: h.icon ?? null,
          color: h.color ?? null,
          streak: h.streak,
        },
      });
    }
    if (h.isAtRisk) {
      out.push({
        id: `at_risk:${h.id}`,
        type: 'at_risk',
        // At-risk warnings are more urgent, but capped so they don't dominate
        // when multiple habits qualify on the same day.
        weight: 1.8,
        tags: ['positive_habit'],
        data: {
          habitId: h.id,
          title: h.title,
          icon: h.icon ?? null,
          color: h.color ?? null,
          streak: h.streak,
        },
      });
    }
  }

  // up_next: first habit valid today, not yet done, streak=0 (new/reset)
  // Avoids duplicating habits already shown in streak_spotlight.
  const upNextHabit = snapshot.positiveHabits.find(
    h => h.isValidToday && !h.completedToday && h.streak === 0,
  );
  if (upNextHabit) {
    out.push({
      id: `up_next:${upNextHabit.id}`,
      type: 'up_next',
      weight: 1.5,
      tags: ['positive_habit'],
      data: {
        habitId: upNextHabit.id,
        title: upNextHabit.title,
        icon: upNextHabit.icon ?? null,
        color: upNextHabit.color ?? null,
      },
    });
  }

  if (snapshot.todayProgress.total > 0) {
    out.push({
      id: 'daily_progress',
      type: 'daily_progress',
      weight: 1.4,
      tags: ['progress'],
      data: {
        completed: snapshot.todayProgress.completed,
        total: snapshot.todayProgress.total,
      },
    });
  }

  if (snapshot.weeklyHeatmap.length > 0) {
    out.push({
      id: 'weekly_heatmap',
      type: 'weekly_heatmap',
      weight: 1,
      tags: ['progress'],
      data: { values: snapshot.weeklyHeatmap },
    });
  }

  return out;
}

export function buildNegativeContents(snapshot: WidgetSnapshot): WidgetContent[] {
  const out: WidgetContent[] = [];

  for (const h of snapshot.negativeHabits) {
    if (h.moneySaved > 0) {
      out.push({
        id: `money_saved:${h.id}`,
        type: 'money_saved',
        weight: 1.5,
        tags: ['negative_habit'],
        data: {
          habitId: h.id,
          title: h.title,
          amount: h.moneySaved,
          currency: snapshot.currency,
        },
      });
    }
    if (h.minutesSaved > 0) {
      out.push({
        id: `time_reclaimed:${h.id}`,
        type: 'time_reclaimed',
        weight: 1,
        tags: ['negative_habit'],
        data: {
          habitId: h.id,
          title: h.title,
          minutes: h.minutesSaved,
        },
      });
    }
    if (h.daysClean >= 1) {
      out.push({
        id: `body_milestone:${h.id}`,
        type: 'body_milestone',
        weight: 1.2,
        tags: ['negative_habit'],
        data: {
          habitId: h.id,
          title: h.title,
          days: h.daysClean,
          daysLabel: h.daysCleanLabel,
          text: h.currentMilestoneText,
        },
      });
      out.push({
        id: `clean_streak:${h.id}`,
        type: 'clean_streak',
        weight: 1.3,
        tags: ['negative_habit'],
        data: {
          habitId: h.id,
          title: h.title,
          days: h.daysClean,
        },
      });
    }
  }

  return out;
}

export function buildUniversalContents(snapshot: WidgetSnapshot): WidgetContent[] {
  const out: WidgetContent[] = [];

  // Only show xp_progress when there's a next level to aim for.
  if (snapshot.user.xpToNextLevel > 0) {
    out.push({
      id: 'xp_progress',
      type: 'xp_progress',
      weight: 1,
      tags: ['stats'],
      data: {
        level: snapshot.user.level,
        xpInLevel: snapshot.user.xpInLevel,
        xpToNextLevel: snapshot.user.xpToNextLevel,
      },
    });
  }

  if (snapshot.achievement.latestId && snapshot.achievement.latestTitle) {
    out.push({
      id: 'latest_achievement',
      type: 'latest_achievement',
      weight: 1.2,
      tags: ['achievement'],
      data: {
        achievementId: snapshot.achievement.latestId,
        title: snapshot.achievement.latestTitle,
      },
    });
  }

  return out;
}

/**
 * Returns the full content pool appropriate for the user's state.
 * When the pool is empty (e.g. brand-new user with no habits) the widget
 * shows the cold-start brand fallback instead.
 */
export function buildContentPool(snapshot: WidgetSnapshot): WidgetContent[] {
  const pool: WidgetContent[] = [];
  if (snapshot.user.hasPositive) pool.push(...buildPositiveContents(snapshot));
  if (snapshot.user.hasNegative) pool.push(...buildNegativeContents(snapshot));
  pool.push(...buildUniversalContents(snapshot));
  return pool;
}
