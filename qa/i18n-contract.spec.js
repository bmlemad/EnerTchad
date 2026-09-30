const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const matrix = [
  ['/', 'fr', '/'],
  ['/index-en', 'en', '/index-en'],
  ['/ar', 'ar', '/ar']
];

test('internationalization — language, canonical and hreflang stay aligned', async ({ browser }) => {
  for (const [path, lang, canonicalPath] of matrix) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    expect(await page.locator('html').getAttribute('lang'), path).toBe(lang);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical, path).toBe(new URL(canonicalPath, base).href);

    const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(nodes =>
      nodes.map(link => ({ lang: link.getAttribute('hreflang'), href: link.href }))
    );
    const byLang = Object.fromEntries(alternates.map(item => [item.lang, item.href]));

    for (const expected of ['fr', 'en', 'ar', 'x-default']) {
      expect(byLang[expected], path + ' missing ' + expected).toBeTruthy();
      expect(byLang[expected], path + ' ' + expected).toMatch(/^https:\/\//);
    }

    expect(byLang[lang], path + ' self hreflang').toBe(canonical);
    await page.close();
  }
});
