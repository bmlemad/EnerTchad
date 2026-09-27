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

test('EN pole landing pages', async ({ browser }) => {
  const paths = ['/pole-amont-en', '/pole-aval-en', '/pole-enerchimie-en', '/pole-enerconseils-en', '/pole-greentech-en', '/pole-intermediaire-en', '/pole-tchaditech-en', '/pole-tchaditude-en'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);
    await expect(page.locator('html').first(), path).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1').first(), path).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow, path).toBeFalsy();
    await page.close();
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
