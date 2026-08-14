import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import CustomDaysPicker from './CustomDaysPicker';
import WheelTimePicker from './WheelTimePicker';
import { HabitFrequency, HabitType } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';

const ICONS = ['star', 'book', 'heart', 'tint', 'coffee', 'bolt', 'music', 'briefcase'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

interface AddHabitModalProps {
  visible: boolean;
  newHabitText: string;
  setNewHabitText: (v: string) => void;
  habitSelectionType: HabitType;
  setHabitSelectionType: (v: HabitType) => void;
  selectedIcon: string;
  setSelectedIcon: (v: string) => void;
  selectedColor: string;
  setSelectedColor: (v: string) => void;
  selectedFrequency: HabitFrequency;
  setSelectedFrequency: (v: HabitFrequency) => void;
  selectedCustomDays: number[];
  selectedReminder: string;
  setSelectedReminder: (v: string) => void;
  showTimePicker: boolean;
  setShowTimePicker: (v: boolean) => void;
  showCustomDaysPicker: boolean;
  setShowCustomDaysPicker: (v: boolean) => void;
  costPerDay: string;
  setCostPerDay: (v: string) => void;
  timePerDay: string;
  setTimePerDay: (v: string) => void;
  currency: string;
  setCurrency: (v: string) => Promise<void>;
  onConfirm: () => void;
  onCancel: () => void;
  onCustomDaysConfirm: (days: number[]) => void;
}

export default function AddHabitModal({
  visible,
  newHabitText,
  setNewHabitText,
  habitSelectionType,
  setHabitSelectionType,
  selectedIcon,
  setSelectedIcon,
  selectedColor,
  setSelectedColor,
  selectedFrequency,
  setSelectedFrequency,
  selectedCustomDays,
  selectedReminder,
  setSelectedReminder,
  showTimePicker,
  setShowTimePicker,
  showCustomDaysPicker,
  setShowCustomDaysPicker,
  costPerDay,
  setCostPerDay,
  timePerDay,
  setTimePerDay,
  currency,
  setCurrency,
  onConfirm,
  onCancel,
  onCustomDaysConfirm,
}: AddHabitModalProps) {
  const { t } = useLanguage();
  const [focusedField, setFocusedField] = React.useState<'name' | 'cost' | 'time' | null>(null);

  if (!visible) return null;

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        className="absolute inset-0 z-40"
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0 bg-black/60 dark:bg-black/70"
        >
          <TouchableOpacity className="flex-1" onPress={onCancel} />
        </Animated.View>

        <View className="flex-1 justify-end">
          <Animated.View
            entering={SlideInDown.springify().damping(24).mass(0.8)}
            exiting={SlideOutDown.duration(200)}
            className="bg-white dark:bg-zinc-900 rounded-t-lg border-t-4 border-l-4 border-r-4 border-slate-800 max-h-[85%]"
            style={{
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            <ScrollView
              className="flex-shrink"
              contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 16 }} className="text-gray-900 dark:text-zinc-100 mb-5">{t('new_habit')}</Text>

              {/* Segmented Control */}
              <View className="flex-row bg-gray-100 dark:bg-zinc-800 rounded-md p-1 mb-5 border-2 border-slate-800">
                <TouchableOpacity
                  onPress={() => {
                    safeHaptics.selection();
                    setHabitSelectionType('positive');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: habitSelectionType === 'positive' }}
                  accessibilityLabel={t('build_habit')}
                  className={`flex-1 items-center justify-center py-2 rounded-md ${habitSelectionType === 'positive' ? 'bg-indigo-600' : 'bg-transparent'}`}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    className={`font-semibold ${habitSelectionType === 'positive' ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}
                  >
                    {t('build_habit')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    safeHaptics.selection();
                    setHabitSelectionType('negative');
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: habitSelectionType === 'negative' }}
                  accessibilityLabel={t('quit_habit')}
                  className={`flex-1 items-center justify-center py-2 rounded-md ${habitSelectionType === 'negative' ? 'bg-red-600' : 'bg-transparent'}`}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    className={`font-semibold ${habitSelectionType === 'negative' ? 'text-white' : 'text-gray-500 dark:text-zinc-400'}`}
                  >
                    {t('quit_habit')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                autoFocus={Platform.OS === 'ios'}
                value={newHabitText}
                onChangeText={setNewHabitText}
                placeholder={habitSelectionType === 'positive' ? t('ex_read') : t('ex_smoke')}
                placeholderTextColor="#9ca3af"
                maxLength={60}
                accessibilityLabel={t('new_habit')}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(f => (f === 'name' ? null : f))}
                className={`bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-xl p-4 rounded-lg border-2 mb-6 ${
                  focusedField === 'name'
                    ? 'border-indigo-500 dark:border-indigo-400'
                    : 'border-slate-800'
                }`}
                onSubmitEditing={onConfirm}
              />

              {habitSelectionType === 'positive' && (
                <View>
                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('select_icon')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {ICONS.map(icon => (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => setSelectedIcon(icon)}
                        accessibilityRole="button"
                        accessibilityLabel={icon}
                        accessibilityState={{ selected: selectedIcon === icon }}
                        className={`w-12 h-12 rounded-md items-center justify-center mr-3 ${selectedIcon === icon ? 'bg-gray-100 dark:bg-zinc-800 border-2 border-slate-800' : 'bg-transparent'}`}
                      >
                        <FontAwesome name={icon as any} size={20} color={selectedIcon === icon ? selectedColor : '#9ca3af'} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('select_color')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        accessibilityRole="radio"
                        accessibilityLabel={color}
                        accessibilityState={{ selected: selectedColor === color }}
                        className="w-10 h-10 rounded-md mr-3 items-center justify-center border-2 border-slate-800"
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && <FontAwesome name="check" size={14} color="white" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('select_freq')}</Text>
                  <View className="flex-row bg-gray-100 dark:bg-zinc-800 rounded-md p-1 mb-6 border-2 border-slate-800">
                    {(['daily', 'weekdays', 'weekends', 'custom'] as HabitFrequency[]).map(freq => (
                      <Pressable
                        key={freq}
                        onPress={() => {
                          setSelectedFrequency(freq);
                          if (freq === 'custom') setShowCustomDaysPicker(true);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: selectedFrequency === freq }}
                        accessibilityLabel={freq === 'daily' ? t('everyday') : freq === 'weekdays' ? t('weekdays') : freq === 'weekends' ? t('weekends') : t('custom')}
                        className={`flex-1 items-center justify-center py-3 rounded-md ${selectedFrequency === freq ? 'bg-white dark:bg-zinc-700 border-2 border-slate-800' : 'bg-transparent'}`}
                      >
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.65}
                          style={{ fontFamily: 'VT323', fontSize: 16 }}
                          className={`font-bold ${selectedFrequency === freq ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-500'}`}
                        >
                          {freq === 'daily' ? t('everyday') : freq === 'weekdays' ? t('weekdays') : freq === 'weekends' ? t('weekends') : t('custom')}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {selectedFrequency === 'custom' && selectedCustomDays.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mb-6 px-1">
                      {selectedCustomDays
                        .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                        .map(dayIndex => {
                          const dayNames = ['day_sun', 'day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat'];
                          return (
                            <View key={dayIndex} className="bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5 rounded-md border-2 border-slate-800">
                              <Text style={{ fontFamily: 'VT323', fontSize: 16 }} className="text-indigo-700 dark:text-indigo-300 font-bold">{t(dayNames[dayIndex])}</Text>
                            </View>
                          );
                        })}
                    </View>
                  )}

                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('reminder_time')}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      safeHaptics.selection();
                      setShowTimePicker(true);
                    }}
                    className={`flex-row items-center justify-between p-4 rounded-lg border-2 mb-6 ${
                      selectedReminder
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400'
                        : 'bg-gray-100 dark:bg-zinc-800 border-slate-800'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <FontAwesome name="bell-o" size={18} color={selectedReminder ? '#6366f1' : '#9ca3af'} />
                      <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className={`ml-3 font-semibold ${selectedReminder ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                        {selectedReminder || t('pick_time')}
                      </Text>
                    </View>
                    {selectedReminder ? (
                      <TouchableOpacity
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={e => {
                          e.stopPropagation();
                          setSelectedReminder('');
                          safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <FontAwesome name="times-circle" size={20} color="#9ca3af" />
                      </TouchableOpacity>
                    ) : (
                      <FontAwesome name="chevron-right" size={14} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {habitSelectionType === 'negative' && (
                <View>
                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('cost_per_day')}</Text>
                  <TextInput
                    value={costPerDay}
                    onChangeText={v => setCostPerDay(v.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1'))}
                    placeholder={t('cost_placeholder')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    accessibilityLabel={t('cost_per_day')}
                    onFocus={() => setFocusedField('cost')}
                    onBlur={() => setFocusedField(f => (f === 'cost' ? null : f))}
                    className={`bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-lg p-4 rounded-lg border-2 mb-3 ${
                      focusedField === 'cost'
                        ? 'border-emerald-500 dark:border-emerald-400'
                        : 'border-slate-800'
                    }`}
                  />
                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('currency_label')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                    {['₺', '$', '€', '£', '¥', '₩'].map(c => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => {
                          safeHaptics.selection();
                          setCurrency(c);
                        }}
                        className={`px-4 py-2 rounded-md mr-2 border-2 ${currency === c ? 'bg-emerald-500 border-emerald-500' : 'bg-gray-100 dark:bg-zinc-800 border-slate-800'}`}
                      >
                        <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className={`font-bold ${currency === c ? 'text-white' : 'text-gray-600 dark:text-zinc-300'}`}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 dark:text-zinc-400 font-bold uppercase mb-2 ml-1">{t('time_per_day')}</Text>
                  <TextInput
                    value={timePerDay}
                    onChangeText={v => setTimePerDay(v.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1'))}
                    placeholder={t('time_placeholder')}
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    accessibilityLabel={t('time_per_day')}
                    onFocus={() => setFocusedField('time')}
                    onBlur={() => setFocusedField(f => (f === 'time' ? null : f))}
                    className={`bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-lg p-4 rounded-lg border-2 mb-4 ${
                      focusedField === 'time'
                        ? 'border-emerald-500 dark:border-emerald-400'
                        : 'border-slate-800'
                    }`}
                  />
                </View>
              )}
            </ScrollView>

            <View className="flex-row gap-4 px-6 pt-4 pb-6 border-t-2 border-slate-800 bg-white dark:bg-zinc-900">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 py-4 rounded-lg items-center border-2 border-slate-800"
                onPress={() => {
                  safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
                  onCancel();
                }}
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 11 }} className="text-gray-600 dark:text-zinc-300 font-semibold">{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                className={`flex-1 py-4 rounded-lg items-center border-2 border-slate-800 ${
                  newHabitText.trim().length > 0
                    ? habitSelectionType === 'positive'
                      ? 'bg-indigo-600'
                      : 'bg-red-600'
                    : 'bg-gray-200 dark:bg-zinc-800'
                }`}
                onPress={onConfirm}
                disabled={newHabitText.trim().length === 0}
                accessibilityRole="button"
                accessibilityLabel={t('add')}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 11 }} className={`font-bold ${newHabitText.trim().length > 0 ? 'text-white' : 'text-gray-400 dark:text-zinc-500'}`}>
                  {t('add')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Wheel Time Picker — initial value cihazın o anki saati */}
      {showTimePicker && (() => {
        const now = new Date();
        const fallbackHour = now.getHours();
        const fallbackMinute = now.getMinutes();
        const parsedHour = selectedReminder ? parseInt(selectedReminder.split(':')[0], 10) : NaN;
        const parsedMinute = selectedReminder ? parseInt(selectedReminder.split(':')[1], 10) : NaN;
        const initialHour = Number.isFinite(parsedHour) ? parsedHour : fallbackHour;
        const initialMinute = Number.isFinite(parsedMinute) ? parsedMinute : fallbackMinute;
        return (
          <WheelTimePicker
            visible={showTimePicker}
            initialHour={initialHour}
            initialMinute={initialMinute}
            onConfirm={(hour, minute) => {
              setSelectedReminder(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
              setShowTimePicker(false);
            }}
            onCancel={() => setShowTimePicker(false)}
          />
        );
      })()}

      {/* Custom Days Picker */}
      <CustomDaysPicker
        visible={showCustomDaysPicker}
        initialDays={selectedCustomDays}
        onConfirm={onCustomDaysConfirm}
        onCancel={() => {
          setShowCustomDaysPicker(false);
          if (selectedCustomDays.length === 0) setSelectedFrequency('daily');
        }}
      />
    </>
  );
}
