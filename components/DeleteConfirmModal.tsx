import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '../context/LanguageContext';
import { OverlayModal } from './OverlayModal';
import PixelIcon from './PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';

interface DeleteConfirmModalProps {
  targetId: string | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ targetId, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        <View
          className="w-16 h-16 rounded-md bg-red-100 dark:bg-red-900/40 items-center justify-center mb-4"
          style={{
            borderWidth: 2,
            borderTopColor: isDark ? '#475569' : '#cbd5e1',
            borderLeftColor: isDark ? '#475569' : '#cbd5e1',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
          }}
        >
          <PixelIcon name="Trash" size={26} color="#ef4444" />
        </View>
        <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-white mb-3 text-center">
          {toPixelUpper(t('delete_habit'))}
        </Text>
        <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">
          {sanitizeForPixelFont(t('delete_confirm'))}
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
            onPress={() => {
              if (targetId) onConfirm(targetId);
              safeHaptics.notification(Haptics.NotificationFeedbackType.Warning);
            }}
            className="flex-1 py-3.5 rounded-lg items-center bg-red-500"
            style={{
              borderWidth: 2,
              borderTopColor: isDark ? '#ef4444' : '#f87171',
              borderLeftColor: isDark ? '#ef4444' : '#f87171',
              borderBottomColor: isDark ? '#7f1d1d' : '#b91c1c',
              borderRightColor: isDark ? '#7f1d1d' : '#b91c1c',
            }}
          >
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-bold text-white">
              {toPixelUpper(t('delete'))}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </OverlayModal>
  );
}
