const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.com/';
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

// 24 novembre 2026 : le renommage du pôle aval (#300) avait doublé un mot dans le titre (« Raffinage & Raffinage & Distribution »,
// « Refining & Refining & Distribution »), repris tel quel par LinkedIn. Aucun titre de page ni carte de partage ne répète un mot
// de part et d'autre d'une esperluette.
const TITLE_PATHS = ['/amont/', '/pole-amont-en', '/intermediaire/', '/pole-intermediaire-en', '/aval/', '/pole-aval-en', '/petrochimie/', '/pole-enerchimie-en'];
test('page and card titles never repeat a word around an ampersand', async ({ browser }) => {
  for (const path of TITLE_PATHS) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const titles = await page.evaluate(() => [
      document.title,
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || ''
    ]);
    for (const t of titles) expect(t, path).not.toMatch(/(^|\s)(\p{L}+) & \2(\s|$)/u);
    await page.close();
  }
});
