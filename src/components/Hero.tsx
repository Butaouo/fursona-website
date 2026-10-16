import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { asset, site, type Language } from '../config/site';
import { Glass } from './Glass';
import { BrandIcon, Icon } from './Icon';
import { Artwork } from './Artwork';
import { AnimatedText } from './AnimatedText';
export function Hero({ language, animated }: { language: Language; animated: boolean }) {
  const { t } = useTranslation();
  return <section className="hero page-width" id="home" aria-labelledby="hero-heading">
    <div className="hero-copy">
      <div className="eyebrow"><span className="sun-dot" />{t('welcome')}</div>
      <p className="hero-hello"><AnimatedText>{t('hello')}</AnimatedText></p>
      <h1 id="hero-heading" className={language === 'en' ? 'english-heading' : ''}><AnimatedText reveal>{t('heroTitle')}</AnimatedText><span className="heading-star" aria-hidden="true">✳</span></h1>
      <p className="hero-fullname">{site.person.fullName.en}</p>
      <p className="hero-intro"><AnimatedText>{site.person.intro[language]}</AnimatedText></p>
      <p className="hero-tagline"><AnimatedText>{site.person.tagline[language]}</AnimatedText></p>
      <div className="hero-actions"><a href="#connect" className="button button-primary"><AnimatedText>{t('sayHello')}</AnimatedText><Icon name="arrow" /></a><a href="#fursona" className="button button-secondary"><AnimatedText>{t('discover')}</AnimatedText><Icon name="down" /></a></div>
      <Glass className="identity-card"><img src={asset(site.images.avatar)} alt={t('avatarAlt')} width="58" height="58" /><div><span className="identity-label">{t('identity')}</span><div className="traits">{site.person.traits[language].map(trait => <span key={trait}>{trait}</span>)}</div></div><Icon name="spark" /></Glass>
      <a className="scroll-hint" href="#connect"><span className="scroll-line" />{t('scroll')}<Icon name="down" /></a>
    </div>
    <m.div className="hero-art" initial={animated ? { opacity: 0.6, y: 14 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}>
      <div className="art-halo" aria-hidden="true" />
      <span className="orbit-caption" aria-hidden="true">A LITTLE SUNSHINE</span>
      <div className="art-parallax"><div className="art-float"><Glass className="art-frame">
        <div className="art-meta"><span>01 / LYONT</span><span>{t('character')}<span className="mini-spark">✳</span></span></div>
        <Artwork className="hero-image" src={asset(site.images.hero)} srcSet={`${asset(site.images.heroSmall)} 640w, ${asset(site.images.hero)} 1120w`} sizes="(max-width: 520px) calc(100vw - 78px), (max-width: 760px) 450px, 46vw" width="1407" height="1760" alt={t('portraitAlt')} fetchPriority="high" decoding="async" />
        <div className="art-caption"><span>{t('heroCaption')}</span><span>久天</span></div>
      </Glass></div></div>
      <a className="floating-social float-instagram glass-button" href={site.socials.find(s => s.id === 'instagram')!.href} target="_blank" rel="noopener noreferrer" aria-label={`Instagram (${t('external')})`}><BrandIcon name="instagram" /></a>
      <a className="floating-social float-x glass-button" href={site.socials.find(s => s.id === 'x')!.href} target="_blank" rel="noopener noreferrer" aria-label={`X (${t('external')})`}><BrandIcon name="x" /></a>
      <div className="floating-note glass-button"><Icon name="spark" /><span>{t('heroArtwork')}</span></div>
    </m.div>
  </section>;
}
