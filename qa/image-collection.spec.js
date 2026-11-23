const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
// 23 novembre 2026 (décision du DG) : les quatre segments reprennent les dessins au trait ; voir le test suivant.
const routes=[['/enerconseils/','/pole-enerconseils-en','engineering'],['/greentech/','/pole-greentech-en','transition']];
for(const en of [false,true])for(const width of [320,1440])test(`mobile navigation — conceptual image collection ${en?'en':'fr'} ${width}`,async({browser})=>{
  test.setTimeout(180000);
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const [fr,english,key] of routes){
    await page.goto(new URL(en?english:fr,base).href,{waitUntil:'networkidle'});
    const refuse=page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});if(await refuse.isVisible())await refuse.click();
    const image=page.locator(`#top-pole [data-et-collection="${key}"] img`);
    await expect(image).toBeVisible();
    expect(await image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
    await expect(image).toHaveAttribute('alt',en?/Conceptual illustration/:/Illustration de synthèse/);
    const actual=await image.evaluate(e=>e.currentSrc);
    expect(actual).toContain(width===320?`${key}-m720.avif`:`${key}-1400.webp`);
    await expect(page.locator('[data-et-image-credit] a')).toHaveAttribute('href',`/credits-photos${en?'-en':''}#collection-20261117`);
    for(const dark of [false,true]){
      const toggle=page.locator('#etThemeHdr');
      if((await toggle.getAttribute('aria-pressed'))!==(dark?'true':'false'))await toggle.click();
      await expect(page.locator('#top-pole h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      await page.screenshot({path:`artifacts/collection-${key}-${en?'en':'fr'}-${width}-${dark?'dark':'light'}.png`});
    }
  }
  await page.goto(new URL(en?'/boutique/en/clients':'/boutique/clients',base).href,{waitUntil:'networkidle'});
  const clientImage=page.locator('[data-et-collection="clients"]');
  await clientImage.scrollIntoViewIfNeeded();
  await expect(clientImage).toBeVisible();
  await expect.poll(()=>clientImage.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
  // A contained landscape image left most of the tall mobile scene blank.
  for(const dark of [false,true]){
    const toggle=page.locator('.et-theme-hdr');
    if((await toggle.getAttribute('aria-pressed'))!==(dark?'true':'false'))await toggle.click();
    await expect(clientImage).toHaveCSS('object-fit','cover');
    const frame=await clientImage.evaluate(e=>{const i=e.getBoundingClientRect(),s=e.closest('.im-scene').getBoundingClientRect();return{imageWidth:i.width,imageHeight:i.height,sceneWidth:s.width,sceneHeight:s.height};});
    expect(Math.abs(frame.imageWidth-frame.sceneWidth)).toBeLessThanOrEqual(2);
    expect(Math.abs(frame.imageHeight-frame.sceneHeight)).toBeLessThanOrEqual(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:`artifacts/collection-clients-${en?'en':'fr'}-${width}-${dark?'dark':'light'}.png`,animations:'disabled'});
  }
  await expect(page.locator('.ec-hero h1')).toBeVisible();
  await page.goto(new URL('/credits-photos'+(en?'-en':''),base).href,{waitUntil:'networkidle'});
  await expect(page.locator('#collection-20261117 .cr-item')).toHaveCount(7);
  await expect(page.locator('#collection-20261117')).toContainText(en?'AI-generated':'générées par IA');
  await page.close();
});

// 23 novembre 2026 (refonte des segments, décision du DG) : les quatre segments ouvrent sur un dessin au trait, sans image de synthèse.
for(const path of ['/amont/','/pole-amont-en','/intermediaire/','/pole-intermediaire-en','/petrochimie/','/pole-enerchimie-en','/aval/','/pole-aval-en'])test(`mobile navigation — segment hero uses the drawn illustration ${path}`,async({page})=>{
  await page.goto(new URL(path,base).href,{waitUntil:'load'});
  await expect(page.locator('#top-pole [data-et-collection]')).toHaveCount(0);
  await expect(page.locator('[data-et-image-credit]')).toHaveCount(0);
  const src=await page.locator('#top-pole img').first().evaluate(e=>e.currentSrc||e.src);
  expect(src).toMatch(/\/assets\/img\/p\//);
});
