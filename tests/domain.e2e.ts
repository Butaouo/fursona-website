import { test, expect } from '@playwright/test';

test('canonical domain, sharing artwork and root asset paths are consistent', async ({ page, baseURL }) => {
  const failed: string[] = [];
  page.on('pageerror', error => failed.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(baseURL!) && response.status() >= 400) failed.push(response.url());
  });
  await page.goto('./#/shop');
  await expect(page.locator('main h1')).toContainText('商品');
  await page.reload();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://longday.tw/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://longday.tw/');
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', 'https://longday.tw/images/lyont-avatar.webp');
  }
  await page.getByRole('link', { name: '首頁', exact: true }).click();
  await expect(page.locator('#hero-heading')).toBeVisible();
  await expect.poll(() => page.locator('img').evaluateAll(nodes => nodes.filter(n => n.loading !== 'lazy').every(n => n.complete && n.naturalWidth > 0))).toBe(true);
  const images = await page.locator('img').evaluateAll(nodes => nodes.map(n => ({ src: n.src, complete: n.complete, width: n.naturalWidth, loading: n.loading })));
  for (const image of images) {
    expect(new URL(image.src).pathname).not.toContain('/fursona-website/');
    if (image.loading !== 'lazy') expect(image.complete && image.width > 0).toBe(true);
  }
  expect(failed).toEqual([]);
});
