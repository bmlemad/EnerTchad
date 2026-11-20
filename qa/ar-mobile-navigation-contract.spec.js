const { test, expect } = require('@playwright/test');

// Lot 108 (9 novembre 2026) : menu mobile des pages arabes.
// Avant : pas de bouton, six liens sur deux lignes, en-tête collant de 160 px à 390 px (19 % de l'écran).
// Contrat : à 390 px, une ligne marque + bouton « القائمة » (en-tête fermé ≤ 80 px), tiroir opaque
// dans les deux thèmes, aria-expanded fidèle, Échap ferme et rend le focus au bouton, aucun
// débordement horizontal ; lot 128 : le bouton « إبداء الاهتمام » est dans le tiroir ; à 1280 px, bouton caché et six liens visibles comme avant.
// Bouton et tiroir posés au build par lib/ar-nav.js ; styles dans assets/chrome/ar-nav.css.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = ['/ar', '/ar-societe', '/ar-leadership', '/ar-investisseurs', '/ar-presse'];
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
        // Lot 125 : cinq liens simples (الرئيسية، الرؤية، الأنشطة، المستثمرون، اتصل بنا), plus de « بحث (FR) » dans l'en-tête.
        // 17 novembre 2026 : quatre liens, « اتصل بنا » devient le bouton (il ne double plus « المستثمرون »).
        expect(await links.count(), path + ' arabic links').toBe(5);
        for (let i = 0; i < 5; i++) await expect(links.nth(i), path + ' link ' + i).toBeVisible();
        // Lot 128 : le tiroir porte le bouton « إبداء الاهتمام » (comme le tiroir français son bouton « Investisseurs »), sur une ligne entière.
        const cta = page.locator('header.arh #arh-drawer .arh-cta');
        await expect(cta, path + ' investor button in the drawer').toBeVisible();
        await expect(cta, path + ' investor button target').toHaveAttribute('href', '/ar-contact');
        await expect(cta, path + ' investor button label').toHaveText('اتصل بنا');
        const ctaBox = await cta.boundingBox();
        expect(ctaBox.height, path + ' investor button height').toBeGreaterThanOrEqual(44);
        expect(ctaBox.width, path + ' investor button width').toBeGreaterThanOrEqual(240);
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

    test(`${path} — 1280px — desktop header, five plain links`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(new URL(path, base).href, { waitUntil: 'networkidle', timeout: 45000 });
      await expect(page.locator('header.arh #arh-tog'), path).toBeHidden();
      const links = page.locator('header.arh .arh-nav a');
      // 20 novembre 2026 (décision du DG, deux espaces) : les cinq entrées du site principal ; le logo mène à l'accueil.
      expect(await links.count(), path).toBe(5);
      const expected = ['/ar-societe', '/ar-poles', '/ar#impact', '/ar-leadership', '/ar-investisseurs'];
      const labels = ['الرؤية', 'الأنشطة', 'الأثر', 'القيادة', 'المستثمرون'];
      for (let i = 0; i < 5; i++) {
        await expect(links.nth(i), path + ' link ' + i).toBeVisible();
        await expect(links.nth(i), path + ' href ' + i).toHaveAttribute('href', expected[i]);
        await expect(links.nth(i), path + ' label ' + i).toHaveText(labels[i]);
      }
      await expect(page.locator('header.arh .arh-cta'), path + ' contact button').toHaveAttribute('href', '/ar-contact');
      await expect(page.locator('header.arh a[href="/recherche"]'), path + ' no search link in the header').toHaveCount(0);
      await expect(page.locator('footer a[href="/recherche"]').first(), path + ' search stays in the footer').toBeAttached();
    });
  }
});

// Lot 143 (17 novembre 2026, décision du DG) : le pied de page arabe n'a plus que deux colonnes, comme le français ; la colonne qui répétait
// l'en-tête est retirée, « بحث (FR) » reste dans la colonne d'informations, le bloc de marque occupe la place libérée (lib/navigation-review.js).
for (const path of ['/ar', '/ar-societe', '/ar-poles', '/ar-amont', '/ar-contact', '/ar-presse']) {
  test(`arabic footer — two columns ${path}`, async ({ browser }) => {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      // 20 novembre 2026 : le test mesure des hauteurs de liens ; à « domcontentloaded » les feuilles de style n'étaient pas toujours
      // appliquées sur le site en ligne (20 liens à 20 px, puis 0 une fois la page chargée). On attend l'événement « load ».
      await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
      const footer = page.locator('footer.pft-ar');
      await expect(footer).toHaveAttribute('data-et-footer-columns', '2');
      await expect(footer.locator('.foot-col')).toHaveCount(2);
      await expect(footer.locator('h3', { hasText: 'بالعربية' })).toHaveCount(0);
      await expect(footer.locator('.foot-col:last-child a[href="/recherche"]')).toHaveCount(1);
      for (const sel of ['a[href="/ar"]', 'a[href="/ar-contact"]', 'a[lang="en"]', 'a[href="/ar-cookies"]']) await expect(footer.locator(sel).first(), sel).toBeAttached();
      const boxes = await page.evaluate(() => {
        const f = document.querySelector('footer.pft-ar');
        const r = e => { const b = e.getBoundingClientRect(); return [b.left, b.right, b.width]; };
        return { dir: getComputedStyle(f).direction, brand: r(f.querySelector('.foot-brand')), cols: [...f.querySelectorAll('.foot-col')].map(r), overflow: document.documentElement.scrollWidth > innerWidth + 1,
          shortLinks: [...f.querySelectorAll('a')].filter(a => a.offsetParent && a.getBoundingClientRect().height < 24).length };
      });
      expect(boxes.dir).toBe('rtl');
      expect(boxes.overflow, `${path} ${width}`).toBe(false);
      expect(boxes.shortLinks, 'footer links keep a 24 px target').toBe(0);
      if (width === 1440) {
        // Lecture de droite à gauche : le bloc de marque est le plus à droite et couvre deux colonnes ; les deux colonnes de liens sont à sa gauche.
        expect(boxes.brand[1]).toBeGreaterThan(boxes.cols[0][1]);
        expect(boxes.brand[2]).toBeGreaterThan(boxes.cols[0][2] * 2);
        expect(boxes.cols[0][0]).toBeGreaterThan(boxes.cols[1][0]);
      }
      await page.close();
    }
  });
}
