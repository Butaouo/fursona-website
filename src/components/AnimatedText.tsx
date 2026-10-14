import { createContext, useContext, useEffect, useState, type CSSProperties } from 'react';
import { m } from 'motion/react';

export const AnimationContext = createContext(true);
/** One accessible text node; the decorative graphemes never become separate announcements. */
export function AnimatedText({ children }: { children: string }) {
  const enabled = useContext(AnimationContext);
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState('idle');
  useEffect(() => {
    if (!enabled) { setDisplay(children); setPhase('idle'); return; }
    if (children === display) { setPhase('idle'); return; }
    setPhase('out');
    const swap = setTimeout(() => { setDisplay(children); setPhase('in'); }, 220);
    const finish = setTimeout(() => setPhase('idle'), 780);
    return () => { clearTimeout(swap); clearTimeout(finish); };
    // display is deliberately the previous committed label during the exit phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, enabled]);
  const text = enabled ? display : children;
  const chars = typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), x => x.segment)
    : Array.from(text);
  return <m.span layout={enabled ? 'size' : false} transition={{ layout: { duration: .45, ease: [.22, 1, .36, 1] } }} className={`animated-label label-${enabled ? phase : 'idle'}`}>
    <span className="sr-only">{children}</span>
    <span className="label-reserve" aria-hidden="true">{children}</span>
    <span className="label-ink" aria-hidden="true" key={text}>{chars.map((char, i) => <span key={i} style={{ '--delay': `${Math.min(i * 8, 140)}ms` } as CSSProperties}>{char}</span>)}</span>
  </m.span>;
}
