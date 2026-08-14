import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Text, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

interface BannerData {
  id: number;
  title: string;
  body: string;
  notifId?: string;
}

const AUTO_HIDE_MS = 5000;

export function InAppNotification() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = useMemo(
    () =>
      isDark
        ? {
            bg: '#1e293b', // slate-800
            border: '#1e293b',
            iconBg: 'rgba(59,130,246,0.18)',
            iconBorder: '#1e293b',
            iconColor: '#60a5fa',
            title: '#fafafa',
            body: '#d1d5db',
          }
        : {
            bg: '#ffffff',
            border: '#1e293b',
            iconBg: 'rgba(59,130,246,0.10)',
            iconBorder: '#1e293b',
            iconColor: '#3b82f6',
            title: '#111827',
            body: '#4b5563',
          },
    [isDark],
  );
  const [banner, setBanner] = useState<BannerData | null>(null);
  const idRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const startY = useSharedValue(0);

  const clearBanner = useCallback(() => setBanner(null), []);

  const dismiss = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    translateY.value = withTiming(-200, { duration: 220 });
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(clearBanner)();
    });
  }, [opacity, translateY, clearBanner]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationReceivedListener((notif) => {
      const content = notif.request.content;
      const next: BannerData = {
        id: ++idRef.current,
        title: content.title ?? '',
        body: content.body ?? '',
        notifId: notif.request.identifier,
      };
      setBanner(next);
      translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      opacity.value = withTiming(1, { duration: 220 });
      
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => dismiss(), AUTO_HIDE_MS);
    });
    return () => {
      sub.remove();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [dismiss, opacity, translateY]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      translateY.value = next > 0 ? next * 0.3 : next;
    })
    .onEnd((e) => {
      if (e.translationY < -30 || e.velocityY < -500) {
        translateY.value = withTiming(-200, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(clearBanner)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!banner) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          right: 12,
          zIndex: 9999,
        },
        animStyle,
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={{
            backgroundColor: theme.bg,
            borderRadius: 8,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 3,
            borderColor: theme.border,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#0f172a',
            shadowOpacity: 1,
            shadowRadius: 0,
            shadowOffset: { width: 3, height: 3 },
            elevation: 8,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: theme.iconBg,
              borderWidth: 2,
              borderColor: theme.iconBorder,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <FontAwesome name="bell" size={14} color={theme.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            {!!banner.title && (
              <Text numberOfLines={1} style={{ color: theme.title, fontSize: 10, fontFamily: 'PressStart2P' }}>
                {banner.title}
              </Text>
            )}
            {!!banner.body && (
              <Text numberOfLines={2} style={{ color: theme.body, fontSize: 16, marginTop: 4, fontFamily: 'VT323', lineHeight: 18 }}>
                {banner.body}
              </Text>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default InAppNotification;

