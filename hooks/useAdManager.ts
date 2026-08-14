import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, NativeModules } from 'react-native';
import { waitForAdSdk, shouldRequestNonPersonalizedAds } from '../utils/adInit';
import { resolveAdUnitId } from '../constants/adUnits';

let adsModule: any = null;
if (NativeModules.RNGoogleMobileAdsModule) {
  try {
    adsModule = require('react-native-google-mobile-ads');
  } catch {
    adsModule = null;
  }
}

// Progressive retry: 8s → 20s → 45s → 90s → 180s. Sonra MAX_RETRIES'a vurunca durur.
// Eskiden sınırsız retry vardı → offline cihazda batarya/network drain.
const RETRY_SCHEDULE = [8_000, 20_000, 45_000, 90_000, 180_000];
const MAX_RETRIES = RETRY_SCHEDULE.length;

type Status = {
  isAdLoaded: boolean;
  adError: boolean;
  isOnline: boolean;
  retriesExhausted: boolean;
};

function nextRetryDelay(attempt: number): number {
  return RETRY_SCHEDULE[Math.min(attempt, RETRY_SCHEDULE.length - 1)];
}

export function useAdManager() {
  const unitId = resolveAdUnitId('interstitial');
  const supported = !!adsModule && !!unitId;

  const [status, setStatus] = useState<Status>({
    isAdLoaded: false,
    adError: !supported,
    isOnline: true,
    retriesExhausted: false,
  });

  const interstitialRef = useRef<any>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const retryAttemptRef = useRef(0);

  const cleanupListeners = useCallback(() => {
    unsubscribersRef.current.forEach(fn => {
      try { fn(); } catch {}
    });
    unsubscribersRef.current = [];
  }, []);

  const loadAd = useCallback(() => {
    if (!mountedRef.current) return;
    if (!supported) {
      setStatus(s => ({ ...s, adError: true, isAdLoaded: false }));
      return;
    }

    waitForAdSdk().then(() => {
      if (!mountedRef.current) return;
      try {
        const { InterstitialAd, AdEventType } = adsModule;
        const ad = InterstitialAd.createForAdRequest(unitId!, {
          requestNonPersonalizedAdsOnly: shouldRequestNonPersonalizedAds(),
        });

        cleanupListeners();

        const offLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
          if (!mountedRef.current) return;
          retryAttemptRef.current = 0;
          setStatus(s => ({ ...s, isAdLoaded: true, adError: false, retriesExhausted: false }));
        });
        const offError = ad.addAdEventListener(AdEventType.ERROR, () => {
          if (!mountedRef.current) return;
          const exhausted = retryAttemptRef.current >= MAX_RETRIES;
          setStatus(s => ({ ...s, isAdLoaded: false, adError: true, retriesExhausted: exhausted }));
          if (exhausted) return; // sınır aşıldı — retry timer açma
          if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
          const delay = nextRetryDelay(retryAttemptRef.current++);
          reloadTimerRef.current = setTimeout(() => {
            if (mountedRef.current) loadAd();
          }, delay);
        });
        const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (!mountedRef.current) return;
          retryAttemptRef.current = 0;
          setStatus(s => ({ ...s, isAdLoaded: false, retriesExhausted: false }));
          loadAd();
        });

        unsubscribersRef.current = [offLoaded, offError, offClosed];
        interstitialRef.current = ad;
        try {
          ad.load();
        } catch {
          if (mountedRef.current) {
            setStatus(s => ({ ...s, adError: true, isAdLoaded: false }));
          }
        }
      } catch {
        if (mountedRef.current) {
          setStatus(s => ({ ...s, adError: true, isAdLoaded: false }));
        }
      }
    });
  }, [cleanupListeners, supported, unitId]);

  const showAd = useCallback(() => {
    const ad = interstitialRef.current;
    if (ad && status.isAdLoaded) {
      try {
        ad.show();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, [status.isAdLoaded]);

  // Manuel retry — kullanıcı tetikli. retriesExhausted olduğunda UI bunu çağırır.
  const reload = useCallback(() => {
    retryAttemptRef.current = 0;
    setStatus(s => ({ ...s, retriesExhausted: false, adError: false }));
    loadAd();
  }, [loadAd]);

  useEffect(() => {
    mountedRef.current = true;

    let netUnsub: (() => void) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const NetInfo = require('@react-native-community/netinfo')?.default;
      if (NetInfo && typeof NetInfo.addEventListener === 'function') {
        netUnsub = NetInfo.addEventListener((state: any) => {
          if (!mountedRef.current) return;
          const online = !!state?.isConnected;
          setStatus(s => {
            if (s.isOnline === online) return s;
            // Offline → online geçişinde retry sayacını sıfırla (gerçek koşul değişti).
            if (online && !s.isAdLoaded) {
              retryAttemptRef.current = 0;
              setTimeout(() => mountedRef.current && loadAd(), 0);
              return { ...s, isOnline: online, retriesExhausted: false };
            }
            return { ...s, isOnline: online };
          });
        });
      }
    } catch {}

    const appSub = AppState.addEventListener('change', state => {
      if (!mountedRef.current) return;
      if (state === 'active') {
        setStatus(s => {
          // Foreground'a dönüşte yüklü ad yoksa VE retry tükenmediyse tekrar dene.
          if (!s.isAdLoaded && !s.retriesExhausted) loadAd();
          return s;
        });
      }
    });

    loadAd();

    return () => {
      mountedRef.current = false;
      cleanupListeners();
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      appSub.remove();
      if (netUnsub) {
        try { netUnsub(); } catch {}
      }
      interstitialRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isAdLoaded: status.isAdLoaded,
    adError: status.adError,
    isOnline: status.isOnline,
    retriesExhausted: status.retriesExhausted,
    showAd,
    reload,
    isAdsAvailable: supported,
  };
}
