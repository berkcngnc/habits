import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import type { WidgetSnapshot } from './snapshot';
import type { WidgetContent } from './content';
import { Slot, SlotCell } from './Slot';
import { paneGridForSize } from './slotLayout';

type Props = {
  info: WidgetInfo;
  snapshot: WidgetSnapshot | null;
  contents: WidgetContent[];
};

const RADIUS = 16;

const THEME = {
  dark:  { bg: '#0a0a0a', border: '#27272a', text: '#f4f4f5' },
  light: { bg: '#ffffff', border: '#e4e4e7', text: '#18181b' },
};

export function HabitsWidget({ info, snapshot, contents }: Props) {
  const lang = snapshot?.lang ?? 'en';
  const isDark = snapshot?.isDark ?? true;
  const T = isDark ? THEME.dark : THEME.light;
  const grid = paneGridForSize(info.width, info.height);
  const visible = contents.slice(0, grid.total);

  if (visible.length === 0) {
    return <ColdStartFallback isDark={isDark} />;
  }

  // Single pane — stretches to fill the whole widget, content centered.
  if (grid.total === 1 || visible.length === 1) {
    return <Slot content={visible[0]} lang={lang} isDark={isDark} />;
  }

  // Compute exact cell dimensions so every pane is guaranteed equal size.
  // flex: 1 in RemoteViews LinearLayout uses wrap_content + weight which
  // distributes space unequally when cell contents differ in natural width.
  const DIV = 1; // divider thickness in dp
  const cellW = Math.floor((info.width  - DIV * Math.max(0, grid.cols - 1)) / grid.cols);
  const cellH = Math.floor((info.height - DIV * Math.max(0, grid.rows - 1)) / grid.rows);

  // Multi-pane grid: build rows × cols with 1dp dividers between cells.
  const rowNodes: React.ReactNode[] = [];
  for (let r = 0; r < grid.rows; r++) {
    const rowCells: React.ReactNode[] = [];
    for (let c = 0; c < grid.cols; c++) {
      const idx = r * grid.cols + c;
      const content = visible[idx];
      if (!content) continue;
      rowCells.push(
        <SlotCell key={`cell-${r}-${c}`} content={content} lang={lang} isDark={isDark} cellWidth={cellW} />,
      );
      if (c < grid.cols - 1 && visible[r * grid.cols + c + 1]) {
        rowCells.push(
          <FlexWidget
            key={`vdiv-${r}-${c}`}
            style={{ width: DIV, height: 'match_parent', backgroundColor: T.border as `#${string}` }}
          />,
        );
      }
    }
    if (rowCells.length === 0) continue;
    rowNodes.push(
      <FlexWidget
        key={`row-${r}`}
        style={{ width: 'match_parent', height: cellH, flexDirection: 'row' }}
      >
        {rowCells}
      </FlexWidget>,
    );
    if (r < grid.rows - 1 && visible[(r + 1) * grid.cols]) {
      rowNodes.push(
        <FlexWidget
          key={`hdiv-${r}`}
          style={{ width: 'match_parent', height: DIV, backgroundColor: T.border as `#${string}` }}
        />,
      );
    }
  }

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: T.bg as `#${string}`,
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: T.border as `#${string}`,
        flexDirection: 'column',
      }}
    >
      {rowNodes}
    </FlexWidget>
  );
}

function ColdStartFallback({ isDark }: { isDark: boolean }) {
  const T = isDark ? THEME.dark : THEME.light;
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: T.bg as `#${string}`,
        borderRadius: RADIUS,
        borderWidth: 1,
        borderColor: T.border as `#${string}`,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget
        text="habits."
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: T.text as `#${string}`,
        }}
      />
    </FlexWidget>
  );
}
