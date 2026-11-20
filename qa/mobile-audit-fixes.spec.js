const { test, expect } = require('@playwright/test');

// Audit design du 20 novembre 2026 : quatre défauts visibles sur mobile, corrigés par lib/mobile-fixes.js,
// lib/latest-release.js et assets/chrome/audience-consent.js. Chaque test échoue sur l'export précédent.

const base = process.env.SITE_URL || 'https://enertchad.com/';
const at = async (browser, path, width = 390) => {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
  return page;
};

for (const path of ['/gouvernance', '/aval/', '/savoirs', '/pole-aval-en']) {
  test(`mobile navigation — footer tagline is shown whole ${path}`, async ({ browser }) => {
    const page = await at(browser, path);
    const tag = await page.locator('footer .brand-tx.et-tag').first().evaluate(el => {
      const r = el.getBoundingClientRect();
      return { width: r.width, content: el.scrollWidth, right: r.right, viewport: document.documentElement.clientWidth };
    });
    expect(tag.width, path + ' tagline is not clipped').toBeGreaterThanOrEqual(tag.content - 1);
    expect(tag.right, path + ' tagline stays inside the viewport').toBeLessThanOrEqual(tag.viewport);
    await page.close();
  });
}

for (const path of ['/gouvernance', '/gouvernance-en', '/leadership', '/engagements']) {
  test(`mobile navigation — immersive band image fills its band ${path}`, async ({ browser }) => {
    const page = await at(browser, path);
    const bands = page.locator('.vi-band');
    const count = await bands.count();
    expect(count, path + ' has immersive bands').toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await bands.nth(i).scrollIntoViewIfNeeded();
      // Les sections sous content-visibility:auto ne sont mises en page qu'une fois à l'écran : on attend la mesure stable.
      const measure = () => bands.nth(i).evaluate(band => {
        const image = band.querySelector('.vi-band-img');
        const b = band.getBoundingClientRect(), r = image.getBoundingClientRect();
        return { gap: Math.abs(r.top - b.top), short: Math.max(0, b.height - r.height) };
      });
      await expect.poll(async () => (await measure()).gap, { message: `${path} band ${i} image starts with the band`, timeout: 5000 }).toBeLessThanOrEqual(1);
      await expect.poll(async () => (await measure()).short, { message: `${path} band ${i} image covers the band`, timeout: 5000 }).toBeLessThanOrEqual(1);
    }
    await page.close();
  });
}

for (const [path, width] of [['/', 390], ['/', 768], ['/', 1440], ['/index-en', 390]]) {
  test(`mobile navigation — latest release line shares the page gutter ${path} ${width}`, async ({ browser }) => {
    const page = await at(browser, path, width);
    const edges = await page.evaluate(() => {
      const line = document.querySelector('.et-cp .et-inner').getBoundingClientRect();
      const band = document.querySelector('.hm-band .et-inner').getBoundingClientRect();
      return { line: [line.left, line.right], band: [band.left, band.right] };
    });
    expect(edges.line[0], 'left gutter').toBeGreaterThanOrEqual(16);
    expect(Math.abs(edges.line[0] - edges.band[0]), 'left edge aligned with the sections').toBeLessThanOrEqual(1);
    expect(Math.abs(edges.line[1] - edges.band[1]), 'right edge aligned with the sections').toBeLessThanOrEqual(1);
    await page.close();
  });
}

test('mobile navigation — consent banner link is at least 24 px tall', async ({ browser }) => {
  const page = await at(browser, '/');
  const link = page.locator('#et-consent a').first();
  await expect(link).toBeVisible();
  expect((await link.boundingBox()).height).toBeGreaterThanOrEqual(24);
  await page.close();
});
