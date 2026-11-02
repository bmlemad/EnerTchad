const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
for(const en of [false,true])for(const width of [320,390,1241,1440]){
 test(`forms, anchors and interactive — corporate architecture ${en?'en':'fr'} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto(new URL(en?'/index-en':'/',base).href,{waitUntil:'networkidle'});
  const consent=page.getByRole('button',{name:/Tout refuser|Reject all/});if(await consent.isVisible())await consent.click();
  const triggers=page.locator('#navLinks > .nav-item > .nav-trigger');await expect(triggers).toHaveCount(6);
  if(width<1241)await page.locator('#navTog').click();
  const expected=en?['Company','Activities & Engineering','Projects','Commitments','News & Documents','Investors']:['Entreprise','Activités & Ingénierie','Projets','Engagements','Actualités & Documents','Investisseurs'];
  for(let i=0;i<6;i++){
   const button=triggers.nth(i);await expect(button).toHaveText(expected[i]);await button.focus();await page.keyboard.press('Enter');await expect(button).toHaveAttribute('aria-expanded','true');
   const panel=page.locator('#'+await button.getAttribute('aria-controls'));await expect(panel).toBeVisible();
   const geometry=await panel.evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+2,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}));expect(geometry.overflow).toBe(false);expect(geometry.left).toBeGreaterThanOrEqual(-1);expect(geometry.right).toBeLessThanOrEqual(width+1);
   if(width>=1241){await page.keyboard.press('Escape');await expect(button).toHaveAttribute('aria-expanded','false');}else await button.click();
  }
  if(width<1241)await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await expect(page.locator('footer [data-et-corporate-sections] a')).toHaveCount(6);
  await page.screenshot({path:`artifacts/corporate-architecture-${en?'en':'fr'}-${width}.png`,fullPage:false});
 });
}
for(const en of [false,true])test(`forms, anchors and interactive — architecture hubs and editorial ${en?'en':'fr'}`,async({page})=>{
 const s=en?'-en':'';for(const path of ['/societe','/nos-activites','/projets','/engagements','/publications','/investisseurs']){
  await page.goto(new URL(path+s,base).href,{waitUntil:'domcontentloaded'});await expect(page.locator('#et-architecture-context')).toHaveCount(1);
 }
 await page.goto(new URL('/communiques'+s,base).href);await expect(page.locator('[data-et-content-kind="official"]')).toHaveCount(1);
});
