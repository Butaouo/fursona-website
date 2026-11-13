import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { characterText } from '../src/config/characterCopy';

const current = (position: string) => `[data-copy-position="${position}"] [data-copy-current]`;

test('original social grid exposes all eleven platforms without an expander', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.social-grid > .social-link')).toHaveCount(11);
  for(const card of await page.locator('.social-grid > .social-link').all()) await expect(card).toBeVisible();
  await expect(page.locator('.social-panel details,.social-panel summary,.social-panel [aria-expanded]')).toHaveCount(0);
  const logos=await page.locator('.social-link .social-brand svg,.social-link .social-brand img').count(); expect(logos).toBe(11);
  await expect(page.getByRole('button',{name:'複製 QQ 3505606117',exact:true})).toBeVisible();
});

test('home quotes follow manual themes without changing the frame or replaying the opening', async ({ page }, info) => {
  // Two full-page captures on software-rendered WebKit need their own total
  // scenario budget. Assertion deadlines and all visual thresholds stay intact.
  test.setTimeout(60000);
  await page.goto('./');
  await expect(page.locator('.hero-image')).toBeVisible();
  await expect(page.getByTestId('opening')).toHaveCount(0,{timeout:19000});
  const frame=await page.locator('.art-frame').boundingBox();
  const actions=await page.locator('.hero-actions').boundingBox();
  const seen=await page.evaluate(()=>sessionStorage.getItem('longday:opening'));
  for(const theme of ['light','dark'] as const){
    await page.getByTestId(`theme-${theme}`).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    await expect(page.locator(current('home'))).toHaveText(characterText('home',theme,'zh-TW'));
    await expect(page.locator(current('artwork'))).toHaveText(characterText('artwork',theme,'zh-TW'));
    await expect(page.locator('.floating-note')).toHaveText('角色插畫');
    const after=await page.locator('.art-frame').boundingBox();
    expect(Math.abs(after!.height-frame!.height)).toBeLessThan(1);
    expect(Math.abs((await page.locator('.hero-actions').boundingBox())!.y-actions!.y)).toBeLessThan(1);
    await expect(page.getByTestId('opening')).toHaveCount(0);
    expect(await page.evaluate(()=>sessionStorage.getItem('longday:opening'))).toBe(seen);
    await expect(page.locator('[data-copy-position="artwork"] .theme-copy-ink')).toHaveCount(1);
    await page.screenshot({path:`reports/${info.project.name}-review-home-${theme}.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Switch to English',exact:true}).click();
  await expect(page.locator(current('artwork'))).toHaveText(characterText('artwork','dark','en'));
  await expect(page.locator('.floating-note')).toHaveText('Character artwork');
});

test('character narration changes with the theme while objective data stays unchanged', async ({ page }, info) => {
  // Preserve both full-page theme captures without timing out during capture.
  test.setTimeout(60000);
  await page.goto('./#/about');
  await expect(page.locator('main h1')).toContainText('久天');
  await expect(page.getByTestId('opening')).toHaveCount(0,{timeout:19000});
  await page.getByTestId('theme-light').click();
  await expect(page.locator(current('narration'))).toHaveText('名字取意於希望日落能停留更久');
  await expect(page.locator(current('character'))).toHaveText('落日熔金 盼願永恆');
  await expect(page.locator('.name-meaning dd')).toHaveText('希望日落能停留得更久');
  const top=await page.locator('#fursona-heading').boundingBox();
  await page.screenshot({path:`reports/${info.project.name}-review-character-light.png`,fullPage:true});
  await page.getByTestId('theme-dark').click();
  await expect(page.locator(current('narration'))).toHaveText('可夢終會醒 日總會落');
  await expect(page.locator(current('character'))).toHaveText('夢醒來後又該如何重新睡去');
  await expect(page.locator('.name-meaning dd')).toHaveText('希望日落能停留得更久');
  expect(Math.abs((await page.locator('#fursona-heading').boundingBox())!.y-top!.y)).toBeLessThan(1);
  await expect(page.locator('[data-copy-position="character"] .theme-copy-ink')).toHaveCount(1);
  await page.screenshot({path:`reports/${info.project.name}-review-character-dark.png`,fullPage:true});
  await page.getByRole('button',{name:'Switch to English',exact:true}).click();
  await expect(page.locator(current('narration'))).toHaveText(characterText('narration','dark','en'));
  await expect(page.locator('.file-facts')).toContainText('A wish for the sunset to linger longer');
  await expect(page).toHaveURL(/#\/about$/);
});

test('effective system theme updates all home copy without resetting scroll or the route', async ({ page }) => {
  await page.addInitScript(()=>sessionStorage.setItem('longday:opening','seen'));
  await page.goto('./');await page.getByTestId('theme-system').click();
  await page.locator('.social-panel').scrollIntoViewIfNeeded();
  const top=await page.evaluate(()=>scrollY);
  for(const theme of ['dark','light'] as const){
    await page.emulateMedia({colorScheme:theme});
    await expect(page.locator(current('home'))).toHaveText(characterText('home',theme,'zh-TW'));
    await expect(page.locator(current('artwork'))).toHaveText(characterText('artwork',theme,'zh-TW'));
    expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(2);
    await expect(page.getByTestId('opening')).toHaveCount(0);
  }
  // Dispatch the existing control's click without Playwright scrolling to the
  // offscreen header; this isolates the application's scroll preservation.
  await page.getByTestId('theme-dark').dispatchEvent('click');
  await expect(page.locator(current('home'))).toHaveText('我從來都不想要自由');
  expect(Math.abs(await page.evaluate(()=>scrollY)-top)).toBeLessThan(2);
  await expect(page).not.toHaveURL(/#\/about/);
});

test('small artwork captions remain within the existing one-line frame in both languages', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:320,height:850});await page.goto('./');
  const before=await page.locator('.art-frame').boundingBox();
  for(const language of ['zh-TW','en'] as const){
    if(language==='en')await page.getByRole('button',{name:'Switch to English',exact:true}).click();
    for(const theme of ['light','dark'] as const){
      await page.getByTestId(`theme-${theme}`).click();
      const ink=page.locator('[data-copy-position="artwork"] .theme-copy-ink');
      await expect(ink).toHaveText(characterText('artwork',theme,language));
      const size=await ink.evaluate(n=>({scroll:n.scrollWidth,width:n.clientWidth}));expect(size.scroll).toBeLessThanOrEqual(size.width+1);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(Math.abs((await page.locator('.art-frame').boundingBox())!.height-before!.height)).toBeLessThan(1);
    }
  }
});

test('the reference viewer retains keyboard controls and a fullscreen fallback', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./#/about');
  await page.getByRole('tab',{name:'毛色設定',exact:true}).click();await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab',{name:'角色插畫',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('button',{name:'查看完整圖片',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'全螢幕檢視',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveClass(/is-expanded/);
  await page.getByRole('button',{name:'關閉',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'查看完整圖片',exact:true})).toBeFocused();
});

test('reduced motion applies theme copy immediately with one accessible value', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./');await page.getByTestId('theme-dark').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion','still');
  await expect(page.locator(current('home'))).toHaveText('我從來都不想要自由');
  await expect(page.locator('[data-copy-position="home"] .theme-copy-ink')).toHaveCount(1);
  await expect(page.locator('[data-copy-position="home"] .theme-copy-ink')).toHaveCSS('transform','none');
  await expect(page.getByTestId('opening')).toHaveCount(0);
});

test('the redesigned character file remains accessible and responsive in both themes', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('./#/about');
  for(const theme of ['light','dark'] as const){
    await page.getByTestId(`theme-${theme}`).click();
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(result.violations).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await expect(page.locator('.file-palette .color-sample')).toHaveCount(5);
});
