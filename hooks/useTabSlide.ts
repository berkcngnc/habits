import { useIsFocused, useNavigationState } from '@react-navigation/native';
import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  cancelAnimation,
  Easing,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const OFFSCREEN_X = 90;
const ENTER_DURATION_X = 600;
const ENTER_DURATION_O = 400;
const ENTER_EASING = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * Animates the screen sliding in whenever the tab gains focus.
 * Added tactile Parallax & Scale effects using Springs.
 */
export function useTabSlide(myTabIndex: number) {
  const isFocused = useIsFocused();
  const routeIndex = useNavigationState(s => s?.index ?? 0);
  const isInitialRender = useRef(true);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useLayoutEffect(() => {
    if (!isFocused) {
      const direction = routeIndex < myTabIndex ? 1 : -1;
      const targetX = direction * OFFSCREEN_X;
      runOnUI(() => {
        'worklet';
        translateX.value = targetX;
        opacity.value = 0;
        scale.value = 0.95;
      })();
    }
  }, []);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    cancelAnimation(translateX);
    cancelAnimation(opacity);
    cancelAnimation(scale);

    if (isFocused) {
      // Manyetik giriş: Spring ile bounce efekti
      translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
      scale.value = withSpring(1, { damping: 20, stiffness: 150 });
      opacity.value = withTiming(1, { duration: ENTER_DURATION_O, easing: ENTER_EASING });
    } else {
      // Çıkışta ekranı geriye it
      const direction = routeIndex < myTabIndex ? 1 : -1;
      translateX.value = direction * OFFSCREEN_X;
      opacity.value = 0;
      scale.value = 0.95;
    }
  }, [isFocused, routeIndex, myTabIndex]);

  return useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));
}
