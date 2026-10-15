import { lazy, Suspense } from 'react';
import { LazyMotion, MotionConfig, domMax, m, AnimatePresence } from 'motion/react';
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
import { AnimationContext } from './components/AnimatedText';
import { useRoute } from './router';
import { copy } from './content';
const ContentPages = lazy(() => import('./pages/ContentPages'));

export default function App() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const route = useRoute();
  return <AnimationContext value={preferences.motionEnabled}><LazyMotion features={domMax}><MotionConfig reducedMotion={preferences.motionEnabled ? 'user' : 'always'}>
    <a className="skip-link" href="#main">{t('skip')}</a>
    <GlassFilters /><Background enabled={preferences.motionEnabled} />
    <Header preferences={preferences} />
    <main id="main" tabIndex={-1}><AnimatePresence mode="wait" initial={false}><m.div key={route} initial={{ opacity: 0, y: preferences.motionEnabled ? 8 : 0 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: preferences.motionEnabled ? .2 : 0 }}>
    {route ? <Suspense fallback={<p className="page-width content-loading" role="status">{copy('loading', preferences.language)}</p>}><ContentPages route={route} language={preferences.language} /></Suspense> : <><Hero language={preferences.language} animated={preferences.motionEnabled} />
      <div className="section-divider page-width" aria-hidden="true"><span />✳<span /></div>
      <section id="connect" className="connect-section page-width" aria-labelledby="connect-heading"><Socials /><Music language={preferences.language} /></section>
      <Gallery language={preferences.language} /></>}
    </m.div></AnimatePresence>
    </main>
    <footer className="page-width site-footer"><div><a className="footer-brand" href="#home">{site.name}<span>.</span></a><p>{t('footerLine')}</p></div><div className="footer-right"><a href="#home" className="back-top">{t('backTop')}<Icon name="up" /></a><p>© {new Date().getFullYear()} {site.englishName}</p><small>{t('rights')}</small></div></footer>
    <button className="motion-control glass-button" type="button" onClick={() => preferences.setPaused(v => !v)} aria-label={preferences.paused ? t('resumeMotion') : t('pauseMotion')} aria-pressed={preferences.paused} title={preferences.paused ? t('resumeMotion') : t('pauseMotion')}><Icon name={preferences.paused ? 'play' : 'pause'} /><span className="motion-tooltip">{preferences.paused ? t('resumeMotion') : t('pauseMotion')}</span></button>
  </MotionConfig></LazyMotion></AnimationContext>;
}
