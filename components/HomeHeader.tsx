import React, { useEffect, useMemo } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { MotivationState } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';
import { InfoButton } from './InfoBubble';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';
import PixelIcon from './PixelIcons';

interface HomeHeaderProps {
  motivationState: MotivationState;
  level: number;
  xp: number;
  currentLevelProgress: number;
  onInfoPress: () => void;
  onPomodoroPress: () => void;
}

function HomeHeader({
  motivationState,
  level,
  xp,
  currentLevelProgress,
  onInfoPress,
  onPomodoroPress,
}: HomeHeaderProps) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return t('greet_night');
    if (h < 12) return t('greet_morning');
    if (h < 18) return t('greet_afternoon');
    return t('greet_evening');
  }, [t]);

  const isNightTime = useMemo(() => {
    const h = new Date().getHours();
    return h < 6 || h >= 18;
  }, []);

  const cleanGreeting = useMemo(() => {
    return sanitizeForPixelFont(greeting)
      .replace('👋', '')
      .replace('🌙', '')
      .trim();
  }, [greeting]);

  const cleanMotivationText = useMemo(() => {
    const raw = motivationState === 'perfect'
      ? t('unstoppable')
      : motivationState === 'recovering'
      ? t('strong_start')
      : t('complete_goals');
    return sanitizeForPixelFont(raw)
      .replace('💪', '')
      .replace('🔥', '')
      .replace('🛡️', '')
      .trim();
  }, [motivationState, t]);

  const progressAnim = useSharedValue(currentLevelProgress);

  useEffect(() => {
    progressAnim.value = withTiming(currentLevelProgress, { duration: 600 });
  }, [currentLevelProgress]);

  // Explicit unmount cleanup so a tab-switch mid-animation doesn't leave
  // a worklet running on the UI thread.
  useEffect(() => {
    return () => {
      cancelAnimation(progressAnim);
    };
  }, [progressAnim]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value}%`,
  }));

  return (
    <View>
      {/* Top Bar — Greeting · Info · Level (tek satır, simetrik) */}
      <View className="flex-row items-center justify-between mb-6">
        {/* Selamlama Pili */}
        <View
          className="flex-row items-center bg-white dark:bg-zinc-900 border-4 rounded-lg pl-3 pr-4 py-2"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 2
          }}
          accessible
          accessibilityLabel={greeting}
        >
          <View style={{ marginRight: 6 }}>
            {isNightTime ? (
              <PixelIcon name="Moon" color={isDark ? '#a5f3fc' : '#0891b2'} size={14} />
            ) : (
              <PixelIcon name="Star" color="#eab308" size={14} />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'VT323', fontSize: 18, lineHeight: 20, maxWidth: 140 }}
            className="text-gray-700 dark:text-zinc-200 font-bold tracking-wide"
          >
            {cleanGreeting}
          </Text>
        </View>

        {/* Sağ küme — Pomodoro + Info + Level Pili */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPomodoroPress}
            className="w-10 h-10 rounded-full items-center justify-center bg-red-100 dark:bg-red-900/30"
            style={{
              borderWidth: 2,
              borderTopColor: isDark ? '#475569' : '#fca5a5',
              borderLeftColor: isDark ? '#475569' : '#fca5a5',
              borderBottomColor: isDark ? '#0f172a' : '#b91c1c',
              borderRightColor: isDark ? '#0f172a' : '#b91c1c',
            }}
          >
            <PixelIcon name="Clock" size={18} color="#ef4444" />
          </TouchableOpacity>
          <InfoButton onPress={onInfoPress} accessibilityLabel={t('info_btn')} />
          <View
            className="flex-row items-center bg-white dark:bg-zinc-900 border-4 rounded-lg pl-3 pr-3.5 py-1.5"
            style={{
              borderTopColor: isDark ? '#475569' : '#e2e8f0',
              borderLeftColor: isDark ? '#475569' : '#e2e8f0',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              shadowColor: '#0f172a',
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 2
            }}
            accessible
            accessibilityLabel={`${t('level')} ${level}`}
          >
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-gray-500 dark:text-zinc-400 font-bold mr-2">
              {toPixelUpper(t('level'))}
            </Text>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-indigo-600 dark:text-indigo-400 font-extrabold">{level}</Text>
          </View>
        </View>
      </View>

      {/* Hero — Motivasyon */}
      <View className="mb-7 flex-row items-center flex-wrap gap-x-2 gap-y-1">
        <View style={{ width: '100%' }}>
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold tracking-[3px] mb-1.5">
            {toPixelUpper(t('today'))}
          </Text>
        </View>
        <Text
          numberOfLines={2}
          style={{ fontFamily: 'VT323', fontSize: 32, lineHeight: 34 }}
          className="text-gray-900 dark:text-zinc-100 font-bold tracking-tight"
        >
          {cleanMotivationText}
        </Text>
        <View style={{ marginLeft: 2, marginTop: -4 }}>
          {motivationState === 'perfect' ? (
            <PixelIcon name="Fire" color="#f97316" size={26} />
          ) : motivationState === 'recovering' ? (
            <PixelIcon name="Shield" color="#3b82f6" size={26} />
          ) : (
            <PixelIcon name="Trophy" color="#eab308" size={26} />
          )}
        </View>
      </View>

      {/* XP Progress */}
      <View
        className="bg-white dark:bg-zinc-900 rounded-lg p-5 mb-8 border-4 flex-row items-center justify-between"
        style={{
          borderTopColor: isDark ? '#475569' : '#e2e8f0',
          borderLeftColor: isDark ? '#475569' : '#e2e8f0',
          borderBottomColor: isDark ? '#0f172a' : '#475569',
          borderRightColor: isDark ? '#0f172a' : '#475569',
          shadowColor: '#0f172a',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 3
        }}
        accessible={true}
        accessibilityLabel={`${t('level')} ${level} · ${xp} XP`}
      >
        <View className="flex-1">
          <Text style={{ fontFamily: 'VT323', fontSize: 22 }} className="text-slate-800 dark:text-zinc-100 font-semibold mb-1">{t('xp_progress')}</Text>
          <View
            className="h-4 w-full bg-gray-200 dark:bg-zinc-800 rounded-md border-2 mt-1 overflow-hidden"
            style={{
              borderTopColor: isDark ? '#475569' : '#cbd5e1',
              borderLeftColor: isDark ? '#475569' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
            }}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: currentLevelProgress }}
          >
            <Animated.View className="h-full bg-indigo-500 rounded-none" style={barStyle} />
          </View>
        </View>
        <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-zinc-400 font-bold ml-4">{xp} XP</Text>
      </View>

      {/* Section Title */}
      <View className="mb-5">
        <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-zinc-100 font-bold tracking-tight">
          {toPixelUpper(t('my_habits'))}
        </Text>
      </View>
    </View>
  );
}

export default React.memo(HomeHeader);
