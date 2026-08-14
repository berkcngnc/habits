import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import { useHabits } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';
import { PERSONALITY_LABELS, HabitusPersonalityType } from '../constants/HabitusDialogues';

interface Question {
  text: string;
  options: {
    text: string;
    scores: Partial<Record<HabitusPersonalityType, number>>;
  }[];
}

export default function HabitusQuestionnaire() {
  const { setPersonality } = useHabits();
  const { t } = useLanguage();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({
    cheerful: 0,
    aggressive: 0,
    bully: 0,
    encouraging: 0,
    sarcastic: 0,
    zen: 0,
    indifferent: 0
  });

  const [result, setResult] = useState<HabitusPersonalityType | null>(null);

  // İnce Ayar State'leri
  const [toneIntensity, setToneIntensity] = useState<'soft' | 'balanced' | 'hardcore'>('balanced');
  const [humorLevel, setHumorLevel] = useState<'none' | 'light' | 'high'>('light');

  const QUESTIONS: Question[] = [
    {
      text: t('q1_text'),
      options: [
        { text: t('q1_opt_1'), scores: { cheerful: 2, encouraging: 1 } },
        { text: t('q1_opt_2'), scores: { aggressive: 2, bully: 1 } },
        { text: t('q1_opt_3'), scores: { zen: 2, encouraging: 1 } },
        { text: t('q1_opt_4'), scores: { sarcastic: 2, indifferent: 2 } }
      ]
    },
    {
      text: t('q2_text'),
      options: [
        { text: t('q2_opt_1'), scores: { encouraging: 2, cheerful: 1 } },
        { text: t('q2_opt_2'), scores: { bully: 2, aggressive: 1 } },
        { text: t('q2_opt_3'), scores: { sarcastic: 2, bully: 1 } },
        { text: t('q2_opt_4'), scores: { zen: 2 } }
      ]
    },
    {
      text: t('q3_text'),
      options: [
        { text: t('q3_opt_1'), scores: { cheerful: 2, encouraging: 1 } },
        { text: t('q3_opt_2'), scores: { aggressive: 2, bully: 2 } },
        { text: t('q3_opt_3'), scores: { sarcastic: 2, indifferent: 1 } },
        { text: t('q3_opt_4'), scores: { zen: 2, encouraging: 1 } }
      ]
    },
    {
      text: t('q4_text'),
      options: [
        { text: t('q4_opt_1'), scores: { cheerful: 2, zen: 1 } },
        { text: t('q4_opt_2'), scores: { aggressive: 2, bully: 1 } },
        { text: t('q4_opt_3'), scores: { zen: 2 } },
        { text: t('q4_opt_4'), scores: { indifferent: 2, sarcastic: 1 } }
      ]
    },
    {
      text: t('q5_text'),
      options: [
        { text: t('q5_opt_1'), scores: { encouraging: 2, cheerful: 1 } },
        { text: t('q5_opt_2'), scores: { aggressive: 2, bully: 2 } },
        { text: t('q5_opt_3'), scores: { sarcastic: 2, bully: 1 } },
        { text: t('q5_opt_4'), scores: { zen: 2, indifferent: 1 } }
      ]
    },
    {
      text: t('q6_text'),
      options: [
        { text: t('q6_opt_1'), scores: { cheerful: 2 } },
        { text: t('q6_opt_2'), scores: { aggressive: 1, encouraging: 2 } },
        { text: t('q6_opt_3'), scores: { sarcastic: 2 } },
        { text: t('q6_opt_4'), scores: { zen: 2 } }
      ]
    },
    {
      text: t('q7_text'),
      options: [
        { text: t('q7_opt_1'), scores: { cheerful: 2, encouraging: 1 } },
        { text: t('q7_opt_2'), scores: { sarcastic: 1, bully: 1 } },
        { text: t('q7_opt_3'), scores: { sarcastic: 2, bully: 2 } },
        { text: t('q7_opt_4'), scores: { zen: 1, indifferent: 2 } }
      ]
    },
    {
      text: t('q8_text'),
      options: [
        { text: t('q8_opt_1'), scores: { cheerful: 2, encouraging: 1 } },
        { text: t('q8_opt_2'), scores: { aggressive: 2, bully: 1 } },
        { text: t('q8_opt_3'), scores: { zen: 2, encouraging: 1 } },
        { text: t('q8_opt_4'), scores: { indifferent: 2, sarcastic: 1 } }
      ]
    }
  ];

  const handleSelectOption = (optionScores: Partial<Record<HabitusPersonalityType, number>>) => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);

    const nextScores = { ...scores };
    Object.entries(optionScores).forEach(([trait, val]) => {
      nextScores[trait] = (nextScores[trait] || 0) + (val || 0);
    });
    setScores(nextScores);

    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      calculateResult(nextScores);
    }
  };

  const calculateResult = (finalScores: Record<string, number>) => {
    const sorted = Object.entries(finalScores)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0] as HabitusPersonalityType);

    const first = sorted[0];
    const second = sorted[1];

    let computedPersonality: HabitusPersonalityType = first;

    if ((first === 'bully' && second === 'cheerful') || (first === 'cheerful' && second === 'bully')) {
      computedPersonality = 'tsundere';
    } else if ((first === 'aggressive' && second === 'sarcastic') || (first === 'sarcastic' && second === 'aggressive')) {
      computedPersonality = 'toxic';
    } else if ((first === 'encouraging' && second === 'zen') || (first === 'zen' && second === 'encouraging')) {
      computedPersonality = 'master';
    } else if ((first === 'sarcastic' && second === 'zen') || (first === 'zen' && second === 'sarcastic')) {
      computedPersonality = 'indifferent';
    }

    setResult(computedPersonality);
  };

  const handleConfirmResult = () => {
    if (result) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      // Karakter türünü ve ince ayarları kaydet
      let finalPersonality: HabitusPersonalityType = result;

      // İnce ayarlar sonucu değiştirebilir:
      if (toneIntensity === 'hardcore' && result === 'cheerful') finalPersonality = 'tsundere';
      if (toneIntensity === 'hardcore' && result === 'aggressive') finalPersonality = 'bully';
      if (humorLevel === 'high' && result === 'aggressive') finalPersonality = 'toxic';
      if (toneIntensity === 'soft' && (result === 'bully' || result === 'toxic')) finalPersonality = 'encouraging';

      setPersonality(finalPersonality);
    }
  };

  const progressPct = ((currentIdx + 1) / QUESTIONS.length) * 100;

  if (result) {
    const info = PERSONALITY_LABELS[result];
    const localizedTitle = t(`pers_${result}_title`) || info?.title;
    const localizedDesc = t(`pers_${result}_desc`) || info?.desc;
    return (
      <Animated.View entering={FadeIn} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.retroTitle}>{t('habitus_awakened')}</Text>
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 64 }}>👾</Text>
          </View>
          <Text style={styles.resultLabel}>{t('personality_type_label')}</Text>
          <Text style={styles.resultValue}>{localizedTitle}</Text>
          <Text style={styles.resultDesc}>{localizedDesc}</Text>

          {/* İNCE AYAR PANELİ */}
          <View style={styles.fineTuneSection}>
            <Text style={styles.fineTuneMainTitle}>{t('fine_tune_title')}</Text>

            {/* Tavır Sertliği */}
            <Text style={styles.tuneLabel}>{t('tone_intensity_label')}</Text>
            <View style={styles.tuneRow}>
              {(['soft', 'balanced', 'hardcore'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  activeOpacity={0.8}
                  onPress={() => { safeHaptics.selection(); setToneIntensity(level); }}
                  style={[styles.tunePill, toneIntensity === level && styles.tunePillActive]}
                >
                  <Text style={[styles.tunePillText, toneIntensity === level && styles.tunePillTextActive]}>
                    {t(`tone_${level}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mizah & Alay */}
            <Text style={[styles.tuneLabel, { marginTop: 12 }]}>{t('humor_level_label')}</Text>
            <View style={styles.tuneRow}>
              {(['none', 'light', 'high'] as const).map(hum => (
                <TouchableOpacity
                  key={hum}
                  activeOpacity={0.8}
                  onPress={() => { safeHaptics.selection(); setHumorLevel(hum); }}
                  style={[styles.tunePill, humorLevel === hum && styles.tunePillActive]}
                >
                  <Text style={[styles.tunePillText, humorLevel === hum && styles.tunePillTextActive]}>
                    {t(`humor_${hum}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={handleConfirmResult} style={styles.confirmBtn}>
            <Text style={styles.confirmBtnText}>{t('say_hello_to_habitus')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  }

  const currentQuestion = QUESTIONS[currentIdx];

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.retroTitle}>{t('questionnaire_title')}</Text>
          <Text style={styles.progressText}>{currentIdx + 1}/{QUESTIONS.length}</Text>
        </View>

        {/* Piksel İlerleme Barı */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.questionText}>{currentQuestion.text}</Text>

          <View style={styles.optionsWrapper}>
            {currentQuestion.options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.8}
                onPress={() => handleSelectOption(opt.scores)}
                style={styles.optionBtn}
              >
                <Text style={styles.optionText}>{opt.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#1e293b',
    borderWidth: 4,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retroTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: '#000000',
  },
  progressText: {
    fontFamily: 'VT323',
    fontSize: 20,
    color: '#6b7280',
  },
  progressBarTrack: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderColor: '#1e293b',
    borderWidth: 2,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  scrollContent: {
    flexGrow: 1,
  },
  questionText: {
    fontFamily: 'VT323',
    fontSize: 22,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsWrapper: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: '#f3f4f6',
    borderColor: '#1e293b',
    borderWidth: 3,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  optionText: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderColor: '#1e293b',
    borderWidth: 3,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  resultLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  resultValue: {
    fontFamily: 'PressStart2P',
    fontSize: 18,
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  resultDesc: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  fineTuneSection: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  fineTuneMainTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center',
  },
  tuneLabel: {
    fontFamily: 'PressStart2P',
    fontSize: 8,
    color: '#64748b',
    marginBottom: 6,
  },
  tuneRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tunePill: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 2,
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tunePillActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#1d4ed8',
  },
  tunePillText: {
    fontFamily: 'VT323',
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
  tunePillTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#eab308',
    borderColor: '#1e293b',
    borderWidth: 4,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  confirmBtnText: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
  },
});
