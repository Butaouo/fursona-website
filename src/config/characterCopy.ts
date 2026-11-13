import type { Language, Localized } from './site';

export type EffectiveTheme = 'light' | 'dark';
export const characterQuotes = {
  daySunset: { 'zh-TW': '落日熔金 盼願永恆', en: 'The setting sun melts into gold. I wish it could last forever.' },
  dayFreedom: { 'zh-TW': '原諒我愛自由', en: 'Forgive me for loving freedom.' },
  dayWait: { 'zh-TW': '我等你等到世界毀滅', en: 'I’ll wait for you until the world ends.' },
  dayGold: { 'zh-TW': '獨一無二的金幣', en: 'A gold coin like no other.' },
  dayBeauty: { 'zh-TW': '期待這世界愛上我的美', en: 'I can’t wait for the world to fall in love with my beauty.' },
  dayPlace: { 'zh-TW': '不要爭先恐後 總有位置守候', en: 'Don’t rush. There’s always a place waiting for you.' },
  nightDream: { 'zh-TW': '夢醒來後又該如何重新睡去', en: 'Once I wake from the dream, how do I fall asleep again?' },
  nightFreedom: { 'zh-TW': '我從來都不想要自由', en: 'I’ve never wanted freedom.' },
  nightTears: { 'zh-TW': '流過的淚讓夜空繁星點點', en: 'The tears I’ve shed have scattered stars across the night sky.' },
  nightWhale: { 'zh-TW': '夢的鯨魚悄悄擱淺', en: 'The whale of dreams, quietly aground.' },
} satisfies Record<string, Localized>;

export const characterNarration = {
  light: { 'zh-TW': '名字取意於希望日落能停留更久', en: 'The name is a wish for the sunset to linger longer' },
  dark: { 'zh-TW': '可夢終會醒 日總會落', en: 'Yet dreams must end, and the sun must set.' },
} satisfies Record<EffectiveTheme, Localized>;

export const quotePlacement = {
  home: { light: 'dayFreedom', dark: 'nightFreedom' },
  artwork: { light: 'dayGold', dark: 'nightWhale' },
  character: { light: 'daySunset', dark: 'nightDream' },
} as const;
export type CopyPlacement = keyof typeof quotePlacement | 'narration';
export function characterText(position: CopyPlacement, theme: EffectiveTheme, language: Language): string {
  if (position === 'narration') return characterNarration[theme][language];
  return characterQuotes[quotePlacement[position][theme]][language];
}
/** Reserve both languages and themes without displaying inactive copy. */
export function characterVariants(position: CopyPlacement): string[] {
  return [...new Set((['light', 'dark'] as const).flatMap(theme => (['zh-TW', 'en'] as const).map(language => characterText(position, theme, language))))];
}

export const characterPalette = [
  { label: 'cream', hex: '#fff9ee' },
  { label: 'gold', hex: '#f2c44e' },
  { label: 'amber', hex: '#f3a63b' },
  { label: 'coral', hex: '#efad98' },
  { label: 'graphite', hex: '#494741' },
] as const;
