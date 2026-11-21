const { test, expect } = require('@playwright/test');

// Audit design du 20 novembre 2026 : le bouton d'action maison est à angles vifs et haut de 56 px.
// Trois boutons s'en écartaient (lib/button-coherence.js). Chaque test échoue sur l'export précédent.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const open = async (browser, path, width = 1440) => {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
  return page;
};
const box = locator => locator.evaluate(el => {
  const s = getComputedStyle(el), r = el.getBoundingClientRect();
  return { radius: s.borderTopLeftRadius, height: Math.round(r.height), font: s.fontFamily.split(',')[0].replace(/["']/g, '').trim() };
});

for (const path of ['/aval/', '/amont/', '/enerconseils/', '/pole-aval-en']) {
  test(`mobile navigation — module buttons share the square house button ${path}`, async ({ browser }) => {
    const page = await open(browser, path);
    const buttons = page.locator('.mod-button');
    const count = await buttons.count();
    expect(count, path + ' has module buttons').toBeGreaterThan(0);
    const house = await box(page.locator('.pp-btn').first());
    for (let i = 0; i < count; i++) expect((await box(buttons.nth(i))).radius, `${path} module button ${i}`).toBe(house.radius);
    await page.close();
  });
}

for (const [path, width] of [['/contact', 1440], ['/contact', 390], ['/contact-en', 1440]]) {
  test(`mobile navigation — contact submit follows the house button ${path} ${width}`, async ({ browser }) => {
    const page = await open(browser, path, width);
    const house = await box(page.locator('.pp-btn').first());
    const submit = await box(page.locator('#ctSend'));
    expect(submit.radius, 'corner radius').toBe(house.radius);
    expect(submit.font, 'typeface').toBe(house.font);
    expect(submit.height, 'height').toBeGreaterThanOrEqual(56);
    const gap = await page.locator('#ctSend').evaluate(el => el.getBoundingClientRect().top - el.previousElementSibling.getBoundingClientRect().bottom);
    expect(gap, 'space above the button').toBeGreaterThanOrEqual(12);
    await page.close();
  });
}

for (const [path, width] of [['/', 1440], ['/', 390], ['/index-en', 1440]]) {
  test(`mobile navigation — home hero buttons share one height ${path} ${width}`, async ({ browser }) => {
    const page = await open(browser, path, width);
    const primary = await box(page.locator('.et-hero .et-primary').first());
    const secondary = await box(page.locator('.et-hero .et-secondary').first());
    expect(primary.height, 'primary and secondary heights').toBe(secondary.height);
    await page.close();
  });
}
