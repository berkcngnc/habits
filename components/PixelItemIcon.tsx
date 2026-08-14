import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface PixelItemIconProps {
  itemId: string;
  size?: number;
}

export default function PixelItemIcon({ itemId, size = 48 }: PixelItemIconProps) {
  const scale = size / 48;

  const renderIcon = () => {
    switch (itemId) {
      // ── BODIES ──
      case 'default_body':
        return <MiniBody color="#10b981" />;
      case 'cyborg_body':
        return <MiniBody color="#9ca3af" extra={<View style={styles.cyborgLine} />} />;
      case 'golden_body':
        return <MiniBody color="#eab308" extra={<View style={styles.goldGlint} />} />;
      case 'phantom_body':
        return <MiniBody color="#8b5cf6" extra={<View style={styles.purpleParticle} />} />;
      case 'fire_body':
        return <MiniBody color="#ea580c" extra={<View style={styles.fireSpark} />} />;
      case 'ice_body':
        return <MiniBody color="#38bdf8" extra={<View style={styles.iceGlint} />} />;
      case 'alien_body':
        return <MiniBody color="#22c55e" extra={<View style={styles.alienEye} />} />;
      case 'shadow_body':
        return <MiniBody color="#1e293b" extra={<View style={styles.redEyeDot} />} />;
      case 'candy_pink_body':
        return <MiniBody color="#ec4899" />;
      case 'neon_cyber_body':
        return <MiniBody color="#06b6d4" extra={<View style={styles.neonGridLine} />} />;
      case 'wooden_puppet_body':
        return <MiniBody color="#b45309" />;
      case 'poison_slime_body':
        return <MiniBody color="#84cc16" />;
      case 'galaxy_cosmic_body':
        return <MiniBody color="#6366f1" extra={<View style={styles.goldGlint} />} />;
      case 'magma_lava_body':
        return <MiniBody color="#dc2626" />;
      case 'hologram_blue_body':
        return <MiniBody color="#0284c7" extra={<View style={styles.cyanScanline} />} />;
      case 'bronze_warrior_body':
        return <MiniBody color="#d97706" />;
      case 'diamond_crystal_body':
        return <MiniBody color="#67e8f9" extra={<View style={styles.goldGlint} />} />;
      case 'steampunk_brass_body':
        return <MiniBody color="#ca8a04" />;
      case 'pastel_lavender_body':
        return <MiniBody color="#c084fc" />;
      case 'vampire_goth_body':
        return <MiniBody color="#991b1b" />;

      // ── HAIR & HEAD ──
      case 'default_hair':
      case 'mohawk_hair':
      case 'crown_hair':
      case 'cap_hair':
      case 'ninja_headband':
      case 'cat_ears':
      case 'viking_helmet':
      case 'wizard_hat':
      case 'headphones':
      case 'pirate_hat':
      case 'chef_hat':
      case 'afro_hair':
      case 'halo_angel':
      case 'detective_hat':
      case 'flower_wreath':
      case 'party_hat':
      case 'cyber_horns':
      case 'top_hat':
      case 'santa_hat':
      case 'valkyrie_wings':
        return <IconWrap><MiniHeadWithHat hairId={itemId} /></IconWrap>;

      // ── EYES ──
      case 'default_eyes':
      case 'cool_sunglasses':
      case 'monocle_eyes':
      case 'virtual_visor':
      case 'anime_sparkle_eyes':
      case '3d_glasses':
      case 'pirate_eyepatch':
      case 'glowing_laser_eyes':
      case 'heart_eyes':
      case 'hypno_spiral':
      case 'money_eyes':
      case 'star_glasses':
      case 'crying_tears':
      case 'pixel_goggles':
      case 'cyborg_target_eye':
      case 'cat_eye_glasses':
      case 'sleepy_eyes':
      case 'fire_eyes':
      case 'diamond_eyes':
      case 'blindfold_master':
        return <IconWrap><MiniHeadWithEyes eyesId={itemId} /></IconWrap>;

      // ── OUTFITS ──
      case 'default_outfit':
        return <IconWrap><Text style={styles.crossText}>✕</Text></IconWrap>;
      case 'casual_hoodie':
      case 'retro_suit':
      case 'wizard_robe':
      case 'astronaut_outfit':
      case 'ninja_gi':
      case 'royal_armor':
      case 'hawaiian_shirt':
      case 'superhero_cape':
      case 'kimono_outfit':
      case 'overalls_worker':
      case 'tracksuit_retro':
      case 'overcoat_detective':
      case 'doctor_coat':
      case 'pirate_coat':
      case 'cyberpunk_jacket':
      case 'pajamas_bear':
      case 'tuxedo_gold':
      case 'dino_onesie':
      case 'pharaoh_robe':
        return <IconWrap><MiniBodyWithOutfit outfitId={itemId} /></IconWrap>;

      // ── HOUSES ──
      case 'default_background':
        return <IconWrap><Text style={styles.crossText}>✕</Text></IconWrap>;
      case 'retro_arcade':
      case 'cyber_penthouse':
      case 'nature_cabin':
      case 'space_station':
      case 'beach_sunset':
      case 'zen_garden':
      case 'dungeon_castle':
      case 'cozy_library':
      case 'underwater_reef':
      case 'volcano_lair':
      case 'candy_kingdom':
      case 'graveyard_spooky':
      case 'disco_dancefloor':
      case 'cloud_palace':
      case 'matrix_digital':
      case 'desert_pyramids':
      case 'cyber_ramen_shop':
      case 'snowy_igloo':
      case 'gold_treasury':
        return <IconWrap><MiniHomeIcon homeId={itemId} /></IconWrap>;

      // ── VEHICLES ──
      case 'default_none':
        return <IconWrap><Text style={styles.crossText}>—</Text></IconWrap>;
      case 'pixel_skateboard':
      case 'retro_car':
      case 'hoverboard':
      case 'magic_carpet':
      case 'racing_kart':
      case 'bamboo_raft':
      case 'mecha_scooter':
      case 'flying_broom':
      case 'giant_mech_foot':
      case 'steam_locomotive':
      case 'ufo_saucer':
      case 'pirate_ship':
      case 'bmx_bike':
      case 'tank_mini':
      case 'submersible':
      case 'shopping_cart':
      case 'golden_chariot':
      case 'rocket_thruster':
      case 'cloud_nimbus':
        return <IconWrap><MiniVehicleIcon vehicleId={itemId} /></IconWrap>;

      // ── COMPANIONS ──
      case 'companion_none':
        return <IconWrap><Text style={styles.crossText}>—</Text></IconWrap>;
      case 'pixel_cat':
      case 'tiny_robot':
      case 'tiny_dragon':
      case 'pixel_dog':
      case 'ghost_pet':
      case 'phoenix_bird':
      case 'slime_pet':
      case 'baby_penguin':
      case 'owl_wise':
      case 'alien_blob':
      case 'golden_beetle':
      case 'corgi_pup':
      case 'fox_kitsune':
      case 'panda_mini':
      case 'floating_skull':
      case 'fairy_pixie':
      case 'unicorn_foal':
      case 'bat_cute':
      case 'golden_goose':
        return <IconWrap><MiniCompanionIcon companionId={itemId} /></IconWrap>;

      default:
        return <MiniBody color="#10b981" />;
    }
  };

  return (
    <View style={[styles.outerWrapper, { transform: [{ scale }] }]}>
      {renderIcon()}
    </View>
  );
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.iconContainer}>{children}</View>;
}

function MiniHeadWithHat({ hairId }: { hairId: string }) {
  const renderHat = () => {
    switch (hairId) {
      case 'mohawk_hair':
        return (
          <View style={{ position: 'absolute', top: -14, flexDirection: 'row', gap: 1 }}>
            <View style={{ width: 4, height: 10, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 6, height: 16, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 5, height: 12, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'crown_hair':
        return (
          <View style={{ position: 'absolute', top: -14, alignItems: 'center' }}>
            <View style={{ width: 28, height: 10, backgroundColor: '#fbbf24', borderWidth: 1.5, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ position: 'absolute', top: -4, left: -1, width: 5, height: 5, backgroundColor: '#fbbf24', borderWidth: 1, borderColor: '#1e293b' }} />
              <View style={{ position: 'absolute', top: -6, left: 10, width: 6, height: 7, backgroundColor: '#fbbf24', borderWidth: 1, borderColor: '#1e293b' }} />
              <View style={{ position: 'absolute', top: -4, right: -1, width: 5, height: 5, backgroundColor: '#fbbf24', borderWidth: 1, borderColor: '#1e293b' }} />
              <View style={{ width: 4, height: 4, backgroundColor: '#ef4444' }} />
            </View>
          </View>
        );
      case 'cap_hair':
        return (
          <View style={{ position: 'absolute', top: -12, alignItems: 'center' }}>
            <View style={{ width: 28, height: 10, backgroundColor: '#06b6d4', borderWidth: 1.5, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 4, height: 4, backgroundColor: '#ffffff' }} />
            </View>
            <View style={{ width: 34, height: 4, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b', top: -1 }} />
          </View>
        );
      case 'ninja_headband':
        return (
          <View style={{ position: 'absolute', top: -6, width: 34, height: 7, backgroundColor: '#dc2626', borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center' }}>
            <View style={{ marginLeft: 12, width: 8, height: 4, backgroundColor: '#9ca3af' }} />
            <View style={{ position: 'absolute', right: -6, top: 0, width: 5, height: 12, backgroundColor: '#dc2626' }} />
          </View>
        );
      case 'cat_ears':
        return (
          <View style={{ position: 'absolute', top: -12, width: 30, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: 8, height: 10, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 8, height: 10, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'viking_helmet':
        return (
          <View style={{ position: 'absolute', top: -14, alignItems: 'center' }}>
            <View style={{ width: 30, height: 10, backgroundColor: '#9ca3af', borderWidth: 1.5, borderColor: '#1e293b' }} />
            <View style={{ position: 'absolute', left: -5, top: -3, width: 6, height: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ position: 'absolute', right: -5, top: -3, width: 6, height: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'wizard_hat':
        return (
          <View style={{ position: 'absolute', top: -18, alignItems: 'center' }}>
            <View style={{ width: 16, height: 14, backgroundColor: '#8b5cf6', borderWidth: 1.5, borderColor: '#1e293b' }} />
            <View style={{ width: 34, height: 5, backgroundColor: '#6d28d9', borderWidth: 1, borderColor: '#1e293b', top: -1 }} />
          </View>
        );
      case 'headphones':
        return (
          <View style={{ position: 'absolute', top: -12, width: 34, height: 22, alignItems: 'center' }}>
            <View style={{ width: 28, height: 8, borderTopWidth: 3, borderColor: '#06b6d4' }} />
            <View style={{ position: 'absolute', left: 0, top: 6, width: 6, height: 14, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ position: 'absolute', right: 0, top: 6, width: 6, height: 14, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'pirate_hat':
        return (
          <View style={{ position: 'absolute', top: -14, alignItems: 'center' }}>
            <View style={{ width: 34, height: 10, backgroundColor: '#1e293b', borderWidth: 1.5, borderColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 4, height: 4, backgroundColor: '#ffffff' }} />
            </View>
          </View>
        );
      case 'chef_hat':
        return (
          <View style={{ position: 'absolute', top: -18, alignItems: 'center' }}>
            <View style={{ width: 20, height: 16, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#1e293b', borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
            <View style={{ width: 22, height: 4, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#1e293b', top: -1 }} />
          </View>
        );
      case 'afro_hair':
        return (
          <View style={{ position: 'absolute', top: -18, width: 36, height: 22, backgroundColor: '#451a03', borderRadius: 11, borderWidth: 1.5, borderColor: '#1e293b' }} />
        );
      case 'halo_angel':
        return (
          <View style={{ position: 'absolute', top: -14, width: 26, height: 5, backgroundColor: '#fde047', borderWidth: 1, borderColor: '#1e293b', borderRadius: 3 }} />
        );
      case 'detective_hat':
        return (
          <View style={{ position: 'absolute', top: -14, alignItems: 'center' }}>
            <View style={{ width: 22, height: 9, backgroundColor: '#78350f', borderWidth: 1.5, borderColor: '#1e293b' }} />
            <View style={{ width: 32, height: 4, backgroundColor: '#78350f', borderWidth: 1, borderColor: '#1e293b', top: -1 }} />
          </View>
        );
      case 'flower_wreath':
        return (
          <View style={{ position: 'absolute', top: -10, width: 30, flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#f43f5e', borderRadius: 3 }} />
            <View style={{ width: 6, height: 6, backgroundColor: '#38bdf8', borderRadius: 3 }} />
            <View style={{ width: 6, height: 6, backgroundColor: '#facc15', borderRadius: 3 }} />
          </View>
        );
      case 'party_hat':
        return (
          <View style={{ position: 'absolute', top: -16, alignItems: 'center' }}>
            <View style={{ width: 12, height: 14, backgroundColor: '#eab308', borderWidth: 1.5, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 3, height: 3, backgroundColor: '#ef4444' }} />
            </View>
          </View>
        );
      case 'cyber_horns':
        return (
          <View style={{ position: 'absolute', top: -12, width: 30, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: 6, height: 10, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 6, height: 10, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'top_hat':
        return (
          <View style={{ position: 'absolute', top: -18, alignItems: 'center' }}>
            <View style={{ width: 18, height: 14, backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#ef4444' }} />
            <View style={{ width: 30, height: 4, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', top: -1 }} />
          </View>
        );
      case 'santa_hat':
        return (
          <View style={{ position: 'absolute', top: -16, alignItems: 'center' }}>
            <View style={{ width: 16, height: 12, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#1e293b' }} />
            <View style={{ width: 28, height: 4, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#1e293b', top: -1 }} />
          </View>
        );
      case 'valkyrie_wings':
        return (
          <View style={{ position: 'absolute', top: -14, alignItems: 'center' }}>
            <View style={{ width: 26, height: 9, backgroundColor: '#9ca3af', borderWidth: 1.5, borderColor: '#1e293b' }} />
            <View style={{ position: 'absolute', left: -5, top: -4, width: 6, height: 12, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ position: 'absolute', right: -5, top: -4, width: 6, height: 12, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.miniBodyBox}>
      <View style={[styles.miniBody, { backgroundColor: '#10b981' }]}>
        <View style={styles.miniEyeRow}>
          <View style={styles.miniEye} />
          <View style={styles.miniEye} />
        </View>
        <View style={styles.miniMouth} />
        {renderHat()}
      </View>
    </View>
  );
}

function PixelMiniHeartEye() {
  return (
    <View style={{ width: 10, height: 10, position: 'relative' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 3, backgroundColor: '#f43f5e', borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: 4, height: 3, backgroundColor: '#f43f5e', borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: 2, left: 0, width: 10, height: 4, backgroundColor: '#f43f5e' }} />
      <View style={{ position: 'absolute', top: 6, left: 2, width: 6, height: 2, backgroundColor: '#f43f5e' }} />
      <View style={{ position: 'absolute', top: 8, left: 4, width: 2, height: 2, backgroundColor: '#f43f5e' }} />
    </View>
  );
}

function PixelMiniHypnoEye() {
  return (
    <View style={{ width: 10, height: 10, backgroundColor: '#10b981', borderWidth: 1.5, borderColor: '#0f172a', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 4, height: 4, borderWidth: 1, borderColor: '#0f172a', borderRadius: 2 }} />
    </View>
  );
}

function PixelMiniFireEye() {
  return (
    <View style={{ width: 10, height: 12, position: 'relative', alignItems: 'center', top: -1 }}>
      <View style={{ position: 'absolute', top: 0, width: 3, height: 3, backgroundColor: '#fef08a' }} />
      <View style={{ position: 'absolute', top: 3, width: 9, height: 8, backgroundColor: '#ea580c', borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 4, height: 4, backgroundColor: '#fef08a' }} />
      </View>
    </View>
  );
}

function PixelMiniDiamondEye() {
  return (
    <View style={{ width: 10, height: 10, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', top: 0, width: 5, height: 2, backgroundColor: '#67e8f9' }} />
      <View style={{ position: 'absolute', top: 2, width: 10, height: 4, backgroundColor: '#38bdf8', borderWidth: 1, borderColor: '#1e293b' }}>
        <View style={{ position: 'absolute', top: 0, left: 1, width: 2, height: 2, backgroundColor: '#ffffff' }} />
      </View>
      <View style={{ position: 'absolute', top: 6, width: 6, height: 2, backgroundColor: '#0284c7' }} />
      <View style={{ position: 'absolute', top: 8, width: 2, height: 2, backgroundColor: '#0369a1' }} />
    </View>
  );
}

function MiniHeadWithEyes({ eyesId }: { eyesId: string }) {
  const renderEyes = () => {
    switch (eyesId) {
      case 'cool_sunglasses':
        return (
          <View style={{ width: 28, height: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center' }}>
            <View style={{ width: 6, height: 2, backgroundColor: '#ffffff', marginLeft: 2 }} />
          </View>
        );
      case 'monocle_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderWidth: 1.5, borderColor: '#fbbf24', backgroundColor: '#06b6d440' }} />
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }} />
          </View>
        );
      case 'virtual_visor':
        return (
          <View style={{ width: 30, height: 9, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#1e293b', justifyContent: 'center' }}>
            <View style={{ width: '100%', height: 2, backgroundColor: '#06b6d4' }} />
          </View>
        );
      case 'anime_sparkle_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#f43f5e', justifyContent: 'flex-start' }}>
              <View style={{ width: 2, height: 2, backgroundColor: '#ffffff' }} />
            </View>
            <View style={{ width: 6, height: 6, backgroundColor: '#f43f5e', justifyContent: 'flex-start' }}>
              <View style={{ width: 2, height: 2, backgroundColor: '#ffffff' }} />
            </View>
          </View>
        );
      case '3d_glasses':
        return (
          <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <View style={{ width: 12, height: 8, backgroundColor: '#ef4444', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 12, height: 8, backgroundColor: '#3b82f6', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'pirate_eyepatch':
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#0f172a' }} />
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }} />
          </View>
        );
      case 'glowing_laser_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#ef4444' }}>
              <View style={{ position: 'absolute', left: -8, top: 2, width: 8, height: 2, backgroundColor: '#ef4444' }} />
            </View>
            <View style={{ width: 6, height: 6, backgroundColor: '#ef4444' }}>
              <View style={{ position: 'absolute', right: -8, top: 2, width: 8, height: 2, backgroundColor: '#ef4444' }} />
            </View>
          </View>
        );
      case 'heart_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <PixelMiniHeartEye />
            <PixelMiniHeartEye />
          </View>
        );
      case 'hypno_spiral':
        return (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <PixelMiniHypnoEye />
            <PixelMiniHypnoEye />
          </View>
        );
      case 'money_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#fef08a', top: -1 }}>$</Text>
            </View>
            <View style={{ width: 8, height: 8, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 6, fontWeight: 'bold', color: '#fef08a', top: -1 }}>$</Text>
            </View>
          </View>
        );
      case 'star_glasses':
        return (
          <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <View style={{ width: 12, height: 8, backgroundColor: '#facc15', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 12, height: 8, backgroundColor: '#facc15', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'crying_tears':
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }}>
              <View style={{ position: 'absolute', bottom: -5, width: 2, height: 4, backgroundColor: '#38bdf8' }} />
            </View>
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }}>
              <View style={{ position: 'absolute', bottom: -5, width: 2, height: 4, backgroundColor: '#38bdf8' }} />
            </View>
          </View>
        );
      case 'pixel_goggles':
        return (
          <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
            <View style={{ width: 12, height: 8, backgroundColor: '#ca8a04', borderWidth: 1, borderColor: '#1e293b' }} />
            <View style={{ width: 12, height: 8, backgroundColor: '#ca8a04', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'cyborg_target_eye':
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#dc2626' }} />
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }} />
          </View>
        );
      case 'cat_eye_glasses':
        return (
          <View style={{ width: 28, height: 7, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' }} />
        );
      case 'sleepy_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 6, height: 2, backgroundColor: '#0f172a' }} />
            <View style={{ width: 6, height: 2, backgroundColor: '#0f172a' }} />
          </View>
        );
      case 'fire_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <PixelMiniFireEye />
            <PixelMiniFireEye />
          </View>
        );
      case 'diamond_eyes':
        return (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <PixelMiniDiamondEye />
            <PixelMiniDiamondEye />
          </View>
        );
      case 'blindfold_master':
        return (
          <View style={{ width: 30, height: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#1e293b' }} />
        );
      default:
        return (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }} />
            <View style={{ width: 4, height: 4, backgroundColor: '#0f172a' }} />
          </View>
        );
    }
  };

  return (
    <View style={styles.miniBodyBox}>
      <View style={[styles.miniBody, { backgroundColor: '#10b981' }]}>
        {renderEyes()}
        <View style={styles.miniMouth} />
      </View>
    </View>
  );
}

function MiniCompanionIcon({ companionId }: { companionId: string }) {
  const renderPet = () => {
    switch (companionId) {
      case 'pixel_cat':
        return <View style={{ width: 18, height: 18, backgroundColor: '#f97316', borderRadius: 4 }} />;
      case 'tiny_robot':
        return <View style={{ width: 16, height: 16, backgroundColor: '#3b82f6', borderRadius: 2 }} />;
      case 'tiny_dragon':
        return <View style={{ width: 18, height: 18, backgroundColor: '#ef4444', borderTopRightRadius: 8 }} />;
      case 'pixel_dog':
        return <View style={{ width: 18, height: 18, backgroundColor: '#eab308', borderRadius: 5 }} />;
      case 'ghost_pet':
        return <View style={{ width: 16, height: 18, backgroundColor: '#f8fafc', borderTopLeftRadius: 8, borderTopRightRadius: 8 }} />;
      case 'phoenix_bird':
        return <View style={{ width: 18, height: 18, backgroundColor: '#f97316', borderRadius: 9 }} />;
      case 'slime_pet':
        return <View style={{ width: 18, height: 14, backgroundColor: '#10b981', borderTopLeftRadius: 9, borderTopRightRadius: 9 }} />;
      case 'baby_penguin':
        return <View style={{ width: 16, height: 18, backgroundColor: '#0f172a', borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 8, height: 10, backgroundColor: '#ffffff', borderRadius: 4 }} /></View>;
      case 'owl_wise':
        return <View style={{ width: 18, height: 18, backgroundColor: '#78350f', borderRadius: 9 }} />;
      case 'alien_blob':
        return <View style={{ width: 16, height: 16, backgroundColor: '#a855f7', borderRadius: 8 }} />;
      case 'golden_beetle':
        return <View style={{ width: 16, height: 14, backgroundColor: '#eab308', borderRadius: 7 }} />;
      case 'corgi_pup':
        return <View style={{ width: 18, height: 18, backgroundColor: '#d97706', borderRadius: 6 }} />;
      case 'fox_kitsune':
        return <View style={{ width: 18, height: 18, backgroundColor: '#ea580c', borderRadius: 6 }} />;
      case 'panda_mini':
        return <View style={{ width: 18, height: 18, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#0f172a', borderRadius: 9 }} />;
      case 'floating_skull':
        return <View style={{ width: 16, height: 16, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#0f172a' }} />;
      case 'fairy_pixie':
        return <View style={{ width: 16, height: 16, backgroundColor: '#f472b6', borderRadius: 8 }} />;
      case 'unicorn_foal':
        return <View style={{ width: 18, height: 18, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#ec4899', borderRadius: 6 }} />;
      case 'bat_cute':
        return <View style={{ width: 18, height: 14, backgroundColor: '#581c87', borderRadius: 7 }} />;
      case 'golden_goose':
        return <View style={{ width: 18, height: 18, backgroundColor: '#facc15', borderRadius: 9 }} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.petBox}>
      {renderPet()}
    </View>
  );
}

function MiniVehicleIcon({ vehicleId }: { vehicleId: string }) {
  const renderVehicle = () => {
    switch (vehicleId) {
      case 'pixel_skateboard':
        return (
          <View style={{ width: 28, height: 6, backgroundColor: '#d97706', borderRadius: 3, justifyContent: 'center' }}>
            <View style={{ width: 6, height: 2, backgroundColor: '#ea580c', marginLeft: 2 }} />
          </View>
        );
      case 'retro_car':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#dc2626', borderTopLeftRadius: 4, borderTopRightRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 14, height: 4, backgroundColor: '#38bdf8' }} />
          </View>
        );
      case 'hoverboard':
        return (
          <View style={{ width: 28, height: 6, backgroundColor: '#2563eb', borderRadius: 3, borderWidth: 1, borderColor: '#06b6d4' }} />
        );
      case 'magic_carpet':
        return (
          <View style={{ width: 28, height: 8, backgroundColor: '#a855f7', borderWidth: 1, borderColor: '#facc15' }} />
        );
      case 'racing_kart':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#10b981', borderRadius: 2 }} />
        );
      case 'bamboo_raft':
        return (
          <View style={{ width: 28, height: 8, backgroundColor: '#84cc16', borderWidth: 1, borderColor: '#4d7c0f' }} />
        );
      case 'mecha_scooter':
        return (
          <View style={{ width: 24, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#06b6d4' }} />
        );
      case 'flying_broom':
        return (
          <View style={{ width: 28, height: 4, backgroundColor: '#78350f', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', right: 0, width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: 2 }} />
          </View>
        );
      case 'giant_mech_foot':
        return (
          <View style={{ width: 26, height: 12, backgroundColor: '#475569', borderWidth: 1, borderColor: '#1e293b' }} />
        );
      case 'steam_locomotive':
        return (
          <View style={{ width: 28, height: 14, backgroundColor: '#1e293b', justifyContent: 'flex-start' }}>
            <View style={{ width: 4, height: 4, backgroundColor: '#64748b' }} />
          </View>
        );
      case 'ufo_saucer':
        return (
          <View style={{ width: 28, height: 10, backgroundColor: '#94a3b8', borderRadius: 5, alignItems: 'center' }}>
            <View style={{ width: 12, height: 5, backgroundColor: '#22c55e', borderRadius: 2.5 }} />
          </View>
        );
      case 'pirate_ship':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#78350f', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
        );
      case 'bmx_bike':
        return (
          <View style={{ width: 24, height: 12, borderBottomWidth: 2, borderColor: '#dc2626' }} />
        );
      case 'tank_mini':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#3f6212', borderWidth: 1, borderColor: '#1e293b' }} />
        );
      case 'submersible':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#eab308', borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#38bdf8', borderRadius: 3 }} />
          </View>
        );
      case 'shopping_cart':
        return (
          <View style={{ width: 24, height: 14, borderWidth: 1.5, borderColor: '#94a3b8' }} />
        );
      case 'golden_chariot':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#eab308', borderTopLeftRadius: 4 }} />
        );
      case 'rocket_thruster':
        return (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <View style={{ width: 8, height: 16, backgroundColor: '#ea580c', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            <View style={{ width: 8, height: 16, backgroundColor: '#ea580c', borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
          </View>
        );
      case 'cloud_nimbus':
        return (
          <View style={{ width: 28, height: 12, backgroundColor: '#fef08a', borderRadius: 6, borderWidth: 1, borderColor: '#facc15' }} />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.vehicleBox}>
      {renderVehicle()}
    </View>
  );
}

function MiniHomeIcon({ homeId }: { homeId: string }) {
  const renderHomeContent = () => {
    switch (homeId) {
      case 'retro_arcade':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#090514', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: 16, height: 22, backgroundColor: '#ec4899', borderWidth: 1, borderColor: '#06b6d4' }} />
          </View>
        );
      case 'cyber_penthouse':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#090514', justifyContent: 'flex-end', paddingBottom: 2 }]}>
            <View style={{ width: 10, height: 18, backgroundColor: '#06b6d4' }} />
          </View>
        );
      case 'nature_cabin':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#78350f', justifyContent: 'flex-end' }]}>
            <View style={{ width: 8, height: 8, backgroundColor: '#ef4444', alignSelf: 'center' }} />
          </View>
        );
      case 'space_station':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#090514', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: 12, height: 12, backgroundColor: '#0284c7', borderRadius: 6 }} />
          </View>
        );
      case 'beach_sunset':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#f97316', justifyContent: 'flex-end' }]}>
            <View style={{ width: '100%', height: 10, backgroundColor: '#0284c7' }} />
          </View>
        );
      case 'zen_garden':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#fbcfe8', justifyContent: 'flex-end' }]}>
            <View style={{ width: 14, height: 14, backgroundColor: '#f43f5e', borderRadius: 7 }} />
          </View>
        );
      case 'dungeon_castle':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#334155', justifyContent: 'center' }]}>
            <View style={{ width: 4, height: 4, backgroundColor: '#ef4444', marginLeft: 4 }} />
          </View>
        );
      case 'cozy_library':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#451a03', padding: 2 }]}>
            <View style={{ width: '100%', height: 6, backgroundColor: '#dc2626', marginBottom: 2 }} />
            <View style={{ width: '100%', height: 6, backgroundColor: '#2563eb' }} />
          </View>
        );
      case 'underwater_reef':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#0284c7', justifyContent: 'flex-end' }]}>
            <View style={{ width: '100%', height: 8, backgroundColor: '#ca8a04' }} />
          </View>
        );
      case 'volcano_lair':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#450a0a', justifyContent: 'flex-end' }]}>
            <View style={{ width: '100%', height: 10, backgroundColor: '#dc2626' }} />
          </View>
        );
      case 'candy_kingdom':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#fbcfe8', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: 12, height: 12, backgroundColor: '#ec4899', borderRadius: 6 }} />
          </View>
        );
      case 'graveyard_spooky':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#0f172a', justifyContent: 'flex-end' }]}>
            <View style={{ width: 8, height: 12, backgroundColor: '#94a3b8', borderTopLeftRadius: 4, borderTopRightRadius: 4, marginLeft: 4 }} />
          </View>
        );
      case 'disco_dancefloor':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#1e1b4b', justifyContent: 'flex-end' }]}>
            <View style={{ width: '100%', height: 12, backgroundColor: '#ec4899' }} />
          </View>
        );
      case 'cloud_palace':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#38bdf8', justifyContent: 'flex-end' }]}>
            <View style={{ width: '100%', height: 10, backgroundColor: '#ffffff', borderRadius: 5 }} />
          </View>
        );
      case 'matrix_digital':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: 2, height: '100%', backgroundColor: '#22c55e' }} />
          </View>
        );
      case 'desert_pyramids':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#f59e0b', justifyContent: 'flex-end', alignItems: 'center' }]}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#d97706' }} />
          </View>
        );
      case 'cyber_ramen_shop':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#090514', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{ width: 10, height: 14, backgroundColor: '#ef4444', borderRadius: 2 }} />
          </View>
        );
      case 'snowy_igloo':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#0f172a', justifyContent: 'flex-end' }]}>
            <View style={{ width: 18, height: 12, backgroundColor: '#f1f5f9', borderTopLeftRadius: 9, borderTopRightRadius: 9 }} />
          </View>
        );
      case 'gold_treasury':
        return (
          <View style={[styles.bgBox, { backgroundColor: '#78350f', justifyContent: 'flex-end' }]}>
            <View style={{ width: '100%', height: 10, backgroundColor: '#eab308' }} />
          </View>
        );
      default:
        return <View style={[styles.bgBox, { backgroundColor: '#334155' }]} />;
    }
  };

  return renderHomeContent();
}

function MiniBodyWithOutfit({ outfitId }: { outfitId: string }) {
  const renderOutfitLayer = () => {
    switch (outfitId) {
      case 'casual_hoodie':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#10b981', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ position: 'absolute', bottom: 2, width: 14, height: 6, backgroundColor: '#059669', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'retro_suit':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#1f2937', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 8, height: 18, backgroundColor: '#ffffff', alignItems: 'center' }}>
              <View style={{ width: 3, height: 8, backgroundColor: '#dc2626', top: 1 }} />
            </View>
          </View>
        );
      case 'wizard_robe':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#7c3aed', borderTopWidth: 1.5, borderColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 8, color: '#fcd34d', top: -1 }}>★</Text>
          </View>
        );
      case 'astronaut_outfit':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#f8fafc', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 14, height: 8, backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#1e293b' }} />
          </View>
        );
      case 'ninja_gi':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#0f172a', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ position: 'absolute', bottom: 4, width: '100%', height: 3, backgroundColor: '#dc2626' }} />
          </View>
        );
      case 'royal_armor':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#9ca3af', borderTopWidth: 2, borderColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 6, height: 6, backgroundColor: '#fbbf24' }} />
          </View>
        );
      case 'hawaiian_shirt':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#f59e0b', borderTopWidth: 1.5, borderColor: '#1e293b' }}>
            <View style={{ position: 'absolute', left: 4, top: 4, width: 4, height: 4, backgroundColor: '#ec4899' }} />
            <View style={{ position: 'absolute', right: 4, top: 4, width: 4, height: 4, backgroundColor: '#10b981' }} />
          </View>
        );
      case 'superhero_cape':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#ef4444', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 8, height: 8, backgroundColor: '#facc15', borderRadius: 4 }} />
          </View>
        );
      case 'kimono_outfit':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#ec4899', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ position: 'absolute', bottom: 4, width: '100%', height: 4, backgroundColor: '#fef08a' }} />
          </View>
        );
      case 'overalls_worker':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#2563eb', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 8, height: 14, backgroundColor: '#1d4ed8' }} />
          </View>
        );
      case 'tracksuit_retro':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#dc2626', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 2, height: 18, backgroundColor: '#ffffff' }} />
          </View>
        );
      case 'overcoat_detective':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#78350f', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 6, height: 18, backgroundColor: '#451a03' }} />
          </View>
        );
      case 'doctor_coat':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#ffffff', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 6, height: 18, backgroundColor: '#0284c7' }} />
          </View>
        );
      case 'pirate_coat':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#b91c1c', borderTopWidth: 1.5, borderColor: '#fbbf24', alignItems: 'center' }}>
            <View style={{ width: 6, height: 18, backgroundColor: '#1e293b' }} />
          </View>
        );
      case 'cyberpunk_jacket':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#0f172a', borderTopWidth: 2, borderColor: '#06b6d4' }} />
        );
      case 'pajamas_bear':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#fb7185', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ position: 'absolute', top: 3, width: 3, height: 3, backgroundColor: '#ffffff', borderRadius: 1.5 }} />
            <View style={{ position: 'absolute', top: 9, width: 3, height: 3, backgroundColor: '#ffffff', borderRadius: 1.5 }} />
          </View>
        );
      case 'tuxedo_gold':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#eab308', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 8, height: 18, backgroundColor: '#ffffff', alignItems: 'center' }}>
              <View style={{ width: 5, height: 3, backgroundColor: '#0f172a', top: 1 }} />
            </View>
          </View>
        );
      case 'dino_onesie':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#16a34a', borderTopWidth: 1.5, borderColor: '#1e293b', alignItems: 'center' }}>
            <View style={{ width: 14, height: 12, backgroundColor: '#86efac', borderRadius: 6, top: 2 }} />
          </View>
        );
      case 'pharaoh_robe':
        return (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, backgroundColor: '#f8fafc', borderTopWidth: 3, borderColor: '#facc15' }} />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.miniBodyBox}>
      <View style={[styles.miniBody, { backgroundColor: '#10b981' }]}>
        <View style={styles.miniEyeRow}>
          <View style={styles.miniEye} />
          <View style={styles.miniEye} />
        </View>
        <View style={styles.miniMouth} />
        {renderOutfitLayer()}
      </View>
    </View>
  );
}

function MiniBody({ color, extra }: { color: string; extra?: React.ReactNode }) {
  return (
    <View style={styles.miniBodyBox}>
      <View style={[styles.miniBody, { backgroundColor: color }]}>
        <View style={styles.miniEyeRow}>
          <View style={styles.miniEye} />
          <View style={styles.miniEye} />
        </View>
        <View style={styles.miniMouth} />
        {extra}
      </View>
    </View>
  );
}

function DualEye({ color }: { color: string }) {
  return (
    <View style={styles.eyePairContainer}>
      <View style={[styles.pixelEyeIcon, { backgroundColor: color }]} />
      <View style={[styles.pixelEyeIcon, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  miniBodyBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBody: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniEyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 16,
    top: -2,
  },
  miniEye: {
    width: 4,
    height: 4,
    backgroundColor: '#0f172a',
  },
  miniMouth: {
    width: 6,
    height: 2,
    backgroundColor: '#0f172a',
    top: 3,
  },

  cyborgLine: {
    position: 'absolute',
    left: 2,
    top: 4,
    width: 12,
    height: 2,
    backgroundColor: '#06b6d4',
  },
  goldGlint: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
  },
  purpleParticle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 4,
    height: 4,
    backgroundColor: '#c084fc',
  },
  fireSpark: {
    position: 'absolute',
    top: -2,
    left: 2,
    width: 4,
    height: 4,
    backgroundColor: '#fef08a',
  },
  iceGlint: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 4,
    height: 4,
    backgroundColor: '#ffffff',
  },
  alienEye: {
    position: 'absolute',
    top: 4,
    width: 6,
    height: 4,
    backgroundColor: '#000000',
  },
  redEyeDot: {
    position: 'absolute',
    top: 6,
    width: 14,
    height: 3,
    backgroundColor: '#ef4444',
  },
  neonGridLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#ec4899',
  },
  cyanScanline: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#38bdf8',
  },

  baldHead: {
    width: 28,
    height: 24,
    backgroundColor: '#e5e7eb',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  mohawkSpike: {
    width: 10,
    height: 22,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  crownBase: {
    width: 32,
    height: 16,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  capDome: {
    width: 30,
    height: 16,
    backgroundColor: '#06b6d4',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  ninjaBand: {
    width: 34,
    height: 10,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  catEarPeak: {
    width: 28,
    height: 14,
    backgroundColor: '#ec4899',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  vikingDome: {
    width: 28,
    height: 16,
    backgroundColor: '#9ca3af',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  wizHatCone: {
    width: 24,
    height: 22,
    backgroundColor: '#8b5cf6',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  headphoneBand: {
    width: 28,
    height: 20,
    borderTopWidth: 4,
    borderColor: '#06b6d4',
  },
  pirateHatBase: {
    width: 32,
    height: 16,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  chefHatBase: {
    width: 26,
    height: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  afroBase: {
    width: 30,
    height: 26,
    backgroundColor: '#451a03',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  haloRing: {
    width: 28,
    height: 8,
    backgroundColor: '#fde047',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  detectiveHatBase: {
    width: 32,
    height: 16,
    backgroundColor: '#78350f',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  flowerWreathBase: {
    width: 28,
    height: 14,
    backgroundColor: '#f43f5e',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  partyCone: {
    width: 18,
    height: 24,
    backgroundColor: '#eab308',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  cyberHornsPair: {
    width: 28,
    height: 16,
    backgroundColor: '#ec4899',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  topHatBase: {
    width: 26,
    height: 24,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  santaHatBase: {
    width: 28,
    height: 20,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  valkyrieBase: {
    width: 30,
    height: 20,
    backgroundColor: '#e2e8f0',
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  eyePairContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pixelEyeIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  sunglassBody: {
    width: 32,
    height: 10,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  monocleRing: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
    backgroundColor: '#06b6d440',
  },
  visorBody: {
    width: 34,
    height: 12,
    backgroundColor: '#ec4899',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  glasses3d: {
    width: 32,
    height: 10,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  eyepatchBox: {
    width: 14,
    height: 12,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  starGlassesBody: {
    width: 32,
    height: 12,
    backgroundColor: '#facc15',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  gogglesBody: {
    width: 32,
    height: 12,
    backgroundColor: '#ca8a04',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  catEyeGlassesBody: {
    width: 32,
    height: 10,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  blindfoldBody: {
    width: 34,
    height: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  crossText: {
    fontFamily: 'PressStart2P',
    fontSize: 14,
    color: '#9ca3af',
  },

  outfitBox: {
    width: 30,
    height: 24,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  bgBox: {
    width: 32,
    height: 26,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  vehicleBox: {
    width: 34,
    height: 14,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  petBox: {
    width: 24,
    height: 20,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
});
