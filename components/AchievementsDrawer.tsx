import React, { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { useLanguage } from '../context/LanguageContext';
import { sanitizeForPixelFont, toPixelUpper } from '../utils/fontSanitizer';
import type { Achievement } from '../context/HabitsContext';
import PixelIcon, { PixelIconName } from './PixelIcons';

interface Props {
  visible: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

const OPEN_DURATION = 320;
const CLOSE_DURATION = 260;

const getPixelIconName = (unlocked: boolean, icon: string): PixelIconName => {
  if (!unlocked) return 'Lock';
  if (icon === 'star') return 'Star';
  if (icon === 'fire') return 'Fire';
  if (icon === 'trophy') return 'Trophy';
  if (icon === 'bolt') return 'LightningBolt';
  if (icon === 'bell') return 'Bell';
  return 'Trophy'; // fallback
};

export default function AchievementsDrawer({ visible, onClose, achievements }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
  const { height: winHeight } = useWindowDimensions();

  const SHEET_HEIGHT = Math.round(winHeight * 0.85);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [mounted, setMounted] = React.useState(visible);
  const closingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setMounted(true);
      requestAnimationFrame(() => {
        translateY.value = withTiming(0, { duration: OPEN_DURATION, easing: Easing.out(Easing.cubic) });
        backdropOpacity.value = withTiming(1, { duration: OPEN_DURATION });
      });
    } else if (mounted) {
      runClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const finishClose = useCallback(() => {
    closingRef.current = false;
    setMounted(false);
  }, []);

  const runClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    backdropOpacity.value = withTiming(0, { duration: CLOSE_DURATION });
    translateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
      finished => {
        if (finished) runOnJS(finishClose)();
      },
    );
  }, [SHEET_HEIGHT, backdropOpacity, finishClose, translateY]);

  const handleDismiss = useCallback(() => {
    runClose();
    onClose();
  }, [onClose, runClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={handleDismiss} statusBarTranslucent>
      <Animated.View
        pointerEvents="auto"
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
          backdropStyle,
        ]}
      >
        <Pressable style={{ flex: 1 }} onPress={handleDismiss} />
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: SHEET_HEIGHT,
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            borderTopWidth: 4,
            borderLeftWidth: 4,
            borderRightWidth: 4,
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 24,
          },
          sheetStyle,
        ]}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <View
            style={{
              width: 32,
              height: 4,
              backgroundColor: isDark ? '#334155' : '#cbd5e1',
            }}
          />
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 36, height: 36, borderRadius: 6,
                backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
                borderWidth: 2,
                borderTopColor: isDark ? '#475569' : '#cbd5e1',
                borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                borderBottomColor: isDark ? '#0f172a' : '#475569',
                borderRightColor: isDark ? '#0f172a' : '#475569',
                alignItems: 'center', justifyContent: 'center', marginRight: 10,
              }}
            >
              <PixelIcon name="Trophy" size={16} color="#f59e0b" />
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 11, color: isDark ? '#fafafa' : '#111827' }}>
              {toPixelUpper(t('unlocked_ach'))}
            </Text>
          </View>
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            style={{
              width: 32, height: 32, borderRadius: 6,
              backgroundColor: isDark ? '#27272a' : '#f3f4f6',
              borderWidth: 2,
              borderTopColor: isDark ? '#475569' : '#cbd5e1',
              borderLeftColor: isDark ? '#475569' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <PixelIcon name="Close" size={12} color={isDark ? '#a1a1aa' : '#6b7280'} />
          </Pressable>
        </View>

        {/* List */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
        >
          {achievements.map(a => (
            <AchievementRow key={a.id} a={a} isDark={isDark} t={t} />
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function AchievementRow({
  a,
  isDark,
  t,
}: {
  a: Achievement;
  isDark: boolean;
  t: (k: string) => string;
}) {
  const rarityColor: Record<string, { bg: string; fg: string }> = {
    easy: { bg: isDark ? 'rgba(34,197,94,0.18)' : '#dcfce7', fg: isDark ? '#86efac' : '#16a34a' },
    hard: { bg: isDark ? 'rgba(249,115,22,0.18)' : '#ffedd5', fg: isDark ? '#fdba74' : '#ea580c' },
    legendary: { bg: isDark ? 'rgba(168,85,247,0.18)' : '#f3e8ff', fg: isDark ? '#d8b4fe' : '#9333ea' },
    epic: { bg: isDark ? 'rgba(245,158,11,0.18)' : '#fef3c7', fg: isDark ? '#fcd34d' : '#d97706' },
  };
  const rar = rarityColor[a.rarity] ?? rarityColor.easy;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
        backgroundColor: a.unlocked
          ? (isDark ? '#1e293b' : '#ffffff')
          : (isDark ? 'rgba(30,41,59,0.55)' : '#f9fafb'),
        borderWidth: 3,
        borderTopColor: isDark ? '#475569' : '#cbd5e1',
        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
        borderBottomColor: isDark ? '#0f172a' : '#475569',
        borderRightColor: isDark ? '#0f172a' : '#475569',
        opacity: a.unlocked ? 1 : 0.55,
        shadowColor: '#0f172a',
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 44, height: 44, borderRadius: 6,
          borderWidth: 2,
          borderTopColor: isDark ? '#475569' : '#cbd5e1',
          borderLeftColor: isDark ? '#475569' : '#cbd5e1',
          borderBottomColor: isDark ? '#0f172a' : '#475569',
          borderRightColor: isDark ? '#0f172a' : '#475569',
          backgroundColor: a.unlocked ? a.color : '#9ca3af',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}
      >
        <PixelIcon name={getPixelIconName(a.unlocked, a.icon)} size={18} color="white" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: 'PressStart2P', fontSize: 9,
            color: a.unlocked ? (isDark ? '#fafafa' : '#111827') : (isDark ? '#a1a1aa' : '#6b7280'),
          }}
        >
          {toPixelUpper(t(`ach_${a.id}_title`))}
        </Text>
        <Text
          numberOfLines={2}
          style={{ fontFamily: 'VT323', fontSize: 16, lineHeight: 18, marginTop: 4, color: isDark ? '#cbd5e1' : '#6b7280' }}
        >
          {sanitizeForPixelFont(t(`ach_${a.id}_desc`))}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          <View
            style={{
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
              borderTopColor: isDark ? '#475569' : '#cbd5e1',
              borderLeftColor: isDark ? '#475569' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              backgroundColor: rar.bg
            }}
          >
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 6, fontWeight: '700', color: rar.fg }}>{toPixelUpper(t(`ach_rarity_${a.rarity}`))}</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
              borderTopColor: isDark ? '#475569' : '#cbd5e1',
              borderLeftColor: isDark ? '#475569' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              backgroundColor: isDark ? 'rgba(59,130,246,0.18)' : '#dbeafe',
            }}
          >
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 6, fontWeight: '700', color: isDark ? '#93c5fd' : '#2563eb' }}>{toPixelUpper(`+${a.xpReward} XP`)}</Text>
          </View>
        </View>
      </View>
      {a.unlocked && (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderTopColor: isDark ? '#475569' : '#cbd5e1',
            borderLeftColor: isDark ? '#475569' : '#cbd5e1',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            backgroundColor: '#10b981',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 6,
          }}
        >
          <PixelIcon name="Check" size={10} color="white" />
        </View>
      )}
    </View>
  );
}
