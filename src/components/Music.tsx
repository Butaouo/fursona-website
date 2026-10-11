import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { asset, site, type Language } from '../config/site';
import { BrandIcon, Icon } from './Icon';
import { Glass } from './Glass';
import { Artwork } from './Artwork';
export function Music({ language }: { language: Language }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!loaded || frameLoaded) return;
    setSlow(false);
    // Cross-origin iframe load cannot prove playback. Always retain a usable direct link.
    const timer = setTimeout(() => setSlow(true), 12000);
    return () => clearTimeout(timer);
  }, [loaded, attempt, frameLoaded]);
  return <Glass className="music-panel" >
    <div className="panel-topline"><span className="eyebrow">{t('musicLabel')}</span><BrandIcon name="apple" /></div>
    <h2>{t('musicTitle')}</h2>
    <div className="record-stage"><div className="record-disc" aria-hidden="true"><div className="record-label">LD</div></div><Artwork className="album-cover" src={asset(site.music.artwork)} width="300" height="300" loading="lazy" alt={t('coverAlt')} /></div>
    <div className="track-info"><div><span className="track-label">{t('featured')}</span><h3>{site.music.track}</h3><p>{site.music.artist[language]}<span>·</span>{site.music.album}</p></div><Icon name="volume" /></div>
    <div className="apple-player-slot">
      {!loaded ? <button className="button button-primary music-load" type="button" onClick={() => setLoaded(true)}><Icon name="play" />{t('listen')}</button> : <>
        <iframe key={attempt} data-testid="apple-player" title={t('playerTitle')} src={site.music.embedUrl} height="175" allow="autoplay *; encrypted-media *; fullscreen *" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" referrerPolicy="strict-origin-when-cross-origin" onLoad={() => { setFrameLoaded(true); setSlow(false); }} />
        {slow && <p className="player-notice">{t('playerSlow')} <button type="button" onClick={() => { setFrameLoaded(false); setAttempt(v => v + 1); }}>{t('retry')}</button></p>}
      </>}
    </div>
    <a className="music-external" href={site.music.appleMusicUrl} target="_blank" rel="noopener noreferrer"><BrandIcon name="apple" />{t('appleMusic')}<Icon name="arrow" /></a>
    <p className="music-note">{t('musicNote')}</p>
  </Glass>;
}
