import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetContent, WidgetContentType } from './content';
import { widgetT } from './widgetT';
import { getDeepLinkUri } from './deepLink';

// ─── Design tokens ──────────────────────────────────────────────────

type ThemeColors = {
  bg: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  textFaint: string;
  streak: string;
  risk: string;
  progress: string;
  xp: string;
  achievement: string;
  money: string;
  time: string;
  body: string;
  clean: string;
};

const SHARED_ACCENTS = {
  streak: '#f97316',
  risk: '#f59e0b',
  progress: '#3b82f6',
  xp: '#a855f7',
  achievement: '#eab308',
  money: '#22c55e',
  time: '#06b6d4',
  body: '#14b8a6',
  clean: '#3b82f6',
};

const DARK_C: ThemeColors = {
  bg: '#0a0a0a',
  border: '#27272a',
  textPrimary: '#f4f4f5',
  textMuted: '#a1a1aa',
  textFaint: '#71717a',
  ...SHARED_ACCENTS,
};

const LIGHT_C: ThemeColors = {
  bg: '#ffffff',
  border: '#e4e4e7',
  textPrimary: '#18181b',
  textMuted: '#52525b',
  textFaint: '#a1a1aa',
  ...SHARED_ACCENTS,
};

const HEATMAP_DARK = ['#27272a', '#14532d', '#15803d', '#22c55e'] as const;
const HEATMAP_LIGHT = ['#e4e4e7', '#bbf7d0', '#4ade80', '#16a34a'] as const;

function heatmapBg(v: number, isDark: boolean): string {
  const tiers = isDark ? HEATMAP_DARK : HEATMAP_LIGHT;
  if (v <= 0) return tiers[0];
  if (v < 0.4) return tiers[1];
  if (v < 0.75) return tiers[2];
  return tiers[3];
}

// ─── Public exports ─────────────────────────────────────────────────

interface SlotProps {
  content: WidgetContent;
  lang: string;
  isDark?: boolean;
  cellWidth?: number;
}

// Full card variant — rounded border + background (single-slot layouts).
export function Slot({ content, lang, isDark = true }: SlotProps) {
  const uri = getDeepLinkUri(content);
  const C = isDark ? DARK_C : LIGHT_C;
  return (
    <Frame uri={uri} C={C}>
      <SlotBody content={content} lang={lang} C={C} isDark={isDark} />
    </Frame>
  );
}

// Cell variant — no card border, fills its flex parent; used inside the
// unified multi-slot container in HabitsWidget.
// cellWidth must be an explicit dp value for equal distribution in RemoteViews
// (LinearLayout weight+wrap_content causes unequal sizing otherwise).
export function SlotCell({ content, lang, isDark = true, cellWidth }: SlotProps) {
  const uri = getDeepLinkUri(content);
  const C = isDark ? DARK_C : LIGHT_C;
  return (
    <FlexWidget
      style={{
        width: cellWidth ?? 'match_parent',
        height: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
    >
      <SlotBody content={content} lang={lang} C={C} isDark={isDark} />
    </FlexWidget>
  );
}

// ─── Renderer registry ───────────────────────────────────────────────
// Each entry is typed to the exact data shape for its content type via
// `satisfies`. Adding a new WidgetContentType without a renderer here is
// a compile-time error — no runtime exhaustiveness sentinel needed.

type RenderCtx = { lang: string; C: ThemeColors; isDark: boolean };

type SlotRenderers = {
  [K in WidgetContentType]: (
    data: Extract<WidgetContent, { type: K }>['data'],
    ctx: RenderCtx,
  ) => React.ReactElement;
};

const SLOT_RENDERERS = {
  streak_spotlight: (data, { C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Hero text="🔥" C={C} />
      <BigNumber text={String(data.streak)} color={C.streak} />
      <Sub text={data.title} C={C} />
    </FlexWidget>
  ),

  at_risk: (data, { C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Hero text="⚠" color={C.risk} C={C} />
      <BigNumber text={String(data.streak)} color={C.risk} />
      <Sub text={data.title} C={C} />
    </FlexWidget>
  ),

  up_next: (data, { lang, C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Hero text="✅" color={C.progress} C={C} />
      <TextWidget
        text={data.title}
        maxLines={2}
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: C.textPrimary as `#${string}`,
          textAlign: 'center',
          marginBottom: 2,
          adjustsFontSizeToFit: true,
        }}
      />
      <Sub text={widgetT('widget_label_up_next', lang)} C={C} />
    </FlexWidget>
  ),

  daily_progress: (data, { lang, C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <BigNumber
        text={`${data.completed} / ${data.total}`}
        color={C.progress}
      />
      <Sub text={widgetT('today', lang).toLowerCase()} C={C} />
    </FlexWidget>
  ),

  weekly_heatmap: (data, { lang, C, isDark }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Heatmap values={data.values} isDark={isDark} />
      <Sub text={widgetT('widget_label_last7', lang)} C={C} />
    </FlexWidget>
  ),

  xp_progress: (data, { lang, C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <BigNumber text={`Lv ${data.level}`} color={C.xp} />
      <Sub
        text={`${data.xpToNextLevel} XP · ${widgetT('widget_label_to_next', lang)}`}
        C={C}
      />
    </FlexWidget>
  ),

  latest_achievement: (data, { C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Hero text="🏆" C={C} />
      <TextWidget
        text={data.title}
        maxLines={2}
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: C.achievement as `#${string}`,
          textAlign: 'center',
          marginBottom: 4,
          adjustsFontSizeToFit: true,
        }}
      />
    </FlexWidget>
  ),

  money_saved: (data, { C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <BigNumber
        text={`${data.amount}${data.currency}`}
        color={C.money}
      />
      <Sub text={data.title} C={C} />
    </FlexWidget>
  ),

  time_reclaimed: (data, { C }) => {
    const hours = Math.floor(data.minutes / 60);
    const display = hours >= 1 ? `${hours}h` : `${data.minutes}m`;
    return (
      <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
        <Hero text="⏱" color={C.time} C={C} />
        <BigNumber text={display} color={C.time} />
        <Sub text={data.title} C={C} />
      </FlexWidget>
    );
  },

  body_milestone: (data, { C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <BigNumber text={data.daysLabel} color={C.body} />
      <Body text={data.text} C={C} />
    </FlexWidget>
  ),

  clean_streak: (data, { C }) => (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center' }}>
      <Hero text="🛡" color={C.clean} C={C} />
      <BigNumber text={`${data.days}d`} color={C.clean} />
      <Sub text={data.title} C={C} />
    </FlexWidget>
  ),
} satisfies SlotRenderers;

// ─── Shared body renderer ────────────────────────────────────────────

interface BodyRendererProps {
  content: WidgetContent;
  lang: string;
  C: ThemeColors;
  isDark: boolean;
}

type AnyRenderer = (data: unknown, ctx: RenderCtx) => React.ReactElement;

function SlotBody({ content, lang, C, isDark }: BodyRendererProps) {
  return (SLOT_RENDERERS[content.type] as AnyRenderer)(content.data, { lang, C, isDark });
}

// ─── Building blocks ────────────────────────────────────────────────

function Frame({ children, uri, C }: { children: React.ReactNode; uri: string; C: ThemeColors }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: C.bg as `#${string}`,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border as `#${string}`,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
      }}
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
    >
      {children}
    </FlexWidget>
  );
}

function Hero({ text, color, C }: { text: string; color?: string; C: ThemeColors }) {
  return (
    <TextWidget
      text={text}
      style={{
        fontSize: 22,
        color: (color ?? C.textPrimary) as `#${string}`,
        marginBottom: 2,
      }}
    />
  );
}

function BigNumber({ text, color }: { text: string; color: string }) {
  return (
    <TextWidget
      text={text}
      maxLines={1}
      style={{
        fontSize: 30,
        fontWeight: '700',
        color: color as `#${string}`,
        marginBottom: 4,
        adjustsFontSizeToFit: true,
      }}
    />
  );
}

function Sub({ text, C }: { text: string; C: ThemeColors }) {
  return (
    <TextWidget
      text={text}
      maxLines={2}
      style={{
        fontSize: 11,
        color: C.textMuted as `#${string}`,
        textAlign: 'center',
      }}
    />
  );
}

function Body({ text, C }: { text: string; C: ThemeColors }) {
  return (
    <TextWidget
      text={text}
      maxLines={4}
      style={{
        fontSize: 12,
        color: C.textPrimary as `#${string}`,
        textAlign: 'center',
      }}
    />
  );
}

function Heatmap({ values, isDark }: { values: number[]; isDark: boolean }) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
      }}
    >
      {values.map((v, i) => (
        <FlexWidget
          key={i}
          style={{
            width: 9,
            height: 9,
            backgroundColor: heatmapBg(v, isDark) as `#${string}`,
            borderRadius: 2,
            marginHorizontal: 1,
          }}
        />
      ))}
    </FlexWidget>
  );
}
