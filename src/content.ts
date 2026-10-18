import type { Language } from './config/site';
export type Copy = { 'zh-TW': string; en?: string };
export type TextRun = { text: string; bold?: boolean; italic?: boolean };
export type Block = { type: 'paragraph' | 'heading'; runs: TextRun[]; level?: number } | { type: 'image'; src: string; alt: string; caption?: string; width: number; height: number } | { type: 'divider' };
export type Article = { id: string; kind: 'novel' | 'diary'; title: Copy; summary: Copy; date: string; cover?: string; series?: string; chapter?: number; blocks: Block[] };
export type Product = { id: string; name: Copy; summary: Copy; description: Copy; image?: string; images?: string[]; price?: string; status: Copy; order: number; placeholder?: boolean };
export type Catalog = { version: 1; articles: Article[]; products: Product[]; relationship: { src: string; alt: Copy } | null };
export const localized = (copy: Copy, language: Language) => copy[language] || copy['zh-TW'];
export const emptyCatalog: Catalog = { version: 1, articles: [], products: [], relationship: null };
export const words = {
  home: ['首頁', 'Home'], archive: ['創作', 'Archive'], relationships: ['關係網', 'Relationships'], shop: ['商品', 'Shop'], about: ['設定', 'Character'],
  characterDescription: ['久天的角色設定、穿衣與毛色參考、角色插畫，以及物種與性格資料。', 'LongDay’s character references, outfit, fur markings, illustrations, species and personality.'],
  archiveIntro: ['故事在字裡行間，也在每一幅畫之中。', 'Stories live between the lines — and inside every frame.'],
  relationshipsIntro: ['相遇、牽絆，以及同一個世界裡的彼此。', 'Encounters, connections, and the world we share.'],
  shopIntro: ['把喜歡的片刻，留在日常裡。', 'A little of this world, brought into everyday life.'],
  novel: ['小說', 'Novels'], diary: ['日記', 'Diary'],
  preview: ['查看商品', 'View details'],
  back: ['返回', 'Back'], close: ['關閉', 'Close'], reset: ['恢復原始比例', 'Reset view'], fullscreen: ['全螢幕檢視', 'Full-screen view'], zoomIn: ['放大', 'Zoom in'], zoomOut: ['縮小', 'Zoom out'],
  mapHelp: ['雙指縮放或拖曳移動。鍵盤可用方向鍵與 + / −。', 'Pinch to zoom or drag to pan. Keyboard: arrow keys and + / −.'],
  imageError: ['圖片暫時無法載入，請稍後重試。', 'The image couldn’t load. Please try again.'], retry: ['重試', 'Retry'],
  loading: ['正在載入…', 'Loading…'], loadError: ['內容暫時無法載入。首頁與其他功能仍可使用。', 'Content couldn’t load. Home and other features are still available.'],
  contents: ['章節目錄', 'Contents'], previous: ['上一章', 'Previous chapter'], next: ['下一章', 'Next chapter'], progress: ['閱讀進度', 'Reading progress'],
  original: ['以下正文以作者發布的原文呈現。', 'The story is shown in its original published language.'],
  notFound: ['找不到這個頁面', 'Page not found'], aboutIntro: ['我是哈古久天、叫我久天就行！', 'I’m HaGoo LongDay. Just call me LongDay!'],
} as const;
export const copy = (key: keyof typeof words, language: Language) => words[key][language === 'en' ? 1 : 0];
export function safeMedia(path: unknown): path is string { return typeof path === 'string' && /^(?:content\/media|images)\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/.test(path); }
/** Treat even same-origin JSON as data, never markup. Reject unsafe image paths before rendering. */
export function readCatalog(value: unknown): Catalog {
  const c = value as Catalog;
  if (!c || c.version !== 1 || !Array.isArray(c.articles) || !Array.isArray(c.products) || c.articles.length > 1000 || c.products.length > 200) throw new Error('Invalid catalog');
  const checkCopy = (x: Copy) => { if (!x || typeof x['zh-TW'] !== 'string' || (x.en !== undefined && typeof x.en !== 'string')) throw new Error('Invalid copy'); };
  const ids = new Set<string>();
  const id = (s: string) => { if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(s) || ids.has(s)) throw new Error('Invalid ID'); ids.add(s); };
  for (const a of c.articles) {
    id(a.id); checkCopy(a.title); checkCopy(a.summary);
    if (!['novel', 'diary'].includes(a.kind) || !/^\d{4}-\d{2}-\d{2}$/.test(a.date) || !Number.isFinite(Date.parse(a.date)) || !Array.isArray(a.blocks) || a.blocks.length > 10000 || (a.cover && !safeMedia(a.cover))) throw new Error('Invalid article');
    for (const b of a.blocks) {
      if (b.type === 'image') { if (!safeMedia(b.src) || typeof b.alt !== 'string' || !(b.width > 0 && b.height > 0)) throw new Error('Invalid image'); }
      else if (b.type === 'paragraph' || b.type === 'heading') { if (!Array.isArray(b.runs) || !b.runs.every(r => typeof r.text === 'string')) throw new Error('Invalid text'); }
      else if (b.type !== 'divider') throw new Error('Invalid block');
    }
  }
  ids.clear();
  for (const p of c.products) { id(p.id); [p.name,p.summary,p.description,p.status].forEach(checkCopy); if ((p.image && !safeMedia(p.image)) || (p.images && (!Array.isArray(p.images) || !p.images.every(safeMedia)))) throw new Error('Invalid product image'); }
  if (c.relationship) { if (!safeMedia(c.relationship.src)) throw new Error('Invalid relationship image'); checkCopy(c.relationship.alt); }
  return c;
}
