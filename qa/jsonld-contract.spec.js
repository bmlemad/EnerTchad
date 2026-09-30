const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const paths = ['/', '/amont/', '/aval/', '/greentech/', '/contact'];

test('SEO — JSON-LD blocks are valid JSON and use canonical absolute URLs', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, path).toBeGreaterThan(0);

    for (const raw of blocks) {
      let data;
      expect(() => { data = JSON.parse(raw); }, path + ' invalid JSON-LD').not.toThrow();
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        if (entry.url) expect(entry.url, path).toMatch(/^https:\/\//);
        if (entry['@id']) expect(entry['@id'], path).toMatch(/^https:\/\//);
        if (entry.image) {
          const images = Array.isArray(entry.image) ? entry.image : [entry.image];
          for (const image of images) if (typeof image === 'string') expect(image, path).toMatch(/^https:\/\//);
        }
      }
    }

    await page.close();
  }
});
