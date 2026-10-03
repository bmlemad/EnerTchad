const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const paths = [
  '/', '/index-en', '/ar',
  '/societe', '/societe-en', '/ar-societe',
  '/contact', '/contact-en', '/ar-contact',
  '/investisseurs', '/investisseurs-en', '/ar-investisseurs',
  '/amont/', '/intermediaire/', '/aval/', '/greentech/',
  '/recherche', '/recherche-en',
  '/publications', '/publications-en',
  '/nos-activites', '/nos-activites-en',
  '/engagements', '/engagements-en',
  '/projets', '/projets-en',
  '/gouvernance', '/gouvernance-en',
  '/ethique', '/ethique-en',
  '/brochure', '/brochure-en',
  '/carrieres', '/carrieres-en',
  '/communiques', '/communiques-en',
];

test('navigation — representative pages contain no empty or javascript internal links', async ({ browser }) => {
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const links = await page.locator('a').evaluateAll(nodes => nodes.map((el, index) => ({
      index,
      href: el.getAttribute('href'),
      text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 100)
    })));

    for (const link of links) {
      if (link.href === null) continue;
      expect(link.href.trim(), path + ' link ' + link.index).not.toBe('');
      expect(link.href.trim(), path + ' link ' + link.index).not.toMatch(/^javascript:/i);
      expect(link.href.trim(), path + ' link ' + link.index).not.toBe('#');
    }

    await page.close();
  }
});
