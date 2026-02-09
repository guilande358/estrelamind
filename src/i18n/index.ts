import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import frFR from './locales/fr-FR.json';
import esES from './locales/es-ES.json';

export const supportedLanguages = ['pt-BR', 'en-US', 'fr-FR', 'es-ES'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

export const languageFlags: Record<SupportedLanguage, string> = {
  'pt-BR': '🇧🇷',
  'en-US': '🇺🇸',
  'fr-FR': '🇫🇷',
  'es-ES': '🇪🇸',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'fr-FR': { translation: frFR },
      'es-ES': { translation: esES },
    },
    fallbackLng: 'pt-BR',
    supportedLngs: supportedLanguages,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'mindflow_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
