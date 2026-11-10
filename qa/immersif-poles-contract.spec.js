const { test, expect } = require('@playwright/test');

// Lot 113 (10 novembre 2026) : direction immersive, phase B — pages d'entrée des huit pôles, FR et EN.
// Posé au build par lib/immersif-poles.js : la section #conviction est une scène (photo de fond décorative, chargée
// au défilement, manifeste dans une carte en verre au texte clair) ; dans #statut-reel, les libellés d'état sont des
// pastilles. Ce contrat vérifie la présence et la forme sur les 16 pages, et l'absence de débordement à 390 px.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const hubs = ['/amont/', '/intermediaire/', '/aval/', '/petrochimie/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/',
  '/pole-amont-en', '/pole-intermediaire-en', '/pole-aval-en', '/pole-enerchimie-en', '/pole-greentech-en', '/pole-tchaditech-en', '/pole-tchaditude-en', '/pole-enerconseils-en'];
const withStatus = new Set(['/amont/', '/intermediaire/', '/aval/', '/petrochimie/', '/pole-amont-en', '/pole-intermediaire-en', '/pole-aval-en', '/pole-enerchimie-en']);

function luminance(color) {
  const m = String(color).match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
}

test.describe('immersive pole hubs — conviction scene and status pills', () => {
  for (const path of hubs) {
    test(path, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      expect(response && response.status(), path).toBe(200);
      const report = await page.evaluate(() => {
        const scene = document.querySelector('#conviction.im-scene');
        const bg = scene && scene.querySelector(':scope > img.im-bg');
        const glass = scene && scene.querySelector('.pp-sig.im-glass');
        const text = glass && glass.querySelector('p');
        return {
          scene: !!scene, glass: !!glass,
          bg: bg && { hidden: bg.getAttribute('aria-hidden'), alt: bg.getAttribute('alt'), loading: bg.getAttribute('loading'), src: bg.getAttribute('src') },
          cover: bg && scene && [Math.round(bg.getBoundingClientRect().height), Math.round(scene.getBoundingClientRect().height)],
          textColor: text && getComputedStyle(text).color,
          pills: [...document.querySelectorAll('#statut-reel .im-status')].map(e => e.className),
          inlineStyle: !!document.getElementById('et-immersif-poles'),
          viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth
        };
      });
      expect(report.scene, path + ' scene').toBe(true);
      expect(report.glass, path + ' glass card').toBe(true);
      expect(report.inlineStyle, path + ' inline rules').toBe(true);
      expect(report.bg, path + ' background image').toBeTruthy();
      expect(report.bg.hidden, path + ' decorative image').toBe('true');
      // Le gabarit impose height:auto aux images : la photo doit malgré tout couvrir toute la scène, y compris sur mobile.
      expect(report.cover[0], path + ' photo covers the scene').toBeGreaterThanOrEqual(report.cover[1] - 1);
      expect(report.bg.alt, path + ' decorative image alt').toBe('');
      expect(report.bg.loading, path + ' lazy image').toBe('lazy');
      expect(report.bg.src, path + ' published photo').toMatch(/^\/assets\/img\/p\/[a-z-]+-1400\.webp$/);
      expect(luminance(report.textColor), path + ' light text on the glass card').toBeGreaterThan(0.7);
      if (withStatus.has(path)) expect(report.pills.length, path + ' status pills').toBeGreaterThanOrEqual(3);
      else expect(report.pills.length, path + ' no status section').toBe(0);
      expect(report.scrollWidth, path + ' no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);
    });
  }
});
