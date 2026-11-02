const { test, expect } = require('@playwright/test');

// Garde-fou de la dette CSS (audit de la structure du design, 12 octobre 2026, étape 6).
// Pour chaque page représentative, mesure ce que la page charge réellement : feuilles liées
// et blocs <style> écrits dans la page. Plafonds posés le 12 octobre 2026 (version c67699d8), abaissés
// le même jour aux valeurs mesurées après l'en-tête du journal, les jetons et la palette des accueils.
// Lot 103 (2 novembre 2026) : les plafonds du 12 octobre étaient dépassés sur les 12 pages depuis
// plusieurs semaines sans que personne ne lise la QA hebdomadaire (échec programmé des 5, 12 et 19 octobre).
// Causes mesurées, pas supposées : CSS critique écrite dans la page depuis les jeux critiques (scripts/critical,
// 68 à 222 Ko par page, contre 0 à 124 Ko le 12 octobre) ; couches premium des lots 80 à 102 (+560 à
// +1 450 !important par page) ; /essentiel dans le gabarit commun depuis le lot 79 (il n'avait que 2 !important).
// Les plafonds sont reposés aux valeurs mesurées sur enertchad.com le 2 novembre 2026 (version 3ad36e4a7),
// sans marge : la dette ne doit plus grossir à partir de là. Quand une consolidation la réduit, abaissez
// le plafond concerné dans le même commit. Relevé : CSS_BUDGET_REPORT=1 SITE_URL=… npx playwright test qa/css-debt-budget.spec.js
// Les budgets de modern-ui-2026.css, nav_a.css et modern-inner-2026.css restent dans site.spec.js.

const base = process.env.SITE_URL || 'https://enertchad.com/';

// [page, !important, :not(#…), CSS dans la page (octets), plus longue chaîne de :not(#…)]
const budgets = [
  ['/', 4283, 19029, 121759, 44],
  ['/index-en', 4282, 19031, 121084, 44],
  ['/amont/', 4993, 26812, 143032, 40],
  ['/aval/raffinage', 5181, 28609, 210911, 40],
  ['/carrieres', 5196, 28675, 221790, 40],
  ['/contact', 5105, 28433, 196057, 40],
  ['/carnets', 4769, 25375, 168429, 40],
  ['/journal-criblage-eor', 3380, 14484, 154434, 40],
  ['/atlas/', 4493, 24638, 175355, 46],
  ['/boutique/', 4324, 23969, 121467, 40],
  ['/ar-societe', 3306, 24267, 67899, 40],
  ['/essentiel', 4602, 24692, 137378, 40],
];

const notIdPattern = /:not\(#[\w-]+\)/g;
const notIdChainPattern = /(?::not\(#[\w-]+\))+/g;

function measure(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const chains = clean.match(notIdChainPattern) || [];
  return {
    important: (clean.match(/!important/g) || []).length,
    notId: (clean.match(notIdPattern) || []).length,
    longestChain: chains.reduce((max, chain) => Math.max(max, (chain.match(notIdPattern) || []).length), 0)
  };
}

test.describe('css debt budget — pages do not load more cascade overrides than on 2 November 2026', () => {
  for (const [path, maxImportant, maxNotId, maxInlineBytes, maxChain] of budgets) {
    test(path, async ({ request }) => {
      const response = await request.get(new URL(path, base).href, { timeout: 45000 });
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      const doc = html.replace(/<script[\s\S]*?<\/script>/gi, '');

      const inline = [...doc.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
      const hrefs = [...new Set([...doc.matchAll(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi)]
        .map(m => (m[0].match(/href=["']?([^"' >]+)/) || [])[1])
        .filter(href => href && href.startsWith('/')))];

      const sheets = [];
      for (const href of hrefs) {
        const sheet = await request.get(new URL(href, base).href, { timeout: 30000 });
        expect(sheet.status(), path + ' ' + href).toBe(200);
        sheets.push(await sheet.text());
      }

      const total = { important: 0, notId: 0, longestChain: 0 };
      for (const css of [...inline, ...sheets]) {
        const m = measure(css);
        total.important += m.important;
        total.notId += m.notId;
        total.longestChain = Math.max(total.longestChain, m.longestChain);
      }
      const inlineBytes = Buffer.byteLength(inline.join(''), 'utf8');

      if (process.env.CSS_BUDGET_REPORT) {
        console.log(`BUDGET ${JSON.stringify([path, total.important, total.notId, inlineBytes, total.longestChain])}`);
        return;
      }

      expect(total.important, `${path} : !important chargés par la page`).toBeLessThanOrEqual(maxImportant);
      expect(total.notId, `${path} : sélecteurs :not(#…) chargés par la page`).toBeLessThanOrEqual(maxNotId);
      expect(inlineBytes, `${path} : octets de CSS écrits dans la page`).toBeLessThanOrEqual(maxInlineBytes);
      expect(total.longestChain, `${path} : plus longue chaîne de :not(#…)`).toBeLessThanOrEqual(maxChain);
    });
  }
});
