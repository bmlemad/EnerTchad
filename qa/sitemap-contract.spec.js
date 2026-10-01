const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

function parseUrls(xml, origin) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(match => match[1].trim())
    .filter(Boolean)
    .map(value => new URL(value))
    .filter(url => url.origin === origin)
    .map(url => url.href);
}

test('sitemap — canonical URL inventory is unique, same-origin and indexable', async ({ request }) => {
  const response = await request.get(new URL('/sitemap.xml', base).href, { timeout: 30000 });
  expect(response.status()).toBe(200);

  const origin = new URL(base).origin;
  const urls = parseUrls(await response.text(), origin);

  expect(urls.length).toBeGreaterThan(150);
  expect(new Set(urls).size, 'sitemap URLs must be unique').toBe(urls.length);

  for (const href of urls) {
    const parsed = new URL(href);
    expect(parsed.origin, href).toBe(origin);
    expect(parsed.username + parsed.password, href).toBe('');
    expect(parsed.hash, href).toBe('');
  }
});

test('robots — sitemap reference matches the deployed origin', async ({ request }) => {
  const response = await request.get(new URL('/robots.txt', base).href, { timeout: 30000 });
  expect(response.status()).toBe(200);

  const body = await response.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Allow: /');
  expect(body).toContain('Sitemap: ' + new URL('/sitemap.xml', base).href);
  expect(body).toContain('Disallow: /docs-sources/');
});
