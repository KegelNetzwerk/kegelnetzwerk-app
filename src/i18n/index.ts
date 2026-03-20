import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import de from './de.json';
import en from './en.json';

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'de';
const supportedLanguages = ['de', 'en'];
const lng = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'de';

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng,
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
});

export default i18n;
