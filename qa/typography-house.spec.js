const { test, expect } = require('@playwright/test');

// 22 novembre 2026 : trois polices maison — Inter (texte), Instrument Serif (titres), JetBrains Mono (données).
// Avant : l'ancienne police d'affichage (Space Grotesk / National Park) sur 81 pages, téléchargée jusque sur l'accueil ;
// la signature des accueils en Georgia ; le bouton des préférences d'audience en police système. Échouent sur l'export précédent.
const base = process.env.SITE_URL || 'https://enertchad.com/';
const OFF = /^(Space Grotesk|National Park|Georgia|Arial)$/;

for (const path of ['/', '/index-en', '/carnets', '/journal-atlas-secteur', '/atlas/carte', '/societe']) {
  test(`visual system budgets — house typefaces only ${path}`, async ({ page }) => {
    const fonts = [];
    page.on('request', r => { if (/NationalPark/.test(r.url())) fonts.push(r.url()); });
    await page.goto(new URL(path, base).href, { waitUntil: 'networkidle', timeout: 45000 });
    const off = await page.evaluate(re => {
      const rx = new RegExp(re), out = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = w.nextNode());) {
        const e = n.parentElement; if (!n.nodeValue.trim() || !e.getBoundingClientRect().width || e.closest('svg,script,style')) continue;
        const f = getComputedStyle(e).fontFamily.split(',')[0].replace(/["']/g, '').trim();
        if (rx.test(f)) out.push(`${f}: ${n.nodeValue.trim().slice(0, 30)}`);
      }
      return out;
    }, OFF.source);
    expect(off, path).toEqual([]);
    expect(fonts, path + ' downloads no retired display font').toEqual([]);
  });
}

test('visual system budgets — home signature is set in Instrument Serif', async ({ page }) => {
  await page.goto(new URL('/', base).href, { waitUntil: 'load', timeout: 45000 });
  expect(await page.locator('.et-hero .mod-signature').evaluate(e => getComputedStyle(e).fontFamily)).toMatch(/^"?Instrument Serif/);
});
