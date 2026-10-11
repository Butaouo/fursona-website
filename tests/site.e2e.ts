import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const pageFailures = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page, baseURL }) => {
  const failures: string[] = [];
  pageFailures.set(page, failures);
  // Subscribe before navigation so startup errors and missing bundles are not missed.
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('response', response => {
    if (response.url().startsWith(baseURL!) && response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
});
test.afterEach(async ({ page }) => { expect(pageFailures.get(page), 'runtime, console and local resource errors').toEqual([]); });
test('homepage and optimized assets load without clipping or JavaScript errors', async ({ page }, info) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/久天/);
  await page.locator('.hero-image').evaluate((img: HTMLImageElement) => img.decode());
  expect(await page.locator('.hero-image').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const fullImage = await page.locator('.hero-image').boundingBox();
  expect(fullImage!.x).toBeGreaterThanOrEqual(0);
  expect(fullImage!.x + fullImage!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole('tab', { name: '角色插畫', exact: true }).click();
  await page.locator('.gallery-stage img').evaluate((img: HTMLImageElement) => img.decode());
  expect(await page.locator('.gallery-stage img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: `reports/${info.project.name}-light.png`, fullPage: true });
});
test('theme and language choices persist; system changes are observed', async ({ page }, info) => {
  await page.getByTestId('theme-dark').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/LongDay/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.screenshot({ path: `reports/${info.project.name}-dark-en.png`, fullPage: true });
  await page.getByTestId('theme-system').click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
test('all configured social destinations are exact and external links are safe', async ({ page }) => {
  const links = page.locator('.social-link'); await expect(links).toHaveCount(11);
  await expect(page.getByRole('link', { name: /^Instagram @hg_long_day/ })).toHaveAttribute('href', 'https://www.instagram.com/hg_long_day');
  await expect(page.getByRole('link', { name: /^Email Buta0318/ })).toHaveAttribute('href', 'mailto:Buta0318@outlook.com');
  const externals = await page.locator('a[target="_blank"]').evaluateAll(nodes => nodes.every(n => n.getAttribute('rel')?.includes('noopener')));
  expect(externals).toBe(true);
  await expect(page.getByRole('button', { name: '複製 Discord Butaouo', exact: true })).toBeVisible();
});
test('QQ copy sends the exact account to clipboard', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (s: string) => { document.body.dataset.copied = s; } } });
  });
  await page.getByRole('button', { name: '複製 QQ 3505606117', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-copied', '3505606117');
  await expect(page.getByRole('status')).toContainText('QQ 已複製');
});
test('denied clipboard exposes a selectable fallback without losing the account', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
    document.execCommand = () => false;
  });
  await page.getByRole('button', { name: '複製 QQ 3505606117', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('textbox', { name: '帳號', exact: true })).toHaveValue('3505606117');
  await page.getByRole('button', { name: '關閉', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('music does not autoplay; explicit click loads only the official player', async ({ page }) => {
  // Validate our integration without pretending to test Apple subscription playback.
  await page.route('https://embed.music.apple.com/**', route => route.fulfill({ contentType: 'text/html', body: '<p>Apple embed test fixture</p>' }));
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Younger', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '載入 Apple Music 播放器', exact: true }).click();
  await expect(page.getByTestId('apple-player')).toHaveAttribute('src', 'https://embed.music.apple.com/tw/album/younger/1814208594?i=1814208601');
  await expect(page.getByRole('link', { name: '在 Apple Music 聆聽', exact: true })).toHaveAttribute('href', 'https://music.apple.com/tw/album/younger/1814208594?i=1814208601');
});
test('gallery tabs, enlarged artwork and Escape work', async ({ page }) => {
  await page.getByRole('tab', { name: '毛色設定', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('id', 'panel-natural');
  await page.getByRole('button', { name: '查看完整圖片', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: '毛色設定', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '角色插畫', exact: true })).toHaveAttribute('aria-selected', 'true');
});
test('reduced motion and visitor animation control are respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'still');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: '暫停動態效果', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'still');
});
test('light and dark screens have no serious accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'still');
  for (const theme of ['light', 'dark']) {
    await page.getByTestId(`theme-${theme}`).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  }
});
test('compact phone and tablet layouts retain full artwork and reachable controls in both languages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 960 });
    for (const language of ['zh-TW', 'en']) {
      if (await page.locator('html').getAttribute('lang') !== language)
        await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      const layout = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
      expect(layout.scroll).toBeLessThanOrEqual(width);
      expect(layout.viewport).toBe(width);
      const artwork = await page.locator('.hero-image').boundingBox();
      expect(artwork!.x).toBeGreaterThanOrEqual(0);
      expect(artwork!.x + artwork!.width).toBeLessThanOrEqual(width);
    }
    await page.getByRole('button', { name: '切換為繁體中文', exact: true }).click();
  }
});
