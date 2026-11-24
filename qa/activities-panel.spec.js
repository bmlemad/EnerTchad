const { test, expect } = require('@playwright/test');

// 21 novembre 2026 (décision du DG, comparaison avec les majors) : l'en-tête garde ses cinq liens et gagne un seul panneau, sous
// « Activités » — les quatre métiers et la vue d'ensemble (lib/main-nav.js, clé « panel » de navigation.json, comportement dans
// nav_a.js). À partir de 1 241 px il s'ouvre au survol et au clic ; dans le tiroir mobile, en accordéon. Le Centre de Connaissances
// n'en a pas. Préfixe « mega-menu — » : ces tests tournent sur chaque PR.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const sets = {
  // 24 novembre 2026 (décision du DG) : « Le Groupe » — cinq métiers, puis l'entrée Investisseurs.
  '/societe': { titles: ['Produire', 'Transporter', 'Raffiner, distribuer', 'Transformer', 'Développer'], hrefs: ['/amont/', '/intermediaire/', '/aval/', '/petrochimie/', '/enerconseils/'], group: '/groupe', overview: '/nos-activites', extra: '/investisseurs' },
  '/index-en': { titles: ['Produce', 'Transport', 'Refine, distribute', 'Transform', 'Develop'], hrefs: ['/pole-amont-en', '/pole-intermediaire-en', '/pole-aval-en', '/pole-enerchimie-en', '/pole-enerconseils-en'], group: '/groupe-en', overview: '/nos-activites-en', extra: '/investisseurs-en' }
};
const open = async (browser, path, width, mobile = false) => {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: mobile, isMobile: mobile });
  const page = await context.newPage();
  await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
  await page.evaluate(() => document.querySelector('#et-consent')?.remove());
  return { page, context };
};

for (const [path, d] of Object.entries(sets)) {
  for (const width of [1280, 1440]) {
    test(`mega-menu — Activities panel opens on hover and click, closes on Escape (${path} at ${width}px)`, async ({ browser }) => {
      const { page, context } = await open(browser, path, width);
      const toggle = page.locator('#navLinks .et-has-sub > .et-sub-tog');
      const panel = page.locator('#et-sub-activites');
      await expect(page.locator('#nav [data-et-sub]')).toHaveCount(1);
      await expect(page.locator('#navLinks > .nav-item > a.nx-direct').nth(1)).toHaveAttribute('href', d.group); // 24 nov. 2026 : « Le Groupe » mène à la page /groupe
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect((await toggle.getAttribute('aria-label')).length).toBeGreaterThan(5);
      await expect(panel).toBeHidden();

      await page.hover('#navLinks .et-has-sub > a');
      await expect(panel).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      const links = panel.locator('a.et-sub-link');
      await expect(links).toHaveCount(5);
      for (let i = 0; i < 5; i++) {
        await expect(links.nth(i).locator('b')).toHaveText(d.titles[i]);
        await expect(links.nth(i)).toHaveAttribute('href', d.hrefs[i]);
      }
      await expect(panel.locator('a.et-sub-all')).toHaveAttribute('href', d.overview);
      await expect(panel.locator('a.et-sub-extra')).toHaveAttribute('href', d.extra);
      const box = await page.evaluate(() => {
        const p = document.querySelector('#et-sub-activites').getBoundingClientRect();
        return { top: p.top, left: p.left, right: p.right, nav: document.querySelector('#nav').getBoundingClientRect().bottom, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth };
      });
      expect(Math.abs(box.top - box.nav), 'panel hangs from the bottom of the bar').toBeLessThanOrEqual(1);
      expect(box.left, 'inside the viewport').toBeGreaterThanOrEqual(0);
      expect(box.right, 'inside the viewport').toBeLessThanOrEqual(box.vw);
      expect(box.sw, 'no horizontal overflow').toBeLessThanOrEqual(box.vw + 2);

      // Le pointeur descend du lien vers le panneau sans le refermer, puis le quitte.
      await page.mouse.move(box.left + 60, box.top + 40, { steps: 8 });
      await page.waitForTimeout(300);
      await expect(panel).toBeVisible();
      await page.mouse.move(box.left + 60, 860, { steps: 4 });
      await expect(panel).toBeHidden();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');

      // Clavier : le bouton ouvre, Tab entre dans le panneau, Échap ferme et rend le focus au bouton, sortir du panneau le ferme.
      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(panel).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(links.first()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(toggle).toBeFocused();
      await page.keyboard.press('Enter');
      // Autant de Tab que de liens du panneau (quatre segments, vue d'ensemble, services aux tiers depuis #268), plus un pour en sortir.
      const stops = await panel.locator('a').count();
      for (let i = 0; i <= stops; i++) await page.keyboard.press('Tab');
      await expect(panel).toBeHidden();
      // Un clic ailleurs ferme le panneau ouvert au clic.
      await toggle.click();
      await expect(panel).toBeVisible();
      await page.mouse.click(box.vw - 40, 860);
      await expect(panel).toBeHidden();
      await context.close();
    });
  }

  test(`mega-menu — Activities panel is an accordion in the mobile drawer (${path})`, async ({ browser }) => {
    const { page, context } = await open(browser, path, 390, true);
    await page.click('#navTog');
    const toggle = page.locator('#navLinks .et-has-sub > .et-sub-tog');
    const panel = page.locator('#et-sub-activites');
    await expect(toggle).toBeVisible();
    await expect(panel).toBeHidden();
    const size = await toggle.boundingBox();
    expect(size.width, 'tap target').toBeGreaterThanOrEqual(44);
    expect(size.height, 'tap target').toBeGreaterThanOrEqual(44);
    await toggle.tap();
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel.locator('a.et-sub-link')).toHaveCount(5);
    const report = await page.evaluate(() => {
      const p = document.querySelector('#et-sub-activites').getBoundingClientRect();
      const next = document.querySelectorAll('#navLinks > .nav-item')[2].getBoundingClientRect();
      return { right: p.right, below: next.top >= p.bottom - 1, vw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth };
    });
    expect(report.below, 'the next entries move below the open panel').toBe(true);
    expect(report.right).toBeLessThanOrEqual(report.vw);
    expect(report.sw).toBeLessThanOrEqual(report.vw + 2);
    await toggle.tap();
    await expect(panel).toBeHidden();
    await context.close();
  });
}

test('mega-menu — Activities panel marks the current business line, and the knowledge centre has no panel', async ({ browser }) => {
  const { page, context } = await open(browser, '/aval/produits', 1440);
  await expect(page.locator('#et-sub-activites a.et-sub-link[aria-current="page"]')).toHaveAttribute('href', '/aval/');
  await page.goto(new URL('/gouvernance', base).href, { waitUntil: 'load', timeout: 45000 });
  await expect(page.locator('#nav [data-et-sub]')).toHaveCount(0);
  await expect(page.locator('#et-sub-css')).toHaveCount(0);
  await context.close();
});
