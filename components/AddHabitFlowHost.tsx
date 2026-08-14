import React, { useEffect } from 'react';
import { Alert, BackHandler, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import AddHabitModal from './AddHabitModal';
import { useAddHabitFlow } from '../context/AddHabitTrigger';
import { useHabits } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';

// Sadece düz ondalık kabul: "1234.5" / "1234,5". Exponential ("1e5") reddedilir
// — kullanıcı yanlış kasıtla dev sayı girmesin. Negatif/NaN sıfırlanır.
const parseLocaleNumber = (raw: string): number => {
  if (!raw) return 0;
  const normalized = raw.replace(',', '.').trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) return 0;
  const n = parseFloat(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export default function AddHabitFlowHost() {
  const { t } = useLanguage();
  const { addHabit, currency, setCurrency } = useHabits();
  const flow = useAddHabitFlow();

  // Hardware back: priority closes sub-pickers, then the modal itself.
  // Registered globally so the modal can be dismissed from any tab.
  useEffect(() => {
    if (!flow.isOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (flow.showTimePicker) { flow.setShowTimePicker(false); return true; }
      if (flow.showCustomDaysPicker) { flow.setShowCustomDaysPicker(false); return true; }
      flow.close();
      return true;
    });
    return () => sub.remove();
  }, [flow.isOpen, flow.showTimePicker, flow.showCustomDaysPicker]);

  const handleCustomDaysConfirm = (days: number[]) => {
    flow.setShowCustomDaysPicker(false);
    if (days.length === 0) {
      flow.setSelectedFrequency('daily');
      flow.setSelectedCustomDays([]);
      return;
    }
    const isWeekdays = [1, 2, 3, 4, 5].every(d => days.includes(d)) && days.length === 5;
    const isWeekends = [0, 6].every(d => days.includes(d)) && days.length === 2;
    const isEveryday = days.length === 7;
    if (isWeekdays) { flow.setSelectedFrequency('weekdays'); flow.setSelectedCustomDays([]); }
    else if (isWeekends) { flow.setSelectedFrequency('weekends'); flow.setSelectedCustomDays([]); }
    else if (isEveryday) { flow.setSelectedFrequency('daily'); flow.setSelectedCustomDays([]); }
    else { flow.setSelectedFrequency('custom'); flow.setSelectedCustomDays(days); }
  };

  const handleConfirm = () => {
    // Sessiz return yerine kullanıcıya geri bildirim — "buton neden tepkisiz"
    // raporlarını engeller.
    if (flow.newHabitText.trim().length === 0) {
      Alert.alert(t('add_habit_invalid_title'), t('add_habit_name_required'));
      return;
    }
    if (flow.selectedFrequency === 'custom' && flow.selectedCustomDays.length === 0) {
      Alert.alert(t('add_habit_invalid_title'), t('add_habit_pick_days'));
      return;
    }
    addHabit(
      flow.newHabitText.trim(),
      flow.habitSelectionType,
      flow.selectedIcon,
      flow.selectedColor,
      flow.selectedFrequency,
      flow.selectedReminder.trim().length === 5 ? flow.selectedReminder : undefined,
      flow.selectedFrequency === 'custom' ? flow.selectedCustomDays : undefined,
      flow.habitSelectionType === 'negative' ? parseLocaleNumber(flow.costPerDay) : undefined,
      flow.habitSelectionType === 'negative' ? parseLocaleNumber(flow.timePerDay) : undefined,
    );
    flow.resetForm();
    flow.close();
    flow.setShowSuccess(true);
    setTimeout(() => flow.setShowSuccess(false), 2500);
  };

  return (
    <>
      {flow.showSuccess && (
        <Animated.View
          entering={ZoomIn.springify().damping(14).mass(0.6)}
          exiting={FadeOut.duration(200)}
          className="absolute top-12 left-6 right-6 bg-[#22c55e] rounded-2xl p-4 z-50 flex-row items-center border border-[#16a34a] shadow-xl"
          style={{ elevation: 10 }}
          pointerEvents="none"
        >
          <View className="bg-white/20 p-2 rounded-full">
            <Text style={{ fontSize: 20 }}>✓</Text>
          </View>
          <Text className="text-white font-bold text-lg ml-3">{t('new_habit_added')}</Text>
        </Animated.View>
      )}

      <AddHabitModal
        visible={flow.isOpen}
        newHabitText={flow.newHabitText}
        setNewHabitText={flow.setNewHabitText}
        habitSelectionType={flow.habitSelectionType}
        setHabitSelectionType={flow.setHabitSelectionType}
        selectedIcon={flow.selectedIcon}
        setSelectedIcon={flow.setSelectedIcon}
        selectedColor={flow.selectedColor}
        setSelectedColor={flow.setSelectedColor}
        selectedFrequency={flow.selectedFrequency}
        setSelectedFrequency={flow.setSelectedFrequency}
        selectedCustomDays={flow.selectedCustomDays}
        selectedReminder={flow.selectedReminder}
        setSelectedReminder={flow.setSelectedReminder}
        showTimePicker={flow.showTimePicker}
        setShowTimePicker={flow.setShowTimePicker}
        showCustomDaysPicker={flow.showCustomDaysPicker}
        setShowCustomDaysPicker={flow.setShowCustomDaysPicker}
        costPerDay={flow.costPerDay}
        setCostPerDay={flow.setCostPerDay}
        timePerDay={flow.timePerDay}
        setTimePerDay={flow.setTimePerDay}
        currency={currency}
        setCurrency={setCurrency}
        onConfirm={handleConfirm}
        onCancel={flow.close}
        onCustomDaysConfirm={handleCustomDaysConfirm}
      />
    </>
  );
}
