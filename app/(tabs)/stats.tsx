import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../../utils/haptics';
import { useHabits } from '../../context/HabitsContext';
import { useLanguage } from '../../context/LanguageContext';
import { dateToStr, parseLocalDate, isValidOnDayOfWeek } from '../../utils/dateUtils';
import { useBackHandler } from '../../hooks/useBackHandler';
import Animated, { FadeInUp, SlideInRight, SlideInLeft, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useTabSlide } from '../../hooks/useTabSlide';
import { useColorScheme } from 'nativewind';
import InfoBubble, { InfoButton } from '../../components/InfoBubble';
import { SmartNativeAdCard } from '../../components/SmartNativeAdCard';
import StreakFreezeCard from '../../components/StreakFreezeCard';
import PixelIcon from '../../components/PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../../utils/fontSanitizer';

export default function StatsScreen() {
  const { stats, habits } = useHabits();
  const { t, language } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isFocused = useIsFocused();
  const [showInfo, setShowInfo] = useState(false);
  const router = useRouter();

  // ── Calendar state ──
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calendarKey, setCalendarKey] = useState(0);
  const [calendarDir, setCalendarDir] = useState<'next' | 'prev'>('next');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const navigateMonth = (direction: 'prev' | 'next') => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setCalendarDir(direction);
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + (direction === 'next' ? 1 : -1), 1));
    setCalendarKey(k => k + 1);
    setSelectedDay(null);
  };

  // ✅ FIX #5: back navigation via shared hook
  useBackHandler(() => {
    if (showInfo) { setShowInfo(false); return true; }
    router.navigate('/');
    return true;
  }, [showInfo, router]);

  const todayVal = new Date().getDay();
  const negativeHabitsCount = habits.filter(h => h.type === 'negative').length;
  // ✅ FIX #3: centralised frequency validation via dateUtils
  const validPositiveHabits = habits.filter(h =>
    h.type === 'positive' && isValidOnDayOfWeek(todayVal, h.frequency, h.customDays)
  );

  const positiveHabitsCount = validPositiveHabits.length;
  const completedPositiveCount = validPositiveHabits.filter(h => h.completed).length;
  const dailyProgress = positiveHabitsCount === 0 ? (completedPositiveCount > 0 ? 100 : 0) : Math.round((completedPositiveCount / positiveHabitsCount) * 100);

  const last7Days = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dateToStr(d);
  }), []);

  const dayLabelArr = useMemo(
    () => [t('day_sun'), t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat')],
    [t]
  );
  const getDayLabel = useCallback(
    (dateStr: string) => dayLabelArr[parseLocalDate(dateStr).getDay()],
    [dayLabelArr]
  );

  // Precompute positive habits + their creation dates once per habits change,
  // avoiding O(habits) filtering+date parsing per heatmap cell on every render.
  const positiveHabitsMeta = useMemo(
    () => habits
      .filter(h => h.type === 'positive')
      .map(h => ({ h, createdDate: dateToStr(new Date(h.startDate)) })),
    [habits]
  );

  const getDayScore = useCallback((dateStr: string): number => {
    let required = 0;
    let done = 0;
    const dow = parseLocalDate(dateStr).getDay();

    for (const { h, createdDate } of positiveHabitsMeta) {
      if (dateStr <= createdDate) continue;
      if (isValidOnDayOfWeek(dow, h.frequency, h.customDays)) required++;
      if (h.history && h.history[dateStr]) done++;
    }

    if (required === 0 && done > 0) return 1;
    if (required === 0) return -1;
    return done / required;
  }, [positiveHabitsMeta]);

  const getDayCompleted = useCallback((dateStr: string): number => {
    let n = 0;
    for (const { h } of positiveHabitsMeta) {
      if (h.history?.[dateStr]) n++;
    }
    return n;
  }, [positiveHabitsMeta]);

  // ── Heat color helper ──
  const getHeatColor = useCallback((dateStr: string): string => {
    const today = dateToStr(new Date());
    if (dateStr > today) return isDark ? 'rgba(39,39,42,0.25)' : 'rgba(243,244,246,0.4)';
    const score = getDayScore(dateStr);
    if (score === -1) return isDark ? 'rgba(39,39,42,0.4)' : '#f3f4f6';
    if (score === 0) return isDark ? 'rgba(39,39,42,0.6)' : '#f3f4f6';
    if (score < 0.5) return isDark ? 'rgba(6,78,59,0.55)' : '#bbf7d0';
    if (score < 0.99) return isDark ? '#065f46' : '#34d399';
    return isDark ? '#10b981' : '#10b981';
  }, [getDayScore, isDark]);

  // ── Calendar grid ──
  const calendarWeeks = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const offset = (firstDay.getDay() + 6) % 7; // Mon=0

    const days: (string | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (days.length % 7 !== 0) days.push(null);

    const weeks: (string | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return weeks;
  }, [calendarMonth]);

  const isCurrentMonth = calendarMonth.getFullYear() === new Date().getFullYear()
    && calendarMonth.getMonth() === new Date().getMonth();

  const monthLabel = useMemo(() => {
    const localeCode = language === 'tr' ? 'tr-TR' : language === 'zh' ? 'zh-CN' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : 'en-US';
    try {
      return new Intl.DateTimeFormat(localeCode, { month: 'long', year: 'numeric' }).format(calendarMonth);
    } catch {
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarMonth);
    }
  }, [language, calendarMonth]);

  const dayHeaders = useMemo(
    () => [t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat'), t('day_sun')],
    [t]
  );

  const todayDateStr = last7Days[6];

  // Precompute heat colors for the visible month so cell renders are O(1) lookups.
  const heatColorByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const week of calendarWeeks) {
      for (const dateStr of week) {
        if (dateStr) map.set(dateStr, getHeatColor(dateStr));
      }
    }
    return map;
  }, [calendarWeeks, getHeatColor]);

  // Tuple return type so LinearGradient's `colors` prop (readonly [ColorValue, ColorValue, ...]) accepts it.
  const getProgressColors = (pct: number): readonly [string, string] => {
    if (pct === 0) return ['transparent', 'transparent'] as const;
    if (pct < 40) return ['#f97316', '#ef4444'] as const; // Orange to Red
    if (pct < 80) return ['#8b5cf6', '#6366f1'] as const; // Violet to Indigo
    if (pct < 100) return ['#6366f1', '#10b981'] as const; // Indigo to Emerald
    return ['#10b981', '#059669'] as const; // Pure Emerald Green for 100%
  };

  const progressColors = getProgressColors(dailyProgress);

  // ── Toplam alışkanlık sayıları ──
  const totalPositiveHabitsCount = habits.filter(h => h.type === 'positive').length;

  const slideStyle = useTabSlide(1);
  return (
    <Animated.View style={[slideStyle, { backgroundColor: isDark ? '#090d16' : '#f9fafb' }]}>
      <ScrollView className="px-6 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6 mt-4 flex-row items-start justify-between">
          <View className="flex-1">
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-gray-500 dark:text-zinc-400 tracking-wider mb-1.5">{toPixelUpper(t('career'))}</Text>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 20 }} className="text-slate-800 dark:text-zinc-100 font-bold tracking-tight">{sanitizeForPixelFont(t('stats'))}</Text>
          </View>
          <View className="mt-1">
            <InfoButton onPress={() => setShowInfo(true)} accessibilityLabel={t('info_btn')} />
          </View>
        </View>

        {/* ── Bugünkü Başarı Oranı (En üstte) ── */}
        <Animated.View
          entering={FadeInUp.delay(100)}
          className="bg-white dark:bg-zinc-900 rounded-lg p-5 mb-6 border-4"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3
          }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="text-slate-800 dark:text-zinc-100 font-bold">{toPixelUpper(t('today_success'))}</Text>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 12, color: dailyProgress === 0 ? (isDark ? '#52525b' : '#9ca3af') : progressColors[1] }}>%{dailyProgress}</Text>
          </View>
          <View
            className="h-4 w-full bg-gray-100 dark:bg-zinc-800 rounded-md border-2 mt-2 overflow-hidden"
            style={{
              borderTopColor: isDark ? '#475569' : '#cbd5e1',
              borderLeftColor: isDark ? '#475569' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
            }}
          >
            <Animated.View style={{ width: `${dailyProgress}%`, height: '100%' }}>
              <LinearGradient
                colors={dailyProgress === 0 ? (['transparent', 'transparent'] as const) : progressColors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
          <Text style={{ fontFamily: 'VT323', fontSize: 16 }} className="text-gray-500 dark:text-zinc-400 mt-3">
            {t('daily_goals_status', { done: completedPositiveCount, total: positiveHabitsCount })}
          </Text>
        </Animated.View>

        {/* ── Bugünkü Pomodoro Odaklanma ── */}
        <Animated.View
          entering={FadeInUp.delay(120)}
          className="bg-white dark:bg-zinc-900 rounded-lg p-5 mb-6 border-4"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-md bg-red-100 dark:bg-red-500/20 border-2 items-center justify-center mr-4"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Clock" size={14} color="#ef4444" />
              </View>
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{sanitizeForPixelFont(t('pomodoro_stats_label'))}</Text>
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="font-bold text-slate-800 dark:text-zinc-300">
              {(() => {
                const totalSec = (stats.pomodoroDailySeconds && stats.pomodoroDailySeconds[todayDateStr]) || 0;
                const m = Math.floor(totalSec / 60);
                return `${m} ${sanitizeForPixelFont(t('minutes_short'))}`;
              })()}
            </Text>
          </View>
        </Animated.View>

        {/* ── Son 7 Günlük Performans ── */}
        <Animated.View
          entering={FadeInUp.delay(150)}
          className="bg-white dark:bg-zinc-900 rounded-lg p-5 border-4 mb-6"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3
          }}
        >
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="text-slate-800 dark:text-zinc-100 font-bold mb-4">{toPixelUpper(t('last_7_days'))}</Text>
          <View className="flex-row justify-between items-center">
            {last7Days.map((dateStr, i) => {
              const isToday = dateStr === todayDateStr;
              const score = getDayScore(dateStr);

              let bgColor = 'bg-gray-100 dark:bg-zinc-800';
              let icon = null;
              let iconColor = '#9ca3af';

              if (score === -1) {
                bgColor = 'bg-gray-100 dark:bg-zinc-800 opacity-50';
                icon = 'minus';
              } else if (isToday) {
                if (score >= 0.99) { bgColor = 'bg-green-500'; icon = 'check'; iconColor = 'white'; }
                else if (score > 0) { bgColor = 'bg-green-300 dark:bg-green-700/60'; icon = 'check'; iconColor = 'white'; }
                else { bgColor = 'bg-gray-100 dark:bg-zinc-800'; }
              } else {
                if (score >= 0.99) { bgColor = 'bg-green-500'; icon = 'check'; iconColor = 'white'; }
                else if (score > 0) { bgColor = 'bg-green-300 dark:bg-green-700/60'; icon = 'check'; iconColor = 'white'; }
                else { bgColor = 'bg-red-400 dark:bg-red-500/60'; icon = 'times'; iconColor = 'white'; }
              }

              return (
                <View key={dateStr} className="items-center">
                  <View
                    className={`w-9 h-9 rounded-md border-2 mb-2 items-center justify-center ${bgColor} ${isToday ? 'border-dashed border-2 border-gray-400 dark:border-white/50' : ''}`}
                    style={{
                      borderTopColor: isDark ? '#475569' : '#cbd5e1',
                      borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                      borderBottomColor: isDark ? '#0f172a' : '#475569',
                      borderRightColor: isDark ? '#0f172a' : '#475569',
                    }}
                  >
                    {icon === 'check' && <PixelIcon name="Check" size={12} color={iconColor} />}
                    {icon === 'times' && <PixelIcon name="Close" size={12} color={iconColor} />}
                    {icon === 'minus' && <PixelIcon name="Minus" size={10} color={iconColor} />}
                  </View>
                  <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className={`font-semibold ${isToday ? 'text-slate-800 dark:text-zinc-100' : 'text-gray-400 dark:text-zinc-500'}`}>{sanitizeForPixelFont(getDayLabel(dateStr))}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Sayısal Özet Kartları ── */}
        <View className="flex-row gap-4 mb-6">
          <Animated.View
            entering={FadeInUp.delay(200)}
            className="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-5 border-4 items-center justify-center"
            style={{
              borderTopColor: isDark ? '#475569' : '#e2e8f0',
              borderLeftColor: isDark ? '#475569' : '#e2e8f0',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              shadowColor: '#0f172a',
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 3
            }}
          >
            <PixelIcon name="Fire" size={24} color="#f97316" />
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 16 }} className="text-slate-800 dark:text-zinc-100 mt-3">{stats.bestStreak}</Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 15 }} className="text-gray-400 dark:text-zinc-500 font-semibold mt-1 text-center">{toPixelUpper(t('best_streak'))}</Text>
          </Animated.View>
          <Animated.View
            entering={FadeInUp.delay(300)}
            className="flex-1 bg-white dark:bg-zinc-900 rounded-lg p-5 border-4 items-center justify-center"
            style={{
              borderTopColor: isDark ? '#475569' : '#e2e8f0',
              borderLeftColor: isDark ? '#475569' : '#e2e8f0',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              shadowColor: '#0f172a',
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 3
            }}
          >
            <PixelIcon name="CheckSquare" size={24} color="#22c55e" />
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 16 }} className="text-slate-800 dark:text-zinc-100 mt-3">{stats.totalCompleted}</Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 15 }} className="text-gray-400 dark:text-zinc-500 font-semibold mt-1 text-center">{toPixelUpper(t('all_time'))}</Text>
          </Animated.View>
        </View>

        {/* ── Streak Freeze (Buz Mavisi premium kart) ── */}
        <Animated.View entering={FadeInUp.delay(330)}>
          <StreakFreezeCard />
        </Animated.View>

        {/* ── Sponsorlu / Reklam Alanı (SmartAdBanner: Preload + Fallback) ── */}
        <Animated.View
          entering={FadeInUp.delay(350)}
          className="mb-6"
          accessibilityLabel={t('ad_space_label')}
        >
          <SmartNativeAdCard />
        </Animated.View>

        {/* ── Activity Heatmap Calendar ── */}
        <Animated.View
          entering={FadeInUp.delay(370)}
          className="bg-white dark:bg-zinc-900 rounded-lg p-5 border-4 mb-6"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3
          }}
        >
          {/* Month navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => navigateMonth('prev')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                borderTopColor: isDark ? '#475569' : '#ffffff',
                borderLeftColor: isDark ? '#475569' : '#ffffff',
                borderBottomColor: isDark ? '#0f172a' : '#cbd5e1',
                borderRightColor: isDark ? '#0f172a' : '#cbd5e1',
              })}
              className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 border-2 items-center justify-center"
            >
              <PixelIcon name="ChevronLeft" size={10} color={isDark ? '#a1a1aa' : '#6b7280'} />
            </Pressable>

            <View className="flex-1 items-center px-2">
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="text-slate-800 dark:text-zinc-100 font-bold capitalize">{sanitizeForPixelFont(monthLabel)}</Text>
              <Text style={{ fontFamily: 'VT323', fontSize: 15 }} className="text-gray-400 dark:text-zinc-500 mt-1">{t('heatmap_title')}</Text>
            </View>

            <Pressable
              onPress={() => { if (!isCurrentMonth) navigateMonth('next'); }}
              style={({ pressed }) => ({
                opacity: isCurrentMonth ? 0.25 : pressed ? 0.5 : 1,
                borderTopColor: isDark ? '#475569' : '#ffffff',
                borderLeftColor: isDark ? '#475569' : '#ffffff',
                borderBottomColor: isDark ? '#0f172a' : '#cbd5e1',
                borderRightColor: isDark ? '#0f172a' : '#cbd5e1',
              })}
              className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 border-2 items-center justify-center"
            >
              <PixelIcon name="ChevronRight" size={10} color={isDark ? '#a1a1aa' : '#6b7280'} />
            </Pressable>
          </View>

          <View style={{ overflow: 'hidden' }}>
            <Animated.View
              key={calendarKey}
              entering={calendarDir === 'next' ? SlideInRight.duration(220) : SlideInLeft.duration(220)}
              exiting={calendarDir === 'next' ? SlideOutLeft.duration(150) : SlideOutRight.duration(150)}
            >
              {/* Day headers */}
              <View className="flex-row mb-2">
                {dayHeaders.map(d => (
                  <View key={d} style={{ flex: 1 }} className="items-center">
                    <Text style={{ fontFamily: 'VT323', fontSize: 15 }} className="text-gray-400 dark:text-zinc-500 font-bold">{sanitizeForPixelFont(d)}</Text>
                  </View>
                ))}
              </View>

              {/* Grid weeks */}
              {calendarWeeks.map((week, wi) => (
                <View key={wi} className="flex-row mb-1.5">
                  {week.map((dateStr, di) => {
                    const isFuture = dateStr ? dateStr > todayDateStr : false;
                    const isSelected = dateStr === selectedDay;
                    const isToday = dateStr === todayDateStr;
                    const heatColor = dateStr ? (heatColorByDate.get(dateStr) ?? 'transparent') : 'transparent';

                    return (
                      <Pressable
                        key={di}
                        style={{ flex: 1, aspectRatio: 1, marginHorizontal: 1.5 }}
                        disabled={!dateStr || isFuture}
                        onPress={() => {
                          if (!dateStr) return;
                          safeHaptics.selection();
                          setSelectedDay(prev => prev === dateStr ? null : dateStr);
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: heatColor,
                            borderRadius: 4,
                            borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                            borderColor: isSelected ? '#6366f1' : isToday ? (isDark ? '#a1a1aa' : '#9ca3af') : 'transparent',
                          }}
                        >
                          {dateStr && (
                            <Text style={{
                              position: 'absolute', top: 1, right: 2,
                              fontFamily: 'VT323', fontSize: 11,
                              color: isDark ? 'rgba(161,161,170,0.8)' : 'rgba(156,163,175,0.9)',
                            }}>
                              {parseInt(dateStr.split('-')[2])}
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}

              {/* Selected day tooltip */}
              <View className="mt-3 h-6 items-center justify-center">
                {selectedDay ? (
                  <Text style={{ fontFamily: 'VT323', fontSize: 16 }} className="text-gray-500 dark:text-zinc-400 font-medium">
                    {(() => {
                      const score = getDayScore(selectedDay);
                      const count = getDayCompleted(selectedDay);
                      if (score === -1) return t('heatmap_no_habits');
                      if (score >= 0.99) return t('heatmap_perfect');
                      return t('heatmap_completed', { count });
                    })()}
                  </Text>
                ) : (
                  <View className="flex-row gap-4">
                    <View className="flex-row items-center">
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: isDark ? '#10b981' : '#10b981', marginRight: 4 }} />
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-zinc-500">100%</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: isDark ? '#065f46' : '#34d399', marginRight: 4 }} />
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-zinc-500">&gt;50%</Text>
                    </View>
                    <View className="flex-row items-center">
                      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: isDark ? 'rgba(39,39,42,0.6)' : '#f3f4f6', marginRight: 4 }} />
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-zinc-500">0%</Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Sürecim (Kazanılan / Bırakılan Döküm) ── */}
        <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-slate-800 dark:text-zinc-100 font-bold mb-5 mt-4 tracking-tight">
          {toPixelUpper(t('my_process'))}
        </Text>

        <View
          className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden border-4 mb-6"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3
          }}
        >
          <View className="flex-row justify-between items-center p-5 border-b-2 border-gray-100 dark:border-zinc-800">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-md bg-indigo-100 dark:bg-indigo-500/20 border-2 items-center justify-center mr-4"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Plus" size={14} color="#6366f1" />
              </View>
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{sanitizeForPixelFont(t('built'))}</Text>
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="font-bold text-slate-800 dark:text-zinc-300">{totalPositiveHabitsCount}</Text>
          </View>
          <View className="flex-row justify-between items-center p-5">
            <View className="flex-row items-center">
              <View
                className="w-9 h-9 rounded-md bg-red-100 dark:bg-red-500/20 border-2 items-center justify-center mr-4"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Minus" size={14} color="#ef4444" />
              </View>
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{sanitizeForPixelFont(t('quit'))}</Text>
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="font-bold text-slate-800 dark:text-zinc-300">{negativeHabitsCount}</Text>
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      <InfoBubble
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title={t('info_stats_title')}
        tips={[t('info_stats_tip1'), t('info_stats_tip2'), t('info_stats_tip3'), t('info_stats_tip4')]}
      />
    </Animated.View>
  );
}
