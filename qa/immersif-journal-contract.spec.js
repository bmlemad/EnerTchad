const { test, expect } = require('@playwright/test');

// Lot 138 (phase C, articles du journal) : chaque article du journal, en français et en anglais, porte une et une seule scène immersive :
// un passage de l'article posé dans la carte de verre sur une illustration. Contrat à 390 px et 1440 px, thèmes clair et sombre :
// une scène visible de plus de 200 px, texte clair, aucun débordement horizontal, même passage en FR et en EN, page Carnets inchangée.
// Dix articles représentatifs (courts, longs, avec tableau, entretiens, sans planche) ; les 66 pages sont couvertes par scripts/test_immersif_journal.mjs.

const base = process.env.SITE_URL || 'https://enertchad.com/';

async function report(page, path, width, light) {
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response && response.status(), path).toBe(200);
  return page.evaluate(async light => {
    document.documentElement.classList.toggle('et-jlight', light);
    const scene = document.querySelector('.im-journal');
    if (scene) { scene.scrollIntoView({ block: 'center', behavior: 'instant' }); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
    const heading = document.getElementById('im-journal-h');
    const headings = [...document.querySelectorAll('article h2')];
    return {
      scenes: document.querySelectorAll('.im-scene').length,
      height: scene ? Math.round(scene.getBoundingClientRect().height) : 0,
      color: scene ? getComputedStyle(scene.querySelector('p')).color : '',
      headingColor: heading ? getComputedStyle(heading).color : '',
      index: heading ? headings.indexOf(heading) : -1,
      words: scene ? scene.querySelector('.jbody').innerText.split(/\s+/).filter(Boolean).length : 0,
      bg: scene ? (scene.querySelector('.im-bg').getAttribute('src').match(/\/p\/([a-z-]+)-1400/) || [])[1] : '',
      labelled: scene ? scene.getAttribute('aria-labelledby') : '',
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  }, light);
}

const pages = [
  'journal-gaz-torche', 'journal-forage-directionnel', 'journal-gouvernance-avant-actifs', 'journal-enigme-densite-brut',
  'journal-interview-comptage', 'journal-mini-raffinerie-modulaire', 'journal-brut-par-camion', 'journal-mobile-stations',
  'journal-prix-uree', 'journal-atlas-secteur',
];

for (const slug of pages) {
  test(`${slug} has one immersive scene, FR and EN, at 390 and 1440`, async ({ browser }) => {
    const page = await browser.newPage();
    const seen = {};
    for (const [path, lang] of [[`/${slug}`, 'fr'], [`/${slug}-en`, 'en']]) {
      for (const width of [390, 1440]) {
        for (const light of [true, false]) {
          const r = await report(page, path, width, light);
          const label = `${path} ${width}px ${light ? 'light' : 'dark'}`;
          expect(r.scenes, label).toBe(1);
          expect(r.height, label).toBeGreaterThan(200);
          expect(r.color, label).toBe('rgb(241, 243, 246)');
          expect(r.headingColor, label).toBe('rgb(241, 243, 246)');
          expect(r.words, label).toBeGreaterThanOrEqual(40);
          expect(r.labelled, label).toBe('im-journal-h');
          expect(r.overflow, label).toBe(false);
          seen[`${lang}`] = [r.index, r.bg];
        }
      }
    }
    expect(seen.fr, 'same passage and background in FR and EN').toEqual(seen.en);
    await page.close();
  });
}

test('the carnets index and the pole pages carry no journal scene', async ({ page }) => {
  for (const path of ['/carnets', '/carnets-en', '/amont/', '/contact']) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(await page.locator('.im-journal').count(), path).toBe(0);
  }
});
