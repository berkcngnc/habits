import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, ZoomIn, ZoomOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { safeHaptics } from '../utils/haptics';
import { useHabits } from '../context/HabitsContext';
import { useLanguage } from '../context/LanguageContext';
import { HABITUS_DIALOGUES, HabitusPersonalityType } from '../constants/HabitusDialogues';

interface HabitusAvatarProps {
  interactive?: boolean;
}

// ── Retro Renk Paletleri ──
const BACKGROUNDS: Record<string, string> = {
  default_background: '#475569', // Sade gri
  retro_arcade: '#1e1b4b', // Neon koyu mor
  cyber_penthouse: '#0f172a', // Gece siber mavisi
  nature_cabin: '#78350f', // Sıcak ahşap kulübe
  space_station: '#020617', // Derin uzay siyahı
  beach_sunset: '#ea580c', // Gün batımı turuncusu
  zen_garden: '#fbcfe8', // Sakura pembe
  dungeon_castle: '#334155', // Şato gri taş
};

const BODIES: Record<string, string> = {
  default_body: '#10b981', // Canlı yeşil piksel
  cyborg_body: '#9ca3af', // Robotik metalik gri
  golden_body: '#eab308', // Parlak sarı altın
  phantom_body: '#8b5cf6', // Hayalet moru
  fire_body: '#ea580c', // Alev turuncusu
  ice_body: '#38bdf8', // Buz mavisi
  alien_body: '#22c55e', // Zümrüt uzaylı yeşili
  shadow_body: '#1e293b', // Gölge siyahı
  candy_pink_body: '#ec4899', // Canlı şeker pembesi
  neon_cyber_body: '#06b6d4', // Neon siyan siber
  wooden_puppet_body: '#b45309', // Ahşap kahverengi
  poison_slime_body: '#84cc16', // Zehir asit yeşili
  galaxy_cosmic_body: '#6366f1', // Kozmik mavi
  magma_lava_body: '#dc2626', // Magma kırmızısı
  hologram_blue_body: '#0284c7', // Hologram mavi
  bronze_warrior_body: '#d97706', // Eskitme bronz
  diamond_crystal_body: '#67e8f9', // Elmas siyan
  steampunk_brass_body: '#ca8a04', // Pirinç metal
  pastel_lavender_body: '#c084fc', // Lavanta moru
  vampire_goth_body: '#991b1b', // Gotik bordo
};

export default function HabitusAvatar({ interactive = true }: HabitusAvatarProps) {
  const { stats } = useHabits();
  const { t } = useLanguage();
  const { equipped, personality } = stats;

  const currentPersonality = (personality as HabitusPersonalityType) || 'cheerful';

  const [dialogue, setDialogue] = useState<string>('');
  const [showBubble, setShowBubble] = useState<boolean>(false);
  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animasyon Değerleri ──
  const floatAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);

  // Solunum/Uçma Efekti (Retro Karakter Sallanması)
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedAvatarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: floatAnim.value },
        { scale: scaleAnim.value },
      ],
    };
  });

  // Rastgele zamanlarda konuşma balonu çıkarma
  useEffect(() => {
    if (!interactive) return;

    const showRandomQuote = () => {
      const dialoguePool = HABITUS_DIALOGUES[currentPersonality]?.idle || HABITUS_DIALOGUES.cheerful.idle;
      const randomQuote = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
      triggerSpeechBubble(t(randomQuote) || randomQuote);
    };

    const initialTimer = setTimeout(showRandomQuote, 3000);
    const interval = setInterval(showRandomQuote, 25000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [currentPersonality, interactive]);

  // Alışkanlık tamamlandığında tebrik mesajı çıkarma
  useEffect(() => {
    if (stats.totalCompleted > 0 && isLoadedRef.current) {
      const dialoguePool = HABITUS_DIALOGUES[currentPersonality]?.complete || HABITUS_DIALOGUES.cheerful.complete;
      const randomQuote = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
      triggerSpeechBubble(t(randomQuote) || randomQuote);
    }
  }, [stats.totalCompleted, currentPersonality]);

  const isLoadedRef = useRef(false);
  useEffect(() => {
    isLoadedRef.current = true;
  }, []);

  const triggerSpeechBubble = (text: string) => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    setDialogue(text);
    setShowBubble(true);

    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
    }, 5500);
  };

  const handleTap = () => {
    if (!interactive) return;
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);

    scaleAnim.value = withSequence(
      withTiming(1.15, { duration: 100 }),
      withSpring(1, { damping: 6 })
    );

    const dialoguePool = HABITUS_DIALOGUES[currentPersonality]?.tap || HABITUS_DIALOGUES.cheerful.tap;
    const randomQuote = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    triggerSpeechBubble(t(randomQuote) || randomQuote);
  };

  const bodyId = equipped?.body || 'default_body';
  const hairId = equipped?.hair || 'default_hair';
  const eyesId = equipped?.eyes || 'default_eyes';
  const outfitId = equipped?.outfit || 'default_outfit';
  const homeId = equipped?.home || equipped?.background || 'default_background';
  const vehicleId = equipped?.vehicle || 'default_none';
  const companionId = equipped?.companion || 'companion_none';

  const bgColor = BACKGROUNDS[homeId] || BACKGROUNDS.default_background;
  const bodyColor = BODIES[bodyId] || BODIES.default_body;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* ── ARKA PLAN DEKORLARI (HOME) ── */}
      {homeId === 'retro_arcade' && (
        <View style={styles.arcadeNeonBg}>
          <View style={[styles.neonLight, { left: 30, backgroundColor: '#ff0055' }]} />
          <View style={[styles.neonLight, { right: 30, backgroundColor: '#00ffff' }]} />
          <View style={styles.pixelArcadeCabinet}>
            <View style={styles.arcadeScreenGlow} />
            <View style={styles.arcadeMarqueeTop} />
          </View>
        </View>
      )}

      {homeId === 'cyber_penthouse' && (
        <View style={styles.cyberGridBg}>
          <View style={styles.cyberBuildingLeft} />
          <View style={styles.cyberBuildingRight} />
          <View style={styles.cyberMoon} />
          <View style={styles.cyberWindowBorder} />
        </View>
      )}

      {homeId === 'nature_cabin' && (
        <View style={styles.cabinBg}>
          <View style={styles.logBeam1} />
          <View style={styles.logBeam2} />
          <View style={styles.cabinWindow}>
            <View style={styles.cabinPineTree} />
          </View>
          <View style={styles.cabinFireplace}>
            <View style={styles.flameOuter} />
          </View>
        </View>
      )}

      {homeId === 'space_station' && (
        <View style={styles.spaceBg}>
          <View style={styles.planetBlue} />
          <View style={styles.starDot1} />
          <View style={styles.starDot2} />
          <View style={styles.starDot3} />
        </View>
      )}

      {homeId === 'beach_sunset' && (
        <View style={styles.beachBg}>
          <View style={styles.sunYellow} />
          <View style={styles.palmTreeLeft} />
          <View style={styles.seaBlueLine} />
        </View>
      )}

      {homeId === 'zen_garden' && (
        <View style={styles.zenBg}>
          <View style={styles.sakuraTree} />
          <View style={styles.bambooStalk1} />
          <View style={styles.bambooStalk2} />
        </View>
      )}

      {homeId === 'dungeon_castle' && (
        <View style={styles.dungeonBg}>
          <View style={styles.stoneBrickGrid} />
          <View style={styles.torchLeft}>
            <View style={styles.torchFlame} />
          </View>
          <View style={styles.torchRight}>
            <View style={styles.torchFlame} />
          </View>
        </View>
      )}

      {homeId === 'cozy_library' && (
        <View style={styles.cabinBg}>
          <View style={[styles.logBeam1, { backgroundColor: '#78350f' }]} />
          <View style={{ position: 'absolute', top: 20, left: 20, width: 60, height: 100, backgroundColor: '#451a03', borderWidth: 2, borderColor: '#78350f', padding: 4 }}>
            <View style={{ width: '100%', height: 12, backgroundColor: '#dc2626', marginBottom: 4 }} />
            <View style={{ width: '100%', height: 12, backgroundColor: '#2563eb', marginBottom: 4 }} />
            <View style={{ width: '100%', height: 12, backgroundColor: '#16a34a' }} />
          </View>
        </View>
      )}

      {homeId === 'underwater_reef' && (
        <View style={[styles.spaceBg, { backgroundColor: '#0284c7' }]}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, backgroundColor: '#ca8a04' }} />
          <View style={{ position: 'absolute', bottom: 30, left: 20, width: 8, height: 80, backgroundColor: '#15803d' }} />
          <View style={{ position: 'absolute', top: 40, right: 40, width: 14, height: 8, backgroundColor: '#f97316' }} />
          <View style={{ position: 'absolute', top: 80, right: 100, width: 12, height: 6, backgroundColor: '#facc15' }} />
        </View>
      )}

      {homeId === 'volcano_lair' && (
        <View style={[styles.dungeonBg, { backgroundColor: '#450a0a' }]}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, backgroundColor: '#dc2626' }} />
          <View style={{ position: 'absolute', bottom: 44, left: 0, right: 0, height: 6, backgroundColor: '#fef08a' }} />
          <View style={{ position: 'absolute', top: 30, left: 30, width: 8, height: 8, backgroundColor: '#f97316' }} />
        </View>
      )}

      {homeId === 'candy_kingdom' && (
        <View style={[styles.zenBg, { backgroundColor: '#fbcfe8' }]}>
          <View style={{ position: 'absolute', top: 20, left: 30, width: 50, height: 26, backgroundColor: '#ffffff', borderRadius: 13 }} />
          <View style={{ position: 'absolute', bottom: 20, right: 20, width: 32, height: 32, backgroundColor: '#ec4899', borderRadius: 16 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 33, width: 6, height: 30, backgroundColor: '#78350f' }} />
        </View>
      )}

      {homeId === 'graveyard_spooky' && (
        <View style={[styles.dungeonBg, { backgroundColor: '#0f172a' }]}>
          <View style={{ position: 'absolute', top: 20, right: 30, width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 20 }} />
          <View style={{ position: 'absolute', bottom: 0, left: 30, width: 24, height: 36, backgroundColor: '#64748b', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 40, width: 20, height: 28, backgroundColor: '#64748b', borderTopLeftRadius: 10, borderTopRightRadius: 10 }} />
        </View>
      )}

      {homeId === 'disco_dancefloor' && (
        <View style={[styles.arcadeNeonBg, { backgroundColor: '#1e1b4b' }]}>
          <View style={{ position: 'absolute', top: 10, alignSelf: 'center', width: 32, height: 32, backgroundColor: '#e2e8f0', borderRadius: 16, borderWidth: 2, borderColor: '#ffffff' }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '25%', height: 25, backgroundColor: '#ec4899' }} />
            <View style={{ width: '25%', height: 25, backgroundColor: '#06b6d4' }} />
            <View style={{ width: '25%', height: 25, backgroundColor: '#eab308' }} />
            <View style={{ width: '25%', height: 25, backgroundColor: '#10b981' }} />
          </View>
        </View>
      )}

      {homeId === 'cloud_palace' && (
        <View style={[styles.spaceBg, { backgroundColor: '#38bdf8' }]}>
          <View style={{ position: 'absolute', top: 30, right: 40, width: 40, height: 50, backgroundColor: '#fbbf24', borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
          <View style={{ position: 'absolute', bottom: -10, left: 0, right: 0, height: 60, backgroundColor: '#ffffff', borderRadius: 30 }} />
        </View>
      )}

      {homeId === 'matrix_digital' && (
        <View style={[styles.cyberGridBg, { backgroundColor: '#020617' }]}>
          <View style={[styles.neonLight, { left: 30, backgroundColor: '#22c55e', opacity: 0.7 }]} />
          <View style={[styles.neonLight, { left: 90, backgroundColor: '#22c55e', opacity: 0.5 }]} />
          <View style={[styles.neonLight, { right: 40, backgroundColor: '#22c55e', opacity: 0.8 }]} />
        </View>
      )}

      {homeId === 'desert_pyramids' && (
        <View style={[styles.beachBg, { backgroundColor: '#f59e0b' }]}>
          <View style={{ position: 'absolute', top: 30, left: 30, width: 44, height: 44, backgroundColor: '#fef08a', borderRadius: 22 }} />
          <View style={{ position: 'absolute', bottom: 30, right: 20, width: 0, height: 0, borderLeftWidth: 40, borderRightWidth: 40, borderBottomWidth: 60, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#d97706' }} />
        </View>
      )}

      {homeId === 'cyber_ramen_shop' && (
        <View style={[styles.arcadeNeonBg, { backgroundColor: '#090514' }]}>
          <View style={{ position: 'absolute', top: 15, left: 20, width: 20, height: 28, backgroundColor: '#ef4444', borderRadius: 4 }} />
          <View style={{ position: 'absolute', top: 15, right: 20, width: 20, height: 28, backgroundColor: '#ef4444', borderRadius: 4 }} />
        </View>
      )}

      {homeId === 'snowy_igloo' && (
        <View style={[styles.spaceBg, { backgroundColor: '#0f172a' }]}>
          <View style={{ position: 'absolute', top: 15, left: 0, right: 0, height: 20, backgroundColor: '#10b981', opacity: 0.4 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 20, width: 70, height: 44, backgroundColor: '#f1f5f9', borderTopLeftRadius: 35, borderTopRightRadius: 35 }} />
        </View>
      )}

      {homeId === 'gold_treasury' && (
        <View style={[styles.spaceBg, { backgroundColor: '#78350f' }]}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: '#eab308' }} />
          <View style={{ position: 'absolute', bottom: 40, left: 30, width: 14, height: 14, backgroundColor: '#fef08a' }} />
          <View style={{ position: 'absolute', bottom: 40, right: 40, width: 14, height: 14, backgroundColor: '#ef4444' }} />
        </View>
      )}

      {/* ── KONUŞMA BALONU ── */}
      {showBubble && (
        <Animated.View
          entering={ZoomIn.duration(300)}
          exiting={ZoomOut.duration(200)}
          style={styles.bubbleContainer}
        >
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{dialogue}</Text>
          </View>
          <View style={styles.bubbleTail} />
        </Animated.View>
      )}

      {/* ── HABITUS KARAKTER GRUBU ── */}
      <Animated.View style={[styles.avatarGroup, animatedAvatarStyle]}>
        {/* VEHICLES (Araçlar) */}
        {vehicleId !== 'default_none' && (
          <View style={styles.vehicleWrapper}>
            {vehicleId === 'pixel_skateboard' && (
              <View style={styles.skateWrapper}>
                <View style={styles.skateDeckBody}>
                  <View style={styles.skateFlameGraphic1} />
                </View>
                <View style={styles.skateWheelRow}>
                  <View style={styles.skateWheelBlock} />
                  <View style={styles.skateWheelBlock} />
                </View>
              </View>
            )}

            {vehicleId === 'retro_car' && (
              <View style={styles.carWrapper}>
                <View style={styles.carCabinTop} />
                <View style={styles.carBodyRed}>
                  <View style={styles.carHeadlightYellow} />
                  <View style={styles.carWheelFront} />
                  <View style={styles.carWheelBack} />
                </View>
              </View>
            )}

            {vehicleId === 'hoverboard' && (
              <View style={styles.hoverWrapper}>
                <View style={styles.hoverBoardBody}>
                  <View style={styles.hoverNeonStripe} />
                </View>
                <View style={styles.hoverThrusterGlow} />
              </View>
            )}

            {vehicleId === 'magic_carpet' && (
              <View style={styles.carpetWrapper}>
                <View style={styles.carpetBody}>
                  <View style={styles.carpetStripe} />
                </View>
              </View>
            )}

            {vehicleId === 'racing_kart' && (
              <View style={styles.carWrapper}>
                <View style={[styles.carBodyRed, { backgroundColor: '#10b981' }]}>
                  <View style={styles.carWheelFront} />
                  <View style={styles.carWheelBack} />
                </View>
              </View>
            )}

            {vehicleId === 'bamboo_raft' && (
              <View style={styles.raftWrapper}>
                <View style={styles.bambooLogGroup} />
              </View>
            )}

            {vehicleId === 'mecha_scooter' && (
              <View style={styles.scooterWrapper}>
                <View style={styles.scooterBody} />
                <View style={styles.scooterWheelFront} />
                <View style={styles.scooterWheelBack} />
              </View>
            )}

            {vehicleId === 'flying_broom' && (
              <View style={styles.skateWrapper}>
                <View style={{ width: 50, height: 6, backgroundColor: '#78350f', borderRadius: 2 }}>
                  <View style={{ position: 'absolute', right: -6, top: -4, width: 14, height: 14, backgroundColor: '#f59e0b', borderTopRightRadius: 6, borderBottomRightRadius: 6 }} />
                </View>
              </View>
            )}

            {vehicleId === 'giant_mech_foot' && (
              <View style={styles.carWrapper}>
                <View style={{ width: 44, height: 18, backgroundColor: '#475569', borderWidth: 2, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: 36, height: 4, backgroundColor: '#94a3b8' }} />
                </View>
              </View>
            )}

            {vehicleId === 'steam_locomotive' && (
              <View style={styles.carWrapper}>
                <View style={{ width: 46, height: 20, backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#0f172a', justifyContent: 'center' }}>
                  <View style={{ position: 'absolute', top: -8, left: 6, width: 8, height: 8, backgroundColor: '#475569' }} />
                  <View style={{ position: 'absolute', top: -14, left: 4, width: 12, height: 6, backgroundColor: '#f8fafc', opacity: 0.6, borderRadius: 3 }} />
                </View>
              </View>
            )}

            {vehicleId === 'ufo_saucer' && (
              <View style={styles.hoverWrapper}>
                <View style={{ width: 48, height: 14, backgroundColor: '#94a3b8', borderRadius: 7, borderWidth: 1.5, borderColor: '#0f172a', alignItems: 'center' }}>
                  <View style={{ position: 'absolute', top: -6, width: 20, height: 10, backgroundColor: '#22c55e', borderRadius: 5, opacity: 0.8 }} />
                </View>
              </View>
            )}

            {vehicleId === 'pirate_ship' && (
              <View style={styles.carWrapper}>
                <View style={{ width: 48, height: 18, backgroundColor: '#78350f', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 1.5, borderColor: '#451a03', alignItems: 'center' }}>
                  <View style={{ position: 'absolute', top: -10, width: 3, height: 10, backgroundColor: '#451a03' }} />
                </View>
              </View>
            )}

            {vehicleId === 'bmx_bike' && (
              <View style={styles.scooterWrapper}>
                <View style={{ width: 36, height: 16, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#dc2626', justifyContent: 'flex-end', flexDirection: 'row' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#64748b' }} />
                </View>
              </View>
            )}

            {vehicleId === 'tank_mini' && (
              <View style={styles.carWrapper}>
                <View style={{ width: 44, height: 18, backgroundColor: '#3f6212', borderWidth: 2, borderColor: '#1e293b', justifyContent: 'center' }}>
                  <View style={{ position: 'absolute', top: 4, right: -10, width: 12, height: 4, backgroundColor: '#1a2e05' }} />
                </View>
              </View>
            )}

            {vehicleId === 'submersible' && (
              <View style={styles.carWrapper}>
                <View style={{ width: 46, height: 20, backgroundColor: '#eab308', borderRadius: 10, borderWidth: 2, borderColor: '#854d0e', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 10, height: 10, backgroundColor: '#38bdf8', borderRadius: 5, borderWidth: 1, borderColor: '#854d0e' }} />
                </View>
              </View>
            )}

            {vehicleId === 'shopping_cart' && (
              <View style={styles.scooterWrapper}>
                <View style={{ width: 34, height: 20, borderWidth: 2, borderColor: '#94a3b8', backgroundColor: '#e2e8f080', justifyContent: 'flex-end', padding: 2 }}>
                  <View style={{ width: 4, height: 4, backgroundColor: '#0f172a', borderRadius: 2 }} />
                </View>
              </View>
            )}

            {vehicleId === 'golden_chariot' && (
              <View style={styles.carWrapper}>
                <View style={{ width: 44, height: 18, backgroundColor: '#eab308', borderWidth: 2, borderColor: '#854d0e', borderTopLeftRadius: 8 }}>
                  <View style={{ position: 'absolute', bottom: -4, right: 4, width: 10, height: 10, borderRadius: 5, backgroundColor: '#fbbf24', borderWidth: 1, borderColor: '#854d0e' }} />
                </View>
              </View>
            )}

            {vehicleId === 'rocket_thruster' && (
              <View style={styles.hoverWrapper}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ width: 12, height: 22, backgroundColor: '#ea580c', borderWidth: 1.5, borderColor: '#1e293b', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                  <View style={{ width: 12, height: 22, backgroundColor: '#ea580c', borderWidth: 1.5, borderColor: '#1e293b', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
                </View>
              </View>
            )}

            {vehicleId === 'cloud_nimbus' && (
              <View style={styles.carpetWrapper}>
                <View style={{ width: 46, height: 20, backgroundColor: '#fef08a', borderRadius: 10, borderWidth: 2, borderColor: '#facc15' }} />
              </View>
            )}
          </View>
        )}

        <TouchableOpacity activeOpacity={0.9} onPress={handleTap} style={styles.habitusTouchArea}>
          {/* ── HABITUS GÖVDE (Piksel Blok) ── */}
          <View style={[styles.habitusBody, { backgroundColor: bodyColor, borderColor: '#1e293b' }]}>
            {/* BODY TEXTURES */}
            {bodyId === 'cyborg_body' && (
              <>
                <View style={styles.cyborgCircuitLine1} />
                <View style={styles.cyborgChestCore} />
              </>
            )}
            {bodyId === 'golden_body' && (
              <>
                <View style={styles.goldenShine1} />
                <View style={styles.goldenSparkle} />
              </>
            )}
            {bodyId === 'phantom_body' && (
              <>
                <View style={styles.phantomParticle1} />
                <View style={styles.phantomParticle2} />
              </>
            )}
            {bodyId === 'fire_body' && (
              <>
                <View style={styles.fireSparkDot1} />
                <View style={styles.fireSparkDot2} />
              </>
            )}
            {bodyId === 'ice_body' && (
              <View style={styles.iceGlintLine} />
            )}
            {bodyId === 'alien_body' && (
              <View style={styles.alienDotPattern} />
            )}
            {bodyId === 'shadow_body' && (
              <View style={styles.shadowFogOverlay} />
            )}
            {bodyId === 'candy_pink_body' && (
              <>
                <View style={styles.goldenShine1} />
                <View style={styles.fireSparkDot1} />
              </>
            )}
            {bodyId === 'neon_cyber_body' && (
              <View style={styles.cyborgCircuitLine1} />
            )}
            {bodyId === 'wooden_puppet_body' && (
              <View style={styles.logBeam1} />
            )}
            {bodyId === 'poison_slime_body' && (
              <View style={styles.phantomParticle1} />
            )}
            {bodyId === 'galaxy_cosmic_body' && (
              <>
                <View style={styles.starDot1} />
                <View style={styles.starDot2} />
              </>
            )}
            {bodyId === 'magma_lava_body' && (
              <View style={styles.flameOuter} />
            )}
            {bodyId === 'hologram_blue_body' && (
              <View style={styles.visorScanlineCyan} />
            )}
            {bodyId === 'bronze_warrior_body' && (
              <View style={styles.cyborgCircuitLine1} />
            )}
            {bodyId === 'diamond_crystal_body' && (
              <View style={styles.goldenShine1} />
            )}
            {bodyId === 'steampunk_brass_body' && (
              <View style={styles.goldenShine1} />
            )}
            {bodyId === 'pastel_lavender_body' && (
              <View style={styles.goldenSparkle} />
            )}
            {bodyId === 'vampire_goth_body' && (
              <View style={styles.shadowFogOverlay} />
            )}

            {/* OUTFITS (Kıyafetler) */}
            {outfitId === 'casual_hoodie' && (
              <View style={styles.hoodieLayer}>
                <View style={styles.hoodieDrawstringL} />
                <View style={styles.hoodieDrawstringR} />
                <View style={styles.hoodieCenterPocket} />
              </View>
            )}

            {outfitId === 'retro_suit' && (
              <View style={styles.suitLayer}>
                <View style={styles.suitShirtInner}>
                  <View style={styles.suitTieRed} />
                </View>
              </View>
            )}

            {outfitId === 'wizard_robe' && (
              <View style={styles.wizardLayer}>
                <View style={styles.wizardHemGold} />
                <Text style={styles.wizardStarIcon}>★</Text>
              </View>
            )}

            {outfitId === 'astronaut_outfit' && (
              <View style={styles.astroLayer}>
                <View style={styles.astroChestPlate}>
                  <View style={styles.astroBadgeRedDot} />
                  <View style={styles.astroBadgeBlueDot} />
                </View>
              </View>
            )}

            {outfitId === 'ninja_gi' && (
              <View style={[styles.suitLayer, { backgroundColor: '#0f172a' }]}>
                <View style={styles.ninjaSashRed} />
              </View>
            )}

            {outfitId === 'royal_armor' && (
              <View style={[styles.suitLayer, { backgroundColor: '#9ca3af', borderColor: '#fbbf24', borderTopWidth: 3 }]}>
                <View style={styles.armorGoldEmblem} />
              </View>
            )}

            {outfitId === 'hawaiian_shirt' && (
              <View style={[styles.hoodieLayer, { backgroundColor: '#f59e0b' }]}>
                <View style={styles.hawaiiPatternDot1} />
                <View style={styles.hawaiiPatternDot2} />
              </View>
            )}

            {outfitId === 'superhero_cape' && (
              <View style={[styles.suitLayer, { backgroundColor: '#ef4444' }]}>
                <View style={styles.heroChestSymbol} />
              </View>
            )}

            {outfitId === 'kimono_outfit' && (
              <View style={[styles.suitLayer, { backgroundColor: '#ec4899' }]}>
                <View style={styles.kimonoObiYellow} />
              </View>
            )}

            {outfitId === 'overalls_worker' && (
              <View style={[styles.suitLayer, { backgroundColor: '#2563eb', alignItems: 'center' }]}>
                <View style={{ width: 14, height: 26, backgroundColor: '#1d4ed8', borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#1e293b' }} />
                <View style={{ position: 'absolute', top: 4, left: 24, width: 4, height: 4, backgroundColor: '#facc15' }} />
                <View style={{ position: 'absolute', top: 4, right: 24, width: 4, height: 4, backgroundColor: '#facc15' }} />
              </View>
            )}
            {outfitId === 'tracksuit_retro' && (
              <View style={[styles.hoodieLayer, { backgroundColor: '#dc2626', alignItems: 'center' }]}>
                <View style={{ width: 4, height: 38, backgroundColor: '#ffffff' }} />
                <View style={{ position: 'absolute', top: 10, left: 0, right: 0, height: 4, backgroundColor: '#ffffff' }} />
              </View>
            )}
            {outfitId === 'overcoat_detective' && (
              <View style={[styles.suitLayer, { backgroundColor: '#78350f', alignItems: 'center' }]}>
                <View style={{ width: 10, height: 38, backgroundColor: '#451a03' }} />
                <View style={{ position: 'absolute', top: 6, left: 34, width: 4, height: 4, backgroundColor: '#facc15' }} />
                <View style={{ position: 'absolute', top: 18, left: 34, width: 4, height: 4, backgroundColor: '#facc15' }} />
              </View>
            )}
            {outfitId === 'doctor_coat' && (
              <View style={[styles.suitLayer, { backgroundColor: '#ffffff', alignItems: 'center' }]}>
                <View style={{ width: 12, height: 38, backgroundColor: '#0284c7' }} />
                <View style={{ position: 'absolute', top: 4, width: 32, height: 12, borderBottomWidth: 3, borderColor: '#64748b' }} />
              </View>
            )}
            {outfitId === 'pirate_coat' && (
              <View style={[styles.suitLayer, { backgroundColor: '#b91c1c', alignItems: 'center', borderTopWidth: 3, borderColor: '#fbbf24' }]}>
                <View style={{ width: 14, height: 38, backgroundColor: '#1e293b' }} />
                <View style={{ position: 'absolute', top: 8, left: 24, width: 4, height: 4, backgroundColor: '#fbbf24' }} />
                <View style={{ position: 'absolute', top: 18, left: 24, width: 4, height: 4, backgroundColor: '#fbbf24' }} />
              </View>
            )}
            {outfitId === 'cyberpunk_jacket' && (
              <View style={[styles.hoodieLayer, { backgroundColor: '#0f172a', borderTopWidth: 4, borderColor: '#06b6d4' }]}>
                <View style={{ width: 6, height: 38, backgroundColor: '#ec4899' }} />
              </View>
            )}
            {outfitId === 'pajamas_bear' && (
              <View style={[styles.hoodieLayer, { backgroundColor: '#fb7185', alignItems: 'center' }]}>
                <View style={{ position: 'absolute', top: 6, width: 5, height: 5, backgroundColor: '#ffffff', borderRadius: 2.5 }} />
                <View style={{ position: 'absolute', top: 16, width: 5, height: 5, backgroundColor: '#ffffff', borderRadius: 2.5 }} />
              </View>
            )}
            {outfitId === 'tuxedo_gold' && (
              <View style={[styles.suitLayer, { backgroundColor: '#eab308', alignItems: 'center' }]}>
                <View style={{ width: 16, height: 38, backgroundColor: '#ffffff', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 6, backgroundColor: '#0f172a', top: 2 }} />
                </View>
              </View>
            )}
            {outfitId === 'dino_onesie' && (
              <View style={[styles.hoodieLayer, { backgroundColor: '#16a34a', alignItems: 'center' }]}>
                <View style={{ width: 32, height: 26, backgroundColor: '#86efac', borderRadius: 12, top: 4 }} />
              </View>
            )}
            {outfitId === 'pharaoh_robe' && (
              <View style={[styles.wizardLayer, { backgroundColor: '#f8fafc', borderTopWidth: 5, borderColor: '#facc15' }]}>
                <View style={{ width: 44, height: 8, backgroundColor: '#0284c7', top: 0 }} />
              </View>
            )}

            {/* EYE ACCESSORIES (Gözler) */}
            {eyesId === 'default_eyes' && (
              <View style={styles.eyesWrapper}>
                <View style={styles.pixelEye} />
                <View style={styles.pixelEye} />
              </View>
            )}

            {eyesId === 'cool_sunglasses' && (
              <View style={styles.sunglassesFrame}>
                <View style={styles.sunglassGlassLeft}>
                  <View style={styles.sunglassGlareLine} />
                </View>
                <View style={styles.sunglassBridgeBar} />
                <View style={styles.sunglassGlassRight}>
                  <View style={styles.sunglassGlareLine} />
                </View>
              </View>
            )}

            {eyesId === 'monocle_eyes' && (
              <View style={styles.eyesWrapper}>
                <View style={styles.monocleFrame}>
                  <View style={styles.monocleGlassGlint} />
                  <View style={styles.monocleDanglingChain} />
                </View>
                <View style={styles.pixelEye} />
              </View>
            )}

            {eyesId === 'virtual_visor' && (
              <View style={styles.neonVisorFrame}>
                <View style={styles.visorScanlineCyan} />
              </View>
            )}

            {eyesId === 'anime_sparkle_eyes' && (
              <View style={styles.eyesWrapper}>
                <View style={[styles.pixelEye, { backgroundColor: '#f43f5e', width: 14, height: 14 }]}>
                  <View style={{ width: 4, height: 4, backgroundColor: '#ffffff' }} />
                </View>
                <View style={[styles.pixelEye, { backgroundColor: '#f43f5e', width: 14, height: 14 }]}>
                  <View style={{ width: 4, height: 4, backgroundColor: '#ffffff' }} />
                </View>
              </View>
            )}

            {eyesId === '3d_glasses' && (
              <View style={styles.sunglassesFrame}>
                <View style={[styles.sunglassGlassLeft, { backgroundColor: '#ef4444' }]} />
                <View style={styles.sunglassBridgeBar} />
                <View style={[styles.sunglassGlassRight, { backgroundColor: '#3b82f6' }]} />
              </View>
            )}

            {eyesId === 'pirate_eyepatch' && (
              <View style={styles.eyesWrapper}>
                <View style={[styles.pixelEye, { backgroundColor: '#0f172a', borderWidth: 0 }]} />
                <View style={styles.pixelEye} />
              </View>
            )}

            {eyesId === 'glowing_laser_eyes' && (
              <View style={styles.eyesWrapper}>
                <View style={[styles.pixelEye, { backgroundColor: '#ef4444' }]}>
                  <View style={styles.laserBeamLeft} />
                </View>
                <View style={[styles.pixelEye, { backgroundColor: '#ef4444' }]}>
                  <View style={styles.laserBeamRight} />
                </View>
              </View>
            )}

            {eyesId === 'heart_eyes' && (
              <View style={styles.eyesWrapper}>
                <PixelHeartEye />
                <PixelHeartEye />
              </View>
            )}

            {eyesId === 'hypno_spiral' && (
              <View style={styles.eyesWrapper}>
                <PixelHypnoEye />
                <PixelHypnoEye />
              </View>
            )}

            {eyesId === 'money_eyes' && (
              <View style={styles.eyesWrapper}>
                <View style={[styles.pixelEye, { backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fef08a', top: -1 }}>$</Text>
                </View>
                <View style={[styles.pixelEye, { backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#fef08a', top: -1 }}>$</Text>
                </View>
              </View>
            )}

            {eyesId === 'star_glasses' && (
              <View style={styles.sunglassesFrame}>
                <View style={[styles.sunglassGlassLeft, { backgroundColor: '#facc15' }]} />
                <View style={styles.sunglassBridgeBar} />
                <View style={[styles.sunglassGlassRight, { backgroundColor: '#facc15' }]} />
              </View>
            )}

            {eyesId === 'crying_tears' && (
              <View style={styles.eyesWrapper}>
                <View style={styles.pixelEye}>
                  <View style={{ position: 'absolute', bottom: -6, width: 4, height: 6, backgroundColor: '#38bdf8' }} />
                </View>
                <View style={styles.pixelEye}>
                  <View style={{ position: 'absolute', bottom: -6, width: 4, height: 6, backgroundColor: '#38bdf8' }} />
                </View>
              </View>
            )}

            {eyesId === 'pixel_goggles' && (
              <View style={styles.sunglassesFrame}>
                <View style={[styles.sunglassGlassLeft, { backgroundColor: '#ca8a04' }]} />
                <View style={styles.sunglassBridgeBar} />
                <View style={[styles.sunglassGlassRight, { backgroundColor: '#ca8a04' }]} />
              </View>
            )}

            {eyesId === 'cyborg_target_eye' && (
              <View style={styles.eyesWrapper}>
                <View style={[styles.pixelEye, { backgroundColor: '#dc2626' }]} />
                <View style={styles.pixelEye} />
              </View>
            )}

            {eyesId === 'cat_eye_glasses' && (
              <View style={styles.sunglassesFrame}>
                <View style={[styles.sunglassGlassLeft, { backgroundColor: '#0f172a' }]} />
                <View style={styles.sunglassBridgeBar} />
                <View style={[styles.sunglassGlassRight, { backgroundColor: '#0f172a' }]} />
              </View>
            )}

            {eyesId === 'sleepy_eyes' && (
              <View style={styles.eyesWrapper}>
                <View style={{ width: 14, height: 3, backgroundColor: '#0f172a' }} />
                <View style={{ width: 14, height: 3, backgroundColor: '#0f172a' }} />
              </View>
            )}

            {eyesId === 'fire_eyes' && (
              <View style={styles.eyesWrapper}>
                <PixelFireEye />
                <PixelFireEye />
              </View>
            )}

            {eyesId === 'diamond_eyes' && (
              <View style={styles.eyesWrapper}>
                <PixelDiamondEye />
                <PixelDiamondEye />
              </View>
            )}

            {eyesId === 'blindfold_master' && (
              <View style={[styles.neonVisorFrame, { backgroundColor: '#f8fafc' }]} />
            )}

            {/* MOUTH */}
            <View style={styles.pixelMouth} />
          </View>

          {/* HAIR / HEAD ACCESSORY */}
          {hairId === 'mohawk_hair' && (
            <View style={styles.mohawkHairGroup}>
              <View style={styles.mohawkSpike1} />
              <View style={styles.mohawkSpike2} />
              <View style={styles.mohawkSpike3} />
            </View>
          )}

          {hairId === 'crown_hair' && (
            <View style={styles.pixelCrownGroup}>
              <View style={styles.crownMainBase}>
                <View style={styles.crownTowerLeft} />
                <View style={styles.crownTowerCenter} />
                <View style={styles.crownTowerRight} />
                <View style={styles.crownRubyCenter} />
              </View>
            </View>
          )}

          {hairId === 'cap_hair' && (
            <View style={styles.pixelCapGroup}>
              <View style={styles.capDomeCyan}>
                <View style={styles.capLogoH} />
              </View>
              <View style={styles.capBrimMagenta} />
            </View>
          )}

          {hairId === 'ninja_headband' && (
            <View style={styles.ninjaBandGroup}>
              <View style={styles.ninjaBandStripe} />
              <View style={styles.ninjaBandTails} />
            </View>
          )}

          {hairId === 'cat_ears' && (
            <View style={styles.catEarsGroup}>
              <View style={styles.catEarLPeak} />
              <View style={styles.catEarRPeak} />
            </View>
          )}

          {hairId === 'viking_helmet' && (
            <View style={styles.vikingGroup}>
              <View style={styles.vikingHornLeft} />
              <View style={styles.vikingDomeSteel} />
              <View style={styles.vikingHornRight} />
            </View>
          )}

          {hairId === 'wizard_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={styles.wizHatConePurple} />
              <View style={styles.wizHatBrimPurple} />
            </View>
          )}

          {hairId === 'headphones' && (
            <View style={styles.headphonesGroup}>
              <View style={styles.headphonesArch} />
              <View style={styles.headphonesCupL} />
              <View style={styles.headphonesCupR} />
            </View>
          )}

          {hairId === 'pirate_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatBrimPurple, { backgroundColor: '#1e293b', borderColor: '#fbbf24' }]} />
            </View>
          )}

          {hairId === 'chef_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatConePurple, { backgroundColor: '#f8fafc', height: 38 }]} />
            </View>
          )}

          {hairId === 'afro_hair' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatConePurple, { backgroundColor: '#451a03', width: 80, height: 36, borderRadius: 18 }]} />
            </View>
          )}

          {hairId === 'halo_angel' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatBrimPurple, { backgroundColor: '#fde047', height: 8, top: -15 }]} />
            </View>
          )}

          {hairId === 'detective_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatConePurple, { backgroundColor: '#78350f', height: 20 }]} />
              <View style={[styles.wizHatBrimPurple, { backgroundColor: '#78350f' }]} />
            </View>
          )}

          {hairId === 'flower_wreath' && (
            <View style={styles.catEarsGroup}>
              <View style={[styles.catEarLPeak, { backgroundColor: '#f43f5e' }]} />
              <View style={[styles.catEarRPeak, { backgroundColor: '#38bdf8' }]} />
            </View>
          )}

          {hairId === 'party_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatConePurple, { backgroundColor: '#eab308' }]} />
            </View>
          )}

          {hairId === 'cyber_horns' && (
            <View style={styles.catEarsGroup}>
              <View style={[styles.catEarLPeak, { backgroundColor: '#ec4899' }]} />
              <View style={[styles.catEarRPeak, { backgroundColor: '#ec4899' }]} />
            </View>
          )}

          {hairId === 'top_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatConePurple, { backgroundColor: '#0f172a', height: 30 }]} />
              <View style={[styles.wizHatBrimPurple, { backgroundColor: '#ef4444', height: 6 }]} />
            </View>
          )}

          {hairId === 'santa_hat' && (
            <View style={styles.wizHatGroup}>
              <View style={[styles.wizHatConePurple, { backgroundColor: '#ef4444' }]} />
              <View style={[styles.wizHatBrimPurple, { backgroundColor: '#ffffff' }]} />
            </View>
          )}

          {hairId === 'valkyrie_wings' && (
            <View style={styles.vikingGroup}>
              <View style={[styles.vikingHornLeft, { backgroundColor: '#e2e8f0' }]} />
              <View style={styles.vikingDomeSteel} />
              <View style={[styles.vikingHornRight, { backgroundColor: '#e2e8f0' }]} />
            </View>
          )}
        </TouchableOpacity>

        {/* COMPANIONS (Yoldaşlar) */}
        {companionId !== 'companion_none' && (
          <View style={styles.companionWrapper}>
            {companionId === 'pixel_cat' && (
              <View style={styles.catPixelSprite}>
                <View style={styles.catEarL} />
                <View style={styles.catEarR} />
                <View style={styles.catHeadBody}>
                  <View style={styles.catEyeL} />
                  <View style={styles.catEyeR} />
                </View>
              </View>
            )}

            {companionId === 'tiny_robot' && (
              <View style={[styles.robotPixelSprite, styles.floatingCompanion]}>
                <View style={styles.robotHeadBody}>
                  <View style={styles.robotCyanVisor} />
                </View>
              </View>
            )}

            {companionId === 'tiny_dragon' && (
              <View style={styles.dragonPixelSprite}>
                <View style={styles.dragonHeadBody}>
                  <View style={styles.dragonEyeYellow} />
                </View>
              </View>
            )}

            {companionId === 'pixel_dog' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#eab308' }]}>
                  <View style={styles.dogCollarCyan} />
                </View>
              </View>
            )}

            {companionId === 'ghost_pet' && (
              <View style={[styles.robotPixelSprite, styles.floatingCompanion]}>
                <View style={[styles.robotHeadBody, { backgroundColor: '#f8fafc' }]}>
                  <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }} />
                </View>
              </View>
            )}

            {companionId === 'phoenix_bird' && (
              <View style={[styles.dragonPixelSprite, styles.floatingCompanion]}>
                <View style={[styles.dragonHeadBody, { backgroundColor: '#f97316' }]} />
              </View>
            )}

            {companionId === 'slime_pet' && (
              <View style={styles.slimeSprite}>
                <View style={styles.slimeBodyGreen} />
              </View>
            )}

            {companionId === 'baby_penguin' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ width: 10, height: 12, backgroundColor: '#ffffff', borderRadius: 4 }} />
                  <View style={{ position: 'absolute', bottom: 2, width: 4, height: 3, backgroundColor: '#f97316' }} />
                </View>
              </View>
            )}

            {companionId === 'owl_wise' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#78350f', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 2 }]}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    <View style={{ width: 6, height: 6, backgroundColor: '#facc15', borderRadius: 3 }} />
                    <View style={{ width: 6, height: 6, backgroundColor: '#facc15', borderRadius: 3 }} />
                  </View>
                </View>
              </View>
            )}

            {companionId === 'alien_blob' && (
              <View style={[styles.robotPixelSprite, styles.floatingCompanion]}>
                <View style={[styles.robotHeadBody, { backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    <View style={{ width: 3, height: 3, backgroundColor: '#06b6d4' }} />
                    <View style={{ width: 4, height: 4, backgroundColor: '#06b6d4' }} />
                    <View style={{ width: 3, height: 3, backgroundColor: '#06b6d4' }} />
                  </View>
                </View>
              </View>
            )}

            {companionId === 'golden_beetle' && (
              <View style={styles.slimeSprite}>
                <View style={[styles.slimeBodyGreen, { backgroundColor: '#eab308', borderWidth: 1.5, borderColor: '#78350f' }]}>
                  <View style={{ width: 2, height: 10, backgroundColor: '#78350f' }} />
                </View>
              </View>
            )}

            {companionId === 'corgi_pup' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#d97706', justifyContent: 'flex-end' }]}>
                  <View style={{ width: '100%', height: 6, backgroundColor: '#ffffff' }} />
                </View>
              </View>
            )}

            {companionId === 'fox_kitsune' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#ea580c' }]}>
                  <View style={{ position: 'absolute', right: -6, bottom: 0, width: 8, height: 12, backgroundColor: '#ffffff', borderRadius: 4 }} />
                </View>
              </View>
            )}

            {companionId === 'panda_mini' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={{ width: 4, height: 4, backgroundColor: '#0f172a', borderRadius: 2 }} />
                    <View style={{ width: 4, height: 4, backgroundColor: '#0f172a', borderRadius: 2 }} />
                  </View>
                </View>
              </View>
            )}

            {companionId === 'floating_skull' && (
              <View style={[styles.robotPixelSprite, styles.floatingCompanion]}>
                <View style={[styles.robotHeadBody, { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={{ width: 4, height: 5, backgroundColor: '#0f172a' }} />
                    <View style={{ width: 4, height: 5, backgroundColor: '#0f172a' }} />
                  </View>
                </View>
              </View>
            )}

            {companionId === 'fairy_pixie' && (
              <View style={[styles.robotPixelSprite, styles.floatingCompanion]}>
                <View style={[styles.robotHeadBody, { backgroundColor: '#f472b6', borderRadius: 10 }]}>
                  <View style={{ position: 'absolute', left: -6, width: 6, height: 12, backgroundColor: '#38bdf8', opacity: 0.8 }} />
                  <View style={{ position: 'absolute', right: -6, width: 6, height: 12, backgroundColor: '#38bdf8', opacity: 0.8 }} />
                </View>
              </View>
            )}

            {companionId === 'unicorn_foal' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#ec4899' }]}>
                  <View style={{ position: 'absolute', top: -8, left: 6, width: 4, height: 8, backgroundColor: '#fbbf24' }} />
                </View>
              </View>
            )}

            {companionId === 'bat_cute' && (
              <View style={[styles.robotPixelSprite, styles.floatingCompanion]}>
                <View style={[styles.robotHeadBody, { backgroundColor: '#581c87', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={{ position: 'absolute', left: -8, width: 8, height: 12, backgroundColor: '#3b0764', borderTopLeftRadius: 6 }} />
                  <View style={{ position: 'absolute', right: -8, width: 8, height: 12, backgroundColor: '#3b0764', borderTopRightRadius: 6 }} />
                </View>
              </View>
            )}

            {companionId === 'golden_goose' && (
              <View style={styles.catPixelSprite}>
                <View style={[styles.catHeadBody, { backgroundColor: '#facc15', borderWidth: 1.5, borderColor: '#ca8a04', justifyContent: 'center' }]}>
                  <View style={{ position: 'absolute', right: -4, width: 6, height: 4, backgroundColor: '#f97316' }} />
                </View>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

function PixelHeartEye() {
  return (
    <View style={{ width: 16, height: 16, position: 'relative' }}>
      <View style={{ position: 'absolute', top: 0, left: 1, width: 6, height: 5, backgroundColor: '#f43f5e', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
      <View style={{ position: 'absolute', top: 0, right: 1, width: 6, height: 5, backgroundColor: '#f43f5e', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
      <View style={{ position: 'absolute', top: 4, left: 0, width: 16, height: 6, backgroundColor: '#f43f5e' }} />
      <View style={{ position: 'absolute', top: 10, left: 2, width: 12, height: 3, backgroundColor: '#f43f5e' }} />
      <View style={{ position: 'absolute', top: 13, left: 6, width: 4, height: 3, backgroundColor: '#f43f5e' }} />
    </View>
  );
}

function PixelHypnoEye() {
  return (
    <View style={{ width: 16, height: 16, backgroundColor: '#10b981', borderWidth: 2, borderColor: '#0f172a', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 8, height: 8, borderWidth: 2, borderColor: '#0f172a', borderRadius: 4 }} />
    </View>
  );
}

function PixelFireEye() {
  return (
    <View style={{ width: 16, height: 20, position: 'relative', alignItems: 'center', top: -3 }}>
      <View style={{ position: 'absolute', top: 0, width: 4, height: 5, backgroundColor: '#fef08a' }} />
      <View style={{ position: 'absolute', top: 2, left: 2, width: 3, height: 4, backgroundColor: '#ea580c' }} />
      <View style={{ position: 'absolute', top: 5, width: 14, height: 12, backgroundColor: '#ea580c', borderWidth: 1.5, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 6, height: 6, backgroundColor: '#fef08a' }} />
      </View>
      <View style={{ position: 'absolute', top: -3, right: 0, width: 3, height: 3, backgroundColor: '#fef08a' }} />
    </View>
  );
}

function PixelDiamondEye() {
  return (
    <View style={{ width: 16, height: 16, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 0, width: 8, height: 3, backgroundColor: '#67e8f9' }} />
      <View style={{ position: 'absolute', top: 3, width: 16, height: 6, backgroundColor: '#38bdf8', borderWidth: 1, borderColor: '#1e293b' }}>
        <View style={{ position: 'absolute', top: 0, left: 1, width: 3, height: 3, backgroundColor: '#ffffff' }} />
      </View>
      <View style={{ position: 'absolute', top: 9, width: 10, height: 3, backgroundColor: '#0284c7' }} />
      <View style={{ position: 'absolute', top: 12, width: 4, height: 3, backgroundColor: '#0369a1' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 310,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: '#1e293b',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  // Arcade Background
  arcadeNeonBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090514',
  },
  neonLight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 6,
    opacity: 0.35,
  },
  pixelArcadeCabinet: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 44,
    height: 64,
    backgroundColor: '#1e1b4b',
    borderWidth: 2,
    borderColor: '#00ffff',
  },
  arcadeScreenGlow: {
    width: 32,
    height: 24,
    backgroundColor: '#ec4899',
    marginTop: 10,
    marginLeft: 4,
  },
  arcadeMarqueeTop: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 32,
    height: 5,
    backgroundColor: '#facc15',
  },

  // Cyber Background
  cyberGridBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
  },
  cyberBuildingLeft: {
    position: 'absolute',
    left: 15,
    bottom: 0,
    width: 50,
    height: 140,
    backgroundColor: '#1e293b',
    borderTopWidth: 3,
    borderColor: '#06b6d4',
  },
  cyberBuildingRight: {
    position: 'absolute',
    right: 15,
    bottom: 0,
    width: 60,
    height: 170,
    backgroundColor: '#1e293b',
    borderTopWidth: 3,
    borderColor: '#ec4899',
  },
  cyberMoon: {
    position: 'absolute',
    top: 30,
    right: 90,
    width: 36,
    height: 36,
    backgroundColor: '#f43f5e',
  },
  cyberWindowBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: '#a855f7',
    borderStyle: 'dashed',
    opacity: 0.3,
  },

  // Cabin Background
  cabinBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#78350f',
  },
  logBeam1: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#451a03',
  },
  logBeam2: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#451a03',
  },
  cabinWindow: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 54,
    height: 54,
    backgroundColor: '#0284c7',
    borderWidth: 3,
    borderColor: '#451a03',
  },
  cabinPineTree: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    width: 24,
    height: 36,
    backgroundColor: '#15803d',
  },
  cabinFireplace: {
    position: 'absolute',
    top: 20,
    right: 24,
    width: 50,
    height: 54,
    backgroundColor: '#1e293b',
    borderWidth: 3,
    borderColor: '#451a03',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  flameOuter: {
    width: 18,
    height: 24,
    backgroundColor: '#ea580c',
  },

  // Space Station Background
  spaceBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
  },
  planetBlue: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 48,
    height: 48,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#1d4ed8',
  },
  starDot1: {
    position: 'absolute',
    top: 40,
    left: 40,
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
  },
  starDot2: {
    position: 'absolute',
    top: 120,
    left: 80,
    width: 3,
    height: 3,
    backgroundColor: '#fde047',
  },
  starDot3: {
    position: 'absolute',
    bottom: 40,
    right: 60,
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
  },

  // Beach Sunset Background
  beachBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ea580c',
  },
  sunYellow: {
    position: 'absolute',
    top: 40,
    left: 140,
    width: 54,
    height: 54,
    backgroundColor: '#fef08a',
  },
  palmTreeLeft: {
    position: 'absolute',
    left: 10,
    bottom: 0,
    width: 18,
    height: 120,
    backgroundColor: '#78350f',
  },
  seaBlueLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#0284c7',
  },

  // Zen Garden Background
  zenBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fbcfe8',
  },
  sakuraTree: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 60,
    height: 140,
    backgroundColor: '#f43f5e',
  },
  bambooStalk1: {
    position: 'absolute',
    left: 20,
    bottom: 0,
    width: 8,
    height: 160,
    backgroundColor: '#15803d',
  },
  bambooStalk2: {
    position: 'absolute',
    left: 32,
    bottom: 0,
    width: 6,
    height: 120,
    backgroundColor: '#16a34a',
  },

  // Dungeon Castle Background
  dungeonBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#334155',
  },
  stoneBrickGrid: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1e293b',
  },
  torchLeft: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 10,
    height: 20,
    backgroundColor: '#78350f',
    alignItems: 'center',
  },
  torchRight: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 10,
    height: 20,
    backgroundColor: '#78350f',
    alignItems: 'center',
  },
  torchFlame: {
    width: 8,
    height: 10,
    backgroundColor: '#f97316',
    top: -8,
  },

  // Bubble
  bubbleContainer: {
    position: 'absolute',
    top: 14,
    zIndex: 10,
    width: '85%',
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: '#ffffff',
    borderColor: '#1e293b',
    borderWidth: 3,
    borderRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  bubbleText: {
    fontFamily: 'VT323',
    fontSize: 18,
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 18,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1e293b',
    top: -0.5,
  },

  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    top: 25,
  },
  habitusTouchArea: {
    alignItems: 'center',
    zIndex: 3,
  },

  // Body
  habitusBody: {
    width: 100,
    height: 100,
    borderRadius: 0,
    borderWidth: 4,
    borderColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
  },

  // Cyborg details
  cyborgCircuitLine1: {
    position: 'absolute',
    top: 10,
    left: 8,
    width: 32,
    height: 3,
    backgroundColor: '#06b6d4',
  },
  cyborgChestCore: {
    position: 'absolute',
    bottom: 22,
    left: 42,
    width: 10,
    height: 10,
    backgroundColor: '#06b6d4',
    borderWidth: 1.5,
    borderColor: '#1e293b',
  },

  // Golden details
  goldenShine1: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#ffffff',
  },
  goldenSparkle: {
    position: 'absolute',
    top: 30,
    left: 6,
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
  },

  // Phantom details
  phantomParticle1: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#c084fc',
  },
  phantomParticle2: {
    position: 'absolute',
    bottom: -6,
    left: -4,
    width: 6,
    height: 6,
    backgroundColor: '#a855f7',
  },

  // Fire Body
  fireSparkDot1: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 6,
    height: 6,
    backgroundColor: '#fef08a',
  },
  fireSparkDot2: {
    position: 'absolute',
    bottom: 8,
    right: 6,
    width: 6,
    height: 6,
    backgroundColor: '#f97316',
  },

  // Ice Body
  iceGlintLine: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 16,
    height: 3,
    backgroundColor: '#ffffff',
  },

  // Alien Body
  alienDotPattern: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    backgroundColor: '#15803d',
  },

  // Shadow Body
  shadowFogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a40',
  },

  // Eyes
  eyesWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 52,
    position: 'absolute',
    top: 28,
  },
  pixelEye: {
    width: 14,
    height: 14,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#ffffff',
    position: 'relative',
  },

  // Sunglasses
  sunglassesFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 68,
    height: 16,
    position: 'absolute',
    top: 26,
    zIndex: 5,
  },
  sunglassGlassLeft: {
    flex: 1,
    height: '100%',
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
    position: 'relative',
  },
  sunglassGlassRight: {
    flex: 1,
    height: '100%',
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
    position: 'relative',
  },
  sunglassGlareLine: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 3,
    backgroundColor: '#ffffff',
  },
  sunglassBridgeBar: {
    width: 6,
    height: 4,
    backgroundColor: '#1e293b',
  },

  // Monocle
  monocleFrame: {
    width: 16,
    height: 16,
    borderWidth: 3,
    borderColor: '#fbbf24',
    backgroundColor: '#06b6d430',
    position: 'relative',
  },
  monocleGlassGlint: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 3,
    height: 3,
    backgroundColor: '#ffffff',
  },
  monocleDanglingChain: {
    position: 'absolute',
    bottom: -10,
    right: -2,
    width: 3,
    height: 12,
    backgroundColor: '#fbbf24',
  },

  // Visor
  neonVisorFrame: {
    position: 'absolute',
    width: 76,
    height: 18,
    backgroundColor: '#ec4899',
    borderColor: '#1e293b',
    borderWidth: 3,
    top: 24,
    zIndex: 5,
    justifyContent: 'center',
  },
  visorScanlineCyan: {
    width: '100%',
    height: 3,
    backgroundColor: '#06b6d4',
  },

  // Laser Eyes
  laserBeamLeft: {
    position: 'absolute',
    left: -20,
    top: 3,
    width: 24,
    height: 4,
    backgroundColor: '#ef4444',
  },
  laserBeamRight: {
    position: 'absolute',
    right: -20,
    top: 3,
    width: 24,
    height: 4,
    backgroundColor: '#ef4444',
  },

  // Mouth
  pixelMouth: {
    width: 18,
    height: 4,
    backgroundColor: '#0f172a',
    position: 'absolute',
    top: 58,
  },

  // Outfit
  hoodieLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 38,
    backgroundColor: '#10b981',
    borderTopWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  hoodieDrawstringL: {
    position: 'absolute',
    top: 2,
    left: 32,
    width: 3,
    height: 14,
    backgroundColor: '#ffffff',
  },
  hoodieDrawstringR: {
    position: 'absolute',
    top: 2,
    right: 32,
    width: 3,
    height: 14,
    backgroundColor: '#ffffff',
  },
  hoodieCenterPocket: {
    position: 'absolute',
    bottom: 4,
    width: 36,
    height: 14,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  suitLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#1f2937',
    borderTopWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  suitShirtInner: {
    width: 18,
    height: 38,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  suitTieRed: {
    width: 6,
    height: 18,
    backgroundColor: '#dc2626',
    top: 2,
  },

  wizardLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#7c3aed',
    borderTopWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardHemGold: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 5,
    backgroundColor: '#fbbf24',
  },
  wizardStarIcon: {
    fontSize: 14,
    color: '#fcd34d',
    top: -2,
  },

  astroLayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#f8fafc',
    borderTopWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  astroChestPlate: {
    width: 32,
    height: 18,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  astroBadgeRedDot: {
    width: 4,
    height: 4,
    backgroundColor: '#ef4444',
  },
  astroBadgeBlueDot: {
    width: 4,
    height: 4,
    backgroundColor: '#3b82f6',
  },

  ninjaSashRed: {
    position: 'absolute',
    bottom: 8,
    width: '100%',
    height: 6,
    backgroundColor: '#dc2626',
  },
  armorGoldEmblem: {
    width: 14,
    height: 14,
    backgroundColor: '#fbbf24',
    top: 4,
  },
  hawaiiPatternDot1: {
    position: 'absolute',
    left: 10,
    top: 6,
    width: 8,
    height: 8,
    backgroundColor: '#ec4899',
  },
  hawaiiPatternDot2: {
    position: 'absolute',
    right: 10,
    top: 6,
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
  },
  heroChestSymbol: {
    width: 16,
    height: 16,
    backgroundColor: '#facc15',
    borderRadius: 8,
    top: 4,
  },
  kimonoObiYellow: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    height: 8,
    backgroundColor: '#fef08a',
  },

  // Hair Accessories
  mohawkHairGroup: {
    position: 'absolute',
    top: -26,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    zIndex: 6,
  },
  mohawkSpike1: {
    width: 10,
    height: 18,
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#1e293b',
  },
  mohawkSpike2: {
    width: 12,
    height: 28,
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#1e293b',
  },
  mohawkSpike3: {
    width: 12,
    height: 22,
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#1e293b',
  },

  pixelCrownGroup: {
    position: 'absolute',
    top: -28,
    zIndex: 6,
    alignItems: 'center',
  },
  crownMainBase: {
    width: 60,
    height: 24,
    backgroundColor: '#fbbf24',
    borderWidth: 3,
    borderColor: '#1e293b',
    position: 'relative',
  },
  crownTowerLeft: {
    position: 'absolute',
    top: -9,
    left: -3,
    width: 10,
    height: 10,
    backgroundColor: '#fbbf24',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  crownTowerCenter: {
    position: 'absolute',
    top: -14,
    left: 20,
    width: 14,
    height: 15,
    backgroundColor: '#fbbf24',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  crownTowerRight: {
    position: 'absolute',
    top: -9,
    right: -3,
    width: 10,
    height: 10,
    backgroundColor: '#fbbf24',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  crownRubyCenter: {
    position: 'absolute',
    top: 5,
    left: 23,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
  },

  pixelCapGroup: {
    position: 'absolute',
    top: -22,
    zIndex: 6,
    alignItems: 'center',
  },
  capDomeCyan: {
    width: 62,
    height: 22,
    backgroundColor: '#06b6d4',
    borderWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capLogoH: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
  },
  capBrimMagenta: {
    width: 76,
    height: 8,
    backgroundColor: '#ec4899',
    borderWidth: 3,
    borderColor: '#1e293b',
    top: -3,
  },

  ninjaBandGroup: {
    position: 'absolute',
    top: -16,
    width: 108,
    height: 16,
    backgroundColor: '#dc2626',
    borderWidth: 3,
    borderColor: '#1e293b',
    zIndex: 6,
  },
  ninjaBandStripe: {
    position: 'absolute',
    left: 44,
    top: 2,
    width: 20,
    height: 8,
    backgroundColor: '#9ca3af',
  },
  ninjaBandTails: {
    position: 'absolute',
    right: -12,
    top: 2,
    width: 10,
    height: 24,
    backgroundColor: '#dc2626',
  },

  catEarsGroup: {
    position: 'absolute',
    top: -22,
    width: 90,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 6,
  },
  catEarLPeak: {
    width: 18,
    height: 20,
    backgroundColor: '#ec4899',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  catEarRPeak: {
    width: 18,
    height: 20,
    backgroundColor: '#ec4899',
    borderWidth: 3,
    borderColor: '#1e293b',
  },

  vikingGroup: {
    position: 'absolute',
    top: -26,
    alignItems: 'center',
    zIndex: 6,
  },
  vikingDomeSteel: {
    width: 70,
    height: 22,
    backgroundColor: '#9ca3af',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  vikingHornLeft: {
    position: 'absolute',
    left: -10,
    top: -6,
    width: 12,
    height: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  vikingHornRight: {
    position: 'absolute',
    right: -10,
    top: -6,
    width: 12,
    height: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  wizHatGroup: {
    position: 'absolute',
    top: -36,
    alignItems: 'center',
    zIndex: 6,
  },
  wizHatConePurple: {
    width: 36,
    height: 32,
    backgroundColor: '#8b5cf6',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  wizHatBrimPurple: {
    width: 80,
    height: 10,
    backgroundColor: '#6d28d9',
    borderWidth: 3,
    borderColor: '#1e293b',
    top: -3,
  },

  headphonesGroup: {
    position: 'absolute',
    top: -20,
    width: 114,
    height: 48,
    alignItems: 'center',
    zIndex: 6,
  },
  headphonesArch: {
    width: 100,
    height: 20,
    borderTopWidth: 5,
    borderColor: '#06b6d4',
  },
  headphonesCupL: {
    position: 'absolute',
    left: 2,
    top: 14,
    width: 14,
    height: 28,
    backgroundColor: '#ec4899',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  headphonesCupR: {
    position: 'absolute',
    right: 2,
    top: 14,
    width: 14,
    height: 28,
    backgroundColor: '#ec4899',
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  // Vehicles
  vehicleWrapper: {
    position: 'absolute',
    left: -125,
    bottom: -10,
    zIndex: 1,
  },
  skateWrapper: {
    alignItems: 'center',
  },
  skateDeckBody: {
    width: 110,
    height: 18,
    backgroundColor: '#d97706',
    borderWidth: 3,
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skateFlameGraphic1: {
    width: 24,
    height: 8,
    backgroundColor: '#ef4444',
  },
  skateWheelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
    top: -3,
  },
  skateWheelBlock: {
    width: 14,
    height: 14,
    backgroundColor: '#1e293b',
  },

  carWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  carCabinTop: {
    width: 50,
    height: 22,
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  carBodyRed: {
    width: 125,
    height: 38,
    backgroundColor: '#dc2626',
    borderWidth: 4,
    borderColor: '#1e293b',
    position: 'relative',
  },
  carHeadlightYellow: {
    position: 'absolute',
    right: 4,
    top: 8,
    width: 10,
    height: 10,
    backgroundColor: '#fef08a',
  },
  carWheelFront: {
    position: 'absolute',
    bottom: -10,
    right: 18,
    width: 22,
    height: 22,
    backgroundColor: '#1e293b',
  },
  carWheelBack: {
    position: 'absolute',
    bottom: -10,
    left: 18,
    width: 22,
    height: 22,
    backgroundColor: '#1e293b',
  },

  hoverWrapper: {
    alignItems: 'center',
  },
  hoverBoardBody: {
    width: 115,
    height: 20,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverNeonStripe: {
    width: 70,
    height: 5,
    backgroundColor: '#06b6d4',
  },
  hoverThrusterGlow: {
    width: 40,
    height: 10,
    backgroundColor: '#06b6d4',
  },

  carpetWrapper: {
    alignItems: 'center',
  },
  carpetBody: {
    width: 120,
    height: 22,
    backgroundColor: '#a855f7',
    borderWidth: 3,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carpetStripe: {
    width: 80,
    height: 6,
    backgroundColor: '#fbbf24',
  },

  raftWrapper: {
    alignItems: 'center',
  },
  bambooLogGroup: {
    width: 115,
    height: 22,
    backgroundColor: '#84cc16',
    borderWidth: 3,
    borderColor: '#3f6212',
  },

  scooterWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  scooterBody: {
    width: 100,
    height: 28,
    backgroundColor: '#eab308',
    borderWidth: 3,
    borderColor: '#1e293b',
  },
  scooterWheelFront: {
    position: 'absolute',
    right: 6,
    bottom: -8,
    width: 20,
    height: 20,
    backgroundColor: '#1e293b',
  },
  scooterWheelBack: {
    position: 'absolute',
    left: 6,
    bottom: -8,
    width: 20,
    height: 20,
    backgroundColor: '#1e293b',
  },

  // Companions
  companionWrapper: {
    position: 'absolute',
    right: -60,
    bottom: -2,
    zIndex: 2,
  },
  catPixelSprite: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  catEarL: {
    position: 'absolute',
    top: 0,
    left: 4,
    width: 10,
    height: 10,
    backgroundColor: '#ea580c',
  },
  catEarR: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 10,
    height: 10,
    backgroundColor: '#ea580c',
  },
  catHeadBody: {
    width: 38,
    height: 30,
    backgroundColor: '#f97316',
    borderWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEyeL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 6,
    height: 6,
    backgroundColor: '#0f172a',
  },
  catEyeR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    backgroundColor: '#0f172a',
  },

  dogCollarCyan: {
    position: 'absolute',
    bottom: 2,
    width: '100%',
    height: 5,
    backgroundColor: '#06b6d4',
  },

  robotPixelSprite: {
    width: 42,
    height: 46,
    alignItems: 'center',
  },
  floatingCompanion: {
    bottom: 25,
  },
  robotHeadBody: {
    width: 34,
    height: 30,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotCyanVisor: {
    width: 22,
    height: 10,
    backgroundColor: '#06b6d4',
  },

  dragonPixelSprite: {
    width: 46,
    height: 44,
    alignItems: 'center',
    position: 'relative',
  },
  dragonHeadBody: {
    width: 38,
    height: 32,
    backgroundColor: '#ef4444',
    borderWidth: 3,
    borderColor: '#1e293b',
    position: 'relative',
    alignItems: 'center',
  },
  dragonEyeYellow: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 6,
    height: 6,
    backgroundColor: '#fef08a',
  },

  slimeSprite: {
    width: 36,
    height: 30,
    alignItems: 'center',
  },
  slimeBodyGreen: {
    width: 36,
    height: 28,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#1e293b',
    borderRadius: 8,
  },
});
