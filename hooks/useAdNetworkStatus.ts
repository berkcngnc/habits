/**
 * Banner gibi pasif ad component'lerinin "şu an reklam göster mi yoksa
 * fallback mi" kararı verebilmesi için iki bayrak: cihaz online mı, ve
 * native AdMob modülü mevcut mu (yani Expo Go değil, prebuild).
 *
 * Eski mimaride bu bayraklar `useAdManager`'dan okunuyordu; ancak
 * `useAdManager` arka planda bir interstitial preload'ı yapıyor — bu da
 * sadece banner göstermek isteyen ekranlarda boşa request + memory'ye
 * bağlı listener'lar yaratıyordu. Bu hook bağımsızdır, hiçbir ad load etmez.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState, NativeModules } from 'react-native';

const isAdsModuleAvailable = !!NativeModules.RNGoogleMobileAdsModule;

export function useAdNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    let netUnsub: (() => void) | null = null;
    try {
      // NetInfo opsiyonel — paket yoksa AppState'e fallback.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const NetInfo = require('@react-native-community/netinfo')?.default;
      if (NetInfo && typeof NetInfo.addEventListener === 'function') {
        netUnsub = NetInfo.addEventListener((state: any) => {
          if (!mountedRef.current) return;
          const online = !!state?.isConnected;
          setIsOnline(prev => (prev === online ? prev : online));
        });
      }
    } catch {
      // NetInfo dependency yoksa sessizce geç — AppState yeterli sinyal.
    }

    // Foreground'a dönüşte online varsayımı (NetInfo yoksa kaba düzeltici).
    const appSub = AppState.addEventListener('change', state => {
      if (!mountedRef.current) return;
      if (state === 'active' && !netUnsub) setIsOnline(true);
    });

    return () => {
      mountedRef.current = false;
      appSub.remove();
      if (netUnsub) {
        try { netUnsub(); } catch {}
      }
    };
  }, []);

  return { isOnline, isAdsAvailable: isAdsModuleAvailable };
}
