import { useState, type ImgHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
export function Artwork(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  const { t } = useTranslation();
  if (failed) return <div className="image-fallback" role="img" aria-label={props.alt}><span>{t('imageError')}</span><a href={props.src} target="_blank" rel="noopener noreferrer">{t('imageOpen')}</a></div>;
  return <img {...props} onError={() => setFailed(true)} />;
}
