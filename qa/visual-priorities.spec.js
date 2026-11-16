const {test,expect}=require('@playwright/test');
const base=process.env.SITE_URL||'https://enertchad.com/';
async function open(page,path){await page.goto(new URL(path,base).href,{waitUntil:'networkidle'});const refuse=page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});if(await refuse.isVisible())await refuse.click();}
for(const en of [false,true])for(const width of [320,1440]){
  test(`mobile navigation — visual priorities ${en?'en':'fr'} ${width}`,async({browser})=>{
    test.setTimeout(120000);
    const page=await browser.newPage({viewport:{width,height:900}});
    const lang=en?'en':'fr',suffix=en?'-en':'';
    await open(page,en?'/boutique/en/clients':'/boutique/clients');
    // Both themes retain the arrow's contrast in the primary action.
    for(const theme of ['light','dark']){
      const toggle=page.locator('.et-theme-hdr');
      if((await toggle.getAttribute('aria-pressed'))!==(theme==='dark'?'true':'false'))await toggle.click();
      const colors=await page.locator('.ec-primary').evaluate(e=>({label:getComputedStyle(e).color,arrow:getComputedStyle(e.querySelector('span')).color}));
      expect(colors.arrow).toBe(colors.label);
      await page.screenshot({path:`artifacts/visual-clients-${lang}-${width}-${theme}.png`});
    }
    if(width===320){
      for(const path of [en?'/atlas-en':'/atlas/',en?'/boutique/en/clients':'/boutique/clients']){
        await open(page,path);
        const summary=page.locator('#nav details.et-al-tog > summary');
        await expect(summary).toHaveAttribute('aria-label','Menu');
        await expect(summary.locator('.bz')).toHaveCount(3);
        await summary.click();await expect(page.locator('#nav details.et-al-tog')).toHaveAttribute('open','');
        await page.keyboard.press('Escape');await expect(page.locator('#nav details.et-al-tog')).not.toHaveAttribute('open','');
      }
    }
    await open(page,en?'/pole-amont-en':'/amont/');
    await expect(page.locator('.pp-sub a')).toHaveCount(5);
    const folds=page.locator('[data-upstream-details] > details');await expect(folds).toHaveCount(3);
    for(let i=0;i<3;i++){
      await expect(folds.nth(i)).not.toHaveAttribute('open','');
      await folds.nth(i).locator('summary').click();
      await expect(folds.nth(i).locator('li').first()).toBeVisible();
      await folds.nth(i).locator('summary').press('Space');
      await expect(folds.nth(i)).not.toHaveAttribute('open','');
    }
    await page.locator('.pp-sub a[href="#offre"]').click();
    await page.locator('#offre').scrollIntoViewIfNeeded();
    await page.screenshot({path:`artifacts/visual-upstream-${lang}-${width}.png`});
    const enquiry=page.locator('#offre a[href*="activite=amont"]');
    await expect(enquiry).toHaveAttribute('href',new RegExp(`^/contact${suffix}\\?activite=amont.*#ctForm$`));
    await open(page,'/contact'+suffix);
    const hero=page.locator('#top-pole');expect((await hero.boundingBox()).height).toBeLessThan(700);
    await expect(hero.locator('a[href="#ctForm"]')).toBeVisible();
    await page.screenshot({path:`artifacts/visual-contact-${lang}-${width}.png`});
    await hero.locator('a[href="#ctForm"]').click();
    await expect(page).toHaveURL(/#ctForm$/);
    await expect(page.locator('#ctForm')).toBeInViewport();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await open(page,en?'/pole-enerconseils-en':'/enerconseils/');
    const img=page.locator('#top-pole img.pp-hero-img');
    await expect(img).toHaveAttribute('src',/complexe-industriel-1400\.webp\?v=[a-f0-9]{12}$/);
    await expect(img).toHaveAttribute('alt',en?/industrial facilities/:/installations industrielles/);
    expect(await img.evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
    await page.screenshot({path:`artifacts/visual-engineering-${lang}-${width}.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.close();
  });
}
