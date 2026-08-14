import { translations, type LanguageCode } from '../locales';

const SUPPORTED: readonly LanguageCode[] = ['tr', 'en', 'es', 'de', 'fr', 'zh', 'it'];

function isSupported(lang: string): lang is LanguageCode {
  return (SUPPORTED as readonly string[]).includes(lang);
}

/**
 * Widget-side translation lookup. Cannot use the React useLanguage() hook
 * because the widget renders inside a headless task. Reads the translations
 * map directly with English fallback.
 */
export function widgetT(key: string, lang: string): string {
  const code: LanguageCode = isSupported(lang) ? lang : 'en';
  return translations[code]?.[key]
    ?? translations.en?.[key]
    ?? key;
}
