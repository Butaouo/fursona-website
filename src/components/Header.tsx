import { useTranslation } from 'react-i18next';
import { asset, site } from '../config/site';
import type { usePreferences } from '../hooks/usePreferences';
import { Icon } from './Icon';
import { Glass } from './Glass';
type Preferences = ReturnType<typeof usePreferences>;
export function Header({ preferences: p }: { preferences: Preferences }) {
  const { t } = useTranslation();
  return <header className="site-header page-width">
    <a className="wordmark" href="#home" aria-label={`${site.name} · ${t('home')}`}><img src={asset(site.images.avatar)} alt="" width="40" height="40" /><span>LongDay<span className="wordmark-dot">.</span><small>HaGooLongDay</small></span></a>
    <nav className="desktop-nav" aria-label={t('navLabel')}><a href="#home">{t('home')}</a><a href="#connect">{t('connect')}</a><a href="#fursona">{t('gallery')}</a></nav>
    <div className="header-tools">
      <Glass className="theme-control"><div role="group" aria-label={t('theme')}>
        {(['light', 'dark', 'system'] as const).map(mode => <button key={mode} type="button" data-testid={`theme-${mode}`} aria-label={t(mode)} title={t(mode)} aria-pressed={p.theme === mode} className={`icon-button ${p.theme === mode ? 'selected' : ''}`} onClick={() => p.setTheme(mode)}><Icon name={mode === 'light' ? 'sun' : mode === 'dark' ? 'moon' : 'monitor'} /></button>)}
      </div></Glass>
      <button type="button" className="language-button glass-button" onClick={p.toggleLanguage} aria-label={t('language')}><Icon name="globe" /><span>{p.language === 'zh-TW' ? 'EN' : '繁'}</span></button>
    </div>
  </header>;
}
