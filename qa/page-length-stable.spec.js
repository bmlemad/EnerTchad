const { test, expect } = require('@playwright/test');

// 22 novembre 2026 : le rendu différé (content-visibility:auto) réservait aux sections hors écran des hauteurs estimées
// qui ne suivaient plus le contenu. Sur 89 pages, la longueur de page annoncée à l'ouverture différait de plus de 600 px
// de la longueur réelle (Réseau de stations : 25 178 px annoncés pour 14 434 en bureau, 43 620 pour 20 249 sur mobile),
// et la barre de défilement sautait pendant la lecture. Le rendu différé est retiré ; ces tests échouent sur l'export précédent.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const pages = ['/aval/reseau', '/aval/reseau-en', '/intermediaire/logistique', '/engagements', '/amont/services-ep', '/societe'];

for (const path of pages) for (const width of [390, 1440]) {
  test(`mobile navigation — page length does not change while scrolling ${path} ${width}`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    const deferred = await page.evaluate(() =>
      [...document.querySelectorAll('main *')].filter(el => getComputedStyle(el).contentVisibility === 'auto').length);
    expect(deferred, path + ' has no deferred section').toBe(0);
    const before = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < before; y += 800) {
      await page.evaluate(top => window.scrollTo(0, top), y);
      await page.waitForTimeout(30);
    }
    const after = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(Math.abs(after - before), `${path} length ${before} → ${after}`).toBeLessThanOrEqual(120);
    await page.close();
  });
}
