const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = ['/', '/amont/', '/aval/', '/greentech/', '/contact', '/investisseurs'];

test('security — external links opened in new contexts have safe opener semantics', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const links = await page.locator('a[target="_blank"]').evaluateAll(nodes => nodes.map(a => ({
      href: a.href,
      rel: (a.getAttribute('rel') || '').toLowerCase().split(/\s+/).filter(Boolean)
    })));

    for (const link of links) {
      expect(link.rel, path + ' ' + link.href).toContain('noopener');
    }

    await page.close();
  }
});

test('security — canonical transport and security headers are present in deployment config', async ({ request }) => {
  const response = await request.get(new URL('/vercel.json', base).href);
  if (response.status() === 200) {
    const config = await response.json();
    const headers = JSON.stringify(config.headers || []);
    for (const token of ['X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Strict-Transport-Security']) {
      expect(headers, token).toContain(token);
    }
  }
});
