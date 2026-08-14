import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const safeHaptics = {
  impact: (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(style).catch((err) => {
        if (__DEV__) console.warn('Haptics.impactAsync failed:', err);
      });
    } catch (err) {
      if (__DEV__) console.warn('Haptics.impactAsync threw error:', err);
    }
  },
  notification: (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(type).catch((err) => {
        if (__DEV__) console.warn('Haptics.notificationAsync failed:', err);
      });
    } catch (err) {
      if (__DEV__) console.warn('Haptics.notificationAsync threw error:', err);
    }
  },
  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.selectionAsync().catch((err) => {
        if (__DEV__) console.warn('Haptics.selectionAsync failed:', err);
      });
    } catch (err) {
      if (__DEV__) console.warn('Haptics.selectionAsync threw error:', err);
    }
  }
};
