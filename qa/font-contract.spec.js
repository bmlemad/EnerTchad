const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const paths = ['/', '/index-en', '/ar', '/amont/', '/aval/', '/contact'];

test('fonts — webfont resources use efficient WOFF2 delivery and preload consistently', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const report = await page.evaluate(() => ({
      fontPreloads: [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(x => ({
        href: x.href,
        type: x.getAttribute('type'),
        crossorigin: x.hasAttribute('crossorigin')
      })),
      fontFaces: [...document.styleSheets].flatMap(sheet => {
        try { return [...sheet.cssRules].filter(rule => rule.type === CSSRule.FONT_FACE_RULE).map(rule => rule.cssText); }
        catch (_) { return []; }
      })
    }));

    for (const preload of report.fontPreloads) {
      expect(preload.href, path).toMatch(/\.woff2(?:\?|$)/i);
      expect(preload.type, path).toBe('font/woff2');
      expect(preload.crossorigin, path).toBeTruthy();
    }

    for (const rule of report.fontFaces) {
      if (/url\(/i.test(rule)) expect(rule, path).toMatch(/\.woff2(?:["')?]|$)/i);
    }

    await page.close();
  }
});
