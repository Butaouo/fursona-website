import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { afterVisiblePaint, prepareOpening } from '../openingReady';
/** Keep startup phase changes inside the fixed overlay, outside Motion layout commits. */
export function Opening({ enabled, route }: { enabled: boolean; route: string }) {
  const screen = useRef<HTMLDivElement>(null);
  const horizon = useRef<HTMLDivElement>(null);
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
    const line = horizon.current;
    if (!root || !line || !active || !enabled) return;
    const controller = new AbortController();
    let resizeFrame = 0;
    const measureCut = () => {
      // Match the line's rendered center in the fixed overlay's coordinates.
      // Once the split begins, viewport changes must not move its origin.
      const [animation] = line.getAnimations();
      if (animation && Number(animation.currentTime) >= 3496) return;
      const bounds = line.getBoundingClientRect();
      const overlay = root.getBoundingClientRect();
      root.style.setProperty('--opening-cut', `${bounds.top + bounds.height / 2 - overlay.top}px`);
    };
    const resize = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; measureCut(); });
    };
    const viewport = window.visualViewport;
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : undefined;
    observer?.observe(root);
    window.addEventListener('resize', resize);
    viewport?.addEventListener('resize', resize);
    measureCut();
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
      measureCut();
      root.dataset.phase = 'playing';
      remember();
    })().catch(() => { if (!controller.signal.aborted) finish(); });
    return () => {
      controller.abort(); root.removeEventListener('animationend', end);
      cancelAnimationFrame(resizeFrame); observer?.disconnect();
      window.removeEventListener('resize', resize);
      viewport?.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pageshow', visibility); window.removeEventListener('pagehide', hide);
    };
  }, [active, enabled, finish, remember]);
  return active && enabled ? <div ref={screen} className="opening" aria-hidden="true" data-testid="opening" data-phase="preparing" data-visible={document.visibilityState === 'visible'}><div className="opening-shutter shutter-top" /><div className="opening-shutter shutter-bottom" /><div className="opening-glow glow-gold" /><div className="opening-glow glow-amber" /><div className="opening-signature"><span>LongDay<span className="opening-dot">.</span></span><small>HaGooLongDay</small></div><div ref={horizon} className="opening-horizon" /></div> : null;
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
    const collect = () => {
      const added = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(el => !elements.has(el));
      // Read positions together before writing reveal classes. Interleaved
      // writes/measurements otherwise force a layout for each new reader block.
      const edge = innerHeight * .94;
      const visible = added.map(el => el.getBoundingClientRect().top < edge);
      added.forEach((el, index) => {
        elements.add(el); el.classList.add('scene-reveal');
        if (visible[index]) el.dataset.revealed = 'true';
        else observer.observe(el);
      });
    };
    collect(); const mutations = new MutationObserver(collect); mutations.observe(root, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutations.disconnect(); elements.forEach(el => { el.classList.remove('scene-reveal'); delete el.dataset.revealed; }); };
  }, [enabled]);
  return <div ref={scene} className="scene-content">{children}</div>;
}
