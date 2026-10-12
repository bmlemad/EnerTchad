const { test, expect } = require('@playwright/test');

// Menu mobile : le tiroir ouvert doit rester une surface opaque qui couvre la page.
// Contexte : le 11 octobre 2026, une règle d'en-tête « encastré » prévue pour le bureau
// s'appliquait aussi à #navLinks sous 1241 px ; le tiroir est devenu transparent
// (fond à 5 %, coins arrondis) et le menu se superposait au contenu, sans qu'aucun
// test ne le signale. Ce contrat ouvre le tiroir et vérifie ce que voit le visiteur.
// Complète mobile-navigation-contract.spec.js (ouverture, aria-expanded, accordéon, Échap à 390 px) :
// ici la surface du tiroir, les deux thèmes, 1024 px, le focus après Échap et le repli à la réouverture.
// Les pages couvrent les deux scripts du tiroir : c_ac04328f0f47.js (/, /index-en, /amont/)
// et u2_e8be195d19be.js (/carnets, /journal-criblage-eor, /contact).

const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = ['/', '/index-en', '/amont/', '/carnets', '/journal-criblage-eor', '/contact'];
const widths = [390, 1024];
const themes = [{ name: 'clair', value: '1' }, { name: 'sombre', value: '0' }];

function alphaOf(color) {
  const m = String(color).match(/rgba?\(([^)]+)\)/);
  if (!m) return color === 'transparent' ? 0 : 1;
  const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
}

test.describe('mobile drawer — opaque surface over the page', () => {
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

          const toggle = page.locator('#navTog');
          await expect(toggle).toBeVisible();
          await toggle.click();
          await expect(page.locator('#navLinks')).toHaveClass(/(^|\s)open(\s|$)/);
          // Attend la fin de l'animation d'ouverture (navDrop, 0,28 s), même sur une machine chargée.
          await page.locator('#navLinks').evaluate(el => Promise.all(el.getAnimations()
            .filter(a => a.effect && a.effect.getTiming().iterations !== Infinity)
            .map(a => a.finished.catch(() => {}))));

          const report = await page.evaluate(() => {
            const links = document.getElementById('navLinks');
            const cs = getComputedStyle(links);
            const r = links.getBoundingClientRect();
            // Points d'échantillonnage dans la moitié haute du tiroir, hors bords.
            const probes = [0.25, 0.5, 0.75].map(fx => {
              const x = r.left + r.width * fx;
              const y = Math.min(r.top + 160, r.top + r.height / 2);
              const el = document.elementFromPoint(x, y);
              return !!el && links.contains(el);
            });
            return {
              background: cs.backgroundColor,
              backgroundImage: cs.backgroundImage,
              opacity: parseFloat(cs.opacity),
              radius: parseFloat(cs.borderTopLeftRadius) || 0,
              coverage: r.width / document.documentElement.clientWidth,
              probes
            };
          });

          const opaqueBackground = alphaOf(report.background) >= 0.95 || report.backgroundImage !== 'none';
          expect(opaqueBackground, `${path} ${theme.name} ${width}px : fond du tiroir ${report.background}`).toBeTruthy();
          expect(report.opacity, `${path} ${theme.name} ${width}px : opacité du tiroir`).toBeGreaterThanOrEqual(0.95);
          expect(report.radius, `${path} ${theme.name} ${width}px : coins arrondis du tiroir`).toBeLessThanOrEqual(24);
          expect(report.coverage, `${path} ${theme.name} ${width}px : largeur couverte`).toBeGreaterThanOrEqual(0.9);
          expect(report.probes.every(Boolean), `${path} ${theme.name} ${width}px : le contenu de la page passe au-dessus du tiroir`).toBeTruthy();

          // Une rubrique dépliée reste lisible dans le tiroir.
          const trigger = page.locator('#navLinks .nav-item > .nav-trigger').first();
          await trigger.click();
          await expect(trigger).toHaveAttribute('aria-expanded', 'true');
          const firstLink = page.locator('#navLinks .nav-item').first().locator('.nx-mega a[href]').first();
          await expect(firstLink).toBeVisible();

          // Échap referme le tiroir et rend le focus au bouton du menu.
          await page.keyboard.press('Escape');
          await expect(page.locator('#navLinks')).not.toHaveClass(/(^|\s)open(\s|$)/);
          await expect(toggle).toHaveAttribute('aria-expanded', 'false');
          await expect(toggle, `${path} ${theme.name} ${width}px : focus après Échap`).toBeFocused();

          // Rouvert, le tiroir repart replié : aucune rubrique restée ouverte ni aria-expanded à vrai.
          await toggle.click();
          await expect(page.locator('#navLinks')).toHaveClass(/(^|\s)open(\s|$)/);
          await expect(page.locator('#navLinks .nav-item.open'), `${path} ${theme.name} ${width}px : rubrique restée ouverte`).toHaveCount(0);
          await expect(page.locator('#navLinks .nav-item > .nav-trigger[aria-expanded="true"]')).toHaveCount(0);
        });
      }
    }
  }
});
