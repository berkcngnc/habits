import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import React from 'react';
import { HabitsWidget } from './HabitsWidget';
import type { WidgetSnapshot } from './snapshot';
import { WIDGET_SNAPSHOT_VERSION } from './snapshot';
import { selectContent } from './selectContent';
import { loadHistory, pushHistory } from './historyQueue';

export const WIDGET_SNAPSHOT_KEY = '@widget_snapshot_v1';

// Migration chain: maps from version number to a transform function.
// Return null to signal "cannot migrate; discard and regenerate."
// Add entries here when WIDGET_SNAPSHOT_VERSION is bumped.
const SNAPSHOT_MIGRATIONS: Record<number, (old: Record<string, unknown>) => Record<string, unknown> | null> = {
  // v1 → v2: removed bestStreak from user; added isValidToday to positiveHabits.
  // isValidToday can't be reconstructed without the full habits list,
  // so we discard the stale snapshot and let the next sync rebuild it.
  1: () => null,
};

function migrateSnapshot(parsed: unknown): WidgetSnapshot | null {
  if (!parsed || typeof parsed !== 'object') return null;
  let obj = parsed as Record<string, unknown>;
  let v = typeof obj.v === 'number' ? obj.v : -1;

  while (v < WIDGET_SNAPSHOT_VERSION) {
    const migrate = SNAPSHOT_MIGRATIONS[v];
    if (!migrate) return null;
    const next = migrate(obj);
    if (!next) return null;
    obj = next;
    v++;
  }

  if (v !== WIDGET_SNAPSHOT_VERSION) return null;
  return obj as unknown as WidgetSnapshot;
}

export async function loadWidgetSnapshot(): Promise<WidgetSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (!raw) return null;
    return migrateSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function persistWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (e) {
    if (__DEV__) console.warn('[widget] persist snapshot failed', e);
  }
}

/**
 * Persist the snapshot and trigger a re-render of every active widget instance.
 * No-op on non-Android platforms.
 */
export async function syncWidget(snapshot: WidgetSnapshot): Promise<void> {
  if (Platform.OS !== 'android') return;
  await persistWidgetSnapshot(snapshot);

  // Pre-select up to 6 contents (largest grid: 2×3). Each widget instance
  // will slice this array to its own grid total inside renderWidget, so
  // instances of different sizes all get the best-fit set of cards from the
  // same rotation tick. History advances by the number selected here.
  const history = await loadHistory();
  const allContents = selectContent(snapshot, history, 6);
  if (allContents.length > 0) {
    await pushHistory(allContents.map((c) => c.id), history);
  }

  try {
    await requestWidgetUpdate({
      widgetName: 'HabitsWidget',
      renderWidget: (info) =>
        React.createElement(HabitsWidget, { info, snapshot, contents: allContents }),
      widgetNotFound: () => {
        // No instances on the home screen — nothing to redraw.
      },
    });
  } catch (e) {
    if (__DEV__) console.warn('[widget] requestWidgetUpdate failed', e);
  }
}
