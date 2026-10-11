import { siX, siDiscord, siInstagram, siBilibili, siGithub, siSteam, siQq, siFacebook, siBluesky, siThreads, siTelegram, siApplemusic } from 'simple-icons';
import { asset, type SocialId } from '../config/site';
const brands = { x: siX, discord: siDiscord, instagram: siInstagram, bilibili: siBilibili, github: siGithub, steam: siSteam, qq: siQq, facebook: siFacebook, bluesky: siBluesky, threads: siThreads, telegram: siTelegram, apple: siApplemusic };
export function BrandIcon({ name }: { name: SocialId | 'apple' }) {
  if (name === 'bump') return <img className="bump-icon" src={asset('brand/bump.webp')} width="24" height="24" alt="" aria-hidden="true" />;
  if (name === 'email') return <Icon name="mail" />;
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="icon"><path d={brands[name].path} /></svg>;
}
type IconName = 'arrow' | 'down' | 'sun' | 'moon' | 'monitor' | 'copy' | 'check' | 'close' | 'play' | 'pause' | 'expand' | 'mail' | 'spark' | 'up' | 'globe' | 'volume';
const paths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14M12 5l7 7-7 7" /></>,
  down: <><path d="M12 4v16m-6-6 6 6 6-6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  play: <path d="m9 5 11 7-11 7Z" />,
  pause: <><path d="M9 5v14M15 5v14" /></>,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>,
  spark: <path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z" />,
  up: <path d="M12 20V4m-6 6 6-6 6 6" />,
  globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  volume: <><path d="m11 4-6 5H2v6h3l6 5Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
