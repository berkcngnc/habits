import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import { useColorScheme } from 'nativewind';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLanguage } from '../context/LanguageContext';
import { OverlayModal } from './OverlayModal';

interface CustomDaysPickerProps {
  visible: boolean;
  initialDays: number[];
  onConfirm: (days: number[]) => void;
  onCancel: () => void;
}

export default function CustomDaysPicker({
  visible,
  initialDays,
  onConfirm,
  onCancel,
}: CustomDaysPickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (visible) {
      setSelectedDays(initialDays);
    }
  }, [visible, initialDays]);

  const toggleDay = (dayIndex: number) => {
    safeHaptics.selection();
    setSelectedDays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleConfirm = () => {
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    onConfirm(selectedDays);
  };

  const handleCancel = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  // Pazartesi'den başlayarak günleri sıralayalım
  const days = [
    { index: 1, key: 'day_mon_long' },
    { index: 2, key: 'day_tue_long' },
    { index: 3, key: 'day_wed_long' },
    { index: 4, key: 'day_thu_long' },
    { index: 5, key: 'day_fri_long' },
    { index: 6, key: 'day_sat_long' },
    { index: 0, key: 'day_sun_long' },
  ];

  return (
    <OverlayModal visible={visible} onDismiss={handleCancel}>
      <View
        className="bg-white dark:bg-zinc-900 w-full rounded-lg p-5 border-4 border-slate-800"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
          maxHeight: '90%',
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 11 }} className="text-gray-900 dark:text-white">
            {t('freq_custom')}
          </Text>
          <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <FontAwesome name="times" size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        </View>

        {/* Days List */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, marginBottom: 12 }}>
          {days.map((day, i) => {
            const isSelected = selectedDays.includes(day.index);
            return (
              <TouchableOpacity
                key={day.index}
                activeOpacity={0.7}
                onPress={() => toggleDay(day.index)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: i === days.length - 1 ? 0 : 2,
                  borderBottomColor: isDark ? '#1e293b' : '#f3f4f6',
                }}
              >
                <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-800 dark:text-gray-200">
                  {t(day.key)}
                </Text>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: '#1e293b',
                    backgroundColor: isSelected ? '#6366f1' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected && <FontAwesome name="check" size={10} color="#ffffff" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCancel}
            className="flex-1 py-3 rounded-lg items-center bg-gray-100 dark:bg-zinc-800 border-2 border-slate-800"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-600 dark:text-gray-300">
              {t('picker_cancel')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleConfirm}
            className="flex-1 py-3 rounded-lg items-center bg-indigo-500 border-2 border-slate-800"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 2, height: 2 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-white font-bold">
              {t('picker_confirm')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </OverlayModal>
  );
}

