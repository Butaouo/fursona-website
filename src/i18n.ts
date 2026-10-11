import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './config/translations';
import { readPreference, resolveLanguage } from './lib';

void i18n.use(initReactI18next).init({
  resources: { 'zh-TW': { translation: translations['zh-TW'] }, en: { translation: translations.en } },
  lng: resolveLanguage(readPreference('language'), navigator.language),
  fallbackLng: 'zh-TW', supportedLngs: ['zh-TW', 'en'],
  interpolation: { escapeValue: false }, initAsync: false,
});
export default i18n;
