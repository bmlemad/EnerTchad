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

// Décision du DG (20 novembre 2026) : le bouton « retour en haut » est masqué là où la barre du bas est affichée (≤ 768 px),
// où il recouvrait du contenu ; il reste disponible au-delà.
for (const path of ['/', '/gouvernance', '/aval/', '/index-en']) {
  test(`mobile navigation — back-to-top button is hidden with the bottom bar ${path}`, async ({ browser }) => {
    for (const [width, hidden] of [[390, true], [768, true], [769, false], [1440, false]]) {
      const page = await at(browser, path, width);
      await page.evaluate(() => { document.querySelector('#et-consent')?.remove(); scrollTo(0, document.documentElement.scrollHeight * 0.6); });
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => ({
        top: getComputedStyle(document.querySelector('#toTop')).display,
        bar: getComputedStyle(document.querySelector('#nezBar')).display
      }));
      if (hidden) {
        expect(state.bar, `${path} ${width} bottom bar shown`).not.toBe('none');
        expect(state.top, `${path} ${width} button hidden`).toBe('none');
      } else {
        expect(state.top, `${path} ${width} button available`).not.toBe('none');
        await expect(page.locator('#toTop'), `${path} ${width} button visible after scrolling`).toBeVisible();
      }
      await page.close();
    }
  });
}

// Audit design du 20 novembre 2026 : hors étiquettes en capitales, aucun texte de ces pages ne se lit sous 12 px.
for (const path of ['/nos-activites', '/nos-activites-en']) {
  test(`mobile navigation — reading text is at least 12 px ${path}`, async ({ browser }) => {
    for (const width of [390, 1440]) {
      const page = await at(browser, path, width);
      const small = await page.evaluate(() => {
        const found = [], seen = new Set(), walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        for (let node; (node = walker.nextNode());) {
          const el = node.parentElement, text = node.nodeValue.trim();
          if (text.length < 2 || seen.has(el) || el.closest('svg,[aria-hidden="true"]')) continue;
          seen.add(el);
          const style = getComputedStyle(el), box = el.getBoundingClientRect();
          if (!box.width || !box.height || style.visibility === 'hidden' || style.textTransform === 'uppercase') continue;
          if (parseFloat(style.fontSize) < 12) found.push(`${style.fontSize} ${text.slice(0, 30)}`);
        }
        return found;
      });
      expect(small, `${path} ${width}`).toEqual([]);
      await page.close();
    }
  });
}

// 21 novembre 2026 : l'accueil anglais ne chargeait pas modern-home-2026.js ; ses six sections, masquées jusqu'à leur apparition
// à l'écran ([data-et-reveal], opacité 0), restaient invisibles. Sans JavaScript, les deux accueils restaient vides sous le héros.
for (const path of ['/', '/index-en']) {
  for (const js of [true, false]) {
    test(`mobile navigation — home sections become visible ${path} ${js ? 'with' : 'without'} JavaScript`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: js });
      const page = await context.newPage();
      await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
      const sections = page.locator('main > section[data-et-reveal]');
      expect(await sections.count(), path + ' revealed sections').toBeGreaterThanOrEqual(5);
      for (let i = 0; i < await sections.count(); i++) {
        await sections.nth(i).scrollIntoViewIfNeeded();
        await expect.poll(() => sections.nth(i).evaluate(s => Number(getComputedStyle(s).opacity)), { message: `${path} section ${i}`, timeout: 4000 }).toBeGreaterThan(0.95);
      }
      await context.close();
    });
  }
}
