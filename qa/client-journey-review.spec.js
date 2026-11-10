const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
async function consent(page){const b=page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});if(await b.isVisible())await b.click();}
for(const en of [false,true])for(const width of [320,1440]){
  test(`forms, anchors and interactive — home enquiry continuity ${en?'en':'fr'} ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.goto(new URL(en?'/index-en':'/',base).href);await consent(page);
    // Lot 116 (10 novembre 2026) : les trois besoins se lisent sur la page Clients ; le bouton du héros y mène.
    await page.locator('.et-hero a.et-primary').click();
    await expect(page).toHaveURL(en?/\/boutique\/en\/clients#besoin-client$/:/\/boutique\/clients#besoin-client$/);await consent(page);
    const links=page.locator('#besoin-client .ec-contact');await expect(links).toHaveCount(3);
    for(const [i,sector] of ['industrie-chantiers','transport-flottes','operateurs-petroliers'].entries()){
      const url=new URL(await links.nth(i).getAttribute('href'),base);
      expect(url.searchParams.get('secteur')).toBe(sector);
      expect(url.searchParams.get('profil')).toBe(i===2?'ep':'b2b');
      if(i===1)expect(url.searchParams.get('besoin')).toBe('flotte');
    }
    await links.nth(1).click();
    await expect(page.locator('#et-enquiry-context')).toContainText(en?'Transport & fleets':'Transport & flottes');
    await expect(page.locator('[data-enquiry-kind="fleet"]')).toBeVisible();
    const next=page.locator('#et-enquiry-next-steps');await expect(next.locator('li')).toHaveCount(3);
    await expect(page.locator('#ctForm #et-enquiry-next-steps')).toHaveCount(0);
    await expect(page.locator('#ctForm [type="submit"]')).toHaveCount(1);
    await next.scrollIntoViewIfNeeded();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    await page.screenshot({path:`artifacts/enquiry-next-steps-${en?'en':'fr'}-${width}.png`});
    await page.close();
  });
}
for(const width of [320,1440]){
  test(`forms, anchors and interactive — configurator slider names follow profile ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.goto(new URL('/configurateur-service-integre',base).href);await consent(page);
    for(const [profile,label] of [['Opérateur E&P','Nombre de puits'],['Industriel & flottes','Nombre de sites'],['État & collectivités','Nombre de sites'],['Opérateur E&P','Nombre de puits']]){
      await page.getByRole('tab',{name:profile,exact:true}).click();
      const slider=page.getByRole('slider',{name:label,exact:true});await expect(slider).toHaveCount(1);
      const before=Number(await slider.getAttribute('aria-valuenow'));await slider.press('ArrowRight');
      await expect(slider).toHaveAttribute('aria-valuenow',String(before+1));
    }
    await page.close();
  });
}
for(const width of [320,390]){
  test(`forms, anchors and interactive — Arabic press content starts in first viewport ${width}`,async({browser})=>{
    const page=await browser.newPage({viewport:{width,height:740}});
    await page.goto(new URL('/ar-presse',base).href);await consent(page);
    await expect(page.locator('html')).toHaveAttribute('dir','rtl');
    const title=page.locator('h1');await expect(title).toBeVisible();
    expect((await title.boundingBox()).y).toBeLessThan(555);
    await expect(page.locator('footer')).toHaveCount(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
    await page.screenshot({path:`artifacts/arabic-press-${width}.png`});await page.close();
  });
}
