const { test, expect } = require('@playwright/test');

// Lot 124 (14 novembre 2026, décision du DG) : l'en-tête est minimaliste. Ce contrat remplace celui des méga-menus (lot 80) :
// cinq liens simples (Vision, Activités, Impact, Investisseurs, Contact), aucun panneau déroulant, un bouton « Investisseurs »,
// la barre d'outils réduite aux langues et à la recherche, le slogan sous le logo, et les six rubriques retirées du menu
// (Gouvernance, Publications, Atlas, FAQ, Carrières, Communiqués) accessibles par la rangée « Ressources » du pied de page.
const base = process.env.SITE_URL || 'https://enertchad.com/';
const widths = [1280, 1440];
const defs = {
  '/': { labels: ['Vision', 'Activités', 'Impact', 'Investisseurs', 'Contact'], hrefs: ['/societe', '/nos-activites', '/engagements', '/investisseurs', '/contact'], button: 'Investisseurs', slogan: 'L’énergie du Tchad. Intégrée.', resources: ['/gouvernance', '/publications', '/atlas/', '/faq', '/carrieres', '/communiques'] },
  '/index-en': { labels: ['Vision', 'Activities', 'Impact', 'Investors', 'Contact'], hrefs: ['/societe-en', '/nos-activites-en', '/engagements-en', '/investisseurs-en', '/contact-en'], button: 'Investors', slogan: 'Chad’s energy. Integrated.', resources: ['/gouvernance-en', '/publications-en', '/atlas-en', '/faq-en', '/carrieres-en', '/communiques-en'] }
};
const removed = /Gouvernance|Governance|Publications|Atlas|FAQ|Carrières|Careers|Communiqués|Press releases/;

for (const [path, d] of Object.entries(defs)) {
  for (const width of widths) {
    test(`header — five plain links, one button, no dropdown (${path} at ${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      expect(response && response.status(), path).toBe(200);
      const links = page.locator('#navLinks > .nav-item > a.nx-direct');
      await expect(links).toHaveCount(5);
      for (let i = 0; i < 5; i++) {
        await expect(links.nth(i)).toHaveText(d.labels[i]);
        await expect(links.nth(i)).toHaveAttribute('href', d.hrefs[i]);
        await expect(links.nth(i)).toBeVisible();
      }
      await expect(page.locator('#navLinks .nav-trigger[aria-controls]')).toHaveCount(0);
      await expect(page.locator('#nav .nx-mega')).toHaveCount(0);
      const report = await page.evaluate(() => {
        const nav = document.getElementById('nav');
        const bar = [...nav.querySelectorAll('.nav-in a[href], .nx-util a[href]')];
        const button = [...nav.querySelectorAll('.nx-invest, .nx-cta .nx-invest')].filter(e => e.getClientRects().length);
        const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0; };
        return {
          texts: bar.filter(visible).map(a => a.textContent.trim()),
          button: button.map(b => ({ text: b.textContent.trim(), href: b.getAttribute('href') })),
          slogan: nav.querySelector('.brand .et-tag small')?.textContent.trim(),
          flag: nav.getAttribute('data-et-header'),
          scrollWidth: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth,
          short: !!nav.querySelector('[data-et-short]')
        };
      });
      expect(report.flag).toBe('minimal');
      expect(report.slogan, 'slogan under the logo').toBe(d.slogan);
      expect(report.button.length, 'one visible primary button').toBe(1);
      expect(report.button[0].text).toBe(d.button);
      expect(report.button[0].href).toBe(d.hrefs[3]);
      expect(report.short, 'no injected 90-second shortcut').toBe(false);
      expect(report.texts.filter(t => removed.test(t)), 'removed entries are not in the header').toEqual([]);
      expect(report.scrollWidth, 'no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);
      // Langues et recherche conservées (petites), dans la barre d'outils ou, à partir de 1 536 px, à droite de la barre.
      expect(await page.locator('#nav .nx-lang, #nav .nx-langx').count()).toBeGreaterThanOrEqual(2);
      expect(await page.locator('#nav .nx-search, #nav .nav-search').count()).toBeGreaterThanOrEqual(1);
    });
  }

  test(`header — footer keeps the six removed entries in a Resources row (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const hrefs = await page.locator('footer .foot-resources a').evaluateAll(a => a.map(x => x.getAttribute('href')));
    expect(hrefs).toEqual(d.resources);
  });
}

test('header — the current page is marked and keyboard focus reaches every link', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(new URL('/societe', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await expect(page.locator('#navLinks a.nx-direct[aria-current="page"]')).toHaveText('Vision');
  const first = page.locator('#navLinks a.nx-direct').first();
  await first.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.textContent.trim());
  expect(focused).toBe('Contact');
});
