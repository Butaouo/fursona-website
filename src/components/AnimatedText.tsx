import { Fragment, createContext, useContext, useEffect, useState, type CSSProperties } from 'react';
import { m } from 'motion/react';

export const AnimationContext = createContext(true);
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
/** One accessible text node; the decorative graphemes never become separate announcements. */
export function AnimatedText({ children, reveal = false }: { children: string; reveal?: boolean }) {
  const enabled = useContext(AnimationContext);
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState(enabled && reveal ? 'in' : 'idle');
  useEffect(() => {
    if (!enabled) { setDisplay(children); setPhase('idle'); return; }
    if (children === display) { if (!reveal) { setPhase('idle'); return; } const timer = setTimeout(() => setPhase('idle'), 700); return () => clearTimeout(timer); }
    setPhase('out');
    const swap = setTimeout(() => { setDisplay(children); setPhase('in'); }, 220);
    const finish = setTimeout(() => setPhase('idle'), 780);
    return () => { clearTimeout(swap); clearTimeout(finish); };
    // display is deliberately the previous committed label during the exit phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children, enabled]);
  const text = enabled ? display : children;
  const graphemes = (value: string) => segmenter
    ? Array.from(segmenter.segment(value), x => x.segment)
    : Array.from(value);
  // Keep Latin words together while allowing CJK characters to wrap naturally.
  let index = 0;
  // Initial and settled labels need one text node, not hundreds of layout boxes.
  // Build graphemes only during a real language transition.
  const letters = !enabled || phase === 'idle' ? text : text.split(/([A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*)/).map((part, group) => {
    const chars = graphemes(part).map(char => <span className="animated-character" key={index} style={{ '--delay': `${Math.min(index++ * 8, 140)}ms` } as CSSProperties}>{char}</span>);
    return /^[A-Za-z0-9]/.test(part) ? <span className="animated-word" key={group}>{chars}</span> : <Fragment key={group}>{chars}</Fragment>;
  });
  return <m.span layout={enabled ? 'size' : false} transition={{ layout: { duration: .45, ease: [.22, 1, .36, 1] } }} className={`animated-label label-${enabled ? phase : 'idle'}`}>
    <span className="sr-only">{children}</span>
    <span className="label-reserve" aria-hidden="true">{children}</span>
    <span className="label-ink" aria-hidden="true" key={text}>{letters}</span>
  </m.span>;
}
