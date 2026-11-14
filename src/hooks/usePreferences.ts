import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readPreference, resolveTheme, savePreference, type ThemeChoice } from '../lib';
import type { Language } from '../config/site';

export function usePreferences() {
  const { i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeChoice>(() => resolveTheme(readPreference('theme')));
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const effectiveTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  const [paused, setPaused] = useState(() => readPreference('motion') === 'paused');
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const language: Language = i18n.resolvedLanguage === 'en' ? 'en' : 'zh-TW';
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      setSystemDark(media.matches);
      const effective = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      if (document.documentElement.dataset.theme !== effective) document.documentElement.dataset.theme = effective;
      const color = effective === 'dark' ? '#1b1915' : '#f7f2e8';
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta?.getAttribute('content') !== color) meta?.setAttribute('content', color);
    };
    apply(); media.addEventListener('change', apply);
    savePreference('theme', theme);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    // Catch a preference change between the initial render and subscribing.
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (document.documentElement.lang !== language) document.documentElement.lang = language;
    savePreference('language', language);
  }, [language]);
  useEffect(() => {
    const motion = paused || reduced ? 'still' : 'full';
    if (document.documentElement.dataset.motion !== motion) document.documentElement.dataset.motion = motion;
    savePreference('motion', paused ? 'paused' : 'full');
  }, [paused, reduced]);
  const toggleLanguage = () => void i18n.changeLanguage(language === 'zh-TW' ? 'en' : 'zh-TW');
  return { theme, effectiveTheme, setTheme, language, toggleLanguage, paused, setPaused, motionEnabled: !paused && !reduced };
}
