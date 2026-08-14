import React from 'react';
import { View, NativeModules, StyleSheet } from 'react-native';
import { useAdNetworkStatus } from '../hooks/useAdNetworkStatus';
import { resolveAdUnitId } from '../constants/adUnits';
import { shouldRequestNonPersonalizedAds } from '../utils/adInit';
import { FallbackBanner } from './FallbackBanner';

// Banner ile fallback'in aynı kapsayıcı yüksekliğinde olması layout shift'i
// engeller — adaptive banner yaklaşık 50-100dp yüksek olabilir, biz minHeight
// ile sabitleyip içeriği ortalıyoruz.
const BANNER_HEIGHT = 80;

let adsModule: any = null;
if (NativeModules.RNGoogleMobileAdsModule) {
  try {
    adsModule = require('react-native-google-mobile-ads');
  } catch {
    adsModule = null;
  }
}

type Props = {
  /** When true, only renders the fallback (e.g. for users who paid to remove ads) */
  forceFallback?: boolean;
};

export function SmartAdBanner({ forceFallback }: Props) {
  // Sadece network/availability sinyalleri — eski sürümde useAdManager
  // çağrılıyordu ama o hook arka planda boşa interstitial yüklüyordu.
  const { isOnline, isAdsAvailable } = useAdNetworkStatus();
  const unitId = resolveAdUnitId('banner');

  const canAttemptAd =
    !forceFallback &&
    isAdsAvailable &&
    isOnline &&
    adsModule != null &&
    !!unitId; // iOS prod'da unitId null → fallback render

  return (
    <View style={styles.container} className="w-full">
      {canAttemptAd ? <RealBanner unitId={unitId!} /> : <FallbackBanner />}
    </View>
  );
}

const BANNER_MAX_RETRIES = 2;
const BANNER_RETRY_DELAYS = [7_000, 20_000];

function RealBanner({ unitId }: { unitId: string }) {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [key, setKey] = React.useState(0); // remount BannerAd to retry
  const mountedRef = React.useRef(true);
  const retryRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleFailure = React.useCallback(() => {
    if (!mountedRef.current) return;
    if (retryRef.current >= BANNER_MAX_RETRIES) {
      setFailed(true);
      return;
    }
    const delay = BANNER_RETRY_DELAYS[retryRef.current++];
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) setKey(k => k + 1); // remount triggers a fresh ad request
    }, delay);
  }, []);

  if (!adsModule || failed) return <FallbackBanner />;

  const { BannerAd, BannerAdSize } = adsModule;

  return (
    <View style={styles.bannerWrap}>
      {!loaded && <FallbackBanner />}
      <View
        style={loaded ? styles.bannerVisible : styles.bannerHidden}
        pointerEvents={loaded ? 'auto' : 'none'}
      >
        <BannerAd
          key={key}
          unitId={unitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: shouldRequestNonPersonalizedAds() }}
          onAdLoaded={() => {
            if (mountedRef.current) {
              retryRef.current = 0;
              setLoaded(true);
            }
          }}
          onAdFailedToLoad={handleFailure}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: BANNER_HEIGHT,
    justifyContent: 'center',
  },
  bannerWrap: {
    minHeight: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerVisible: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerHidden: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SmartAdBanner;
