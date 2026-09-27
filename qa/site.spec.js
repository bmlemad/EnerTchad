const { test, expect } = require('@playwright/test');

const url = process.env.SITE_URL || 'https://enertchad-delta.vercel.app/';

test('homepage desktop', async ({ page }) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await expect(page).toHaveTitle(/EnerTchad/i);
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('nav').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBeFalsy();
});

test('homepage mobile', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await expect(page.locator('h1').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow).toBeFalsy();
  await page.screenshot({ path: 'artifacts/home-mobile.png', fullPage: true });
});

test('homepage keyboard accessibility', async ({ page }) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.keyboard.press('Tab');
  await expect(page.locator('a.et-skip').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content').first()).toBeFocused();
});

test('representative inner pages — desktop and mobile', async ({ browser }) => {
  const paths = ['/amont/', '/intermediaire/', '/aval/', '/greentech/', '/societe.html', '/investisseurs.html', '/clients.html', '/carrieres.html', '/contact.html', '/faq.html'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);
    await expect(page.locator('h1').first(), path).toBeVisible();
    await expect(page.locator('a.et-skip').first(), path).toHaveAttribute('href', '#main-content');
    await expect(page.locator('nav').first(), path).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, path).toBeFalsy();
    expect(errors, path).toEqual([]);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const mobileErrors = [];
    mobile.on('console', msg => { if (msg.type() === 'error') mobileErrors.push('console: ' + msg.text()); });
    mobile.on('pageerror', err => mobileErrors.push('pageerror: ' + err.message));
    const mobileResponse = await mobile.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(mobileResponse, path + ' mobile').not.toBeNull();
    expect(mobileResponse.status(), path + ' mobile').toBeLessThan(400);
    await expect(mobile.locator('h1').first(), path + ' mobile').toBeVisible();
    await expect(mobile.locator('a.et-skip').first(), path + ' mobile').toHaveAttribute('href', '#main-content');
    await expect(mobile.locator('nav').first(), path + ' mobile').toBeVisible();
    const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(mobileOverflow, path + ' mobile').toBeFalsy();
    expect(mobileErrors, path + ' mobile').toEqual([]);
    await mobile.close();
  }
});

test('configurateur — desktop et mobile', async ({ browser }) => {
  const path = '/Configurateur_Service_Integre_v2.html';
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);
    await expect(page.locator('h1').first(), path).toBeVisible();
    await expect(page.locator('a.et-skip').first(), path).toHaveAttribute('href', '#root');
    await expect(page.locator('#root').first(), path).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, path).toBeFalsy();
    expect(errors, path).toEqual([]);
    await page.close();
  }
});

test('legacy redirects — canonical routes', async ({ request }) => {
  const cases = [
    ['/pole-amont-en', '/amont/'],
    ['/pole-aval-en.html', '/aval/'],
    ['/pole-greentech', '/greentech/'],
    ['/pole-tchaditech-en', '/tchaditech/'],
    ['/pole-tchaditude-en.html', '/tchaditude/'],
    ['/pole-enerconseils-en', '/enerconseils/'],
    ['/pole-enerchimie', '/petrochimie/']
  ];
  for (const [from, to] of cases) {
    const response = await request.get(new URL(from, url).href, { maxRedirects: 5 });
    expect(response.status(), from).toBe(200);
    expect(new URL(response.url()).pathname, from).toBe(to);
  }
});

test('language entry points — FR EN AR', async ({ browser }) => {
  const cases = [['/', 'fr'], ['/index-en', 'en'], ['/ar', 'ar'], ['/ar-poles', 'ar']];
  for (const [path, lang] of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);
    await expect(page.locator('html').first(), path).toHaveAttribute('lang', lang);
    await expect(page.locator('h1').first(), path).toBeVisible();
    await page.close();
  }
});

test('legacy EN pole aliases — canonical routes', async ({ request }) => {
  const cases = [
    ['/pole-amont-en', '/amont/'],
    ['/pole-aval-en', '/aval/'],
    ['/pole-enerchimie-en', '/petrochimie/'],
    ['/pole-enerconseils-en', '/enerconseils/'],
    ['/pole-greentech-en', '/greentech/'],
    ['/pole-intermediaire-en', '/intermediaire/'],
    ['/pole-tchaditech-en', '/tchaditech/'],
    ['/pole-tchaditude-en', '/tchaditude/']
  ];
  for (const [from, to] of cases) {
    const response = await request.get(new URL(from, url).href, { maxRedirects: 5 });
    expect(response.status(), from).toBe(200);
    expect(new URL(response.url()).pathname, from).toBe(to);
  }
});

test('production security headers', async ({ request }) => {
  const response = await request.get(url, { maxRedirects: 5 });
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['strict-transport-security']).toMatch(/max-age=(?:31536000|63072000)/);
});


test('SEO infrastructure — robots, sitemap et hreflang', async ({ request }) => {
  const robots = await request.get(new URL('/robots.txt', url).href);
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Sitemap:\s*https:\/\/enertchad-delta\.vercel\.app\/sitemap\.xml/i);

  const sitemap = await request.get(new URL('/sitemap.xml', url).href);
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(urls.length).toBeGreaterThan(100);
  expect(new Set(urls).size).toBe(urls.length);

  for (const path of ['/', '/index-en', '/ar']) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const canonical = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i);
    expect(canonical, path).not.toBeNull();
    const expected = new URL(path, url).href.replace(/\/$/, '') || new URL(url).origin;
    expect(canonical[1].replace(/\/$/, ''), path).toBe(expected);
    const hreflangs = [...html.matchAll(/<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi)];
    expect(hreflangs.map(m => m[1]), path).toEqual(expect.arrayContaining(['fr', 'en', 'ar', 'x-default']));
  }
});


test('hubs — parcours métiers et institutionnels', async ({ browser }) => {
  const hubs = [
    ['/amont/', 'fr'], ['/intermediaire/', 'fr'], ['/aval/', 'fr'],
    ['/petrochimie/', 'fr'], ['/greentech/', 'fr'], ['/tchaditech/', 'fr'],
    ['/tchaditude/', 'fr'], ['/enerconseils/', 'fr'],
    ['/societe', 'fr'], ['/investisseurs', 'fr'], ['/clients', 'fr'],
    ['/achats', 'fr'], ['/carrieres', 'fr'], ['/projets', 'fr'], ['/publications', 'fr'],
    ['/amont/activites-en', 'en'], ['/intermediaire/services-en', 'en'],
    ['/aval/distribution-en', 'en'], ['/petrochimie/produits-en', 'en'],
    ['/tchaditech/outils-en', 'en'], ['/enerconseils/atlas-en', 'en']
  ];

  for (const [path, lang] of hubs) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));

    const response = await page.goto(new URL(path, url).href, {
      waitUntil: 'networkidle',
      timeout: 45000
    });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);
    await expect(page.locator('html').first(), path).toHaveAttribute('lang', lang);
    await expect(page.locator('h1').first(), path).toBeVisible();
    await expect(page.locator('nav').first(), path).toBeVisible();
    await expect(page.locator('a.et-skip').first(), path).toHaveAttribute('href', '#main-content');

    const state = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const links = [...document.querySelectorAll('main a[href]')]
        .map(a => ({ href: a.href, text: (a.innerText || a.getAttribute('aria-label') || '').trim() }))
        .filter(x => String(x.href).startsWith(location.origin + '/'))
        .filter(x => !x.href.includes('#'));
      const overflow = document.documentElement.scrollWidth > vw + 1;
      const visibleNav = !!document.querySelector('nav') &&
        getComputedStyle(document.querySelector('nav')).display !== 'none';
      return {
        overflow,
        visibleNav,
        internalLinks: [...new Set(links.map(x => x.href))].slice(0, 80),
        linkCount: links.length
      };
    });

    expect(state.overflow, path).toBeFalsy();
    expect(state.visibleNav, path).toBeTruthy();
    expect(state.linkCount, path).toBeGreaterThan(0);
    expect(errors, path).toEqual([]);
    await page.close();
  }
});

test('hubs — liens internes accessibles et sans 4xx/5xx', async ({ request }) => {
  const hubs = [
    '/amont/', '/intermediaire/', '/aval/', '/petrochimie/',
    '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/',
    '/societe', '/investisseurs', '/clients', '/achats', '/carrieres',
    '/projets', '/publications'
  ];

  for (const path of hubs) {
    const response = await request.get(new URL(path, url).href, { maxRedirects: 5 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const hrefs = [...html.matchAll(/<a\s[^>]*href=["']([^"'#]+)["']/gi)]
      .map(m => m[1])
      .filter(href => href.startsWith('/') && !href.startsWith('//'));

    const unique = [...new Set(hrefs)];
    const targets = unique.slice(0, 60);
    for (let i = 0; i < targets.length; i += 8) {
      const batch = targets.slice(i, i + 8);
      const responses = await Promise.all(
        batch.map(href => request.get(new URL(href, url).href, { maxRedirects: 5 }))
      );
      responses.forEach((target, index) => {
        expect(target.status(), path + ' -> ' + batch[index]).toBeLessThan(400);
      });
    }
  }
});


test('trust center — FR / EN / AR', async ({ browser }) => {
  const cases = [
    ['/', 'fr'],
    ['/index-en', 'en'],
    ['/ar', 'ar'],
  ];
  for (const [path, lang] of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push('console: ' + msg.text()); });
    page.on('pageerror', err => errors.push('pageerror: ' + err.message));
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBe(200);
    await expect(page.locator('html').first(), path).toHaveAttribute('lang', lang);
    await expect(page.locator('.et-proof-center').first(), path).toBeVisible();
    await expect(page.locator('.et-proof-card'), path).toHaveCount(5);
    await expect(page.locator('.et-proof-card').first(), path).toHaveAttribute('href', /.+/);
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      links: [...document.querySelectorAll('.et-proof-card')].map(a => a.getAttribute('href')),
    }));
    expect(state.overflow, path).toBeFalsy();
    expect(state.links.every(Boolean), path).toBeTruthy();
    expect(errors, path).toEqual([]);
    await page.close();
  }
});
