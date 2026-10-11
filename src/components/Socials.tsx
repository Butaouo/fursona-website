import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { visibleSocials, type Social } from '../config/site';
import { copyText } from '../lib';
import { BrandIcon, Icon } from './Icon';
import { Glass } from './Glass';
export function Socials() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState('');
  const [fallback, setFallback] = useState<Social | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  useEffect(() => { if (fallback) dialog.current?.showModal(); }, [fallback]);
  const copy = async (social: Social) => {
    if (await copyText(social.value)) {
      setCopied(social.id); if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(''), 2800);
    } else setFallback(social);
  };
  return <Glass className="social-panel">
    <div className="panel-topline"><span className="eyebrow">{t('socialsLabel')}</span><Icon name="spark" /></div>
    <h2 id="connect-heading">{t('myWorld')}</h2><p className="section-description">{t('connectionIntro')}</p>
    <div className="social-grid">
      {visibleSocials().map(s => {
        const content = <><span className="social-brand"><BrandIcon name={s.id} /></span><span className="social-text"><strong>{s.name}</strong><small>{s.action === 'copy' ? s.value : s.id === 'email' ? s.value : s.value.startsWith('@') ? s.value : t('open')}</small></span><Icon name={s.action === 'copy' ? copied === s.id ? 'check' : 'copy' : 'arrow'} className="social-action" /></>;
        return s.action === 'copy' ? <button type="button" className={`social-link ${copied === s.id ? 'copied' : ''}`} key={s.id} onClick={() => void copy(s)} aria-label={`${t('copy')} ${s.name} ${s.value}`} title={t('copyHelp', { name: s.name })}>{content}</button> : <a className="social-link" key={s.id} href={s.href} target={s.id === 'email' ? undefined : '_blank'} rel={s.id === 'email' ? undefined : 'noopener noreferrer'} aria-label={`${s.name} ${s.value}${s.id === 'email' ? '' : ` (${t('external')})`}`}>{content}</a>;
      })}
    </div>
    <div className="sr-only" role="status" aria-live="polite">{copied ? t('copied', { name: visibleSocials().find(s => s.id === copied)?.name }) : ''}</div>
    <dialog className="copy-dialog" ref={dialog} aria-labelledby="copy-dialog-title" onClose={() => setFallback(null)}>
      <button className="icon-button dialog-close" type="button" onClick={() => dialog.current?.close()} aria-label={t('close')}><Icon name="close" /></button>
      <h3 id="copy-dialog-title">{fallback?.name}</h3><p>{t('copyFailed')}</p><input readOnly aria-label={t('account')} value={fallback?.value ?? ''} onFocus={e => e.currentTarget.select()} /><p>{t('copyHelp', { name: fallback?.name })}</p>
    </dialog>
  </Glass>;
}
