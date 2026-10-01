const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/index-en', '/ar', '/amont/', '/aval/', '/greentech/', '/contact'];

test('social metadata — cards expose consistent title, description and image', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const meta = await page.evaluate(() => {
      const get = (selector) => document.querySelector(selector)?.getAttribute('content') || '';
      return {
        title: get('meta[property="og:title"]'),
        description: get('meta[property="og:description"]'),
        image: get('meta[property="og:image"]'),
        twitterTitle: get('meta[name="twitter:title"]'),
        twitterDescription: get('meta[name="twitter:description"]'),
        twitterImage: get('meta[name="twitter:image"]')
      };
    });

    expect(meta.title.length, path).toBeGreaterThan(5);
    expect(meta.description.length, path).toBeGreaterThan(20);
    expect(meta.image, path).toMatch(/^https:\/\//);
    expect(meta.twitterTitle || meta.title, path).toBeTruthy();
    expect(meta.twitterDescription || meta.description, path).toBeTruthy();
    expect(meta.twitterImage || meta.image, path).toMatch(/^https:\/\//);

    await page.close();
  }
});
