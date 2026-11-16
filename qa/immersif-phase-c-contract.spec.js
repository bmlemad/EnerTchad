const { test, expect } = require('@playwright/test');

// Lot 130 (16 novembre 2026, plan validé par le DG) : direction immersive, phase C, treize pages de plus (FR et EN) sous /aval,
// /petrochimie, /intermediaire et /tchaditech. Posé au build par lib/immersif-amont.js (table PICK_130) : une section par page
// devient une scène (photo de fond décorative chargée au défilement, contenu dans une carte en verre au texte clair).
// Contrat : à 390 px et à 1440 px, une seule scène, l'ancre de la section est conservée, la scène contient un titre (h2 ou h3) dans la carte et, si elle porte aria-labelledby, il pointe vers un titre de la carte, la photo est décorative, publiée et couvre la scène, le texte, les titres, les liens et les tableaux de la carte restent
// clairs, aucun débordement horizontal ; les pages écartées (aval/boutique, aval/commercialisation) restent sans scène.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const picks = [
  ['/aval/distribution', 'dist-force', 'camion-route'], ['/aval/produits', 'mini-raffinerie-prod', 'raffinerie-jour'],
  ['/aval/raffinage', 'mini-raffinerie-modele', 'complexe-industriel'], ['/aval/reseau', 'reseau-services', 'dunes-sahara'],
  ['/petrochimie/chimie-eor', 'chimie-eor', 'complexe-industriel'], ['/petrochimie/complexe', 'phasage', 'raffinerie-jour'],
  ['/petrochimie/marches', 'substitution', 'camion-route'], ['/petrochimie/produits', 'petrochimie', 'flamme-gaz'],
  ['/intermediaire/collecte', 'engagements', 'pompe-petrole'], ['/intermediaire/logistique', 'corridor-flux', 'camion-route'],
  ['/intermediaire/services', 'inter-services', 'complexe-industriel'], ['/intermediaire/sites', 'sit-jalons', 'village-sahel'],
  ['/tchaditech/outils', 'out-usages', 'lac-tchad-espace']
];

function luminance(color) {
  const m = String(color).match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
}

test.describe('immersive phase C — aval, petrochimie, intermediaire, tchaditech', () => {
  for (const width of [390, 1440]) {
    for (const [route, id, photo] of picks) {
      for (const lang of ['', '-en']) {
        const path = route + lang;
        test(`${path} at ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
          expect(response && response.status(), path).toBe(200);
          const report = await page.evaluate(async id => {
            const target = document.getElementById(id);
            const scene = target && target.closest('main section.im-scene');
            if (scene) { scene.scrollIntoView(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
            const bg = scene && scene.querySelector(':scope > img.im-bg');
            const glass = scene && scene.querySelector('.im-glass');
            const h2 = glass && glass.querySelector('h2, h3');
            const labelId = scene && scene.getAttribute('aria-labelledby');
            const labelledBy = labelId ? document.getElementById(labelId) : null;
            const darkText = root => { const out = []; if (!root) return out; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.textContent.trim() || n.parentElement.closest('svg')) continue; const m = getComputedStyle(n.parentElement).color.match(/\d+/g).map(Number); if ((0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255 < 0.5) out.push(n.parentElement.tagName + ':' + n.textContent.trim().slice(0, 30)); } return out; };
            const colour = el => el && getComputedStyle(el).color;
            const text = glass && glass.querySelector('p, li');
            const link = glass && glass.querySelector('a');
            const cell = glass && glass.querySelector('td, th');
            const tables = glass ? [...glass.querySelectorAll('table')] : [];
            return {
              scenes: document.querySelectorAll('.im-scene').length,
              found: !!target, glass: !!glass, h2: h2 && h2.textContent.trim().length, h2Color: colour(h2),
              labelled: !labelId || (!!labelledBy && glass.contains(labelledBy)),
              bg: bg && { hidden: bg.getAttribute('aria-hidden'), alt: bg.getAttribute('alt'), loading: bg.getAttribute('loading'), src: bg.getAttribute('src') },
              cover: bg && [Math.round(bg.getBoundingClientRect().height), Math.round(scene.getBoundingClientRect().height)],
              dark: darkText(glass), textColor: colour(text), linkColor: colour(link), cellColor: colour(cell),
              tableBg: tables.length ? getComputedStyle(tables[0]).backgroundColor : null,
              inlineStyle: !!document.getElementById('et-immersif-amont'),
              viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth
            };
          }, id);
          expect(report.found, path + ' #' + id + ' anchor kept').toBe(true);
          expect(report.scenes, path + ' one scene').toBe(1);
          expect(report.glass, path + ' glass card').toBe(true);
          expect(report.inlineStyle, path + ' inline rules').toBe(true);
          expect(report.h2, path + ' title').toBeGreaterThan(5);
          expect(report.labelled, path + ' scene is labelled by a title inside the card').toBe(true);
          expect(report.bg, path + ' background image').toBeTruthy();
          expect(report.bg.hidden, path + ' decorative image').toBe('true');
          expect(report.bg.alt, path + ' decorative image alt').toBe('');
          expect(report.bg.loading, path + ' lazy image').toBe('lazy');
          expect(report.bg.src, path + ' published photo').toBe(`/assets/img/p/${photo}-1400.webp`);
          expect(report.cover[0], path + ' photo covers the scene').toBeGreaterThanOrEqual(report.cover[1] - 1);
          expect(report.dark, path + ' no dark text left on the glass card').toEqual([]);
          expect(luminance(report.h2Color), path + ' light title on the glass card').toBeGreaterThan(0.7);
          if (report.textColor) expect(luminance(report.textColor), path + ' light first paragraph').toBeGreaterThan(0.3);
          if (report.linkColor) expect(luminance(report.linkColor), path + ' light links on the glass card').toBeGreaterThan(0.7);
          if (report.cellColor) expect(luminance(report.cellColor), path + ' light table text on the glass card').toBeGreaterThan(0.7);
          if (report.tableBg) expect(report.tableBg, path + ' transparent table on the glass card').toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
          expect(report.scrollWidth, path + ' no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);
        });
      }
    }
  }

  test('the excluded pages stay without a scene and the other sections are not changed', async ({ request }) => {
    for (const path of ['/aval/boutique', '/aval/commercialisation', '/aval/boutique-en', '/aval/commercialisation-en']) {
      const response = await request.get(new URL(path, base).href, { timeout: 30000 });
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      expect(html.includes('class="im-scene'), path + ' no scene').toBe(false);
      expect(html.includes('id="et-immersif-amont"'), path + ' no inline rules').toBe(false);
    }
  });
});
