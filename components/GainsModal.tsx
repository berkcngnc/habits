import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Habit } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';
import { getDaysSince } from '../utils/dateUtils';
import { OverlayModal } from './OverlayModal';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';

interface GainsModalProps {
  habitId: string | null;
  habits: Habit[];
  currency: string;
  onClose: () => void;
}

export default function GainsModal({ habitId, habits, currency, onClose }: GainsModalProps) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const habit = habits.find(h => h.id === habitId);

  if (!habit) return null;

  const daysClean = getDaysSince(habit.startDate);
  const moneySaved = (habit.costPerDay || 0) * daysClean;
  const totalMinsSaved = (habit.timePerDay || 0) * daysClean;
  const hoursSaved = Math.floor(totalMinsSaved / 60);
  const minsSaved = totalMinsSaved % 60;

  let healthMsg = t('health_default');
  if (daysClean >= 90) healthMsg = t('health_90d');
  else if (daysClean >= 30) healthMsg = t('health_30d');
  else if (daysClean >= 14) healthMsg = t('health_14d');
  else if (daysClean >= 7) healthMsg = t('health_7d');
  else if (daysClean >= 3) healthMsg = t('health_3d');
  else if (daysClean >= 1) healthMsg = t('health_1d');

  return (
    <OverlayModal visible={!!habitId} onDismiss={onClose}>
      <View
        className="bg-white dark:bg-zinc-900 w-full rounded-lg p-7"
        style={{
          borderWidth: 4,
          borderTopColor: isDark ? '#475569' : '#e2e8f0',
          borderLeftColor: isDark ? '#475569' : '#e2e8f0',
          borderBottomColor: isDark ? '#0f172a' : '#475569',
          borderRightColor: isDark ? '#0f172a' : '#475569',
          shadowColor: '#0f172a',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4
        }}
      >
        <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-white mb-2">
          {toPixelUpper(t('gains_title'))}
        </Text>
        <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-gray-400 mb-5">
          {sanitizeForPixelFont(habit.title)} • {daysClean} {sanitizeForPixelFont(t('days_free'))}
        </Text>

        {(habit.costPerDay || 0) > 0 && (
          <View
            className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-3"
            style={{
              borderWidth: 2,
              borderTopColor: isDark ? '#1e3a8a' : '#cbd5e1',
              borderLeftColor: isDark ? '#1e3a8a' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
            }}
          >
            <Text className="text-2xl mr-3">💰</Text>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-blue-600 dark:text-blue-400 mb-1">
                {toPixelUpper(t('money_saved'))}
              </Text>
              <Text style={{ fontFamily: 'VT323', fontSize: 24 }} className="text-gray-900 dark:text-white font-black">
                {currency}{moneySaved.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {(habit.timePerDay || 0) > 0 && (
          <View
            className="flex-row items-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-md mb-3"
            style={{
              borderWidth: 2,
              borderTopColor: isDark ? '#581c87' : '#cbd5e1',
              borderLeftColor: isDark ? '#581c87' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
            }}
          >
            <Text className="text-2xl mr-3">⏱️</Text>
            <View className="flex-1">
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-purple-600 dark:text-purple-400 mb-1">
                {toPixelUpper(t('time_saved'))}
              </Text>
              <Text style={{ fontFamily: 'VT323', fontSize: 24 }} className="text-gray-900 dark:text-white font-black">
                {hoursSaved > 0 ? `${hoursSaved} ${sanitizeForPixelFont(t('hours_short'))} ` : ''}
                {minsSaved > 0 ? `${minsSaved} ${sanitizeForPixelFont(t('minutes_short'))}` : ''}
              </Text>
            </View>
          </View>
        )}

        <View
          className="flex-row items-center bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-md mb-3"
          style={{
            borderWidth: 2,
            borderTopColor: isDark ? '#064e3b' : '#cbd5e1',
            borderLeftColor: isDark ? '#064e3b' : '#cbd5e1',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
          }}
        >
          <Text className="text-2xl mr-3">❤️</Text>
          <View className="flex-1">
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-emerald-600 dark:text-emerald-400 mb-1">
              {toPixelUpper(t('health_status'))}
            </Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-900 dark:text-white font-semibold leading-5">
              {sanitizeForPixelFont(healthMsg)}
            </Text>
          </View>
        </View>

        {((habit.relapseHistory?.length || 0) > 0 || (habit.bestCleanStreak || 0) > 0) && (
          <View className="flex-row gap-3 mt-1 mb-3">
            <View
              className="flex-1 bg-gray-50 dark:bg-zinc-800 p-3 rounded-md items-center"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              }}
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 7, textAlign: 'center' }} className="text-gray-400 mb-1">
                {toPixelUpper(t('best_clean'))}
              </Text>
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-gray-900 dark:text-white font-bold">
                {habit.bestCleanStreak || 0}
              </Text>
            </View>
            <View
              className="flex-1 bg-gray-50 dark:bg-zinc-800 p-3 rounded-md items-center"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              }}
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 7, textAlign: 'center' }} className="text-gray-400 mb-1">
                {toPixelUpper(t('total_relapses'))}
              </Text>
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-gray-900 dark:text-white font-bold">
                {habit.relapseHistory?.length || 0}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={onClose}
          className="bg-gray-100 dark:bg-zinc-800 py-3.5 rounded-lg items-center mt-2"
          style={{
            borderWidth: 2,
            borderTopColor: isDark ? '#475569' : '#cbd5e1',
            borderLeftColor: isDark ? '#475569' : '#cbd5e1',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
          }}
        >
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-semibold text-gray-600 dark:text-gray-300">
            {toPixelUpper(t('cancel'))}
          </Text>
        </TouchableOpacity>
      </View>
    </OverlayModal>
  );
}
