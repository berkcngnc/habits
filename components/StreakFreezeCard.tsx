import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useColorScheme } from 'nativewind';
import { useHabits } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';
import { useRewardedAd } from '../hooks/useRewardedAd';
import PixelIcon from './PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';

const ICE_BLUE = '#A5F3FC';
const ICE_BLUE_DEEP = '#22D3EE';
const ICE_BLUE_LIGHT = '#0891B2';

type Toast = { kind: 'success' | 'error' | 'info'; text: string } | null;

export default function StreakFreezeCard() {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ice = isDark ? ICE_BLUE : ICE_BLUE_LIGHT;
  const {
    streakFreezes,
    maxStreakFreezes,
    addStreakFreeze,
    freezeFeedback,
    clearFreezeFeedback,
  } = useHabits();
  const [toast, setToast] = useState<Toast>(null);
  const [confetti, setConfetti] = useState(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: Toast) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(next);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  const onReward = useCallback(() => {
    const granted = addStreakFreeze();
    if (granted) {
      setConfetti(c => c + 1);
      showToast({ kind: 'success', text: sanitizeForPixelFont(t('freeze_reward_granted')) });
    }
  }, [addStreakFreeze, showToast, t]);

  const { show, isLoaded, isLoading, hasError, isOnline, isAdsAvailable } =
    useRewardedAd(onReward);

  const isFull = streakFreezes >= maxStreakFreezes;

  const onPress = useCallback(async () => {
    if (isFull) return;
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);

    if (!isAdsAvailable) {
      showToast({ kind: 'error', text: sanitizeForPixelFont(t('freeze_ad_unsupported')) });
      return;
    }
    if (!isOnline) {
      showToast({ kind: 'error', text: sanitizeForPixelFont(t('freeze_ad_no_internet')) });
      return;
    }
    if (!isLoaded) {
      showToast({
        kind: 'info',
        text: hasError ? sanitizeForPixelFont(t('freeze_ad_failed')) : sanitizeForPixelFont(t('freeze_ad_loading')),
      });
      return;
    }

    const result = await show();
    if (!result.ok) {
      const text =
        result.reason === 'no_internet'
          ? sanitizeForPixelFont(t('freeze_ad_no_internet'))
          : result.reason === 'unsupported'
            ? sanitizeForPixelFont(t('freeze_ad_unsupported'))
            : sanitizeForPixelFont(t('freeze_ad_failed'));
      showToast({ kind: 'error', text });
    }
  }, [isFull, isAdsAvailable, isOnline, isLoaded, hasError, show, showToast, t]);

  const buttonLabel = useMemo(() => {
    if (isFull) return toPixelUpper(t('freeze_limit_full'));
    if (!isOnline) return toPixelUpper(t('freeze_ad_no_internet_short'));
    if (isLoading && !isLoaded) return toPixelUpper(t('freeze_ad_loading'));
    if (hasError && !isLoaded) return toPixelUpper(t('freeze_ad_retry'));
    return toPixelUpper(t('watch_ad_get_freeze'));
  }, [isFull, isOnline, isLoading, isLoaded, hasError, t]);

  const buttonDisabled = isFull;

  const slots = useMemo(
    () => Array.from({ length: maxStreakFreezes }).map((_, i) => i < streakFreezes),
    [streakFreezes, maxStreakFreezes]
  );

  return (
    <View
      style={{
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderWidth: 3,
        borderTopColor: isDark ? '#475569' : '#cbd5e1',
        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
        borderBottomColor: isDark ? '#0f172a' : '#475569',
        borderRightColor: isDark ? '#0f172a' : '#475569',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* faint cyan top border accent */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 2,
          backgroundColor: ice,
          opacity: isDark ? 0.25 : 0.40,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 36, height: 36, borderRadius: 6,
            backgroundColor: isDark ? 'rgba(165,243,252,0.10)' : 'rgba(8,145,178,0.10)',
            borderWidth: 2,
            borderTopColor: isDark ? '#a5f3fc' : '#22d3ee',
            borderLeftColor: isDark ? '#a5f3fc' : '#22d3ee',
            borderBottomColor: isDark ? '#0e7490' : '#0891b2',
            borderRightColor: isDark ? '#0e7490' : '#0891b2',
            alignItems: 'center', justifyContent: 'center', marginRight: 10,
          }}
        >
          <PixelIcon name="Snowflake" color={ice} size={18} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'PressStart2P', color: isDark ? '#fafafa' : '#111827', fontSize: 10, lineHeight: 12 }}>
            {toPixelUpper(t('streak_freeze_title'))}
          </Text>
          <Text style={{ fontFamily: 'VT323', color: isDark ? '#71717a' : '#6b7280', fontSize: 14, marginTop: 1 }}>
            {sanitizeForPixelFont(t('streak_freeze_subtitle'))}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
            backgroundColor: isDark ? 'rgba(165,243,252,0.10)' : 'rgba(8,145,178,0.10)',
            borderWidth: 2,
            borderTopColor: isDark ? '#a5f3fc' : '#22d3ee',
            borderLeftColor: isDark ? '#a5f3fc' : '#22d3ee',
            borderBottomColor: isDark ? '#0e7490' : '#0891b2',
            borderRightColor: isDark ? '#0e7490' : '#0891b2',
          }}
        >
          <Text style={{ fontFamily: 'PressStart2P', color: ice, fontSize: 8 }}>
            {streakFreezes}/{maxStreakFreezes}
          </Text>
        </View>
      </View>

      {/* Auto-consume status indicator */}
      {freezeFeedback && (
        <View
          style={{
            backgroundColor: isDark ? 'rgba(165,243,252,0.08)' : 'rgba(8,145,178,0.07)',
            borderWidth: 2,
            borderTopColor: isDark ? '#a5f3fc' : '#22d3ee',
            borderLeftColor: isDark ? '#a5f3fc' : '#22d3ee',
            borderBottomColor: isDark ? '#0e7490' : '#0891b2',
            borderRightColor: isDark ? '#0e7490' : '#0891b2',
            borderRadius: 6,
            paddingVertical: 9,
            paddingHorizontal: 11,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View style={{ marginRight: 8 }}>
            <PixelIcon name="Shield" color={ice} size={14} />
          </View>
          <Text style={{ fontFamily: 'VT323', color: isDark ? '#e0f7fa' : '#0e7490', fontSize: 16, flex: 1, lineHeight: 18 }}>
            {sanitizeForPixelFont(t('freeze_auto_used', {
              habit: freezeFeedback.habitTitle,
              count: String(freezeFeedback.daysSaved),
            }))}
          </Text>
          <Pressable
            onPress={clearFreezeFeedback}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}
          >
            <PixelIcon name="Close" size={12} color={isDark ? '#a1a1aa' : '#9ca3af'} />
          </Pressable>
        </View>
      )}

      {/* Slots */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        {slots.map((filled, i) => (
          <FreezeSlot key={i} filled={filled} isDark={isDark} ice={ice} />
        ))}
      </View>

      {/* CTA Button */}
      <Pressable
        onPress={onPress}
        disabled={buttonDisabled}
        style={({ pressed }) => ({
          opacity: buttonDisabled ? 0.55 : pressed ? 0.85 : 1,
          backgroundColor: isFull
            ? (isDark ? 'rgba(63,63,70,0.6)' : '#f3f4f6')
            : (isDark ? 'rgba(165,243,252,0.12)' : 'rgba(8,145,178,0.08)'),
          borderWidth: 2,
          borderTopColor: isFull
            ? (isDark ? '#52525b' : '#cbd5e1')
            : (isDark ? '#a5f3fc' : '#22d3ee'),
          borderLeftColor: isFull
            ? (isDark ? '#52525b' : '#cbd5e1')
            : (isDark ? '#a5f3fc' : '#22d3ee'),
          borderBottomColor: isFull
            ? (isDark ? '#18181b' : '#71717a')
            : (isDark ? '#0e7490' : '#0891b2'),
          borderRightColor: isFull
            ? (isDark ? '#18181b' : '#71717a')
            : (isDark ? '#0e7490' : '#0891b2'),
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <View style={{ marginRight: 6 }}>
          <PixelIcon
            name={isFull ? 'CheckSquare' : 'Star'}
            color={isFull ? (isDark ? '#a1a1aa' : '#9ca3af') : ice}
            size={16}
          />
        </View>
        <Text
          style={{
            fontFamily: 'PressStart2P',
            color: isFull ? (isDark ? '#a1a1aa' : '#9ca3af') : ice,
            fontSize: 9,
            lineHeight: 12,
          }}
        >
          {buttonLabel}
        </Text>
      </Pressable>

      {/* Inline toast */}
      {toast && (
        <View
          style={{
            marginTop: 10,
            backgroundColor:
              toast.kind === 'success'
                ? (isDark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.08)')
                : toast.kind === 'error'
                  ? (isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.08)')
                  : (isDark ? 'rgba(165,243,252,0.10)' : 'rgba(8,145,178,0.08)'),
            borderWidth: 2,
            borderTopColor:
              toast.kind === 'success'
                ? 'rgba(34,197,94,0.35)'
                : toast.kind === 'error'
                  ? 'rgba(239,68,68,0.35)'
                  : (isDark ? 'rgba(165,243,252,0.35)' : 'rgba(8,145,178,0.35)'),
            borderLeftColor:
              toast.kind === 'success'
                ? 'rgba(34,197,94,0.35)'
                : toast.kind === 'error'
                  ? 'rgba(239,68,68,0.35)'
                  : (isDark ? 'rgba(165,243,252,0.35)' : 'rgba(8,145,178,0.35)'),
            borderBottomColor:
              toast.kind === 'success'
                ? 'rgba(20,83,45,0.35)'
                : toast.kind === 'error'
                  ? 'rgba(127,29,29,0.35)'
                  : (isDark ? 'rgba(8,145,178,0.35)' : 'rgba(8,145,178,0.35)'),
            borderRightColor:
              toast.kind === 'success'
                ? 'rgba(20,83,45,0.35)'
                : toast.kind === 'error'
                  ? 'rgba(127,29,29,0.35)'
                  : (isDark ? 'rgba(8,145,178,0.35)' : 'rgba(8,145,178,0.35)'),
            borderRadius: 6,
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{
              fontFamily: 'VT323',
              color:
                toast.kind === 'success'
                  ? (isDark ? '#86efac' : '#15803d')
                  : toast.kind === 'error'
                    ? (isDark ? '#fca5a5' : '#b91c1c')
                    : ice,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {sanitizeForPixelFont(toast.text)}
          </Text>
        </View>
      )}

      {confetti > 0 && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <ConfettiCannon
            key={confetti}
            count={70}
            origin={{ x: 160, y: -10 }}
            fadeOut
            fallSpeed={2600}
            explosionSpeed={350}
            colors={[ICE_BLUE, ICE_BLUE_DEEP, '#67E8F9', '#FFFFFF']}
          />
        </View>
      )}
    </View>
  );
}

function FreezeSlot({ filled, isDark, ice }: { filled: boolean; isDark: boolean; ice: string }) {
  const glow = useSharedValue(filled ? 1 : 0);

  React.useEffect(() => {
    if (filled) {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.55, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [filled, glow]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: filled ? 0.5 + 0.5 * glow.value : 0.45,
    transform: [{ scale: filled ? 1 + 0.04 * glow.value : 1 }],
  }));

  return (
    <View
      style={{
        flex: 1,
        marginHorizontal: 4,
        aspectRatio: 1.2,
        borderRadius: 8,
        borderWidth: 2,
        borderTopColor: filled
          ? (isDark ? '#a5f3fc' : '#22d3ee')
          : (isDark ? '#3f3f46' : '#e2e8f0'),
        borderLeftColor: filled
          ? (isDark ? '#a5f3fc' : '#22d3ee')
          : (isDark ? '#3f3f46' : '#e2e8f0'),
        borderBottomColor: filled
          ? (isDark ? '#0e7490' : '#0891b2')
          : (isDark ? '#09090b' : '#94a3b8'),
        borderRightColor: filled
          ? (isDark ? '#0e7490' : '#0891b2')
          : (isDark ? '#09090b' : '#94a3b8'),
        backgroundColor: filled
          ? (isDark ? 'rgba(165,243,252,0.08)' : 'rgba(8,145,178,0.07)')
          : (isDark ? 'rgba(24,24,27,0.4)' : '#f9fafb'),
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {filled ? (
        <Animated.View style={animStyle}>
          <PixelIcon name="Snowflake" color={ice} size={28} />
        </Animated.View>
      ) : (
        <PixelIcon
          name="Snowflake"
          color={isDark ? 'rgba(113,113,122,0.35)' : '#cbd5e1'}
          size={24}
        />
      )}
      {filled && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 8,
            shadowColor: ice,
            shadowOpacity: 0.5,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
    </View>
  );
}
