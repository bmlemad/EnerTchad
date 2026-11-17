const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
for(const en of [false,true])for(const width of [320,390,1241,1440]){
 test(`forms, anchors and interactive — corporate architecture ${en?'en':'fr'} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.goto(new URL(en?'/index-en':'/',base).href,{waitUntil:'networkidle'});
  const consent=page.getByRole('button',{name:/Tout refuser|Reject all/});if(await consent.isVisible())await consent.click();
  // Lot 124 : en-tête minimaliste, cinq liens simples (voir mega-menu-contract.spec.js pour le détail).
  if(width<1241)await page.locator('#navTog').click();
  const links=page.locator('#navLinks > .nav-item > a.nx-direct');await expect(links).toHaveCount(6);
  const expected=en?['Vision','Activities','Impact','Investors','Careers','Knowledge center']:['Vision','Activités','Impact','Investisseurs','Carrières','Centre de connaissances']; // 17 nov. 2026 : Contact devient le bouton, Carrières entre dans le menu
  for(let i=0;i<6;i++){await expect(links.nth(i)).toHaveText(expected[i]);await expect(links.nth(i)).toBeVisible();}
  await expect(page.locator('#nav .nx-mega')).toHaveCount(0);
  if(width<1241)await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
  await expect(page.locator('footer [data-et-corporate-sections]')).toHaveCount(0); // 17 nov. 2026 : le pied de page ne répète plus le menu
  await expect(page.locator('footer .foot-col')).toHaveCount(2);await expect(page.locator('footer .foot-news, footer [data-social="youtube"]')).toHaveCount(0);
  await expect(page.locator('footer .foot-resources')).toHaveCount(0); // 16 nov. 2026 : rangée retirée, le Centre de connaissances indexe ces pages
  await page.screenshot({path:`artifacts/corporate-architecture-${en?'en':'fr'}-${width}.png`,fullPage:false});
 });
}
for(const en of [false,true])test(`forms, anchors and interactive — architecture hubs and editorial ${en?'en':'fr'}`,async({page})=>{
 const s=en?'-en':'';for(const path of ['/societe','/nos-activites','/projets','/engagements','/savoirs','/investisseurs']){
  await page.goto(new URL(path+s,base).href,{waitUntil:'domcontentloaded'});await expect(page.locator('#et-architecture-context')).toHaveCount(1);
 }
 await page.goto(new URL('/communiques'+s,base).href);await expect(page.locator('[data-et-content-kind="official"]')).toHaveCount(1);
});
