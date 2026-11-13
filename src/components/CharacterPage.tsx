import { useTranslation } from 'react-i18next';
import { site, type Language } from '../config/site';
import type { EffectiveTheme } from '../config/characterCopy';
import { AnimatedText } from './AnimatedText';
import { ThemeCopy } from './ThemeCopy';
import { Gallery } from './Gallery';

export function CharacterPage({ language, theme }: { language: Language; theme: EffectiveTheme }) {
  const { t } = useTranslation();
  return <div className="content-page page-width character-file">
    <header className="content-heading file-intro">
      <div><p className="file-breadcrumb">LONGDAY / {language === 'en' ? 'CHARACTER' : '設定'}</p>
        <h1 className={language === 'en' ? 'en-title' : ''}><AnimatedText reveal>{site.person.name[language]}</AnimatedText></h1>
        <p className="file-name">{site.person.fullName.en}</p>
        <p className="file-summary"><ThemeCopy position="narration" theme={theme} language={language} /></p>
      </div>
      <p className="file-quote"><ThemeCopy position="character" theme={theme} language={language} /></p>
    </header>
    <Gallery language={language} fileLayout />
    <a className="button button-primary character-contact" href="#connect">{t('sayHello')} ↗</a>
  </div>;
}
