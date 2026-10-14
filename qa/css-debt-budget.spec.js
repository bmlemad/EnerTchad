const { test, expect } = require('@playwright/test');

// Garde-fou de la dette CSS (audit de la structure du design, 12 octobre 2026, étape 6).
// Pour chaque page représentative, mesure ce que la page charge réellement : feuilles liées
// et blocs <style> écrits dans la page. Plafonds posés le 12 octobre 2026 (version c67699d8), abaissés
// le même jour aux valeurs mesurées après l'en-tête du journal, les jetons et la palette des accueils
// (-40 :not(#…) partout, -14 !important sur les accueils) : la dette ne doit plus grossir.
// Quand une consolidation la réduit, abaissez le plafond concerné dans le même commit.
// Les budgets de modern-ui-2026.css, nav_a.css et modern-inner-2026.css restent dans site.spec.js.

const base = process.env.SITE_URL || 'https://enertchad.com/';

// [page, !important, :not(#…), CSS dans la page (octets), plus longue chaîne de :not(#…)]
const budgets = [
  ['/', 3259, 16565, 0, 44],
  ['/index-en', 3258, 16565, 0, 44],
  ['/amont/', 3790, 22873, 7336, 40],
  ['/aval/raffinage', 3730, 22720, 55141, 40],
  ['/carrieres', 3744, 22786, 65707, 40],
  ['/contact', 3906, 24620, 61199, 40],
  ['/carnets', 3737, 22902, 60393, 40],
  ['/journal-criblage-eor', 2417, 12248, 49241, 40],
  ['/atlas/', 3929, 24139, 123830, 44],
  ['/boutique/', 3646, 22655, 56782, 40],
  ['/ar-societe', 2505, 19991, 0, 40],
  ['/essentiel', 2, 2, 0, 2],
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

test.describe('css debt budget — pages do not load more cascade overrides than on 12 October 2026', () => {
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
