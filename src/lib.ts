import type { Language } from './config/site';
export type ThemeChoice = 'system' | 'light' | 'dark';
export function resolveLanguage(saved: string | null, browser: string): Language {
  return saved === 'en' || saved === 'zh-TW' ? saved : browser.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}
export function resolveTheme(saved: string | null): ThemeChoice {
  return saved === 'light' || saved === 'dark' ? saved : 'system';
}
export function readPreference(key: string): string | null {
  try { return localStorage.getItem(`longday:${key}`); } catch { return null; }
}
export function savePreference(key: string, value: string): void {
  try { localStorage.setItem(`longday:${key}`, value); } catch { /* Private browsing can deny storage. */ }
}
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* Safari and embedded browsers may deny clipboard access. */ }
  const previous = document.activeElement as HTMLElement | null;
  const input = document.createElement('textarea');
  input.value = text; input.setAttribute('readonly', '');
  input.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px';
  document.body.append(input); input.select(); input.setSelectionRange(0, text.length);
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Offer a selectable fallback dialog. */ }
  input.remove(); previous?.focus({ preventScroll: true });
  return copied;
}
