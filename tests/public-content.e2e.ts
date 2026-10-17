import { test, expect } from '@playwright/test';
const forbidden = /關係網圖片尚未提供|這裡預留|替代角色|虛構設定|展示佔位|商品預留|敬請期待|尚未完成|ChatGPT|OpenAI|DALL[·.\s-]?E|placeholder|Reserved space|hasn.t been added|Preview the interaction|No published chapters/i;

test('empty published sections contain only visitor copy with no placeholder space', async ({ page }, info) => {
  test.setTimeout(120000);
  await page.route('**/content/catalog.json', route => route.fulfill({ json: { version: 1, articles: [], products: [], relationship: null } }));
  for (const language of ['zh-TW', 'en']) {
    for (const route of ['relationships', 'shop', 'archive', 'about', '']) {
      await page.goto(`./#/${route}`);
      await expect(page.locator('main h1')).toBeVisible();
      if (await page.locator('html').getAttribute('lang') !== language)
        await page.getByRole('button', { name: language === 'en' ? 'Switch to English' : '切換為繁體中文', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('body')).not.toContainText(forbidden);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (['relationships', 'shop', 'archive'].includes(route)) {
        await expect(page.locator('.empty-state,.empty-mark,.product-placeholder,.cover-placeholder,.product-card,.map-shell')).toHaveCount(0);
      }
      if (route === 'relationships') {
        await expect(page.locator('.content-heading>p').last()).toHaveText(language === 'en' ? 'Encounters, connections, and the world we share.' : '相遇、牽絆，以及同一個世界裡的彼此。');
        await expect(page.locator('main')).not.toContainText('✳');
        const heading = await page.locator('.content-heading').boundingBox();
        const footer = await page.locator('footer').boundingBox();
        expect(footer!.y - (heading!.y + heading!.height)).toBeLessThan(200);
        await page.screenshot({ path: `reports/${info.project.name}-relationships-${language}-public.png`, fullPage: true });
      }
    }
  }
});
