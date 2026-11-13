import { useContext } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { characterText, characterVariants, type CopyPlacement, type EffectiveTheme } from '../config/characterCopy';
import type { Language } from '../config/site';
import { AnimationContext } from './AnimatedText';

export function ThemeCopy({ position, theme, language, className = '' }: { position: CopyPlacement; theme: EffectiveTheme; language: Language; className?: string }) {
  const enabled = useContext(AnimationContext);
  const text = characterText(position, theme, language);
  return <span className={`theme-copy ${className}`} data-copy-position={position}>
    <span className="sr-only" data-copy-current>{text}</span>
    {characterVariants(position).map(value => <span key={value} className="theme-copy-reserve" aria-hidden="true">{value}</span>)}
    <span className="theme-copy-stage" aria-hidden="true">{enabled ? <AnimatePresence initial={false}>
      <m.span className="theme-copy-ink" key={text} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2, position: 'absolute' }} transition={{ duration: .3, ease: [.22, 1, .36, 1] }}>{text}</m.span>
    </AnimatePresence> : <span className="theme-copy-ink">{text}</span>}</span>
  </span>;
}
