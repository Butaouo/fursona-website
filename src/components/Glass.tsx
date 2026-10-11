import { useRef, type CSSProperties, type PointerEvent, type PropsWithChildren } from 'react';

/** Light follows the pointer; refraction is confined to decorative surfaces, never text. */
export function Glass({ children, className = '', style }: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  const frame = useRef(0);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || document.documentElement.dataset.motion === 'still') return;
    const node = e.currentTarget;
    const bounds = node.getBoundingClientRect();
    const x = ((e.clientX - bounds.left) / bounds.width) * 100;
    const y = ((e.clientY - bounds.top) / bounds.height) * 100;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => { node.style.setProperty('--light-x', `${x}%`); node.style.setProperty('--light-y', `${y}%`); });
  };
  return <div className={`glass ${className}`} style={style} onPointerMove={move} onPointerLeave={() => cancelAnimationFrame(frame.current)}>
    <div className="glass-optics" aria-hidden="true" /><div className="glass-content">{children}</div>
  </div>;
}
export function GlassFilters() {
  return <svg className="filter-definitions" aria-hidden="true" width="0" height="0"><defs>
    <filter id="glass-refraction" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="1" seed="8" result="noise" />
      <feGaussianBlur in="noise" stdDeviation="2" result="smoothNoise" />
      <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="24" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs></svg>;
}
