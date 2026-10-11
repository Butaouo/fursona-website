import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readPreference, resolveTheme, savePreference, type ThemeChoice } from '../lib';
import type { Language } from '../config/site';

export function usePreferences() {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeChoice>(() => resolveTheme(readPreference('theme')));
  const [paused, setPaused] = useState(() => readPreference('motion') === 'paused');
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const language: Language = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-TW';
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const effective = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.dataset.theme = effective;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', effective === 'dark' ? '#1b1915' : '#f7f2e8');
    };
    apply(); media.addEventListener('change', apply);
    savePreference('theme', theme);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    savePreference('language', language);
  }, [language]);
  useEffect(() => {
    document.documentElement.dataset.motion = paused || reduced ? 'still' : 'full';
    savePreference('motion', paused ? 'paused' : 'full');
  }, [paused, reduced]);
  const toggleLanguage = () => void i18n.changeLanguage(language === 'zh-TW' ? 'en' : 'zh-TW');
  return { theme, setTheme, language, toggleLanguage, paused, setPaused, motionEnabled: !paused && !reduced };
}
