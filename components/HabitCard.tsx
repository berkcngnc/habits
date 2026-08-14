import { useColorScheme } from "nativewind";
import { sanitizeForPixelFont } from "../utils/fontSanitizer";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { safeHaptics } from "../utils/haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { Habit } from "../context/HabitsContext";
import { useLanguage } from "../context/LanguageContext";
import { calculateNegativeStreak, isHabitValidToday } from "../utils/dateUtils";
import SwipeableHabitRow from "./SwipeableHabitRow";
import PixelIcon, { PixelIconName } from "./PixelIcons";

const getPixelIconName = (completed: boolean, icon: string): PixelIconName => {
  if (completed) return 'Check';
  if (icon === 'ban') return 'Ban';
  if (icon === 'bolt') return 'LightningBolt';
  if (icon === 'star') return 'Star';
  if (icon === 'trophy') return 'Trophy';
  if (icon === 'bell') return 'Bell';
  if (icon === 'moon-o') return 'Moon';
  if (icon === 'trash') return 'Trash';
  if (icon === 'lock') return 'Lock';
  return 'Star'; // fallback
};

interface HabitCardProps {
  item: Habit;
  drag: () => void;
  isActive: boolean;
  swipeCloseSignal: number;
  currency: string;
  isDark: boolean;
  language: string;
  t: (key: any, options?: any) => string;
  onToggle: (id: string, currentlyCompleted: boolean) => void;
  onDeleteRequest: (id: string) => void;
  onResetRequest: (id: string) => void;
  onGainsRequest: (id: string) => void;
}

function HabitCard({
  item: habit,
  drag,
  isActive,
  swipeCloseSignal,
  currency,
  isDark,
  language,
  t,
  onToggle,
  onDeleteRequest,
  onResetRequest,
  onGainsRequest,
}: HabitCardProps) {
  // Computed for all habit types to satisfy hooks rules (used in negative section).
  // Memoized: uzun listede her kart re-render'ında relapseHistory'i sortlamak israf.
  const daysClean = useMemo(
    () => habit.type === "negative"
      ? calculateNegativeStreak(habit.startDate, habit.relapseHistory)
      : 0,
    [habit.type, habit.startDate, habit.relapseHistory],
  );
  const moneySaved = (habit.costPerDay || 0) * daysClean;
  const totalMinsSaved = (habit.timePerDay || 0) * daysClean;
  const hoursSaved = Math.floor(totalMinsSaved / 60);
  const minsSaved = totalMinsSaved % 60;
  const milestones = [1, 3, 7, 14, 30, 90, 365];
  const milestoneKeys = [
    "milestone_1",
    "milestone_3",
    "milestone_7",
    "milestone_14",
    "milestone_30",
    "milestone_90",
    "milestone_365",
  ];
  const currentMilestoneIdx = milestones.findIndex((m) => daysClean < m);
  const nextMilestone =
    currentMilestoneIdx >= 0 ? milestones[currentMilestoneIdx] : 365;
  const prevMilestone =
    currentMilestoneIdx > 0 ? milestones[currentMilestoneIdx - 1] : 0;
  const milestoneProgress =
    nextMilestone > prevMilestone
      ? Math.min(
          100,
          Math.round(
            ((daysClean - prevMilestone) / (nextMilestone - prevMilestone)) *
              100,
          ),
        )
      : 100;
  const nextMilestoneKey =
    currentMilestoneIdx >= 0
      ? milestoneKeys[currentMilestoneIdx]
      : milestoneKeys[milestoneKeys.length - 1];

  // Animation hooks
  const checkScale = useSharedValue(1);
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const milestoneAnim = useSharedValue(milestoneProgress);
  const milestoneBarStyle = useAnimatedStyle(() => ({
    width: `${milestoneAnim.value}%`,
  }));

  useEffect(() => {
    milestoneAnim.value = withTiming(milestoneProgress, { duration: 600 });
  }, [milestoneProgress]);

  if (habit.type === "positive") {
    const isValidToday = isHabitValidToday(habit.frequency, habit.customDays);

    const handlePositivePress = () => {
      checkScale.value = withSequence(
        withSpring(1.35, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      onToggle(habit.id, habit.completed);
    };

    return (
      <ScaleDecorator>
        <SwipeableHabitRow
          onDelete={() => onDeleteRequest(habit.id)}
          onSwipeOpen={() => {}}
          swipeCloseSignal={swipeCloseSignal}
        >
          <Pressable
            onPress={handlePositivePress}
            onLongPress={() => {
              safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
              drag();
            }}
            delayLongPress={200}
            disabled={isActive || (!isValidToday && !habit.completed)}
            accessibilityRole="button"
            accessibilityLabel={`${habit.title} - ${habit.completed ? t("cancel") : t("add")}`}
            className={`flex-row items-center justify-between p-5 rounded-lg border-4 border-slate-800 ${
              habit.completed
                ? "bg-indigo-50 dark:bg-indigo-950/70"
                : "bg-white dark:bg-zinc-900"
            } ${!isValidToday && !habit.completed ? "opacity-50" : ""}`}
            style={({ pressed }) => [
              isActive
                ? {
                    shadowColor: "#0f172a",
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    shadowOffset: { width: 6, height: 6 },
                    elevation: 10,
                  }
                : {
                    shadowColor: "#0f172a",
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    shadowOffset: { width: 4, height: 4 },
                    elevation: 2,
                  },
              {
                borderTopColor: isDark ? '#475569' : '#e2e8f0',
                borderLeftColor: isDark ? '#475569' : '#e2e8f0',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              },
              { transform: [{ scale: pressed && !isActive ? 0.98 : 1 }] },
            ]}
          >
            <View className="flex-row items-center flex-1">
              <Animated.View style={checkStyle}>
                <View
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: habit.completed }}
                  accessibilityLabel={habit.completed ? t("cancel") : t("add")}
                  className={`w-10 h-10 rounded-md items-center justify-center mr-4 border-4 border-slate-800 ${
                    habit.completed
                      ? "bg-gray-200 dark:bg-gray-700"
                      : "bg-transparent"
                  } ${!isValidToday && !habit.completed ? "opacity-50" : ""}`}
                  style={[
                    !habit.completed && isValidToday
                      ? { backgroundColor: (habit.color || "#6366f1") + "15" }
                      : undefined,
                    {
                      borderTopColor: isDark ? '#475569' : '#e2e8f0',
                      borderLeftColor: isDark ? '#475569' : '#e2e8f0',
                      borderBottomColor: isDark ? '#0f172a' : '#475569',
                      borderRightColor: isDark ? '#0f172a' : '#475569',
                    }
                  ]}
                >
                  <PixelIcon
                    name={getPixelIconName(habit.completed, habit.icon || 'star')}
                    size={16}
                    color={habit.completed ? "#4b5563" : habit.color || "#6366f1"}
                  />
                </View>
              </Animated.View>
              <View className="flex-1">
                <Text
                  style={{ fontFamily: 'VT323', fontSize: 24, lineHeight: 26 }}
                  className={`${
                    habit.completed
                      ? "text-gray-400 dark:text-zinc-500 line-through decoration-gray-400 dark:decoration-gray-600"
                      : !isValidToday
                        ? "text-gray-400 dark:text-zinc-500"
                        : "text-gray-900 dark:text-zinc-100"
                  }`}
                >
                  {sanitizeForPixelFont(habit.title)}
                </Text>
                {habit.streak >= 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                    <PixelIcon
                      name="Fire"
                      color={
                        habit.completed || !isValidToday
                          ? (isDark ? "#4b5563" : "#9ca3af")
                          : "#f97316"
                      }
                      size={13}
                    />
                    <Text
                      numberOfLines={1}
                      style={{ fontFamily: 'VT323', fontSize: 16, marginLeft: 4 }}
                      className={`${
                        habit.completed
                          ? "text-gray-400 dark:text-gray-600"
                          : !isValidToday
                            ? "text-gray-400 dark:text-gray-600"
                            : "text-indigo-500 dark:text-indigo-400"
                      }`}
                    >
                      {t("streak_days", { count: habit.streak })}
                      {habit.frequency === "weekdays"
                        ? " • " + t("weekdays")
                        : habit.frequency === "weekends"
                          ? " • " + t("weekends")
                          : habit.frequency === "custom"
                            ? " • " + t("freq_custom")
                            : ""}
                      {!isValidToday && !habit.completed
                        ? " (" + t("closed_today") + ")"
                        : ""}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        </SwipeableHabitRow>
      </ScaleDecorator>
    );
  }

  // Negative habit
  return (
    <ScaleDecorator>
      <SwipeableHabitRow
        onDelete={() => onDeleteRequest(habit.id)}
        onSwipeOpen={() => {}}
        swipeCloseSignal={swipeCloseSignal}
      >
        <Pressable
          onPress={() => {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
            onGainsRequest(habit.id);
          }}
          onLongPress={() => {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
            drag();
          }}
          delayLongPress={200}
          disabled={isActive}
          accessibilityRole="button"
          accessibilityLabel={`${habit.title} - ${t("track_progress")}`}
          className="p-5 bg-white dark:bg-zinc-900 rounded-lg border-4 border-slate-800"
          style={({ pressed }) => [
            isActive
              ? {
                  shadowColor: "#0f172a",
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  shadowOffset: { width: 6, height: 6 },
                  elevation: 10,
                }
              : {
                  shadowColor: "#0f172a",
                  shadowOpacity: 1,
                  shadowRadius: 0,
                  shadowOffset: { width: 4, height: 4 },
                  elevation: 2,
                },
            {
              borderTopColor: isDark ? '#475569' : '#e2e8f0',
              borderLeftColor: isDark ? '#475569' : '#e2e8f0',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
            },
            { transform: [{ scale: pressed && !isActive ? 0.98 : 1 }] },
          ]}
        >
          {/* Row 1: Title + Reset */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View
                className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3 border-2"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Ban" size={14} color="#ef4444" />
              </View>
              <Text
                style={{ fontFamily: 'VT323', fontSize: 24, lineHeight: 26 }}
                className="text-gray-900 dark:text-zinc-100 flex-1"
                numberOfLines={1}
              >
                {sanitizeForPixelFont(habit.title)}
              </Text>
            </View>
            <Pressable
              className="bg-neutral-100 dark:bg-white/10 p-2.5 rounded-md border-2 items-center justify-center ml-2"
              style={{
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
              }}
              onPress={() => onResetRequest(habit.id)}
              accessibilityRole="button"
              accessibilityLabel={`${habit.title} - ${t("reset_relapse")}`}
            >
              <PixelIcon name="Undo" size={14} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Row 2: Milestone Progress */}
          <View className="flex-row items-center mb-2">
            <View
              className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded-md border-2 border-slate-800 overflow-hidden mr-3"
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: milestoneProgress }}
            >
              <Animated.View
                className="h-full bg-emerald-500 rounded-none"
                style={milestoneBarStyle}
              />
            </View>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-emerald-600 dark:text-emerald-400 font-bold">
              {milestoneProgress}%
            </Text>
          </View>

          {/* Row 3: Stats */}
          <View className="flex-row items-center flex-wrap gap-x-3 mt-1">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <PixelIcon name="Trophy" color={isDark ? "#34d399" : "#059669"} size={13} />
              <Text style={{ fontFamily: 'VT323', fontSize: 16, marginLeft: 4 }} className="text-emerald-600 dark:text-emerald-400 font-bold">
                {t("days_free", { count: daysClean })}
              </Text>
            </View>
            {moneySaved > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <PixelIcon name="Star" color={isDark ? "#34d399" : "#059669"} size={13} />
                <Text style={{ fontFamily: 'VT323', fontSize: 16, marginLeft: 4 }} className="text-emerald-500 dark:text-emerald-400 font-medium">
                  {currency}
                  {moneySaved.toLocaleString(language)}
                </Text>
              </View>
            )}
            {totalMinsSaved > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <PixelIcon name="LightningBolt" color={isDark ? "#c084fc" : "#7e22ce"} size={13} />
                <Text style={{ fontFamily: 'VT323', fontSize: 16, marginLeft: 4 }} className="text-purple-500 dark:text-purple-400 font-medium">
                  {hoursSaved > 0 ? `${hoursSaved}${t("hours_short")} ` : ""}
                  {minsSaved > 0 ? `${minsSaved}${t("minutes_short")}` : ""}
                </Text>
              </View>
            )}
          </View>
 
          {/* Row 4: Next Milestone */}
          {currentMilestoneIdx >= 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
              <PixelIcon name="Flag" color={isDark ? "#52525b" : "#9ca3af"} size={11} />
              <Text style={{ fontFamily: 'VT323', fontSize: 14, marginLeft: 4 }} className="text-gray-400 dark:text-zinc-500 font-medium">
                {t("next_milestone")}: {t(nextMilestoneKey)}
              </Text>
            </View>
          )}
        </Pressable>
      </SwipeableHabitRow>
    </ScaleDecorator>
  );
}

export default React.memo(HabitCard, (prev, next) => {
  return (
    prev.item === next.item &&
    prev.isActive === next.isActive &&
    prev.swipeCloseSignal === next.swipeCloseSignal &&
    prev.currency === next.currency &&
    prev.isDark === next.isDark &&
    prev.language === next.language
  );
});
