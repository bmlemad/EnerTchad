const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
const pairs=[['/aval/reseau','/aval/reseau-en','station-service'],['/aval/raffinage','/aval/raffinage-en','projet-modulaire'],['/cadre-hse','/cadre-hse-en','inspection-hse'],['/carrieres','/carrieres-en','formation-talents'],['/tchaditech/','/pole-tchaditech-en','supervision-numerique'],['/communautes','/communautes-en','communautes-eau']];
for(const width of [320,1440]) for(const en of [false,true]) test(`mobile navigation — complementary editorial images ${width} ${en?'en':'fr'}`,async({browser})=>{
  test.setTimeout(180000);
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const [fr,english,key] of pairs){
    await page.goto(new URL(en?english:fr,base).href,{waitUntil:'load'});
    const section=page.locator('[data-et-editorial-collection="20261125"]');
    await expect(section).toHaveCount(1);
    const image=section.locator('img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
    await expect(image).toHaveAttribute('alt',en?/fictional|Conceptual/:/fictif|synthèse/);
    expect(await image.evaluate(e=>e.currentSrc)).toContain(`${key}-${width===320?'mobile720.avif':'1400.webp'}`);
    await expect(section.locator('figcaption')).toContainText(en?'fictional scene':'scène fictive');
    await expect(section.locator('figcaption a')).toHaveAttribute('href',`/credits-photos${en?'-en':''}#collection-20261125`);
    const frame=await image.boundingBox();
    expect(Math.abs(frame.width/frame.height-1400/788)).toBeLessThan(.02);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:`artifacts/editorial-${key}-${en?'en':'fr'}-${width}.png`,animations:'disabled'});
  }
  await page.goto(new URL(`/credits-photos${en?'-en':''}`,base).href,{waitUntil:'load'});
  await expect(page.locator('#collection-20261125 .cr-item')).toHaveCount(6);
  await expect(page.locator('#collection-20261117 .cr-item')).toHaveCount(7);
  await page.close();
});
