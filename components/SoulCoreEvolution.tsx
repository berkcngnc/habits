import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

/* ── Evrim Katmanları ──
 * Tier 1  (Lv 1–10):  Sönük, beyaz-gri bir nokta
 * Tier 2  (Lv 11–30): Mavi parlayan bir küre
 * Tier 3  (Lv 31–60): Mor, enerji dalgaları saçan bir çekirdek
 * Tier 4  (Lv 61+):   Altın sarısı, devasa bir enerji kaynağı
 */

interface SoulCoreEvolutionProps {
  level: number;
  size?: number;
  isFocused?: boolean;
}

function getTierPalette(level: number) {
  let tier = 1;
  let s = 40; // saturation
  let l = 60; // lightness
  
  if (level >= 61) { tier = 4; s = 90; l = 50; }
  else if (level >= 31) { tier = 3; s = 80; l = 55; }
  else if (level >= 11) { tier = 2; s = 65; l = 55; }

  // Her seviyede farklı bir renk elde etmek için Hue (renk tonu) seviye ile değişir.
  const h = (level * 25) % 360; 

  return {
    tier,
    core: `hsl(${h}, ${s}%, ${l}%)`,
    glow: `hsla(${h}, ${Math.min(s + 10, 100)}%, ${l}%, 0.50)`,
    aura: `hsla(${h}, ${s}%, ${l}%, 0.15)`,
    ring: `hsla(${h}, ${Math.min(s + 15, 100)}%, ${Math.min(l + 10, 100)}%, 0.35)`,
    particle: `hsla(${h}, 100%, 80%, 0.85)`,
    accent: `hsl(${h}, ${Math.min(s + 15, 100)}%, ${Math.min(l + 5, 100)}%)`,
  };
}

// ── Optimized animated ring ──
function AnimatedRing({
  size,
  color,
  rotation,
  dashed,
  opacity: ringOpacity = 0.4,
  margin = 6,
}: {
  size: number;
  color: string;
  rotation: SharedValue<number>;
  dashed?: boolean;
  opacity?: number;
  margin?: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        {
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: color,
          borderStyle: dashed ? 'dashed' : 'dotted',
          opacity: ringOpacity,
          margin,
        },
        style,
      ]}
    />
  );
}

export default function SoulCoreEvolution({
  level,
  size = 260,
  isFocused = true,
}: SoulCoreEvolutionProps) {
  const palette = useMemo(() => getTierPalette(level), [level]);
  const halfSize = size / 2;

  // Çekirdek boyutları
  const coreRatio = palette.tier === 1 ? 0.30
    : palette.tier === 2 ? 0.38
    : palette.tier === 3 ? 0.44
    : 0.50;
  const coreSize = size * coreRatio;

  // Aura (arka plan glow)
  const auraRatio = palette.tier === 1 ? 0.60
    : palette.tier === 2 ? 0.75
    : palette.tier === 3 ? 0.85
    : 0.95;
  const auraSize = size * auraRatio;

  // Orbit ring boyutları
  const outerRingSize = size * 0.9;
  const innerRingSize = size * 0.65;

  // Parçacık yörüngesi ring ile tam hizalanıyor
  const outerParticleRadius = outerRingSize / 2;
  const innerParticleRadius = innerRingSize / 2;

  const breathe = useSharedValue(1);
  const float = useSharedValue(0);
  const glowPulse = useSharedValue(0.4);
  const rotation = useSharedValue(0);
  const rotationReverse = useSharedValue(0);
  const waveScale = useSharedValue(0.5);
  const waveOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (!isFocused) {
      cancelAnimation(breathe);
      cancelAnimation(float);
      cancelAnimation(glowPulse);
      cancelAnimation(rotation);
      cancelAnimation(rotationReverse);
      cancelAnimation(waveScale);
      cancelAnimation(waveOpacity);
      return;
    }

    breathe.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );

    float.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(5, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1, true,
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 24000, easing: Easing.linear }),
      -1, false,
    );

    rotationReverse.value = withRepeat(
      withTiming(-360, { duration: 32000, easing: Easing.linear }),
      -1, false,
    );

    if (palette.tier >= 3) {
      waveScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 3500, easing: Easing.out(Easing.quad) }),
          withTiming(0.5, { duration: 10, easing: Easing.linear }),
        ),
        -1, false,
      );
      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 3500, easing: Easing.out(Easing.quad) }),
          withTiming(0.5, { duration: 10, easing: Easing.linear }),
        ),
        -1, false,
      );
    }

    // Cancel every running worklet on unmount/effect re-run so a stats-tab
    // teardown doesn't leave 7 infinite animations spinning on the UI thread.
    return () => {
      cancelAnimation(breathe);
      cancelAnimation(float);
      cancelAnimation(glowPulse);
      cancelAnimation(rotation);
      cancelAnimation(rotationReverse);
      cancelAnimation(waveScale);
      cancelAnimation(waveOpacity);
    };
  }, [isFocused, palette.tier]);

  const floatingCore = useAnimatedStyle(() => ({
    transform: [
      { translateY: float.value },
      { scale: breathe.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
    transform: [{ scale: breathe.value * 1.05 }],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0.3, 0.8], [0.1, 0.3]),
    transform: [{ scale: breathe.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  const particleOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const reverseOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationReverse.value}deg` }],
  }));

  const particleCountOuter = palette.tier === 1 ? 0 : palette.tier === 2 ? 4 : palette.tier === 3 ? 6 : 8;
  const particleCountInner = palette.tier >= 3 ? 4 : 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* ── Soft Arka Plan Aura ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.absoluteCenter,
          {
            width: auraSize,
            height: auraSize,
            borderRadius: 999,
            backgroundColor: palette.aura,
          },
          outerGlowStyle,
        ]}
      />

      {/* ── Enerji Dalgaları (Tier 3+) ── */}
      {palette.tier >= 3 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.absoluteCenter,
            {
              width: coreSize * 2,
              height: coreSize * 2,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: palette.accent,
            },
            waveStyle,
          ]}
        />
      )}

      {/* ── Dış Yörünge Çizgisi (Tier 2+) ── */}
      {palette.tier >= 2 && (
        <AnimatedRing
          size={outerRingSize}
          color={palette.ring}
          rotation={rotation}
          dashed
          opacity={0.4}
          margin={0}
        />
      )}

      {/* ── İç Yörünge Çizgisi (Tier 3+) ── */}
      {palette.tier >= 3 && (
        <AnimatedRing
          size={innerRingSize}
          color={palette.accent}
          rotation={rotationReverse}
          dashed
          opacity={0.3}
          margin={0}
        />
      )}

      {/* ── Dış Parçacıklar ── */}
      {particleCountOuter > 0 && (
        <Animated.View pointerEvents="none" style={[styles.absoluteCenter, particleOrbitStyle, { width: outerRingSize, height: outerRingSize }]}>
          {Array.from({ length: particleCountOuter }).map((_, i) => {
            const angle = (i * 360) / particleCountOuter;
            const px = outerParticleRadius * Math.cos((angle * Math.PI) / 180);
            const py = outerParticleRadius * Math.sin((angle * Math.PI) / 180);
            return (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: palette.particle,
                    shadowColor: palette.accent,
                    transform: [{ translateX: px }, { translateY: py }],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      )}

      {/* ── İç Parçacıklar (Tier 3+) ── */}
      {particleCountInner > 0 && (
        <Animated.View pointerEvents="none" style={[styles.absoluteCenter, reverseOrbitStyle, { width: innerRingSize, height: innerRingSize }]}>
          {Array.from({ length: particleCountInner }).map((_, i) => {
            const angle = (i * 360) / particleCountInner;
            const px = innerParticleRadius * Math.cos((angle * Math.PI) / 180);
            const py = innerParticleRadius * Math.sin((angle * Math.PI) / 180);
            return (
              <View
                key={i}
                style={[
                  styles.particle,
                  {
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: '#ffffff',
                    shadowColor: palette.accent,
                    transform: [{ translateX: px }, { translateY: py }],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      )}

      {/* ── Merkez Çekirdek Glow Katmanı ── */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.absoluteCenter,
          {
            width: coreSize * 1.4,
            height: coreSize * 1.4,
            borderRadius: 999,
            backgroundColor: palette.glow,
          },
          glowStyle,
        ]}
      />

      {/* ── Ana Çekirdek Küre ── */}
      <Animated.View style={[styles.absoluteCenter, floatingCore, { width: coreSize, height: coreSize }]}>
        <View style={styles.coreBase}>
          {/* En Dış Katman (Taban) */}
          <View style={[StyleSheet.absoluteFillObject, { borderRadius: 999, backgroundColor: palette.core, opacity: 0.9 }]} />
          
          {/* Katman 2: Geçiş */}
          <View style={[styles.absoluteCenter, { width: '80%', height: '80%', borderRadius: 999, backgroundColor: palette.accent, opacity: 0.8 }]} />
          
          {/* Katman 3: Parlak İç */}
          <View style={[styles.absoluteCenter, { width: '50%', height: '50%', borderRadius: 999, backgroundColor: palette.particle, opacity: 0.9 }]} />
          
          {/* Katman 4: Merkez Işık Noktası */}
          <View style={[styles.absoluteCenter, { width: '20%', height: '20%', borderRadius: 999, backgroundColor: '#ffffff', shadowColor: '#ffffff', shadowOpacity: 1, shadowRadius: 10, elevation: 5 }]} />
        </View>
      </Animated.View>

      {/* ── Yere Düşen Zemin Gölgesi ── */}
      <View
        pointerEvents="none"
        style={[
          styles.groundShadow,
          {
            width: coreSize * 1.2,
            height: coreSize * 0.2,
            bottom: size * 0.08,
            backgroundColor: palette.glow,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreBase: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },
  groundShadow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.4,
    transform: [{ scaleY: 0.4 }],
  },
});
