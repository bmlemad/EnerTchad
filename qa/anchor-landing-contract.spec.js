const { test, expect } = require('@playwright/test');

// Lots 118 et 119 (11 et 12 novembre 2026) : arrivée sur les ancres.
// Le gabarit rend en différé (content-visibility:auto) les sections du milieu de page, avec une hauteur provisoire. Quand une
// section bien plus haute que cette estimation précède une ancre, le navigateur vise l'ancre puis la page s'allonge au-dessus :
// le titre visé sort de l'écran (sous l'en-tête fixe, ou en bas de l'écran). Lot 118 : page Projets, règles locales. Lot 119 :
// règle commune dans premium-chrome.css, `html:has(:target) main *{content-visibility:visible!important}` — quand l'adresse vise
// un élément, la page est rendue en entier avant le saut.
// Ce contrat ouvre chaque ancre visée par un lien du site et vérifie que son titre arrive sous l'en-tête fixe et dans la moitié
// haute de la fenêtre. La liste des couples page/ancre est celle du relevé du 11 novembre 2026 (833 ancres, 156 pages), ajoutée
// à celles de Projets.
// Exclus : /contact#ctForm et /contact-en#ctForm sur ordinateur (452 px pour un seuil de 450 : le pied de page est atteint, la
// page ne peut pas défiler plus) ; /boutique/en/#boutique sur mobile (cause distincte, sans rendu différé, consignée au registre).

const base = process.env.SITE_URL || 'https://enertchad.com/';
const viewports = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];

const PROJETS = ['feuille-de-route', 'impact-pays', 'avancement', 'projet-mini-raffineries', 'par-pole'];
const couples = [
  ['/projets', PROJETS],
  ['/projets-en', PROJETS],
  ['/ethique', ['alerte']],
  ['/ethique-en', ['alerte']],
  ['/investisseurs', ['agenda']],
  ['/investisseurs-en', ['agenda', 'hypotheses']],
  ['/nos-activites', ['besoins', 'explorateur']],
  ['/nos-activites-en', ['besoins', 'explorer']],
  ['/publications-en', ['pub-inv']],
  ['/greentech/', ['transition', 'patrimoine']],
  ['/pole-greentech-en', ['transition', 'patrimoine']],
  ['/pole-enerconseils-en', ['conseil']],
  ['/enerconseils/', ['audits']],
  ['/tchaditech/', ['socle']],
  ['/tchaditude/', ['partenariats']],
  ['/pole-tchaditude-en', ['partenariats']],
  ['/petrochimie/', ['carnets-petro']],
  ['/pole-enerchimie-en', ['carnets-petrochemicals']],
  ['/amont/services-ep', ['operations-production']],
  ['/aval/produits-en', ['lubrifiants-bitumes', 'partenariats']],
  ['/aval/distribution-en', ['partenaire', 'dst-steps', 'marque']],
  ['/aval/commercialisation-en', ['litre-proof']],
  ['/avertissements', ['anti-fraude']],
  ['/avertissements-en', ['anti-fraude']],
  ['/gouvernance', ['organes', 'transparence', 'forme']],
  ['/gouvernance-en', ['forme']],
  ['/cibles-2030-en', ['cibles-poles']],
  ['/engagements', ['esg', 'referentiels', 'rapport']],
  ['/engagements-en', ['hse', 'esg', 'referentiels', 'rapport']],
  ['/societe', ['organisation']],
];

// Même définition de l'en-tête que le relevé : éléments fixes ou collants, collés en haut de la fenêtre.
function mesure(id) {
  const target = document.getElementById(id);
  if (!target) return null;
  let header = 0;
  for (const e of document.querySelectorAll('#nav,header.arh,nav.et-space-header,#nezBar,nav.pp-sub,.nx-util')) {
    const c = getComputedStyle(e);
    if (c.position !== 'fixed' && c.position !== 'sticky') continue;
    const b = e.getBoundingClientRect();
    if (b.height > 0 && b.top <= header + 2 && b.bottom < innerHeight / 2 && c.visibility !== 'hidden' && c.display !== 'none') header = Math.max(header, b.bottom);
  }
  return { top: Math.round(target.getBoundingClientRect().top), header: Math.round(header), height: innerHeight };
}

async function arrive(context, path, anchor) {
  const page = await context.newPage();
  const response = await page.goto(new URL(path + '#' + anchor, base).href, { waitUntil: 'load', timeout: 60000 });
  expect(response && response.status(), path).toBe(200);
  await page.waitForTimeout(1500); // le rendu des sections voisines se stabilise
  const report = await page.evaluate(mesure, anchor);
  return { page, report };
}

function verifie(path, anchor, report, mode) {
  expect(report, `${path}#${anchor} exists`).not.toBeNull();
  // 2 px de tolérance sous l'en-tête ; pas plus bas que la moitié de la fenêtre
  expect(report.top, `${mode} ${path}#${anchor} lands below the fixed header (${JSON.stringify(report)})`).toBeGreaterThanOrEqual(report.header - 2);
  expect(report.top, `${mode} ${path}#${anchor} lands in the upper half of the viewport (${JSON.stringify(report)})`).toBeLessThanOrEqual(report.height / 2);
}

for (const viewport of viewports) {
  test(`anchor landing — ${couples.length} pages at ${viewport.width}px`, async ({ browser }) => {
    test.setTimeout(900000);
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 600 });
    for (const [path, anchors] of couples) {
      for (const anchor of anchors) {
        const { page, report } = await arrive(context, path, anchor);
        verifie(path, anchor, report, 'external arrival:');
        await page.close();
      }
    }
    await context.close();
  });
}

// Clic sur un lien d'ancre dans la page : même résultat qu'une arrivée de l'extérieur.
for (const viewport of viewports) {
  test(`anchor landing by in-page navigation — projets at ${viewport.width}px`, async ({ browser }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 600 });
    const page = await context.newPage();
    await page.goto(new URL('/projets', base).href, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(1000);
    for (const anchor of PROJETS) {
      await page.evaluate(id => { location.hash = '#' + id; }, anchor);
      await page.waitForTimeout(1500);
      verifie('/projets', anchor, await page.evaluate(mesure, anchor), 'in-page navigation:');
      await page.evaluate(() => { history.replaceState(null, '', location.pathname); scrollTo(0, 0); });
      await page.waitForTimeout(300);
    }
    await context.close();
  });
}

// Garde de structure : la règle du lot 119 est dans la feuille commune. Sans elle, la plupart des arrivées ci-dessus
// échouent ; ce test donne la cause en une ligne.
test('anchor landing rule is present in premium-chrome.css', async ({ page }) => {
  await page.goto(new URL('/ethique', base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const href = await page.evaluate(() => { const l = document.querySelector('link[rel="stylesheet"][href*="premium-chrome.css"]'); return l && l.href; });
  expect(href, 'premium-chrome.css is linked').toBeTruthy();
  const css = await (await page.request.get(href)).text();
  expect(css.replace(/\s+/g, '')).toContain('html:has(:target)main*{content-visibility:visible!important}');
});
