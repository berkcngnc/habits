import React from 'react';
import { Platform } from 'react-native';
import {
  registerWidgetTaskHandler,
  requestWidgetUpdate,
  type WidgetTaskHandlerProps,
} from 'react-native-android-widget';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { HabitsWidget } from './HabitsWidget';
import { loadWidgetSnapshot } from './widgetSync';
import { selectContent } from './selectContent';
import { loadHistory, pushHistory } from './historyQueue';

// ─── Headless widget task handler (system-triggered) ────────────────

const nameToWidget = {
  HabitsWidget,
};

async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction } = props;
  const Widget = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];
  if (!Widget) return;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const snapshot = await loadWidgetSnapshot();
      const history = snapshot ? await loadHistory() : [];
      // Pre-select up to 6 (the largest grid: 2×3). HabitsWidget slices to the
      // active grid's total via paneGridForSize internally.
      const allContents = snapshot
        ? selectContent(snapshot, history, 6)
        : [];

      // Resize-only redraws should not advance the history (the user didn't
      // really see new content; the widget just reflowed).
      if (allContents.length > 0 && widgetAction !== 'WIDGET_RESIZED') {
        await pushHistory(allContents.map((c) => c.id), history);
      }

      props.renderWidget(
        <Widget info={widgetInfo} snapshot={snapshot} contents={allContents} />,
      );
      break;
    }
    case 'WIDGET_DELETED':
      break;
    case 'WIDGET_CLICK':
      // OPEN_APP clickAction is handled natively; no JS work needed here.
      break;
  }
}

if (Platform.OS === 'android') {
  registerWidgetTaskHandler(widgetTaskHandler);
}

// ─── WorkManager periodic background refresh (Android only) ─────────
//
// Runs approximately every 15 minutes even when the app is closed.
// Reads the last persisted snapshot and redraws all widget instances so
// time-sensitive content (money saved, clean-streak day count, daily
// progress) stays reasonably fresh without requiring the app to be open.

export const WIDGET_PERIODIC_TASK = 'widget-periodic-refresh';

if (Platform.OS === 'android') {
  TaskManager.defineTask(WIDGET_PERIODIC_TASK, async () => {
    try {
      const snapshot = await loadWidgetSnapshot();
      if (!snapshot) return BackgroundTask.BackgroundTaskResult.Success;

      const history = await loadHistory();
      const allContents = selectContent(snapshot, history, 6);
      if (allContents.length > 0) {
        await pushHistory(allContents.map((c) => c.id), history);
      }

      await requestWidgetUpdate({
        widgetName: 'HabitsWidget',
        renderWidget: (info) =>
          React.createElement(HabitsWidget, {
            info,
            snapshot,
            contents: allContents,
          }),
        widgetNotFound: () => {},
      });

      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}
