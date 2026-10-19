import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { afterVisiblePaint, prepareOpening } from '../openingReady';
/** Resource readiness and visible paint precede the CSS presentation timeline. */
export function Opening({ enabled, route }: { enabled: boolean; route: string }) {
  const { t } = useTranslation();
  const initialRoute = useRef(route);
  const [phase, setPhase] = useState<'preparing' | 'armed' | 'playing' | 'done'>(() => {
    if (!enabled) return 'done';
    try { return sessionStorage.getItem('longday:opening') === 'seen' ? 'done' : 'preparing'; } catch { return 'preparing'; }
  });
  const [readiness, setReadiness] = useState<'ready' | 'timeout'>();
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');
  const remember = useCallback(() => {
    try { sessionStorage.setItem('longday:opening', 'seen'); } catch { /* The component still remembers this visit. */ }
  }, []);
  const finish = useCallback(() => { remember(); setPhase('done'); }, [remember]);
  useEffect(() => {
    if (!enabled || route !== initialRoute.current) { finish(); return; }
    if (phase !== 'preparing') return;
    const controller = new AbortController();
    void prepareOpening(controller.signal).then(result => {
      if (!controller.signal.aborted) { setReadiness(result); setPhase('armed'); }
    }).catch(() => { /* Navigation, skip or StrictMode cleanup cancels preparation. */ });
    return () => controller.abort();
  }, [enabled, route, phase, finish]);
  useEffect(() => {
    if (phase !== 'armed' || !enabled) return;
    const controller = new AbortController();
    void afterVisiblePaint(controller.signal).then(() => {
      if (!controller.signal.aborted) setPhase('playing');
    }).catch(() => {});
    return () => controller.abort();
  }, [phase, enabled]);
  useEffect(() => { if (phase === 'playing') remember(); }, [phase, remember]);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    const hide = () => setVisible(false);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update); window.addEventListener('pagehide', hide);
    update();
    return () => {
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('pageshow', update); window.removeEventListener('pagehide', hide);
    };
  }, []);
  return phase !== 'done' && enabled ? <div className="opening" data-testid="opening" data-phase={phase} data-readiness={readiness} data-visible={visible} onAnimationEnd={event => {
    // CSS elapsed time advances only while the visible presentation is playing.
    if (event.animationName === 'shutter-down' && phase === 'playing') finish();
  }}><div aria-hidden="true"><div className="opening-shutter shutter-top" /><div className="opening-shutter shutter-bottom" /><div className="opening-glow glow-gold" /><div className="opening-glow glow-amber" /><div className="opening-signature"><span>LongDay<span className="opening-dot">.</span></span><small>HaGooLongDay</small></div><div className="opening-horizon" /></div><button type="button" className="opening-skip" onClick={finish}>{t('skipOpening')} <span aria-hidden="true">↗</span></button></div> : null;
}
/** Observe real content nodes, preserving semantics and reader ordering. */
export function SceneMotion({ children, enabled }: PropsWithChildren<{ enabled: boolean }>) {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scene.current;
    if (!root || !enabled || !('IntersectionObserver' in window)) return;
    const selector = '.social-panel,.music-panel,.section-heading,.gallery-panel,.character-notes,.content-heading,.reader-heading,.reader-body > *, .archive-card,.empty-state';
    const elements = new Set<HTMLElement>();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.revealed = 'true'; observer.unobserve(entry.target); }
    }), { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    const collect = () => root.querySelectorAll<HTMLElement>(selector).forEach(el => {
      if (elements.has(el)) return;
      elements.add(el); el.classList.add('scene-reveal');
      if (el.getBoundingClientRect().top < innerHeight * .94) el.dataset.revealed = 'true';
      else observer.observe(el);
    });
    collect(); const mutations = new MutationObserver(collect); mutations.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); elements.forEach(el => { el.classList.remove('scene-reveal'); delete el.dataset.revealed; }); };
  }, [enabled]);
  return <div ref={scene} className="scene-content">{children}</div>;
}
