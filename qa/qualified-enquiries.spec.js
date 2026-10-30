const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
async function refuseOptionalMeasurement(page){const button=page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});if(await button.isVisible())await button.click();}
for(const language of ['fr','en'])for(const width of [320,390,1440]){
  test(`forms, anchors and interactive — qualified enquiries ${language} ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}}),en=language==='en';
    await page.goto(new URL(`/contact${en?'-en':''}?profil=ep&service=faisabilite#ctForm`,base).href,{waitUntil:'networkidle'});
    await refuseOptionalMeasurement(page);
    const engineering=page.locator('[data-enquiry-kind="engineering"]');
    await expect(engineering).toBeVisible();
    await expect(engineering).toHaveJSProperty('disabled',false);
    await expect(page.locator('#eq-service')).toHaveValue('faisabilite');
    await engineering.locator('summary').click();
    await page.locator('#eq-installation').fill('QA engineering scope');
    await expect(page.locator('#et-enquiry-summary')).toHaveValue(/QA engineering scope/);
    const before=await page.locator('#nav a.nx-lang').getAttribute('href');
    expect(before).toContain('service=faisabilite');expect(before).not.toContain('QA');
    await page.locator('#eq-service').selectOption('');
    expect(await page.locator('#nav a.nx-lang').getAttribute('href')).not.toContain('service=');
    await page.locator('#ctType').selectOption(en?'Supply / B2B contract':'Approvisionnement / Contrat B2B');
    await page.locator('#et-enquiry-mode').selectOption('fleet');
    await expect(engineering).toHaveJSProperty('disabled',true);
    const fleet=page.locator('[data-enquiry-kind="fleet"]');await expect(fleet).toBeVisible();
    await fleet.locator('summary').click();await page.locator('#eq-vehicles').fill('12');
    await expect(page.locator('#et-enquiry-summary')).toHaveValue(/12/);
    expect(await page.locator('#et-enquiry-summary').inputValue()).not.toContain('QA engineering scope');
    expect(await page.locator('#nav a.nx-lang').getAttribute('href')).toContain('besoin=flotte');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    await page.locator('#ctType').selectOption(en?'Investment':'Investissement');
    await expect(page.locator('#et-enquiry-summary')).toHaveValue('');
    await expect(fleet).toHaveJSProperty('disabled',true);await expect(fleet).toBeHidden();
    await page.close();
  });
}
for(const language of ['fr','en'])for(const width of [320,1440]){
  test(`forms, anchors and interactive — engineering mission entry ${language} ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}}),en=language==='en';
    await page.goto(new URL(en?'/pole-enerconseils-en':'/enerconseils/',base).href,{waitUntil:'networkidle'});
    await refuseOptionalMeasurement(page);
    await expect(page.locator('[data-engineering-brief]')).toHaveCount(4);
    await page.locator('#ingenierie a[href*="service=faisabilite"]').click();
    await expect(page.locator('#ctType')).toHaveValue(/Engineering \/ technical services|Ingénierie \/ services techniques/);
    await expect(page.locator('#eq-service')).toHaveValue('faisabilite');
    await expect(page.locator('[data-enquiry-kind="engineering"]')).toBeVisible();
    await page.close();
  });
}
