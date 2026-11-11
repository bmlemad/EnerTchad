const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
const routes=['/','/index-en','/amont/','/aval/','/intermediaire/','/enerconseils/','/boutique/clients','/boutique/en/clients','/contact','/ar-presse'];
for(const width of [320,360,390,1440])test(`forms, anchors and interactive — thematic keyboard theme switch ${width}`,async({browser})=>{
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const route of ['/amont/','/pole-amont-en','/intermediaire/','/aval/','/petrochimie/','/enerconseils/','/greentech/']){
    await page.goto(new URL(route,base).href,{waitUntil:'networkidle'});
    const toggle=page.locator('#etThemeHdr');
    await expect(toggle,route+' theme control').toBeVisible();
    const before=await toggle.getAttribute('aria-pressed');
    await toggle.focus();await expect(toggle).toBeFocused();await toggle.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed',before==='true'?'false':'true');
    const dark=before!=='true';
    await expect(page.locator('html')).toHaveClass(dark?/^(?!.*et-plight).*$/:/et-plight/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' theme overflow').toBe(true);
    await page.reload({waitUntil:'networkidle'});
    await expect(page.locator('#etThemeHdr')).toBeVisible();
    await expect(page.locator('#etThemeHdr')).toHaveAttribute('aria-pressed',dark?'true':'false');
    await page.locator('#etThemeHdr').click();
    await expect(page.locator('#etThemeHdr')).toHaveAttribute('aria-pressed',before);
  }
  await page.close();
});
for(const width of [320,1440])test(`forms, anchors and interactive — shared design contract ${width}`,async({browser})=>{
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const route of routes){
    await page.goto(new URL(route,base).href,{waitUntil:'networkidle'});
    await expect(page.locator('style[data-et-design-system]'),route).toHaveCount(1);
    for(const light of [true,false]){
      await page.evaluate(light=>{document.documentElement.classList.toggle('et-plight',light);document.documentElement.classList.remove('et-jlight');},light);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),route+' overflow').toBe(true);
      const cards=page.locator('.hm-card,.ec-offer,.ec-status,.pp-box,.et-sector-brief,#et-enquiry-next-steps');
      for(const card of await cards.all()){
        const s=await card.evaluate(n=>({radius:getComputedStyle(n).borderRadius,blur:getComputedStyle(n).backdropFilter}));
        expect(s.radius,route+' card radius').toBe('16px');expect(s.blur,route+' content blur').toBe('none');
      }
      const action=page.locator('main .pp-btn,main .ec-primary,.hm main .et-actions>a').first();
      if(await action.count()){
        await expect(action).toHaveCSS('border-radius','0px'); // direction editoriale (11 novembre 2026) : actions a aretes vives
       
        expect((await action.boundingBox()).height,route+' action target').toBeGreaterThanOrEqual(48);
        await action.focus();await expect(action).toBeFocused();
      }
    }
    if(['/','/amont/','/boutique/clients','/ar-presse'].includes(route)){
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`artifacts/design-${route==='/'?'home':route.replace(/\W/g,'')}-${width}.png`});
    }
  }
  await page.close();
});

// Closed <details> panels can expose layout boxes even though their content is
// not painted. Open the cadastre before measuring contrast or keyboard focus.
for(const en of [false,true])for(const width of [320,1440])for(const light of [true,false]){
  test(`forms, anchors and interactive — atlas action contrast ${en?'en':'fr'} ${width} ${light?'light':'dark'}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.goto(new URL(en?'/atlas/carte-en':'/atlas/carte',base).href,{waitUntil:'networkidle'});
    await page.evaluate(light=>{document.documentElement.classList.toggle('et-plight',light);document.documentElement.classList.remove('et-jlight');},light);
    const details=page.locator('#atl-cadastre details').first();
    await details.locator(':scope > summary').click();
    await expect(details).toHaveAttribute('open','');
    const action=details.locator('.atlas-gold-panel>a');
    await action.scrollIntoViewIfNeeded();await expect(action).toBeVisible();
    await expect(details.locator('.atlas-gold-panel')).toHaveCSS('opacity','1');
    const ratio=await action.evaluate(n=>{
      const s=getComputedStyle(n),rgb=c=>c.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance=c=>{const a=rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722};
      const a=luminance(s.color),b=luminance(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    });
    expect(ratio,'CTA text contrast').toBeGreaterThanOrEqual(4.5);
    await action.focus();await expect(action).toBeFocused();
    await expect(action).toHaveCSS('border-radius','0px');
    expect((await action.boundingBox()).height).toBeGreaterThanOrEqual(48);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    const href=await action.getAttribute('href');
    expect(href).toBe(en?'/atlas/cadre-sectoriel-en#atl-entrer':'/atlas/cadre-sectoriel#atl-entrer');
    await page.screenshot({path:`artifacts/atlas-action-${en?'en':'fr'}-${width}-${light?'light':'dark'}.png`});
    await page.close();
  });
}
