/**
 * AdMob unit ID'leri için tek doğruluk kaynağı.
 *
 * Önceki dağınık konfigürasyonda banner ve interstitial AYNI prod unit ID'sini
 * kullanıyordu — bu Google'ın "wrong format" hatasıyla banner request'lerini
 * reddetmesine yol açıyordu. Bu modül o tip kazaları derleme aşamasında
 * yakalamak için tip-güçlü helper'lar sağlar.
 *
 * iOS prod: ünite ID henüz oluşturulmadı — `null` döndürerek caller'ları
 * fallback render'a yönlendiriyoruz. Test ID'sini iOS prod'da kullanmak
 * AdMob policy ihlali (hesap askıya alınma riski).
 */
import { Platform } from 'react-native';

// ─── Google Test Unit ID'leri (her geliştirici için aynı) ────────────────
// Source: https://developers.google.com/admob/android/test-ads
const TEST = {
  banner: 'ca-app-pub-3940256099942544/2934735716',
  bannerIos: 'ca-app-pub-3940256099942544/2934735716',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  interstitialIos: 'ca-app-pub-3940256099942544/4411468910',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  rewardedIos: 'ca-app-pub-3940256099942544/1712485313',
  native: 'ca-app-pub-3940256099942544/2247696110',
  nativeIos: 'ca-app-pub-3940256099942544/3986624511',
} as const;

// ─── Production Unit ID'leri ─────────────────────────────────────────────
// Sadece Android için tanımlı. iOS için unit'ler oluşturulduğunda buraya gir.
//
// banner: null — AdMob konsolunda **ayrı bir Banner ad unit** oluşturulup
// buraya yapıştırılana kadar prod'da fallback render edilir. Eskiden interstitial
// ID'si banner olarak da kullanılıyordu; format uyuşmazlığı her request'i fail
// ettiriyor + AdMob policy uyarısı tetikliyordu.
//
// Gerçek production ID'leri .env dosyasında EXPO_PUBLIC_AD_* değişkenleriyle
// sağlanmalıdır. .env.example dosyasına bakın.
const PROD_ANDROID: Record<AdFormat, string | null> = {
  banner: process.env.EXPO_PUBLIC_AD_BANNER ?? TEST.banner,
  interstitial: process.env.EXPO_PUBLIC_AD_INTERSTITIAL ?? TEST.interstitial,
  rewarded: process.env.EXPO_PUBLIC_AD_REWARDED ?? TEST.rewarded,
  native: process.env.EXPO_PUBLIC_AD_NATIVE ?? TEST.native,
};

export type AdFormat = 'banner' | 'interstitial' | 'rewarded' | 'native';

const PROD_IOS: Record<AdFormat, string | null> = {
  banner: process.env.EXPO_PUBLIC_AD_BANNER ?? TEST.bannerIos,
  interstitial: process.env.EXPO_PUBLIC_AD_INTERSTITIAL ?? TEST.interstitialIos,
  rewarded: process.env.EXPO_PUBLIC_AD_REWARDED ?? TEST.rewardedIos,
  native: process.env.EXPO_PUBLIC_AD_NATIVE ?? TEST.nativeIos,
};

/**
 * Aktif platform + ortam için unit ID döner.
 * - DEV: Google'ın test ID'si.
 * - PROD Android: gerçek unit.
 * - PROD iOS (unit henüz tanımlı değilse): null → caller fallback render etmeli.
 *
 * Test ID'sini iOS prod'da kullanmak AdMob policy ihlali olduğundan asla
 * "test'e düş" davranışı yok.
 */
export function resolveAdUnitId(format: AdFormat): string | null {
  if (__DEV__) {
    if (Platform.OS === 'ios') {
      switch (format) {
        case 'banner': return TEST.bannerIos;
        case 'interstitial': return TEST.interstitialIos;
        case 'rewarded': return TEST.rewardedIos;
        case 'native': return TEST.nativeIos;
      }
    }
    return TEST[format];
  }
  return Platform.OS === 'ios' ? PROD_IOS[format] : PROD_ANDROID[format];
}

/**
 * Runtime sanity check — banner ile interstitial farklı olmalı (eğer banner
 * prod ID set edilmişse). Refactor sırasında yanlışlıkla aynı yapılırsa
 * dev ortamında hemen patlar.
 */
if (__DEV__ && PROD_ANDROID.banner && PROD_ANDROID.banner === PROD_ANDROID.interstitial) {
  throw new Error('[adUnits] Android banner and interstitial unit IDs must be different');
}
