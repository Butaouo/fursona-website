import { test, expect, type Page } from '@playwright/test';

const held = () => { let release!: () => void; const promise = new Promise<void>(done => { release = done; }); return { promise, release }; };
const started = (page: Page) => expect(page.getByTestId('opening')).toHaveAttribute('data-phase', 'playing', { timeout: 12000 });
const finished = (page: Page) => expect(page.getByTestId('opening')).toHaveCount(0, { timeout: 7000 });

async function recordPresentation(page: Page) {
  await page.addInitScript(() => {
    const evidence = { frame: 0, phases: [] as Array<{ phase: string; frame: number; time: number; visibility: string }>, duration: 0 };
    (window as unknown as Record<string, unknown>).openingEvidence = evidence;
    let previous = '';
    const observer = new MutationObserver(() => {
      const phase = document.querySelector('[data-testid="opening"]')?.getAttribute('data-phase') || 'absent';
      if (phase !== previous) {
        evidence.phases.push({ phase, frame: evidence.frame, time: performance.now(), visibility: document.visibilityState }); previous = phase;
      }
    });
    observer.observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-phase'] });
    const frame = () => { evidence.frame++; if (!evidence.duration) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    document.addEventListener('animationend', event => { if (event.animationName === 'shutter-down') evidence.duration = event.elapsedTime; });
  });
}

test('critical image decoding and fonts precede two painted frames and the full opening', async ({ page }, info) => {
  const image = held(); await recordPresentation(page);
  await page.route('**/images/lyont-hero*.webp', async route => { await image.promise; await route.continue(); });
  await page.addInitScript(() => {
    let release!: () => void;
    const ready = new Promise<void>(done => { release = done; });
    Object.defineProperty(document.fonts, 'ready', { get: () => ready });
    (window as unknown as Record<string, unknown>).releaseOpeningFonts = release;
  });
  try {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('opening')).toHaveAttribute('data-phase', 'preparing');
    // Deliberately exceed the old 1.15s lifetime while the resource is pending.
    await page.waitForTimeout(1300);
    expect(await page.evaluate(() => ({ phase: document.querySelector('.opening')?.getAttribute('data-phase'), seen: sessionStorage.getItem('longday:opening'), animations: document.querySelector('.shutter-bottom')?.getAnimations().length }))).toEqual({ phase: 'preparing', seen: null, animations: 0 });
    image.release();
    await expect.poll(() => page.locator('.hero-image').evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
    await expect(page.getByTestId('opening')).toHaveAttribute('data-phase', 'preparing');
    await page.evaluate(() => ((window as unknown as Record<string, () => void>).releaseOpeningFonts)());
    await started(page);
    const timing = await page.locator('.shutter-bottom').evaluate(node => node.getAnimations()[0].effect!.getTiming());
    expect(timing.duration).toBe(4600);
    await finished(page);
    const evidence = await page.evaluate(() => (window as unknown as Record<string, { phases: Array<{ phase: string; frame: number; visibility: string }>; duration: number }>).openingEvidence);
    const armed = evidence.phases.find(entry => entry.phase === 'armed')!, playing = evidence.phases.find(entry => entry.phase === 'playing')!;
    expect(playing.frame - armed.frame).toBeGreaterThanOrEqual(2); expect(playing.visibility).toBe('visible');
    // Firefox exposes AnimationEvent.elapsedTime with float32 rounding. Keep
    // the exact 4600ms CSS timing check above and compare event seconds to .5ms.
    expect(evidence.duration).toBeCloseTo(4.6, 3);
    await info.attach('readiness-and-rendering', { body: JSON.stringify(evidence), contentType: 'application/json' });
  } finally { image.release(); }
});

test('hidden startup and a hidden interval cannot spend the visible presentation timeline', async ({ page }, info) => {
  await recordPresentation(page);
  await page.addInitScript(() => {
    let state = 'hidden';
    Object.defineProperty(document, 'visibilityState', { get: () => state });
    (window as unknown as Record<string, unknown>).setOpeningVisibility = (next: string) => { state = next; document.dispatchEvent(new Event('visibilitychange')); };
  });
  const visibility = (value: string) => page.evaluate(value => ((window as unknown as Record<string, (value: string) => void>).setOpeningVisibility)(value), value);
  await page.goto('./');
  await expect(page.getByTestId('opening')).toHaveAttribute('data-phase', 'armed');
  await page.waitForTimeout(1300);
  expect(await page.locator('.shutter-bottom').evaluate(node => node.getAnimations().length)).toBe(0);
  expect(await page.evaluate(() => sessionStorage.getItem('longday:opening'))).toBeNull();
  await visibility('visible'); await started(page);
  await visibility('hidden');
  await expect(page.getByTestId('opening')).toHaveAttribute('data-visible', 'false');
  // CSS pause is pending until the animation's ready promise settles. Reading
  // currentTime before that can compare a pending sample with its held time
  // (Firefox exposed a 135ms difference although the hidden interval froze).
  const paused = await page.locator('.shutter-bottom').evaluate(async node => {
    const animation = node.getAnimations()[0]; await animation.ready;
    return { state: animation.playState, time: Number(animation.currentTime) };
  });
  expect(paused.state).toBe('paused');
  const before = paused.time;
  await page.waitForTimeout(1400);
  const after = await page.locator('.shutter-bottom').evaluate(node => Number(node.getAnimations()[0].currentTime));
  expect(Math.abs(after - before)).toBeLessThan(100);
  await visibility('visible'); await finished(page);
  const evidence = await page.evaluate(() => (window as unknown as Record<string, unknown>).openingEvidence);
  await info.attach('visibility-timeline', { body: JSON.stringify({ before, after, evidence, visibilitySimulation: true }), contentType: 'application/json' });
});

test('failed critical images settle and the bilingual skip control works with keyboard or touch', async ({ page, hasTouch }) => {
  await page.route('**/images/lyont-hero*.webp', route => route.abort());
  await page.goto('./', { waitUntil: 'domcontentloaded' }); await started(page);
  await expect(page.getByTestId('opening')).toHaveAttribute('data-readiness', 'ready');
  await expect(page.locator('.image-fallback')).toBeVisible();
  const skip = page.getByRole('button', { name: '跳過動畫', exact: true });
  if (hasTouch) { const bounds = await skip.boundingBox(); await page.touchscreen.tap(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2); }
  else await skip.press('Enter');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await page.reload(); await expect(page.locator('#hero-heading')).toBeVisible();
  await expect(page.getByTestId('opening')).toHaveCount(0);
});

test('stalled images hit the bounded escape hatch instead of trapping the visitor', async ({ page }) => {
  const image = held();
  await page.route('**/images/lyont-hero*.webp', async route => { await image.promise; await route.continue(); });
  try {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('opening')).toHaveAttribute('data-phase', 'preparing');
    await expect(page.getByTestId('opening')).toHaveAttribute('data-readiness', 'timeout', { timeout: 11000 });
    await started(page);
    await page.getByRole('button', { name: '跳過動畫', exact: true }).click();
    await expect(page.getByTestId('opening')).toHaveCount(0);
    await page.getByRole('link', { name: '設定', exact: true }).click();
    await expect(page.locator('main h1')).toContainText('設定');
  } finally { image.release(); }
});

test('skip works during preparation and reduced-motion never enters a waiting screen', async ({ page }) => {
  const image = held();
  await page.route('**/images/lyont-hero*.webp', async route => { await image.promise; await route.continue(); });
  try {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('opening')).toHaveAttribute('data-phase', 'preparing');
    await page.getByRole('button', { name: '跳過動畫', exact: true }).click();
    await expect(page.getByTestId('opening')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => sessionStorage.removeItem('longday:opening'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#hero-heading')).toBeVisible();
    await expect(page.getByTestId('opening')).toHaveCount(0);
  } finally { image.release(); }
});

test('external entry and session refresh retain the startup rules', async ({ page, context, browserName, baseURL }) => {
  if (browserName === 'chromium') {
    const network = await context.newCDPSession(page);
    await network.send('Network.enable');
    await network.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 });
  }
  const entry = 'http://entry.longday.test/';
  await page.route(entry, route => route.fulfill({ contentType: 'text/html', body: `<a href="${baseURL}">LongDay</a>` }));
  await page.goto(entry); await page.unroute(entry);
  await page.getByRole('link', { name: 'LongDay', exact: true }).click(); await started(page);
  expect(await page.evaluate(() => document.referrer)).toBe(entry);
  await page.getByRole('button', { name: '跳過動畫', exact: true }).click();
  await page.reload(); await expect(page.locator('#hero-heading')).toBeVisible();
  await expect(page.getByTestId('opening')).toHaveCount(0);
});

// Cache warming and return navigation have their own normal test budget.
// Keeping two separate full visits in the external-entry test exhausted its
// deadline on the shared WebKit runner before its final assertions could run.
test('a warm fresh tab plays once and returning home does not replay it', async ({ page, context, browserName, baseURL }, info) => {
  await page.goto(baseURL!, { waitUntil: 'domcontentloaded' }); await started(page);
  await page.getByRole('button', { name: '跳過動畫', exact: true }).click();
  const warm = await context.newPage();
  try {
    if (browserName === 'chromium') {
      const network = await context.newCDPSession(warm);
      await network.send('Network.enable');
      await network.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 500_000 / 8, uploadThroughput: 250_000 / 8 });
    }
    await warm.goto(baseURL!, { waitUntil: 'domcontentloaded' }); await started(warm);
    await warm.getByRole('button', { name: '跳過動畫', exact: true }).click();
    await warm.getByRole('link', { name: '設定', exact: true }).click(); await expect(warm.locator('main h1')).toContainText('設定');
    await warm.getByRole('link', { name: '首頁', exact: true }).click(); await expect(warm.locator('#hero-heading')).toBeVisible();
    await expect(warm.getByTestId('opening')).toHaveCount(0);
    await info.attach('network-and-cache', { body: JSON.stringify({ network: browserName === 'chromium' ? ['4G: 1.6 Mbps / 150ms', 'slower: 500 kbps / 400ms'] : 'engine defaults; delayed critical resources are tested separately', resources: await warm.evaluate(() => performance.getEntriesByType('resource').map(entry => ({ name: entry.name, transferSize: (entry as PerformanceResourceTiming).transferSize }))) }), contentType: 'application/json' });
  } finally { await warm.close(); }
});
