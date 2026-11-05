const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
const routes=['/','/index-en','/amont/','/aval/','/intermediaire/','/enerconseils/','/boutique/clients','/boutique/en/clients','/contact','/ar-presse'];
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
        await expect(action).toHaveCSS('border-radius','10px');
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
