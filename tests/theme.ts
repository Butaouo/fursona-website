import { expect, type Page } from '@playwright/test';

/** Audit the applied theme, including inherited copy, rather than a transition. */
export async function expectThemeColors(page: Page, theme: string) {
  const dark = theme === 'dark';
  const foreground = dark ? 'rgb(247, 240, 228)' : 'rgb(48, 43, 34)';
  await Promise.all([
    expect(page.locator('html')).toHaveAttribute('data-theme', theme),
    expect(page.locator('body')).toHaveCSS('color', foreground),
    expect(page.locator('body')).toHaveCSS('background-color', dark ? 'rgb(27, 25, 21)' : 'rgb(247, 242, 232)'),
    expect(page.locator('.footer-brand')).toHaveCSS('color', foreground),
  ]);
}
