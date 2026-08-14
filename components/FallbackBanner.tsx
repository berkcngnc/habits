import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, Pressable, Linking, Share, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import { useColorScheme } from 'nativewind';
import { getRandomFallbackAd, FallbackAd, ExerciseMode } from '../constants/FallbackAds';
import { MotivationActionModal } from './MotivationActionModal';

import { useLanguage } from '../context/LanguageContext';

const STORE_URL_ANDROID = 'market://details?id=com.habits.app';
const STORE_URL_FALLBACK = 'https://play.google.com/store/apps/details?id=com.habits.app';
const FEEDBACK_MAIL = 'mailto:your-email@example.com?subject=Habits%20Feedback';

type Props = {
  ad?: FallbackAd;
};

export function FallbackBanner({ ad: adProp }: Props) {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const isDark = colorScheme === 'dark';

  const ad = useMemo(() => adProp ?? getRandomFallbackAd(), [adProp]);
  const [exercise, setExercise] = useState<ExerciseMode | null>(null);

  const adTitle = t(`ad_${ad.id}_title`) !== `ad_${ad.id}_title` ? t(`ad_${ad.id}_title`) : ad.title;
  const adSubtitle = t(`ad_${ad.id}_subtitle`) !== `ad_${ad.id}_subtitle` ? t(`ad_${ad.id}_subtitle`) : ad.subtitle;
  const adCta = t(`ad_${ad.id}_cta`) !== `ad_${ad.id}_cta` ? t(`ad_${ad.id}_cta`) : ad.cta;
  const shareMessage = (t('fallback_share_message') !== 'fallback_share_message' ? t('fallback_share_message') : 'Habits ile alışkanlıklarımı takip ediyorum, sen de dene: ') + STORE_URL_FALLBACK;

  const handlePress = useCallback(async () => {
    safeHaptics.selection();
    try {
      switch (ad.action) {
        case 'rate':
          if (Platform.OS === 'android') {
            const ok = await Linking.canOpenURL(STORE_URL_ANDROID);
            await Linking.openURL(ok ? STORE_URL_ANDROID : STORE_URL_FALLBACK);
          } else {
            await Linking.openURL(STORE_URL_FALLBACK);
          }
          break;
        case 'share':
          await Share.share({ message: shareMessage });
          break;
        case 'feedback':
          await Linking.openURL(FEEDBACK_MAIL);
          break;
        case 'exercise':
          if (ad.exercise) setExercise(ad.exercise);
          break;
        default:
          break;
      }
    } catch {}
  }, [ad]);

  const accent = (() => {
    switch (ad.category) {
      case 'rating': return '#f59e0b';
      case 'social': return '#3b82f6';
      case 'motivation': return '#10b981';
      case 'feedback': return '#a78bfa';
    }
  })();

  return (
    <>
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: isDark ? '#27272a' : '#e5e7eb' }}
      accessibilityRole="button"
      accessibilityLabel={adTitle}
      style={{ minHeight: 80 }}
      className="rounded-lg overflow-hidden"
    >
      <View
        className="flex-row items-center px-4 py-3 rounded-lg"
        style={{
          minHeight: 80,
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderWidth: 3,
          borderColor: '#1e293b',
          shadowColor: '#0f172a',
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 4,
        }}
      >
        <View
          className="items-center justify-center rounded-md mr-3 border-2 border-slate-800"
          style={{
            width: 44,
            height: 44,
            backgroundColor: accent + '22',
          }}
        >
          <FontAwesome name={ad.icon as any} size={20} color={accent} />
        </View>

        <View className="flex-1 pr-2">
          <Text
            numberOfLines={1}
            style={{ color: isDark ? '#fafafa' : '#111827', fontFamily: 'PressStart2P', fontSize: 9 }}
          >
            {adTitle}
          </Text>
          <Text
            numberOfLines={1}
            style={{ color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'VT323', fontSize: 16, marginTop: 4 }}
          >
            {adSubtitle}
          </Text>
        </View>

        <View
          className="px-3 py-1.5 rounded-md border-2 border-slate-800"
          style={{ backgroundColor: accent }}
        >
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 8, color: '#ffffff', textAlign: 'center' }}>
            {adCta}
          </Text>
        </View>
      </View>
    </Pressable>

    <MotivationActionModal
      visible={!!exercise}
      mode={exercise}
      onClose={() => setExercise(null)}
    />
    </>
  );
}

export default FallbackBanner;

