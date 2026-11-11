const { test, expect } = require('@playwright/test');

// Lot 118 (11 novembre 2026) : arrivée sur les ancres de la page Projets.
// Le gabarit rend en différé (content-visibility:auto) les sections du milieu de page, avec une hauteur provisoire. Quand une
// section bien plus haute que cette estimation précède une ancre, le navigateur vise l'ancre puis la page s'allonge au-dessus :
// le titre visé sort de l'écran. Défaut relevé après le lot 116 (« Feuille de route » arrivait 568 px trop bas sur mobile).
// Ce contrat ouvre chaque ancre visée par un lien du site et vérifie que son titre arrive sous l'en-tête fixe et dans la moitié
// haute de la fenêtre.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const pages = ['/projets', '/projets-en'];
const anchors = ['feuille-de-route', 'impact-pays', 'avancement', 'projet-mini-raffineries', 'par-pole'];
const viewports = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

for (const path of pages) {
  for (const viewport of viewports) {
    test(`anchor landing — ${path} at ${viewport.width}px`, async ({ browser }) => {
      test.setTimeout(120000);
      const context = await browser.newContext({ viewport, isMobile: viewport.width < 600 });
      for (const anchor of anchors) {
        const page = await context.newPage();
        const response = await page.goto(new URL(path + '#' + anchor, base).href, { waitUntil: 'load', timeout: 60000 });
        expect(response && response.status(), path).toBe(200);
        await page.waitForTimeout(1500); // le rendu différé des sections voisines se stabilise
        const report = await page.evaluate(id => {
          const target = document.getElementById(id);
          if (!target) return null;
          const header = document.querySelector('#nav');
          return { top: Math.round(target.getBoundingClientRect().top), header: header ? Math.round(header.getBoundingClientRect().bottom) : 0, height: innerHeight };
        }, anchor);
        expect(report, `${path}#${anchor} exists`).not.toBeNull();
        // 2 px de tolérance sous l'en-tête ; pas plus bas que la moitié de la fenêtre
        expect(report.top, `${path}#${anchor} lands below the fixed header (${JSON.stringify(report)})`).toBeGreaterThanOrEqual(report.header - 2);
        expect(report.top, `${path}#${anchor} lands in the upper half of the viewport (${JSON.stringify(report)})`).toBeLessThanOrEqual(report.height / 2);
        await page.close();
      }
      await context.close();
    });
  }
}
