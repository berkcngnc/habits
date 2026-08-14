import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../../utils/haptics';
import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { BackHandler, Platform, Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { SafeBannerAd } from '../../components/SafeBannerAd';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useTabSlide } from '../../hooks/useTabSlide';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring, withTiming, LinearTransition } from 'react-native-reanimated';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Habit, useHabits } from '../../context/HabitsContext';
import { usePomodoro } from '../../context/PomodoroContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAddHabitFlow } from '../../context/AddHabitTrigger';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import GainsModal from '../../components/GainsModal';
import HabitCard from '../../components/HabitCard';
import HomeHeader from '../../components/HomeHeader';
import InfoBubble from '../../components/InfoBubble';
import RelapseModal from '../../components/RelapseModal';
import { toPixelUpper, sanitizeForPixelFont } from '../../utils/fontSanitizer';
import PixelIcon from '../../components/PixelIcons';

// ─── Modal State Reducer ────────────────────────────────────────
// Owns the home-screen-only modals (delete / reset / gains / relapse).
// The Add-Habit flow lives in AddHabitTrigger context so it can be
// triggered from any tab.

interface ModalState {
  deleteTarget: string | null;
  resetTarget: string | null;
  relapseStep: number;
  gainsTarget: string | null;
}

type ModalAction =
  | { type: 'SET_DELETE_TARGET'; payload: string | null }
  | { type: 'SET_RESET_TARGET'; payload: string | null }
  | { type: 'SET_RELAPSE_STEP'; payload: number }
  | { type: 'SET_GAINS_TARGET'; payload: string | null };

const initialModalState: ModalState = {
  deleteTarget: null,
  resetTarget: null,
  relapseStep: 0,
  gainsTarget: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'SET_DELETE_TARGET':         return { ...state, deleteTarget: action.payload };
    case 'SET_RESET_TARGET':          return { ...state, resetTarget: action.payload, relapseStep: action.payload ? 1 : 0 };
    case 'SET_RELAPSE_STEP':          return { ...state, relapseStep: action.payload };
    case 'SET_GAINS_TARGET':          return { ...state, gainsTarget: action.payload };
    default:                          return state;
  }
}

// ─── Exit Toast ────────────────────────────────────────
function ExitToast({ visible }: { visible: boolean }) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 180 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(30, { duration: 180 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
    pointerEvents: 'none' as any,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        bottom: 100,
        left: 24,
        right: 24,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderRadius: 8,
        borderWidth: 3,
        borderTopColor: isDark ? '#475569' : '#e2e8f0',
        borderLeftColor: isDark ? '#475569' : '#e2e8f0',
        borderBottomColor: isDark ? '#0f172a' : '#475569',
        borderRightColor: isDark ? '#0f172a' : '#475569',
        paddingVertical: 14,
        paddingHorizontal: 20,
        alignItems: 'center',
        zIndex: 100,
        shadowColor: '#0f172a',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 10,
      }, animStyle]}
    >
      <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontFamily: 'VT323', fontSize: 20 }}>
        {sanitizeForPixelFont(t('tap_to_exit'))}
      </Text>
    </Animated.View>
  );
}

// ─── Ana Ekran ──────────────────────────────────────────
export default function HomeScreen() {
  const { t, language } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    habits, stats, isLoaded,
    toggleHabit, deleteHabit,
    resetNegativeHabit, reorderHabits,
    motivationState, currency,
  } = useHabits();
  const { setShowModal: setShowPomodoroModal } = usePomodoro();
  const addFlow = useAddHabitFlow();

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState);

  const { habitId } = useLocalSearchParams<{ habitId?: string }>();
  const flatListRef = useRef<FlatList<Habit>>(null);
  const [highlightedHabitId, setHighlightedHabitId] = useState<string | null>(null);

  useEffect(() => {
    if (!habitId) return;
    const index = habits.findIndex(h => h.id === habitId);
    if (index === -1) return;
    setHighlightedHabitId(habitId);
    try {
      flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    } catch {}
    const timer = setTimeout(() => setHighlightedHabitId(null), 1500);
    return () => clearTimeout(timer);
  }, [habitId]);

  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [swipeCloseSignal, setSwipeCloseSignal] = useState(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const exitPressedRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Hardware back: home-only modals first, then exit-toast logic.
  // Add-flow back handling is owned globally by AddHabitFlowHost.
  useBackHandler(() => {
    if (addFlow.showTimePicker) { addFlow.setShowTimePicker(false); return true; }
    if (addFlow.showCustomDaysPicker) { addFlow.setShowCustomDaysPicker(false); return true; }
    if (addFlow.isOpen) { addFlow.close(); return true; }
    if (modalState.deleteTarget) { dispatch({ type: 'SET_DELETE_TARGET', payload: null }); return true; }
    if (modalState.resetTarget) { dispatch({ type: 'SET_RESET_TARGET', payload: null }); return true; }

    setSwipeCloseSignal(prev => prev + 1);

    if (exitPressedRef.current) {
      BackHandler.exitApp();
      return true;
    }
    exitPressedRef.current = true;
    setShowExitToast(true);
    exitTimerRef.current = setTimeout(() => {
      exitPressedRef.current = false;
      setShowExitToast(false);
    }, 2000);
    return true;
  }, [
    addFlow.isOpen, addFlow.showTimePicker, addFlow.showCustomDaysPicker,
    modalState.deleteTarget, modalState.resetTarget,
  ]);

  // ── Handlers ──
  const handleToggle = useCallback((id: string, currentlyCompleted: boolean) => {
    toggleHabit(id);
  }, [toggleHabit]);

  const handleResetRequest = useCallback((id: string) => {
    dispatch({ type: 'SET_RESET_TARGET', payload: id });
    setSelectedTrigger('');
  }, []);

  // Stable callbacks for HabitCard — without these, every render of <HomeScreen>
  // produces fresh inline arrows that defeat React.memo on every list row.
  const handleDeleteRequest = useCallback((id: string) => {
    dispatch({ type: 'SET_DELETE_TARGET', payload: id });
  }, []);

  const handleGainsRequest = useCallback((id: string) => {
    dispatch({ type: 'SET_GAINS_TARGET', payload: id });
  }, []);

  const handleConfirmRelapse = () => {
    if (modalState.resetTarget) resetNegativeHabit(modalState.resetTarget, selectedTrigger || 'other');
    dispatch({ type: 'SET_RELAPSE_STEP', payload: 3 });
  };

  const handleRelapseFinish = () => {
    dispatch({ type: 'SET_RESET_TARGET', payload: null });
    setSelectedTrigger('');
  };

  // ── List render ──
  const renderHabitItem = useCallback(({ item, drag, isActive }: RenderItemParams<Habit>) => (
    <View>
      <HabitCard
        item={item}
        drag={drag}
        isActive={isActive}
        swipeCloseSignal={swipeCloseSignal}
        currency={currency}
        isDark={isDark}
        language={language}
        t={t}
        onToggle={handleToggle}
        onDeleteRequest={handleDeleteRequest}
        onResetRequest={handleResetRequest}
        onGainsRequest={handleGainsRequest}
      />
      {item.id === highlightedHabitId && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            borderRadius: 16, borderWidth: 2, borderColor: '#3b82f6',
          }}
        />
      )}
    </View>
  ), [swipeCloseSignal, handleToggle, handleResetRequest, handleDeleteRequest, handleGainsRequest, currency, highlightedHabitId, isDark, language, t]);

  const currentLevelProgress = stats.xp % 100;

  const ListHeader = useCallback(() => (
    <HomeHeader
      motivationState={motivationState}
      level={stats.level}
      xp={stats.xp}
      currentLevelProgress={currentLevelProgress}
      onInfoPress={() => setShowInfo(true)}
      onPomodoroPress={() => setShowPomodoroModal(true)}
    />
  ), [motivationState, stats, currentLevelProgress, setShowPomodoroModal]);

  const ListEmpty = useCallback(() => {
    if (!isLoaded) return null;
    const innerDark = colorScheme === 'dark';
    return (
      <Animated.View entering={FadeIn.delay(300)} className="items-center justify-center py-12 opacity-80">
        <View
          className="w-24 h-24 bg-gray-100 dark:bg-zinc-900 rounded-lg items-center justify-center mb-5 border-4"
          style={{
            borderTopColor: innerDark ? '#475569' : '#ffffff',
            borderLeftColor: innerDark ? '#475569' : '#ffffff',
            borderBottomColor: innerDark ? '#0f172a' : '#cbd5e1',
            borderRightColor: innerDark ? '#0f172a' : '#cbd5e1',
            shadowColor: '#0f172a',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 40 }}>🌱</Text>
        </View>
        <Text style={{ fontFamily: 'VT323', fontSize: 26 }} className="text-slate-800 dark:text-zinc-100 mb-2">{t('list_empty')}</Text>
        <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-zinc-400 text-center px-4 leading-5">{t('no_habit_yet')}</Text>
      </Animated.View>
    );
  }, [isLoaded, t, colorScheme]);

  const ListFooter = useCallback(() => {
    if (!isLoaded || habits.length === 0) return null;
    const cleanHelperText = t('helper_text').replace('💡 ', '').replace('💡', '');
    const innerDark = colorScheme === 'dark';
    return (
      <Animated.View
        entering={FadeIn.delay(400)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          marginTop: 16,
          opacity: 0.6,
          paddingHorizontal: 24,
        }}
      >
        <PixelIcon name="Lightbulb" color={innerDark ? '#eab308' : '#ca8a04'} size={14} />
        <Text
          style={{ fontFamily: 'VT323', fontSize: 16, marginLeft: 6, flexShrink: 1 }}
          className="text-gray-500 dark:text-gray-400 leading-5"
        >
          {cleanHelperText}
        </Text>
      </Animated.View>
    );
  }, [isLoaded, habits.length, t, colorScheme]);

  // ── Render ──
  const slideStyle = useTabSlide(0);
  return (
    <Animated.View style={[slideStyle, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
      {/* Habit List */}
      <DraggableFlatList
        ref={flatListRef}
        data={habits}
        keyExtractor={item => item.id}
        renderItem={renderHabitItem}
        onScrollToIndexFailed={({ averageItemLength, index }) => {
          flatListRef.current?.scrollToOffset({ offset: index * averageItemLength, animated: true });
        }}
        onDragBegin={() => {
          safeHaptics.impact(Haptics.ImpactFeedbackStyle.Heavy);
        }}
        onDragEnd={({ data }) => reorderHabits(data)}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<ListEmpty />}
        ListFooterComponent={<ListFooter />}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 170 }}
        showsVerticalScrollIndicator={false}
        activationDistance={10}
        itemLayoutAnimation={LinearTransition.springify().damping(20)}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        targetId={modalState.deleteTarget}
        onConfirm={id => { deleteHabit(id); dispatch({ type: 'SET_DELETE_TARGET', payload: null }); }}
        onCancel={() => dispatch({ type: 'SET_DELETE_TARGET', payload: null })}
      />

      {/* Gains Modal */}
      <GainsModal
        habitId={modalState.gainsTarget}
        habits={habits}
        currency={currency}
        onClose={() => dispatch({ type: 'SET_GAINS_TARGET', payload: null })}
      />

      {/* Relapse Modal */}
      <RelapseModal
        targetId={modalState.resetTarget}
        habits={habits}
        relapseStep={modalState.relapseStep}
        selectedTrigger={selectedTrigger}
        onSelectTrigger={setSelectedTrigger}
        onCancel={() => dispatch({ type: 'SET_RESET_TARGET', payload: null })}
        onNextStep={() => dispatch({ type: 'SET_RELAPSE_STEP', payload: modalState.relapseStep === 1 ? 2 : 1 })}
        onConfirmRelapse={handleConfirmRelapse}
        onFinish={handleRelapseFinish}
      />

      {/* Banner Ad */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colorScheme === 'dark' ? '#000000' : '#f9fafb',
        }}
      >
        <SafeBannerAd />
      </View>

      {/* Exit Toast */}
      <ExitToast visible={showExitToast} />

      {/* Info Bubble */}
      <InfoBubble
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title={t('info_home_title')}
        tips={[t('info_home_tip1'), t('info_home_tip2'), t('info_home_tip3'), t('info_home_tip4')]}
      />
    </Animated.View>
  );
}
