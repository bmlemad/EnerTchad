const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact'];

test('accessibility — primary landmarks remain unique and navigation is labeled', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const report = await page.evaluate(() => ({
      main: document.querySelectorAll('main').length,
      navs: [...document.querySelectorAll('nav')].map(nav => ({
        label: nav.getAttribute('aria-label'),
        labelledby: nav.getAttribute('aria-labelledby')
      })),
      header: document.querySelectorAll('header').length,
      footer: document.querySelectorAll('footer').length
    }));

    expect(report.main, path).toBe(1);
    for (const nav of report.navs) {
      expect(!!nav.label || !!nav.labelledby, path + ' unlabeled navigation').toBeTruthy();
    }
    expect(report.header, path).toBeGreaterThanOrEqual(1);
    expect(report.footer, path).toBeGreaterThanOrEqual(1);

    await page.close();
  }
});
