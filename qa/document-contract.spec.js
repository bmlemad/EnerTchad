const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const cases = [
  { path: '/', lang: 'fr', dir: 'ltr', locale: 'fr_TD' },
  { path: '/index-en', lang: 'en', dir: 'ltr', locale: 'en_US' },
  { path: '/ar', lang: 'ar', dir: 'rtl', locale: 'ar_TD' },
  { path: '/amont/', lang: 'fr', dir: 'ltr' },
  { path: '/aval/', lang: 'fr', dir: 'ltr' },
  { path: '/greentech/', lang: 'fr', dir: 'ltr' },
  { path: '/contact', lang: 'fr', dir: 'ltr' }
];

test('document contract — viewport, language and RTL semantics remain explicit', async ({ browser }) => {
  for (const item of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const response = await page.goto(new URL(item.path, base).href, {
      waitUntil: 'domcontentloaded',
      timeout: 45000
    });

    expect(response && response.status(), item.path + ' HTTP status').toBe(200);

    const report = await page.evaluate(() => ({
      lang: document.documentElement.getAttribute('lang'),
      dir: document.documentElement.getAttribute('dir') || 'ltr',
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      locale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content') || ''
    }));

    expect(report.lang, item.path + ' html[lang]').toBe(item.lang);
    expect(report.dir, item.path + ' html[dir]').toBe(item.dir);
    expect(report.viewport, item.path + ' viewport').toMatch(/width\s*=\s*device-width/i);
    expect(report.viewport, item.path + ' viewport initial scale').toMatch(/initial-scale\s*=\s*1/i);

    if (item.locale) {
      expect(report.locale, item.path + ' og:locale').toBe(item.locale);
    }

    await page.close();
  }
});
