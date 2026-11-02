const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.com/';
const paths = [
  '/', '/index-en',
  '/societe', '/societe-en',
  '/gouvernance', '/gouvernance-en',
  '/investisseurs', '/investisseurs-en',
  '/publications', '/publications-en',
  '/projets', '/projets-en',
  '/nos-activites', '/nos-activites-en',
  '/engagements', '/engagements-en',
  '/cibles-2030', '/cibles-2030-en',
  '/solutions', '/solutions-en',
  '/aval/reseau', '/aval/reseau-en',
  '/amont/', '/intermediaire/', '/aval/', '/greentech/',
  '/tchaditude/', '/enerconseils/',
  '/pole-amont-en', '/pole-intermediaire-en', '/pole-aval-en', '/pole-greentech-en',
  '/pole-tchaditech-en', '/pole-enerchimie-en', '/pole-tchaditude-en', '/pole-enerconseils-en'
];

// Lot 104 (2 nov. 2026) : depuis le lot 26 les ressources de /assets/chrome portent ?v=<12 hex du SHA-256 du contenu>
// (scripts/next/fingerprint.mjs), plus de ?b=AAAAMMJJ. Le contrat vérifie qu'une seule version de nav_a.js et de
// premium-chrome.css est servie sur toutes les pages critiques, et qu'elle est bien l'empreinte du fichier publié.
test('shared premium assets — critical pages use one current cache-buster', async ({ page, request }) => {
  const seen = { nav: new Set(), premium: new Set() };
  for (const path of paths) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const refs = await page.evaluate(() => ({
      nav: [...document.scripts].map(s => s.getAttribute('src') || '').find(src => src.includes('/assets/chrome/nav_a.js')) || '',
      premium: [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href') || '').find(href => href.includes('/assets/chrome/premium-chrome.css')) || ''
    }));

    const navVersion = (refs.nav.match(/[?&]v=([0-9a-f]{12})/) || [])[1] || '';
    const premiumVersion = (refs.premium.match(/[?&]v=([0-9a-f]{12})/) || [])[1] || '';
    expect(navVersion, path + ' nav_a.js cache-buster').toMatch(/^[0-9a-f]{12}$/);
    expect(premiumVersion, path + ' premium-chrome.css cache-buster').toMatch(/^[0-9a-f]{12}$/);
    seen.nav.add(navVersion);
    seen.premium.add(premiumVersion);
  }
  expect([...seen.nav], 'une seule version de nav_a.js').toHaveLength(1);
  expect([...seen.premium], 'une seule version de premium-chrome.css').toHaveLength(1);
  for (const [name, versions] of [['nav_a.js', seen.nav], ['premium-chrome.css', seen.premium]]) {
    const response = await request.get(new URL('/assets/chrome/' + name + '?v=' + [...versions][0], base).href, { timeout: 30000 });
    expect(response.status(), name).toBe(200);
    const digest = require('node:crypto').createHash('sha256').update(await response.body()).digest('hex').slice(0, 12);
    expect(digest, name + ' : la version servie est l’empreinte du contenu publié').toBe([...versions][0]);
  }
});
