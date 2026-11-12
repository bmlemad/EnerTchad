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
// Plafonds reposés le 2 novembre 2026 (version 3ad36e4a7) aux valeurs alors mesurées, puis abaissés par le lot 105
// (refonte de la cascade, étape 1 : retrait des !important et des chaînes :not(#…) qu'aucun concurrent ne peut
// reprendre, sur pole-premium.css, premium-chrome.css et bundle_core_a1.css) : -24 % de !important par page. Quand une consolidation la réduit, abaissez
// le plafond concerné dans le même commit. Relevé : CSS_BUDGET_REPORT=1 SITE_URL=… npx playwright test qa/css-debt-budget.spec.js
// Les budgets de modern-ui-2026.css, nav_a.css et modern-inner-2026.css restent dans site.spec.js.

const base = process.env.SITE_URL || 'https://enertchad.com/';

// [page, !important, :not(#…), CSS dans la page (octets), plus longue chaîne de :not(#…)]
// Cascade étape 2 (8 novembre 2026) : 1 002 !important et 615 chaînes retirés de 9 feuilles ; budgets remesurés à la baisse (CSS_BUDGET_REPORT=1), /ar-societe inchangé (aucune des 9 feuilles n'y est chargée).
// Cascade étape 3 (lot 109, 10 novembre 2026) : 484 sélecteurs morts retirés de nav_a.css (sans correspondance sur les 248 pages et
// dont une classe n'est posée par aucun code du dépôt) ; 273 sélecteurs :not(#…) de moins par page, plafonds abaissés d'autant.
// Cascade étape 3, suite (lot 115, 10 novembre 2026) : les 94 sélecteurs prouvés morts restants sont retirés de bundle_core_a1.css,
// x_cd256286824c.css et bundle_head_b2.css ; 8 à 12 sélecteurs :not(#…) de moins par page, plafonds abaissés d'autant.
const budgets = [
  // Composants, suite (11 novembre 2026, soir) : barre de navigation reecrite a la source dans premium-chrome.css (les six regles
  // de la pilule remplacees sur place, surcharge et-verre du matin retiree) ; .nav-links retire de la regle de repos de l'en-tete
  // sur l'accueil. Mesure contre le build de l'etape precedente, plafonds deplaces d'autant.
  // Composants (11 novembre 2026, apres-midi) : titres et action principale des heros definis une fois dans design-system.css
  // (contrat : 40 -> 43 !important, 3 867 -> 4 746 octets ; tolerance portee a 43 et 4 800) ; les 17 !important ajoutes le matin
  // a pole-premium.css et leur copie dans la CSS critique sont retires. Mesure contre l'export precedent, plafonds deplaces d'autant.
  // Direction editoriale (11 novembre 2026, decision du DG du 10 novembre) : bandes pleines, titres serif, barre de navigation et
  // pied de page a plat, surcharges ecrites dans la couche et-verre et reprises dans la CSS critique des pages. Mesure contre
  // l'export precedent : +71 !important et +1 392 octets de CSS en ligne par page du gabarit commun (+47 et +518 sur le journal) ;
  // accueils : +90 !important, +2 762 octets, 77 selecteurs :not(#…) de moins (jeu critique re-extrait). Plafonds deplaces d'autant.
  // Lot 112 (10 novembre 2026, décision du DG) : direction immersive ; +3 !important (verre des cartes posées sur photo, couche et-verre)
  // et +238 octets de CSS critique dans la page (repères remontés sous le héros).
  // Lot 117 (10 novembre 2026, décision du DG) : la ligne dorée du héros repose sur une pastille sombre (contraste) ; +117 octets de CSS critique.
  // Lot 119 (12 novembre 2026) : arrivée sur les ancres ; +1 !important par page (règle commune de premium-chrome.css, feuille chargée par toutes les pages) ; aucun octet de CSS en ligne.
  ['/', 2661, 9892, 114712, 44], // lot 106-A : accueil refondu (mesure du 8 novembre 2026, hors contrat de design)
  ['/index-en', 2698, 9894, 118461, 44], // lot 106-B : accueil EN refondu (mesure du 8 novembre 2026, hors contrat de design)
  // Lot 113 (10 novembre 2026, décision du DG) : direction immersive, phase B ; scène « conviction » des pôles posée au build par
  // lib/immersif-poles.js : +7 !important (verre, texte clair, hauteur de la photo ; couche et-verre) et +1 943 octets de CSS en ligne.
  ['/amont/', 3520, 20327, 140098, 40],
  ['/aval/raffinage', 3705, 22028, 203936, 40],
  ['/carrieres', 3720, 22094, 214815, 40],
  // PR #139 added the 480-byte after-enquiry block before this design change.
  ['/contact', 3622, 21431, 190216, 40],
  ['/carnets', 3372, 19057, 164777, 40],
  ['/journal-criblage-eor', 2564, 10007, 149838, 40],
  ['/atlas/', 3165, 18678, 175396, 46],
  ['/boutique/', 2962, 17955, 121140, 40],
  // Lot 108 (9 novembre 2026, décision du DG) : menu mobile arabe, en-tête mobile de 160 à 64 px ; le premier écran montre
  // plus de contenu, la CSS critique écrite dans la page reprend donc plus de règles existantes (+15 !important, +486 :not(#…), +8 003 octets).
  ['/ar-societe', 2486, 21103, 75091, 40],
  ['/essentiel', 3208, 18370, 133575, 40],
];

const notIdPattern = /:not\(#[\w-]+\)/g;
// The shared component contract has an explicit, separate allowance. Legacy
// budgets stay fixed: no allowance for additional ID chains or legacy overrides.
const designAllowance = { important: 43, bytes: 4800 };
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

test.describe('css debt budget — pages do not load more cascade overrides than on 3 November 2026', () => {
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
      const design = doc.match(/<style[^>]*data-et-design-system[^>]*>([\s\S]*?)<\/style>/i)?.[1] || '';
      expect(measure(design).important, path + ' shared contract overrides').toBeLessThanOrEqual(designAllowance.important);
      expect(Buffer.byteLength(design), path + ' shared contract bytes').toBeLessThanOrEqual(designAllowance.bytes);

      if (process.env.CSS_BUDGET_REPORT) {
        console.log(`BUDGET ${JSON.stringify([path, total.important, total.notId, inlineBytes, total.longestChain])}`);
        return;
      }

      expect(total.important, `${path} : !important chargés par la page`).toBeLessThanOrEqual(maxImportant + (design ? designAllowance.important : 0));
      expect(total.notId, `${path} : sélecteurs :not(#…) chargés par la page`).toBeLessThanOrEqual(maxNotId);
      expect(inlineBytes, `${path} : octets de CSS écrits dans la page`).toBeLessThanOrEqual(maxInlineBytes + (design ? designAllowance.bytes : 0));
      expect(total.longestChain, `${path} : plus longue chaîne de :not(#…)`).toBeLessThanOrEqual(maxChain);
    });
  }
});
