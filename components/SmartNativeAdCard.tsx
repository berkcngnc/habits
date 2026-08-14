import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, Text, Image, NativeModules } from 'react-native';
import { waitForAdSdk, shouldRequestNonPersonalizedAds } from '../utils/adInit';
import { resolveAdUnitId } from '../constants/adUnits';
import { useColorScheme } from 'nativewind';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FallbackBanner } from './FallbackBanner';

let adsModule: any = null;
if (NativeModules.RNGoogleMobileAdsModule) {
  try {
    adsModule = require('react-native-google-mobile-ads');
  } catch {
    adsModule = null;
  }
}

type Props = {
  forceFallback?: boolean;
};

export function SmartNativeAdCard({ forceFallback }: Props) {
  if (forceFallback || !adsModule) return <FallbackBanner />;
  return <RealNativeCard />;
}

const NATIVE_TIMEOUT_MS = 10_000;
const NATIVE_MAX_RETRIES = 3;
const NATIVE_RETRY_DELAYS = [5_000, 12_000, 25_000];

function RealNativeCard() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [nativeAd, setNativeAd] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const adRef = useRef<any>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const scheduleRetry = () => {
      if (!mountedRef.current) return;
      if (retryRef.current >= NATIVE_MAX_RETRIES) { setFailed(true); return; }
      const delay = NATIVE_RETRY_DELAYS[retryRef.current++];
      timerRef.current = setTimeout(attempt, delay);
    };

    const attempt = () => {
      if (!mountedRef.current) return;
      const unitId = resolveAdUnitId('native');
      // iOS prod'da unit yok → kalıcı fallback (test ID'sine düşmek policy ihlali).
      if (!unitId) { setFailed(true); return; }

      const { NativeAd } = adsModule;
      const timeout = setTimeout(() => {
        if (!mountedRef.current) return;
        scheduleRetry();
      }, NATIVE_TIMEOUT_MS);

      waitForAdSdk().then(() => {
        NativeAd.createForAdRequest(unitId, {
          requestNonPersonalizedAdsOnly: shouldRequestNonPersonalizedAds(),
        })
          .then((ad: any) => {
            clearTimeout(timeout);
            if (!mountedRef.current) { ad?.destroy?.(); return; }
            retryRef.current = 0;
            // Önceki ad varsa destroy et — leak'i önler (yeni request retry'da geldi).
            try { adRef.current?.destroy?.(); } catch {}
            adRef.current = ad;
            setNativeAd(ad);
          })
          .catch(() => {
            clearTimeout(timeout);
            if (mountedRef.current) scheduleRetry();
          });
      });
    };

    attempt();

    // AppState recovery: kullanıcı uygulamayı arka plana attı, ad request'ler
    // exhausted olabilir. Foreground'a dönünce sınır dolmadıysa yeniden dene.
    const appSub = AppState.addEventListener('change', state => {
      if (!mountedRef.current) return;
      if (state === 'active' && !nativeAd && !failed) {
        if (timerRef.current) clearTimeout(timerRef.current);
        retryRef.current = 0;
        attempt();
      }
    });

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      appSub.remove();
      try { adRef.current?.destroy?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) return <FallbackBanner />;
  if (!nativeAd) {
    return (
      <View
        className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        style={{ minHeight: 110 }}
      />
    );
  }

  const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = adsModule;
  const accent = '#3b82f6';

  return (
    <NativeAdView nativeAd={nativeAd}>
      <View
        className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-gray-200 dark:border-zinc-800 dark:border-t-zinc-700 shadow-md dark:shadow-none"
        style={{ elevation: 3 }}
      >
        {/* Üst satır: ikon + başlık + Sponsorlu rozeti */}
        <View className="flex-row items-center">
          {nativeAd.icon?.url ? (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image
                source={{ uri: nativeAd.icon.url }}
                style={{ width: 48, height: 48, borderRadius: 12 }}
              />
            </NativeAsset>
          ) : (
            <View
              className="items-center justify-center rounded-xl"
              style={{ width: 48, height: 48, backgroundColor: accent + '22' }}
            >
              <FontAwesome name="bullhorn" size={20} color={accent} />
            </View>
          )}

          <View className="flex-1 ml-3">
            <NativeAsset assetType={NativeAssetType.HEADLINE}>
              <Text
                numberOfLines={1}
                className="text-[15px] font-bold text-zinc-900 dark:text-white"
              >
                {nativeAd.headline}
              </Text>
            </NativeAsset>
            <View className="flex-row items-center mt-0.5">
              <View
                className="px-2 py-0.5 rounded-md mr-2"
                style={{ backgroundColor: accent + '22' }}
              >
                <Text className="text-[10px] font-bold" style={{ color: accent }}>
                  Sponsorlu
                </Text>
              </View>
              {nativeAd.advertiser ? (
                <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                  <Text
                    numberOfLines={1}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400 flex-1"
                  >
                    {nativeAd.advertiser}
                  </Text>
                </NativeAsset>
              ) : null}
            </View>
          </View>
        </View>

        {/* Açıklama */}
        {nativeAd.body ? (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text
              numberOfLines={2}
              className="text-[13px] text-zinc-600 dark:text-zinc-300 mt-3 leading-5"
            >
              {nativeAd.body}
            </Text>
          </NativeAsset>
        ) : null}

        {/* Medya (varsa) */}
        {NativeMediaView ? (
          <View
            className="mt-3 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800"
            style={{ aspectRatio: 16 / 9 }}
          >
            <NativeMediaView style={{ flex: 1 }} resizeMode="cover" />
          </View>
        ) : null}

        {/* CTA */}
        {nativeAd.callToAction ? (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View
              className="mt-4 rounded-2xl py-3 items-center"
              style={{ backgroundColor: accent }}
            >
              <Text
                numberOfLines={1}
                className="text-white font-semibold text-[14px]"
              >
                {nativeAd.callToAction}
              </Text>
            </View>
          </NativeAsset>
        ) : null}
      </View>
    </NativeAdView>
  );
}

export default SmartNativeAdCard;
