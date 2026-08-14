import React, { useRef, useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Platform, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import { useColorScheme } from 'nativewind';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLanguage } from '../context/LanguageContext';

const ITEM_HEIGHT = 54;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelColumnProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  label: string;
  isDark: boolean;
}

function WheelColumn({ data, selectedValue, onValueChange, label, isDark }: WheelColumnProps) {
  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number>(-1);

  const paddedData = [
    ...Array(Math.floor(VISIBLE_ITEMS / 2)).fill(-1),
    ...data,
    ...Array(Math.floor(VISIBLE_ITEMS / 2)).fill(-2),
  ];

  useEffect(() => {
    const idx = data.indexOf(selectedValue);
    if (idx >= 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false });
      }, 100);
    }
    lastHapticIndex.current = idx;
  }, []);

  // Kaydırma sırasında haptic + değer güncelleme (fiziksel çark hissi)
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

    if (clampedIndex !== lastHapticIndex.current) {
      lastHapticIndex.current = clampedIndex;
      safeHaptics.selection();
      onValueChange(data[clampedIndex]);
    }
  }, [data, onValueChange]);

  // Son konum teyidi
  const handleScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    lastHapticIndex.current = clampedIndex;
    onValueChange(data[clampedIndex]);
  }, [data, onValueChange]);

  const renderItem = useCallback(({ item, index }: { item: number; index: number }) => {
    if (item < 0) {
      return <View style={{ height: ITEM_HEIGHT }} />;
    }

    const isSelected = item === selectedValue;
    const realIndex = index - Math.floor(VISIBLE_ITEMS / 2);
    const selectedRealIndex = data.indexOf(selectedValue);
    const distance = Math.abs(realIndex - selectedRealIndex);

    let opacity = 1;
    if (distance === 1) opacity = 0.4;
    else if (distance >= 2) opacity = 0.15;

    return (
      <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'PressStart2P',
            fontSize: isSelected ? 16 : 10,
            color: isDark ? '#ffffff' : '#111827',
            opacity,
          }}
        >
          {item.toString().padStart(2, '0')}
        </Text>
      </View>
    );
  }, [selectedValue, isDark, data]);

  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: 'PressStart2P',
          fontSize: 8,
          color: isDark ? '#9ca3af' : '#6b7280',
          marginBottom: 8,
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
      <View style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}>
        {/* Selection indicator */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
            left: 8,
            right: 8,
            height: ITEM_HEIGHT,
            borderRadius: 6, // Stepped pixel rounded-sm equivalent
            backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)',
            borderWidth: 2,
            borderColor: isDark ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.30)',
            zIndex: 10,
          }}
        />
        <FlatList
          ref={flatListRef}
          data={paddedData}
          keyExtractor={(_, idx) => `${idx}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          bounces={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
        />
      </View>
    </View>
  );
}

interface WheelTimePickerProps {
  visible: boolean;
  initialHour?: number;
  initialMinute?: number;
  onConfirm: (hour: number, minute: number) => void;
  onCancel: () => void;
}

export default function WheelTimePicker({
  visible,
  initialHour,
  initialMinute,
  onConfirm,
  onCancel,
}: WheelTimePickerProps) {
  // Fallback: cihazın o anki saati. Sabit "09:00" yerine kullanıcının
  // bulunduğu zamana yakın bir başlangıç çok daha az tıklama gerektirir.
  const nowRef = useRef(new Date());
  const safeInitialHour = Number.isFinite(initialHour as number)
    ? (initialHour as number)
    : nowRef.current.getHours();
  const safeInitialMinute = Number.isFinite(initialMinute as number)
    ? (initialMinute as number)
    : nowRef.current.getMinutes();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();

  const [selectedHour, setSelectedHour] = useState(safeInitialHour);
  const [selectedMinute, setSelectedMinute] = useState(safeInitialMinute);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    if (visible) {
      // Picker her açıldığında "şimdi"yi tazele (kullanıcı uygulamayı
      // dakikalarca açık tutmuş olabilir). initialHour/Minute verildiyse
      // o öncelikli — kullanıcının önceden seçtiği değeri korur.
      const now = new Date();
      const h = Number.isFinite(initialHour as number) ? (initialHour as number) : now.getHours();
      const m = Number.isFinite(initialMinute as number) ? (initialMinute as number) : now.getMinutes();
      setSelectedHour(h);
      setSelectedMinute(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleConfirm = () => {
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
    onConfirm(selectedHour, selectedMinute);
  };

  const handleCancel = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)',
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleCancel} />

        <View
          style={{
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderTopLeftRadius: 8, // Stepped pixel rounded-md equivalent
            borderTopRightRadius: 8,
            paddingTop: 20,
            paddingBottom: 36,
            paddingHorizontal: 24,
            borderTopWidth: 4,
            borderLeftWidth: 4,
            borderRightWidth: 4,
            borderColor: '#1e293b',
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <FontAwesome name="times" size={22} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 12, color: isDark ? '#ffffff' : '#111827' }}>
              {t('picker_title')}
            </Text>
            <TouchableOpacity onPress={handleConfirm} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <FontAwesome name="check" size={22} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <Text
            style={{
              textAlign: 'center',
              fontFamily: 'VT323',
              fontSize: 18,
              color: isDark ? '#6b7280' : '#9ca3af',
              marginBottom: 16,
            }}
          >
            {t('picker_set', { time: `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}` })}
          </Text>

          {/* Wheels */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16 }}>
            <WheelColumn
              data={hours}
              selectedValue={selectedHour}
              onValueChange={setSelectedHour}
              label={t('picker_hour')}
              isDark={isDark}
            />
            <View style={{ width: 12, justifyContent: 'center', alignItems: 'center', paddingTop: 28 }}>
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 16, color: isDark ? '#ffffff' : '#111827' }}>:</Text>
            </View>
            <WheelColumn
              data={minutes}
              selectedValue={selectedMinute}
              onValueChange={setSelectedMinute}
              label={t('picker_min')}
              isDark={isDark}
            />
          </View>

          {/* Bottom Buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCancel}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                borderWidth: 2,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 10, color: isDark ? '#d1d5db' : '#4b5563' }}>{t('picker_cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleConfirm}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: '#6366f1',
                borderWidth: 2,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 10, color: '#ffffff' }}>{t('picker_confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
