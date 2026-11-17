const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
const routes=[['/amont/','/pole-amont-en','upstream'],['/intermediaire/','/pole-intermediaire-en','transport'],['/aval/','/pole-aval-en','refining'],['/petrochimie/','/pole-enerchimie-en','petrochemicals'],['/enerconseils/','/pole-enerconseils-en','engineering'],['/greentech/','/pole-greentech-en','transition']];
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
  await expect(page.locator('.ec-hero h1')).toBeVisible();
  await page.goto(new URL('/credits-photos'+(en?'-en':''),base).href,{waitUntil:'networkidle'});
  await expect(page.locator('#collection-20261117 .cr-item')).toHaveCount(7);
  await expect(page.locator('#collection-20261117')).toContainText(en?'AI-generated':'générés par IA');
  await page.close();
});
