const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/amont/', '/aval/', '/greentech/', '/contact'];

test('performance — critical pages avoid excessive synchronous resources', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const report = await page.evaluate(() => ({
      scripts: [...document.scripts].filter(s => !s.async && !s.defer && !s.type.includes('application/ld+json')).length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      images: document.images.length,
      lazyImages: [...document.images].filter(img => img.loading === 'lazy').length
    }));

    expect(report.scripts, path + ' synchronous scripts').toBeLessThanOrEqual(8);
    expect(report.stylesheets, path + ' stylesheets').toBeLessThanOrEqual(12);
    expect(report.lazyImages, path + ' lazy image coverage').toBeGreaterThanOrEqual(
      Math.max(0, report.images - 3)
    );

    await page.close();
  }
});
