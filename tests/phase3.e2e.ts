import { test, expect, type Page } from '@playwright/test';
const errors = new WeakMap<Page,string[]>();
test.beforeEach(async({page,baseURL})=>{
  const failures:string[]=[];errors.set(page,failures);
  page.on('pageerror',e=>failures.push(e.message));
  page.on('console',e=>{if(e.type()==='error')failures.push(e.text());});
  page.on('response',r=>{if(r.url().startsWith(baseURL!)&&r.status()>=400)failures.push(`${r.status()} ${r.url()}`);});
});
test.afterEach(async({page},info)=>{
  expect(errors.get(page)).toEqual([]);
  if(info.status==='passed')await info.attach('motion-brand-screen',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});
test('opening plays once and never traps input or repeats on return',async({page})=>{
  await page.addInitScript(()=>{
    (window as unknown as Record<string,number>).openingSeen=0;
    const observer=new MutationObserver(()=>{if(document.querySelector('[data-testid="opening"]'))(window as unknown as Record<string,number>).openingSeen++;});
    observer.observe(document,{childList:true,subtree:true});
  });
  await page.goto('./');
  await expect.poll(()=>page.evaluate(()=>(window as unknown as Record<string,number>).openingSeen)).toBeGreaterThan(0);
  await expect(page.getByTestId('opening')).toHaveAttribute('data-phase','playing',{timeout:12000});
  // The requested 4.6s presentation starts after readiness, not React mount.
  await expect(page.getByTestId('opening')).toHaveCount(0,{timeout:7000});
  await page.getByRole('link',{name:'商品',exact:true}).click();
  await expect(page.locator('main h1')).toContainText('商品');
  await page.getByRole('link',{name:'首頁',exact:true}).click();
  await expect(page.locator('#hero-heading')).toBeVisible();
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await page.reload();await expect(page.locator('#hero-heading')).toBeVisible();
  expect(await page.evaluate(()=>(window as unknown as Record<string,number>).openingSeen)).toBe(0);
});
test('normal phones retain three moving lights, scroll depth and touch feedback',async({page,hasTouch},info)=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4});Object.defineProperty(navigator,'deviceMemory',{get:()=>4});});
  await page.goto('./');await expect(page.locator('html')).toHaveAttribute('data-quality','high');
  const lights=page.locator('.ambient-orb');await expect(lights).toHaveCount(3);
  for(const light of await lights.all())await expect(light).toBeVisible();
  const orb=page.locator('.orb-one');const initial=await orb.evaluate(el=>getComputedStyle(el).transform);
  await expect.poll(()=>orb.evaluate(el=>getComputedStyle(el).transform)).not.toBe(initial);
  const depth=await page.locator('.ambient-depth').getAttribute('style');
  await page.locator('.social-panel').scrollIntoViewIfNeeded();
  await expect(page.locator('.social-panel')).toHaveAttribute('data-revealed','true');
  await expect.poll(()=>page.locator('.ambient-depth').getAttribute('style')).not.toBe(depth);
  // Inspect the short wave in the same event turn. A separate protocol round trip
  // can arrive after the 680 ms wave has finished on software-rendered WebKit.
  const feedback = await page.locator('.social-panel').evaluate(el => {
    el.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',clientX:100,clientY:200,pointerId:3,bubbles:true}));
    const wave=document.querySelector('.touch-wave')!;
    const animations=wave.getAnimations();
    return { count:animations.length,duration:animations[0]?.effect?.getTiming().duration };
  });
  await expect(page.locator('.social-panel')).toHaveAttribute('data-pressed','true');
  expect(feedback.count).toBeGreaterThan(0);
  expect(feedback.duration).toBe(680);
  await page.locator('.social-panel').dispatchEvent('pointerup',{pointerType:'touch',pointerId:3});
  await expect(page.locator('.social-panel')).not.toHaveAttribute('data-pressed','true');
  if (hasTouch) {
    await page.evaluate(() => {
      window.addEventListener('pointerdown',e => {
        if (e.pointerType === 'touch') queueMicrotask(() => {
          const wave=document.querySelector('.touch-wave')!;
          const animations=wave.getAnimations();
          (window as unknown as Record<string,unknown>).nativeTouchEvidence={count:animations.length,duration:animations[0]?.effect?.getTiming().duration};
        });
      },{once:true});
    });
    const box=await page.locator('.social-panel').boundingBox();
    // Tap the card's padding, away from any external social destination.
    await page.touchscreen.tap(box!.x+8,box!.y+8);
    const native=await page.evaluate(()=>(window as unknown as Record<string,{count:number;duration:number}>).nativeTouchEvidence);
    expect(native.count).toBeGreaterThan(0);expect(native.duration).toBe(680);
  }
  await info.attach('motion-measurements',{body:JSON.stringify({initialLight:initial,currentLight:await orb.evaluate(el=>getComputedStyle(el).transform),depthBefore:depth,depthAfter:await page.locator('.ambient-depth').getAttribute('style'),touchAnimation:feedback,nativeTouch:hasTouch}),contentType:'application/json'});
});
test('low effects retain motion while reduced-motion and pause stop it',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(navigator,'deviceMemory',{get:()=>1}));
  await page.goto('./');await expect(page.locator('html')).toHaveAttribute('data-quality','low');
  const orb=page.locator('.orb-one');expect(await orb.evaluate(el=>getComputedStyle(el).animationName)).not.toBe('none');
  await page.getByRole('button',{name:'暫停動態效果',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion','still');await expect(orb).toHaveCSS('animation-name','none');
  await page.getByRole('button',{name:'開啟動態效果',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion','full');
  await page.emulateMedia({reducedMotion:'reduce'});await expect(orb).toHaveCSS('animation-name','none');
  await expect(page.getByTestId('opening')).toHaveCount(0);
  await page.getByRole('link',{name:'商品',exact:true}).click();await expect(page.locator('main h1')).toContainText('商品');
});
test('reader text and illustrations reveal in order without changing semantics',async({page})=>{
  const blocks=[{type:'heading',runs:[{text:'第一節'}]},...Array.from({length:5},()=>({type:'paragraph',runs:[{text:'這是閱讀動態驗收內容。'.repeat(35)}]})),{type:'image',src:'images/lyont-illustration.webp',width:1280,height:870,alt:'久天插畫',caption:'插畫說明'},{type:'paragraph',runs:[{text:'圖片後的文字。'}]}];
  await page.route('**/content/catalog.json',r=>r.fulfill({json:{version:1,articles:[{id:'motion-story',kind:'novel',title:{'zh-TW':'閱讀動態'},summary:{'zh-TW':''},date:'2026-01-01',blocks}],products:[],relationship:null}}));
  await page.goto('./#/archive/motion-story');await expect(page.locator('main h1')).toContainText('閱讀動態');
  const figure=page.locator('.reader-body > figure');await expect(figure).toHaveClass(/scene-reveal/);
  await figure.scrollIntoViewIfNeeded();await expect(figure).toHaveAttribute('data-revealed','true');
  await expect(figure.locator('img')).toBeVisible();await expect(figure.locator('figcaption')).toHaveText('插畫說明');
  await page.getByRole('button',{name:'放大: 久天插畫',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
  expect(await page.locator('.reader-body').evaluate(el=>[...el.children].map(n=>n.tagName))).toEqual(['H2','P','P','P','P','P','FIGURE','P','NAV']);
  await expect(page.locator('.reader-body > nav')).toHaveAttribute('aria-label','章節目錄');
});
test('public branding and all displayed image sources remain local and neutral',async({page,baseURL})=>{
  await page.goto('./');await expect(page.locator('#hero-heading')).toBeVisible();
  const prohibited=/chatgpt|openai|dall[·. -]?e|oaiusercontent|sdmnt|blob\.core\.windows/i;
  expect(await page.locator('body').innerText()).not.toMatch(prohibited);
  const urls=await page.locator('img').evaluateAll(nodes=>nodes.map(n=>({src:(n as HTMLImageElement).currentSrc||(n as HTMLImageElement).src,alt:n.getAttribute('alt')})));
  for(const item of urls){expect(item.src).toContain(new URL(baseURL!).origin);expect(JSON.stringify(item)).not.toMatch(prohibited);}
  const metadata=await page.locator('head meta, head link').evaluateAll(nodes=>nodes.map(n=>n.outerHTML).join('\n'));expect(metadata).not.toMatch(prohibited);
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe('https://longday.tw/images/lyont-avatar.webp');
  expect(await page.locator('a[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')).join('\n'))).not.toMatch(prohibited);
});
