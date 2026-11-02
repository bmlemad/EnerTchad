const { test, expect } = require('@playwright/test');

// Lot 90, étape 1 (1er novembre 2026) : un seul verre sur le chrome.
// Les surfaces qui glissent sur le contenu (en-tête, barre utilitaire, sous-navigation collante, en-tête arabe,
// en-tête Espace clients, barre mobile) portent la même règle : teinte à 80 %, flou 16 px (10 px sous 760 px),
// saturation 1,2. Le méga-menu (descendant de l'en-tête flouté : il ne peut pas flouter la page, racine de fond)
// reste opaque ; les surfaces de contenu (bande de chiffres des héros, cartes de l'accueil) sont opaques à 96 %,
// sans flou. Source : assets/chrome/verre-2026.css, mise en ligne en tête
// de chaque page à l'export (scripts/next/critical.mjs, glassChrome). Ce contrat lit les styles calculés,
// dans les deux thèmes, à 390 et 1440 px, en haut de page puis après défilement (état « scrolled »).

const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = ['/', '/amont/', '/investisseurs', '/boutique/clients', '/ar', '/publications'];
const widths = [390, 1440];
const themes = [{ name: 'clair', value: '1' }, { name: 'sombre', value: '0' }];
const CHROME = ['#nav.nx', '#nav.nx .nx-util', 'nav.pp-sub', 'header.arh', 'nav.et-space-header', '#nezBar'];
const SOLID = ['#nav.nx .pn-mega', '.pp-figs', '#main-content.et-home .et-segments > *', '#main-content.et-home .et-paths > *'];

function alphaOf(color) {
  const m = String(color).match(/rgba?\(([^)]+)\)/);
  if (!m) return color === 'transparent' ? 0 : 1;
  const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
}

test.describe('glass chrome — one rule for every sliding surface', () => {
  for (const path of paths) {
    for (const theme of themes) {
      for (const width of widths) {
        test(`${path} — ${theme.name} — ${width}px`, async ({ page }) => {
          await page.addInitScript(value => {
            try { localStorage.setItem('et-plight', value); } catch (e) {}
          }, theme.value);
          await page.setViewportSize({ width, height: 844 });
          const response = await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
          expect(response && response.status(), path).toBe(200);

          const read = (chrome, solid) => page.evaluate(([chrome, solid]) => {
            const pick = sel => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); return { sel, background: cs.backgroundColor, filter: cs.backdropFilter }; };
            return { chrome: chrome.map(pick).filter(Boolean), solid: solid.map(pick).filter(Boolean) };
          }, [chrome, solid]);

          const blur = width < 760 ? 'blur(10px) saturate(1.2)' : 'blur(16px) saturate(1.2)';
          const check = report => {
            expect(report.chrome.length, `${path} : aucune surface de chrome trouvée`).toBeGreaterThan(0);
            for (const s of report.chrome) {
              expect(alphaOf(s.background), `${path} ${theme.name} ${width}px : teinte de ${s.sel} = ${s.background}`).toBeCloseTo(0.8, 2);
              expect(s.filter, `${path} ${theme.name} ${width}px : flou de ${s.sel}`).toBe(blur);
            }
            for (const s of report.solid) {
              expect(alphaOf(s.background), `${path} ${theme.name} ${width}px : ${s.sel} doit être opaque`).toBeGreaterThanOrEqual(0.95);
              expect(s.filter, `${path} ${theme.name} ${width}px : ${s.sel} ne doit pas flouter`).toBe('none');
            }
          };
          check(await read(CHROME, SOLID));

          // Après défilement, l'en-tête garde la même règle (pas d'état « scrolled » à part).
          await page.evaluate(() => window.scrollTo(0, 400));
          await page.waitForTimeout(400);
          check(await read(CHROME, []));
        });
      }
    }
  }
});
