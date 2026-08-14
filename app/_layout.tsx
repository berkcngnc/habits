import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';
import { HabitsProvider } from '../context/HabitsContext';
import { LanguageProvider } from '../context/LanguageContext';
import { AddHabitTriggerProvider } from '../context/AddHabitTrigger';
import { useLanguage } from '../context/LanguageContext';
import { LogBox, Platform, View, Modal, Text, TouchableOpacity } from 'react-native';
import * as BackgroundTask from 'expo-background-task';
import { WIDGET_PERIODIC_TASK } from '../widget/widgetTaskHandler';
import { initAdSdk } from '../utils/adInit';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InAppNotification from '../components/InAppNotification';
import AddHabitFlowHost from '../components/AddHabitFlowHost';
import { PomodoroProvider } from '../context/PomodoroContext';
import PomodoroModal from '../components/PomodoroModal';

import { PixelifySans_400Regular, PixelifySans_700Bold } from '@expo-google-fonts/pixelify-sans';

LogBox.ignoreLogs([
  'Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go'
]);

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function MainApp() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useLanguage();
  const [showPermModal, setShowPermModal] = useState(false);

  // AdMob SDK — await initialization so ads don't race against an uninitialised SDK.
  useEffect(() => { initAdSdk(); }, []);

  // BackgroundFetch: register periodic widget refresh task (Android only).
  // defineTask runs at import time (widgetTaskHandler.tsx); registerTaskAsync
  // wires it into WorkManager. No-op if already registered (error swallowed).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    BackgroundTask.registerTaskAsync(WIDGET_PERIODIC_TASK, {
      minimumInterval: 15,
    }).catch(() => {});
  }, []);

  // ─── İzin akışı (tek modal, graceful degradation) ────────────────────
  // Mantık:
  //  - Bir kez sorulur. Reddederse bir daha modal açılmaz; uygulama
  //    sessizce "bildirimsiz" çalışır (graceful degradation).
  //  - Sistem dialog'u SADECE kullanıcı modaldaki "İzin Ver"e basarsa
  //    çağrılır; arka planda kullanıcıya sormadan native prompt açılmaz.
  //  - Exact-alarm için ayrı Alert kaldırıldı — sistem-style ve
  //    çoğu kullanıcı için gereksiz. Gerektiğinde NotificationEngine
  //    bunu lazy-handle eder.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    (async () => {
      try {
        const alreadyAsked = await AsyncStorage.getItem('@notification_perm_asked');
        if (alreadyAsked) return; // bir daha rahatsız etme
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        if (status === 'granted') return;
        if (!canAskAgain) return; // sistem zaten kalıcı olarak reddetmiş
        if (!cancelled) setShowPermModal(true);
      } catch (e) {
        console.error('[Layout] permission check failed:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const markPermissionAsked = async () => {
    try { await AsyncStorage.setItem('@notification_perm_asked', 'true'); } catch {}
  };

  const handlePermAllow = async () => {
    setShowPermModal(false);
    await markPermissionAsked();
    try {
      await Notifications.requestPermissionsAsync();
    } catch (e) {
      // Native dialog hata verirse uygulama yine açılmalı.
      console.error('[Layout] requestPermissionsAsync failed:', e);
    }
  };

  const handlePermLater = async () => {
    setShowPermModal(false);
    await markPermissionAsked();
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff', paddingTop: insets.top }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Global Add Habit Modal — accessible from any tab via the center "+" button */}
      <AddHabitFlowHost />

      {/* Foreground In-App Notification Banner */}
      <InAppNotification />

      {/* Global Pomodoro Modal */}
      <PomodoroModal />

      {/* Bildirim İzni Modalı */}
      <Modal visible={showPermModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 24 }}>
          <View style={{
            backgroundColor: isDark ? '#18181b' : '#ffffff',
            width: '100%',
            borderRadius: 24,
            padding: 28,
            borderWidth: 1,
            borderColor: isDark ? '#3f3f46' : '#e5e7eb',
            alignItems: 'center',
          }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
              justifyContent: 'center', alignItems: 'center', marginBottom: 16,
            }}>
              <FontAwesome name="bell" size={28} color="#3b82f6" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: isDark ? '#f4f4f5' : '#111827', marginBottom: 8, textAlign: 'center' }}>
              {t('notif_perm_title')}
            </Text>
            <Text style={{ fontSize: 14, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
              {t('notif_perm_body')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePermLater}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
                  backgroundColor: isDark ? '#27272a' : '#f3f4f6',
                  borderWidth: 1, borderColor: isDark ? '#3f3f46' : '#e5e7eb',
                }}
              >
                <Text style={{ fontWeight: '600', fontSize: 15, color: isDark ? '#d4d4d8' : '#4b5563' }}>{t('perm_later')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePermAllow}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#3b82f6' }}
              >
                <Text style={{ fontWeight: '700', fontSize: 15, color: '#ffffff' }}>{t('notif_perm_allow')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    PressStart2P: PixelifySans_700Bold,
    VT323: PixelifySans_400Regular,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <HabitsProvider>
          <PomodoroProvider>
            <AddHabitTriggerProvider>
              <SafeAreaProvider>
                <MainApp />
              </SafeAreaProvider>
            </AddHabitTriggerProvider>
          </PomodoroProvider>
        </HabitsProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
