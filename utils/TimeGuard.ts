import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { handleAsyncError } from './errorHandler';

const TIMEGUARD_KEY = '@timeguard_v2';
const LEGACY_KEY = '@timeguard_v1';

// 10 dakikalık tolerans — NTP micro-correction, OS scheduler jitter ve
// şarj sırasındaki saat düzeltmelerini yanlış pozitif olarak
// işaretlememek için.  Bu tolerans yalnızca "saat geriye alınmış mı?"
// kontrolünde kullanılır (deltaWall < deltaUp - TOLERANCE).
const TOLERANCE_MS = 10 * 60 * 1000;

// Saat dilimi değişikliği toleransı: kullanıcı uçakla seyahat ederse
// wallTime aniden ±X saat kayar; bunu hile saymıyoruz, sadece referansı
// timezone offset'ine göre düzeltiyoruz.
const SCHEMA_VERSION = 2;

interface TimeGuardState {
  v: number;            // schema version
  wallTime: number;     // Date.now() at last save
  upTime: number;       // Device uptime ms at last save
  tzOffset: number;     // getTimezoneOffset() at last save (minutes)
}

// In-memory mutex to prevent concurrent read-modify-write races
// (multiple toggles fired in the same frame, AppState change overlap, etc.)
let writeLock: Promise<void> = Promise.resolve();

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const prev = writeLock;
  let release!: () => void;
  writeLock = new Promise<void>(resolve => { release = resolve; });
  try {
    await prev;
    return await fn();
  } finally {
    release();
  }
}

async function getUptimeMs(): Promise<number | null> {
  try {
    const fn = (Device as unknown as { getUptimeAsync?: () => Promise<number> }).getUptimeAsync;
    if (typeof fn !== 'function') return null;
    const v = await fn();
    return typeof v === 'number' && isFinite(v) && v >= 0 ? v : null;
  } catch {
    return null;
  }
}

function isValidState(parsed: any): parsed is TimeGuardState {
  return (
    parsed &&
    typeof parsed === 'object' &&
    typeof parsed.wallTime === 'number' && isFinite(parsed.wallTime) &&
    typeof parsed.upTime === 'number' && isFinite(parsed.upTime) &&
    typeof parsed.tzOffset === 'number' && isFinite(parsed.tzOffset)
  );
}

async function readState(): Promise<TimeGuardState | null> {
  try {
    let raw = await AsyncStorage.getItem(TIMEGUARD_KEY);
    // Legacy migration (v1 -> v2): one-shot, silent.
    if (!raw) {
      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy) {
        try {
          const lp = JSON.parse(legacy);
          if (lp && typeof lp.wallTime === 'number' && typeof lp.upTime === 'number') {
            const migrated: TimeGuardState = {
              v: SCHEMA_VERSION,
              wallTime: lp.wallTime,
              upTime: lp.upTime,
              tzOffset: new Date().getTimezoneOffset(),
            };
            await AsyncStorage.setItem(TIMEGUARD_KEY, JSON.stringify(migrated));
            await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
            return migrated;
          }
        } catch {}
        // Corrupt legacy — nuke it.
        await AsyncStorage.removeItem(LEGACY_KEY).catch(() => {});
      }
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!isValidState(parsed)) {
      // Bozuk veri — silip temiz başlat (kullanıcıyı kilitleme).
      await AsyncStorage.removeItem(TIMEGUARD_KEY).catch(() => {});
      return null;
    }
    return parsed;
  } catch (e) {
    handleAsyncError('TimeGuard.readState', e);
    return null;
  }
}

async function writeState(state: TimeGuardState): Promise<void> {
  try {
    await AsyncStorage.setItem(TIMEGUARD_KEY, JSON.stringify(state));
  } catch (e) {
    handleAsyncError('TimeGuard.writeState', e);
  }
}

function buildState(wallTime: number, upTime: number): TimeGuardState {
  return {
    v: SCHEMA_VERSION,
    wallTime,
    upTime,
    tzOffset: new Date().getTimezoneOffset(),
  };
}

export async function saveCurrentTimeState(): Promise<void> {
  await withLock(async () => {
    const upTime = (await getUptimeMs()) ?? 0;
    await writeState(buildState(Date.now(), upTime));
  });
}

/**
 * Cihaz saatinin manipüle edilip edilmediğini kontrol eder.
 * `true` -> hile tespit edildi (ilgili işlem iptal edilmeli).
 * `false` -> dürüst zaman; çağrı sonunda state otomatik güncellenir.
 *
 * ÖNEMLİ — Android deep-sleep davranışı:
 *  Android'de `Device.getUptimeAsync()` → `SystemClock.uptimeMillis()`
 *  deep-sleep süresini SAYMIYOR.  Bu nedenle cihaz uyuduktan sonra
 *  deltaWall >> deltaUp olması NORMAL.  Eski algoritma `Math.abs(deltaWall
 *  - deltaUp) > TOLERANCE` ile simetrik karşılaştırma yapıyordu ve her
 *  deep-sleep döngüsünde yanlış pozitif üretiyordu.
 *
 * Yeni strateji:
 *  1. Wall clock geriye gittiyse → manipülasyon (tolerans dahilinde değilse).
 *  2. Uptime ilerlemesine rağmen wall clock GERİ kalmışsa → saat geriye alınmış.
 *     Formül: deltaWall < deltaUp - TOLERANCE  (yani saat, uptime'ın
 *     gösterdiğinden önemli ölçüde daha az ilerlemiş).
 *  3. deltaWall > deltaUp → deep-sleep / doze; NORMAL, hile DEĞİL.
 *
 * Kurşun-geçirmez davranışlar:
 *  - Uptime alınamazsa fail-open (kullanıcıyı haksız cezalandırma).
 *  - Bozuk depolama -> temiz reset.
 *  - Reboot tespiti: uptime düşüşü.
 *  - Timezone değişimi: wall delta'yı offset farkıyla normalize ederek hile sayma.
 *  - Race condition: tek bir mutex altında oku-yaz.
 */
export async function checkTimeAnomaly(): Promise<boolean> {
  return withLock(async () => {
    const currentWall = Date.now();
    const currentUp = await getUptimeMs();
    const currentTz = new Date().getTimezoneOffset();

    if (currentUp === null) {
      // Web / desteklemeyen cihaz: yalnızca referansı tazele, hile sayma.
      await writeState(buildState(currentWall, 0));
      return false;
    }

    const prev = await readState();

    if (!prev) {
      await writeState(buildState(currentWall, currentUp));
      return false;
    }

    // Timezone değişikliği -> wall delta'sını normalize et.
    // getTimezoneOffset() pozitifse UTC'den geride; fark dakika cinsinden.
    const tzShiftMs = (prev.tzOffset - currentTz) * 60 * 1000;
    const adjustedWall = currentWall + tzShiftMs;

    let anomaly = false;
    const rebooted = currentUp < prev.upTime;

    if (rebooted) {
      // Reboot sonrası uptime sıfırlanır, deltaUp güvenilmez.
      // Sadece "saat geriye gitti mi?" kontrolü yap.
      if (adjustedWall + TOLERANCE_MS < prev.wallTime) {
        anomaly = true;
      }
    } else {
      const deltaWall = adjustedWall - prev.wallTime;
      const deltaUp = currentUp - prev.upTime;

      // ── Tek geçerli hile sinyali: saat GERİYE alınmış ──
      //
      // deltaWall < deltaUp  → saat, CPU'nun çalıştığı süreden daha az
      // ilerlemiş demektir.  Bu fiziksel olarak imkânsızdır (deep-sleep
      // sadece deltaWall > deltaUp yaratır, tersini asla).
      //
      // Tolerans: NTP micro-correction, scheduler jitter vb. için 10dk.
      //
      // deltaWall > deltaUp  → deep-sleep / doze modu; NORMAL.
      // Math.abs() ile simetrik karşılaştırma YAPMA — bu yanlış pozitif
      // üretir.
      if (deltaWall < deltaUp - TOLERANCE_MS) {
        anomaly = true;
      }
    }

    if (!anomaly) {
      // Yalnızca dürüst durumlarda referansı ileri taşı; hile durumunda
      // eski güvenli referansı koru ki sonraki çağrılar da yakalasın.
      await writeState(buildState(currentWall, currentUp));
    }

    return anomaly;
  });
}

/** Test/debug: TimeGuard durumunu tamamen sıfırla. */
export async function resetTimeGuard(): Promise<void> {
  await withLock(async () => {
    try {
      await AsyncStorage.multiRemove([TIMEGUARD_KEY, LEGACY_KEY]);
    } catch (e) {
      handleAsyncError('TimeGuard.reset', e);
    }
  });
}
