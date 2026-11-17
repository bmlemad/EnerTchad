const { test, expect } = require('@playwright/test');

// Lot 132 (16 novembre 2026, choix du DG après relecture de la PR #159) : la page Contact replie « Contact rapide »
// sous son titre pour rapprocher le formulaire. Texte et liens sont conservés : ils s'affichent à l'ouverture.

const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const en of [false, true]) {
  const lang = en ? 'en' : 'fr';
  // Lot 136 (17 novembre 2026, choix du DG) : le repli mobile des cas et de la méthode de la page Amont est remplacé par le repli
  // du détail de chaque page de pôle, valable à toutes les largeurs (voir lib/pole-folds.js).
  // Lot 141 (17 novembre 2026, choix du DG) : GreenTech, EnerConseils, TchadiTech et TchadiTude s'ajoutent (cinq rubriques chacun).
  for (const [path, count] of en
    ? [['/pole-amont-en', 6], ['/pole-aval-en', 7], ['/pole-intermediaire-en', 7], ['/pole-enerchimie-en', 4], ['/pole-greentech-en', 5], ['/pole-enerconseils-en', 4], ['/pole-tchaditech-en', 5], ['/pole-tchaditude-en', 5]]
    : [['/amont/', 6], ['/aval/', 7], ['/intermediaire/', 7], ['/petrochimie/', 4], ['/greentech/', 5], ['/enerconseils/', 4], ['/tchaditech/', 5], ['/tchaditude/', 5]]) {
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
        const id = await page.evaluate(() => [...document.querySelectorAll('.pp-sub a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).find(i => document.querySelector(`#${i} > details`)));
        expect(id, 'a sub-navigation link leads to a folded section').toBeTruthy();
        await page.locator(`.pp-sub a[href="#${id}"]`).first().click();
        await expect(page.locator(`#${id} > details`)).toHaveAttribute('open', '');
        await expect(page.locator(`#${id} h2`)).toBeInViewport();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        await page.close();
      }
    });
  }
  // Identifiants les plus liés depuis le reste du site (lot 141) : chacun ouvre sa rubrique, à 390 et 1440 px.
  for (const [route, enRoute, id, other] of [['/aval/', '/pole-aval-en', 'chiffres', 'approche'], ['/greentech/', '/pole-greentech-en', 'hseq', 'impact'], ['/greentech/', '/pole-greentech-en', 'impact', 'hseq'],
    ['/enerconseils/', '/pole-enerconseils-en', 'esg', 'cas'], ['/tchaditech/', '/pole-tchaditech-en', 'rd', 'socle'], ['/tchaditech/', '/pole-tchaditech-en', 'socle', 'rd'],
    ['/tchaditech/', '/pole-tchaditech-en', 'recits', 'innovations'], ['/tchaditech/', '/pole-tchaditech-en', 'innovations', 'recits'],
    ['/tchaditude/', '/pole-tchaditude-en', 'academie', 'partenariats'], ['/tchaditude/', '/pole-tchaditude-en', 'partenariats', 'academie']]) {
    test(`mobile navigation — pole detail opens from a deep link ${lang} ${route}#${id}`, async ({ browser }) => {
      for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(new URL((en ? enRoute : route) + '#' + id, base).href, { waitUntil: 'networkidle' });
        await expect(page.locator(`#${id} > details`)).toHaveAttribute('open', '');
        await expect(page.locator(`#${id} h2`)).toBeInViewport();
        if (await page.locator(`#${other} > details`).count()) await expect(page.locator(`#${other} > details`)).not.toHaveAttribute('open', '');
        await page.close();
      }
    });
  }

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

// Lot 142 (17 novembre 2026) : la section principale de la page Distribution ne range plus ses conteneurs en colonnes de 266 px.
for (const path of ['/aval/distribution', '/aval/distribution-en']) {
  test(`mobile navigation — distribution grid uses the full width ${path}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
    const report = await page.evaluate(() => {
      const section = document.querySelector('#distribution'), detail = document.querySelector('#dx'), grid = detail.parentElement;
      const cards = [...detail.querySelectorAll(':scope > .pp-cell > .pp-grid')].map(list => new Set([...list.children].map(card => Math.round(card.getBoundingClientRect().left))).size);
      return { section: section.getBoundingClientRect().height, ratio: detail.getBoundingClientRect().width / grid.getBoundingClientRect().width, cards, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    expect(report.ratio, 'detail chapter spans the grid').toBeGreaterThan(0.98);
    expect(Math.min(...report.cards), 'every card list has several columns').toBeGreaterThanOrEqual(3);
    expect(report.section, 'section height was about 10 100 px').toBeLessThan(6500);
    expect(report.overflow).toBe(false);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.close();
  });
}

// Lot 143 (17 novembre 2026) : même réparation sur Récupération assistée ; plus aucune carte étroite et haute dans les deux pages.
for (const [path, id] of [['/amont/eor', 'eor'], ['/amont/eor-en', 'eor'], ['/aval/distribution', 'distribution'], ['/aval/distribution-en', 'distribution']]) {
  test(`mobile navigation — legacy grid has no squeezed column ${path}`, async ({ browser }) => {
    for (const width of [1440, 1024, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
      const report = await page.evaluate(id => ({
        squeezed: [...document.querySelectorAll(`#${id} .pp-cell`)].filter(cell => { const box = cell.getBoundingClientRect(); return box.width < 200 && box.height > 400; }).length,
        outside: [...document.querySelectorAll(`#${id} *`)].filter(node => node.getBoundingClientRect().right > innerWidth + 1).length,
        overflow: document.documentElement.scrollWidth > innerWidth + 1
      }), id);
      expect(report, `${path} at ${width}px`).toEqual({ squeezed: 0, outside: 0, overflow: false });
      await page.close();
    }
  });
}
