const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const paths = ['/', '/index-en', '/ar', '/amont/', '/aval/', '/greentech/', '/contact'];

test('SEO — robots metadata does not accidentally block indexable pages', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const report = await page.evaluate(() => {
      const robots = document.querySelector('meta[name="robots"]')?.content || '';
      const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
      return { robots: robots.toLowerCase(), canonical };
    });

    expect(report.canonical, path).toMatch(/^https:\/\//);
    if (!report.robots.includes('noindex')) {
      expect(report.robots, path).not.toMatch(/\b(noindex|none)\b/);
    }

    await page.close();
  }
});
