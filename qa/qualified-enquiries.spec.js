const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
async function refuseOptionalMeasurement(page){const button=page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});if(await button.isVisible())await button.click();}
for(const en of [false,true])for(const width of [320,1440]){
  test(`forms, anchors and interactive — pole contact continuity ${en?'en':'fr'} ${width}`,async({browser})=>{
    test.setTimeout(90000);
    const page=await browser.newPage({viewport:{width,height:900}});
    for(const [fr,english,activity,profile,service]of [
      ['/amont/','/pole-amont-en','amont','ep','faisabilite'],
      ['/intermediaire/','/pole-intermediaire-en','intermediaire','',''],
      ['/aval/','/pole-aval-en','aval','b2b',''],
      ['/petrochimie/','/pole-enerchimie-en','petrochimie','',''],
      ['/enerconseils/','/pole-enerconseils-en','ingenierie','ep',''],
      ['/greentech/','/pole-greentech-en','transition','','']
    ]){
      await page.goto(new URL(en?english:fr,base).href,{waitUntil:'networkidle'});
      await refuseOptionalMeasurement(page);
      await page.locator('#top-pole a.pp-btn[href*="/contact"]').click();
      await expect(page).toHaveURL(new RegExp('/contact'+(en?'-en':'')+'\\?'));
      const url=new URL(page.url());expect(url.searchParams.get('activite')).toBe(activity);
      await expect(page.locator('#et-enquiry-context')).toBeVisible();
      await expect(page.locator('#et-enquiry-summary')).toHaveValue(en?/Activity: /:/Rubrique : /);
      if(profile==='ep')await expect(page.locator('#ctType')).toHaveValue(/Engineering \/ technical services|Ingénierie \/ services techniques/);
      else if(profile==='b2b')await expect(page.locator('#ctType')).toHaveValue(en?'Supply / B2B contract':'Approvisionnement / Contrat B2B');
      else await expect(page.locator('#ctType')).toHaveValue('');
      if(service)await expect(page.locator('#eq-service')).toHaveValue(service);
      const language=page.locator('#nav a.nx-lang');
      await expect(language).toHaveAttribute('href',new RegExp('activite='+activity));
      await page.goto(new URL(await language.getAttribute('href'),base).href,{waitUntil:'networkidle'});
      await expect(page.locator('#et-enquiry-context')).toContainText(en?'Rubrique :':'Activity:');
      expect(new URL(page.url()).searchParams.get('activite')).toBe(activity);
      if(service)await expect(page.locator('#eq-service')).toHaveValue(service);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    }
    await page.close();
  });
}
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
