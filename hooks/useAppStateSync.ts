import { useEffect, useRef, type MutableRefObject } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { scheduleAllNotifications } from '../engine/NotificationEngine';
import { pingActivity } from '../engine/EngagementTracker';
import { getTodayStr } from '../utils/dateUtils';
import { handleAsyncError } from '../utils/errorHandler';
import type { Habit } from '../context/HabitsContext';

interface Args {
  habitsRef: MutableRefObject<Habit[]>;
  onDayChange: () => void;
}

/**
 * On background/inactive: reschedule notifications.
 * On active:
 *   - Mark engagement (pasif-agresif tetik için tarihler).
 *   - Day-change varsa onDayChange.
 *   - Timezone değişikliği varsa reschedule (uçak yolculuğu vb.).
 */
export function useAppStateSync({ habitsRef, onDayChange }: Args) {
  const lastActiveDay = useRef(getTodayStr());
  const lastTzOffset = useRef(new Date().getTimezoneOffset());
  // Latest callback ref so the listener is registered only once.
  const onDayChangeRef = useRef(onDayChange);
  useEffect(() => { onDayChangeRef.current = onDayChange; }, [onDayChange]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        await scheduleAllNotifications(habitsRef.current);
        return;
      }
      if (nextAppState === 'active') {
        // Engagement ping — bu, "pasif-agresif veda" eşiğini sıfırlayan tek
        // sinyal. Buradan önce yapılırsa tone bucket yanlış seçilir.
        pingActivity().catch(e => handleAsyncError('AppState pingActivity', e));

        const currentDay = getTodayStr();
        const currentTz = new Date().getTimezoneOffset();

        if (lastActiveDay.current !== currentDay) {
          lastActiveDay.current = currentDay;
          try {
            onDayChangeRef.current();
          } catch (e) {
            handleAsyncError('AppState onDayChange', e);
          }
        }

        // Timezone değişimi (uçak, OS saat-dilim güncellemesi) — eski Date
        // trigger'lar yanlış yerel saatte çalar. Reschedule ile düzeltir.
        if (lastTzOffset.current !== currentTz) {
          lastTzOffset.current = currentTz;
          scheduleAllNotifications(habitsRef.current).catch(e =>
            handleAsyncError('AppState tzReschedule', e)
          );
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [habitsRef]);
}
