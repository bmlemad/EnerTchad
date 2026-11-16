const { test, expect } = require('@playwright/test');

// Lot 131 (16 novembre 2026, demande du DG) : un même repère d'ouverture et de fermeture du menu mobile sur le site principal,
// l'espace Clients et l'Atlas — trois barres de 18 × 2 px dans un bouton de 44 × 44 px, qui deviennent une croix à l'ouverture.
// Plus de libellé « Menu + » : le nom accessible reste « Menu » (aria-label).

const base = process.env.SITE_URL || 'https://enertchad.com/';
const spaces = ['/atlas', '/atlas-en', '/atlas/carte', '/boutique/', '/boutique/clients', '/boutique/en/', '/boutique/en/clients'];

async function bars(page, trigger) {
  return page.evaluate(sel => {
    const t = document.querySelector(sel);
    const r = t.getBoundingClientRect();
    const bz = [...t.querySelectorAll('.bz')].map(b => { const c = getComputedStyle(b); return { w: Math.round(parseFloat(c.width)), h: Math.round(parseFloat(c.height)), op: c.opacity, tf: c.transform }; });
    return { w: Math.round(r.width), h: Math.round(r.height), n: bz.length, bz, text: t.textContent.trim(), label: t.getAttribute('aria-label') };
  }, trigger);
}

test.describe('same menu marker on every space', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('main site: reference marker', async ({ page }) => {
    await page.goto(new URL('/', base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const ref = await bars(page, '#navTog');
    expect(ref).toMatchObject({ w: 44, h: 44, n: 3, label: 'Menu', text: '' });
    expect(ref.bz.every(b => b.w === 18 && b.h === 2)).toBe(true);
  });

  for (const path of spaces) {
    test(`${path}: icon marker, no "Menu +" label`, async ({ page }) => {
      const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      expect(response && response.status(), path).toBe(200);
      const closed = await bars(page, '#nav details.et-al-tog > summary');
      expect(closed.w, path + ' width').toBe(44);
      expect(closed.h, path + ' height').toBe(44);
      expect(closed.n, path + ' three bars').toBe(3);
      expect(closed.text, path + ' no text label').toBe('');
      expect(closed.label, path + ' accessible name').toBe('Menu');
      expect(closed.bz.every(b => b.w === 18 && b.h === 2), path + ' bar size 18x2').toBe(true);
      expect(await page.evaluate(() => /Menu\s*\+/.test(document.querySelector('#nav').innerText)), path + ' no "Menu +" text').toBe(false);
      await page.locator('#nav details.et-al-tog > summary').click();
      await page.waitForTimeout(450);
      const open = await bars(page, '#nav details.et-al-tog > summary');
      expect(open.bz[1].op, path + ' middle bar hidden when open').toBe('0');
      expect(open.bz[0].tf, path + ' top bar rotated').not.toBe('none');
      expect(open.bz[2].tf, path + ' bottom bar rotated').not.toBe('none');
      await page.keyboard.press('Escape');
      expect(await page.evaluate(() => document.querySelector('#nav details.et-al-tog').open), path + ' Escape closes').toBe(false);
    });
  }
});
