const { test, expect } = require('@playwright/test');

// Lot 108 (9 novembre 2026) : menu mobile des pages arabes.
// Avant : pas de bouton, six liens sur deux lignes, en-tête collant de 160 px à 390 px (19 % de l'écran).
// Contrat : à 390 px, une ligne marque + bouton « القائمة » (en-tête fermé ≤ 80 px), tiroir opaque
// dans les deux thèmes, aria-expanded fidèle, Échap ferme et rend le focus au bouton, aucun
// débordement horizontal ; à 1280 px, bouton caché et six liens visibles comme avant.
// Bouton et tiroir posés au build par lib/ar-nav.js ; styles dans assets/chrome/ar-nav.css.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = ['/ar', '/ar-societe', '/ar-investisseurs', '/ar-presse'];
const themes = [{ name: 'clair', value: '1' }, { name: 'sombre', value: '0' }];

function alphaOf(color) {
  const m = String(color).match(/rgba?\(([^)]+)\)/);
  if (!m) return color === 'transparent' ? 0 : 1;
  const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
}

test.describe('arabic mobile navigation — menu button and drawer', () => {
  for (const path of paths) {
    for (const theme of themes) {
      test(`${path} — ${theme.name} — 390px`, async ({ page }) => {
        await page.addInitScript(value => {
          try { localStorage.setItem('et-plight', value); localStorage.setItem('et-jlight', value); } catch (e) {}
        }, theme.value);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(new URL(path, base).href, { waitUntil: 'networkidle', timeout: 45000 });

        const toggle = page.locator('header.arh #arh-tog');
        const drawer = page.locator('header.arh #arh-drawer');
        const links = page.locator('header.arh .arh-nav a');
        await expect(toggle, path).toBeVisible();
        await expect(toggle, path).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle, path).toHaveAttribute('aria-controls', 'arh-drawer');
        await expect(toggle, path).toHaveAttribute('aria-label', 'القائمة');
        await expect(drawer, path).toBeHidden();
        const closed = await page.locator('header.arh').boundingBox();
        expect(closed.height, path + ' closed header height').toBeLessThanOrEqual(80);
        const box = await toggle.boundingBox();
        expect(box.width, path + ' toggle target').toBeGreaterThanOrEqual(44);
        expect(box.height, path + ' toggle target').toBeGreaterThanOrEqual(44);

        await toggle.click();
        await expect(toggle, path).toHaveAttribute('aria-expanded', 'true');
        await expect(drawer, path).toBeVisible();
        expect(await links.count(), path + ' arabic links').toBe(6);
        for (let i = 0; i < 6; i++) await expect(links.nth(i), path + ' link ' + i).toBeVisible();
        const report = await page.evaluate(() => ({
          bg: getComputedStyle(document.getElementById('arh-drawer')).backgroundColor,
          viewport: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));
        expect(alphaOf(report.bg), path + ' drawer surface must be opaque').toBe(1);
        expect(report.scrollWidth, path + ' no horizontal overflow').toBeLessThanOrEqual(report.viewport + 2);

        await page.keyboard.press('Escape');
        await expect(toggle, path).toHaveAttribute('aria-expanded', 'false');
        await expect(drawer, path).toBeHidden();
        expect(await page.evaluate(() => document.activeElement && document.activeElement.id), path + ' focus after Escape').toBe('arh-tog');
      });
    }

    test(`${path} — 1280px — desktop header unchanged`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(new URL(path, base).href, { waitUntil: 'networkidle', timeout: 45000 });
      await expect(page.locator('header.arh #arh-tog'), path).toBeHidden();
      const links = page.locator('header.arh .arh-nav a');
      expect(await links.count(), path).toBe(6);
      for (let i = 0; i < 6; i++) await expect(links.nth(i), path + ' link ' + i).toBeVisible();
    });
  }
});
