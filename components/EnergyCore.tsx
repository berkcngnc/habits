import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

interface EnergyCoreProps {
  level: number;
  size?: number;
  isFocused?: boolean;
}

export default function EnergyCore({ level, size = 180, isFocused = true }: EnergyCoreProps) {
  // ── Boyutlama ──
  const baseCoreSize = Math.min(size * 0.62, size * 0.30 + level * 1.4);
  const halfSize = size / 2;
  const particleRadius = halfSize - 12;

  // ── İki tonlu palet (sıcak çekirdek + soğuk kenar) ──
  const hueWarm = (200 + level * 15) % 360;
  const hueCool = (hueWarm + 40) % 360;

  const baseColor = `hsl(${hueWarm}, 100%, 55%)`;
  const glowColor = `hsl(${hueWarm}, 100%, 75%)`;
  const edgeColor = `hsl(${hueCool}, 90%, 50%)`;
  const deepColor = `hsl(${hueWarm}, 100%, 32%)`;

  // ── Evrim basamakları ──
  const hasInnerSpark = level >= 5;
  const hasOuterRing = level >= 10;
  const hasSatellite = level >= 15;
  const hasSecondAura = level >= 20;
  const hasInnerRing = level >= 25;
  const hasStarburst = level >= 30;
  const hasShimmer = level >= 40;
  const hasFacets = level >= 50;
  const hasOuterHalo = level >= 75;
  const hasPulseWave = level >= 100;

  // Yörünge parçacıkları (mevcut mantık)
  const particleCount = Math.min(30, Math.floor((level - 1) / 3));

  // ── Animasyon shared values ──
  const pulseA = useSharedValue(1);   // çekirdek nefesi
  const pulseB = useSharedValue(1);   // halo nefesi (faz farklı)
  const rotation = useSharedValue(0);
  const rotationFast = useSharedValue(0);
  const rotationSlow = useSharedValue(0);
  const waveProgress = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(pulseA);
      cancelAnimation(pulseB);
      cancelAnimation(rotation);
      cancelAnimation(rotationFast);
      cancelAnimation(rotationSlow);
      cancelAnimation(waveProgress);
      cancelAnimation(shimmer);
      return;
    }

    pulseA.value = withRepeat(
      withSequence(
        withTiming(1.14, { duration: 1900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.00, { duration: 1900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    pulseB.value = withRepeat(
      withSequence(
        withTiming(1.10, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 16000, easing: Easing.linear }),
      -1,
      false,
    );

    rotationFast.value = withRepeat(
      withTiming(360, { duration: 7200, easing: Easing.linear }),
      -1,
      false,
    );

    rotationSlow.value = withRepeat(
      withTiming(360, { duration: 32000, easing: Easing.linear }),
      -1,
      false,
    );

    waveProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 1, easing: Easing.linear }),
      ),
      -1,
      false,
    );

    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [isFocused]);

  // ── Animated stiller (UI thread) ──
  const coreBreath = useAnimatedStyle(() => ({
    transform: [{ scale: pulseA.value }],
    shadowRadius: 22 * pulseA.value,
  }));

  const ambientBreath = useAnimatedStyle(() => ({
    transform: [{ scale: pulseA.value }],
  }));

  const haloBreath = useAnimatedStyle(() => ({
    transform: [{ scale: pulseB.value }],
    opacity: 0.10 + (pulseB.value - 0.94) * 0.6,
  }));

  const orbitFwd = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const orbitRev = useAnimatedStyle(() => ({
    transform: [{ rotate: `-${rotation.value * 1.4}deg` }],
  }));

  const orbitVerySlow = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationSlow.value * 0.5}deg` }],
  }));

  const orbitFast = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationFast.value}deg` }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.55 + waveProgress.value * 0.85 }],
    opacity: 0.55 * (1 - waveProgress.value),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.10 + shimmer.value * 0.32,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* ── Yere düşen yumuşak gölge (yüzeyden kalkıklık) ── */}
      <View
        pointerEvents="none"
        style={[
          styles.groundShadow,
          {
            width: size * 0.7,
            height: size * 0.16,
            bottom: -size * 0.03,
          },
        ]}
      />

      {/* ── L100+: Genişleyen pulse dalgası ── */}
      {hasPulseWave && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseWave,
            {
              width: size * 0.95,
              height: size * 0.95,
              borderColor: glowColor,
            },
            waveStyle,
          ]}
        />
      )}

      {/* ── L75+: Dış conic halo (yavaş ters dönüş) ── */}
      {hasOuterHalo && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.outerHalo,
            { borderColor: edgeColor },
            orbitVerySlow,
          ]}
        />
      )}

      {/* ── L10+: Dış parlak ring ── */}
      {hasOuterRing && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.outerRing,
            { borderColor: glowColor },
            orbitFwd,
          ]}
        />
      )}

      {/* ── L20+: İkinci aura (faz farklı) ── */}
      {hasSecondAura && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.secondAura,
            {
              width: size * 0.92,
              height: size * 0.92,
              backgroundColor: edgeColor,
            },
            haloBreath,
          ]}
        />
      )}

      {/* ── Ambient çekirdek halesi ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ambient,
          { width: size * 0.85, height: size * 0.85, backgroundColor: baseColor },
          ambientBreath,
        ]}
      />

      {/* ── L30+: Starburst ışınları ── */}
      {hasStarburst && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.center, orbitVerySlow]}
        >
          {[0, 45, 90, 135].map(angle => (
            <View
              key={angle}
              style={[
                styles.ray,
                {
                  width: size * 0.95,
                  backgroundColor: glowColor,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}

      {/* ── L25+: İç ters-dönen ring ── */}
      {hasInnerRing && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            styles.innerRing,
            { borderColor: baseColor },
            orbitRev,
          ]}
        />
      )}

      {/* ── Yörünge parçacıkları ── */}
      {particleCount > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.center, orbitFwd]}
        >
          {Array.from({ length: particleCount }).map((_, i) => {
            const angle = (i * 360) / particleCount;
            const px = particleRadius * Math.cos((angle * Math.PI) / 180);
            const py = particleRadius * Math.sin((angle * Math.PI) / 180);
            return (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    backgroundColor: glowColor,
                    transform: [{ translateX: px }, { translateY: py }],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      )}

      {/* ── L15+: Parlak uydu (hızlı ayrı yörünge) ── */}
      {hasSatellite && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.center, orbitFast]}
        >
          <View
            style={[
              styles.satellite,
              {
                shadowColor: glowColor,
                transform: [{ translateX: particleRadius - 2 }, { translateY: 0 }],
              },
            ]}
          />
        </Animated.View>
      )}

      {/* ── L40+: Prizmatik shimmer katmanı ── */}
      {hasShimmer && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              width: baseCoreSize * 1.18,
              height: baseCoreSize * 1.18,
              backgroundColor: edgeColor,
            },
            shimmerStyle,
          ]}
        />
      )}

      {/* ── ÇEKİRDEK KÜRE (3D illüzyonu için katmanlı) ── */}
      <Animated.View
        style={[
          styles.coreOuter,
          {
            width: baseCoreSize,
            height: baseCoreSize,
            backgroundColor: deepColor,
            shadowColor: glowColor,
          },
          coreBreath,
        ]}
      >
        {/* Ana renk katmanı */}
        <View
          pointerEvents="none"
          style={[styles.coreLayer1, { backgroundColor: baseColor }]}
        />
        {/* İç parlak çekirdek */}
        <View
          pointerEvents="none"
          style={[styles.coreLayer2, { backgroundColor: glowColor }]}
        />

        {/* L50+: Mücevher facetleri (3 diyagonal parlak streak) */}
        {hasFacets &&
          [0, 60, 120].map(angle => (
            <View
              key={angle}
              pointerEvents="none"
              style={[styles.facet, { transform: [{ rotate: `${angle}deg` }] }]}
            />
          ))}

        {/* Specular highlight (üst-sol ışık) */}
        <View pointerEvents="none" style={styles.specular} />

        {/* L5+: Merkez parıltı */}
        {hasInnerSpark && (
          <View pointerEvents="none" style={styles.spark} />
        )}

        {/* Rim light kenar */}
        <View pointerEvents="none" style={styles.rim} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Yere düşen oval gölge
  groundShadow: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    opacity: 0.55,
    transform: [{ scaleY: 0.45 }],
  },

  pulseWave: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
  },

  outerHalo: {
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.32,
    margin: 2,
  },

  outerRing: {
    borderRadius: 999,
    borderWidth: 1.5,
    opacity: 0.55,
    margin: 6,
    borderStyle: 'dotted',
  },

  innerRing: {
    borderRadius: 999,
    borderWidth: 1,
    opacity: 0.4,
    margin: 22,
    borderStyle: 'dashed',
  },

  secondAura: {
    position: 'absolute',
    borderRadius: 999,
  },

  ambient: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },

  ray: {
    position: 'absolute',
    height: 1.5,
    opacity: 0.22,
  },

  particle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 5,
    elevation: 5,
  },

  satellite: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 9,
    elevation: 9,
  },

  shimmer: {
    position: 'absolute',
    borderRadius: 999,
  },

  // Çekirdek kabuğu — gölge + en koyu temel renk
  coreOuter: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    elevation: 18,
  },

  // Orta katman: ana renk, küre içinden biraz küçük → kenarda koyu rim hissi
  coreLayer1: {
    position: 'absolute',
    top: '6%', left: '6%', right: '6%', bottom: '6%',
    borderRadius: 999,
  },

  // İç parlak çekirdek
  coreLayer2: {
    position: 'absolute',
    top: '24%', left: '24%', right: '24%', bottom: '24%',
    borderRadius: 999,
    opacity: 0.75,
  },

  // Mücevher facet (uzun ince oval, döndürüldüğünde star pattern)
  facet: {
    position: 'absolute',
    top: '12%', bottom: '12%',
    left: '44%', right: '44%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
  },

  // Specular highlight: üst-sol ışık parlaması
  specular: {
    position: 'absolute',
    top: '13%',
    left: '17%',
    width: '32%',
    height: '20%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    opacity: 0.85,
  },

  // Merkez beyaz parıltı (L5+)
  spark: {
    position: 'absolute',
    top: '40%', left: '40%', right: '40%', bottom: '40%',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    opacity: 0.9,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },

  // Rim light: kenarda ince beyaz halka (cam orb refraksiyonu)
  rim: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
});
