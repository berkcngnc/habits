import type { WidgetContent } from './content';

const SCHEME = 'habits';

// Expo Router route groups like (tabs) are transparent in deep link URLs.
const URI_HABITS = `${SCHEME}:///`;
const URI_STATS = `${SCHEME}:///stats`;
const URI_EVOLUTION = `${SCHEME}:///sort`;

export function getDeepLinkUri(content: WidgetContent): string {
  switch (content.type) {
    case 'streak_spotlight':
    case 'at_risk':
    case 'up_next':
      return `${URI_HABITS}?habitId=${content.data.habitId}`;
    case 'daily_progress':
    case 'money_saved':
    case 'time_reclaimed':
    case 'body_milestone':
    case 'clean_streak':
      return URI_HABITS;
    case 'weekly_heatmap':
      return URI_STATS;
    case 'xp_progress':
    case 'latest_achievement':
      return URI_EVOLUTION;
  }
}
