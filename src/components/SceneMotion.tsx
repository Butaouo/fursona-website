import { useEffect, useRef, useState, type PropsWithChildren } from 'react';
/** A non-blocking, once-per-tab opening. Returning home never replays it. */
export function Opening({ enabled }: { enabled: boolean }) {
  const [active, setActive] = useState(() => {
    if (!enabled) return false;
    try { return sessionStorage.getItem('longday:opening') !== 'seen'; } catch { return true; }
  });
  useEffect(() => {
    if (!active) return;
    try { sessionStorage.setItem('longday:opening', 'seen'); } catch { /* memory state still prevents replay */ }
    const timer = setTimeout(() => setActive(false), 1150);
    return () => clearTimeout(timer);
  }, [active]);
  return active && enabled ? <div className="opening" aria-hidden="true" data-testid="opening"><div className="opening-shutter shutter-top" /><div className="opening-shutter shutter-bottom" /><div className="opening-signature"><span>LongDay<span className="opening-dot">.</span></span><small>HaGooLongDay</small></div><div className="opening-horizon" /></div> : null;
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
