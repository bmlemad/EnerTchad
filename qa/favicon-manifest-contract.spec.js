const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

test('platform metadata — favicon, touch icon and manifest references are present', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 45000 });

  const report = await page.evaluate(() => ({
    favicon: [...document.querySelectorAll('link[rel~="icon"]')].map(x => x.href),
    touch: document.querySelector('link[rel="apple-touch-icon"]')?.href || '',
    manifest: document.querySelector('link[rel="manifest"]')?.href || ''
  }));

  expect(report.favicon.length).toBeGreaterThan(0);
  expect(report.favicon.some(href => /^https?:\/\//.test(href))).toBeTruthy();
  expect(report.touch).toMatch(/^https?:\/\//);
  expect(report.manifest).toMatch(/^https?:\/\//);

  await page.close();
});
