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
  await expect(page.locator('a.et-skip, a.skip-link').first()).toBeFocused();
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
    await expect(page.locator('a.et-skip, a.skip-link').first(), path).toHaveAttribute('href', /#main-content|#contenu|#content/);
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
    await expect(mobile.locator('a.et-skip, a.skip-link').first(), path + ' mobile').toHaveAttribute('href', /#main-content|#contenu|#content/);
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

test('language switch — equivalent FR/EN route', async ({ browser }) => {
  const cases = [
    ['/index-en', '/'],
    ['/contact-en', '/contact'],
    ['/clients-en', '/clients'],
    ['/investisseurs-en', '/investisseurs']
  ];
  for (const [enPath, frPath] of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(enPath, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response, enPath).not.toBeNull();
    expect(response.status(), enPath).toBeLessThan(400);
    const langLink = page.locator('a.nx-lang').first();
    await expect(langLink, enPath).toHaveAttribute('href', frPath);
    await page.close();
  }
});

test('language entry points — FR EN AR', async ({ browser }) => {
  const cases = [['/', 'fr'], ['/index-en', 'en'], ['/ar', 'ar'], ['/ar-poles', 'ar'], ['/ar-amont', 'ar'], ['/ar-aval', 'ar'], ['/ar-intermediaire', 'ar'], ['/ar-contact', 'ar'], ['/ar-investisseurs', 'ar'], ['/ar-societe', 'ar']];
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
  expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  expect(headers['x-permitted-cross-domain-policies']).toBe('none');
});


test('SEO structured data — JSON-LD parses and page URLs stay coherent', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/contact-en', '/ar-contact', '/investisseurs', '/investisseurs-en', '/ar-investisseurs', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const blocks = [...html.matchAll(/<script\\b[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)].map(m => m[1].trim()).filter(Boolean);
    expect(blocks.length, path).toBeGreaterThan(0);
    for (const raw of blocks) {
      let data;
      expect(() => { data = JSON.parse(raw); }, path).not.toThrow();
      const items = Array.isArray(data) ? data : (Array.isArray(data['@graph']) ? data['@graph'] : [data]);
      for (const item of items) {
        expect(item['@context'], path).toBeTruthy();
        expect(item['@type'], path).toBeTruthy();
        if (item.url) expect(new URL(item.url).origin, path).toBe(new URL(url).origin);
      }
    }
  }
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

test('semantic accessibility and document metadata — representative locales', async ({ browser }) => {
  const cases = [['/', 'fr'], ['/index-en', 'en'], ['/ar', 'ar']];
  for (const [path, lang] of cases) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBe(200);

    const audit = await page.evaluate(() => {
      const main = document.querySelector('main');
      const nav = document.querySelector('nav');
      const title = document.title.trim();
      const description = document.querySelector('meta[name="description"]')?.content?.trim() || '';
      const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
      const unnamedButtons = [...document.querySelectorAll('button,[role="button"]')]
        .filter(el => {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true') return false;
          return !(el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').trim();
        })
        .map(el => el.outerHTML.slice(0, 220));
      const unnamedInputs = [...document.querySelectorAll('input,select,textarea')]
        .filter(el => {
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') return false;
          return !(el.getAttribute('aria-label') || el.getAttribute('title') || el.labels?.length);
        })
        .map(el => ({ tag: el.tagName.toLowerCase(), type: el.getAttribute('type') || '' }));
      const mains = document.querySelectorAll('main').length;
      const navs = document.querySelectorAll('nav').length;
      return {
        title,
        description,
        canonical,
        main: !!main,
        mainTabbable: main ? main.getAttribute('tabindex') : null,
        nav: !!nav,
        mains,
        navs,
        unnamedButtons,
        unnamedInputs
      };
    });

    expect(audit.title.length, path).toBeGreaterThan(10);
    expect(audit.description.length, path).toBeGreaterThan(50);
    expect(audit.canonical, path).toMatch(/^https:\/\/enertchad-delta\.vercel\.app\//);
    expect(audit.main, path).toBeTruthy();
    expect(audit.mainTabbable, path).toMatch(/^-?1$/);
    expect(audit.nav, path).toBeTruthy();
    expect(audit.mains, path).toBe(1);
    expect(audit.navs, path).toBeGreaterThanOrEqual(1);
    expect(audit.unnamedButtons, path).toEqual([]);
    expect(audit.unnamedInputs, path).toEqual([]);

    if (lang === 'ar') {
      await expect(page.locator('html').first(), path).toHaveAttribute('dir', 'rtl');
    }
    await page.close();
  }
});

test('forms, anchors and interactive controls — representative pages', async ({ browser }) => {
  const paths = ['/', '/contact', '/clients', '/investisseurs', '/faq', '/tchaditech/'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBeLessThan(400);

    const audit = await page.evaluate(() => {
      const visible = el => {
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true';
      };
      const controls = [...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')].filter(visible);
      const badAnchors = [...document.querySelectorAll('a[href^="#"]')].filter(a => {
        const id = a.getAttribute('href').slice(1);
        return id && !document.getElementById(id);
      }).map(a => a.getAttribute('href'));
      const unnamed = controls.filter(el => {
        if (el.matches('a[href]') && (el.innerText || '').trim()) return false;
        return !((el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || '').trim());
      }).map(el => el.outerHTML.slice(0,180));
      const invalidInputs = [...document.querySelectorAll('input,select,textarea')].filter(visible).filter(el => {
        const hasLabel = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title');
        return !hasLabel;
      }).map(el => ({tag:el.tagName.toLowerCase(),type:el.getAttribute('type')||''}));
      const buttonsWithoutType = [...document.querySelectorAll('button')].filter(visible).filter(b => !b.getAttribute('type')).length;
      return { badAnchors, unnamed, invalidInputs, buttonsWithoutType };
    });

    expect(audit.badAnchors, path).toEqual([]);
    expect(audit.unnamed, path).toEqual([]);
    expect(audit.invalidInputs, path).toEqual([]);
    expect(audit.buttonsWithoutType, path).toBe(0);
    await page.close();
  }
});


test('SEO sitemap — no false FR/EN equivalence', async ({ request }) => {
  const response = await request.get(new URL('/sitemap.xml', url).href);
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const blocks = [...xml.matchAll(/<url>([\\s\\S]*?)<\\/url>/g)].map(m => m[1]);
  for (const block of blocks) {
    const fr = (block.match(/hreflang="fr" href="([^"]+)"/) || [])[1] || '';
    const en = (block.match(/hreflang="en" href="([^"]+)"/) || [])[1] || '';
    if (fr && en) expect(en).not.toBe(fr);
  }
});


test('command search dialog — open, focus, Escape', async ({ page }) => {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  const trigger = page.locator('#navSearch').first();
  await expect(trigger).toHaveAttribute('aria-label', /Rechercher/i);
  await trigger.click();
  const dialog = page.locator('#cmdk').first();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  const input = page.locator('#cmdk-input').first();
  await expect(input).toBeVisible();
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});


test('redirects — no redirect chains', async () => {
  const config = [{"source":"/reporting","destination":"/publications","permanent":true},{"source":"/reporting-en","destination":"/publications-en","permanent":true},{"source":"/activites-en","destination":"/amont/activites-en","permanent":true},{"source":"/activites-en.html","destination":"/amont/activites-en","permanent":true},{"source":"/eor-en","destination":"/amont/eor-en","permanent":true},{"source":"/eor-en.html","destination":"/amont/eor-en","permanent":true},{"source":"/parc-en","destination":"/amont/parc-en","permanent":true},{"source":"/parc-en.html","destination":"/amont/parc-en","permanent":true},{"source":"/services-ep-en","destination":"/amont/services-ep-en","permanent":true},{"source":"/services-ep-en.html","destination":"/amont/services-ep-en","permanent":true},{"source":"/distribution-en","destination":"/aval/distribution-en","permanent":true},{"source":"/distribution-en.html","destination":"/aval/distribution-en","permanent":true},{"source":"/produits-en","destination":"/aval/produits-en","permanent":true},{"source":"/produits-en.html","destination":"/aval/produits-en","permanent":true},{"source":"/raffinage-en","destination":"/aval/raffinage-en","permanent":true},{"source":"/raffinage-en.html","destination":"/aval/raffinage-en","permanent":true},{"source":"/reseau-en","destination":"/aval/reseau-en","permanent":true},{"source":"/reseau-en.html","destination":"/aval/reseau-en","permanent":true},{"source":"/hseq-en","destination":"/greentech/#hseq","permanent":true},{"source":"/hseq-en.html","destination":"/greentech/#hseq","permanent":true},{"source":"/impact-en","destination":"/greentech/#impact","permanent":true},{"source":"/impact-en.html","destination":"/greentech/#impact","permanent":true},{"source":"/patrimoine-en","destination":"/greentech/#patrimoine","permanent":true},{"source":"/patrimoine-en.html","destination":"/greentech/#patrimoine","permanent":true},{"source":"/transition-en","destination":"/greentech/#transition","permanent":true},{"source":"/transition-en.html","destination":"/greentech/#transition","permanent":true},{"source":"/Configurateur_Service_Integre","destination":"/configurateur-service-integre","permanent":true},{"source":"/pole-amont","destination":"/amont/","permanent":true},{"source":"/pole-amont.html","destination":"/amont/","permanent":true},{"source":"/pole-amont-activites","destination":"/amont/activites","permanent":true},{"source":"/pole-amont-activites.html","destination":"/amont/activites","permanent":true},{"source":"/pole-amont-eor","destination":"/amont/eor","permanent":true},{"source":"/pole-amont-eor.html","destination":"/amont/eor","permanent":true},{"source":"/pole-amont-services-ep","destination":"/amont/services-ep","permanent":true},{"source":"/pole-amont-services-ep.html","destination":"/amont/services-ep","permanent":true},{"source":"/pole-intermediaire","destination":"/intermediaire/","permanent":true},{"source":"/pole-intermediaire.html","destination":"/intermediaire/","permanent":true},{"source":"/pole-intermediaire-logistique","destination":"/intermediaire/logistique","permanent":true},{"source":"/pole-intermediaire-logistique.html","destination":"/intermediaire/logistique","permanent":true},{"source":"/pole-intermediaire-services","destination":"/intermediaire/services","permanent":true},{"source":"/pole-intermediaire-services.html","destination":"/intermediaire/services","permanent":true},{"source":"/pole-intermediaire-sites","destination":"/intermediaire/sites","permanent":true},{"source":"/pole-intermediaire-sites.html","destination":"/intermediaire/sites","permanent":true},{"source":"/pole-aval","destination":"/aval/","permanent":true},{"source":"/pole-aval.html","destination":"/aval/","permanent":true},{"source":"/pole-aval-distribution","destination":"/aval/distribution","permanent":true},{"source":"/pole-aval-distribution.html","destination":"/aval/distribution","permanent":true},{"source":"/pole-aval-produits","destination":"/aval/produits","permanent":true},{"source":"/pole-aval-produits.html","destination":"/aval/produits","permanent":true},{"source":"/pole-aval-raffinage","destination":"/aval/raffinage","permanent":true},{"source":"/pole-aval-raffinage.html","destination":"/aval/raffinage","permanent":true},{"source":"/pole-aval-reseau","destination":"/aval/reseau","permanent":true},{"source":"/pole-aval-reseau.html","destination":"/aval/reseau","permanent":true},{"source":"/pole-petrochimie","destination":"/petrochimie/","permanent":true},{"source":"/pole-petrochimie.html","destination":"/petrochimie/","permanent":true},{"source":"/pole-petrochimie-chimie-eor","destination":"/petrochimie/chimie-eor","permanent":true},{"source":"/pole-petrochimie-chimie-eor.html","destination":"/petrochimie/chimie-eor","permanent":true},{"source":"/pole-petrochimie-produits","destination":"/petrochimie/produits","permanent":true},{"source":"/pole-petrochimie-produits.html","destination":"/petrochimie/produits","permanent":true},{"source":"/pole-greentech","destination":"/greentech/","permanent":true},{"source":"/pole-greentech.html","destination":"/greentech/","permanent":true},{"source":"/pole-greentech-hseq","destination":"/greentech/#hseq","permanent":true},{"source":"/pole-greentech-hseq.html","destination":"/greentech/#hseq","permanent":true},{"source":"/pole-greentech-impact","destination":"/greentech/#impact","permanent":true},{"source":"/pole-greentech-impact.html","destination":"/greentech/#impact","permanent":true},{"source":"/pole-greentech-patrimoine","destination":"/greentech/#patrimoine","permanent":true},{"source":"/pole-greentech-patrimoine.html","destination":"/greentech/#patrimoine","permanent":true},{"source":"/pole-greentech-transition","destination":"/greentech/#transition","permanent":true},{"source":"/pole-greentech-transition.html","destination":"/greentech/#transition","permanent":true},{"source":"/pole-enertech","destination":"/tchaditech/","permanent":true},{"source":"/pole-enertech.html","destination":"/tchaditech/","permanent":true},{"source":"/pole-enertech-innovations","destination":"/tchaditech/#innovations","permanent":true},{"source":"/pole-enertech-innovations.html","destination":"/tchaditech/#innovations","permanent":true},{"source":"/pole-enertech-outils","destination":"/tchaditech/outils","permanent":true},{"source":"/pole-enertech-outils.html","destination":"/tchaditech/outils","permanent":true},{"source":"/pole-enertech-rd","destination":"/tchaditech/#rd","permanent":true},{"source":"/pole-enertech-rd.html","destination":"/tchaditech/#rd","permanent":true},{"source":"/pole-enertech-recits","destination":"/tchaditech/#recits","permanent":true},{"source":"/pole-enertech-recits.html","destination":"/tchaditech/#recits","permanent":true},{"source":"/pole-enertech-socle","destination":"/tchaditech/#socle","permanent":true},{"source":"/pole-enertech-socle.html","destination":"/tchaditech/#socle","permanent":true},{"source":"/pole-enertalents","destination":"/tchaditude/","permanent":true},{"source":"/pole-enertalents.html","destination":"/tchaditude/","permanent":true},{"source":"/pole-enertalents-academie","destination":"/tchaditude/#academie","permanent":true},{"source":"/pole-enertalents-academie.html","destination":"/tchaditude/#academie","permanent":true},{"source":"/pole-enertalents-partenariats","destination":"/tchaditude/#partenariats","permanent":true},{"source":"/pole-enertalents-partenariats.html","destination":"/tchaditude/#partenariats","permanent":true},{"source":"/pole-enertalents-rayonnement","destination":"/tchaditude/#rayonnement","permanent":true},{"source":"/pole-enertalents-rayonnement.html","destination":"/tchaditude/#rayonnement","permanent":true},{"source":"/pole-enerconseils","destination":"/enerconseils/","permanent":true},{"source":"/pole-enerconseils.html","destination":"/enerconseils/","permanent":true},{"source":"/pole-enerconseils-atlas","destination":"/enerconseils/atlas","permanent":true},{"source":"/pole-enerconseils-atlas.html","destination":"/enerconseils/atlas","permanent":true},{"source":"/pole-enerconseils-conseil","destination":"/enerconseils/#conseil","permanent":true},{"source":"/pole-enerconseils-conseil.html","destination":"/enerconseils/#conseil","permanent":true},{"source":"/enerchimie","destination":"/petrochimie","permanent":true},{"source":"/enerchimie/","destination":"/petrochimie/","permanent":true},{"source":"/enerchimie/petrochimie","destination":"/petrochimie/produits","permanent":true},{"source":"/enerchimie/petrochimie.html","destination":"/petrochimie/produits","permanent":true},{"source":"/enerchimie/chimie-eor","destination":"/petrochimie/chimie-eor","permanent":true},{"source":"/enerchimie/chimie-eor.html","destination":"/petrochimie/chimie-eor","permanent":true},{"source":"/pole-enerchimie","destination":"/petrochimie/","permanent":true},{"source":"/pole-enerchimie.html","destination":"/petrochimie/","permanent":true},{"source":"/pole-enerchimie-petrochimie","destination":"/petrochimie/produits","permanent":true},{"source":"/pole-enerchimie-petrochimie.html","destination":"/petrochimie/produits","permanent":true},{"source":"/pole-enerchimie-chimie-eor","destination":"/petrochimie/chimie-eor","permanent":true},{"source":"/pole-enerchimie-chimie-eor.html","destination":"/petrochimie/chimie-eor","permanent":true},{"source":"/og-enerchimie.png","destination":"/og-petrochimie.jpg","permanent":true},{"source":"/impact","destination":"/greentech/#impact","permanent":true},{"source":"/impact.html","destination":"/greentech/#impact","permanent":true},{"source":"/en","destination":"/index-en","permanent":true},{"source":"/en.html","destination":"/index-en","permanent":true},{"source":"/enertalents","destination":"/tchaditude/","permanent":true},{"source":"/enertalents/:path*","destination":"/tchaditude/:path*","permanent":true},{"source":"/pole-enertalents-en","destination":"/tchaditude/","permanent":true},{"source":"/pole-enertalents-en.html","destination":"/tchaditude/","permanent":true},{"source":"/og-enertalents.jpg","destination":"/og-tchaditude.jpg","permanent":true},{"source":"/enertech","destination":"/tchaditech/","permanent":true},{"source":"/enertech/:path*","destination":"/tchaditech/:path*","permanent":true},{"source":"/pole-enertech-en","destination":"/tchaditech/","permanent":true},{"source":"/pole-enertech-en.html","destination":"/tchaditech/","permanent":true},{"source":"/enertech/","destination":"/tchaditech/","permanent":true},{"source":"/enertalents/","destination":"/tchaditude/","permanent":true},{"source":"/Configurateur_Service_Integre_v2","destination":"/configurateur-service-integre","permanent":true},{"source":"/Calculateur_Baril_Additionnel","destination":"/amont/calculateur-baril-additionnel","permanent":true},{"source":"/enerconseils/conseil","destination":"/enerconseils/#conseil","permanent":true},{"source":"/enerconseils/audits","destination":"/enerconseils/#audits","permanent":true},{"source":"/enerconseils/esg","destination":"/enerconseils/#esg","permanent":true},{"source":"/enerconseils/conseil-en","destination":"/enerconseils/#conseil","permanent":true},{"source":"/enerconseils/audits-en","destination":"/enerconseils/#audits","permanent":true},{"source":"/enerconseils/esg-en","destination":"/enerconseils/#esg","permanent":true},{"source":"/greentech/hseq-en","destination":"/greentech/#hseq","permanent":true},{"source":"/greentech/impact-en","destination":"/greentech/#impact","permanent":true},{"source":"/greentech/transition-en","destination":"/greentech/#transition","permanent":true},{"source":"/greentech/patrimoine-en","destination":"/greentech/#patrimoine","permanent":true},{"source":"/greentech/hseq","destination":"/greentech/#hseq","permanent":true},{"source":"/greentech/impact","destination":"/greentech/#impact","permanent":true},{"source":"/greentech/transition","destination":"/greentech/#transition","permanent":true},{"source":"/greentech/patrimoine","destination":"/greentech/#patrimoine","permanent":true},{"source":"/tchaditude/academie-en","destination":"/tchaditude/#academie","permanent":true},{"source":"/tchaditude/services-en","destination":"/tchaditude/#services","permanent":true},{"source":"/tchaditude/rayonnement-en","destination":"/tchaditude/#rayonnement","permanent":true},{"source":"/tchaditude/partenariats-en","destination":"/tchaditude/#partenariats","permanent":true},{"source":"/tchaditude/academie","destination":"/tchaditude/#academie","permanent":true},{"source":"/tchaditude/services","destination":"/tchaditude/#services","permanent":true},{"source":"/tchaditude/rayonnement","destination":"/tchaditude/#rayonnement","permanent":true},{"source":"/tchaditude/partenariats","destination":"/tchaditude/#partenariats","permanent":true},{"source":"/tchaditech/socle-en","destination":"/tchaditech/#socle","permanent":true},{"source":"/tchaditech/rd-en","destination":"/tchaditech/#rd","permanent":true},{"source":"/tchaditech/innovations-en","destination":"/tchaditech/#innovations","permanent":true},{"source":"/tchaditech/recits-en","destination":"/tchaditech/#recits","permanent":true},{"source":"/tchaditech/socle","destination":"/tchaditech/#socle","permanent":true},{"source":"/tchaditech/rd","destination":"/tchaditech/#rd","permanent":true},{"source":"/tchaditech/innovations","destination":"/tchaditech/#innovations","permanent":true},{"source":"/tchaditech/recits","destination":"/tchaditech/#recits","permanent":true},{"source":"/boutique","destination":"/aval/boutique","permanent":true},{"source":"/boutique-en","destination":"/aval/boutique-en","permanent":true},{"source":"/calculateur-baril-additionnel","destination":"/amont/calculateur-baril-additionnel","permanent":true},{"source":"/explorateur-chaine","destination":"/nos-activites","permanent":true},{"source":"/explorateur-chaine-en","destination":"/nos-activites-en","permanent":true},{"source":"/pole-amont-en","destination":"/amont/","permanent":true},{"source":"/pole-amont-en.html","destination":"/amont/","permanent":true},{"source":"/pole-intermediaire-en","destination":"/intermediaire/","permanent":true},{"source":"/pole-intermediaire-en.html","destination":"/intermediaire/","permanent":true},{"source":"/pole-aval-en","destination":"/aval/","permanent":true},{"source":"/pole-aval-en.html","destination":"/aval/","permanent":true},{"source":"/pole-enerchimie-en","destination":"/petrochimie/","permanent":true},{"source":"/pole-enerchimie-en.html","destination":"/petrochimie/","permanent":true},{"source":"/pole-greentech-en","destination":"/greentech/","permanent":true},{"source":"/pole-greentech-en.html","destination":"/greentech/","permanent":true},{"source":"/pole-tchaditech-en","destination":"/tchaditech/","permanent":true},{"source":"/pole-tchaditech-en.html","destination":"/tchaditech/","permanent":true},{"source":"/pole-tchaditude-en","destination":"/tchaditude/","permanent":true},{"source":"/pole-tchaditude-en.html","destination":"/tchaditude/","permanent":true},{"source":"/pole-enerconseils-en","destination":"/enerconseils/","permanent":true},{"source":"/pole-enerconseils-en.html","destination":"/enerconseils/","permanent":true}];
  const sources = new Set(config.map(r => r.source));
  for (const rule of config) {
    const path = String(rule.destination || '').split('#')[0];
    expect(sources.has(path), rule.source + ' -> ' + rule.destination).toBeFalsy();
  }
});


test('SEO sitemap — every indexed URL resolves', async ({ request }) => {
  const sitemap = await request.get(new URL('/sitemap.xml', url).href);
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  for (let i = 0; i < urls.length; i += 10) {
    const batch = urls.slice(i, i + 10);
    const responses = await Promise.all(batch.map(u => request.get(u, { maxRedirects: 5, timeout: 30000 })));
    responses.forEach((response, j) => {
      expect(response.status(), batch[j]).toBeLessThan(400);
    });
  }
});


test('SEO representative pages — canonical matches requested route', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/contact-en', '/clients', '/clients-en', '/investisseurs', '/investisseurs-en', '/faq', '/faq-en', '/amont/', '/aval/', '/intermediaire/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const canonical = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i);
    expect(canonical, path).not.toBeNull();
    const actual = canonical[1].replace(/\/$/, '');
    const expected = new URL(path, url).href.replace(/\/$/, '');
    expect(actual, path).toBe(expected);
  }
});

test('SEO hreflang — alternates resolve and are reciprocal', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/contact-en', '/ar-contact', '/investisseurs', '/investisseurs-en', '/ar-investisseurs'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const lang = ((html.match(/<html[^>]+\blang=["']([^"']+)["']/i) || [])[1] || '').slice(0, 2);
    expect(lang, path).toMatch(/^(fr|en|ar)$/);

    const alternates = [...html.matchAll(/<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi)]
      .map(m => ({ hreflang: m[1].toLowerCase(), href: new URL(m[2], response.url()).href }));

    const localized = alternates.filter(x => ['fr', 'en', 'ar'].includes(x.hreflang));
    expect(localized.length, path).toBeGreaterThanOrEqual(2);

    for (const alt of localized) {
      const target = await request.get(alt.href, { maxRedirects: 5, timeout: 30000 });
      expect(target.status(), path + ' -> ' + alt.hreflang).toBe(200);
      const targetHtml = await target.text();
      const back = [...targetHtml.matchAll(/<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi)]
        .find(m => m[1].toLowerCase() === lang);
      expect(back, path + ' -> ' + alt.hreflang).toBeTruthy();
      expect(new URL(back[2], target.url()).href.replace(/\/$/, ''), path + ' -> ' + alt.hreflang)
        .toBe(response.url().replace(/\/$/, ''));
    }
  }
});

test('SEO social metadata — Open Graph et Twitter card', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/contact-en', '/clients', '/clients-en', '/investisseurs', '/investisseurs-en', '/faq', '/faq-en'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const getMeta = (attr, value) => {
      const re = new RegExp('<meta[^>]+(?:' + attr + '=["\\\']' + value.replace(/[.*+?^{}()|[\\]\\]/g, '\\\\$&') + '["\\\']|'+attr+'=["\\\'][^"\\\']+["\\\'][^>]*' + value.replace(/[.*+?^{}()|[\\]\\]/g, '\\\\$&') + ')', 'i');
      return re.test(html);
    };
    const meta = (property, contentAttr='property') => {
      const re = new RegExp('<meta[^>]+(?:' + contentAttr + '=["\\\']' + property.replace(/[.*+?^{}()|[\\]\\]/g, '\\\\$&') + '["\\\'])[^>]+content=["\\\']([^"\\\']+)["\\\']', 'i');
      return (html.match(re) || [])[1] || '';
    };
    const ogTitle = meta('og:title');
    const ogDesc = meta('og:description');
    const ogUrl = meta('og:url');
    const ogType = meta('og:type');
    const twitterCard = meta('twitter:card', 'name');
    const twitterTitle = meta('twitter:title', 'name');
    const twitterDesc = meta('twitter:description', 'name');
    const twitterImage = meta('twitter:image', 'name');
    expect(ogTitle, path).not.toBe('');
    expect(ogDesc, path).not.toBe('');
    expect(ogUrl, path).toBeTruthy();
    expect(new URL(ogUrl, response.url()).origin, path).toBe(new URL(url).origin);
    expect(ogType, path).toBeTruthy();
    expect(twitterCard, path).toBeTruthy();
    expect(twitterTitle || ogTitle, path).not.toBe('');
    expect(twitterDesc || ogDesc, path).not.toBe('');
    expect(twitterImage, path).toMatch(/^https:\/\//);
    expect(getMeta('property', 'og:title'), path).toBeTruthy();
  }
});

test('SEO English homepage — social titles match English metadata', async ({ request }) => {
  const response = await request.get(new URL('/index-en', url).href);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const title = (html.match(/<title>([^<]+)<\\/title>/i) || [])[1] || '';
  const ogTitle = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
  const twitterTitle = (html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
  const siteName = (html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
  expect(title).toContain('Energy Access');
  expect(ogTitle).toContain('Energy Access');
  expect(twitterTitle).toContain('Energy Access');
  expect(siteName).toContain('Energy Access');
  expect(ogTitle).not.toContain('Accès aux Énergies');
  expect(twitterTitle).not.toContain('Accès aux Énergies');
});

test('SEO sitemap — indexed URLs are indexable', async ({ request }) => {
  const sitemap = await request.get(new URL('/sitemap.xml', url).href);
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\\/loc>/g)].map(m => m[1]);

  for (let i = 0; i < urls.length; i += 10) {
    const batch = urls.slice(i, i + 10);
    const responses = await Promise.all(
      batch.map(u => request.get(u, { maxRedirects: 5, timeout: 30000 }))
    );
    for (let j = 0; j < responses.length; j++) {
      const response = responses[j];
      const source = batch[j];
      expect(response.status(), source).toBe(200);

      const xRobots = response.headers()['x-robots-tag'] || '';
      expect(xRobots.toLowerCase(), source).not.toContain('noindex');

      const html = await response.text();
      const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
      if (robots) {
        expect(robots[1].toLowerCase(), source).not.toMatch(/(^|[,\\s])noindex([,\\s]|$)/);
      }
    }
  }
});

test('SEO sitemap — chaque URL indexée est auto-canonique', async ({ request }) => {
  const sitemap = await request.get(new URL('/sitemap.xml', url).href);
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(urls.length).toBeGreaterThan(100);

  for (let i = 0; i < urls.length; i += 10) {
    const batch = urls.slice(i, i + 10);
    const responses = await Promise.all(
      batch.map(u => request.get(u, { maxRedirects: 5, timeout: 30000 }))
    );
    for (let j = 0; j < responses.length; j++) {
      const response = responses[j];
      const source = batch[j];
      expect(response.status(), source).toBe(200);
      const html = await response.text();
      const canonicalMatch =
        html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i);
      expect(canonicalMatch, source).not.toBeNull();
      const canonical = new URL(canonicalMatch[1], response.url()).href.replace(/\/$/, '');
      const finalUrl = response.url().replace(/\/$/, '');
      expect(canonical, source).toBe(finalUrl);
    }
  }
});


test('hubs — mobile UX contract', async ({ browser }) => {
  const paths = ['/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response, path).not.toBeNull();
    expect(response.status(), path).toBe(200);

    const audit = await page.evaluate(() => {
      const visible = el => {
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true';
      };
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { width: r.width, height: r.height, right: r.right, left: r.left };
      };
      const ctas = [...document.querySelectorAll('.pgh-cta a, .pgh-cta button, .pgh-btn, .pgh-btn2')].filter(visible);
      const badCtaTargets = ctas.filter(el => {
        const r = rect(el);
        return r.height < 44 || r.width < 44 || r.left < -1 || r.right > document.documentElement.clientWidth + 1;
      }).map(el => ({ text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0,80), ...rect(el) }));
      const footerButtons = [...document.querySelectorAll('footer .foot-col h3 button')].filter(visible);
      const badFooterButtons = footerButtons.filter(b => !b.getAttribute('aria-expanded')).map(b => b.outerHTML.slice(0,180));
      const nestedInteractive = [...document.querySelectorAll('footer .foot-col h3')].filter(h => h.querySelector('a,button') && h.querySelectorAll('a,button').length > 1).map(h => h.outerHTML.slice(0,220));
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        ctaCount: ctas.length,
        badCtaTargets,
        footerButtons: footerButtons.length,
        badFooterButtons,
        nestedInteractive
      };
    });

    expect(audit.overflow, path).toBeFalsy();
    expect(audit.ctaCount, path).toBeGreaterThan(0);
    expect(audit.badCtaTargets, path).toEqual([]);
    expect(audit.footerButtons, path).toBeGreaterThan(0);
    expect(audit.badFooterButtons, path).toEqual([]);
    expect(audit.nestedInteractive, path).toEqual([]);
    await page.close();
  }
});


test('mobile interactions — nav search and primary form controls', async ({ browser }) => {
  const cases = [
    { path: '/', search: true },
    { path: '/contact', form: true },
    { path: '/clients', form: false },
    { path: '/investisseurs', form: false }
  ];
  for (const item of cases) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const response = await page.goto(new URL(item.path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response.status(), item.path).toBe(200);

    if (item.search) {
      const trigger = page.locator('#navSearch').first();
      await expect(trigger, item.path).toHaveAttribute('aria-label', /Rechercher/i);
      await trigger.click();
      const dialog = page.locator('#cmdk').first();
      await expect(dialog, item.path).toBeVisible();
      const input = page.locator('#cmdk-input').first();
      await expect(input, item.path).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog, item.path).toBeHidden();
      await expect(trigger, item.path).toBeFocused();
    }

    if (item.form) {
      const controls = page.locator('form input, form textarea, form select, form button');
      const count = await controls.count();
      expect(count, item.path).toBeGreaterThan(0);
      for (let i = 0; i < count; i++) {
        const control = controls.nth(i);
        if (await control.isVisible()) {
          const name = await control.getAttribute('aria-label');
          const id = await control.getAttribute('id');
          const type = await control.getAttribute('type');
          if (type !== 'hidden') {
            const labelled = name || (id && await page.locator('label[for="' + id + '"]').count());
            expect(labelled, item.path + ' control ' + i).toBeTruthy();
          }
        }
      }
    }

    const bad = await page.evaluate(() => [...document.querySelectorAll('a,button,input,textarea,select')].filter(el => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' &&
        (r.left < -1 || r.right > document.documentElement.clientWidth + 1);
    }).map(el => ({ tag: el.tagName, text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0,60) })));
    expect(bad, item.path).toEqual([]);
    await page.close();
  }
});


test('accessibility — reduced motion visual contract', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = await page.goto(new URL('/', url).href, { waitUntil: 'networkidle', timeout: 45000 });
  expect(response.status()).toBe(200);
  const result = await page.evaluate(() => {
    const probe = document.querySelector('.hpcard,.hxi-card,.sc-card,.hncard,.et-command-card,.et-proof-card,.et-intent');
    const style = probe ? getComputedStyle(probe) : null;
    return {
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDuration: style ? style.transitionDuration : '',
      transform: style ? style.transform : ''
    };
  });
  expect(result.scrollBehavior).toBe('auto');
  if (result.transitionDuration) expect(result.transitionDuration).toMatch(/^(0s|0ms)(,\s*(0s|0ms))*$/);
  await page.close();
});


test('performance — external scripts remain non-blocking', async ({ request }) => {
  const paths = ['/', '/contact', '/clients', '/investisseurs', '/faq', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\\b([^>]*)\\bsrc=["']([^"']+)["'][^>]*>/gi)];
    for (const match of scripts) {
      const attrs = match[1] + ' ' + match[0];
      const isExternal = /^https?:/i.test(match[2]) || match[2].startsWith('/');
      if (!isExternal) continue;
      expect(/\\bdefer\\b|\\basync\\b/i.test(attrs), path + ' -> ' + match[2]).toBeTruthy();
    }
  }
});


test('security — no mixed-content resource URLs', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/clients', '/faq', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).not.toMatch(/(?:src|href|action)\\s*=\\s*["']http:\\/\\//i);
    expect(html, path).not.toMatch(/url\\(\\s*["']?http:\\/\\//i);
  }
});


test('performance — static assets expose cache directives', async ({ request }) => {
  const assets = ['/assets/chrome/bundle_head_b2.css','/assets/chrome/nav_a.js','/assets/chrome/modern-ui-2026.css'];
  for (const path of assets) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const cache = response.headers()['cache-control'] || '';
    expect(cache, path).toMatch(/public/i);
    expect(cache, path).toMatch(/max-age|s-maxage/i);
  }
});


test('SEO — hreflang self-reference matches canonical route', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/contact-en', '/ar-contact', '/clients', '/clients-en', '/investisseurs', '/investisseurs-en', '/ar-investisseurs'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const canonicalMatch = html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i);
    expect(canonicalMatch, path).not.toBeNull();
    const canonical = new URL(canonicalMatch[1], response.url()).href.replace(/\/$/, '');
    const localized = [...html.matchAll(/<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+hreflang=["']([^"']+)["'][^>]+href=["']([^"']+)["']/gi)];
    const lang = ((html.match(/<html[^>]+lang=["']([^"']+)/i) || [])[1] || '').slice(0,2).toLowerCase();
    const self = localized.find(m => m[1].toLowerCase() === lang);
    expect(self, path + ' missing self hreflang').toBeTruthy();
    expect(new URL(self[2], response.url()).href.replace(/\/$/, ''), path).toBe(canonical);
  }
});


test('security — redirect destinations stay internal', async () => {
  const fs = await import('node:fs/promises');
  const config = JSON.parse(await fs.readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  expect(Array.isArray(config.redirects)).toBeTruthy();
  for (const rule of config.redirects) {
    expect(typeof rule.source).toBe('string');
    expect(typeof rule.destination).toBe('string');
    expect(rule.destination, rule.source).not.toMatch(/^(?:https?:)?\\/\\//i);
  }
});


test('SEO redirects — permanent and chain-free', async () => {
  const fs = await import('node:fs/promises');
  const config = JSON.parse(await fs.readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const redirects = Array.isArray(config.redirects) ? config.redirects : [];
  const sources = new Set(redirects.map(r => String(r.source)));
  for (const rule of redirects) {
    expect(rule.permanent, rule.source).toBe(true);
    const destinationPath = String(rule.destination).split('#')[0];
    expect(sources.has(destinationPath), rule.source + ' -> ' + rule.destination).toBeFalsy();
  }
});


test('performance/security — critical resources expose correct MIME types', async ({ request }) => {
  const cases = [
    ['/', 'text/html'],
    ['/index-en', 'text/html'],
    ['/assets/chrome/home-corporate-2026.css', 'text/css'],
    ['/assets/chrome/nav_a.js', 'javascript'],
  ];
  for (const [path, expected] of cases) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const type = (response.headers()['content-type'] || '').toLowerCase();
    expect(type, path).toContain(expected);
  }
});


test('SEO social metadata — Open Graph locales match document language', async ({ request }) => {
  const cases = [
    ['/', 'fr_TD', ['en_US', 'ar_TD']],
    ['/index-en', 'en_US', ['fr_TD', 'ar_TD']],
    ['/ar', 'ar_TD', ['fr_TD', 'en_US']],
    ['/contact', 'fr_TD', ['en_US', 'ar_TD']],
    ['/contact-en', 'en_US', ['fr_TD', 'ar_TD']],
    ['/ar-contact', 'ar_TD', ['fr_TD', 'en_US']],
    ['/investisseurs', 'fr_TD', ['en_US', 'ar_TD']],
    ['/investisseurs-en', 'en_US', ['fr_TD', 'ar_TD']],
    ['/ar-investisseurs', 'ar_TD', ['fr_TD', 'en_US']]
  ];
  for (const [path, locale, alternates] of cases) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const main = (html.match(/property=["']og:locale["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '';
    const alt = [...html.matchAll(/property=["']og:locale:alternate["'][^>]+content=["']([^"']+)["']/gi)].map(m => m[1]);
    expect(main, path).toBe(locale);
    for (const expected of alternates) expect(alt, path).toContain(expected);
  }
});


test('SEO hreflang — localized URLs use normalized paths', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/contact-en', '/ar-contact', '/investisseurs', '/investisseurs-en', '/ar-investisseurs', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { maxRedirects: 5, timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const alternates = [...html.matchAll(/<link[^>]+rel=["'][^"']*alternate[^"']*["'][^>]+hreflang=["'](?:fr|en|ar|x-default)["'][^>]+href=["']([^"']+)["']/gi)]
      .map(m => new URL(m[1], response.url()));
    for (const alternate of alternates) {
      const target = await request.get(alternate.href, { maxRedirects: 5, timeout: 30000 });
      expect(target.status(), path + ' -> ' + alternate.href).toBe(200);
      expect(target.url(), path + ' -> ' + alternate.href).toBe(alternate.href);
    }
  }
});


test('navigation — internal HTML links resolve directly without redirects', async ({ request }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/clients', '/investisseurs', '/contact', '/faq'];
  const seen = new Set();
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { maxRedirects: 5, timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const links = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"'#]+)(?:#[^"']*)?["'][^>]*>/gi)]
      .map(m => m[1])
      .filter(h => h.startsWith('/') && !h.startsWith('//'))
      .map(h => new URL(h, response.url()).href);
    for (const href of links) {
      if (seen.has(href)) continue;
      seen.add(href);
      const target = await request.get(href, { maxRedirects: 0, timeout: 30000 });
      expect(target.status(), path + ' -> ' + href).not.toBe(301);
      expect(target.status(), path + ' -> ' + href).not.toBe(302);
      expect(target.status(), path + ' -> ' + href).not.toBe(307);
      expect(target.status(), path + ' -> ' + href).not.toBe(308);
    }
  }
});


test('forms — explicit submission contract and safe autocomplete', async ({ request }) => {
  const paths = ['/contact', '/clients', '/investisseurs'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const forms = [...html.matchAll(/<form\b([^>]*)>/gi)];
    for (const match of forms) {
      const attrs = match[1];
      expect(attrs, path).toMatch(/\bmethod=["'](?:get|post)["']/i);
      const action = (attrs.match(/\baction=["']([^"']+)["']/i) || [])[1];
      if (action) {
        expect(action, path).not.toMatch(/^(?:https?:)?\/\//i);
        expect(action, path).toMatch(/^\//);
      }
      const inputs = [...html.slice(match.index).matchAll(/<(?:input|textarea|select)\b([^>]*)>/gi)];
      for (const input of inputs) {
        const attrs = input[1];
        if (/\btype=["']hidden["']/i.test(attrs)) continue;
        if (/\bautocomplete=["'][^"']+["']/i.test(attrs)) continue;
        expect(attrs, path).toMatch(/\b(?:aria-label|name|id)=["'][^"']+["']/i);
      }
    }
  }
});


test('performance — internal CSS/JS resources resolve directly', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/clients', '/investisseurs', '/faq', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  const seen = new Set();
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const resources = [
      ...[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]),
      ...[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi)]
        .map(m => m[1])
        .filter(h => /\.css(?:[?#].*)?$/i.test(h))
    ].filter(h => h.startsWith('/') && !h.startsWith('//'));
    for (const href of resources) {
      const absolute = new URL(href, response.url()).href;
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      const target = await request.get(absolute, { maxRedirects: 0, timeout: 30000 });
      expect(target.status(), path + ' -> ' + href).toBe(200);
    }
  }
});


test('performance — referenced font assets resolve directly', async ({ request }) => {
  const cssPaths = ['/assets/chrome/bundle_head_b2.css', '/assets/chrome/modern-ui-2026.css', '/assets/chrome/nav_a.css', '/assets/chrome/home-corporate-2026.css', '/assets/chrome/hubs-portal-2026.css'];
  const seen = new Set();
  for (const cssPath of cssPaths) {
    const response = await request.get(new URL(cssPath, url).href, { timeout: 30000 });
    expect(response.status(), cssPath).toBe(200);
    const css = await response.text();
    const fonts = [...css.matchAll(/url\\(\\s*["']?([^"')]+\\.(?:woff2?|otf|ttf)(?:[?#][^"')]+)?)["']?\\s*\\)/gi)]
      .map(m => m[1])
      .filter(h => h.startsWith('/') && !h.startsWith('//'));
    for (const href of fonts) {
      const absolute = new URL(href, response.url()).href;
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      const target = await request.get(absolute, { maxRedirects: 0, timeout: 30000 });
      expect(target.status(), cssPath + ' -> ' + href).toBe(200);
      expect((target.headers()['content-type'] || '').toLowerCase(), cssPath + ' -> ' + href).toMatch(/font|octet-stream/);
    }
  }
});


test('performance — referenced image assets resolve directly', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/clients', '/investisseurs', '/faq', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  const seen = new Set();
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const resources = [
      ...[...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]),
      ...[...html.matchAll(/(?:srcset|data-src|data-lazy-src)=["']([^"']+)["']/gi)].map(m => m[1].split(',')[0].trim().split(/\s+/)[0]),
      ...[...html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(m => m[1])
    ].filter(h => h.startsWith('/') && !h.startsWith('//') && /\.(?:avif|webp|png|jpe?g|gif|svg)(?:[?#].*)?$/i.test(h));
    for (const href of resources) {
      const absolute = new URL(href, response.url()).href;
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      const target = await request.get(absolute, { maxRedirects: 0, timeout: 30000 });
      expect(target.status(), path + ' -> ' + href).toBe(200);
    }
  }
});


test('trust — homepage claims expose status/context and evidence entry points', async ({ request }) => {
  const response = await request.get(url, { timeout: 30000 });
  expect(response.status()).toBe(200);
  const html = await response.text();

  // The company status must remain explicit wherever the homepage presents targets.
  expect(html).toMatch(/soci[ée]t[ée]\s+(?:en\s+constitution|anonyme[^<]{0,80}en\s+constitution)/i);
  expect(html).toMatch(/statut[^<]{0,120}dates[^<]{0,120}limites/i);

  // Core quantitative sections must provide at least one evidence/document path.
  const evidenceLinks = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi)]
    .map(m => ({ href: m[1], text: m[2].replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim() }))
    .filter(x => /documents|donn[ée]es|preuves|avertissements|limites|pdf|data book/i.test(x.text));
  expect(evidenceLinks.length).toBeGreaterThanOrEqual(3);

  // Avoid presenting a future target as an unqualified current operating fact.
  const targetTerms = ['visé', 'objectif', 'cible', 'anticipée', 'à venir'];
  const body = html.replace(/<script[\\s\\S]*?<\\/script>/gi, ' ').replace(/<style[\\s\\S]*?<\\/style>/gi, ' ');
  const targetHits = targetTerms.reduce((n, term) => n + (body.match(new RegExp(term, 'gi')) || []).length, 0);
  expect(targetHits).toBeGreaterThan(0);
});

test('404 page — branded recovery and noindex', async ({ request }) => {
  const response = await request.get(new URL('/__qa_missing_route__', url).href, { maxRedirects: 5, timeout: 30000 });
  expect(response.status()).toBe(404);
  const html = await response.text();
  expect(html).toMatch(/Page introuvable|404/i);
  expect(html).toMatch(/noindex/i);
  expect(html).toMatch(/EnerTchad/i);
  expect(html).toMatch(/href=["'][^"']*(?:^|\\/)index|href=["']\\//i);
});


test('accessibility — pages expose language, main landmark and skip navigation', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/clients', '/investisseurs', '/faq', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).toMatch(/<html\b[^>]*\blang=["'][^"']+["']/i);
    expect(html, path).toMatch(/<main\b/i);
    expect(html, path).toMatch(/(?:skip|aller au contenu|passer au contenu)/i);
  }
});

test('accessibility — images have alt text and interactive controls have names', async ({ request }) => {
  const paths = ['/', '/contact', '/clients', '/investisseurs', '/faq'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    const html = await response.text();
    const images = [...html.matchAll(/<img\b([^>]*)>/gi)].map(m => m[1]).filter(a => !/\baria-hidden=["']true["']/i.test(a));
    for (const attrs of images) expect(attrs, path).toMatch(/\balt=["'][^"']*["']/i);
    const controls = [...html.matchAll(/<(?:button|a)\b([^>]*)>/gi)].map(m => m[1])
      .filter(a => !/\baria-hidden=["']true["']/i.test(a));
    for (const attrs of controls) {
      const hasName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\btitle=["'][^"']+["']/i.test(attrs);
      expect(hasName || !/^\s*(?:type=["'](?:button|submit)["']\s*)?$/i.test(attrs), path).toBeTruthy();
    }
  }
});

test('SEO/security — canonical URLs and baseline security headers', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const canonical = (html.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i) || [])[1];
    expect(canonical, path).toBeTruthy();
    expect(new URL(canonical, response.url()).protocol, path).toBe('https:');
    const headers = response.headers();
    expect(headers['x-content-type-options'], path).toBe('nosniff');
    expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(headers['x-frame-options'], path).toBe('SAMEORIGIN');
    expect(headers['strict-transport-security'], path).toMatch(/max-age=\d+/i);
  }
});

test('SEO — sitemap and robots expose the same canonical host', async ({ request }) => {
  const robots = await request.get(new URL('/robots.txt', url).href, { timeout: 30000 });
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  const sitemapMatch = robotsText.match(/Sitemap:\s*(https?:\/\/[^\s]+)/i);
  expect(sitemapMatch).toBeTruthy();
  const sitemapUrl = sitemapMatch[1];
  expect(new URL(sitemapUrl).hostname).toBe(new URL(url).hostname);

  const sitemap = await request.get(sitemapUrl, { timeout: 30000 });
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toMatch(/<urlset\b/i);
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1]);
  expect(urls.length).toBeGreaterThan(5);
  for (const loc of urls) expect(new URL(loc).hostname).toBe(new URL(url).hostname);
});

test('navigation accessibility — disclosure controls declare valid relationships', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    const controls = [...html.matchAll(/\baria-controls=["']([^"']+)["']/gi)].map(m => m[1]);
    for (const id of controls) expect(html, path + ' aria-controls=' + id).toContain('id="' + id + '"');
    const expanded = [...html.matchAll(/\baria-expanded=["']([^"']+)["']/gi)].map(m => m[1]);
    for (const value of expanded) expect(['true', 'false'], path).toContain(value);
  }
});

test('redirects — legacy routes are unique, permanent and point to non-legacy destinations', async ({ request }) => {
  const legacy = [
    '/reporting', '/reporting-en', '/en', '/en.html', '/pole-amont', '/pole-intermediaire',
    '/pole-aval', '/pole-greentech', '/pole-enertech', '/pole-enertalents', '/pole-enerconseils',
    '/enertech', '/enertalents', '/enerchimie', '/impact', '/boutique', '/calculateur-baril-additionnel'
  ];
  const seen = new Set();
  for (const path of legacy) {
    expect(seen.has(path), 'duplicate legacy route: ' + path).toBeFalsy();
    seen.add(path);
    const response = await request.get(new URL(path, url).href, { maxRedirects: 0, timeout: 30000 });
    expect(response.status(), path).toBe(308);
    const location = response.headers()['location'];
    expect(location, path).toBeTruthy();
    expect(location).not.toBe(path);
    const target = await request.get(new URL(location, response.url()).href, { maxRedirects: 0, timeout: 30000 });
    expect(target.status(), path + ' -> ' + location).not.toBe(301);
    expect(target.status(), path + ' -> ' + location).not.toBe(302);
    expect(target.status(), path + ' -> ' + location).not.toBe(307);
    expect(target.status(), path + ' -> ' + location).not.toBe(308);
  }
});

test('SEO/editorial structure — titles, descriptions, headings and locale metadata', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const meta = await page.evaluate(() => {
      const title = document.title.trim();
      const descriptions = [...document.querySelectorAll('meta[name="description"]')].map(x => x.getAttribute('content')?.trim()).filter(Boolean);
      const h1 = [...document.querySelectorAll('h1')].map(x => x.textContent?.trim()).filter(Boolean);
      const html = document.documentElement;
      return { title, descriptions, h1, lang: html.lang, dir: html.dir };
    });
    expect(meta.title.length, path).toBeGreaterThan(10);
    expect(meta.descriptions.length, path).toBe(1);
    expect(meta.descriptions[0].length, path).toBeGreaterThan(40);
    expect(meta.h1.length, path).toBe(1);
    if (path === '/ar') {
      expect(meta.lang, path).toMatch(/^ar/i);
      expect(meta.dir, path).toBe('rtl');
    } else if (path === '/index-en') {
      expect(meta.lang, path).toMatch(/^en/i);
    } else {
      expect(meta.lang, path).toMatch(/^fr/i);
    }
    await page.close();
  }
});

test('accessibility/performance — images expose stable dimensions and meaningful alternatives', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => [...document.images].map(img => ({
      src: img.currentSrc || img.src,
      alt: img.getAttribute('alt'),
      width: img.getAttribute('width'),
      height: img.getAttribute('height'),
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    })));
    for (const img of report) {
      expect(img.alt, path + ' ' + img.src).not.toBeNull();
      if (img.naturalWidth > 0) {
        expect(Number(img.width), path + ' ' + img.src).toBeGreaterThan(0);
        expect(Number(img.height), path + ' ' + img.src).toBeGreaterThan(0);
      }
    }
    await page.close();
  }
});

test('forms — controls are explicitly labelled and autocomplete is safe', async ({ browser }) => {
  const paths = ['/contact', '/investisseurs', '/carrieres', '/clients'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const fields = await page.locator('input, select, textarea').evaluateAll(nodes => nodes.map((el, i) => {
      const id = el.getAttribute('id');
      const aria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
      const labelled = id && document.querySelector('label[for="' + CSS.escape(id) + '"]');
      return { i, type: el.getAttribute('type') || el.tagName.toLowerCase(), hasLabel: !!labelled || !!aria, autocomplete: el.getAttribute('autocomplete') };
    }));
    for (const field of fields) {
      expect(field.hasLabel, path + ' field ' + field.i).toBeTruthy();
      if (field.type === 'password') expect(field.autocomplete, path).not.toBe('off');
    }
    await page.close();
  }
});

test('SEO — canonical and hreflang are mutually consistent on localized entry pages', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar'];
  const expected = new Set(['fr', 'en', 'ar', 'x-default']);
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const data = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(x => ({ lang: x.hreflang, href: x.href }))
    }));
    expect(data.canonical, path).toBeTruthy();
    expect(new URL(data.canonical).hostname, path).toBe(new URL(url).hostname);
    expect(new URL(data.canonical).protocol, path).toBe('https:');
    expect(new Set(data.alternates.map(x => x.lang)), path).toEqual(expected);
    for (const alternate of data.alternates) {
      expect(new URL(alternate.href).hostname, path + ' ' + alternate.lang).toBe(new URL(url).hostname);
      expect(new URL(alternate.href).protocol, path + ' ' + alternate.lang).toBe('https:');
    }
    await page.close();
  }
});

test('SEO — JSON-LD blocks are valid JSON and use supported schema types', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length, path).toBeGreaterThan(0);
    for (const raw of blocks) {
      let parsed;
      expect(() => { parsed = JSON.parse(raw); }, path).not.toThrow();
      const nodes = Array.isArray(parsed) ? parsed : (parsed?.['@graph'] || [parsed]);
      for (const node of nodes) {
        if (node?.['@type']) {
          const types = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
          expect(types.some(t => typeof t === 'string' && t.length > 0), path).toBeTruthy();
        }
      }
    }
    await page.close();
  }
});

test('security — extended response policy headers are present', async ({ request }) => {
  const response = await request.get(new URL('/', url).href, { timeout: 30000 });
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers['permissions-policy']).toContain('camera=()');
  expect(headers['permissions-policy']).toContain('microphone=()');
  expect(headers['permissions-policy']).toContain('geolocation=()');
  expect(headers['cross-origin-opener-policy']).toBe('same-origin');
  expect(headers['cross-origin-resource-policy']).toBe('same-origin');
  expect(headers['x-permitted-cross-domain-policies']).toBe('none');
});

test('SEO — sitemap lastmod values are ISO dates and localized alternates stay on canonical host', async ({ request }) => {
  const response = await request.get(new URL('/sitemap.xml', url).href, { timeout: 30000 });
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const dates = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/gi)].map(m => m[1]);
  expect(dates.length).toBeGreaterThan(5);
  for (const value of dates) expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const alternates = [...xml.matchAll(/<xhtml:link[^>]+hreflang=["'][^"']+["'][^>]+href=["']([^"']+)["']/gi)].map(m => m[1]);
  expect(alternates.length).toBeGreaterThan(5);
  for (const href of alternates) {
    const parsed = new URL(href);
    expect(parsed.protocol).toBe('https:');
    expect(parsed.hostname).toBe(new URL(url).hostname);
  }
});

test('performance — local assets avoid obvious cache-busting and oversized eager loading', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => ({
      images: [...document.images].map(img => ({
        src: img.currentSrc || img.src,
        loading: img.getAttribute('loading'),
        fetchpriority: img.getAttribute('fetchpriority'),
        decoding: img.getAttribute('decoding'),
        rect: (() => { const r = img.getBoundingClientRect(); return { top: r.top, width: r.width, height: r.height }; })()
      })),
      styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(x => x.href),
      scripts: [...document.scripts].filter(x => x.src).map(x => x.src)
    }));
    for (const img of report.images) {
      if (img.rect.top > 900) expect(img.loading, path + ' below-fold ' + img.src).toBe('lazy');
    }
    for (const href of [...report.styles, ...report.scripts]) {
      if (href.startsWith(new URL(url).origin + '/')) expect(href).not.toMatch(/[?&](v|version|cb|cache)=\d{4,}/i);
    }
    await page.close();
  }
});

test('navigation — internal links stay on the canonical host and expose real destinations', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response?.status()).toBe(200);
  const links = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')).filter(Boolean));
  const origin = new URL(url).origin;
  for (const href of links) {
    if (href.startsWith('/') && !href.startsWith('//')) {
      const parsed = new URL(href, origin);
      expect(parsed.origin).toBe(origin);
      expect(parsed.pathname).not.toMatch(/^\/https?:/i);
    }
  }
  await page.close();
});

test('keyboard navigation — disclosure controls keep truthful expanded state', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  const controls = page.locator('[aria-controls][aria-expanded]');
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < Math.min(count, 12); i++) {
    const control = controls.nth(i);
    const targetId = await control.getAttribute('aria-controls');
    const target = page.locator('#' + targetId);
    await expect(target, 'target ' + targetId).toHaveCount(1);
    const before = await control.getAttribute('aria-expanded');
    await control.focus();
    await page.keyboard.press('Enter');
    const after = await control.getAttribute('aria-expanded');
    expect(after).not.toBe(before);
    await page.keyboard.press('Escape');
    await expect(control).toHaveAttribute('aria-expanded', 'false');
  }
  await page.close();
});

test('metadata — Open Graph and Twitter cards have complete absolute HTTPS URLs', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const data = await page.evaluate(() => {
      const get = name => document.querySelector('meta[property="' + name + '"]')?.content || document.querySelector('meta[name="' + name + '"]')?.content || '';
      return { ogTitle: get('og:title'), ogDescription: get('og:description'), ogUrl: get('og:url'), ogImage: get('og:image'), twitterCard: get('twitter:card') };
    });
    expect(data.ogTitle.length, path).toBeGreaterThan(5);
    expect(data.ogDescription.length, path).toBeGreaterThan(20);
    expect(data.twitterCard, path).toBeTruthy();
    for (const value of [data.ogUrl, data.ogImage]) {
      expect(value, path).toMatch(/^https:\/\//);
      expect(new URL(value).hostname, path).toBe(new URL(url).hostname);
    }
    await page.close();
  }
});

test('HTML structure — exactly one main landmark and no duplicate element IDs', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(x => x.id).filter(Boolean);
      const counts = {};
      for (const id of ids) counts[id] = (counts[id] || 0) + 1;
      return { main: document.querySelectorAll('main').length, duplicates: Object.entries(counts).filter(([, count]) => count > 1) };
    });
    expect(report.main, path).toBe(1);
    expect(report.duplicates, path).toEqual([]);
    await page.close();
  }
});

test('forms — required controls are usable and submit targets are explicit', async ({ browser }) => {
  const paths = ['/contact', '/investisseurs', '/carrieres', '/clients'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => [...document.forms].map(form => ({
      action: form.getAttribute('action') || '',
      method: (form.getAttribute('method') || 'get').toLowerCase(),
      controls: [...form.querySelectorAll('input,select,textarea,button')].map(el => ({
        type: el.getAttribute('type') || el.tagName.toLowerCase(),
        name: el.getAttribute('name') || '',
        disabled: el.hasAttribute('disabled'),
        required: el.hasAttribute('required'),
        autocomplete: el.getAttribute('autocomplete'),
        aria: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
        label: el.labels?.length || 0
      }))
    })));
    for (const form of report) {
      expect(form.method, path).toMatch(/^(get|post)$/);
      for (const c of form.controls) {
        if (['button','submit','reset'].includes(c.type)) continue;
        expect(c.disabled || c.label > 0 || !!c.aria || !!c.name, path + ' unnamed control').toBeTruthy();
        if (c.required) expect(c.disabled).toBeFalsy();
      }
    }
    await page.close();
  }
});

test('resource integrity — stylesheet/script/image URLs are same-origin or explicitly external', async ({ browser }) => {
  const page = await browser.newPage();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  expect(response?.status()).toBe(200);
  const origin = new URL(url).origin;
  const resources = await page.evaluate(() => [
    ...[...document.querySelectorAll('link[href]')].map(x => x.href),
    ...[...document.querySelectorAll('script[src]')].map(x => x.src),
    ...[...document.images].map(x => x.currentSrc || x.src)
  ].filter(Boolean));
  for (const href of resources) {
    const parsed = new URL(href, origin);
    expect(parsed.protocol).toMatch(/^https?:$/);
    if (parsed.protocol === 'http:') expect(parsed.hostname).not.toBe(new URL(url).hostname);
  }
  await page.close();
});

test('routing — representative sitemap URLs resolve without 4xx/5xx', async ({ request }) => {
  const sitemap = await request.get(new URL('/sitemap.xml', url).href, { timeout: 30000 });
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)].map(m => m[1]);
  expect(urls.length).toBeGreaterThan(10);
  const sample = [...new Set([urls[0], urls[Math.floor(urls.length / 2)], urls[urls.length - 1], ...urls.slice(1, 5)])];
  for (const target of sample) {
    const response = await request.get(target, { maxRedirects: 5, timeout: 30000 });
    expect(response.status(), target).toBeLessThan(400);
  }
});

test('responsive — key content remains readable across tablet and mobile widths', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/contact'];
  const viewports = [{ width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }];
  for (const path of paths) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      expect(response?.status(), path + ' ' + viewport.width).toBe(200);
      const metrics = await page.evaluate(() => {
        const body = document.body;
        const doc = document.documentElement;
        const main = document.querySelector('main');
        const h1 = document.querySelector('h1');
        return {
          overflow: doc.scrollWidth > doc.clientWidth + 1,
          bodyWidth: body.scrollWidth,
          viewport: doc.clientWidth,
          mainText: main?.innerText?.trim().length || 0,
          h1Visible: !!h1 && !!(h1.getBoundingClientRect().width && h1.getBoundingClientRect().height)
        };
      });
      expect(metrics.overflow, path + ' horizontal overflow at ' + viewport.width).toBeFalsy();
      expect(metrics.mainText, path + ' main content').toBeGreaterThan(100);
      expect(metrics.h1Visible, path + ' h1').toBeTruthy();
      await page.close();
    }
  }
});

test('localization — localized pages declare consistent language metadata and direction', async ({ browser }) => {
  const cases = [['/', 'fr', 'ltr'], ['/index-en', 'en', 'ltr'], ['/ar', 'ar', 'rtl'], ['/ar-poles', 'ar', 'rtl'], ['/ar-amont', 'ar', 'rtl'], ['/ar-aval', 'ar', 'rtl'], ['/ar-contact', 'ar', 'rtl'], ['/ar-investisseurs', 'ar', 'rtl']];
  for (const [path, lang, dir] of cases) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('html')).toHaveAttribute('dir', dir);
    await page.close();
  }
});

test('accessibility — images expose useful alternative text and controls have accessible names', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => {
      const images = [...document.images].map(img => ({ alt: img.getAttribute('alt'), decorative: img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true' }));
      const controls = [...document.querySelectorAll('a,button,input,select,textarea')].filter(el => !el.hasAttribute('disabled')).map(el => ({
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || '').trim(),
        aria: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
        title: el.getAttribute('title'),
        placeholder: el.getAttribute('placeholder')
      }));
      return { images, controls };
    });
    for (const image of report.images) expect(image.decorative || image.alt !== null, path).toBeTruthy();
    for (const control of report.controls) {
      const named = control.text || control.aria || control.title || control.placeholder;
      expect(named, path + ' unnamed ' + control.tag).toBeTruthy();
    }
    await page.close();
  }
});

test('visual guardrails — typography and layout tokens remain sane', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const body = document.body;
      const cs = h1 ? getComputedStyle(h1) : null;
      return {
        h1: h1?.textContent?.trim() || '',
        fontSize: cs?.fontSize || '',
        lineHeight: cs?.lineHeight || '',
        bodyFont: getComputedStyle(body).fontFamily,
        bodyColor: getComputedStyle(body).color,
        bg: getComputedStyle(body).backgroundColor
      };
    });
    expect(report.h1.length, path).toBeGreaterThan(3);
    expect(parseFloat(report.fontSize), path).toBeGreaterThanOrEqual(20);
    expect(parseFloat(report.fontSize), path).toBeLessThanOrEqual(100);
    expect(report.lineHeight, path).not.toBe('0px');
    expect(report.bodyFont, path).toBeTruthy();
    await page.close();
  }
});

test('content integrity — primary navigation and footer expose meaningful labels', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const report = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const footer = document.querySelector('footer');
      const navLinks = nav ? [...nav.querySelectorAll('a')].map(a => (a.textContent || a.getAttribute('aria-label') || '').trim()).filter(Boolean) : [];
      const footerLinks = footer ? [...footer.querySelectorAll('a')].map(a => (a.textContent || a.getAttribute('aria-label') || '').trim()).filter(Boolean) : [];
      return { nav: navLinks.length, footer: footerLinks.length };
    });
    expect(report.nav, path).toBeGreaterThan(2);
    expect(report.footer, path).toBeGreaterThan(2);
    await page.close();
  }
});

test('media — images declare intrinsic dimensions or CSS aspect-ratio where appropriate', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const images = await page.locator('img').evaluateAll(imgs => imgs.map(img => ({
      src: img.currentSrc || img.src,
      width: img.getAttribute('width'),
      height: img.getAttribute('height'),
      ratio: getComputedStyle(img).aspectRatio,
      rendered: (() => { const r = img.getBoundingClientRect(); return r.width > 0 && r.height > 0; })()
    })));
    for (const image of images) {
      if (!image.rendered) continue;
      expect(!!image.width && !!image.height || image.ratio !== 'auto', path + ' media ' + image.src).toBeTruthy();
    }
    await page.close();
  }
});

test('interaction — same-page anchors resolve to existing targets', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const anchors = await page.locator('a[href^="#"]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href')).filter(h => h && h.length > 1 && h !== '#'));
    for (const href of [...new Set(anchors)]) {
      const id = decodeURIComponent(href.slice(1));
      const exists = await page.evaluate(target => !!document.getElementById(target), id);
      expect(exists, path + ' ' + href).toBeTruthy();
    }
    await page.close();
  }
});

test('interaction — focus-visible styles are available for keyboard users', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const result = await page.evaluate(() => {
    const rules = [...document.styleSheets].flatMap(sheet => {
      try { return [...sheet.cssRules].map(r => r.cssText); } catch { return []; }
    });
    return rules.some(css => /:focus-visible|:focus\b/i.test(css));
  });
  expect(result).toBeTruthy();
  await page.close();
});

test('interaction — buttons have explicit type and links expose non-empty destinations', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.evaluate(() => ({
      buttons: [...document.querySelectorAll('button')].map(b => ({ type: b.getAttribute('type'), text: (b.textContent || '').trim(), aria: b.getAttribute('aria-label') })),
      links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(h => h !== null)
    }));
    for (const button of report.buttons) expect(button.type || 'button', path).toMatch(/^(button|submit|reset)$/);
    for (const href of report.links) expect(href.trim().length, path).toBeGreaterThan(0);
    await page.close();
  }
});

test('SEO infrastructure — robots and sitemap remain mutually consistent', async ({ request }) => {
  const robots = await request.get(new URL('/robots.txt', url).href, { timeout: 30000 });
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  const sitemapMatch = robotsText.match(/^\s*Sitemap:\s*(\S+)\s*$/im);
  expect(sitemapMatch).not.toBeNull();
  const sitemapUrl = new URL(sitemapMatch[1]);
  expect(sitemapUrl.protocol).toBe('https:');
  expect(sitemapUrl.hostname).toBe(new URL(url).hostname);
  expect(sitemapUrl.pathname).toBe('/sitemap.xml');

  const sitemap = await request.get(sitemapUrl.href, { timeout: 30000 });
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('<urlset');
  expect(xml).toContain('xmlns:xhtml=');
});

test('SEO infrastructure — canonical URLs are absolute HTTPS and match requested host', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    const canonicals = await page.locator('link[rel="canonical"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')).filter(Boolean));
    expect(canonicals.length, path).toBe(1);
    const canonical = new URL(canonicals[0], url);
    expect(canonical.protocol, path).toBe('https:');
    expect(canonical.hostname, path).toBe(new URL(url).hostname);
    expect(canonical.search, path).toBe('');
    expect(canonical.hash, path).toBe('');
    await page.close();
  }
});

test('SEO infrastructure — hreflang declarations use valid language codes and canonical-host URLs', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const links = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(nodes => nodes.map(n => ({
      lang: n.getAttribute('hreflang'),
      href: n.getAttribute('href')
    })));
    const langs = links.map(x => x.lang);
    expect(langs.sort(), path).toEqual(['ar', 'en', 'fr', 'x-default'].sort());
    for (const item of links) {
      const target = new URL(item.href, url);
      expect(target.protocol, path).toBe('https:');
      expect(target.hostname, path).toBe(new URL(url).hostname);
    }
    await page.close();
  }
});

test('routing — legacy redirects are permanent and terminate on canonical content', async ({ request }) => {
  const cases = [
    ['/pole-amont-en', '/amont/'],
    ['/pole-aval-en.html', '/aval/'],
    ['/pole-greentech', '/greentech/'],
    ['/pole-tchaditech-en', '/tchaditech/'],
    ['/pole-tchaditude-en.html', '/tchaditude/'],
    ['/pole-enerconseils-en', '/enerconseils/'],
    ['/pole-enerchimie', '/petrochimie/'],
    ['/pole-intermediaire-en', '/intermediaire/']
  ];
  for (const [from, to] of cases) {
    const first = await request.get(new URL(from, url).href, { maxRedirects: 0, timeout: 30000 });
    expect([301, 308], from).toContain(first.status());
    const location = first.headers()['location'];
    expect(location, from).toBeTruthy();
    const resolved = new URL(location, url);
    const final = await request.get(resolved.href, { maxRedirects: 0, timeout: 30000 });
    expect(final.status(), from).toBeLessThan(400);
    expect(resolved.pathname, from).toBe(to);
  }
});

test('runtime health — no failed document resources on representative pages', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs', '/ar'];
  for (const path of paths) {
    const page = await browser.newPage();
    const failures = [];
    page.on('requestfailed', req => failures.push(req.url() + ' :: ' + (req.failure()?.errorText || 'failed')));
    const response = await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(response?.status(), path).toBe(200);
    expect(failures, path).toEqual([]);
    await page.close();
  }
});

test('runtime health — local styles, scripts, fonts and images are served successfully', async ({ browser }) => {
  const page = await browser.newPage();
  const failed = [];
  page.on('response', response => {
    const type = response.request().resourceType();
    if (['stylesheet', 'script', 'font', 'image'].includes(type) && response.status() >= 400) {
      failed.push(type + ' ' + response.status() + ' ' + response.url());
    }
  });
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  expect(response?.status()).toBe(200);
  expect(failed).toEqual([]);
  await page.close();
});

test('fonts — declared webfonts use valid font-display and local source URLs', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const report = await page.evaluate(() => {
    const rules = [];
    for (const sheet of [...document.styleSheets]) {
      try {
        for (const rule of [...sheet.cssRules]) if (rule.cssText.includes('@font-face')) rules.push(rule.cssText);
      } catch {}
    }
    return rules;
  });
  for (const rule of report) {
    expect(rule).toMatch(/font-display\s*:\s*(swap|optional|fallback|block)/i);
  }
  await page.close();
});

test('forms — controls use safe autocomplete semantics', async ({ browser }) => {
  const paths = ['/contact', '/investisseurs', '/carrieres'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const controls = await page.locator('input,select,textarea').evaluateAll(nodes => nodes.map(el => ({
      type: (el.getAttribute('type') || '').toLowerCase(),
      autocomplete: el.getAttribute('autocomplete'),
      name: el.getAttribute('name'),
      id: el.getAttribute('id'),
      label: el.labels?.[0]?.textContent?.trim() || ''
    })));
    for (const control of controls) {
      if (control.type === 'password') expect(control.autocomplete, path).not.toBe('off');
      if (control.type === 'email') expect(control.autocomplete || control.name, path).toBeTruthy();
      expect(control.id || control.name || control.label, path + ' unnamed field').toBeTruthy();
    }
    await page.close();
  }
});

test('interaction — disabled and hidden controls do not become keyboard traps', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const report = await page.evaluate(() => {
    const tabbables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(el => {
      const style = getComputedStyle(el);
      return !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1' && style.display !== 'none' && style.visibility !== 'hidden';
    });
    return {
      count: tabbables.length,
      offscreen: tabbables.filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.right < -20 || r.left > innerWidth + 20); }).length
    };
  });
  expect(report.count).toBeGreaterThan(5);
  expect(report.offscreen).toBe(0);
  await page.close();
});

test('structured data — organization identity remains coherent across strategic pages', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const nodes = [];
    for (const raw of blocks) {
      try {
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : (parsed?.['@graph'] || [parsed]);
        nodes.push(...list);
      } catch {}
    }
    const orgs = nodes.filter(node => {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      return types.includes('Organization') || types.includes('Corporation');
    });
    if (orgs.length) {
      for (const org of orgs) {
        expect(String(org.name || ''), path).toMatch(/EnerTchad/i);
        if (org.url) expect(new URL(org.url).hostname, path).toBe(new URL(url).hostname);
      }
    }
    await page.close();
  }
});

test('metadata — strategic pages have unique descriptive titles', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs', '/societe.html'];
  const titles = [];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const title = await page.title();
    expect(title.length, path).toBeGreaterThan(10);
    titles.push([path, title.trim().toLowerCase()]);
    await page.close();
  }
  const normalized = titles.map(([, title]) => title);
  expect(new Set(normalized).size, 'duplicate page titles').toBe(normalized.length);
});

test('metadata — descriptions are substantive and not duplicated', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  const descriptions = [];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const values = await page.locator('meta[name="description"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('content') || '').filter(Boolean));
    expect(values.length, path).toBe(1);
    expect(values[0].length, path).toBeGreaterThan(40);
    descriptions.push(values[0].trim().toLowerCase());
    await page.close();
  }
  expect(new Set(descriptions).size, 'duplicate meta descriptions').toBe(descriptions.length);
});

test('links — external destinations use safe target semantics when opening new tabs', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const report = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => ({
    href: a.href,
    target: a.getAttribute('target'),
    rel: a.getAttribute('rel') || ''
  })));
  for (const link of report) {
    if (link.target === '_blank') {
      expect(link.rel.toLowerCase(), link.href).toMatch(/(^|\s)noopener(\s|$)/);
    }
  }
  await page.close();
});

test('media — local image sources are HTTPS and expose stable URLs', async ({ browser }) => {
  const paths = ['/', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/contact', '/investisseurs', '/ar'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const images = await page.locator('img[src],source[srcset]').evaluateAll(nodes => nodes.map(el => el.src || el.srcset || ''));
    for (const src of images) {
      if (!src) continue;
      for (const candidate of src.split(',').map(x => x.trim().split(/\s+/)[0])) {
        if (/^https?:\/\//i.test(candidate)) expect(candidate).toMatch(/^https:\/\//i);
      }
    }
    await page.close();
  }
});

test('document structure — heading hierarchy has no skipped levels on strategic pages', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const levels = await page.locator('h1,h2,h3,h4,h5,h6').evaluateAll(nodes =>
      nodes.map(n => Number(n.tagName.slice(1))).filter(Boolean)
    );
    expect(levels.filter(level => level === 1).length, path).toBe(1);
    let previous = 1;
    for (const level of levels) {
      if (level > previous + 1) throw new Error(path + ': skipped heading level H' + previous + ' → H' + level);
      previous = level;
    }
    await page.close();
  }
});

test('resources — stylesheets and scripts are not duplicated unnecessarily', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.evaluate(() => {
      const normalize = value => {
        try { const u = new URL(value, location.href); u.hash = ''; return u.href; } catch { return value; }
      };
      const styles = [...document.querySelectorAll('link[rel="stylesheet"][href]')].map(n => normalize(n.href));
      const scripts = [...document.querySelectorAll('script[src]')].map(n => normalize(n.src));
      const duplicateCount = values => values.length - new Set(values).size;
      return { styleDuplicates: duplicateCount(styles), scriptDuplicates: duplicateCount(scripts) };
    });
    expect(report.styleDuplicates, path).toBe(0);
    expect(report.scriptDuplicates, path).toBe(0);
    await page.close();
  }
});

test('document integrity — only one visible primary navigation landmark and one main content landmark', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.evaluate(() => ({
      mains: document.querySelectorAll('main').length,
      navs: [...document.querySelectorAll('nav')].filter(n => {
        const style = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && r.width > 0 && r.height > 0;
      }).length
    }));
    expect(report.mains, path).toBe(1);
    expect(report.navs, path).toBeGreaterThan(0);
  }
});

test('performance — images declare decoding and below-fold loading intent', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const report = await page.locator('img').evaluateAll(images => images.map(img => {
    const r = img.getBoundingClientRect();
    return {
      src: img.currentSrc || img.src,
      loading: img.getAttribute('loading'),
      decoding: img.getAttribute('decoding'),
      aboveFold: r.top < innerHeight && r.bottom > 0
    };
  }));
  for (const image of report) {
    if (!image.src) continue;
    expect(image.decoding, image.src).toBeTruthy();
    if (!image.aboveFold) expect(image.loading, image.src).toBe('lazy');
  }
  await page.close();
});

test('performance — no oversized inline data payloads in HTML attributes', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/', '/tchaditech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.evaluate(() => {
      const html = document.documentElement.outerHTML;
      const dataUrls = html.match(/data:[^"'\\s>]+/gi) || [];
      return {
        count: dataUrls.length,
        largest: Math.max(0, ...dataUrls.map(value => value.length))
      };
    });
    expect(report.largest, path).toBeLessThan(250000);
    await page.close();
  }
});

test('localization — language alternates remain mutually consistent', async ({ browser }) => {
  const expected = {
    '/': { lang: 'fr', fr: '/', en: '/index-en', ar: '/ar', x: '/' },
    '/index-en': { lang: 'en', fr: '/', en: '/index-en', ar: '/ar', x: '/' },
    '/ar': { lang: 'ar', fr: '/', en: '/index-en', ar: '/ar', x: '/' }
  };
  for (const [path, target] of Object.entries(expected)) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    expect(await page.locator('html').getAttribute('lang'), path).toBe(target.lang);
    if (target.lang === 'ar') expect(await page.locator('html').getAttribute('dir'), path).toBe('rtl');
    for (const [hreflang, href] of Object.entries({ fr: target.fr, en: target.en, ar: target.ar, 'x-default': target.x })) {
      const actual = await page.locator('link[rel="alternate"][hreflang="' + hreflang + '"]').getAttribute('href');
      expect(new URL(actual, url).pathname, path + ' ' + hreflang).toBe(new URL(href, url).pathname);
    }
    await page.close();
  }
});

test('navigation — internal links do not expose malformed or javascript URLs', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const hrefs = await page.locator('a[href]').evaluateAll(nodes => nodes.map(a => a.getAttribute('href') || ''));
    for (const href of hrefs) {
      expect(href.trim(), path).not.toMatch(/^javascript:/i);
      if (href.trim()) {
        expect(href, path).not.toMatch(/[\u0000-\u001F]/);
      }
    }
    await page.close();
  }
});

test('forms — submit controls are explicit and actionable', async ({ browser }) => {
  const paths = ['/contact', '/investisseurs', '/carrieres'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const controls = await page.locator('form button, form input[type="submit"], form input[type="button"]').evaluateAll(nodes => nodes.map(el => ({
      disabled: el.hasAttribute('disabled'),
      text: (el.textContent || el.getAttribute('value') || '').trim(),
      aria: el.getAttribute('aria-label'),
      type: el.getAttribute('type')
    })));
    for (const control of controls) {
      expect(control.disabled, path).toBeFalsy();
      expect(control.text || control.aria, path).toBeTruthy();
      expect(['submit','button'].includes(control.type || 'submit'), path).toBeTruthy();
    }
    await page.close();
  }
});

test('interaction — keyboard focus reaches primary controls', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const result = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')]
      .filter(el => {
        const style = getComputedStyle(el);
        return !el.hasAttribute('disabled') &&
          el.getAttribute('tabindex') !== '-1' &&
          style.display !== 'none' &&
          style.visibility !== 'hidden';
      });
    const sample = candidates.slice(0, 12);
    sample.forEach(el => el.focus());
    return sample.filter(el => document.activeElement === el).length;
  });
  expect(result).toBeGreaterThan(0);
  await page.close();
});

test('runtime — page errors are not emitted during initial load', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/', '/tchaditech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(new URL(path, url).href, { waitUntil: 'networkidle', timeout: 45000 });
    expect(errors, path).toEqual([]);
    await page.close();
  }
});

test('assets — critical local resources use stable canonical paths', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const resources = await page.evaluate(() => [
    ...document.querySelectorAll('link[href],script[src],img[src]')
  ].map(el => el.href || el.src).filter(Boolean));
  for (const resource of resources) {
    const parsed = new URL(resource);
    if (parsed.origin === location.origin) {
      expect(parsed.pathname, resource).not.toMatch(/(?:\?|&)(?:v|ver|version|cacheBust|cb)=\d+/i);
    }
  }
  await page.close();
});

test('html — critical metadata appears before body content', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.evaluate(() => {
      const head = document.head;
      return {
        title: !!head.querySelector('title'),
        description: !!head.querySelector('meta[name="description"]'),
        canonical: !!head.querySelector('link[rel="canonical"]'),
        viewport: !!head.querySelector('meta[name="viewport"]')
      };
    });
    expect(report.title, path).toBeTruthy();
    expect(report.description, path).toBeTruthy();
    expect(report.canonical, path).toBeTruthy();
    expect(report.viewport, path).toBeTruthy();
    await page.close();
  }
});

test('routes — representative public routes resolve successfully', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs', '/carrieres', '/societe.html'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000, maxRedirects: 5 });
    expect(response.status(), path).toBeGreaterThanOrEqual(200);
    expect(response.status(), path).toBeLessThan(400);
    expect(response.headers()['content-type'] || '', path).toMatch(/text\/html/i);
  }
});

test('routes — public HTML pages avoid accidental noindex directives', async ({ request }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000, maxRedirects: 5 });
    expect(response.status(), path).toBeLessThan(400);
    const html = await response.text();
    const robots = [...html.matchAll(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/gi)].map(m => m[1].toLowerCase());
    for (const value of robots) expect(value, path).not.toMatch(/\bnoindex\b/);
  }
});

test('headers — public pages retain baseline browser security headers', async ({ request }) => {
  const response = await request.get(new URL('/', url).href, { timeout: 30000 });
  const headers = response.headers();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBeTruthy();
  expect(headers['x-frame-options']).toBeTruthy();
  expect(headers['strict-transport-security']).toMatch(/max-age=\d+/i);
});

test('content — strategic pages contain meaningful primary content', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/amont/', '/intermediaire/', '/aval/', '/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/', '/contact', '/investisseurs'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.evaluate(() => {
      const main = document.querySelector('main');
      const text = (main?.innerText || '').replace(/\s+/g, ' ').trim();
      const h1 = main?.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      return { textLength: text.length, h1Length: h1.length };
    });
    expect(report.textLength, path).toBeGreaterThan(150);
    expect(report.h1Length, path).toBeGreaterThan(3);
    await page.close();
  }
});

test('html integrity — images do not use empty or placeholder alt text', async ({ browser }) => {
  const paths = ['/', '/index-en', '/ar', '/contact', '/investisseurs', '/greentech/', '/tchaditech/'];
  for (const path of paths) {
    const page = await browser.newPage();
    await page.goto(new URL(path, url).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    const report = await page.locator('img').evaluateAll(images => images.map(img => ({
      alt: img.getAttribute('alt'),
      decorative: img.getAttribute('aria-hidden') === 'true' || img.getAttribute('role') === 'presentation'
    })));
    for (const image of report) {
      if (!image.decorative) expect((image.alt || '').trim().length, path).toBeGreaterThan(0);
    }
    await page.close();
  }
});

test('visual system — consolidated tokens and cleanup invariants are present', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const report = await page.evaluate(() => {
    const css = [...document.styleSheets].flatMap(sheet => {
      try { return [...sheet.cssRules].map(rule => rule.cssText).join('\n'); } catch { return ''; }
    });
    return {
      tokens: ['--et-color-ink','--et-color-accent','--et-radius-md','--et-shadow-soft','--et-space-4'].every(token => css.includes(token)),
      glassEffects: css.includes('backdrop-filter'),
      reducedTransparency: css.includes('prefers-reduced-transparency'),
      legacyV3Removed: !css.includes('Liquid Glass system v3'),
      duplicateTokenLayerRemoved: !css.includes('VISUAL SYSTEM v1 — consolidated premium tokens')
    };
  });
  expect(report.tokens).toBeTruthy();
  expect(report.glassEffects).toBeTruthy();
  expect(report.reducedTransparency).toBeTruthy();
  expect(report.legacyV3Removed).toBeTruthy();
  expect(report.duplicateTokenLayerRemoved).toBeTruthy();
  await page.close();
});

test('visual css hygiene — historical override markers are absent and core chrome stays bounded', async ({ request }) => {
  const cssPaths = ['/assets/chrome/modern-ui-2026.css', '/assets/chrome/nav_a.css'];
  for (const path of cssPaths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const css = await response.text();
    expect(css, path).not.toMatch(/\bCh\d+\b/);
    expect(css, path).not.toContain('Liquid Glass system v3');
  }
  const nav = await request.get(new URL('/assets/chrome/nav_a.css', url).href, { timeout: 30000 });
  expect((await nav.text()).length).toBeLessThan(60000);
});

test('visual css hygiene — shared chrome stays bounded and legacy glass markers remain absent', async ({ request }) => {
  const cssPaths = [
    '/assets/chrome/modern-ui-2026.css',
    '/assets/chrome/nav_a.css',
    '/assets/chrome/modern-inner-2026.css'
  ];
  let importantCount = 0;
  for (const path of cssPaths) {
    const response = await request.get(new URL(path, url).href, { timeout: 30000 });
    expect(response.status(), path).toBe(200);
    const css = await response.text();
    expect(css, path).not.toMatch(/\bCh\d+\b/);
    expect(css, path).not.toContain('Liquid Glass system v3');
    importantCount += (css.match(/!important/g) || []).length;
  }
  expect(importantCount).toBeLessThanOrEqual(220);
});
