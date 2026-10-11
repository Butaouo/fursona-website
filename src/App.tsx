import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { site } from './config/site';
import { usePreferences } from './hooks/usePreferences';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Socials } from './components/Socials';
import { Music } from './components/Music';
import { Gallery } from './components/Gallery';
import { Background } from './components/Background';
import { GlassFilters } from './components/Glass';
import { Icon } from './components/Icon';

export default function App() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  return <LazyMotion features={domAnimation}><MotionConfig reducedMotion={preferences.motionEnabled ? 'user' : 'always'}>
    <a className="skip-link" href="#main">{t('skip')}</a>
    <GlassFilters /><Background enabled={preferences.motionEnabled} />
    <Header preferences={preferences} />
    <main id="main"><Hero language={preferences.language} animated={preferences.motionEnabled} />
      <div className="section-divider page-width" aria-hidden="true"><span />✳<span /></div>
      <section id="connect" className="connect-section page-width" aria-labelledby="connect-heading"><Socials /><Music language={preferences.language} /></section>
      <Gallery language={preferences.language} />
    </main>
    <footer className="page-width site-footer"><div><a className="footer-brand" href="#home">{site.name}<span>.</span></a><p>{t('footerLine')}</p></div><div className="footer-right"><a href="#home" className="back-top">{t('backTop')}<Icon name="up" /></a><p>© {new Date().getFullYear()} {site.englishName}</p><small>{t('rights')}</small></div></footer>
    <button className="motion-control glass-button" type="button" onClick={() => preferences.setPaused(v => !v)} aria-label={preferences.paused ? t('resumeMotion') : t('pauseMotion')} aria-pressed={preferences.paused} title={preferences.paused ? t('resumeMotion') : t('pauseMotion')}><Icon name={preferences.paused ? 'play' : 'pause'} /><span className="motion-tooltip">{preferences.paused ? t('resumeMotion') : t('pauseMotion')}</span></button>
  </MotionConfig></LazyMotion>;
}
