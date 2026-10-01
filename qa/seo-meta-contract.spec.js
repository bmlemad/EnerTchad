const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/index-en', '/ar', '/amont/', '/aval/', '/greentech/', '/contact'];

test('SEO — representative pages expose coherent canonical, robots and social metadata', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);

    const meta = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.href || '',
      robots: document.querySelector('meta[name="robots"]')?.content || '',
      title: document.title.trim(),
      description: document.querySelector('meta[name="description"]')?.content?.trim() || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content?.trim() || '',
      ogDescription: document.querySelector('meta[property="og:description"]')?.content?.trim() || '',
      ogUrl: document.querySelector('meta[property="og:url"]')?.content || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.content || ''
    }));

    expect(meta.canonical, path).toMatch(/^https:\/\//);
    expect(new URL(meta.canonical).hostname, path).toBe(new URL(base).hostname);
    expect(meta.title.length, path + ' title').toBeGreaterThan(10);
    expect(meta.description.length, path + ' description').toBeGreaterThan(50);
    expect(meta.ogTitle.length, path + ' og:title').toBeGreaterThan(10);
    expect(meta.ogDescription.length, path + ' og:description').toBeGreaterThan(30);
    expect(meta.ogUrl, path).toBe(meta.canonical);
    expect(meta.ogImage, path).toMatch(/^https:\/\//);
    expect(meta.twitterCard, path).toMatch(/^(summary|summary_large_image)$/i);

    if (!/noindex/i.test(meta.robots)) {
      expect(meta.robots, path).toMatch(/index/i);
    }

    await page.close();
  }
});
