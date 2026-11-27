const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
for(const path of ['/','/index-en','/savoirs','/publications-en']){
 for(const width of [390,1241,1440]){
  test(`mega-menu — four panels, keyboard and viewport ${path} ${width}`,async({page})=>{
   await page.setViewportSize({width,height:900});
   await page.goto(new URL(path,base).href,{waitUntil:'load'});
   await page.evaluate(()=>document.querySelector('#et-consent')?.remove());
   if(width<1241)await page.locator('#navTog').click();
   await expect(page.locator('#nav [data-et-sub]')).toHaveCount(4);
   for(const id of ['groupe','activites','clients','ressources']){
    const toggle=page.locator('[aria-controls="et-sub-'+id+'"]'),panel=page.locator('#et-sub-'+id);
    await toggle.focus();await page.keyboard.press('Enter');
    await expect(panel).toBeVisible();await expect(toggle).toHaveAttribute('aria-expanded','true');
    await page.keyboard.press('Tab');await expect(panel.locator('a').first()).toBeFocused();
    if(id==='activites'){await expect(panel.locator('a.et-sub-link')).toHaveCount(5);await expect(panel.locator('a.et-sub-extra')).toHaveAttribute('href',path.includes('-en')?'/projets-en':'/projets');}
    const box=await panel.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
    if(width>=1241){const painted=await panel.evaluate(p=>{const r=p.getBoundingClientRect();return p.contains(document.elementFromPoint(r.x+30,r.y+30));});expect(painted,'expanded panel is painted above the page').toBe(true);}
    await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(toggle).toBeFocused();
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
   if(width<1241){await page.keyboard.press('Escape');await expect(page.locator('#navTog')).toHaveAttribute('aria-expanded','false');}
  });
 }
}
test('mega-menu — desktop hover switches panels without overlap',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto(new URL('/',base).href);
 await page.locator('[data-et-sub]').nth(0).locator('>a').hover();await expect(page.locator('#et-sub-groupe')).toBeVisible();
 await page.locator('[data-et-sub]').nth(1).locator('>a').hover();await expect(page.locator('#et-sub-activites')).toBeVisible();await expect(page.locator('#et-sub-groupe')).toBeHidden();
});
