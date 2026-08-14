import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '../context/LanguageContext';
import { usePomodoro } from '../context/PomodoroContext';
import { OverlayModal } from './OverlayModal';
import PixelIcon from './PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';

export default function PomodoroModal() {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { 
    showModal, 
    setShowModal, 
    isActive, 
    isPaused, 
    mode, 
    timeRemaining,
    workDuration,
    breakDuration,
    setWorkDuration,
    setBreakDuration,
    startTimer,
    pauseTimer,
    stopTimer
  } = usePomodoro();

  const [setupMode, setSetupMode] = useState(!isActive);

  // When opening while active, ensure we see the timer not setup
  React.useEffect(() => {
    if (showModal) {
      if (isActive || isPaused) setSetupMode(false);
      else setSetupMode(true);
    }
  }, [showModal, isActive, isPaused]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    setSetupMode(false);
    startTimer();
  };

  const handlePause = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    pauseTimer();
  };

  const handleResume = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    startTimer();
  };

  const handleStop = () => {
    safeHaptics.notification(Haptics.NotificationFeedbackType.Warning);
    stopTimer();
    setSetupMode(true);
  };

  const changeDuration = (type: 'work' | 'break', amount: number) => {
    safeHaptics.selection();
    if (type === 'work') {
      const newD = Math.max(1, Math.min(120, workDuration + amount));
      setWorkDuration(newD);
    } else {
      const newD = Math.max(1, Math.min(60, breakDuration + amount));
      setBreakDuration(newD);
    }
  };

  return (
    <OverlayModal visible={showModal} onDismiss={() => setShowModal(false)}>
      <View
        className="bg-white dark:bg-zinc-900 w-full rounded-lg p-6 items-center"
        style={{
          borderWidth: 4,
          borderTopColor: isDark ? '#475569' : '#e2e8f0',
          borderLeftColor: isDark ? '#475569' : '#e2e8f0',
          borderBottomColor: isDark ? '#0f172a' : '#475569',
          borderRightColor: isDark ? '#0f172a' : '#475569',
        }}
      >
        <View className="absolute right-3 top-3">
          <TouchableOpacity onPress={() => setShowModal(false)} className="p-2">
            <PixelIcon name="Close" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        <View className="mb-4 mt-2">
          <PixelIcon name="Clock" size={32} color={mode === 'work' ? '#ef4444' : '#3b82f6'} />
        </View>

        <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-white mb-6 text-center tracking-tight">
          {toPixelUpper(t('pomodoro_title'))}
        </Text>

        {setupMode ? (
          <View className="w-full">
            {/* Work Duration */}
            <View className="mb-5 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border-2 border-gray-200 dark:border-zinc-700">
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-gray-600 dark:text-gray-400 mb-2 text-center">
                {sanitizeForPixelFont(t('pomodoro_work_duration'))}
              </Text>
              <View className="flex-row items-center justify-between px-4">
                <TouchableOpacity onPress={() => changeDuration('work', -5)} className="p-2 bg-gray-200 dark:bg-zinc-700 rounded-md border-2 border-gray-300 dark:border-zinc-600">
                  <PixelIcon name="Minus" size={14} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 18 }} className="text-gray-800 dark:text-white">
                  {workDuration}
                </Text>
                <TouchableOpacity onPress={() => changeDuration('work', 5)} className="p-2 bg-gray-200 dark:bg-zinc-700 rounded-md border-2 border-gray-300 dark:border-zinc-600">
                  <PixelIcon name="Plus" size={14} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Break Duration */}
            <View className="mb-6 bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-lg border-2 border-gray-200 dark:border-zinc-700">
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-gray-600 dark:text-gray-400 mb-2 text-center">
                {sanitizeForPixelFont(t('pomodoro_break_duration'))}
              </Text>
              <View className="flex-row items-center justify-between px-4">
                <TouchableOpacity onPress={() => changeDuration('break', -1)} className="p-2 bg-gray-200 dark:bg-zinc-700 rounded-md border-2 border-gray-300 dark:border-zinc-600">
                  <PixelIcon name="Minus" size={14} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 18 }} className="text-gray-800 dark:text-white">
                  {breakDuration}
                </Text>
                <TouchableOpacity onPress={() => changeDuration('break', 1)} className="p-2 bg-gray-200 dark:bg-zinc-700 rounded-md border-2 border-gray-300 dark:border-zinc-600">
                  <PixelIcon name="Plus" size={14} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleStart}
              className="w-full py-4 rounded-lg items-center bg-green-500"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#22c55e' : '#4ade80',
                borderLeftColor: isDark ? '#22c55e' : '#4ade80',
                borderBottomColor: isDark ? '#14532d' : '#166534',
                borderRightColor: isDark ? '#14532d' : '#166534',
              }}
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="font-bold text-white">
                {toPixelUpper(t('pomodoro_start'))}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-full items-center">
            {/* Timer Display */}
            <Text style={{ fontFamily: 'VT323', fontSize: 24 }} className={`mb-2 ${mode === 'work' ? 'text-red-500' : 'text-blue-500'} font-bold`}>
              {mode === 'work' ? sanitizeForPixelFont(t('pomodoro_work_mode')) : sanitizeForPixelFont(t('pomodoro_break_mode'))}
            </Text>
            <View className="w-48 h-48 rounded-full border-8 items-center justify-center mb-6" style={{ borderColor: mode === 'work' ? '#ef4444' : '#3b82f6' }}>
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 32 }} className="text-gray-900 dark:text-white mt-3">
                {formatTime(timeRemaining)}
              </Text>
            </View>

            {/* Controls */}
            <View className="flex-row gap-4 w-full px-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleStop}
                className="flex-1 py-3.5 rounded-lg items-center bg-gray-100 dark:bg-zinc-800"
                style={{
                  borderWidth: 2,
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-semibold text-gray-600 dark:text-gray-300">
                  {toPixelUpper(t('pomodoro_stop'))}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={isPaused ? handleResume : handlePause}
                className={`flex-1 py-3.5 rounded-lg items-center ${isPaused ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{
                  borderWidth: 2,
                  borderTopColor: isPaused ? (isDark ? '#22c55e' : '#4ade80') : (isDark ? '#f97316' : '#fb923c'),
                  borderLeftColor: isPaused ? (isDark ? '#22c55e' : '#4ade80') : (isDark ? '#f97316' : '#fb923c'),
                  borderBottomColor: isPaused ? (isDark ? '#14532d' : '#166534') : (isDark ? '#7c2d12' : '#9a3412'),
                  borderRightColor: isPaused ? (isDark ? '#14532d' : '#166534') : (isDark ? '#7c2d12' : '#9a3412'),
                }}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-bold text-white">
                  {isPaused ? toPixelUpper(t('pomodoro_start')) : toPixelUpper(t('pomodoro_pause'))}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </OverlayModal>
  );
}
