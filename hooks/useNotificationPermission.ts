import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type SystemPermissionState = {
  /** OS izninin gerçek durumu — "granted" sadece bu true iken kabul edilir. */
  granted: boolean;
  /** Sistem yeniden sormaya izin veriyor mu (false ise sadece ayarlar açılabilir). */
  canAskAgain: boolean;
  /** İlk kontrol tamamlandı mı (UI flicker önlemek için). */
  ready: boolean;
};

/**
 * İşletim sistemi bildirim izninin canlı durumunu izler.
 *
 *  - Mount'ta `getPermissionsAsync` ile mevcut durum okunur.
 *  - AppState 'active' olduğunda — yani kullanıcı sistem ayarlarından
 *    döndüğünde — durum otomatik yenilenir.
 *  - `requestOrOpenSettings()` çağrıldığında: izin sorulabiliyorsa
 *    native dialog tetiklenir; sorulamazsa direkt sistem ayarları açılır.
 *    İki durumda da `AppState` listener'ı sonradan durumu eşitler.
 */
export function useNotificationPermission() {
  const [state, setState] = useState<SystemPermissionState>({
    granted: false,
    canAskAgain: true,
    ready: false,
  });
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (mountedRef.current) setState({ granted: false, canAskAgain: false, ready: true });
      return;
    }
    try {
      const res = await Notifications.getPermissionsAsync();
      if (!mountedRef.current) return;
      setState({
        granted: res.status === 'granted',
        canAskAgain: res.canAskAgain ?? true,
        ready: true,
      });
    } catch {
      if (mountedRef.current) {
        setState(s => ({ ...s, ready: true }));
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();

    const onAppStateChange = (next: AppStateStatus) => {
      if (next === 'active') {
        // Kullanıcı sistem ayarlarından dönmüş olabilir — yeniden hizala.
        refresh();
      }
    };
    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      mountedRef.current = false;
      sub.remove();
    };
  }, [refresh]);

  /**
   * "İzin Ver" akışı:
   *   - Sistem hâlâ sorulabilir durumda → native dialog
   *   - Aksi halde → uygulamanın sistem ayarları sayfası
   * Her iki durumda da AppState listener dönüş sonrası state'i tazeler.
   */
  const requestOrOpenSettings = useCallback(async (): Promise<boolean> => {
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.status === 'granted') {
        await refresh();
        return true;
      }
      if (current.canAskAgain) {
        const res = await Notifications.requestPermissionsAsync();
        await refresh();
        return res.status === 'granted';
      }
      // Sistem artık sormayacak — kullanıcıyı doğrudan ayarlar sayfasına götür.
      try {
        await Linking.openSettings();
      } catch {
        // openSettings web'te yok; yutuyoruz, AppState yine yenileyecek.
      }
      return false;
    } catch {
      return false;
    }
  }, [refresh]);

  /** Yalnızca ayarlar sayfasını açar (toggle kapalıyken bilgi linki). */
  const openSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {}
  }, []);

  return {
    ...state,
    refresh,
    requestOrOpenSettings,
    openSettings,
    isAndroid13Plus:
      Platform.OS === 'android' &&
      ((typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10)) >= 33),
  };
}
