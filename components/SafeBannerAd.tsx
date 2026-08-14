import React from 'react';
import { NativeModules } from 'react-native';
import { resolveAdUnitId } from '../constants/adUnits';
import { shouldRequestNonPersonalizedAds } from '../utils/adInit';

// Only call require() when the native binary actually contains the module.
// In Expo Go, RNGoogleMobileAdsModule is undefined — the require() is never
// called, so Metro never evaluates the native module and the app doesn't crash.
let adsModule: any = null;
if (NativeModules.RNGoogleMobileAdsModule) {
  adsModule = require('react-native-google-mobile-ads');
}

export function SafeBannerAd() {
  const unitId = resolveAdUnitId('banner');
  if (!adsModule || !unitId) return null;
  const { BannerAd, BannerAdSize } = adsModule;
  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: shouldRequestNonPersonalizedAds() }}
      onAdFailedToLoad={() => {}}
    />
  );
}
