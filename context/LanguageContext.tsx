import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { LanguageCode, translations } from '../locales';
import { sanitizeForPixelFont } from '../utils/fontSanitizer';

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const LANGUAGE_KEY = '@app_language';

const SUPPORTED_LANGUAGES: LanguageCode[] = ['tr', 'en', 'es', 'de', 'fr', 'zh', 'it'];

// Get device locale safely
const getDeviceLanguage = (): LanguageCode => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const langCode = locales[0].languageCode;
    if (langCode && SUPPORTED_LANGUAGES.includes(langCode as LanguageCode)) {
      return langCode as LanguageCode;
    }
  }
  return 'en'; // default fallback
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cihaz dilini lazy-init: AsyncStorage hidrasyonunu beklemek yerine cold start'ta
  // hemen mount ol. Stored override sonradan async güncelleniyor — kullanıcı yanlış
  // dilde tek render görse de blank ekrandan iyi.
  const [language, setLanguageState] = useState<LanguageCode>(() => getDeviceLanguage());

  useEffect(() => {
    const loadLang = async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (stored && SUPPORTED_LANGUAGES.includes(stored as LanguageCode)) {
          setLanguageState(stored as LanguageCode);
        }
      } catch (e) {
        if (__DEV__) console.warn('[LanguageContext] Failed to load stored language', e);
      }
    };
    loadLang();
  }, []);

  const setLanguage = async (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      // Notification categories are set up once on app start in HabitsContext.
      // Re-running setup on language change causes Android category mismatch.
    } catch (e) {
      console.error('[LanguageContext] Failed to persist language', e);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let effectiveKey = key;

    // Plural seçimi — sadece count sayı ise ve plural varyantı varsa (basit tekil/çoğul)
    if (params && typeof params.count === 'number') {
      const suffix = params.count === 1 ? '_one' : '_other';
      const candidate = `${key}${suffix}`;
      if (translations[language]?.[candidate] || translations['en']?.[candidate]) {
        effectiveKey = candidate;
      }
    }

    let text =
      translations[language]?.[effectiveKey]
      ?? translations['en']?.[effectiveKey]
      ?? translations[language]?.[key]
      ?? translations['en']?.[key]
      ?? key;

    // {placeholder} interpolation
    if (params) {
      Object.keys(params).forEach(p => {
        text = text.split(`{${p}}`).join(String(params[p]));
      });
    }

    return sanitizeForPixelFont(text);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
