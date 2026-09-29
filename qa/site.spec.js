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
