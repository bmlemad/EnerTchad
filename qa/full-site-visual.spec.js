const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const base = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';
const origin = new URL(base).origin;

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => m[1].trim())
    .filter(Boolean)
    .filter(u => new URL(u).origin === origin)
    .filter(u => !/\.(pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|webp|svg)$/i.test(u))
    .map(u => new URL(u).href);
}

async function auditViewport(page, url, label) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('console: ' + msg.text());
  });
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));

  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(350);
  const status = response ? response.status() : 0;

  const visual = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const overflow = document.documentElement.scrollWidth > vw + 2;
    const selectors = 'img,video,iframe,button,a,input,select,textarea,[role="button"]';
    const clipped = [];
    document.querySelectorAll(selectors).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.right < -2 || r.left > vw + 2 || r.bottom < -2) {
        clipped.push({
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('alt') || '').trim().slice(0, 100),
          left: Math.round(r.left), right: Math.round(r.right),
          top: Math.round(r.top), bottom: Math.round(r.bottom)
        });
      }
    });
    const h1 = document.querySelectorAll('h1').length;
    const nav = !!document.querySelector('nav');
    const skip = !!document.querySelector('a.et-skip');
    const main = !!document.querySelector('main, #main-content, #root');
    const badFixed = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      if (s.position === 'fixed' && el.getBoundingClientRect().width > vw + 4) {
        badFixed.push(el.tagName.toLowerCase());
      }
    });
    return { vw, vh, overflow, clipped: clipped.slice(0, 12), h1, nav, skip, main, badFixed };
  });

  const findings = [];
  if (status >= 400 || !status) findings.push('HTTP ' + status);
  if (visual.overflow) findings.push('horizontal-overflow');
  if (visual.clipped.length) findings.push('offscreen-elements:' + visual.clipped.length);
  if (!visual.h1) findings.push('missing-h1');
  if (!visual.nav) findings.push('missing-nav');
  if (!visual.skip) findings.push('missing-skip-link');
  if (!visual.main) findings.push('missing-main-target');
  if (visual.badFixed.length) findings.push('oversized-fixed-element');
  if (errors.length) findings.push('console-errors:' + errors.length);

  return { url, label, status, visual, errors: errors.slice(0, 10), findings };
}

test('full-site visual navigation audit — sitemap desktop + mobile', async ({ browser, request }) => {
  test.setTimeout(14 * 60 * 1000);
  const sitemapResponse = await request.get(new URL('/sitemap.xml', base).href, { timeout: 30000 });
  expect(sitemapResponse.status()).toBe(200);
  const urls = sitemapUrls(await sitemapResponse.text());
  expect(urls.length).toBeGreaterThan(100);

  fs.mkdirSync('artifacts/visual-audit/screenshots', { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    site: origin,
    pages: urls.length,
    viewports: [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }],
    results: []
  };

  for (const viewport of report.viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    for (const url of urls) {
      const page = await context.newPage();
      const result = await auditViewport(page, url, viewport.name);
      report.results.push(result);

      if (result.findings.length) {
        const safe = new URL(url).pathname.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 90) || 'home';
        await page.screenshot({
          path: path.join('artifacts/visual-audit/screenshots', safe + '--' + viewport.name + '.png'),
          fullPage: false
        });
      }
      await page.close();
    }
    await context.close();
  }

  const findings = report.results.filter(r => r.findings.length);
  fs.writeFileSync('artifacts/visual-audit/report.json', JSON.stringify(report, null, 2));
  const md = [
    '# Audit visuel complet — EnerTchad',
    '',
    '- Généré : ' + report.generatedAt,
    '- URLs sitemap analysées : ' + report.pages,
    '- Vues : desktop 1440×900 + mobile 390×844',
    '- Contrôles : HTTP, H1, navigation, skip-link, cible principale, débordement horizontal, éléments hors écran, éléments fixed surdimensionnés, erreurs console.',
    '',
    '## Résultat',
    '- Contrôles de page : ' + report.results.length,
    '- Pages avec anomalies : ' + findings.length,
    '',
    '## Anomalies',
    ...(findings.length ? findings.map(r => '- **' + r.label + '** ' + r.url + ' — ' + r.findings.join(', ')) : ['- Aucune anomalie détectée par les règles visuelles automatisées.']),
    ''
  ].join('\n');
  fs.writeFileSync('artifacts/visual-audit/report.md', md);

  expect(findings, 'Anomalies visuelles détectées — voir artifacts/visual-audit/report.md et les captures associées').toEqual([]);
});
