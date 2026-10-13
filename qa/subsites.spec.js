const { test, expect } = require('@playwright/test');
const base = process.env.SITE_URL || 'https://enertchad.com/';
// Mobile (≤ 900 px): utility and space links sit in the header menu (details.et-al-tog); open it first.
const openMenu = async page => { await page.waitForLoadState('domcontentloaded'); const s = page.locator('#nav details.et-al-tog:not([open]) > summary'); if (await s.isVisible()) await s.click(); };
const routes = ['/boutique/', '/boutique/en/', '/boutique/clients', '/boutique/en/clients', '/atlas/', '/atlas/carte', '/atlas-en', '/atlas/carte-en'];
for (const width of [1440, 390]) {
  for (const route of routes) {
    test(`dedicated spaces — navigation, viewport and runtime: ${route} ${width}`, async ({ browser }) => {
      const page = await browser.newPage({viewport: {width, height: 900}});
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(new URL(route, base).href, {waitUntil:'networkidle'});
      expect(response.status()).toBe(200);
      await expect(page.locator('#nav.et-space-header')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('#nav [aria-current="page"]')).toHaveCount(1);
      await openMenu(page);
      await expect(page.locator('#nav a[lang]')).toBeVisible();
      if (route.startsWith('/atlas')) {
        expect(await page.evaluate(() => document.querySelector('main').getBoundingClientRect().top - document.querySelector('#nav').getBoundingClientRect().bottom)).toBeLessThan(40);
        await expect(page.locator('.atlas-languages,.atlas-nav')).toHaveCount(0);
      }
      if (width === 390 && route.startsWith('/boutique')) {
        expect(await page.locator('#top-pole > .pp-wrap').evaluate(el => parseFloat(getComputedStyle(el).paddingTop))).toBeLessThanOrEqual(40);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
      expect(errors).toEqual([]);
      const other = await page.locator('#nav a[lang]').getAttribute('href');
      const dedicatedHost = /^(clients|atlas)\.enertchad\.com$/.test(new URL(page.url()).hostname);
      const english = await page.locator('html').getAttribute('lang') === 'en';
      expect(other).toMatch(dedicatedHost
        ? english ? /^\/(?!en(?:\/|$))/ : /^\/en(?:\/|$)/
        : english ? /^(\/atlas\/|\/boutique\/)(?!.*(?:-en|\/en\/))/ : /(?:-en|\/en\/)/);
      const refuse = page.locator('#et-consent button').filter({hasText:/Refuser|Refuse/});
      if (await refuse.isVisible()) await refuse.click();
      await page.screenshot({path:`artifacts/subsites-${route.replace(/\W/g,'-')}-${width}.png`});
      await page.close();
    });
  }
  for (const route of ['/boutique/', '/boutique/en/']) {
    test(`dedicated spaces — catalogue prepares a quote: ${route} ${width}`, async ({browser}) => {
      const page = await browser.newPage({viewport:{width,height:900}});
      await page.goto(new URL(route,base).href, {waitUntil:'networkidle'});
      await expect(page.locator('#grid .pc')).not.toHaveCount(0);
      await page.locator('#grid .pc-add').first().click();
      await expect(page.locator('#oCta')).toBeEnabled();
      await page.locator('#oCta').click();
      await expect(page.locator('#modal')).toHaveClass(/on/);
      await expect(page.locator('#msum')).not.toBeEmpty();
      expect(await page.locator('#mWa').getAttribute('href')).toContain('?text=');
      expect(await page.locator('#mMail').getAttribute('href')).toContain('body=');
      await page.keyboard.press('Escape');
      await expect(page.locator('#modal')).not.toHaveClass(/on/);
      await page.close();
    });
  }
}

// Spaces live under enertchad.com since the OVH migration (Clients under /boutique/, Atlas under /atlas/;
// the former subdomains answer with permanent redirects): exercise the public journey on those paths.
for (const width of [1440, 390]) {
  for (const language of ['fr', 'en']) {
    test(`dedicated spaces — public journey connects Clients, catalogue, Atlas and group: ${language} ${width}`, async ({browser}) => {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const site = new URL(base).origin;
      const en = language === 'en';
      const clientsHome = site + (en ? '/boutique/en/clients' : '/boutique/clients');
      const catalogue = en ? '/boutique/en/' : '/boutique/';
      const atlasHome = site + (en ? '/atlas-en' : '/atlas/');
      const map = en ? '/atlas/carte-en' : '/atlas/carte';
      const otherMap = en ? '/atlas/carte' : '/atlas/carte-en';
      await page.goto(clientsHome, {waitUntil:'networkidle'});
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', clientsHome);
      await openMenu(page);
      await page.locator(`#nav .et-space-links a[href="${catalogue}"]`).click();
      await expect(page).toHaveURL(site + catalogue);
      await expect(page.locator('#grid .pc')).not.toHaveCount(0);
      await openMenu(page);
      await page.locator(`#nav a[href="${atlasHome}"]`).first().click();
      await expect(page).toHaveURL(atlasHome);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', atlasHome);
      await openMenu(page);
      await page.locator(`#nav .et-space-links a[href="${map}"]`).click();
      await expect(page).toHaveURL(site + map);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
      await openMenu(page);
      await page.locator('#nav a[lang]').click();
      await expect(page).toHaveURL(site + otherMap);
      await expect(page.locator('html')).toHaveAttribute('lang', en ? 'fr' : 'en');
      const otherCatalogue = site + (en ? '/boutique/' : '/boutique/en/');
      await openMenu(page);
      await page.locator(`#nav a[href="${otherCatalogue}"]`).first().click();
      await expect(page).toHaveURL(otherCatalogue);
      const group = site + (en ? '/' : '/index-en');
      await openMenu(page);
      await page.locator(`#nav .et-space-top a[href="${group}"]`).click();
      await expect(page).toHaveURL(group);
      await expect(page.locator('#nav.et-space-header')).toHaveCount(0);
      expect(errors).toEqual([]);
      await page.close();
    });
  }
}
