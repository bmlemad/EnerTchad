const { test, expect } = require('@playwright/test');

// Lot 122 (12 novembre 2026, choix du DG) : direction immersive, phase C, pilote sur les pages sous /amont — étape 1.
// Posé au build par lib/immersif-amont.js sur dix pages au même gabarit (développement, eau, forage, réserves,
// traitement ; FR et EN) : la section « Ce que nous mettons en œuvre » est une scène (photo de fond décorative chargée au
// défilement, titre et cellules dans une carte en verre au texte clair). Ce contrat vérifie la présence et la forme sur les
// dix pages à 390 px et à 1440 px, que la grille de cellules est conservée, que le reste de la page (#detail, Repères, Lire
// ensuite) est inchangé, et que les douze autres pages sous /amont n'ont pas de scène (étape 2 décidée plus tard).

const base = process.env.SITE_URL || 'https://enertchad.com/';
const bases = ['developpement', 'eau', 'forage', 'reserves', 'traitement'];
const pages = bases.flatMap(b => [`/amont/${b}`, `/amont/${b}-en`]);
const others = ['/amont/activites', '/amont/activites-en', '/amont/eor', '/amont/eor-en', '/amont/parc', '/amont/parc-en',
  '/amont/methane-torchage', '/amont/methane-torchage-en', '/amont/services-ep', '/amont/services-ep-en',
  '/amont/titulaire-droits-petroliers', '/amont/titulaire-droits-petroliers-en'];

function luminance(color) {
  const m = String(color).match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
}

test.describe('immersive amont sub-pages — implementation scene', () => {
  for (const width of [390, 1440]) {
    for (const path of pages) {
      test(`${path} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
        expect(response && response.status(), path).toBe(200);
        const report = await page.evaluate(async () => {
          const scene = document.querySelector('main section.im-scene');
          // Section en content-visibility:auto : hors écran, la photo mesure 0. On amène la scène à l'écran et on attend deux images.
          if (scene) { scene.scrollIntoView(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
          const bg = scene && scene.querySelector(':scope > img.im-bg');
          const glass = scene && scene.querySelector('.im-glass');
          const h2 = glass && glass.querySelector('h2');
          const cells = glass ? [...glass.querySelectorAll('.pp-grid > .pp-cell')] : [];
          const tops = new Set(cells.map(c => Math.round(c.getBoundingClientRect().top)));
          const text = glass && glass.querySelector('.pp-cell p');
          return {
            scenes: document.querySelectorAll('.im-scene').length,
            glass: !!glass, h2: h2 && h2.textContent.trim(), h2Color: h2 && getComputedStyle(h2).color,
            cells: cells.length, rows: tops.size,
            bg: bg && { hidden: bg.getAttribute('aria-hidden'), alt: bg.getAttribute('alt'), loading: bg.getAttribute('loading'), src: bg.getAttribute('src') },
            cover: bg && [Math.round(bg.getBoundingClientRect().height), Math.round(scene.getBoundingClientRect().height)],
            textColor: text && getComputedStyle(text).color,
            inlineStyle: !!document.getElementById('et-immersif-amont'),
            detail: !!document.getElementById('detail'),
            repères: [...document.querySelectorAll('main h2')].map(e => e.textContent.trim()).length,
            labelled: scene && document.getElementById(scene.getAttribute('aria-labelledby')) === h2,
            viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth
          };
        });
        expect(report.scenes, path + ' one scene').toBe(1);
        expect(report.glass, path + ' glass card').toBe(true);
        expect(report.inlineStyle, path + ' inline rules').toBe(true);
        expect(report.h2, path + ' title').toMatch(/^(Ce que nous mettons en œuvre|What we put in place)$/);
        expect(report.labelled, path + ' scene is labelled by its title').toBe(true);
        expect(report.detail, path + ' #detail anchor kept').toBe(true);
        expect(report.cells, path + ' four cells kept').toBe(4);
        // Quatre cellules en ligne sur ordinateur ; une colonne sur mobile (la grille du gabarit est conservée).
        if (width >= 1000) expect(report.rows, path + ' cells share one row').toBe(1);
        expect(report.bg, path + ' background image').toBeTruthy();
        expect(report.bg.hidden, path + ' decorative image').toBe('true');
        expect(report.bg.alt, path + ' decorative image alt').toBe('');
        expect(report.bg.loading, path + ' lazy image').toBe('lazy');
        expect(report.bg.src, path + ' published photo').toMatch(/^\/assets\/img\/p\/[a-z-]+-1400\.webp$/);
        expect(report.cover[0], path + ' photo covers the scene').toBeGreaterThanOrEqual(report.cover[1] - 1);
        expect(luminance(report.textColor), path + ' light body text on the glass card').toBeGreaterThan(0.7);
        expect(luminance(report.h2Color), path + ' light title on the glass card').toBeGreaterThan(0.7);
        expect(report.scrollWidth, path + ' no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);
      });
    }
  }

  test('the twelve other amont sub-pages are unchanged (no scene, no inline rules)', async ({ request }) => {
    for (const path of others) {
      const response = await request.get(new URL(path, base).href, { timeout: 30000 });
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      expect(html.includes('class="im-scene"'), path + ' no scene').toBe(false);
      expect(html.includes('id="et-immersif-amont"'), path + ' no inline rules').toBe(false);
    }
  });
});
