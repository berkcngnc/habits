const MILESTONES = [1, 3, 7, 14, 30, 90, 365] as const;

export type QuittingFrame = 'money' | 'time' | 'streak';
export type QuittingDayKind = 'pre_milestone' | 'post_milestone' | 'plateau' | 'near_record' | 'record_chase';
export type QuittingTimeSlot = 'morning' | 'evening';

export function pickQuittingFrame(
  costPerDay: number | undefined,
  timePerDay: number | undefined,
): QuittingFrame {
  if ((costPerDay ?? 0) > 0) return 'money';
  if ((timePerDay ?? 0) > 0) return 'time';
  return 'streak';
}

export function classifyQuittingDay(futureDays: number, best: number): QuittingDayKind {
  const next = MILESTONES.find(m => m > futureDays);
  if (next !== undefined && next - futureDays <= 3) return 'pre_milestone';

  const prev = [...MILESTONES].reverse().find(m => m <= futureDays);
  if (prev !== undefined && futureDays - prev <= 3) return 'post_milestone';

  if (best > 0 && futureDays >= best) return 'record_chase';
  if (best > 0 && best - futureDays <= 5) return 'near_record';

  return 'plateau';
}

export function computeQuittingSavings(
  costPerDay: number | undefined,
  timePerDay: number | undefined,
  days: number,
): { money: number; hoursSaved: number; minutesSaved: number } {
  const totalMinutes = Math.floor((timePerDay ?? 0) * days);
  return {
    money: Math.floor((costPerDay ?? 0) * days),
    hoursSaved: Math.floor(totalMinutes / 60),
    minutesSaved: totalMinutes % 60,
  };
}

export function formatMoneySaved(money: number, currency: string): string {
  return `${money}${currency}`;
}

export function formatTimeReclaimed(
  hours: number,
  minutes: number,
  hoursShort: string,
  minutesShort: string,
): string {
  if (hours >= 1) return `${hours}${hoursShort}`;
  return `${minutes}${minutesShort}`;
}

export function nextMilestone(days: number): { milestone: number } | null {
  const m = MILESTONES.find(m => m > days);
  return m !== undefined ? { milestone: m } : null;
}
