const { test, expect } = require('@playwright/test');

// Lot 132 (16 novembre 2026, choix du DG après relecture de la PR #159) : sur mobile, la page Amont replie ses cas d'usage et les
// cinq principes de sa méthode sous leur titre (ouverts et sans bouton sur ordinateur) ; la page Contact replie « Contact rapide »
// sous son titre pour rapprocher le formulaire. Texte et liens sont conservés : ils s'affichent à l'ouverture.

const base = process.env.SITE_URL || 'https://enertchad.com/';

for (const en of [false, true]) {
  const lang = en ? 'en' : 'fr';
  test(`mobile navigation — upstream folds remain reachable across resizing ${lang}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.goto(new URL(en ? '/pole-amont-en' : '/amont/', base).href, { waitUntil: 'networkidle' });
    const folds = page.locator('details[data-mobile-fold]');
    await expect(folds).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(folds.nth(i)).not.toHaveAttribute('open', '');
    await folds.first().locator('> summary').press('Enter');
    await expect(folds.first()).toHaveAttribute('open', '');
    await page.setViewportSize({ width: 1440, height: 900 });
    for (let i = 0; i < 2; i++) {
      await expect(folds.nth(i)).toHaveAttribute('open', '');
      await expect(folds.nth(i).locator('> summary')).toBeHidden();
      await expect(folds.nth(i).locator('li, .pp-principles > div').first()).toBeVisible();
    }
    await page.screenshot({ path: `artifacts/upstream-after-mobile-${lang}-1440.png` });
    await page.setViewportSize({ width: 390, height: 900 });
    await expect(folds.first()).toHaveAttribute('open', '');
    await folds.first().locator('> summary').press('Space');
    await expect(folds.first()).not.toHaveAttribute('open', '');
    await page.setViewportSize({ width: 761, height: 900 });
    await expect(folds.first()).toHaveAttribute('open', '');
    await expect(folds.first().locator('> summary')).toBeHidden();
    await page.close();
  });
  test(`mobile navigation — amont ${lang}: mobile folds closed at 390, open without button at 1440`, async ({ browser }) => {
    const path = en ? '/pole-amont-en' : '/amont/';
    for (const [width, mobile] of [[390, true], [1440, false]]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      const folds = page.locator('details[data-mobile-fold]');
      await expect(folds).toHaveCount(2);
      for (let i = 0; i < 2; i++) {
        const fold = folds.nth(i);
        if (mobile) {
          await expect(fold).not.toHaveAttribute('open', '');
          await expect(fold.locator('> summary')).toBeVisible();
          expect((await fold.locator('> summary').boundingBox()).height).toBeGreaterThanOrEqual(44);
          await fold.locator('> summary').click();
          await expect(fold).toHaveAttribute('open', '');
          await expect(fold.locator('li, .pp-principles > div').first()).toBeVisible();
        } else {
          await expect(fold).toHaveAttribute('open', '');
          await expect(fold.locator('> summary')).toBeHidden();
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      await page.close();
    }
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
