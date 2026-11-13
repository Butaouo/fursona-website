import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { asset, site, type Language } from '../config/site';
import { Glass } from './Glass';
import { Icon } from './Icon';
import { Artwork } from './Artwork';
import { characterPalette } from '../config/characterCopy';
const views = [
  { id: 'clothed', label: 'refClothed', alt: 'refClothedAlt', src: site.images.referenceClothed },
  { id: 'natural', label: 'refNatural', alt: 'refNaturalAlt', src: site.images.referenceNatural },
  { id: 'artwork', label: 'artwork', alt: 'illustrationAlt', src: site.images.illustration },
];
export function Gallery({ language, fileLayout = false }: { language: Language; fileLayout?: boolean }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState(false);
  const view = views[selected];
  const close = () => {
    if (document.fullscreenElement === dialog.current) void document.exitFullscreen().catch(() => {});
    dialog.current?.close(); setExpanded(false);
  };
  const toggleFullscreen = () => {
    if (expanded) { setExpanded(false); if (document.fullscreenElement === dialog.current) void document.exitFullscreen().catch(() => {}); }
    else { setExpanded(true); void dialog.current?.requestFullscreen?.().catch(() => {}); }
  };
  useEffect(() => {
    const node = dialog.current;
    const changed = () => { if (!document.fullscreenElement) setExpanded(false); };
    document.addEventListener('fullscreenchange', changed);
    return () => { document.removeEventListener('fullscreenchange', changed); if (document.fullscreenElement === node) void document.exitFullscreen().catch(() => {}); };
  }, []);
  const selectWithKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % views.length;
    else if (e.key === 'ArrowLeft') next = (index + views.length - 1) % views.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = views.length - 1;
    else return;
    e.preventDefault(); setSelected(next); tabRefs.current[next]?.focus();
  };
  const reference = <Glass className="gallery-panel">
      <div className="gallery-toolbar"><div role="tablist" aria-label={t('galleryTabs')} className="gallery-tabs">{views.map((v, i) => <button type="button" key={v.id} ref={el => { tabRefs.current[i] = el; }} id={`tab-${v.id}`} role="tab" aria-selected={i === selected} aria-controls={`panel-${v.id}`} tabIndex={i === selected ? 0 : -1} onClick={() => setSelected(i)} onKeyDown={e => selectWithKey(e, i)}>{t(v.label)}</button>)}</div><button className="icon-button" type="button" onClick={() => dialog.current?.showModal()} aria-label={t('viewFull')}><Icon name="expand" /></button></div>
      {views.map((v, i) => <div className="gallery-stage" key={v.id} role="tabpanel" id={`panel-${v.id}`} aria-labelledby={`tab-${v.id}`} tabIndex={0} hidden={i !== selected}>{i === selected && <Artwork src={asset(v.src)} width={i === 2 ? 750 : 1280} height={i === 2 ? 1059 : 870} alt={t(v.alt)} loading="lazy" />}</div>)}
      <div className="gallery-caption"><span>{t('originalArt')}</span><span>0{selected + 1} / 03</span></div>
    </Glass>;
  const classicNotes = <div className="character-notes"><span className="eyebrow">LYONT HAGOO LONGDAY</span><h3>{site.person.name[language]}<span>✳</span></h3>
      <dl><div><dt>{t('speciesLabel')}</dt><dd>{site.person.species[language]}</dd></div><div><dt>{t('nameLabel')}</dt><dd>{site.person.fullName[language]}</dd></div><div><dt>{t('personality')}</dt><dd>{site.person.traits[language].join(' · ')}</dd></div></dl>
      <div className="palette-block"><h4>{t('palette')}</h4><div className="palette">{characterPalette.map(({ label, hex }) => <div key={label}><span style={{ background: hex }} title={`${t(label)} ${hex}`} /><small>{t(label)}</small></div>)}</div><p>{t('paletteNote')}</p></div>
    </div>;
  return <>
    <section id="fursona" className={`fursona-section ${fileLayout ? 'file-section' : 'page-width'}`} aria-labelledby="fursona-heading">
      {fileLayout ? <div className="file-section-top"><h2 id="fursona-heading"><span className="section-id">01</span>{t('characterReferences')}</h2><span className="file-index">REFERENCE / 01–03</span></div> : <div className="section-heading"><div><span className="eyebrow">{t('galleryLabel')}</span><h2 id="fursona-heading">{t('galleryTitle')}</h2></div><p>{t('galleryIntro')}</p></div>}
      {fileLayout ? reference : <div className="fursona-grid">{reference}{classicNotes}</div>}
    </section>
    {fileLayout && <>
      <section className="file-section" aria-labelledby="character-data-heading"><div className="file-section-top"><h2 id="character-data-heading"><span className="section-id">02</span>{t('characterFacts')}</h2><span className="file-index">IDENTITY / LYONT</span></div>
        <div className="character-notes file-facts-panel"><dl className="file-facts">
          <div><dt>{t('chineseName')}</dt><dd>{site.person.fullName['zh-TW']}</dd></div>
          <div><dt>{t('englishName')}</dt><dd className="latin">{site.person.fullName.en}</dd></div>
          <div><dt>{t('speciesLabel')}</dt><dd>{site.person.species[language]}</dd></div>
          <div><dt>{t('personality')}</dt><dd className="traits-data">{site.person.traits[language].join(' · ')}</dd></div>
          <div className="name-meaning"><dt>{t('nameMeaning')}</dt><dd>{site.person.nameMeaning[language]}</dd></div>
        </dl></div>
      </section>
      <section className="file-section" aria-labelledby="character-palette-heading"><div className="file-section-top"><h2 id="character-palette-heading"><span className="section-id">03</span>{t('characterColors')}</h2><span className="file-index">COLOR / 01–05</span></div>
        <div className="file-palette">{characterPalette.map(({ label, hex }) => <div key={label}><span className="color-sample" style={{ background: hex }} /><div className="color-label"><span>{t(label)}</span><small>{hex.toUpperCase()}</small></div></div>)}</div><p className="palette-description">{t('paletteNote')}</p>
      </section>
    </>}
    <dialog ref={dialog} className={`art-dialog character-gallery-dialog ${expanded ? 'is-expanded' : ''}`} aria-label={t(view.alt)} onClose={() => { setExpanded(false); if (document.fullscreenElement === dialog.current) void document.exitFullscreen().catch(() => {}); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="dialog-tools"><button className="icon-button" type="button" aria-label={t('fullscreen')} aria-pressed={expanded} onClick={toggleFullscreen}><Icon name="expand" /></button><button className="icon-button dialog-close" type="button" aria-label={t('close')} onClick={close}><Icon name="close" /></button></div>
      <Artwork key={view.id} src={asset(view.src)} alt={t(view.alt)} /><p>{t(view.label)}</p>
    </dialog>
  </>;
}
