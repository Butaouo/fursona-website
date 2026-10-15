import { type CSSProperties, type PropsWithChildren } from 'react';

/** Light follows the pointer; refraction is confined to decorative surfaces, never text. */
export function Glass({ children, className = '', style }: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return <div className={`glass ${className}`} style={style}>
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
