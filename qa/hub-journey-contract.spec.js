const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const journeys = [
  ['/amont/', ['/amont/services-ep', '/clients', '/contact']],
  ['/aval/', ['/aval/boutique', '/clients', '/contact']],
  ['/intermediaire/', ['/configurateur-service-integre', '/clients', '/contact']],
  ['/greentech/', ['/greentech/#transition', '/clients', '/contact']]
];

test('hub journeys — primary CTAs expose intentional destinations', async ({ page }) => {
  for (const [path, expected] of journeys) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const ctas = await page.locator('a.cta, a.pp-btn, a.pgh-btn, a.pgh-btn2').evaluateAll(nodes =>
      nodes.map(a => ({ href: a.getAttribute('href'), text: (a.innerText || '').trim() }))
    );
    const hrefs = new Set(ctas.map(x => x.href));
    for (const href of expected) {
      expect(hrefs, path + ' CTA destination ' + href).toContain(href);
    }
  }
});
