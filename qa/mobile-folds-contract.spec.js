const { test, expect } = require('@playwright/test');

// Lot 132 (16 novembre 2026, choix du DG après relecture de la PR #159) : la page Contact replie « Contact rapide »
// sous son titre pour rapprocher le formulaire. Texte et liens sont conservés : ils s'affichent à l'ouverture.

const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const en of [false, true]) {
  const lang = en ? 'en' : 'fr';
  // Lot 136 (17 novembre 2026, choix du DG) : le repli mobile des cas et de la méthode de la page Amont est remplacé par le repli
  // du détail de chaque page de pôle, valable à toutes les largeurs (voir lib/pole-folds.js).
  for (const [path, count] of en ? [['/pole-amont-en', 6], ['/pole-aval-en', 7], ['/pole-intermediaire-en', 7], ['/pole-enerchimie-en', 4]] : [['/amont/', 6], ['/aval/', 7], ['/intermediaire/', 7], ['/petrochimie/', 4]]) {
    test(`mobile navigation — pole detail folds ${path}`, async ({ browser }) => {
      for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const folds = page.locator('details[data-detail-fold]');
        await expect(folds).toHaveCount(count);
        await expect(page.locator('details[data-mobile-fold]')).toHaveCount(0);
        for (let i = 0; i < count; i++) {
          await expect(folds.nth(i)).not.toHaveAttribute('open', '');
          expect((await folds.nth(i).locator('> summary').boundingBox()).height).toBeGreaterThanOrEqual(44);
        }
        // Clavier : Entrée ouvre, Espace referme ; le titre de la rubrique s'affiche à l'ouverture.
        await folds.first().locator('> summary').press('Enter');
        await expect(folds.first()).toHaveAttribute('open', '');
        await expect(folds.first().locator('h2')).toBeVisible();
        await folds.first().locator('> summary').press('Space');
        await expect(folds.first()).not.toHaveAttribute('open', '');
        // Un lien d'ancre de la sous-navigation ouvre la rubrique visée.
        const anchor = page.locator('.pp-sub a[href="#approche"], .pp-sub a[href="#documents"]').first();
        const id = (await anchor.getAttribute('href')).slice(1);
        await anchor.click();
        await expect(page.locator(`#${id} > details`)).toHaveAttribute('open', '');
        await expect(page.locator(`#${id} h2`)).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.close();
      }
    });
  }
  test(`mobile navigation — pole detail opens from a deep link ${lang}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(new URL((en ? '/pole-aval-en' : '/aval/') + '#chiffres', base).href, { waitUntil: 'networkidle' });
    await expect(page.locator('#chiffres > details')).toHaveAttribute('open', '');
    await expect(page.locator('#chiffres h2')).toBeInViewport();
    await expect(page.locator('#approche > details')).not.toHaveAttribute('open', '');
    await page.close();
  });

  test(`mobile navigation — contact ${lang}: quick contact folded, form closer, links kept`, async ({ browser }) => {
    const path = en ? '/contact-en' : '/contact';
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const fold = page.locator('#contact-rapide details.ct-fold');
    await expect(fold).toHaveCount(1);
    await expect(fold).not.toHaveAttribute('open', '');
    await expect(fold.locator('> summary h2')).toBeVisible();
    expect(await fold.locator('a[href^="https://wa.me/"]').count(), 'WhatsApp links kept').toBeGreaterThanOrEqual(4);
    await fold.locator('> summary').click();
    await expect(fold).toHaveAttribute('open', '');
    await expect(fold.locator('a[href^="https://wa.me/"]').first()).toBeVisible();
    await fold.locator('> summary').click();
    const top = await page.evaluate(() => Math.round(document.getElementById('ctForm').getBoundingClientRect().top + scrollY));
    expect(top, 'form position before the fold work was 3610 px').toBeLessThan(3000);
    const hero = await page.locator('#top-pole').boundingBox();
    expect(hero.height).toBeLessThan(600);
    await expect(page.locator('#top-pole a[href="#ctForm"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.close();
  });
}

// Lot 137 (17 novembre 2026, choix du DG) : sur Investisseurs et Services parapétroliers, la suite de chaque bloc long se replie
// sous « Lire la suite » ; le titre et le premier paragraphe restent visibles (voir lib/block-folds.js).
// Lot 140 : même règle sur Engagements, Société et Produits raffinés.
for (const [path, anchor, least = 8] of [['/investisseurs', 'jalons'], ['/investisseurs-en', 'jalons'], ['/amont/services-ep', 'ofs-pourquoi'], ['/amont/services-ep-en', 'ofs-pourquoi'], ['/engagements', null, 4], ['/engagements-en', null, 4], ['/societe', null], ['/societe-en', null], ['/aval/produits', null], ['/aval/produits-en', null]]) {
  test(`mobile navigation — long block folds ${path}`, async ({ browser }) => {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const folds = page.locator('details[data-block-fold]');
      expect(await folds.count()).toBeGreaterThanOrEqual(least);
      expect(await page.locator('details[data-block-fold][open]').count()).toBe(0);
      const first = folds.first(), summary = first.locator('> summary');
      await summary.scrollIntoViewIfNeeded();
      expect((await summary.boundingBox()).height).toBeGreaterThanOrEqual(44);
      await expect(summary).toHaveAttribute('aria-label', / — /);
      // Le titre du bloc reste visible à côté du repli fermé.
      await expect(first.locator('xpath=ancestor::div[contains(@class,"pp-block")][1]//div[contains(@class,"pp-bh")]//h3')).toBeVisible();
      await summary.press('Enter');
      await expect(first).toHaveAttribute('open', '');
      await expect(first.locator('.pp-bfold-b > *').first()).toBeVisible();
      await summary.press('Space');
      await expect(first).not.toHaveAttribute('open', '');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.close();
    }
    // Un lien profond vers un bloc l'ouvre.
    if (!anchor) return;
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(new URL(path + '#' + anchor, base).href, { waitUntil: 'networkidle' });
    await expect(page.locator(`#${anchor} details[data-block-fold]`)).toHaveAttribute('open', '');
    await page.close();
  });
}
