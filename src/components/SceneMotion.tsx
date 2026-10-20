import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { afterVisiblePaint, prepareOpening } from '../openingReady';
/** Keep startup phase changes inside the fixed overlay, outside Motion layout commits. */
export function Opening({ enabled, route }: { enabled: boolean; route: string }) {
  const screen = useRef<HTMLDivElement>(null);
  const initialRoute = useRef(route);
  const [active, setActive] = useState(() => {
    if (!enabled) return false;
    try { return sessionStorage.getItem('longday:opening') !== 'seen'; } catch { return true; }
  });
  const remember = useCallback(() => {
    try { sessionStorage.setItem('longday:opening', 'seen'); } catch { /* The component still remembers this visit. */ }
  }, []);
  const finish = useCallback(() => { remember(); setActive(false); }, [remember]);
  useEffect(() => {
    if (!enabled || route !== initialRoute.current) finish();
  }, [enabled, route, finish]);
  useEffect(() => {
    const root = screen.current;
    if (!root || !active || !enabled) return;
    const controller = new AbortController();
    const visibility = () => { root.dataset.visible = String(document.visibilityState === 'visible'); };
    const hide = () => { root.dataset.visible = 'false'; };
    const end = (event: AnimationEvent) => {
      if (event.animationName === 'shutter-down' && root.dataset.phase === 'playing') finish();
    };
    // Native events stay local to this overlay; per-phase React commits would
    // also schedule Motion's page-wide projection/layout work during startup.
    root.dataset.phase = 'preparing'; visibility();
    root.addEventListener('animationend', end);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pageshow', visibility); window.addEventListener('pagehide', hide);
    void (async () => {
      const result = await prepareOpening(controller.signal);
      if (controller.signal.aborted) return;
      root.dataset.readiness = result;
      root.dataset.phase = 'armed';
      await afterVisiblePaint(controller.signal);
      if (controller.signal.aborted) return;
      root.dataset.phase = 'playing';
      remember();
    })().catch(() => { if (!controller.signal.aborted) finish(); });
    return () => {
      controller.abort(); root.removeEventListener('animationend', end);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pageshow', visibility); window.removeEventListener('pagehide', hide);
    };
  }, [active, enabled, finish, remember]);
  return active && enabled ? <div ref={screen} className="opening" aria-hidden="true" data-testid="opening" data-phase="preparing" data-visible={document.visibilityState === 'visible'}><div className="opening-shutter shutter-top" /><div className="opening-shutter shutter-bottom" /><div className="opening-glow glow-gold" /><div className="opening-glow glow-amber" /><div className="opening-signature"><span>LongDay<span className="opening-dot">.</span></span><small>HaGooLongDay</small></div><div className="opening-horizon" /></div> : null;
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
