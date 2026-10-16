import { useEffect, useRef } from 'react';
import { effectTier, sustainedSlowFrames } from '../motionPolicy';
type DeviceNavigator = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
/** Composited light fields, not a continuously repainted viewport canvas. */
export function Background({ enabled, route = '' }: { enabled: boolean; route?: string }) {
  const depth = useRef<HTMLDivElement>(null);
  const pulse = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const nav = navigator as DeviceNavigator;
    root.dataset.quality = effectTier(nav.deviceMemory, !!nav.connection?.saveData);
    let frame = 0, start = 0, last = 0, samples = 0, slow = 0;
    const sample = (time: number) => {
      if (document.hidden || !enabled) return;
      if (!start) start = time;
      // Ignore boot work; 30 fps power-saving Safari keeps its main animation.
      if (last && time - start > 1500) { samples++; if (time - last > 50) slow++; }
      last = time;
      if (time - start >= 8000) {
        if (sustainedSlowFrames(samples, slow, time - start - 1500)) root.dataset.quality = 'low';
        return;
      }
      frame = requestAnimationFrame(sample);
    };
    const visibility = () => {
      root.dataset.visibility = document.hidden ? 'hidden' : 'visible';
      cancelAnimationFrame(frame);
      if (!document.hidden && enabled) { start = last = samples = slow = 0; frame = requestAnimationFrame(sample); }
    };
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) { depth.current?.style.removeProperty('transform'); return; }
    let frame = 0, x = 0, y = 0;
    const update = () => {
      frame = 0;
      const progress = Math.min(1, scrollY / Math.max(innerHeight, document.documentElement.scrollHeight - innerHeight));
      if (depth.current) depth.current.style.transform = `translate3d(${x}px,${y - progress * 85}px,0)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = (e.clientX / innerWidth - .5) * 26; y = (e.clientY / innerHeight - .5) * 18;
      document.documentElement.style.setProperty('--light-angle', `${110 + e.clientX / innerWidth * 45}deg`);
      document.documentElement.style.setProperty('--pointer-x', `${x * .5}px`);
      document.documentElement.style.setProperty('--pointer-y', `${y * .5}px`);
      schedule();
    };
    const touch = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' || !pulse.current) return;
      const node = pulse.current;
      node.style.left = `${e.clientX}px`; node.style.top = `${e.clientY}px`;
      node.getAnimations().forEach(a => a.cancel());
      node.animate([{ transform: 'translate(-50%,-50%) scale(.15)', opacity: .65 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 }], { duration: 680, easing: 'cubic-bezier(.16,1,.3,1)' });
    };
    schedule(); addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule);
    addEventListener('pointermove', move, { passive: true }); addEventListener('pointerdown', touch, { passive: true });
    const pulseNode = pulse.current;
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); removeEventListener('pointermove', move); removeEventListener('pointerdown', touch); pulseNode?.getAnimations().forEach(a => a.cancel()); };
  }, [enabled]);
  return <><div className="ambient" data-scene={route.split('/')[0] || 'home'} aria-hidden="true"><div ref={depth} className="ambient-depth"><div className="ambient-orb orb-one" /><div className="ambient-orb orb-two" /><div className="ambient-orb orb-three" /><div className="ambient-ribbon" /><div className="ambient-sparks" /></div></div><div ref={pulse} className="touch-wave" aria-hidden="true" /></>;
}
