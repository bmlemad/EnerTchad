const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const assets = [
  '/assets/chrome/modern-ui-2026.css',
  '/assets/chrome/nav_a.css?b=202608300720',
  '/assets/fonts/Inter-latin.woff2',
  '/favicon-32.png',
  '/apple-touch-icon.png'
];

test('caching — static assets expose cache-friendly immutable policy where applicable', async ({ request }) => {
  for (const path of assets) {
    const response = await request.get(new URL(path, base).href);
    expect(response.status(), path).toBe(200);
    const cache = (response.headers()['cache-control'] || '').toLowerCase();
    expect(cache, path + ' cache-control').toBeTruthy();

    if (/\.(woff2|png|jpg|jpeg|webp|svg|css)(\?|$)/i.test(path)) {
      expect(cache, path).toMatch(/public|max-age|immutable/);
    }
  }
});
