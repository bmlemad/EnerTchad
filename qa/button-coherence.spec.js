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

// Audit « boutons face aux majors » du 22 novembre 2026 : une géométrie (angles vifs, 56 px), un or (#E3BC62), une encre
// (#0A1A2F), des libellés canoniques. Pages relevées avant correction avec des arrondis de 8 ou 10 px, des hauteurs de 44 à
// 52 px, un second or, un bleu, des pilules de 40 px ; ces tests échouent sur l'export précédent.
const ACTIONS = 'main :is(.pp-btn,.mod-button,.mod-preview,.isv-cta,.btn,.fl-cta,.et-primary,.et-secondary,.ec-primary,#ctSend,#sfForm button[type=submit])';
for (const path of ['/', '/greentech/', '/intermediaire/collecte', '/publications', '/achats', '/contact', '/amont/', '/atlas/cadre-sectoriel', '/carnets', '/aval/reseau', '/boutique/clients', '/pole-aval-en']) {
  test(`mobile navigation — action buttons share one geometry and one gold ${path}`, async ({ browser }) => {
    const page = await open(browser, path);
    // Les boutons apparaissent avec une transition : on parcourt la page puis on laisse les couleurs se poser.
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
    await page.waitForTimeout(1200);
    const found = await page.locator(ACTIONS).evaluateAll(els => els.filter(e => e.getBoundingClientRect().width).map(e => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return { text: e.textContent.trim().slice(0, 40), radius: s.borderTopLeftRadius, height: Math.round(r.height), bg: s.backgroundColor };
    }));
    expect(found.length, path + ' has action buttons').toBeGreaterThan(0);
    for (const b of found) {
      expect(b.radius, `${path} «${b.text}» radius`).toBe('0px');
      expect(b.height, `${path} «${b.text}» height`).toBeGreaterThanOrEqual(56);
      expect(['rgb(217, 181, 103)', 'rgb(21, 95, 168)', 'rgb(201, 162, 39)', 'rgb(23, 38, 56)'], `${path} «${b.text}» colour`).not.toContain(b.bg);
      expect(b.text, `${path} «${b.text}» arrow`).not.toMatch(/[→]$/);
    }
    await page.close();
  });
}

for (const path of ['/contact', '/contact-en']) {
  test(`mobile navigation — contact channel pills are at least 44 px ${path}`, async ({ browser }) => {
    const page = await open(browser, path, 390);
    const heights = await page.locator('main a').evaluateAll(els => els.filter(e => /^(E-mail|WhatsApp)$/.test(e.textContent.trim()) && e.getBoundingClientRect().width).map(e => Math.round(e.getBoundingClientRect().height)));
    expect(heights.length).toBeGreaterThan(0);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
    await page.close();
  });
}

test('CTA vocabulary — core actions use one wording for contact and project discussion', async ({ browser }) => {
  const page = await browser.newPage();
  const old = /^(Nous écrire|Écrire à EnerTchad|Contacter EnerTchad|Write to us|Write to EnerTchad|Contact EnerTchad|Discuter de cette étude|Discuter de ce service|Discuter ce périmètre avec nous|Discuter ce chantier|Parler de votre projet|Discuss this study|Discuss this service|Discuss this scope with us)\b/;
  for (const path of ['/charte', '/amont/', '/aval/', '/intermediaire/collecte', '/presse', '/pole-amont-en', '/intermediaire/services-en']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 45000 });
    const labels = await page.locator(ACTIONS).allTextContents();
    for (const l of labels) expect(l.trim(), path).not.toMatch(old);
  }
  await page.close();
});
