import { describe, expect, it } from 'vitest';
import { characterNarration, characterPalette, characterQuotes, characterText, characterVariants } from '../src/config/characterCopy';
import { site } from '../src/config/site';

describe('Author-approved character copy', () => {
  it('preserves all six current daytime originals verbatim', () => {
    expect(Object.entries(characterQuotes).filter(([id]) => id.startsWith('day')).map(([,q]) => q['zh-TW'])).toEqual([
      '落日熔金 盼願永恆', '原諒我愛自由', '我等你等到世界毀滅', '獨一無二的金幣', '期待這世界愛上我的美', '不要爭先恐後 總有位置守候',
    ]);
  });
  it('preserves all four nighttime originals verbatim', () => {
    expect(Object.entries(characterQuotes).filter(([id]) => id.startsWith('night')).map(([,q]) => q['zh-TW'])).toEqual([
      '夢醒來後又該如何重新睡去', '我從來都不想要自由', '流過的淚讓夜空繁星點點', '夢的鯨魚悄悄擱淺',
    ]);
  });
  it('uses the exact day and night narration without changing the objective name meaning', () => {
    expect(characterNarration.light['zh-TW']).toBe('名字取意於希望日落能停留更久');
    expect(characterNarration.dark['zh-TW']).toBe('可夢終會醒 日總會落');
    expect(site.person.nameMeaning['zh-TW']).toBe('希望日落能停留得更久');
  });
  it('assigns different fixed quotes to the home introduction and artwork caption', () => {
    for (const theme of ['light','dark'] as const) expect(characterText('home',theme,'zh-TW')).not.toBe(characterText('artwork',theme,'zh-TW'));
    expect(characterText('artwork','light','zh-TW')).toBe('獨一無二的金幣');
    expect(characterText('artwork','dark','zh-TW')).toBe('夢的鯨魚悄悄擱淺');
  });
  it('replaces the former sunset line in the active character-page copy', () => {
    expect(characterText('character','light','zh-TW')).toBe('落日熔金 盼願永恆');
    expect(Object.values(characterQuotes).map(q=>q['zh-TW'])).not.toContain('日落很美 盼願永恆');
  });
  it('keeps complete English copy for every stored original and narration', () => {
    for (const text of [...Object.values(characterQuotes),...Object.values(characterNarration)]) {
      expect(text.en.trim().length).toBeGreaterThan(0); expect(text.en).not.toMatch(/[\u4e00-\u9fff]/);
    }
    expect(characterText('home','dark','en')).toBe('I’ve never wanted freedom.');
  });
  it('reserves both themes and languages for each layout position', () => {
    for (const position of ['home','artwork','character','narration'] as const) {
      const variants=characterVariants(position);
      for(const theme of ['light','dark'] as const)for(const language of ['zh-TW','en'] as const)expect(variants).toContain(characterText(position,theme,language));
    }
  });
  it('preserves the original five artwork palette values', () => {
    expect(characterPalette.map(c=>c.hex)).toEqual(['#fff9ee','#f2c44e','#f3a63b','#efad98','#494741']);
  });
});
