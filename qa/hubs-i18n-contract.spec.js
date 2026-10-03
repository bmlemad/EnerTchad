const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

const matrix = [
  ['/amont/', 'fr', '/amont/', { fr: '/amont/', en: '/pole-amont-en', ar: '/ar-amont', 'x-default': '/amont/' }],
  ['/pole-amont-en', 'en', '/pole-amont-en', { fr: '/amont/', en: '/pole-amont-en', ar: '/ar-amont', 'x-default': '/amont/' }],
  ['/ar-amont', 'ar', '/ar-amont', { fr: '/amont/', en: '/pole-amont-en', ar: '/ar-amont', 'x-default': '/amont/' }],
  ['/aval/', 'fr', '/aval/', { fr: '/aval/', en: '/pole-aval-en', ar: '/ar-aval', 'x-default': '/aval/' }],
  ['/pole-aval-en', 'en', '/pole-aval-en', { fr: '/aval/', en: '/pole-aval-en', ar: '/ar-aval', 'x-default': '/aval/' }],
  ['/ar-aval', 'ar', '/ar-aval', { fr: '/aval/', en: '/pole-aval-en', ar: '/ar-aval', 'x-default': '/aval/' }],
  ['/intermediaire/', 'fr', '/intermediaire/', { fr: '/intermediaire/', en: '/pole-intermediaire-en', ar: '/ar-intermediaire', 'x-default': '/intermediaire/' }],
  ['/pole-intermediaire-en', 'en', '/pole-intermediaire-en', { fr: '/intermediaire/', en: '/pole-intermediaire-en', ar: '/ar-intermediaire', 'x-default': '/intermediaire/' }],
  ['/ar-intermediaire', 'ar', '/ar-intermediaire', { fr: '/intermediaire/', en: '/pole-intermediaire-en', ar: '/ar-intermediaire', 'x-default': '/intermediaire/' }],
  ['/greentech/', 'fr', '/greentech/', { fr: '/greentech/', en: '/pole-greentech-en', 'x-default': '/greentech/' }],
  ['/pole-greentech-en', 'en', '/pole-greentech-en', { fr: '/greentech/', en: '/pole-greentech-en', 'x-default': '/greentech/' }],
];

test('hubs — FR/EN/AR canonical and available hreflang mappings stay reciprocal', async ({ browser }) => {
  for (const [path, lang, canonicalPath, expected] of matrix) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    expect(await page.locator('html').getAttribute('lang'), path).toBe(lang);
    expect(await page.locator('link[rel="canonical"]').getAttribute('href'), path).toBe(new URL(canonicalPath, base).href);

    const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(nodes =>
      Object.fromEntries(nodes.map(link => [link.getAttribute('hreflang'), link.href]))
    );

    for (const [alternateLang, alternatePath] of Object.entries(expected)) {
      expect(alternates[alternateLang], path + ' ' + alternateLang).toBe(new URL(alternatePath, base).href);
    }

    await page.close();
  }
});
