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

const RETRY_SCHEDULE = [8_000, 20_000, 45_000, 90_000, 180_000];
const MAX_RETRIES = RETRY_SCHEDULE.length;
function nextRetryDelay(attempt: number): number {
  return RETRY_SCHEDULE[Math.min(attempt, RETRY_SCHEDULE.length - 1)];
}

type Status = {
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  isOnline: boolean;
  retriesExhausted: boolean;
};

export type ShowRewardedResult =
  | { ok: true; rewarded: true }
  | { ok: false; reason: 'no_ad' | 'no_internet' | 'unsupported' | 'show_failed' };

export function useRewardedAd(onReward?: () => void) {
  const unitId = resolveAdUnitId('rewarded');
  const supported = !!adsModule && !!unitId;

  const [status, setStatus] = useState<Status>({
    isLoaded: false,
    isLoading: supported,
    hasError: !supported,
    isOnline: true,
    retriesExhausted: false,
  });

  const adRef = useRef<any>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const retryAttemptRef = useRef(0);
  const onRewardRef = useRef(onReward);
  useEffect(() => { onRewardRef.current = onReward; }, [onReward]);

  const cleanupListeners = useCallback(() => {
    unsubscribersRef.current.forEach(fn => {
      try { fn(); } catch {}
    });
    unsubscribersRef.current = [];
  }, []);

  const loadAd = useCallback(() => {
    if (!mountedRef.current) return;
    if (!supported) {
      setStatus(s => ({ ...s, hasError: true, isLoaded: false, isLoading: false }));
      return;
    }

    waitForAdSdk().then(() => {
      if (!mountedRef.current) return;
      try {
        const { RewardedAd, RewardedAdEventType, AdEventType } = adsModule;
        const ad = RewardedAd.createForAdRequest(unitId!, {
          requestNonPersonalizedAdsOnly: shouldRequestNonPersonalizedAds(),
        });

        cleanupListeners();
        setStatus(s => ({ ...s, isLoading: true, hasError: false, isLoaded: false }));

        const offLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          if (!mountedRef.current) return;
          retryAttemptRef.current = 0;
          setStatus(s => ({ ...s, isLoaded: true, isLoading: false, hasError: false, retriesExhausted: false }));
        });

        const offEarned = ad.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            if (!mountedRef.current) return;
            // Microtask ile çağır — listener içinde state mutate eden caller
            // race'e düşmesin.
            setTimeout(() => {
              try { onRewardRef.current?.(); } catch {}
            }, 0);
          }
        );

        const offError = ad.addAdEventListener(AdEventType.ERROR, () => {
          if (!mountedRef.current) return;
          const exhausted = retryAttemptRef.current >= MAX_RETRIES;
          setStatus(s => ({
            ...s,
            isLoaded: false,
            isLoading: false,
            hasError: true,
            retriesExhausted: exhausted,
          }));
          if (exhausted) return;
          if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
          const delay = nextRetryDelay(retryAttemptRef.current++);
          reloadTimerRef.current = setTimeout(() => {
            if (mountedRef.current) loadAd();
          }, delay);
        });

        const offClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          if (!mountedRef.current) return;
          retryAttemptRef.current = 0;
          setStatus(s => ({ ...s, isLoaded: false, isLoading: true, retriesExhausted: false }));
          loadAd();
        });

        unsubscribersRef.current = [offLoaded, offEarned, offError, offClosed];
        adRef.current = ad;
        try {
          ad.load();
        } catch {
          if (mountedRef.current) {
            setStatus(s => ({ ...s, hasError: true, isLoaded: false, isLoading: false }));
          }
        }
      } catch {
        if (mountedRef.current) {
          setStatus(s => ({ ...s, hasError: true, isLoaded: false, isLoading: false }));
        }
      }
    });
  }, [cleanupListeners, supported, unitId]);

  const show = useCallback(async (): Promise<ShowRewardedResult> => {
    if (!supported) return { ok: false, reason: 'unsupported' };
    if (!status.isOnline) return { ok: false, reason: 'no_internet' };
    const ad = adRef.current;
    if (!ad || !status.isLoaded) {
      // Yüklenmemişse bir reload tetikle ki kullanıcı ikinci kez tıkladığında çalışsın.
      if (!status.isLoading && !status.retriesExhausted) loadAd();
      return { ok: false, reason: 'no_ad' };
    }
    try {
      ad.show();
      return { ok: true, rewarded: true };
    } catch {
      return { ok: false, reason: 'show_failed' };
    }
  }, [status.isOnline, status.isLoaded, status.isLoading, status.retriesExhausted, loadAd, supported]);

  // Kullanıcı tetikli manuel retry.
  const reload = useCallback(() => {
    retryAttemptRef.current = 0;
    setStatus(s => ({ ...s, retriesExhausted: false, hasError: false, isLoading: supported }));
    loadAd();
  }, [loadAd, supported]);

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
            if (online && !s.isLoaded) {
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
          if (!s.isLoaded && !s.isLoading && !s.retriesExhausted) loadAd();
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
      adRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoaded: status.isLoaded,
    isLoading: status.isLoading,
    hasError: status.hasError,
    isOnline: status.isOnline,
    retriesExhausted: status.retriesExhausted,
    isAdsAvailable: supported,
    show,
    reload,
  };
}
