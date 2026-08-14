import { dateToStr, diffInCalendarDays, isDayValid, parseLocalDate } from '../utils/dateUtils';
import type { HabitFrequency } from './HabitsContext';

export const MAX_LEVEL = 100;
export const calculateLevel = (xp: number): number =>
  Math.min(Math.floor(Math.sqrt(Math.max(0, xp) / 10)) + 1, MAX_LEVEL);

export const normalizeHistoryKeys = (
  history: Record<string, boolean>
): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  let dropped = 0;
  for (const key of Object.keys(history)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      result[key] = history[key];
      continue;
    }
    const parts = key.split('-');
    if (parts.length === 3 && parts.every(p => /^\d+$/.test(p))) {
      result[`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`] =
        history[key];
    } else {
      dropped++;
    }
  }
  if (dropped > 0) {
    // Surfaces silent data loss during migrations / corruption — was previously dropped without trace.
    console.warn(`[habits] normalizeHistoryKeys dropped ${dropped} invalid history key(s)`);
  }
  return result;
};

export const calculateStreak = (
  history: Record<string, boolean> = {},
  frequency: HabitFrequency,
  customDays?: number[]
): number => {
  const completedKeys = Object.keys(history).filter(k => history[k]);
  if (completedKeys.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = dateToStr(today);

  const sortedKeys = completedKeys.slice().sort();
  const mostRecent = sortedKeys[sortedKeys.length - 1];
  const oldestStr = sortedKeys[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (mostRecent < dateToStr(yesterday)) return 0;

  let streak = 0;
  if (history[todayStr]) streak++;

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 1);

  // Cap loop at the actual span of recorded history (+ small buffer) rather than
  // a heuristic based on entry count, which under-bounds for sparse-frequency habits.
  const oldest = parseLocalDate(oldestStr);
  const maxCalendarDays = Math.max(7, diffInCalendarDays(today, oldest) + 7);

  for (let i = 0; i < maxCalendarDays; i++) {
    const dStr = dateToStr(cursor);
    if (isDayValid(dStr, frequency, customDays)) {
      if (history[dStr]) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

/**
 * Auto-Streak-Freeze: if a positive habit's streak is about to break because
 * one or more *valid* days were missed between the most-recent completion and
 * yesterday, fill those gaps using available freezes (1 freeze = 1 missed day).
 *
 * Returns the patched history and the number of freezes consumed. If freezes
 * cannot fully bridge the gap, no freezes are spent and history is unchanged
 * (we never partially save a streak — it's all-or-nothing per habit).
 */
export const applyStreakFreezes = (
  history: Record<string, boolean> = {},
  frequency: HabitFrequency,
  customDays: number[] | undefined,
  availableFreezes: number,
): { history: Record<string, boolean>; used: number } => {
  if (availableFreezes <= 0) return { history, used: 0 };

  const completedKeys = Object.keys(history).filter(k => history[k]);
  if (completedKeys.length === 0) return { history, used: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = dateToStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = dateToStr(yesterday);

  const mostRecent = completedKeys.slice().sort().reverse()[0];

  // Streak isn't in danger — already completed today or yesterday.
  if (mostRecent >= yesterdayStr) return { history, used: 0 };

  // Collect all *valid* days strictly between mostRecent and today (exclusive of today).
  const missedValidDays: string[] = [];
  const cursor = parseLocalDate(yesterdayStr);
  while (dateToStr(cursor) > mostRecent) {
    const cStr = dateToStr(cursor);
    if (isDayValid(cStr, frequency, customDays)) {
      missedValidDays.push(cStr);
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  // No valid days missed (e.g. weekdays-only habit on a weekend gap) — no save needed.
  if (missedValidDays.length === 0) return { history, used: 0 };

  // Not enough freezes to save the entire gap — bail without spending.
  if (missedValidDays.length > availableFreezes) return { history, used: 0 };

  const newHistory = { ...history };
  for (const day of missedValidDays) newHistory[day] = true;
  // Defensive: never patch today itself.
  if (newHistory[todayStr] && !history[todayStr]) delete newHistory[todayStr];
  return { history: newHistory, used: missedValidDays.length };
};
