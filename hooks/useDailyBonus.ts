import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { sendDailyBonusNotification } from '../engine/NotificationEngine';
import { calculateLevel } from '../context/habitCalculations';
import { getTodayStr, isHabitValidToday } from '../utils/dateUtils';
import { handleAsyncError } from '../utils/errorHandler';
import type { Habit } from '../context/HabitsContext';

const DAILY_BONUS_KEY = '@daily_bonus_v1';

interface UserStatsLite {
  xp: number;
  level: number;
  bestStreak: number;
  totalCompleted: number;
}

interface Args {
  habits: Habit[];
  isLoaded: boolean;
  setStats: Dispatch<SetStateAction<any>>;
  /** Provider-owned ref so loadData() can hydrate it from AsyncStorage. */
  bonusDateRef: MutableRefObject<string>;
}

/**
 * Awards a +50 XP bonus once per day when all valid positive habits for today
 * are completed.
 */
export function useDailyBonus({ habits, isLoaded, setStats, bonusDateRef }: Args) {
  useEffect(() => {
    if (!isLoaded) return;
    const today = getTodayStr();
    if (bonusDateRef.current === today) return;

    const validToday = habits.filter(h =>
      h.type === 'positive' && isHabitValidToday(h.frequency, h.customDays)
    );

    if (validToday.length === 0 || !validToday.every(h => h.completed)) return;

    bonusDateRef.current = today;
    AsyncStorage.setItem(DAILY_BONUS_KEY, today).catch(() => {});

    setStats((prev: any) => {
      const newXp = prev.xp + 50;
      const newHabitium = (prev.habitium ?? 0) + 10;
      return { ...prev, xp: newXp, level: calculateLevel(newXp), habitium: newHabitium };
    });

    sendDailyBonusNotification().catch(e =>
      handleAsyncError('sendDailyBonusNotification', e),
    );
  }, [habits, isLoaded, setStats, bonusDateRef]);
}
