import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import PixelIcon from './PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../utils/fontSanitizer';

interface InfoBubbleProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  tips: string[];
}

// ── Inner sheet ───────────────────────────────────────────────────────────────
function SheetContent({ onClose, title, tips }: Omit<InfoBubbleProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="bg-white dark:bg-zinc-900 px-6 pt-5"
      style={{
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderRightWidth: 4,
        borderBottomWidth: 0,
        borderTopColor: isDark ? '#475569' : '#e2e8f0',
        borderLeftColor: isDark ? '#475569' : '#e2e8f0',
        borderRightColor: isDark ? '#0f172a' : '#475569',
        paddingBottom: insets.bottom + 24,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 0,
        elevation: 20,
      }}
    >
      {/* Handle */}
      <View 
        style={{
          width: 32,
          height: 4,
          backgroundColor: isDark ? '#334155' : '#cbd5e1',
          alignSelf: 'center',
          marginBottom: 16
        }} 
      />

      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center flex-1 mr-2">
          <View
            className="w-9 h-9 rounded-md bg-indigo-100 dark:bg-indigo-900/40 items-center justify-center mr-3"
            style={{
              borderWidth: 2,
              borderTopColor: isDark ? '#475569' : '#cbd5e1',
              borderLeftColor: isDark ? '#475569' : '#cbd5e1',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
            }}
          >
            <PixelIcon name="Info" size={18} color="#6366f1" />
          </View>
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 11 }} className="text-slate-800 dark:text-zinc-100 flex-1 leading-4">
            {toPixelUpper(title)}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            borderWidth: 2,
            borderTopColor: isDark ? '#475569' : '#cbd5e1',
            borderLeftColor: isDark ? '#475569' : '#cbd5e1',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
          })}
          className="w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 items-center justify-center"
        >
          <PixelIcon name="Close" size={12} color={isDark ? '#a1a1aa' : '#6b7280'} />
        </Pressable>
      </View>

      {/* Tips */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
        {tips.map((tip, index) => (
          <View key={index} className="flex-row items-start mb-4">
            <View
              className="w-6 h-6 rounded-md bg-indigo-500 items-center justify-center mr-3 mt-0.5"
              style={{
                minWidth: 24,
                borderWidth: 1,
                borderTopColor: isDark ? '#818cf8' : '#c7d2fe',
                borderLeftColor: isDark ? '#818cf8' : '#c7d2fe',
                borderBottomColor: isDark ? '#312e81' : '#4338ca',
                borderRightColor: isDark ? '#312e81' : '#4338ca',
              }}
            >
              <Text className="text-white text-xs font-bold">{index + 1}</Text>
            </View>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-700 dark:text-zinc-300 flex-1 leading-5">
              {sanitizeForPixelFont(tip)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── InfoBubble ────────────────────────────────────────────────────────────────
export default function InfoBubble({ visible, onClose, title, tips }: InfoBubbleProps) {
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(150)}
          style={{ flex: 1 }}
        >
          <Pressable
            onPress={onClose}
            style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}
          >
            <Pressable onPress={() => {}}>
              <Animated.View
                entering={SlideInDown.springify().damping(26).mass(0.9)}
                exiting={SlideOutDown.duration(180)}
              >
                <SheetContent onClose={onClose} title={title} tips={tips} />
              </Animated.View>
            </Pressable>
          </Pressable>
        </Animated.View>
      </SafeAreaProvider>
    </Modal>
  );
}

// ── InfoButton ────────────────────────────────────────────────────────────────
interface InfoButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function InfoButton({ onPress, accessibilityLabel }: InfoButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <Pressable
      onPress={() => {
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 6,
        backgroundColor: pressed
          ? (isDark ? '#27272a' : '#e5e7eb')
          : (isDark ? '#1e293b' : '#ffffff'),
        borderWidth: 2,
        borderTopColor: isDark ? '#475569' : '#cbd5e1',
        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
        borderBottomColor: isDark ? '#0f172a' : '#475569',
        borderRightColor: isDark ? '#0f172a' : '#475569',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0f172a',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
      })}
    >
      <PixelIcon name="Info" size={18} color={isDark ? '#a1a1aa' : '#6b7280'} />
    </Pressable>
  );
}
