const { test, expect } = require('@playwright/test');

// Lot 124 (14 novembre 2026, décision du DG) : l'en-tête est minimaliste. Ce contrat remplace celui des méga-menus (lot 80) :
// cinq liens simples (Vision, Activités, Impact, Investisseurs, Contact), aucun panneau déroulant, un bouton « Investisseurs »,
// la barre d'outils réduite aux langues et à la recherche, le slogan sous le logo, et les six rubriques retirées du menu
// (Gouvernance, Publications, Atlas, FAQ, Carrières, Communiqués) accessibles par la rangée « Ressources » du pied de page.
// 16 novembre 2026 (décision du DG, « épurer la navigation ») : sixième lien, le Centre de connaissances (/savoirs), qui indexe toutes
// les pages secondaires ; la rangée « Ressources » du pied de page disparaît, ses six pages sont dans le Centre.
// 17 novembre 2026 (décision du DG, comparaison avec TotalEnergies, BP, ExxonMobil et Eni) : le bouton ne double plus l'entrée
// « Investisseurs » ; il devient « Contact », qui quitte le menu ; « Carrières » entre dans le menu ; le pied de page ne répète plus
// les entrées du menu (deux colonnes) et n'affiche plus les mentions « newsletter en préparation » et « YouTube bientôt disponible ».
const base = process.env.SITE_URL || 'https://enertchad.com/';
const widths = [1280, 1440];
const defs = {
  '/': { labels: ['Vision', 'Activités', 'Impact', 'Investisseurs', 'Carrières', 'Centre de connaissances'], hrefs: ['/societe', '/nos-activites', '/engagements', '/investisseurs', '/carrieres', '/savoirs'], hub: '/savoirs', button: 'Contact', slogan: 'L’énergie du Tchad. Intégrée.', resources: ['/gouvernance', '/publications', '/atlas/', '/faq', '/carrieres', '/communiques'] },
  '/index-en': { labels: ['Vision', 'Activities', 'Impact', 'Investors', 'Careers', 'Knowledge center'], hrefs: ['/societe-en', '/nos-activites-en', '/engagements-en', '/investisseurs-en', '/carrieres-en', '/savoirs-en'], hub: '/savoirs-en', button: 'Contact', slogan: 'Chad’s energy. Integrated.', resources: ['/gouvernance-en', '/publications-en', '/atlas-en', '/faq-en', '/carrieres-en', '/communiques-en'] }
};
const removed = /Gouvernance|Governance|Publications|Atlas|FAQ|Communiqués|Press releases/;

for (const [path, d] of Object.entries(defs)) {
  for (const width of widths) {
    test(`header — six plain links, one button, no dropdown (${path} at ${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      expect(response && response.status(), path).toBe(200);
      const links = page.locator('#navLinks > .nav-item > a.nx-direct');
      await expect(links).toHaveCount(6);
      for (let i = 0; i < 6; i++) {
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
      expect(report.button[0].href).toBe(path === '/' ? '/contact' : '/contact-en');
      expect(d.hrefs, 'the button does not repeat a menu entry').not.toContain(report.button[0].href);
      expect(report.short, 'no injected 90-second shortcut').toBe(false);
      expect(report.texts.filter(t => removed.test(t)), 'removed entries are not in the header').toEqual([]);
      expect(report.scrollWidth, 'no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);
      // Langues et recherche conservées (petites), à droite de la barre à partir de 1 241 px (lot 127), dans le tiroir en dessous.
      expect(await page.locator('#nav .nx-lang, #nav .nx-langx').count()).toBeGreaterThanOrEqual(2);
      expect(await page.locator('#nav .nx-search, #nav .nav-search').count()).toBeGreaterThanOrEqual(1);
    });
  }

  test(`header — the six removed entries are indexed by the knowledge centre, not repeated in the footer (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await expect(page.locator('footer .foot-resources')).toHaveCount(0);
    await expect(page.locator('footer [data-et-footer-access] a')).toHaveCount(4);
    await page.goto(new URL(d.hub, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const hrefs = await page.locator('#main-content a[href]').evaluateAll(a => a.map(x => x.getAttribute('href').split('#')[0]));
    for (const href of d.resources) expect(hrefs, d.hub + ' indexes ' + href).toContain(href);
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
  expect(focused).toBe('Carrières');
});
