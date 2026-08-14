import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Platform, Alert } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import AchievementsDrawer from '../../components/AchievementsDrawer';
import HabitusAvatar from '../../components/HabitusAvatar';
import HabitusQuestionnaire from '../../components/HabitusQuestionnaire';
import { useHabits } from '../../context/HabitsContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useTabSlide } from '../../hooks/useTabSlide';
import { PERSONALITY_LABELS, HabitusPersonalityType } from '../../constants/HabitusDialogues';
import { SHOP_ITEMS, ShopItem } from '../../constants/ShopItems';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../../utils/haptics';

import PixelItemIcon from '../../components/PixelItemIcon';

export default function EvolutionScreen() {
  const { stats, habits, achievements, buyItem, equipItem, setPersonality } = useHabits();
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isFocused = useIsFocused();
  const router = useRouter();
  const slideStyle = useTabSlide(3);

  const [showAchievements, setShowAchievements] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'shop' | 'wardrobe'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  useBackHandler(() => {
    if (showAchievements) { setShowAchievements(false); return true; }
    router.navigate('/');
    return true;
  }, [showAchievements, router]);

  // Seviye ilerleme hesaplama
  const xpForCurrentLevel = stats.xp % 100;
  const xpToNextLevel = 100;
  const progressPct = Math.min((xpForCurrentLevel / xpToNextLevel) * 100, 100);

  const personalityInfo = stats.personality
    ? PERSONALITY_LABELS[stats.personality as HabitusPersonalityType]
    : null;

  // Filtrelenmiş Dükkan eşyaları (henüz satın alınmamışlar)
  const shopItems = useMemo(() => {
    return SHOP_ITEMS.filter(item => {
      const isNotOwned = !stats.inventory?.includes(item.id);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return isNotOwned && matchesCategory;
    });
  }, [stats.inventory, selectedCategory]);

  // Dolap eşyaları (kullanıcının sahip olduğu veya ücretsiz tüm eşyalar)
  const wardrobeItems = useMemo(() => {
    return SHOP_ITEMS.filter(item => {
      const isOwned = stats.inventory?.includes(item.id) || item.cost === 0;
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return isOwned && matchesCategory;
    });
  }, [stats.inventory, selectedCategory]);

  const handleBuy = (item: ShopItem) => {
    const success = buyItem(item.id, item.cost);
    if (success) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      equipItem(item.category, item.id);
    } else {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(t('warning'), t('insufficient_habitium'));
    }
  };

  const handleEquip = (item: ShopItem) => {
    equipItem(item.category, item.id);
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
  };

  // Eğer kişilik anketini çözmediyse anketi göster
  if (stats.personality === null) {
    return (
      <Animated.View style={[slideStyle, styles.screen, { backgroundColor: isDark ? '#090514' : '#f3f4f6' }]}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 100 }}>
          <HabitusQuestionnaire />
        </ScrollView>
      </Animated.View>
    );
  }

  const categoryFilters = [
    { id: 'all', label: t('category_all') },
    { id: 'body', label: t('category_body') },
    { id: 'hair', label: t('category_hair') },
    { id: 'eyes', label: t('category_eyes') },
    { id: 'outfit', label: t('category_outfit') },
    { id: 'home', label: t('category_home') },
    { id: 'vehicle', label: t('category_vehicle') },
    { id: 'companion', label: t('category_companion') },
  ];

  return (
    <Animated.View style={[slideStyle, styles.screen, { backgroundColor: isDark ? '#090514' : '#f3f4f6' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 }}
      >
        {/* ── Üst Başlık & Bakiye ── */}
        <Animated.View entering={FadeInUp.delay(50)} style={styles.header}>
          <View>
            <Text style={styles.retroTitle}>{t('habitus_title')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
                setPersonality(null);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}
            >
              <Text style={styles.personalitySub}>
                {personalityInfo?.title ? t(`pers_${stats.personality}_title`) || personalityInfo.title : t('friend_sub')}
              </Text>
              <FontAwesome name="refresh" size={12} color={isDark ? '#94a3b8' : '#64748b'} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          {/* Bakiye Göstergesi */}
          <View style={styles.habitiumPill}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.habitiumText}>{stats.habitium ?? 0} HBT</Text>
          </View>
        </Animated.View>

        {/* ── Habitus Görseli (Merkez Sahne) ── */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.avatarContainer}>
          <HabitusAvatar interactive={isFocused} />
        </Animated.View>

        {/* ── Seviye & İlerleme Barı ── */}
        <Animated.View entering={FadeInUp.delay(150)} style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLevel}>{t('level')} {stats.level}</Text>
            <Text style={styles.xpValue}>{xpForCurrentLevel} / {xpToNextLevel} XP</Text>
          </View>

          {/* Retro Piksel Bar */}
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${progressPct}%` }]} />
          </View>
        </Animated.View>

        {/* ── Başarımlar Butonu (Gold glow) ── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowAchievements(true)}
          style={styles.achievementsBtn}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FontAwesome name="trophy" size={16} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text style={styles.achievementsBtnText}>{t('achievements_btn_text')}</Text>
          </View>
          <View style={styles.achCountBadge}>
            <Text style={styles.achCountText}>{unlockedCount}/{achievements.length}</Text>
          </View>
        </TouchableOpacity>

        {/* ── DÜKKAN / DOLAP ALT SEKMELERİ ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { setActiveSubTab('shop'); safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.tabBtn, activeSubTab === 'shop' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeSubTab === 'shop' && styles.tabBtnTextActive]}>{t('shop_tab')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { setActiveSubTab('wardrobe'); safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.tabBtn, activeSubTab === 'wardrobe' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeSubTab === 'wardrobe' && styles.tabBtnTextActive]}>{t('wardrobe_tab')}</Text>
          </TouchableOpacity>
        </View>

        {/* Kategori Filtresi */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
        >
          {categoryFilters.map(cat => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              onPress={() => { setSelectedCategory(cat.id); safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryBtnActive]}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── İÇERİK IZGARASI (GRID LIST) ── */}
        <Animated.View layout={Layout.springify()} style={styles.itemsGrid}>
          {activeSubTab === 'shop' ? (
            shopItems.length > 0 ? (
              shopItems.map(item => {
                const itemName = t(`item_${item.id}_name`) !== `item_${item.id}_name` ? t(`item_${item.id}_name`) : item.name;
                const itemDesc = t(`item_${item.id}_description`) !== `item_${item.id}_description` ? t(`item_${item.id}_description`) : item.description;
                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={[styles.itemEmojiBg, { backgroundColor: `${item.accentColor}15` }]}>
                      <PixelItemIcon itemId={item.id} size={48} />
                    </View>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.itemDesc}>{itemDesc}</Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleBuy(item)}
                      style={styles.buyBtn}
                    >
                      <Text style={styles.buyBtnText}>{item.cost === 0 ? t('free') : `${item.cost} HBT`}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🪙</Text>
                <Text style={styles.emptyText}>{t('no_shop_items')}</Text>
              </View>
            )
          ) : (
            wardrobeItems.length > 0 ? (
              wardrobeItems.map(item => {
                const isEquipped = stats.equipped?.[item.category] === item.id;
                const itemName = t(`item_${item.id}_name`) !== `item_${item.id}_name` ? t(`item_${item.id}_name`) : item.name;
                const itemDesc = t(`item_${item.id}_description`) !== `item_${item.id}_description` ? t(`item_${item.id}_description`) : item.description;
                return (
                  <View key={item.id} style={[styles.itemCard, isEquipped && styles.equippedCard]}>
                    <View style={[styles.itemEmojiBg, { backgroundColor: `${item.accentColor}15` }]}>
                      <PixelItemIcon itemId={item.id} size={48} />
                    </View>
                    <Text style={styles.itemName}>{itemName}</Text>
                    <Text style={styles.itemDesc}>{itemDesc}</Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleEquip(item)}
                      style={[styles.equipBtn, isEquipped && styles.equipBtnActive]}
                    >
                      <Text style={[styles.equipBtnText, isEquipped && styles.equipBtnTextActive]}>
                        {isEquipped ? t('equipped') : t('equip')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>👕</Text>
                <Text style={styles.emptyText}>{t('no_wardrobe_items')}</Text>
              </View>
            )
          )}
        </Animated.View>
      </ScrollView>

      {/* Başarımlar Modalı */}
      <AchievementsDrawer
        visible={showAchievements}
        onClose={() => setShowAchievements(false)}
        achievements={achievements}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  retroTitle: {
    fontFamily: 'PressStart2P',
    fontSize: 20,
    color: '#000000',
  },
  personalitySub: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: '#475569',
    marginTop: 2,
  },
  habitiumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef08a',
    borderColor: '#000000',
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  coinIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  habitiumText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: '#854d0e',
    fontWeight: 'bold',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  xpCard: {
    backgroundColor: '#ffffff',
    borderColor: '#1e293b', // Premium slate border
    borderWidth: 4,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a', // Premium slate shadow
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  xpLevel: {
    fontFamily: 'PressStart2P',
    fontSize: 12,
    color: '#0f172a',
  },
  xpValue: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: '#10b981',
    fontWeight: 'bold',
  },
  xpBarTrack: {
    height: 14,
    backgroundColor: '#e5e7eb',
    borderColor: '#1e293b',
    borderWidth: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  achievementsBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#1e293b',
    borderWidth: 3,
    borderRadius: 0,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#fbbf24', // Gold shadow remains
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  achievementsBtnText: {
    fontFamily: 'PressStart2P',
    fontSize: 10,
    color: '#0f172a',
  },
  achCountBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#1e293b',
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  achCountText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: '#b45309',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderColor: '#1e293b',
    borderWidth: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    top: 3,
  },
  tabBtnText: {
    fontFamily: 'PressStart2P',
    fontSize: 11,
    color: '#6b7280',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryBtn: {
    backgroundColor: '#f3f4f6',
    borderColor: '#1e293b',
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBtnActive: {
    backgroundColor: '#10b981',
  },
  categoryText: {
    fontFamily: 'VT323',
    fontSize: 16,
    color: '#0f172a',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#1e293b',
    padding: 12,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    marginBottom: 6,
  },
  equippedCard: {
    borderColor: '#10b981',
    borderWidth: 4,
  },
  itemEmojiBg: {
    width: 60,
    height: 60,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 32,
  },
  itemName: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 12,
    marginBottom: 6,
  },
  itemDesc: {
    fontFamily: 'VT323',
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    height: 36,
    lineHeight: 15,
    overflow: 'hidden',
    marginBottom: 8,
  },
  buyBtn: {
    width: '100%',
    backgroundColor: '#eab308',
    borderColor: '#1e293b',
    borderWidth: 2.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyBtnText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  equipBtn: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderColor: '#1e293b',
    borderWidth: 2.5,
    paddingVertical: 8,
    alignItems: 'center',
  },
  equipBtnActive: {
    backgroundColor: '#10b981',
  },
  equipBtnText: {
    fontFamily: 'PressStart2P',
    fontSize: 9,
    color: '#0f172a',
  },
  equipBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  emptyText: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
  },
});
