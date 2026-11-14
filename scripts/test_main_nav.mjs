// Lot 80 puis lot 124 : en-tête minimaliste (lib/main-nav.js, clé « header » de assets/data/navigation.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { withMainNav } from '../lib/main-nav.js';

const nav = JSON.parse(readFileSync('assets/data/navigation.json', 'utf8'));
const pages = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0')
  .filter(p => p.endsWith('.html') && !/^(?:scripts|qa|docs-sources)\//.test(p));
const navOf = html => { const i = html.indexOf('id="nav"'); return html.slice(i, html.indexOf('</nav>', i)); };
const outside = html => { const i = html.indexOf('id="nav"'); return html.slice(0, html.lastIndexOf('<', i)) + html.slice(html.indexOf('</nav>', i)); };
const routeExists = p => {
  if (['/atlas/', '/atlas-en'].includes(p)) return true;
  return existsSync(p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1) + '.html');
};

test('FR and EN headers have the same five entries, in the DG order, and one button', () => {
  assert.deepEqual(nav.header.fr.links.map(l => l[0]), ['Vision', 'Activités', 'Impact', 'Investisseurs', 'Contact']);
  assert.deepEqual(nav.header.en.links.map(l => l[0]), ['Vision', 'Activities', 'Impact', 'Investors', 'Contact']);
  assert.deepEqual(nav.header.fr.links.map(l => l[1]), ['/societe', '/nos-activites', '/engagements', '/investisseurs', '/contact']);
  assert.deepEqual(nav.header.en.links.map(l => l[1]), ['/societe-en', '/nos-activites-en', '/engagements-en', '/investisseurs-en', '/contact-en']);
  assert.deepEqual(nav.header.fr.button, ['Investisseurs', '/investisseurs']);
  assert.deepEqual(nav.header.en.button, ['Investors', '/investisseurs-en']);
  assert.equal(nav.header.fr.slogan, 'L’énergie du Tchad. Intégrée.');
  assert.equal(nav.header.en.slogan, 'Chad’s energy. Integrated.');
});

test('every internal destination of the header exists, and the full menus still exist for the footer', () => {
  for (const lang of ['fr', 'en']) {
    for (const [, href] of [...nav.header[lang].links, nav.header[lang].button]) assert(routeExists(href), lang + ' ' + href);
    const routes = new Set(['/boutique/clients', '/boutique/en/clients', '/amont/calculateur-baril-additionnel', '/configurateur-service-integre', '/atlas/', '/atlas-en']);
    for (const m of nav[lang]) for (const l of [m.overview, ...m.groups.flatMap(g => g.links)]) {
      const p = l[2].split('#')[0].split('?')[0];
      if (!routes.has(p)) assert(routeExists(p), lang + ' ' + l[2]);
    }
  }
});

test('every corporate page gets the five links, keeps everything outside the nav and stays idempotent', () => {
  let count = 0;
  for (const page of pages) {
    const before = readFileSync(page, 'utf8');
    if (!/<nav\b[^>]*class="nav nx pn"/.test(before)) continue;
    const after = withMainNav(before);
    const lang = (before.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr').slice(0, 2);
    if (!nav.header[lang]) { assert.equal(after, before, page + ' other languages untouched'); continue; }
    count++;
    assert.equal(withMainNav(after), after, page + ' idempotence');
    assert.equal(outside(after), outside(before), page + ' outside the nav');
    const n = navOf(after);
    assert.equal((n.match(/class="nav-trigger nx-direct"/g) || []).length, 5, page + ' five links');
    assert.equal((n.match(/aria-controls="nxm-/g) || []).length, 0, page + ' no dropdown');
    assert(!n.includes('nx-mega'), page + ' no panel');
    assert.equal(n.includes('nx-util-m'), navOf(before).includes('nx-util-m'), page + ' mobile utility bar');
    assert(n.includes(`class="nx-invest">${nav.header[lang].button[0]}</a>`), page + ' button');
    assert(n.includes(`<small>${nav.header[lang].slogan}</small>`), page + ' slogan');
  }
  assert(count > 200, 'corporate pages: ' + count);
});

// Lot 125 : en-tête arabe à cinq liens (lib/ar-nav.js), sans « بحث (FR) », page courante conservée.
import { withArNav } from '../lib/ar-nav.js';
import { readFileSync as readAr } from 'node:fs';
test('Arabic header: five plain links, current page marked, idempotent', () => {
  for (const [file, current] of [['ar.html', '/ar'], ['ar-contact.html', '/ar-contact'], ['ar-amont.html', '/ar-poles'], ['ar-poles.html', '/ar-poles']]) {
    const out = withArNav(readAr(new URL('../' + file, import.meta.url), 'utf8'));
    const nav = out.match(/<nav class="arh-nav" data-et-header="minimal"[^>]*>([\s\S]*?)<\/nav>/)[1];
    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(hrefs, ['/ar', '/ar-societe', '/ar-poles', '/ar-investisseurs', '/ar-contact'], file);
    assert.equal(nav.includes('/recherche'), false, file);
    assert.equal(nav.match(/aria-current="page"/g).length, 1, file);
    assert(nav.includes(`href="${current}" aria-current="page"`), file);
    assert.equal(withArNav(out), out, file + ' idempotent');
  }
});
