const {test,expect}=require('@playwright/test');
const data=require('../assets/data/business-journeys.json');
const base=process.env.SITE_URL||'https://enertchad.com/';
async function refuseMeasurement(page){const button=page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});if(await button.isVisible())await button.click();}
for(const language of ['fr','en'])for(const width of [320,1440]){
  test(`forms, anchors and interactive — project evidence pathway ${language} ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}}),en=language==='en';
    await page.goto(new URL(en?'/projets-en#avancement':'/projets#avancement',base).href,{waitUntil:'networkidle'});
    await refuseMeasurement(page);
    const cards=page.locator('[data-project-reference]');await expect(cards).toHaveCount(8);
    await expect(page.locator('.et-project-proof')).toHaveCount(8);
    await expect(cards.first().locator('time')).toHaveAttribute('datetime',/^\d{4}-\d{2}-\d{2}$/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    await cards.first().locator('.et-project-contact').click();
    const key='intervention-ep';
    await expect(page.locator('#et-enquiry-context')).toContainText(data.projects[key][language]);
    expect(await page.locator('#et-enquiry-summary').inputValue()).toContain(data.projects[key][language]);
    const other=await page.locator('#nav a.nx-lang').getAttribute('href');expect(other).toContain('projet='+key);
    await page.goto(new URL(other,base).href,{waitUntil:'networkidle'});
    await expect(page.locator('#et-enquiry-context')).toContainText(data.projects[key][en?'fr':'en']);
    await page.close();
  });
  test(`forms, anchors and interactive — sector pathways ${language} ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}}),en=language==='en';
    await page.goto(new URL(en?'/boutique/en/clients':'/boutique/clients',base).href,{waitUntil:'networkidle'});
    await refuseMeasurement(page);
    const keys=Object.keys(data.sectors);
    await expect(page.locator('.ec-offer b')).toHaveText(keys.map(k=>data.sectors[k][language]));
    for(const key of keys)await expect(page.locator(`[data-sector-journey="${key}"] .et-sector-resources a`)).toHaveCount(3);
    const routes=await page.locator('.ec-contact').evaluateAll(elements=>elements.map(e=>e.getAttribute('href')));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    for(const [index,key]of keys.entries()){
      await page.goto(new URL(routes[index],base).href,{waitUntil:'networkidle'});
      await expect(page.locator('#et-enquiry-context')).toContainText(data.sectors[key][language]);
      const kind=['supply','fleet','engineering'][index];
      await expect(page.locator(`[data-enquiry-kind="${kind}"]`)).toBeVisible();
      expect(await page.locator('#et-enquiry-summary').inputValue()).toContain(data.sectors[key][language]);
      expect(await page.locator('#nav a.nx-lang').getAttribute('href')).toContain('secteur='+key);
    }
    await page.close();
  });
}
