import { useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { asset, site, type Language } from '../config/site';
import { Glass } from './Glass';
import { Icon } from './Icon';
import { Artwork } from './Artwork';
const views = [
  { id: 'clothed', label: 'refClothed', alt: 'refClothedAlt', src: site.images.referenceClothed },
  { id: 'natural', label: 'refNatural', alt: 'refNaturalAlt', src: site.images.referenceNatural },
  { id: 'artwork', label: 'artwork', alt: 'illustrationAlt', src: site.images.illustration },
];
export function Gallery({ language }: { language: Language }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const view = views[selected];
  const selectWithKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % views.length;
    else if (e.key === 'ArrowLeft') next = (index + views.length - 1) % views.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = views.length - 1;
    else return;
    e.preventDefault(); setSelected(next); tabRefs.current[next]?.focus();
  };
  return <section id="fursona" className="fursona-section page-width" aria-labelledby="fursona-heading">
    <div className="section-heading"><div><span className="eyebrow">{t('galleryLabel')}</span><h2 id="fursona-heading">{t('galleryTitle')}</h2></div><p>{t('galleryIntro')}</p></div>
    <div className="fursona-grid"><Glass className="gallery-panel">
      <div className="gallery-toolbar"><div role="tablist" aria-label={t('galleryTabs')} className="gallery-tabs">{views.map((v, i) => <button type="button" key={v.id} ref={el => { tabRefs.current[i] = el; }} id={`tab-${v.id}`} role="tab" aria-selected={i === selected} aria-controls={`panel-${v.id}`} tabIndex={i === selected ? 0 : -1} onClick={() => setSelected(i)} onKeyDown={e => selectWithKey(e, i)}>{t(v.label)}</button>)}</div><button className="icon-button" type="button" onClick={() => dialog.current?.showModal()} aria-label={t('viewFull')}><Icon name="expand" /></button></div>
      {views.map((v, i) => <div className="gallery-stage" key={v.id} role="tabpanel" id={`panel-${v.id}`} aria-labelledby={`tab-${v.id}`} tabIndex={0} hidden={i !== selected}>{i === selected && <Artwork src={asset(v.src)} width={i === 2 ? 750 : 1280} height={i === 2 ? 1059 : 870} alt={t(v.alt)} loading="lazy" />}</div>)}
      <div className="gallery-caption"><span>{t('originalArt')}</span><span>0{selected + 1} / 03</span></div>
    </Glass>
    <div className="character-notes"><span className="eyebrow">LYONT HAGOO LONGDAY</span><h3>{site.person.name[language]}<span>✳</span></h3>
      <dl><div><dt>{t('speciesLabel')}</dt><dd>{site.person.species[language]}</dd></div><div><dt>{t('nameLabel')}</dt><dd>{site.person.fullName[language]}</dd></div><div><dt>{t('personality')}</dt><dd>{site.person.traits[language].join(' · ')}</dd></div></dl>
      <div className="palette-block"><h4>{t('palette')}</h4><div className="palette">{[['cream', '#fff9ee'], ['gold', '#f2c44e'], ['amber', '#f3a63b'], ['coral', '#efad98'], ['graphite', '#494741']].map(([label, hex]) => <div key={label}><span style={{ background: hex }} title={`${t(label)} ${hex}`} /><small>{t(label)}</small></div>)}</div><p>{t('paletteNote')}</p></div>
    </div></div>
    <dialog ref={dialog} className="art-dialog" aria-label={t(view.alt)} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}><button className="icon-button dialog-close" type="button" aria-label={t('close')} onClick={() => dialog.current?.close()}><Icon name="close" /></button><Artwork key={view.id} src={asset(view.src)} alt={t(view.alt)} /><p>{t(view.label)}</p></dialog>
  </section>;
}
