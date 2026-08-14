// Each "pane" is a 2×2 home-screen cell block — the smallest unit shown.
// Below 2×2 (≈140dp × 140dp) we fall back to a single pane stretched to fill.
const PANE_DP = 140;

export interface PaneGrid {
  cols: number;
  rows: number;
  total: number;
}

/**
 * Lay the widget area out as a grid of fixed-aspect 2×2 panes.
 *
 *   <2×2 / 2×2 / 3×2 / 2×3 / 3×3  → 1×1 (single pane, fills + centers)
 *   4×2                           → 2×1 (two panes side-by-side)
 *   2×4                           → 1×2 (two panes stacked)
 *   4×4                           → 2×2 grid
 *   6×2                           → 3×1
 *   4×6                           → 2×3
 */
export function paneGridForSize(widthDp: number, heightDp: number): PaneGrid {
  const cols = Math.max(1, Math.floor(widthDp / PANE_DP));
  const rows = Math.max(1, Math.floor(heightDp / PANE_DP));
  return { cols, rows, total: cols * rows };
}
