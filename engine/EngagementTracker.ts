import AsyncStorage from '@react-native-async-storage/async-storage';
import { dateToStr, parseLocalDateStrict, diffInCalendarDays } from '../utils/dateUtils';
import { handleAsyncError } from '../utils/errorHandler';

const LAST_ACTIVE_KEY = '@engagement_last_active_v1';

export async function pingActivity(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, dateToStr(new Date()));
  } catch (e) {
    handleAsyncError('EngagementTracker.ping', e);
  }
}

export async function getInactivityDays(): Promise<number> {
  try {
    const last = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    if (!last) return 0;
    const parsed = parseLocalDateStrict(last);
    if (!parsed) return 0;
    return Math.max(0, diffInCalendarDays(Date.now(), parsed.getTime()));
  } catch (e) {
    handleAsyncError('EngagementTracker.getInactivity', e);
    return 0;
  }
}

export async function resetEngagement(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
  } catch (e) {
    handleAsyncError('EngagementTracker.reset', e);
  }
}
