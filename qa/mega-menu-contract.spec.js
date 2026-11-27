const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
for(const en of [false,true])for(const width of [320,390,1241,1440]){
 test(`mega-menu — global header and legal footer ${en?'en':'fr'} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto(new URL(en?'/index-en':'/',base).href,{waitUntil:'load'});
  if(width<1241)await page.locator('#navTog').click();
  const links=page.locator('#navLinks>.nav-item>a.nx-direct');
  await expect(links).toHaveText(en?['The Group','Activities','Client solutions','Impact','Investors','Resources']:['Le Groupe','Activités','Solutions clients','Impact','Investisseurs','Ressources']);
  for(let i=0;i<6;i++)await expect(links.nth(i)).toBeVisible();
  const geometry=await links.evaluateAll(items=>items.map(a=>{const r=a.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top};}));
  for(const r of geometry){expect(r.left).toBeGreaterThanOrEqual(0);expect(r.right).toBeLessThanOrEqual(width+1);}
  if(width>=1241)expect(new Set(geometry.map(r=>Math.round(r.top))).size).toBe(1);
  const legal=await page.locator('footer a[href]').evaluateAll(items=>items.map(a=>a.getAttribute('href')).filter(h=>/^\/(mentions-legales|confidentialite|cookies|accessibilite|avertissements|ethique)(-en)?(#alerte)?\/?$/.test(h)));
  expect(new Set(legal).size).toBe(legal.length);
  if(width<1241)await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
 });
}
test('mega-menu — Arabic visitors can select complete resources in FR and EN',async({page})=>{
 await page.goto(new URL('/ar',base).href);
 await expect(page.locator('aside[aria-label="اللغات المتاحة"] a[hreflang="fr"]')).toHaveCount(2);
 await expect(page.locator('aside[aria-label="اللغات المتاحة"] a[hreflang="en"]')).toHaveCount(2);
});
