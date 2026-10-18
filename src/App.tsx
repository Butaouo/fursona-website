import { lazy, Suspense } from 'react';
import { LazyMotion, MotionConfig, domMax, m, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { site } from './config/site';
import { usePreferences } from './hooks/usePreferences';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Socials } from './components/Socials';
import { Music } from './components/Music';
import { Background } from './components/Background';
import { GlassFilters } from './components/Glass';
import { Icon } from './components/Icon';
import { AnimationContext } from './components/AnimatedText';
import { useRoute } from './router';
import { copy } from './content';
import { Opening, SceneMotion } from './components/SceneMotion';
import { usePageMetadata } from './hooks/usePageMetadata';
const ContentPages = lazy(() => import('./pages/ContentPages'));

export default function App() {
  const { t } = useTranslation();
  const preferences = usePreferences();
  const route = useRoute();
  usePageMetadata(route, preferences.language);
  return <AnimationContext value={preferences.motionEnabled}><LazyMotion features={domMax}><MotionConfig reducedMotion={preferences.motionEnabled ? 'user' : 'always'}>
    <a className="skip-link" href="#main">{t('skip')}</a>
    <GlassFilters /><Background enabled={preferences.motionEnabled} route={route} /><Opening enabled={preferences.motionEnabled} />
    <Header preferences={preferences} />
    <main id="main" tabIndex={-1}><AnimatePresence mode="wait" initial={false}><m.div key={route} className="route-scene" initial={{ opacity: 0, y: preferences.motionEnabled ? 24 : 0, scale: preferences.motionEnabled ? .985 : 1 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: preferences.motionEnabled ? -16 : 0 }} transition={{ duration: preferences.motionEnabled ? .32 : 0, ease: [.22, 1, .36, 1] }}><SceneMotion enabled={preferences.motionEnabled}>{preferences.motionEnabled && <div className="route-light" aria-hidden="true" />}
    {route ? <Suspense fallback={<p className="page-width content-loading" role="status">{copy('loading', preferences.language)}</p>}><ContentPages route={route} language={preferences.language} /></Suspense> : <><Hero language={preferences.language} animated={preferences.motionEnabled} />
      <div className="section-divider page-width" aria-hidden="true"><span />✳<span /></div>
      <section id="connect" className="connect-section page-width" aria-labelledby="connect-heading"><Socials /><Music language={preferences.language} /></section>
      </>}
    </SceneMotion></m.div></AnimatePresence>
    </main>
    <footer className="page-width site-footer"><div><a className="footer-brand" href="#home">{site.name}<span>.</span></a><p>{t('footerLine')}</p></div><div className="footer-right"><a href="#home" className="back-top">{t('backTop')}<Icon name="up" /></a><p>© {new Date().getFullYear()} {site.englishName}</p><small>{t('rights')}</small></div></footer>
    <button className="motion-control glass-button" type="button" onClick={() => preferences.setPaused(v => !v)} aria-label={preferences.paused ? t('resumeMotion') : t('pauseMotion')} aria-pressed={preferences.paused} title={preferences.paused ? t('resumeMotion') : t('pauseMotion')}><Icon name={preferences.paused ? 'play' : 'pause'} /><span className="motion-tooltip">{preferences.paused ? t('resumeMotion') : t('pauseMotion')}</span></button>
  </MotionConfig></LazyMotion></AnimationContext>;
}
