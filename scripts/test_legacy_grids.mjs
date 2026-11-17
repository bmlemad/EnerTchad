import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withLegacyGrids } from '../lib/legacy-grids.js';

// Lot 142 : la grille de la page Distribution est réparée par des styles en ligne ; le contenu ne change pas.
const strip = html => html.replace(/ style="(?:grid-column:1\/-1!important|display:grid!important)(?:;(?:grid-column:1\/-1!important|display:grid!important))*"/g, '').replace(' data-legacy-grid', '').replace(/<style id="pp-lgrid-css">[^<]*<\/style>/, '');

for (const file of ['aval/distribution.html', 'aval/distribution-en.html']) test(`legacy grid — ${file}`, () => {
  const before = readFileSync(file, 'utf8'), after = withLegacyGrids(before);
  assert.equal(withLegacyGrids(after), after, 'idempotent');
  assert.equal(strip(after), before, 'only inline layout styles are added');
  const detail = after.match(/<div[^>]*\bid="dx"[^>]*>/)[0];
  assert.ok(detail.includes('grid-column:1/-1!important') && detail.includes('display:grid!important'), 'the detail chapter spans the full width as a grid');
  assert.ok((after.match(/display:grid!important/g) || []).length >= 8, 'inner card lists are grids again');
  assert.ok(!/<article[^>]*style=/.test(after), 'cards keep their own column');
});

test('legacy grid — other pages are untouched', () => {
  for (const file of ['index.html', 'amont/eor.html', 'aval/reseau.html', 'aval/produits.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withLegacyGrids(html), html);
  }
});
