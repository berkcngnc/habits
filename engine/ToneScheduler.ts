export type ToneBucket =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'passive_aggressive';

// 4 gün üst üste app açılmamışsa ton "pasif-agresif veda"ya geçer.
// 7 gün → tüm reminder zinciri durur, sadece haftada bir hatırlatma kalır.
export const PASSIVE_AGGRESSIVE_THRESHOLD_DAYS = 4;
export const SILENT_MODE_THRESHOLD_DAYS = 7;

const VARIANTS_PER_BUCKET = 3;

export interface ToneKeys {
  bucket: ToneBucket;
  titleKey: string;
  bodyKey: string;
}

export function pickToneBucket(now: Date, inactivityDays: number): ToneBucket {
  if (inactivityDays >= PASSIVE_AGGRESSIVE_THRESHOLD_DAYS) return 'passive_aggressive';
  const h = now.getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// Deterministic daily rotation: same user sees variant A on Monday, B on Tuesday, …
// Avoids the "I keep seeing the same line" notification blindness.
export function pickToneKeys(bucket: ToneBucket, when: Date): ToneKeys {
  if (bucket === 'passive_aggressive') {
    return {
      bucket,
      titleKey: 'notif_passive_aggressive_title',
      bodyKey: 'notif_passive_aggressive_body',
    };
  }
  const dayOfYear = Math.floor(
    (when.getTime() - new Date(when.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const idx = (((dayOfYear % VARIANTS_PER_BUCKET) + VARIANTS_PER_BUCKET) % VARIANTS_PER_BUCKET) + 1;
  return {
    bucket,
    titleKey: `notif_tone_${bucket}_title`,
    bodyKey: `notif_tone_${bucket}_body_${idx}`,
  };
}
