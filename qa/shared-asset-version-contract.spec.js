const { test, expect } = require('@playwright/test');

const base = process.env.SITE_URL || 'https://enertchad.netlify.app/';
const minimum = 202610041145;
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

test('shared premium assets — critical pages use one current cache-buster', async ({ page }) => {
  for (const path of paths) {
    await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const refs = await page.evaluate(() => ({
      nav: [...document.scripts].map(s => s.getAttribute('src') || '').find(src => src.includes('/assets/chrome/nav_a.js')) || '',
      premium: [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href') || '').find(href => href.includes('/assets/chrome/premium-chrome.css')) || ''
    }));

    const navVersion = Number((refs.nav.match(/[?&]b=(\d+)/) || [])[1] || 0);
    const premiumVersion = Number((refs.premium.match(/[?&]b=(\d+)/) || [])[1] || 0);
    expect(navVersion, path + ' nav_a.js cache-buster').toBeGreaterThanOrEqual(minimum);
    expect(premiumVersion, path + ' premium-chrome.css cache-buster').toBeGreaterThanOrEqual(minimum);
  }
});
