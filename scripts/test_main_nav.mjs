// Lot 80 : menu principal unique (lib/main-nav.js, assets/data/navigation.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { withMainNav } from '../lib/main-nav.js';
import { navCapabilities } from './next/critical.mjs';

const nav = JSON.parse(readFileSync('assets/data/navigation.json', 'utf8'));
const pages = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0')
  .filter(p => p.endsWith('.html') && !/^(?:scripts|qa|docs-sources)\//.test(p));
const navOf = html => { const i = html.indexOf('id="nav"'); return html.slice(i, html.indexOf('</nav>', i)); };
const outside = html => { const i = html.indexOf('id="nav"'); return html.slice(0, html.lastIndexOf('<', i)) + html.slice(html.indexOf('</nav>', i)); };

test('FR and EN definitions have the same six menus and group shape', () => {
  assert.equal(nav.fr.length, 6); assert.equal(nav.en.length, 6);
  nav.fr.forEach((m, i) => {
    assert.equal(m.id, nav.en[i].id);
    assert.deepEqual(m.groups.map(g => g.links.length), nav.en[i].groups.map(g => g.links.length), m.id);
  });
});

test('every internal destination of the menu exists', () => {
  const routes = new Set(['/boutique/clients', '/boutique/en/clients', '/amont/calculateur-baril-additionnel', '/atlas/', '/atlas-en']);
  for (const lang of ['fr', 'en']) for (const m of nav[lang]) {
    for (const l of [m.overview, ...m.groups.flatMap(g => g.links)]) {
      const p = l[2].split('#')[0].split('?')[0];
      if (routes.has(p)) continue;
      const file = p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1) + '.html';
      assert(existsSync(file), lang + ' ' + l[2]);
    }
  }
});

test('every corporate page gets the six menus, keeps everything outside the menu and stays idempotent', () => {
  let count = 0;
  for (const page of pages) {
    const before = readFileSync(page, 'utf8');
    if (!/<nav\b[^>]*class="nav nx pn"/.test(before)) continue;
    const after = withMainNav(before);
    count++;
    assert.equal(withMainNav(after), after, page + ' idempotence');
    assert.equal(outside(after), outside(before), page + ' outside the menu');
    const ids = navOf(after).match(/aria-controls="nxm-[a-f]"/g) || [];
    assert.equal(ids.length, 6, page + ' menus');
    assert.equal(navOf(after).includes('nx-util-m'), navOf(before).includes('nx-util-m'), page + ' mobile utility bar');
    // navCapabilities (export) must not add a second Durabilité / Capital humain link.
    assert.equal(navCapabilities(after, page), after, page + ' capabilities already present');
  }
  assert(count > 200, 'corporate pages: ' + count);
});
