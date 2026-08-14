import React from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Platform, Pressable, View, Text, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useLanguage } from '../../context/LanguageContext';
import { useAddHabitFlow } from '../../context/AddHabitTrigger';
import PixelIcon from '../../components/PixelIcons';
import { sanitizeForPixelFont } from '../../utils/fontSanitizer';

// ── Custom Tab Bar Components ──
function TabIcon({ options, isFocused, onPress, iconColor, isDark }: any) {
  const scale = useSharedValue(isFocused ? 1.15 : 1);
  const translateY = useSharedValue(isFocused ? -3 : 0);

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 15, stiffness: 200 });
    translateY.value = withSpring(isFocused ? -3 : 0, { damping: 15, stiffness: 200 });
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animatedStyle}>
        <View
          style={{
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {options.tabBarIcon ? options.tabBarIcon({ color: iconColor }) : null}
        </View>
      </Animated.View>
      <Text
        numberOfLines={1}
        style={{
          color: iconColor,
          fontFamily: 'PressStart2P',
          fontSize: sanitizeForPixelFont(options.title).length > 10 ? 5 : 6,
          marginTop: 4,
          textAlign: 'center',
        }}
      >
        {sanitizeForPixelFont(options.title)}
      </Text>
    </Pressable>
  );
}

function CustomTabBar({ state, descriptors, navigation, insets, isDark }: any) {
  const { width } = Dimensions.get('window');
  // Sadece belirlediğimiz sekmeleri ve istediğimiz sırada göster
  const allowedRoutes = ['index', 'stats', 'add', 'sort', 'settings'];
  const visibleRoutes = allowedRoutes
    .map(name => state.routes.find((r: any) => r.name === name))
    .filter(Boolean)
    .filter((route: any) => descriptors[route.key]?.options?.href !== null);

  return (
    <View style={{
      flexDirection: 'row',
      height: 66 + insets.bottom,
      paddingBottom: insets.bottom,
      backgroundColor: isDark ? '#050505' : '#ffffff',
      borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#e5e7eb',
      borderTopWidth: 1,
      position: 'relative',
      shadowColor: isDark ? '#ffffff' : '#000000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDark ? 0.02 : 0.04,
      shadowRadius: 16,
      elevation: 8,
    }}>

      {visibleRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === state.routes.indexOf(route);

        if (route.name === 'add') {
          return (
             <View key={route.key} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {options.tabBarButton ? options.tabBarButton() : null}
             </View>
          );
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name);
          }
        };

        const iconColor = isFocused ? '#6366f1' : (isDark ? '#71717a' : '#9ca3af');

        return (
          <TabIcon
            key={route.key}
            options={options}
            isFocused={isFocused}
            onPress={onPress}
            iconColor={iconColor}
            isDark={isDark}
          />
        );
      })}
    </View>
  );
}

function CenterAddButton({ isDark }: { isDark: boolean }) {
  const { open } = useAddHabitFlow();

  const handlePress = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    open();
  };

  // Outer pill shares the navbar bg so it reads as a sculpted bezel rather
  // than a separate button. Inner tile is the high-contrast surface.
  const navbarBg = isDark ? '#050505' : '#ffffff';
  const tileBg = isDark ? '#fafafa' : '#0b1220';
  const iconColor = isDark ? '#0b1220' : '#fafafa';

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="add"
        style={({ pressed }) => ({
          width: 58,
          height: 58,
          borderRadius: 8, // Stepped pixel rounded-md equivalent
          marginTop: -16, // Pop out
          backgroundColor: navbarBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderTopColor: isDark ? '#475569' : '#cbd5e1',
          borderLeftColor: isDark ? '#475569' : '#cbd5e1',
          borderBottomColor: isDark ? '#0f172a' : '#475569',
          borderRightColor: isDark ? '#0f172a' : '#475569',
          shadowColor: isDark ? 'rgba(99, 102, 241, 0.4)' : '#000', // Slight indigo glow
          shadowOpacity: isDark ? 0.3 : 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 12,
          transform: [{ scale: pressed ? 0.94 : 1 }, { translateY: pressed ? 1 : 0 }],
        })}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 2,
            left: 10,
            right: 10,
            height: 16,
            borderRadius: 4,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
          }}
        />
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 6, // Stepped pixel rounded-sm equivalent
            backgroundColor: tileBg,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 3,
            borderTopColor: isDark ? '#475569' : '#ffffff',
            borderLeftColor: isDark ? '#475569' : '#ffffff',
            borderBottomColor: isDark ? '#0f172a' : '#94a3b8',
            borderRightColor: isDark ? '#0f172a' : '#94a3b8',
            shadowColor: '#000',
            shadowOpacity: isDark ? 0.30 : 0.45,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 1,
              left: 4,
              right: 4,
              height: 12,
              borderRadius: 3,
              backgroundColor: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.06)',
            }}
          />
          <PixelIcon name="Plus" color={iconColor} size={18} />
        </View>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();
  const segments = useSegments();

  // Tab sırası (add butonu hariç tutulur veya atlanır)
  const tabNames = ['index', 'stats', 'sort', 'settings'];

  const hasNavigated = React.useRef(false);

  const handleSwipe = (tx: number) => {
    if (hasNavigated.current) return;
    const currentSegment = segments[segments.length - 1];
    let currentTab = currentSegment === '(tabs)' ? 'index' : currentSegment;
    
    const currentIndex = tabNames.indexOf(currentTab as string);
    if (currentIndex === -1) return;

    if (tx < -35) {
      const nextTab = tabNames[currentIndex + 1];
      if (nextTab) {
        hasNavigated.current = true;
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
        router.navigate(`/${nextTab === 'index' ? '' : nextTab}` as any);
      }
    } else if (tx > 35) {
      const prevTab = tabNames[currentIndex - 1];
      if (prevTab) {
        hasNavigated.current = true;
        safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
        router.navigate(`/${prevTab === 'index' ? '' : prevTab}` as any);
      }
    }
  };

  const tabSwipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      hasNavigated.current = false;
    })
    .onUpdate((e) => {
      handleSwipe(e.translationX);
    });

  return (
    <GestureDetector gesture={tabSwipeGesture}>
      <View style={{ flex: 1 }}>
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} insets={insets} isDark={isDark} />}
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            animation: 'none',
            lazy: false,
            sceneStyle: { backgroundColor: isDark ? '#000000' : '#f9fafb' },
          }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav_habits'),
          tabBarIcon: ({ color }) => <PixelIcon name="CheckSquare" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('nav_stats'),
          tabBarIcon: ({ color }) => <PixelIcon name="StatsBar" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => <CenterAddButton isDark={isDark} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="sort"
        options={{
          title: t('evolution_tab'),
          tabBarIcon: ({ color }) => <PixelIcon name="LightningBolt" color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav_settings'),
          tabBarIcon: ({ color }) => <PixelIcon name="SettingsCog" color={color} size={22} />,
        }}
      />
      </Tabs>
    </View>
    </GestureDetector>
  );
}
