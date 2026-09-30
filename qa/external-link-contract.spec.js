const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const paths = ['/', '/amont/', '/aval/', '/greentech/', '/contact', '/investisseurs'];

test('navigation — external web links use explicit HTTPS destinations', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => ({
      href: a.href,
      target: a.getAttribute('target'),
      rel: (a.getAttribute('rel') || '').toLowerCase()
    })).filter(x => /^https?:\/\//i.test(x.href) && !x.href.startsWith(location.origin)));

    for (const link of links) {
      expect(link.href, path).toMatch(/^https:\/\//);
      if (link.target === '_blank') expect(link.rel, path + ' ' + link.href).toContain('noopener');
    }

    await page.close();
  }
});
