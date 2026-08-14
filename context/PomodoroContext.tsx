import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useHabits } from './HabitsContext';
import { schedulePomodoroAlarm, cancelPomodoroAlarm } from '../engine/NotificationEngine';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';

export type PomodoroMode = 'work' | 'break';

interface PomodoroContextProps {
  isActive: boolean;
  mode: PomodoroMode;
  timeRemaining: number;
  workDuration: number;
  breakDuration: number;
  setWorkDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  isPaused: boolean;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

const PomodoroContext = createContext<PomodoroContextProps | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { addPomodoroTime } = useHabits();
  
  const [showModal, setShowModal] = useState(false);
  const [workDuration, setWorkDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeRemaining, setTimeRemaining] = useState(workDuration * 60);

  // Use refs to track actual time without being constrained by React state batches
  const expectedEndTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync initial time if not active
  useEffect(() => {
    if (!isActive && !isPaused) {
      setTimeRemaining((mode === 'work' ? workDuration : breakDuration) * 60);
    }
  }, [workDuration, breakDuration, mode, isActive, isPaused]);

  const completeTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    expectedEndTimeRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mode === 'work') {
      addPomodoroTime(workDuration * 60);
      setMode('break');
      setTimeRemaining(breakDuration * 60);
    } else {
      setMode('work');
      setTimeRemaining(workDuration * 60);
    }
    
    // Attempt haptics if foregrounded
    safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
  }, [mode, workDuration, breakDuration, addPomodoroTime]);

  const startTimer = useCallback(() => {
    if (!isActive || isPaused) {
      const now = Date.now();
      const endTime = now + timeRemaining * 1000;
      expectedEndTimeRef.current = endTime;
      
      setIsActive(true);
      setIsPaused(false);

      // Schedule notification alarm
      schedulePomodoroAlarm(mode, endTime).catch(console.error);
    }
  }, [isActive, isPaused, timeRemaining, mode]);

  const pauseTimer = useCallback(() => {
    if (isActive && !isPaused) {
      setIsPaused(true);
      expectedEndTimeRef.current = null;
      cancelPomodoroAlarm().catch(console.error);
    }
  }, [isActive, isPaused]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    expectedEndTimeRef.current = null;
    
    // Add partial time if we stopped a work session early
    if (mode === 'work') {
      const elapsed = (workDuration * 60) - timeRemaining;
      if (elapsed > 0) {
        addPomodoroTime(elapsed);
      }
    }
    
    setTimeRemaining((mode === 'work' ? workDuration : breakDuration) * 60);
    cancelPomodoroAlarm().catch(console.error);
  }, [isActive, isPaused, mode, workDuration, breakDuration, timeRemaining, addPomodoroTime]);

  // Main tick interval
  useEffect(() => {
    if (isActive && !isPaused && expectedEndTimeRef.current) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const end = expectedEndTimeRef.current!;
        const remaining = Math.ceil((end - now) / 1000);

        if (remaining <= 0) {
          setTimeRemaining(0);
          completeTimer();
        } else {
          setTimeRemaining(remaining);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isPaused, completeTimer]);

  // Handle app state changes (background/foreground sync)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isActive && !isPaused && expectedEndTimeRef.current) {
        // App came to foreground, sync time based on expectedEndTime
        const now = Date.now();
        const end = expectedEndTimeRef.current;
        const remaining = Math.ceil((end - now) / 1000);
        
        if (remaining <= 0) {
          // Timer finished while in background
          setTimeRemaining(0);
          completeTimer();
        } else {
          setTimeRemaining(remaining);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isActive, isPaused, completeTimer]);

  const contextValue = {
    isActive,
    mode,
    timeRemaining,
    workDuration,
    breakDuration,
    setWorkDuration,
    setBreakDuration,
    startTimer,
    pauseTimer,
    stopTimer,
    isPaused,
    showModal,
    setShowModal,
  };

  return (
    <PomodoroContext.Provider value={contextValue}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
