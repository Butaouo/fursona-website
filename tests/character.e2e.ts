import { test, expect } from '@playwright/test';

test('a hash changed during initial subscription cannot leave the homepage behind', async ({ page }) => {
  await page.addInitScript(() => {
    const listen = window.addEventListener.bind(window);
    let changed = false;
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type === 'hashchange' && !changed) {
        changed = true;
        // Model a URL change whose event happened before the first subscriber.
        history.replaceState(null, '', '#/about');
      }
      listen(type, listener, options);
    }) as typeof window.addEventListener;
  });
  await page.goto('./');
  await expect(page).toHaveURL(/#\/about$/);
  await expect(page.locator('main h1')).toContainText('設定');
  await expect(page.getByRole('tab', { name: '毛色設定', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '設定', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('home stays focused while Character retains references, translations, metadata and legacy links', async ({ page }, info) => {
  await page.goto('./');
  await expect(page.locator('.hero-image')).toBeVisible();
  await expect(page.locator('.social-link')).toHaveCount(11);
  await expect(page.getByRole('heading', { name: 'Younger', exact: true })).toBeVisible();
  await expect(page.locator('.fursona-section,.character-notes,[role="tablist"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '設定', exact: true })).toHaveAttribute('href', '#/about');
  await expect(page.getByRole('link', { name: '關於', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: '認識久天', exact: true }).click();
  await expect(page).toHaveURL(/#\/about$/);
  await expect(page.locator('main h1')).toContainText('設定');
  await expect(page).toHaveTitle('設定 · LongDay');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /角色設定/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', '設定 · LongDay');
  // Independent reads share one wait phase; no assertion or timeout is removed.
  await Promise.all([
    ...['穿衣設定', '毛色設定', '角色插畫'].map(label => expect(page.getByRole('tab', { name: label, exact: true })).toBeVisible()),
    ...['哈古久天', '貓狐', '沉穩 · 可愛 · 傲嬌'].map(text => expect(page.locator('.character-notes')).toContainText(text)),
  ]);
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Character', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveCount(0);
  await expect(page.locator('main h1')).toContainText('Character');
  await expect(page).toHaveTitle('Character · LongDay');
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', 'Character · LongDay');
  await page.reload();
  await expect(page.locator('main h1')).toContainText('Character');
  await expect(page).toHaveURL(/#\/about$/);
  await page.goto('./#fursona');
  await expect(page.locator('main h1')).toContainText('Character');
  await expect(page.locator('.fursona-section')).toHaveCount(1);
  await expect(page.locator('.content-heading h1 .animated-label')).toHaveClass(/label-idle/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await info.attach('character-page', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.locator('#hero-heading')).toBeVisible();
  await expect(page.locator('.fursona-section')).toHaveCount(0);
  await expect(page).toHaveTitle('LongDay · 哈古久天');
});
