import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBlockFolds } from '../lib/block-folds.js';
import { withPageFolds } from '../lib/page-folds.js';

// Lot 147 : chapitres repliés sur Produits raffinés et Réseau de stations ; aucun texte, lien ou identifiant ne disparaît.
const sorted = list => [...list].sort();
const words = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<summary aria-label[\s\S]*?<\/summary>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const pages = { 'aval/produits.html': 2, 'aval/produits-en.html': 2, 'aval/reseau.html': 5, 'aval/reseau-en.html': 5 };

for (const [file, folds] of Object.entries(pages)) test(`page folds — ${file}`, () => {
  const before = withBlockFolds(readFileSync(file, 'utf8')), after = withPageFolds(before);
  assert.equal(withPageFolds(after), after, 'idempotent');
  const opened = after.split('data-page-fold>').slice(1);
  assert.equal(opened.length, folds);
  assert.ok(!/data-page-fold open/.test(after), 'closed by default');
  assert.equal(words(after), words(before), 'text kept, in the same order');
  assert.deepEqual(sorted(after.match(/href="[^"]*"/g)), sorted(before.match(/href="[^"]*"/g)), 'links kept');
  const added = before.includes('id="pp-bfold-css"') ? [] : ['id="pp-bfold-css"', 'id="pp-bfold-js"'];
  assert.deepEqual(sorted(after.match(/\bid="[^"]+"/g)), sorted([...before.match(/\bid="[^"]+"/g), ...added]), 'ids kept');
  for (const fold of opened) assert.ok(!/class="[^"]*\bpp-(?:link|btn)\b|data-et-action=/.test(fold.slice(0, fold.indexOf('</div></details>'))), 'no action link inside a fold');
  assert.equal((after.match(/id="pp-bfold-js"/g) || []).length, 1, 'one fold script');
  if (file.includes('reseau')) assert.ok(/class="svc-head reveal"[^>]*>(?:(?!data-page-fold)[\s\S])*?<figure/.test(after), 'the section lead stays open');
});

test('page folds — other pages are untouched', () => {
  for (const file of ['index.html', 'aval/distribution.html', 'aval/index.html', 'amont/eor.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withPageFolds(html), html);
  }
});
