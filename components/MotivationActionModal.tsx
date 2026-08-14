import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { OverlayModal } from './OverlayModal';
import { useLanguage } from '../context/LanguageContext';
import type { ExerciseMode } from '../constants/FallbackAds';

const ACCENT: Record<ExerciseMode, { color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }> = {
  breathe:   { color: '#7DD3FC', soft: 'rgba(125,211,252,0.15)', icon: 'cloud-outline' },
  focus:     { color: '#A78BFA', soft: 'rgba(167,139,250,0.15)', icon: 'eye-outline' },
  pep_talk:  { color: '#FBBF24', soft: 'rgba(251,191,36,0.15)',  icon: 'flame-outline' },
  affirm:    { color: '#F472B6', soft: 'rgba(244,114,182,0.15)', icon: 'star-outline' },
  stretch:   { color: '#34D399', soft: 'rgba(52,211,153,0.15)',  icon: 'body-outline' },
  gratitude: { color: '#FCA5A5', soft: 'rgba(252,165,165,0.15)', icon: 'heart-outline' },
};

type Props = {
  visible: boolean;
  mode: ExerciseMode | null;
  onClose: () => void;
};

export function MotivationActionModal({ visible, mode, onClose }: Props) {
  const { t } = useLanguage();
  if (!mode) return null;
  const accent = ACCENT[mode];

  return (
    <OverlayModal visible={visible} onDismiss={onClose}>
      <View
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 8,
          borderWidth: 4,
          borderColor: '#1e293b',
          paddingVertical: 24,
          paddingHorizontal: 20,
          alignItems: 'center',
          shadowColor: '#0f172a',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 5,
        }}
      >
        {/* Close button */}
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => ({
            position: 'absolute', top: 12, right: 12, zIndex: 5,
            opacity: pressed ? 0.5 : 1,
            padding: 4,
            borderWidth: 2,
            borderColor: '#1e293b',
            borderRadius: 4,
            backgroundColor: '#1e293b',
          })}
        >
          <Ionicons name="close" size={16} color="#fafafa" />
        </Pressable>

        {/* Header */}
        <View
          style={{
            width: 44, height: 44, borderRadius: 6,
            backgroundColor: accent.soft,
            borderWidth: 2, borderColor: '#1e293b',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <Ionicons name={accent.icon} size={22} color={accent.color} />
        </View>
        <Text style={{ color: '#fafafa', fontSize: 11, fontFamily: 'PressStart2P', marginBottom: 6, textAlign: 'center' }}>
          {t(`exercise_${mode}_title`)}
        </Text>
        <Text style={{ color: '#a1a1aa', fontSize: 16, fontFamily: 'VT323', marginBottom: 16, textAlign: 'center' }}>
          {t(`exercise_${mode}_subtitle`)}
        </Text>

        {/* Mode-specific body */}
        {mode === 'breathe' && <BreatheBody onClose={onClose} accent={accent.color} />}
        {mode === 'focus' && <FocusBody onClose={onClose} accent={accent.color} />}
        {mode === 'pep_talk' && (
          <PhraseBody
            onClose={onClose}
            accent={accent.color}
            phrases={[
              t('pep_1'), t('pep_2'), t('pep_3'), t('pep_4'), t('pep_5'),
            ]}
            perPhraseMs={2800}
          />
        )}
        {mode === 'affirm' && (
          <PhraseBody
            onClose={onClose}
            accent={accent.color}
            phrases={[
              t('affirm_1'), t('affirm_2'), t('affirm_3'), t('affirm_4'), t('affirm_5'),
            ]}
            perPhraseMs={3500}
          />
        )}
        {mode === 'stretch' && <StretchBody onClose={onClose} accent={accent.color} />}
        {mode === 'gratitude' && <GratitudeBody onClose={onClose} accent={accent.color} />}
      </View>
    </OverlayModal>
  );
}

/* ────────────────────────── BREATHE (60s box breathing) ────────────────────────── */

function BreatheBody({ onClose, accent }: { onClose: () => void; accent: string }) {
  const { t } = useLanguage();
  const PHASES: Array<{ key: 'inhale' | 'hold1' | 'exhale' | 'hold2'; label: string; ms: number }> = [
    { key: 'inhale', label: t('breathe_inhale'), ms: 4000 },
    { key: 'hold1',  label: t('breathe_hold'),   ms: 4000 },
    { key: 'exhale', label: t('breathe_exhale'), ms: 4000 },
    { key: 'hold2',  label: t('breathe_hold'),   ms: 4000 },
  ];
  const TOTAL_MS = 60_000;

  const scale = useSharedValue(0.6);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_MS / 1000);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let phaseTimer: ReturnType<typeof setTimeout> | null = null;
    let i = 0;

    const tick = () => {
      if (cancelled) return;
      const phase = PHASES[i % PHASES.length];
      setPhaseIdx(i % PHASES.length);

      if (phase.key === 'inhale') {
        scale.value = withTiming(1, { duration: phase.ms, easing: Easing.inOut(Easing.cubic) });
      } else if (phase.key === 'exhale') {
        scale.value = withTiming(0.6, { duration: phase.ms, easing: Easing.inOut(Easing.cubic) });
      }

      safeHaptics.selection();

      i += 1;
      phaseTimer = setTimeout(tick, phase.ms);
    };
    tick();

    const startedAt = Date.now();
    const countdown = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, Math.ceil((TOTAL_MS - elapsed) / 1000));
      setSecondsLeft(left);
      if (elapsed >= TOTAL_MS) {
        cancelled = true;
        if (phaseTimer) clearTimeout(phaseTimer);
        clearInterval(countdown);
        cancelAnimation(scale);
        scale.value = withTiming(0.7, { duration: 600 });
        setDone(true);
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      }
    }, 200);

    return () => {
      cancelled = true;
      if (phaseTimer) clearTimeout(phaseTimer);
      clearInterval(countdown);
      cancelAnimation(scale);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        {/* outer guide ring */}
        <View
          style={{
            position: 'absolute',
            width: 200, height: 200, borderRadius: 100,
            borderWidth: 2, borderColor: accent + '33',
          }}
        />
        {/* breathing ring */}
        <Animated.View
          style={[
            {
              width: 180, height: 180, borderRadius: 90,
              backgroundColor: accent + '14',
              borderWidth: 3, borderColor: '#1e293b',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: accent, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 0 },
            },
            ringStyle,
          ]}
        >
          <Text style={{ color: '#fafafa', fontSize: 10, fontFamily: 'PressStart2P', textAlign: 'center', paddingHorizontal: 10 }}>
            {done ? t('exercise_done') : PHASES[phaseIdx].label}
          </Text>
          <Text style={{ color: accent, fontSize: 32, fontFamily: 'VT323', marginTop: 8 }}>
            {formatMSS(secondsLeft)}
          </Text>
        </Animated.View>
      </View>

      <ActionFooter onClose={onClose} done={done} accent={accent} />
    </View>
  );
}

/* ────────────────────────── FOCUS (60s minute timer) ────────────────────────── */

function FocusBody({ onClose, accent }: { onClose: () => void; accent: string }) {
  const { t } = useLanguage();
  const TOTAL = 60;
  const [left, setLeft] = useState(TOTAL);
  const [done, setDone] = useState(false);
  const progress = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(0, { duration: TOTAL * 1000, easing: Easing.linear });
    const startedAt = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, TOTAL - elapsed);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setDone(true);
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      }
    }, 250);
    return () => {
      clearInterval(id);
      cancelAnimation(progress);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View
        style={{
          width: 160, height: 160, borderRadius: 8,
          borderWidth: 4, borderColor: '#1e293b',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
          backgroundColor: 'rgba(255,255,255,0.02)',
          shadowColor: '#0f172a',
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
        }}
      >
        <Text style={{ color: '#fafafa', fontSize: 36, fontFamily: 'PressStart2P' }}>{formatMSS(left)}</Text>
        <Text style={{ color: '#a1a1aa', fontSize: 16, fontFamily: 'VT323', marginTop: 10 }}>
          {done ? t('exercise_done') : t('focus_hint')}
        </Text>
      </View>

      <View style={{ width: '100%', height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', marginBottom: 16, borderWidth: 2, borderColor: '#1e293b' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: accent }, barStyle]} />
      </View>

      <ActionFooter onClose={onClose} done={done} accent={accent} />
    </View>
  );
}

/* ────────────────────────── PHRASE (pep_talk / affirm) ────────────────────────── */

function PhraseBody({
  onClose,
  accent,
  phrases,
  perPhraseMs,
}: {
  onClose: () => void;
  accent: string;
  phrases: string[];
  perPhraseMs: number;
}) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const opacity = useSharedValue(0);
  const ty = useSharedValue(8);

  useEffect(() => {
    let cancelled = false;
    let i = 0;

    const showNext = () => {
      if (cancelled) return;
      opacity.value = withSequence(
        withTiming(0, { duration: 220 }),
        withTiming(1, { duration: 320 })
      );
      ty.value = withSequence(
        withTiming(-6, { duration: 220 }),
        withTiming(0, { duration: 320 })
      );
      setIdx(i);
      if (i >= phrases.length - 1) {
        setTimeout(() => { if (!cancelled) setDone(true); }, perPhraseMs);
        return;
      }
      i += 1;
      setTimeout(showNext, perPhraseMs);
    };

    opacity.value = withTiming(1, { duration: 320 });
    ty.value = withTiming(0, { duration: 320 });
    const t0 = setTimeout(showNext, perPhraseMs);
    return () => {
      cancelled = true;
      clearTimeout(t0);
      cancelAnimation(opacity);
      cancelAnimation(ty);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phraseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <View style={{ alignItems: 'center', width: '100%', minHeight: 160, justifyContent: 'center' }}>
      <Animated.View style={[{ paddingHorizontal: 8, paddingVertical: 14, alignItems: 'center' }, phraseStyle]}>
        <Text style={{ color: '#fafafa', fontSize: 22, fontFamily: 'VT323', textAlign: 'center', lineHeight: 26 }}>
          {phrases[idx]}
        </Text>
      </Animated.View>

      {/* progress dots */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, marginBottom: 16 }}>
        {phrases.map((_, i) => (
          <View
            key={i}
            style={{
              width: 8, height: 8,
              borderRadius: 0,
              borderWidth: 1,
              borderColor: '#1e293b',
              backgroundColor: i <= idx ? accent : '#27272a',
            }}
          />
        ))}
      </View>

      <ActionFooter onClose={onClose} done={done} accent={accent} />
    </View>
  );
}

/* ────────────────────────── STRETCH (30s) ────────────────────────── */

function StretchBody({ onClose, accent }: { onClose: () => void; accent: string }) {
  const { t } = useLanguage();
  const STEPS = [t('stretch_1'), t('stretch_2'), t('stretch_3'), t('stretch_4'), t('stretch_5'), t('stretch_6')];
  const STEP_MS = 5000;
  const TOTAL = (STEPS.length * STEP_MS) / 1000;

  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(TOTAL);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const tickId = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const stepIdx = Math.min(STEPS.length - 1, Math.floor(elapsedMs / STEP_MS));
      setIdx(stepIdx);
      const remaining = Math.max(0, TOTAL - Math.floor(elapsedMs / 1000));
      setLeft(remaining);
      if (elapsedMs >= STEPS.length * STEP_MS) {
        clearInterval(tickId);
        setDone(true);
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      }
    }, 250);
    return () => clearInterval(tickId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View
        style={{
          minHeight: 120,
          width: '100%',
          borderRadius: 8,
          backgroundColor: '#1e293b',
          borderWidth: 2,
          borderColor: '#1e293b',
          paddingVertical: 14, paddingHorizontal: 12,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Text style={{ color: accent, fontSize: 8, fontFamily: 'PressStart2P' }}>
          {done ? t('exercise_done') : `${idx + 1} / ${STEPS.length}`}
        </Text>
        <Text style={{ color: '#fafafa', fontSize: 20, fontFamily: 'VT323', marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          {STEPS[idx]}
        </Text>
        <Text style={{ color: '#a1a1aa', fontSize: 16, fontFamily: 'VT323', marginTop: 6 }}>{formatMSS(left)}</Text>
      </View>
      <ActionFooter onClose={onClose} done={done} accent={accent} />
    </View>
  );
}

/* ────────────────────────── GRATITUDE (3 prompts) ────────────────────────── */

function GratitudeBody({ onClose, accent }: { onClose: () => void; accent: string }) {
  const { t } = useLanguage();
  const PROMPTS = [t('gratitude_1'), t('gratitude_2'), t('gratitude_3')];
  const [idx, setIdx] = useState(0);
  const done = idx >= PROMPTS.length;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View
        style={{
          minHeight: 130, width: '100%',
          borderRadius: 8,
          backgroundColor: '#1e293b',
          borderWidth: 2, borderColor: '#1e293b',
          padding: 14, marginBottom: 14,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {!done ? (
          <>
            <Text style={{ color: accent, fontSize: 8, fontFamily: 'PressStart2P', marginBottom: 4 }}>
              {idx + 1} / {PROMPTS.length}
            </Text>
            <Text style={{ color: '#fafafa', fontSize: 20, fontFamily: 'VT323', marginTop: 4, textAlign: 'center', lineHeight: 22 }}>
              {PROMPTS[idx]}
            </Text>
          </>
        ) : (
          <Text style={{ color: '#fafafa', fontSize: 20, fontFamily: 'VT323', textAlign: 'center', lineHeight: 22 }}>
            {t('gratitude_close')}
          </Text>
        )}
      </View>

      {!done ? (
        <Pressable
          onPress={() => {
            safeHaptics.selection();
            setIdx(i => i + 1);
          }}
          style={({ pressed }) => ({
            backgroundColor: accent,
            paddingHorizontal: 20, paddingVertical: 10,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: '#1e293b',
            opacity: pressed ? 0.85 : 1,
            marginBottom: 6,
            shadowColor: '#0f172a',
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
          })}
        >
          <Text style={{ color: '#0a0a0a', fontSize: 9, fontFamily: 'PressStart2P', fontWeight: 'bold' }}>
            {idx === PROMPTS.length - 1 ? t('exercise_finish') : t('exercise_next')}
          </Text>
        </Pressable>
      ) : (
        <ActionFooter onClose={onClose} done accent={accent} />
      )}
    </View>
  );
}

/* ────────────────────────── helpers ────────────────────────── */

function ActionFooter({ onClose, done, accent }: { onClose: () => void; done: boolean; accent: string }) {
  const { t } = useLanguage();
  return (
    <Pressable
      onPress={onClose}
      style={({ pressed }) => ({
        backgroundColor: done ? accent : '#1e293b',
        borderColor: '#1e293b',
        borderWidth: 2,
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 6,
        opacity: pressed ? 0.85 : 1,
        shadowColor: '#0f172a',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
      })}
    >
      <Text style={{ color: done ? '#0a0a0a' : '#fafafa', fontSize: 9, fontFamily: 'PressStart2P', fontWeight: 'bold' }}>
        {done ? t('exercise_done_btn') : t('exercise_skip')}
      </Text>
    </Pressable>
  );
}

function formatMSS(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default MotivationActionModal;

