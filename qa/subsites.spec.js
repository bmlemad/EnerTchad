const { test, expect } = require('@playwright/test');
const base = process.env.SITE_URL || 'https://enertchad.com/';
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
      await expect(page.locator('#nav a[lang]')).toBeVisible();
      if (route.startsWith('/atlas')) {
        expect(await page.evaluate(() => document.querySelector('main').getBoundingClientRect().top - document.querySelector('#nav').getBoundingClientRect().bottom)).toBeLessThan(40);
        await expect(page.locator('.atlas-languages,.atlas-nav')).toHaveCount(0);
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

// Exercise the actual aliases as well as the PR preview: host routing, HTTPS
// redirects and cross-space links cannot be verified on a preview host alone.
for (const width of [1440, 390]) {
  for (const language of ['fr', 'en']) {
    test(`dedicated spaces — public journey connects Clients, catalogue, Atlas and group: ${language} ${width}`, async ({browser}) => {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const prefix = language === 'en' ? '/en' : '';
      const clients = 'https://clients.enertchad.com';
      const atlas = 'https://atlas.enertchad.com';
      await page.goto(clients + prefix + '/', {waitUntil:'networkidle'});
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',clients + prefix + '/');
      await page.locator(`#nav .et-space-links a[href="${prefix}/boutique"]`).click();
      await expect(page).toHaveURL(clients + prefix + '/boutique');
      await expect(page.locator('#grid .pc')).not.toHaveCount(0);
      await page.locator(`#nav a[href="${atlas}${prefix}/"]`).click();
      await expect(page).toHaveURL(atlas + prefix + '/');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',atlas + prefix + '/');
      await page.locator(`#nav .et-space-links a[href="${prefix}/carte"]`).click();
      await expect(page).toHaveURL(atlas + prefix + '/carte');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
      await page.locator('#nav a[lang]').click();
      const alternatePrefix = language === 'en' ? '' : '/en';
      await expect(page).toHaveURL(atlas + alternatePrefix + '/carte');
      await expect(page.locator('html')).toHaveAttribute('lang', language === 'en' ? 'fr' : 'en');
      await page.locator(`#nav a[href="${clients}${alternatePrefix}/"]`).click();
      await expect(page).toHaveURL(clients + alternatePrefix + '/');
      const group = 'https://enertchad.com' + (alternatePrefix ? '/index-en' : '/');
      await page.locator(`#nav .et-space-top a[href="${group}"]`).click();
      await expect(page).toHaveURL(group);
      await expect(page.locator('#nav.et-space-header')).toHaveCount(0);
      expect(errors).toEqual([]);
      await page.close();
    });
  }
}
