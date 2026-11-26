import { expect, test } from '@playwright/test';
import type { Article } from '../src/content';

const worldArticle: Article = {
  id: 'regions', kind: 'worldbuilding',
  title: { 'zh-TW': '世界觀測試', en: 'World entry test' },
  summary: { 'zh-TW': '世界觀摘要', en: 'World entry summary' },
  date: '2020-01-01', cover: 'images/lyont-illustration.webp',
  blocks: [
    { type: 'heading', level: 2, runs: [{ text: '章節' }] },
    { type: 'heading', level: 3, runs: [{ text: '小節' }] },
    { type: 'heading', level: 4, runs: [{ text: '細節' }] },
    { type: 'paragraph', runs: [{ text: '粗體', bold: true }, { text: '斜體', italic: true }] },
    { type: 'paragraph', runs: [{ text: '\n' }] },
    { type: 'image', src: 'images/lyont-avatar.webp', alt: '內嵌圖', caption: '圖片說明', width: 100, height: 100 },
    { type: 'image', src: 'images/lyont-illustration.webp', alt: '第二張圖', width: 120, height: 100 },
  ],
};
const region: Article = { ...worldArticle, id: 'region-test', kind: 'region', title: { 'zh-TW': '地區測試', en: 'Region entry test' } };

test('world navigation supports responsive bilingual deep links and legacy history', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/content/catalog.json', route => route.fulfill({ json: { version: 1, articles: [], products: [], relationship: null } }));
  await page.goto('./#/world');
  const mainNav = page.getByRole('navigation', { name: '主選單' });
  for (const [index, name] of ['首頁', '創作', '世界觀', '商品', '設定'].entries()) {
    await expect(mainNav.getByRole('link').nth(index)).toHaveAccessibleName(name);
  }
  const tabs = page.getByRole('navigation', { name: '世界觀導覽' });
  await expect(tabs.getByRole('link', { name: '世界觀', exact: true })).toHaveAttribute('aria-current', 'page');
  for (const [name, hash] of [['地區', 'regions'], ['關係網', 'relationships']]) {
    await tabs.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/world/${hash}$`));
    await expect(tabs.getByRole('link', { name, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.world-entry,.map-shell,.empty-state')).toHaveCount(0);
  }
  await page.goBack();
  await expect(tabs.getByRole('link', { name: '地區' })).toHaveAttribute('aria-current', 'page');
  await page.goForward();
  await expect(tabs.getByRole('link', { name: '關係網' })).toHaveAttribute('aria-current', 'page');
  await page.goto('./#/relationships');
  await expect(page).toHaveURL(/#\/world\/relationships$/);
  await page.reload();
  await expect(page.locator('footer')).toContainText('落日熔金 盼願永恆');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  const englishMain = page.getByRole('navigation', { name: 'Main navigation' });
  for (const [index, name] of ['Home', 'Works', 'World', 'Products', 'Character'].entries()) {
    await expect(englishMain.getByRole('link').nth(index)).toHaveAccessibleName(name);
  }
  const englishTabs = page.getByRole('navigation', { name: 'World navigation' });
  for (const [index, name] of ['Worldbuilding', 'Regions', 'Relationships'].entries()) {
    await expect(englishTabs.getByRole('link').nth(index)).toHaveAccessibleName(name);
  }
  await expect(page.locator('footer')).toContainText('The setting sun melts into gold. I wish it could last forever.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('distinct world and region lists open the full illustrated reader', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/content/catalog.json', route => route.fulfill({
    json: { version: 1, articles: [worldArticle, region], products: [], relationship: null },
  }));
  await page.goto('./#/world');
  await expect(page.locator('.world-entry')).toHaveCount(1);
  await page.getByRole('link', { name: /世界觀測試/ }).click();
  await expect(page).toHaveURL(/#\/world\/articles\/regions$/);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: '世界觀測試' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 4, name: '細節' })).toBeVisible();
  await expect(page.locator('.reader-body p').first().getByText('粗體')).toHaveCSS('font-weight', '700');
  await expect(page.locator('.reader-body p').first().getByText('斜體')).toHaveCSS('font-style', 'italic');
  expect(await page.locator('.reader-body p').last().textContent()).toBe('\n');
  await expect(page.locator('.reader-body figure')).toHaveCount(2);
  await expect(page.locator('figcaption')).toHaveText('圖片說明');
  await page.getByRole('button', { name: '放大: 內嵌圖' }).click();
  await expect(page.getByRole('dialog', { name: '內嵌圖' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '關閉' }).click();
  await page.getByRole('navigation', { name: '世界觀導覽' }).getByRole('link', { name: '地區' }).click();
  await expect(page.locator('.world-entry')).toHaveCount(1);
  await page.getByRole('link', { name: /地區測試/ }).click();
  await expect(page).toHaveURL(/#\/world\/regions\/region-test$/);
  await expect(page.getByRole('heading', { level: 1, name: '地區測試' })).toBeVisible();
  await expect(page.locator('.reader-cover')).toBeVisible();
  await page.goto('./#/archive/region-test');
  await expect(page.getByRole('heading', { name: '找不到這個頁面' })).toBeVisible();
});

test('shared secondary navigation keeps titles and menus aligned as selections change', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => sessionStorage.setItem('longday:opening', 'seen'));
  await page.route('**/content/catalog.json', route => route.fulfill({
    json: { version: 1, articles: [], products: [], relationship: null },
  }));
  await page.goto('./#/world');
  const menu = page.locator('.section-nav');
  const heading = page.locator('.content-heading');
  const indicator = menu.locator('.section-indicator');
  const geometry = () => page.locator('.content-page').evaluate(root => {
    const positions = ['.eyebrow', 'h1', '.section-nav'].map(selector => root.querySelector(selector)!.getBoundingClientRect().top);
    return { positions, fits: document.documentElement.scrollWidth <= innerWidth };
  });
  const finishPageEntrance = () => heading.evaluate(async node => {
    const animations = [...node.getAnimations(), ...node.closest('.route-scene')!.getAnimations()];
    await Promise.allSettled(animations.map(animation => animation.finished));
  });
  const stable = async (initial: Awaited<ReturnType<typeof geometry>>) => {
    const next = await geometry();
    expect(next.fits).toBe(true);
    next.positions.forEach((value, index) => expect(Math.abs(value - initial.positions[index])).toBeLessThanOrEqual(1));
  };
  for (const language of ['zh-TW', 'en']) {
    if (language === 'en') await page.getByRole('button', { name: 'Switch to English' }).click();
    for (const theme of ['light', 'dark']) {
      await page.getByTestId(`theme-${theme}`).click();
      const links = menu.getByRole('link');
      await links.nth(0).click();
      await expect(heading.locator('.eyebrow')).toHaveText('LONGDAY / WORLDBUILDING');
      await finishPageEntrance();
      const origin = await geometry();
      for (const [index, title] of [[1, 'REGIONS'], [2, 'RELATIONSHIPS'], [0, 'WORLDBUILDING']] as const) {
        await links.nth(index).click();
        await expect(heading.locator('.eyebrow')).toHaveText(`LONGDAY / ${title}`);
        await expect(heading.locator(':scope > p')).toHaveCount(1);
        await stable(origin);
      }
    }
  }
  const worldLineStyle = await indicator.evaluate(line => getComputedStyle(line).transition);
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Works' }).click();
  await expect(menu.getByRole('button')).toHaveCount(2);
  await expect(menu.getByRole('button').first()).toHaveAccessibleName('Diary');
  await expect(menu.getByRole('button').last()).toHaveAttribute('aria-pressed', 'true');
  expect(await indicator.evaluate(line => getComputedStyle(line).transition)).toBe(worldLineStyle);
  await finishPageEntrance();
  const original = await geometry();
  const track = (await menu.boundingBox())!;
  const marker = (await indicator.boundingBox())!;
  expect(Math.abs(marker.width - track.width / 2)).toBeLessThanOrEqual(1);
  await menu.getByRole('button', { name: 'Diary' }).click();
  await expect(menu.getByRole('button', { name: 'Diary' })).toHaveAttribute('aria-pressed', 'true');
  await stable(original);
  await expect.poll(async () => Math.abs((await indicator.boundingBox())!.x - track.x)).toBeLessThanOrEqual(1);
});
