// Widget task handler must be imported before expo-router/entry so that
// registerWidgetTaskHandler runs before Android fires headless widget tasks.
import './widget/widgetTaskHandler';
import 'expo-router/entry';
