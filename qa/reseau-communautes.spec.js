const { test, expect } = require('@playwright/test');

// 22 novembre 2026. Réseau de stations : 11 arrondis de carte différents (13 à 22 px) contre l'arrondi maison de 18 px
// ailleurs. Communautés : une grille « Parcourir cette page » répétait la barre de navigation. Échouent sur l'export précédent.
const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const path of ['/aval/reseau', '/aval/reseau-en']) {
  test(`mobile navigation — network page cards use the house radius ${path}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    const radii = await page.evaluate(() => [...document.querySelectorAll('#reseau *')].filter(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return r.width > 160 && r.height > 80 && (s.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(s.borderTopWidth) > 0);
    }).map(e => getComputedStyle(e).borderTopLeftRadius));
    const off = radii.filter(r => !['0px', '18px', '14px'].includes(r));
    expect(off, path).toEqual([]);
    await page.close();
  });
}

for (const path of ['/communautes', '/communautes-en']) {
  test(`mobile navigation — communities page has one in-page navigation ${path}`, async ({ page }) => {
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    await expect(page.locator('main').getByText(/^(Parcourir cette page|Browse this page)/)).toHaveCount(0);
    await expect(page.locator('nav.pp-sub a[href="#enjeux"]')).toHaveCount(1);
  });
}
