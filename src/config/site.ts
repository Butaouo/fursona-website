export type Language = 'zh-TW' | 'en';
export type Localized = Record<Language, string>;
export type SocialId = 'x' | 'qq' | 'discord' | 'telegram' | 'instagram' | 'bilibili' | 'github' | 'steam' | 'email' | 'bump' | 'facebook' | 'bluesky' | 'threads';
export interface Social { id: SocialId; name: string; value: string; href?: string; action?: 'copy'; }

/** Personal content lives here. Empty social values are automatically hidden. */
export const site = {
  name: 'LongDay',
  englishName: 'HaGooLongDay',
  url: 'https://Butaouo.github.io/fursona-website/',
  person: {
    name: { 'zh-TW': '久天', en: 'LongDay' },
    fullName: { 'zh-TW': '哈古久天', en: 'Lyont HaGoo LongDay' },
    species: { 'zh-TW': '貓狐', en: 'Cat × Fox' },
    intro: { 'zh-TW': '我是哈古久天、叫我久天就行！', en: 'I’m HaGoo LongDay. Just call me LongDay!' },
    tagline: { 'zh-TW': '日落，予你。', en: 'A little warmth for everyone I meet.' },
    traits: { 'zh-TW': ['沉穩', '可愛', '傲嬌'], en: ['Calm', 'Cute', 'A little tsundere'] },
  },
  images: {
    hero: 'images/lyont-hero.webp',
    heroSmall: 'images/lyont-hero-640.webp',
    avatar: 'images/lyont-avatar.webp',
    illustration: 'images/lyont-illustration.webp',
    referenceClothed: 'images/lyont-reference-clothed.webp',
    referenceNatural: 'images/lyont-reference-natural.webp',
  },
  music: {
    // The provider boundary is intentionally separate from future recently-played integrations.
    provider: 'apple-embed' as const,
    mode: 'featured' as const,
    track: 'Younger',
    artist: { 'zh-TW': '陳芳語', en: 'Kimberley Chen' },
    album: 'kiki',
    artwork: 'images/younger-cover.webp',
    appleMusicUrl: 'https://music.apple.com/tw/album/younger/1814208594?i=1814208601',
    embedUrl: 'https://embed.music.apple.com/tw/album/younger/1814208594?i=1814208601',
    recentlyPlayedEndpoint: '',
  },
  socials: [
    { id: 'x', name: 'X', value: '@minigrapesJTHG', href: 'https://x.com/minigrapesJTHG' },
    { id: 'instagram', name: 'Instagram', value: '@hg_long_day', href: 'https://www.instagram.com/hg_long_day' },
    { id: 'discord', name: 'Discord', value: 'Butaouo', action: 'copy' },
    { id: 'qq', name: 'QQ', value: '3505606117', action: 'copy' },
    { id: 'bluesky', name: 'Bluesky', value: '@jthg.bsky.social', href: 'https://bsky.app/profile/jthg.bsky.social' },
    { id: 'threads', name: 'Threads', value: '@hg_long_day', href: 'https://www.threads.com/@hg_long_day' },
    { id: 'bilibili', name: 'Bilibili', value: 'Bilibili', href: 'https://b23.tv/i2oyJC2' },
    { id: 'steam', name: 'Steam', value: 'Steam', href: 'https://steamcommunity.com/profiles/76561199012366040' },
    { id: 'bump', name: 'bump', value: 'bump', href: 'https://bump.app/p/pDMCRg7QgkQSZ' },
    { id: 'facebook', name: 'Facebook', value: 'Facebook', href: 'https://www.facebook.com/share/17jzGmXyGU/?mibextid=wwXIfr' },
    { id: 'email', name: 'Email', value: 'Buta0318@outlook.com', href: 'mailto:Buta0318@outlook.com' },
    { id: 'telegram', name: 'Telegram', value: '', href: '' },
    { id: 'github', name: 'GitHub', value: '', href: '' },
  ] satisfies Social[],
};
export const visibleSocials = (socials: Social[] = site.socials) => socials.filter(s => s.value.trim() && (s.href?.trim() || s.action === 'copy'));
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
