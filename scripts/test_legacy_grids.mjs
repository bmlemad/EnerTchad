import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withLegacyGrids } from '../lib/legacy-grids.js';

// Lots 142-143 : les grilles de Distribution et de Récupération assistée sont réparées par des styles en ligne.
// Lot 146 : leurs chapitres se replient sous leur titre. Dans les deux cas le contenu ne change pas.
const sorted = list => [...list].sort();
const words = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<summary[\s\S]*?<\/summary>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const pages = { 'aval/distribution.html': 5, 'aval/distribution-en.html': 5, 'amont/eor.html': 3, 'amont/eor-en.html': 3 };

for (const [file, folds] of Object.entries(pages)) test(`legacy grid — ${file}`, () => {
  const before = readFileSync(file, 'utf8'), after = withLegacyGrids(before);
  assert.equal(withLegacyGrids(after), after, 'idempotent');
  assert.equal(words(after), words(before), 'text kept, in the same order');
  assert.deepEqual(sorted(after.match(/href="[^"]*"/g)), sorted(before.match(/href="[^"]*"/g)), 'links kept');
  assert.deepEqual(sorted(after.match(/\bid="[^"]+"/g)), sorted([...before.match(/\bid="[^"]+"/g), 'id="pp-lgrid-css"', 'id="pp-bfold-css"', 'id="pp-bfold-js"']), 'ids kept');
  if (file.includes('distribution')) {
    const detail = after.match(/<div[^>]*\bid="dx"[^>]*>/)[0];
    assert.ok(detail.includes('grid-column:1/-1!important') && detail.includes('display:grid!important'), 'the detail chapter spans the full width as a grid');
  }
  assert.ok((after.match(/display:grid!important/g) || []).length >= 8, 'inner card lists are grids again');
  assert.ok(!/<article[^>]*style=/.test(after), 'cards keep their own column');
  // Chapitres repliés : fermés par défaut, sans lien d'action à l'intérieur, et le premier chapitre de la section reste ouvert.
  const opened = after.split('<details class="pp-bfold" data-block-fold').slice(1);
  assert.equal(opened.length, folds);
  assert.ok(!/data-block-fold[^>]* open/.test(after), 'closed by default');
  for (const fold of opened) assert.ok(!/class="[^"]*\bpp-(?:link|btn)\b|data-et-action=/.test(fold.slice(0, fold.indexOf('</div></details>'))), 'no action link inside a fold');
  assert.ok(after.indexOf('<h2') < after.indexOf('data-block-fold'), 'the page lead stays above the first fold');
});

test('legacy grid — same chapters fold in French and English', () => {
  const labels = file => (withLegacyGrids(readFileSync(file, 'utf8')).match(/data-block-fold/g) || []).length;
  assert.equal(labels('aval/distribution.html'), labels('aval/distribution-en.html'));
  assert.equal(labels('amont/eor.html'), labels('amont/eor-en.html'));
});

test('legacy grid — other pages are untouched', () => {
  for (const file of ['index.html', 'amont/services-ep.html', 'aval/reseau.html', 'aval/produits.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withLegacyGrids(html), html);
  }
});
