import type { WidgetSnapshot } from './snapshot';
import { buildContentPool, type WidgetContent } from './content';

export const HISTORY_LOOKBACK = 5;

/**
 * Pick `slotCount` contents to render from the snapshot pool, biasing away from
 * recently-shown items and from same-group repetition within the same render.
 *
 * Algorithm:
 *  1. Build the pool from snapshot (new-user pool if isNew).
 *  2. Filter out items whose id appears in the last HISTORY_LOOKBACK ids.
 *     Fall back to the full pool if the filtered pool would be empty.
 *  3. Repeatedly pick items via weighted random; after each pick remove items
 *     sharing a tag so two slots don't show the same kind of card.
 *     If the compat-filtered pool empties, relax the rule to allow same-group
 *     items (different ids) before duplicating ids.
 */
export function selectContent(
  snapshot: WidgetSnapshot,
  recentIds: string[],
  slotCount: 1 | 2 | 4 | 6,
): WidgetContent[] {
  const pool = buildContentPool(snapshot);
  if (pool.length === 0) return [];

  const recentSet = new Set(recentIds.slice(-HISTORY_LOOKBACK));
  const fresh = pool.filter((c) => !recentSet.has(c.id));
  const initial = fresh.length > 0 ? fresh : pool;

  return pickMultiple(initial, pool, slotCount);
}

function pickMultiple(
  preferred: WidgetContent[],
  fullPool: WidgetContent[],
  count: number,
): WidgetContent[] {
  const selected: WidgetContent[] = [];
  let candidates = [...preferred];

  while (selected.length < count) {
    if (candidates.length === 0) {
      // Tier 1 fallback: re-add same-group items (different id) we filtered out.
      candidates = fullPool.filter(
        (c) => !selected.some((s) => s.id === c.id),
      );
      if (candidates.length === 0) break;
    }

    const item = weightedPick(candidates);
    if (!item) break;

    selected.push(item);

    // Remove the picked item plus items sharing any tag so the next slot
    // is visually distinct. Tag-overlap means "same dimension of content".
    candidates = candidates.filter(
      (c) => c.id !== item.id && !c.tags.some(t => item.tags.includes(t)),
    );
  }

  return selected;
}

function weightedPick<T extends { weight: number }>(items: T[]): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (total <= 0) return items[0];
  let r = Math.random() * total;
  for (const item of items) {
    r -= Math.max(0, item.weight);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
