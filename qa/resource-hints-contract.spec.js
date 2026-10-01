const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/amont/', '/aval/', '/greentech/', '/contact'];

test('performance — critical resource hints are valid and do not duplicate stylesheet preloads', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);

    const report = await page.evaluate(() => ({
      preloads: [...document.querySelectorAll('link[rel="preload"]')].map(el => ({
        href: el.href,
        as: el.getAttribute('as') || '',
        type: el.getAttribute('type') || ''
      })),
      stylesheets: [...document.querySelectorAll('link[rel="stylesheet"]')].map(el => el.href),
      fontPreloads: [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(el => el.href)
    }));

    for (const preload of report.preloads) {
      expect(preload.href, path).toMatch(/^https?:\/\//);
      expect(preload.as, path + ' ' + preload.href).toBeTruthy();
    }

    const stylesheetSet = new Set(report.stylesheets);
    const duplicateStylePreloads = report.preloads.filter(item =>
      item.as === 'style' && stylesheetSet.has(item.href)
    );
    expect(duplicateStylePreloads, path + ' duplicate stylesheet preload').toEqual([]);

    expect(new Set(report.fontPreloads).size, path + ' duplicate font preloads').toBe(report.fontPreloads.length);
    await page.close();
  }
});
