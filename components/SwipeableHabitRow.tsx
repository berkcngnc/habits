import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useLanguage } from '../context/LanguageContext';

interface SwipeableHabitRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onSwipeOpen?: () => void;
  swipeCloseSignal?: number;
}

export default function SwipeableHabitRow({
  children,
  onDelete,
  onSwipeOpen,
  swipeCloseSignal,
}: SwipeableHabitRowProps) {
  const { t } = useLanguage();
  const translateX = useSharedValue(0);
  const offset = useSharedValue(0);

  useEffect(() => {
    if (swipeCloseSignal && swipeCloseSignal > 0) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  }, [swipeCloseSignal]);

  const triggerHaptic = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
  };

  const notifySwipeOpen = () => {
    onSwipeOpen?.();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onStart(() => {
      offset.value = translateX.value;
    })
    .onChange((e: { translationX: number }) => {
      translateX.value = Math.max(-90, Math.min(0, offset.value + e.translationX));
    })
    .onEnd(() => {
      if (translateX.value < -40) {
        translateX.value = withTiming(-80, { duration: 200 });
        runOnJS(triggerHaptic)();
        runOnJS(notifySwipeOpen)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteIconStyle = useAnimatedStyle(() => {
    const progress = interpolate(translateX.value, [-80, -20, 0], [1, 0.3, 0], Extrapolation.CLAMP);
    const scale = interpolate(translateX.value, [-80, -30, 0], [1, 0.6, 0.3], Extrapolation.CLAMP);
    return { opacity: progress, transform: [{ scale }] };
  });

  const bgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -5 ? 1 : 0,
  }));

  return (
    <View className="relative mb-3 rounded-none overflow-hidden">
      <Animated.View className="absolute inset-0 bg-red-500 rounded-none flex-row justify-end" style={bgStyle}>
        <TouchableOpacity
          onPress={onDelete}
          className="items-center justify-center w-[90px] h-full"
          activeOpacity={0.7}
        >
          <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, deleteIconStyle]}>
            <FontAwesome name="trash" size={20} color="white" />
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-white mt-1.5">{t('delete')}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}

