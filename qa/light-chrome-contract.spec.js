// Lot 102 (choix du DG, 2 novembre 2026) : chrome allégé — contrat mesuré dans le navigateur.
// SITE_URL=http://localhost:8802/ npx playwright test qa/light-chrome-contract.spec.js
//  - ≥ 1 536 px : barre utilitaire masquée, ses quatre liens (90 secondes, FR · EN, ع, appel à l'action) à droite de
//    la barre principale, sans débordement ; barre de 109 px au plus, en haut comme défilée.
//  - 1 241 – 1 535 px : barre utilitaire visible en haut de page, masquée au défilement (barre ≤ 110 px).
//  - sous-navigation de pôle non collante ; bouton Mouvement dans le pied de page, jamais flottant ;
//  - consentement : bande ≤ 80 px sur ordinateur ; sur mobile, au-dessus de la barre basse, qui reste visible.
//  - chrome fixe au défilement (barre + sous-nav collée + consentement + barre basse) ≤ 200 px sur ordinateur.
const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.com/';
const pages = ['/amont/', '/', '/pole-amont-en'];

const MEASURE = () => {
  const q = s => document.querySelector(s);
  const vis = e => { if (!e) return 0; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; const b = e.getBoundingClientRect(); return b.height > 0 && b.bottom > 0 && b.top < innerHeight ? Math.round(b.height) : 0; };
  const nav = q('#nav'), sub = q('nav.pp-sub'), con = q('#et-consent'), nez = q('#nezBar'), cta = q('#nav .nx-cta'), navin = q('#nav .nav-in');
  const subStuck = sub && getComputedStyle(sub).position === 'sticky';
  const inner = navin ? navin.getBoundingClientRect().right - parseFloat(getComputedStyle(navin).paddingRight) : 0;
  return {
    nav: vis(nav), util: vis(q('#nav .nx-util')), subPos: sub ? getComputedStyle(sub).position : null, sub: subStuck ? vis(sub) : 0,
    fused: [...document.querySelectorAll('#nav .nx-cta .nx-fused')].filter(a => getComputedStyle(a).display !== 'none').length,
    overflow: cta ? Math.round(cta.getBoundingClientRect().right - inner) : 0,
    consent: vis(con), consentBottom: con && !con.hidden ? Math.round(innerHeight - con.getBoundingClientRect().bottom) : null,
    consentParas: con ? con.querySelectorAll('p').length : null,
    nez: vis(nez), lumIn: q('#lum-ctl') ? (q('#lum-ctl').closest('footer') ? 'footer' : q('#lum-ctl').parentElement.tagName) : null,
    lumFixed: q('#lum-ctl') ? getComputedStyle(q('#lum-ctl')).position === 'fixed' : false,
  };
};

test.describe('chrome allégé — règle hybride du lot 102', () => {
  for (const path of pages) {
    for (const width of [1536, 1440, 412]) {
      test(`${path} à ${width} px`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
        const page = await context.newPage();
        await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(1200);
        const top = await page.evaluate(MEASURE);
        await page.evaluate(() => scrollTo(0, 1200));
        await page.waitForFunction(() => innerWidth < 1241 || document.getElementById('nav').classList.contains('scrolled'), null, { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(500);
        const scrolled = await page.evaluate(MEASURE);
        const label = `${path} ${width}px`;
        expect(top.subPos, label + ' sous-navigation').not.toBe('sticky');
        expect(top.lumFixed, label + ' bouton Mouvement flottant').toBe(false);
        if (top.lumIn) expect(top.lumIn, label + ' bouton Mouvement').toBe('footer');
        expect(top.consent, label + ' consentement affiché').toBeGreaterThan(0);
        expect(top.consentParas, label + ' paragraphes du bandeau').toBe(2);
        if (width >= 1536) {
          expect(top.util, label + ' barre utilitaire').toBe(0);
          expect(top.fused, label + ' liens fusionnés').toBe(4);
          expect(top.overflow, label + ' débordement').toBeLessThanOrEqual(0);
          expect(top.nav, label + ' barre en haut').toBeLessThanOrEqual(110);
        } else if (width >= 1241) {
          expect(top.util, label + ' barre utilitaire en haut').toBeGreaterThan(0);
          expect(top.fused, label + ' liens fusionnés').toBe(0);
          expect(scrolled.util, label + ' barre utilitaire défilée').toBe(0);
        }
        if (width >= 1241) {
          expect(scrolled.nav, label + ' barre défilée').toBeLessThanOrEqual(110);
          expect(top.consent, label + ' bande de consentement').toBeLessThanOrEqual(80);
          expect(scrolled.nav + scrolled.sub + scrolled.consent + scrolled.nez, label + ' chrome fixe').toBeLessThanOrEqual(200);
        } else {
          expect(top.nez, label + ' barre basse visible').toBeGreaterThan(0);
          expect(top.consentBottom, label + ' bande au-dessus de la barre basse').toBeGreaterThanOrEqual(top.nez - 1);
        }
        await context.close();
      });
    }
  }
});
