import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { sendAchievementNotification } from '../engine/NotificationEngine';
import { calculateLevel } from '../context/habitCalculations';
import { handleAsyncError } from '../utils/errorHandler';
import type { Achievement } from '../context/HabitsContext';

const ACHIEVEMENTS_KEY = '@achievements_awarded_v1';
const STATS_KEY = '@stats_v3';

interface UserStatsLite {
  xp: number;
  level: number;
  bestStreak: number;
  totalCompleted: number;
  habitium?: number;
}

interface Args {
  achievements: Achievement[];
  isLoaded: boolean;
  setStats: Dispatch<SetStateAction<any>>;
  /** Provider-owned ref so loadData() can hydrate it from AsyncStorage. */
  awardedAchIdsRef: MutableRefObject<Set<string>>;
}

/**
 * Detects newly unlocked achievements, awards XP once, persists awarded ids,
 * and emits a notification per unlock.
 */
export function useAchievementsEngine({ achievements, isLoaded, setStats, awardedAchIdsRef }: Args) {
  useEffect(() => {
    if (!isLoaded) return;
    const newly = achievements.filter(a => a.unlocked && !awardedAchIdsRef.current.has(a.id));
    if (newly.length === 0) return;

    newly.forEach(a => awardedAchIdsRef.current.add(a.id));
    AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify([...awardedAchIdsRef.current]))
      .catch(e => handleAsyncError('saveAchievements', e));

    const totalXp = newly.reduce((sum, a) => sum + a.xpReward, 0);
    const totalHabitium = newly.length * 3;
    
    if (totalXp > 0 || totalHabitium > 0) {
      // Persist'i state commit'i ile bağla — updater içinde AsyncStorage çağırmak
      // StrictMode altında çift yazıma yol açıyor, ayrıca pure updater kuralını ihlal eder.
      let committed: any = null;
      setStats((prev: any) => {
        const newXp = prev.xp + totalXp;
        const newHabitium = (prev.habitium ?? 0) + totalHabitium;
        committed = { ...prev, xp: newXp, level: calculateLevel(newXp), habitium: newHabitium };
        return committed;
      });
      // Microtask: setStats senkron işlenir, bir sonraki tick'te committed dolu olur.
      Promise.resolve().then(() => {
        if (committed) {
          AsyncStorage.setItem(STATS_KEY, JSON.stringify(committed))
            .catch(e => handleAsyncError('saveAchievementStats', e));
        }
      });
    }

    newly.forEach(a =>
      sendAchievementNotification(a.id, a.xpReward).catch(e =>
        handleAsyncError('sendAchievementNotification', e),
      ),
    );
  }, [achievements, isLoaded, setStats, awardedAchIdsRef]);
}
