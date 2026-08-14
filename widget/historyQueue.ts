import AsyncStorage from '@react-native-async-storage/async-storage';

export const HISTORY_KEY = '@widget_history_v1';

/** Soft cap — selectContent only looks back HISTORY_LOOKBACK ids; we keep a
 *  little extra so a quick succession of resizes doesn't lose context. */
const MAX_HISTORY = 10;

export async function loadHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

/**
 * Append newIds to the history queue. Pass `current` when the caller already
 * holds a freshly-loaded history (avoids a second AsyncStorage read).
 */
export async function pushHistory(newIds: string[], current?: string[]): Promise<void> {
  if (newIds.length === 0) return;
  try {
    const base = current ?? await loadHistory();
    const next = [...base, ...newIds].slice(-MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (e) {
    if (__DEV__) console.warn('[widget] pushHistory failed', e);
  }
}

export async function resetHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {}
}
