const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';

const pages = [
  ['/amont/activites', 'fr'],
  ['/amont/forage', 'fr'],
  ['/amont/traitement', 'fr'],
  ['/amont/developpement', 'fr'],
  ['/amont/eor', 'fr'],
  ['/amont/services-ep', 'fr'],
  ['/amont/reserves', 'fr'],
  ['/amont/eau', 'fr'],
  ['/amont/parc', 'fr'],
  ['/aval/raffinage', 'fr'],
  ['/aval/distribution', 'fr'],
  ['/aval/commercialisation', 'fr'],
  ['/aval/reseau', 'fr'],
  ['/aval/produits', 'fr'],
  ['/aval/gpl', 'fr'],
  ['/aval/lubrifiants', 'fr'],
  ['/aval/boutique', 'fr'],
  ['/intermediaire/collecte', 'fr'],
  ['/intermediaire/logistique', 'fr'],
  ['/intermediaire/sites', 'fr'],
  ['/intermediaire/services', 'fr'],
];

test.describe('hub secondary pages — canonical, language and link integrity', () => {
  for (const [path, lang] of pages) {
    test(path + ' — metadata and links remain structurally valid', async ({ page }) => {
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

      expect(await page.locator('html').getAttribute('lang'), path).toBe(lang);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical, path + ' canonical').toBe(new URL(path, base).href);

      const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(nodes =>
        Object.fromEntries(nodes.map(link => [link.getAttribute('hreflang'), link.href]))
      );
      expect(alternates.fr, path + ' fr hreflang').toBeTruthy();
      expect(alternates.fr, path + ' fr self hreflang').toBe(canonical);
      expect(alternates.en, path + ' en hreflang').toBeTruthy();
      expect(alternates['x-default'], path + ' x-default hreflang').toBeTruthy();

      const links = await page.locator('a').evaluateAll(nodes =>
        nodes.map((el, index) => ({
          index,
          href: el.getAttribute('href'),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 100)
        }))
      );

      for (const link of links) {
        if (link.href === null) continue;
        expect(link.href.trim(), path + ' link ' + link.index + ' ' + link.text).not.toBe('');
        expect(link.href.trim(), path + ' link ' + link.index + ' ' + link.text).not.toMatch(/^javascript:/i);
        expect(link.href.trim(), path + ' link ' + link.index + ' ' + link.text).not.toBe('#');
      }
    });
  }
});
