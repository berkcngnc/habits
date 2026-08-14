import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../../utils/haptics';
import { useRouter } from 'expo-router';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationPermission } from '../../hooks/useNotificationPermission';
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useTabSlide } from '../../hooks/useTabSlide';
import { OverlayModal } from '../../components/OverlayModal';
import InfoBubble, { InfoButton } from '../../components/InfoBubble';
import { useHabits } from '../../context/HabitsContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../locales';
import {
  loadNotificationSettings,
  NotificationSettings,
  saveNotificationSettings,
  scheduleAllNotifications
} from '../../engine/NotificationEngine';
import PixelIcon from '../../components/PixelIcons';
import { toPixelUpper, sanitizeForPixelFont } from '../../utils/fontSanitizer';

const AVAILABLE_LANGUAGES: LanguageCode[] = ['tr', 'en', 'es', 'de', 'fr', 'zh', 'it'];

export default function SettingsScreen() {
  const { resetAllData, habits } = useHabits();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { t, language, setLanguage } = useLanguage();

  const [showResetModal, setShowResetModal] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettings | null>(null);
  const [isNotifExpanded, setIsNotifExpanded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const sysPerm = useNotificationPermission();

  useEffect(() => {
    loadNotificationSettings()
      .then(setNotifSettings)
      .catch(() => showSaveError(t('settings_load_error')));
  }, []);

  const showSaveError = (msg: string) => {
    setSaveError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setSaveError(null), 3000);
  };

  const updateNotifSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!notifSettings) return;
    safeHaptics.selection();
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    try {
      await saveNotificationSettings(updated);
      await scheduleAllNotifications(habits);
    } catch {
      showSaveError(t('settings_save_error'));
    }
  };

  // ✅ FIX #5: back navigation via shared hook
  useBackHandler(() => {
    if (showInfo) { setShowInfo(false); return true; }
    if (showResetModal) { setShowResetModal(false); return true; }
    router.navigate('/');
    return true;
  }, [showInfo, showResetModal, router]);

  const handleReset = () => {
    setShowResetModal(true);
  };

  const isDark = colorScheme === 'dark';
  const slideStyle = useTabSlide(4);
  return (
    <Animated.View style={[slideStyle, { backgroundColor: isDark ? '#000000' : '#f9fafb' }]}>
      <ScrollView className="px-6 pt-4 pb-20" showsVerticalScrollIndicator={false}>
        <View className="mb-8 mt-4 flex-row items-center justify-between">
          <Text style={{ fontFamily: 'PressStart2P', fontSize: 18 }} className="text-gray-900 dark:text-zinc-100 flex-1">{sanitizeForPixelFont(t('settings'))}</Text>
          <View className="mt-1">
            <InfoButton onPress={() => setShowInfo(true)} accessibilityLabel={t('info_btn')} />
          </View>
        </View>

        <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 mb-3 ml-2">{toPixelUpper(t('prefs'))}</Text>

        <View
          className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden mb-8 border-4"
          style={{
            borderTopColor: isDark ? '#475569' : '#e2e8f0',
            borderLeftColor: isDark ? '#475569' : '#e2e8f0',
            borderBottomColor: isDark ? '#0f172a' : '#475569',
            borderRightColor: isDark ? '#0f172a' : '#475569',
            shadowColor: '#0f172a',
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3
          }}
        >
          <View className="flex-row items-center justify-between p-5 border-b-2 border-slate-800">
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-500/20 border-2 items-center justify-center mr-4"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Moon" size={16} color="#818cf8" />
              </View>
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('dark_mode')}</Text>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={() => {
                safeHaptics.selection();
                toggleColorScheme();
              }}
              trackColor={{ false: "#d1d5db", true: "#6366f1" }}
              thumbColor={isDark ? "#fafafa" : "#ffffff"}
              accessibilityRole="switch"
              accessibilityLabel={t('dark_mode')}
            />
          </View>
          
          <View className="px-5 py-4">
            <View className="flex-row items-center mb-3 mt-2 px-1">
              <View
                className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-500/20 border-2 items-center justify-center mr-4"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Globe" size={16} color="#6366f1" />
              </View>
              <Text style={{ fontFamily: 'VT323', fontSize: 20 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('language')}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => {
                    safeHaptics.selection();
                    setLanguage(l);
                  }}
                  className={`px-3 py-1.5 rounded-md border-2 ${language === l ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-zinc-800'}`}
                  style={{
                    borderTopColor: language === l ? '#818cf8' : (isDark ? '#475569' : '#e2e8f0'),
                    borderLeftColor: language === l ? '#818cf8' : (isDark ? '#475569' : '#e2e8f0'),
                    borderBottomColor: language === l ? '#4f46e5' : (isDark ? '#0f172a' : '#cbd5e1'),
                    borderRightColor: language === l ? '#4f46e5' : (isDark ? '#0f172a' : '#cbd5e1'),
                  }}
                >
                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className={`font-bold ${language === l ? 'text-white' : 'text-gray-600 dark:text-zinc-300'}`}>{l.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {notifSettings && (
          <Animated.View
            layout={LinearTransition}
            className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden mb-8 border-4"
            style={{
              borderTopColor: isDark ? '#475569' : '#e2e8f0',
              borderLeftColor: isDark ? '#475569' : '#e2e8f0',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              shadowColor: '#0f172a',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 3
            }}
          >
            <View className={`flex-row items-center justify-between p-5 ${isNotifExpanded ? 'border-b-2 border-slate-800' : ''}`}>
              <TouchableOpacity activeOpacity={0.7} className="flex-row items-center flex-1 mr-2" onPress={() => {
                safeHaptics.selection();
                setIsNotifExpanded(!isNotifExpanded);
              }}>
                <View
                  className="w-8 h-8 rounded-md bg-pink-100 dark:bg-pink-500/20 border-2 items-center justify-center mr-4"
                  style={{
                    borderTopColor: isDark ? '#475569' : '#cbd5e1',
                    borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                    borderBottomColor: isDark ? '#0f172a' : '#475569',
                    borderRightColor: isDark ? '#0f172a' : '#475569',
                  }}
                >
                  <PixelIcon name="Bell" size={16} color="#f472b6" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={{ fontFamily: 'VT323', fontSize: 20 }}
                      className="text-slate-800 dark:text-zinc-100 font-semibold flex-shrink"
                    >
                      {t('enable_notifs')}
                    </Text>
                    <PixelIcon name={isNotifExpanded ? "ChevronUp" : "ChevronDown"} size={14} color="#9ca3af" />
                  </View>
                  <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">
                    {!sysPerm.ready
                      ? t('notif_sync_checking')
                      : sysPerm.granted
                        ? t('notification_sync_desc')
                        : sysPerm.canAskAgain
                          ? t('notif_sync_disabled')
                          : t('notif_sync_blocked')}
                  </Text>
                </View>
              </TouchableOpacity>
              <Switch
                value={notifSettings.enabled && sysPerm.granted}
                onValueChange={async (val) => {
                  if (val) {
                    if (!sysPerm.granted) {
                      const ok = await sysPerm.requestOrOpenSettings();
                      if (!ok) {
                        updateNotifSetting('enabled', true);
                        return;
                      }
                    }
                    updateNotifSetting('enabled', true);
                    if (!isNotifExpanded) setIsNotifExpanded(true);
                  } else {
                    updateNotifSetting('enabled', false);
                    if (isNotifExpanded) setIsNotifExpanded(false);
                  }
                }}
                trackColor={{ false: "#d1d5db", true: "#6366f1" }}
                thumbColor={isDark ? "#fafafa" : "#ffffff"}
                accessibilityRole="switch"
                accessibilityLabel={t('enable_notifs')}
              />
            </View>

            {sysPerm.ready && notifSettings.enabled && !sysPerm.granted && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => sysPerm.openSettings()}
                className="mx-4 mt-3 mb-1 bg-amber-50 dark:bg-amber-900/20 rounded-md p-4 border-2 flex-row items-center"
                style={{
                  borderTopColor: isDark ? '#475569' : '#cbd5e1',
                  borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                  borderBottomColor: isDark ? '#0f172a' : '#475569',
                  borderRightColor: isDark ? '#0f172a' : '#475569',
                }}
              >
                <PixelIcon name="Exclamation" size={16} color="#f59e0b" />
                <View className="flex-1 ml-3">
                  <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-amber-700 dark:text-amber-400 font-bold">{toPixelUpper(t('notif_sync_action_title'))}</Text>
                  <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-amber-600 dark:text-amber-400/80 mt-0.5">{t('notif_sync_action_desc')}</Text>
                </View>
                <PixelIcon name="ChevronRight" size={14} color="#f59e0b" />
              </TouchableOpacity>
            )}

            {isNotifExpanded && (
              <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)}>
                <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-8 h-8 rounded-md bg-red-100 dark:bg-red-500/20 border-2 items-center justify-center mr-4"
                      style={{
                        borderTopColor: isDark ? '#475569' : '#cbd5e1',
                        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                        borderBottomColor: isDark ? '#0f172a' : '#475569',
                        borderRightColor: isDark ? '#0f172a' : '#475569',
                      }}
                    >
                      <PixelIcon name="Shield" size={16} color="#ef4444" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('streak_guardian')}</Text>
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">{t('streak_guardian_desc')}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.streakGuardianEnabled}
                    onValueChange={(val) => updateNotifSetting('streakGuardianEnabled', val)}
                    trackColor={{ false: "#d1d5db", true: "#ef4444" }}
                    disabled={!notifSettings.enabled}
                    accessibilityRole="switch"
                    accessibilityLabel={t('streak_guardian')}
                  />
                </View>

                <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-500/20 border-2 items-center justify-center mr-4"
                      style={{
                        borderTopColor: isDark ? '#475569' : '#cbd5e1',
                        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                        borderBottomColor: isDark ? '#0f172a' : '#475569',
                        borderRightColor: isDark ? '#0f172a' : '#475569',
                      }}
                    >
                      <PixelIcon name="Lightbulb" size={16} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('smart_nudge')}</Text>
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">{t('smart_nudge_desc')}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.smartNudgeEnabled}
                    onValueChange={(val) => updateNotifSetting('smartNudgeEnabled', val)}
                    trackColor={{ false: "#d1d5db", true: "#f59e0b" }}
                    disabled={!notifSettings.enabled}
                    accessibilityRole="switch"
                    accessibilityLabel={t('smart_nudge')}
                  />
                </View>

                <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-500/20 border-2 items-center justify-center mr-4"
                      style={{
                        borderTopColor: isDark ? '#475569' : '#cbd5e1',
                        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                        borderBottomColor: isDark ? '#0f172a' : '#475569',
                        borderRightColor: isDark ? '#0f172a' : '#475569',
                      }}
                    >
                      <PixelIcon name="Trophy" size={16} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('weekly_pulse')}</Text>
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">{t('weekly_pulse_desc')}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.weeklyPulseEnabled}
                    onValueChange={(val) => updateNotifSetting('weeklyPulseEnabled', val)}
                    trackColor={{ false: "#d1d5db", true: "#10b981" }}
                    disabled={!notifSettings.enabled}
                    accessibilityRole="switch"
                    accessibilityLabel={t('weekly_pulse')}
                  />
                </View>

                <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-500/20 border-2 items-center justify-center mr-4"
                      style={{
                        borderTopColor: isDark ? '#475569' : '#cbd5e1',
                        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                        borderBottomColor: isDark ? '#0f172a' : '#475569',
                        borderRightColor: isDark ? '#0f172a' : '#475569',
                      }}
                    >
                      <PixelIcon name="Flag" size={16} color="#8b5cf6" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('milestones_notif')}</Text>
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">{t('milestones_notif_desc')}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.milestonesEnabled}
                    onValueChange={(val) => updateNotifSetting('milestonesEnabled', val)}
                    trackColor={{ false: "#d1d5db", true: "#8b5cf6" }}
                    disabled={!notifSettings.enabled}
                    accessibilityRole="switch"
                    accessibilityLabel={t('milestones_notif')}
                  />
                </View>

                <View className="flex-row items-center justify-between p-5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-500/20 border-2 items-center justify-center mr-4"
                      style={{
                        borderTopColor: isDark ? '#475569' : '#cbd5e1',
                        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                        borderBottomColor: isDark ? '#0f172a' : '#475569',
                        borderRightColor: isDark ? '#0f172a' : '#475569',
                      }}
                    >
                      <PixelIcon name="Star" size={16} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('achievements_notif')}</Text>
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">{t('achievements_notif_desc')}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.achievementsEnabled}
                    onValueChange={(val) => updateNotifSetting('achievementsEnabled', val)}
                    trackColor={{ false: "#d1d5db", true: "#f59e0b" }}
                    disabled={!notifSettings.enabled}
                    accessibilityRole="switch"
                    accessibilityLabel={t('achievements_notif')}
                  />
                </View>

                <View className="flex-row items-center justify-between p-5 bg-gray-50 dark:bg-zinc-900/50">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-700/40 border-2 items-center justify-center mr-4"
                      style={{
                        borderTopColor: isDark ? '#475569' : '#cbd5e1',
                        borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                        borderBottomColor: isDark ? '#0f172a' : '#475569',
                        borderRightColor: isDark ? '#0f172a' : '#475569',
                      }}
                    >
                      <PixelIcon name="Info" size={16} color="#71717a" />
                    </View>
                    <View className="flex-1">
                      <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-slate-800 dark:text-zinc-100 font-semibold">{t('passive_aggressive_notif')}</Text>
                      <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-gray-400 dark:text-gray-500 mt-0.5">{t('passive_aggressive_notif_desc')}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifSettings.passiveAggressiveEnabled}
                    onValueChange={(val) => updateNotifSetting('passiveAggressiveEnabled', val)}
                    trackColor={{ false: "#d1d5db", true: "#6366f1" }}
                    disabled={!notifSettings.enabled}
                    accessibilityRole="switch"
                    accessibilityLabel={t('passive_aggressive_notif')}
                  />
                </View>

                {Platform.OS !== 'web' && (
                  <View
                    className="bg-indigo-50 dark:bg-indigo-900/20 rounded-md p-4 mx-4 mb-4 mt-2 border-2"
                    style={{
                      borderTopColor: isDark ? '#475569' : '#cbd5e1',
                      borderLeftColor: isDark ? '#475569' : '#cbd5e1',
                      borderBottomColor: isDark ? '#0f172a' : '#475569',
                      borderRightColor: isDark ? '#0f172a' : '#475569',
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <PixelIcon name="Moon" size={14} color="#6366f1" />
                      <Text style={{ fontFamily: 'PressStart2P', fontSize: 8 }} className="text-indigo-600 dark:text-indigo-400 ml-2">{toPixelUpper(t('quiet_hours'))}</Text>
                    </View>
                    <Text style={{ fontFamily: 'VT323', fontSize: 16 }} className="text-indigo-500 dark:text-indigo-400/70">
                      {t('quiet_hours_desc', { start: notifSettings.quietHoursStart, end: notifSettings.quietHoursEnd })}
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        )}

        <Text style={{ fontFamily: 'PressStart2P', fontSize: 9 }} className="text-gray-500 mb-3 ml-2">{toPixelUpper(t('danger_zone'))}</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleReset}
          className="bg-red-50 dark:bg-red-500/10 rounded-lg p-5 border-4 flex-row items-center justify-between shadow-md dark:shadow-none active:scale-[0.98]"
          style={{
            borderTopColor: isDark ? '#b91c1c' : '#fecaca',
            borderLeftColor: isDark ? '#b91c1c' : '#fecaca',
            borderBottomColor: isDark ? '#7f1d1d' : '#ef4444',
            borderRightColor: isDark ? '#7f1d1d' : '#ef4444',
            shadowColor: '#ef4444',
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 0,
            elevation: 2
          }}
        >
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-500/20 border-2 items-center justify-center mr-4"
              style={{
                borderTopColor: isDark ? '#ef4444' : '#fca5a5',
                borderLeftColor: isDark ? '#ef4444' : '#fca5a5',
                borderBottomColor: isDark ? '#991b1b' : '#ef4444',
                borderRightColor: isDark ? '#991b1b' : '#ef4444',
              }}
            >
              <PixelIcon name="Trash" size={18} color="#ef4444" />
            </View>
            <View>
              <Text style={{ fontFamily: 'PressStart2P', fontSize: 12 }} className="text-red-500 dark:text-red-400 font-bold">{toPixelUpper(t('reset_all'))}</Text>
              <Text style={{ fontFamily: 'VT323', fontSize: 14 }} className="text-red-400 dark:text-red-500/70 mt-1">{t('cannot_undo')}</Text>
            </View>
          </View>
          <PixelIcon name="ChevronRight" size={24} color="#ef4444" />
        </TouchableOpacity>

        <View className="mt-12 items-center" style={{ opacity: 0.45 }}>
          <Text className="text-gray-500 dark:text-zinc-300 font-black text-2xl tracking-tight">habits.</Text>
          <Text className="text-gray-400 dark:text-gray-500 text-xs font-semibold mt-1">v{Constants.expoConfig?.version ?? '—'}</Text>
        </View>

        {saveError ? (
          <View className="mt-4 mx-2 bg-red-100 dark:bg-red-900/30 rounded-2xl px-4 py-3 border border-red-200 dark:border-red-800">
            <Text className="text-red-600 dark:text-red-400 text-sm font-medium text-center">{saveError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <OverlayModal visible={showResetModal} onDismiss={() => setShowResetModal(false)}>
          <View
            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-lg p-6 border-4 self-center"
            style={{
              borderTopColor: isDark ? '#475569' : '#e2e8f0',
              borderLeftColor: isDark ? '#475569' : '#e2e8f0',
              borderBottomColor: isDark ? '#0f172a' : '#475569',
              borderRightColor: isDark ? '#0f172a' : '#475569',
              shadowColor: '#0f172a',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
              elevation: 20
            }}
          >
            <View
              className="w-14 h-14 bg-red-100 dark:bg-red-500/20 rounded-md border-2 items-center justify-center mb-4 self-center"
              style={{
                borderTopColor: isDark ? '#ef4444' : '#fca5a5',
                borderLeftColor: isDark ? '#ef4444' : '#fca5a5',
                borderBottomColor: isDark ? '#991b1b' : '#ef4444',
                borderRightColor: isDark ? '#991b1b' : '#ef4444',
              }}
            >
              <PixelIcon name="Exclamation" size={28} color="#ef4444" />
            </View>
            <Text style={{ fontFamily: 'PressStart2P', fontSize: 14 }} className="text-gray-900 dark:text-zinc-100 text-center mb-3">{toPixelUpper(t('warning'))}</Text>
            <Text style={{ fontFamily: 'VT323', fontSize: 18 }} className="text-gray-500 dark:text-gray-400 text-center mb-6 leading-5">
              {t('reset_all_confirm')}
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 rounded-lg items-center border-2"
                style={{
                  borderTopColor: isDark ? '#475569' : '#ffffff',
                  borderLeftColor: isDark ? '#475569' : '#ffffff',
                  borderBottomColor: isDark ? '#0f172a' : '#cbd5e1',
                  borderRightColor: isDark ? '#0f172a' : '#cbd5e1',
                }}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-semibold text-gray-700 dark:text-zinc-300">{toPixelUpper(t('give_up'))}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowResetModal(false);
                  resetAllData();
                }}
                className="flex-1 py-3 bg-red-600 rounded-lg items-center border-2"
                style={{
                  borderTopColor: isDark ? '#ef4444' : '#fca5a5',
                  borderLeftColor: isDark ? '#ef4444' : '#fca5a5',
                  borderBottomColor: isDark ? '#991b1b' : '#ef4444',
                  borderRightColor: isDark ? '#991b1b' : '#ef4444',
                }}
              >
                <Text style={{ fontFamily: 'PressStart2P', fontSize: 10 }} className="font-bold text-white">{toPixelUpper(t('yes_reset'))}</Text>
              </TouchableOpacity>
            </View>
          </View>
      </OverlayModal>

      <InfoBubble
        visible={showInfo}
        onClose={() => setShowInfo(false)}
        title={t('info_settings_title')}
        tips={[t('info_settings_tip1'), t('info_settings_tip2'), t('info_settings_tip3'), t('info_settings_tip4')]}
      />
    </Animated.View>
  );
}
