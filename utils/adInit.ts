/**
 * AdMob SDK initialization singleton.
 *
 * Sorumluluklar:
 *  1. SDK'yı bir kez initialize etmek (idempotent).
 *  2. Request configuration'ı set etmek (content rating, COPPA, test devices).
 *  3. UMP (User Messaging Platform) consent flow'u kurmak — AB/Avrupa
 *     kullanıcıları için yasal zorunluluk. Consent durumu sonradan
 *     `shouldRequestNonPersonalizedAds()` üzerinden okunur.
 *  4. Init başarısını/hatasını takip ederek caller'lara doğru sinyal vermek.
 *     Eski sürümde hata yutuluyordu → callerlar SDK'yı hazır sanıyordu.
 *
 * Kullanım:
 *   `await initAdSdk()` uygulama açılışında çağırılır (root _layout).
 *   Ad load eden hook'lar/component'ler `await waitForAdSdk()` ile
 *   hazır olmasını bekler.
 */
import { NativeModules } from 'react-native';

let resolveReady: () => void;
const readyPromise = new Promise<void>(res => { resolveReady = res; });

let initialised = false;
let initSucceeded = false;
let nonPersonalizedOnly = true; // güvenli varsayılan — consent gelene kadar NPA

function setRequestConfiguration(adsModule: any): void {
  try {
    adsModule.default().setRequestConfiguration({
      // Habits yetişkin kullanıcılara yönelik bir alışkanlık takip uygulaması.
      // 'T' = Teen — sigara/içki gibi olumsuz alışkanlık içerikleri olduğundan
      // çocuk reklamına uygun değil.
      maxAdContentRating: 'T',
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      // Dev'de emülatör/cihaz testleri "test ad" görsün diye:
      ...(__DEV__ ? { testDeviceIdentifiers: ['EMULATOR'] } : {}),
    });
  } catch (e) {
    if (__DEV__) console.warn('[adInit] setRequestConfiguration failed', e);
  }
}

async function requestConsentIfNeeded(adsModule: any): Promise<void> {
  // UMP consent — sadece react-native-google-mobile-ads >= 12 gerekiyor.
  // Modul AdsConsent'ı export etmezse sessizce atla; consent zorunlu olan
  // bölgelerde kullanıcı reklam görmez (NPA fallback'i koruma sağlar).
  try {
    const AdsConsent = adsModule.AdsConsent;
    if (!AdsConsent?.requestInfoUpdate) return;

    await AdsConsent.requestInfoUpdate({
      // Production'da gerçek coğrafyaya bakar; dev'de EEA simüle edersek
      // formu test edebiliriz (yorum satırı olarak bırakıyorum).
      // debugGeography: AdsConsent.AdsConsentDebugGeography?.EEA,
    });
    if (typeof AdsConsent.loadAndShowConsentFormIfRequired === 'function') {
      await AdsConsent.loadAndShowConsentFormIfRequired();
    }

    // Consent alındıktan sonra kullanıcı kişiselleştirilmiş reklam izni verdi mi?
    if (typeof AdsConsent.getUserChoices === 'function') {
      const choices = await AdsConsent.getUserChoices();
      // En azından "select personalised ads" reddedilmediyse personalized'a izin ver.
      const consented = choices?.selectPersonalisedAds !== false;
      nonPersonalizedOnly = !consented;
    }
  } catch (e) {
    if (__DEV__) console.warn('[adInit] consent flow skipped', e);
  }
}

export async function initAdSdk(): Promise<void> {
  if (initialised) return;
  if (!NativeModules.RNGoogleMobileAdsModule) {
    initialised = true;
    initSucceeded = false;
    resolveReady();
    return;
  }
  try {
    const adsModule = require('react-native-google-mobile-ads');
    setRequestConfiguration(adsModule);
    await adsModule.default().initialize();
    await requestConsentIfNeeded(adsModule);
    initSucceeded = true;
  } catch (e) {
    if (__DEV__) console.warn('[adInit] SDK init failed', e);
    initSucceeded = false;
  } finally {
    initialised = true;
    resolveReady();
  }
}

/** Await this before loading any ad — resolves immediately if already done. */
export function waitForAdSdk(): Promise<void> {
  return readyPromise;
}

/** SDK init başarıyla tamamlandı mı? */
export function isAdSdkReady(): boolean {
  return initialised && initSucceeded;
}

/**
 * Caller'lar request seçeneklerinde kullansın diye tek noktada NPA değeri.
 * - Consent yoksa veya kullanıcı kişiselleştirme'yi reddettiyse `true`.
 * - Aksi halde Google Personalized Ads etkin (daha yüksek eCPM).
 */
export function shouldRequestNonPersonalizedAds(): boolean {
  return nonPersonalizedOnly;
}
