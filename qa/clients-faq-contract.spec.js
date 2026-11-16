const { test, expect } = require('@playwright/test');

// Lot 135 (16 novembre 2026) : la FAQ de la page Clients (#faq-clients) occupait 1012 px collés à gauche, avec un bloc blanc à droite,
// à cause d'une règle héritée de la page. Contrat : à 390 px et 1440 px, FR et EN, sur /clients et sur la copie /boutique/clients,
// la FAQ prend toute la largeur du contenu (celle de <main>), son contenu s'aligne sur celui de la section voisine (#ensemble), cinq questions,
// aucun débordement horizontal.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = ['/clients', '/clients-en', '/boutique/clients', '/boutique/en/clients'];

for (const width of [390, 1440]) {
  for (const path of paths) {
    test(`${path} FAQ is full width and aligned at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      expect(response && response.status(), path).toBe(200);
      const report = await page.evaluate(async () => {
        const faq = document.getElementById('faq-clients');
        // content-visibility:auto laisse une section hors écran sans contenu mesurable : on l'amène à l'écran avant de mesurer.
        if (faq) { faq.scrollIntoView(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
        const next = document.getElementById('ensemble');
        const wrap = el => el && el.querySelector('.pp-wrap');
        const rect = el => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.width)]; };
        return {
          found: !!faq && !!next,
          faqBox: faq && rect(faq),
          faqWrap: faq && wrap(faq) && rect(wrap(faq)),
          nextWrap: next && wrap(next) && rect(wrap(next)),
          questions: faq ? faq.querySelectorAll('details').length : 0,
          mainWidth: Math.round(document.querySelector('main').getBoundingClientRect().width),
          viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth
        };
      });
      expect(report.found, path + ' FAQ and next section present').toBe(true);
      expect(report.faqBox[0], path + ' FAQ starts at the page edge').toBe(0);
      expect(report.faqBox[1], path + ' FAQ spans the width of the page content').toBe(report.mainWidth);
      expect(report.faqWrap, path + ' FAQ content aligned with the next section').toEqual(report.nextWrap);
      expect(report.questions, path + ' five questions').toBe(5);
      expect(report.scrollWidth, path + ' no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);
    });
  }
}
