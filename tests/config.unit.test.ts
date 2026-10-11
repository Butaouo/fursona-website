import { describe, expect, it } from 'vitest';
import { site, visibleSocials } from '../src/config/site';
import { translations } from '../src/config/translations';
import { resolveLanguage, resolveTheme } from '../src/lib';
describe('Visitor preferences', () => {
  it('uses explicit supported language before browser detection', () => {
    expect(resolveLanguage('en', 'zh-Hant-TW')).toBe('en');
    expect(resolveLanguage('zh-TW', 'en-US')).toBe('zh-TW');
    expect(resolveLanguage(null, 'zh-CN')).toBe('zh-TW');
    expect(resolveLanguage('malformed', 'de-DE')).toBe('en');
  });
  it('safely falls back from invalid theme storage', () => {
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme(null)).toBe('system');
    expect(resolveTheme('obsolete')).toBe('system');
  });
});
describe('Content contract', () => {
  it('hides empty social placeholders and keeps all 11 supplied platforms', () => {
    const shown = visibleSocials();
    expect(shown).toHaveLength(11);
    expect(shown.map(s => s.id)).not.toContain('telegram');
    expect(shown.map(s => s.id)).not.toContain('github');
    expect(visibleSocials([{ id: 'x', name: 'X', value: '  ', href: 'https://x.com' }])).toEqual([]);
  });
  it('preserves provided copy accounts and usable link schemes', () => {
    const shown = visibleSocials();
    expect(shown.find(s => s.id === 'qq')).toMatchObject({ value: '3505606117', action: 'copy' });
    expect(shown.find(s => s.id === 'discord')).toMatchObject({ value: 'Butaouo', action: 'copy' });
    for (const s of shown.filter(s => s.href)) expect(['https:', 'mailto:']).toContain(new URL(s.href!).protocol);
    expect(new Set(shown.map(s => s.id)).size).toBe(shown.length);
  });
  it('has complete and nonempty translations', () => {
    expect(Object.keys(translations.en).sort()).toEqual(Object.keys(translations['zh-TW']).sort());
    for (const language of Object.values(translations)) for (const text of Object.values(language)) expect(text.trim().length).toBeGreaterThan(0);
  });
  it('uses the specified Apple track and official embed without autoplay', () => {
    expect(new URL(site.music.embedUrl).hostname).toBe('embed.music.apple.com');
    expect(new URL(site.music.embedUrl).searchParams.get('i')).toBe('1814208601');
    expect(new URL(site.music.embedUrl).searchParams.has('autoplay')).toBe(false);
    expect(site.music.mode).toBe('featured');
    expect(site.music.track).toBe('Younger');
  });
});
