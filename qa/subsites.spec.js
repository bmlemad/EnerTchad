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
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
      expect(errors).toEqual([]);
      const other = await page.locator('#nav a[lang]').getAttribute('href');
      expect(other).toMatch(route.includes('-en') || route.includes('/en/') ? /^(\/atlas\/|\/boutique\/)(?!.*(?:-en|\/en\/))/ : /(?:-en|\/en\/)/);
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
