import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Habit } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';
import { getDaysSince } from '../utils/dateUtils';
import { OverlayModal } from './OverlayModal';
import PixelIcon from './PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';

interface RelapseModalProps {
  targetId: string | null;
  habits: Habit[];
  relapseStep: number;
  selectedTrigger: string;
  onSelectTrigger: (trigger: string) => void;
  onCancel: () => void;
  onNextStep: () => void;
  onConfirmRelapse: () => void;
  onFinish: () => void;
}

const TRIGGER_KEYS = [
  'trigger_stress',
  'trigger_social',
  'trigger_boredom',
  'trigger_alcohol',
  'trigger_bad_day',
  'trigger_craving',
  'trigger_habit',
  'trigger_other',
];

export default function RelapseModal({
  targetId,
  habits,
  relapseStep,
  selectedTrigger,
  onSelectTrigger,
  onCancel,
  onNextStep,
  onConfirmRelapse,
  onFinish,
}: RelapseModalProps) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const habit = habits.find(h => h.id === targetId);

  if (targetId && !habit) return null;
  const daysClean = habit ? getDaysSince(habit.startDate) : 0;

  return (
    <OverlayModal visible={!!targetId} onDismiss={onCancel}>
      <View
        className="bg-white dark:bg-zinc-900 w-full rounded-lg p-7 items-center"
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

        {/* STEP 1: Wait & Think */}
        {relapseStep === 1 && (
          <>
            <View
              className="w-16 h-16 rounded-md bg-orange-100 dark:bg-orange-900/40 items-center justify-center mb-4"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              }}
            >
              <PixelIcon name="Exclamation" size={26} color="#f97316" />
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-white mb-3 text-center">
              {toPixelUpper(t('relapse_wait'))}
            </Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">
              {sanitizeForPixelFont(t('relapse_wait_desc', { days: String(daysClean) }))}
            </Text>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onCancel}
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
                  {toPixelUpper(t('give_up'))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onNextStep}
                className="flex-1 py-3.5 rounded-lg items-center bg-orange-500"
                style={{
                  borderWidth: 2,
                  borderTopColor: isDark ? '#f97316' : '#fb923c',
                  borderLeftColor: isDark ? '#f97316' : '#fb923c',
                  borderBottomColor: isDark ? '#7c2d12' : '#ea580c',
                  borderRightColor: isDark ? '#7c2d12' : '#ea580c',
                }}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-bold text-white">
                  {toPixelUpper(t('relapse_confirm_btn'))}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STEP 2: Trigger Selection */}
        {relapseStep === 2 && (
          <>
            <View
              className="w-16 h-16 rounded-md bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center mb-4"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              }}
            >
              <PixelIcon name="Lightbulb" size={26} color="#6366f1" />
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-white mb-3 text-center">
              {toPixelUpper(t('relapse_why'))}
            </Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-gray-400 text-center mb-5 leading-5">
              {sanitizeForPixelFont(t('relapse_why_desc'))}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5 justify-center">
              {TRIGGER_KEYS.map(triggerKey => {
                const val = triggerKey.replace('trigger_', '');
                const isSelected = selectedTrigger === val;
                return (
                  <TouchableOpacity
                    key={triggerKey}
                    onPress={() => onSelectTrigger(val)}
                    className={`px-3 py-2.5 rounded-md ${
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-900/40'
                        : 'bg-gray-50 dark:bg-zinc-800'
                    }`}
                    style={{
                      borderWidth: 2,
                      borderTopColor: isSelected ? (isDark ? '#818cf8' : '#c7d2fe') : (isDark ? '#475569' : '#cbd5e1'),
                      borderLeftColor: isSelected ? (isDark ? '#818cf8' : '#c7d2fe') : (isDark ? '#475569' : '#cbd5e1'),
                      borderBottomColor: isSelected ? (isDark ? '#312e81' : '#4338ca') : (isDark ? '#0f172a' : '#475569'),
                      borderRightColor: isSelected ? (isDark ? '#312e81' : '#4338ca') : (isDark ? '#0f172a' : '#475569'),
                    }}
                  >
                    <Text style={{ fontFamily: 'VT323', fontSize: 16 }} className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {sanitizeForPixelFont(t(triggerKey))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => { onSelectTrigger(''); onCancel(); }}
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
                  {toPixelUpper(t('give_up'))}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onConfirmRelapse}
                disabled={!selectedTrigger}
                className={`flex-1 py-3.5 rounded-lg items-center ${selectedTrigger ? 'bg-orange-500' : 'bg-gray-200 dark:bg-zinc-800'}`}
                style={{
                  borderWidth: 2,
                  borderTopColor: selectedTrigger ? (isDark ? '#f97316' : '#fb923c') : (isDark ? '#3f3f46' : '#e2e8f0'),
                  borderLeftColor: selectedTrigger ? (isDark ? '#f97316' : '#fb923c') : (isDark ? '#3f3f46' : '#e2e8f0'),
                  borderBottomColor: selectedTrigger ? (isDark ? '#7c2d12' : '#ea580c') : (isDark ? '#09090b' : '#cbd5e1'),
                  borderRightColor: selectedTrigger ? (isDark ? '#7c2d12' : '#ea580c') : (isDark ? '#09090b' : '#cbd5e1'),
                }}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className={`font-bold ${selectedTrigger ? 'text-white' : 'text-gray-400'}`}>
                  {toPixelUpper(t('relapse_confirm_btn'))}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* STEP 3: Restart Motivation */}
        {relapseStep === 3 && (
          <>
            <View
              className="w-16 h-16 rounded-md bg-emerald-100 dark:bg-emerald-900/40 items-center justify-center mb-4"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              }}
            >
              <PixelIcon name="Star" size={26} color="#10b981" />
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-white mb-3 text-center">
              {toPixelUpper(t('relapse_restart'))}
            </Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-gray-400 text-center mb-5 leading-5">
              {sanitizeForPixelFont(t('relapse_restart_msg'))}
            </Text>
            <View className="flex-row gap-3 mb-5">
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
                  {toPixelUpper(t('relapse_attempt'))}
                </Text>
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-gray-900 dark:text-white font-bold">
                  {habit?.relapseHistory?.length || 0}
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
                  {toPixelUpper(t('relapse_best_streak'))}
                </Text>
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-gray-900 dark:text-white font-bold">
                  {habit?.bestCleanStreak || 0}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onFinish}
              className="w-full py-3.5 rounded-lg items-center bg-emerald-500"
              style={{
                borderWidth: 2,
                borderTopColor: isDark ? '#10b981' : '#34d399',
                borderLeftColor: isDark ? '#10b981' : '#34d399',
                borderBottomColor: isDark ? '#064e3b' : '#047857',
                borderRightColor: isDark ? '#064e3b' : '#047857',
              }}
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-bold text-white">
                {toPixelUpper(t('relapse_go'))}
              </Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </OverlayModal>
  );
}
