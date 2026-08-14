import * as Notifications from 'expo-notifications';
import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { Platform } from 'react-native';
import { scheduleAllNotifications, snoozeHabitNotification } from '../engine/NotificationEngine';
import { calculateLevel, calculateStreak } from '../context/habitCalculations';
import { getTodayStr } from '../utils/dateUtils';
import { handleAsyncError } from '../utils/errorHandler';
import type { Habit } from '../context/HabitsContext';

interface UserStatsLite {
  xp: number;
  level: number;
  bestStreak: number;
  totalCompleted: number;
}

interface Args {
  habitsRef: MutableRefObject<Habit[]>;
  setHabits: Dispatch<SetStateAction<Habit[]>>;
  setStats: Dispatch<SetStateAction<any>>;
}

/**
 * Foreground/background notification action listener.
 * Handles "complete" and "snooze" buttons from system notifications.
 */
export function useNotificationResponses({ habitsRef, setHabits, setStats }: Args) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const action = response.actionIdentifier;
      const data = response.notification.request.content.data as {
        habitId?: string;
        habitTitle?: string;
        type?: string;
      };
      const notifId = response.notification.request.identifier;
      const dismissNow = () => {
        Notifications.dismissNotificationAsync(notifId).catch(e =>
          handleAsyncError('dismissNotification', e)
        );
      };
      if (!data?.habitId) {
        dismissNow();
        return;
      }

      if (action === 'complete') {
        try {
          const todayKey = getTodayStr();
          const currentHabit = habitsRef.current.find(h => h.id === data.habitId);
          if (!currentHabit || currentHabit.completed) return;

          // Streak'i toggle SONRASI hali ile hesapla — `streak + 1` yaklaşımı
          // custom/weekday frekanslarda yanlış oluyordu (boşluklu günler).
          const newHistory = { ...currentHabit.history, [todayKey]: true };
          const newStreak = calculateStreak(newHistory, currentHabit.frequency, currentHabit.customDays);

          setHabits(prev => prev.map(h => {
            if (h.id !== data.habitId) return h;
            if (h.completed) return h;
            return { ...h, completed: true, streak: newStreak, lastCompletedDate: todayKey, history: newHistory };
          }));

          setStats((prev: any) => {
            const newXp = prev.xp + 20;
            return {
              ...prev,
              xp: newXp,
              level: calculateLevel(newXp),
              totalCompleted: prev.totalCompleted + 1,
              bestStreak: Math.max(prev.bestStreak, newStreak),
            };
          });
          setTimeout(() => {
            scheduleAllNotifications(habitsRef.current).catch(e =>
              handleAsyncError('NotificationComplete reschedule', e)
            );
          }, 500);
        } catch (e) {
          handleAsyncError('NotificationComplete action', e);
        } finally {
          dismissNow();
        }
      } else if (action === 'snooze') {
        try {
          const habitTitle = data.habitTitle
            || habitsRef.current.find(h => h.id === data.habitId)?.title
            || '';
          await snoozeHabitNotification(data.habitId, habitTitle);
        } catch (e) {
          handleAsyncError('NotificationSnooze action', e);
        } finally {
          dismissNow();
        }
      } else {
        dismissNow();
      }
    });
    return () => sub.remove();
  }, [habitsRef, setHabits, setStats]);
}
