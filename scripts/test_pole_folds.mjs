import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withVisualPriorities } from '../lib/visual-priorities.js';
import { withPoleFolds } from '../lib/pole-folds.js';

// Lot 136 : le détail des pages de pôle est regroupé avant le contact et replié ; aucun texte, lien ou identifiant ne disparaît.
const pages = { 'amont/index.html': 6, 'pole-amont-en.html': 6, 'intermediaire/index.html': 7, 'pole-intermediaire-en.html': 7, 'aval/index.html': 7, 'pole-aval-en.html': 7, 'petrochimie/index.html': 4, 'pole-enerchimie-en.html': 4,
  // Lot 141 : les quatre pôles de service.
  'greentech/index.html': 5, 'pole-greentech-en.html': 5, 'enerconseils/index.html': 4, 'pole-enerconseils-en.html': 4, 'tchaditech/index.html': 5, 'pole-tchaditech-en.html': 5, 'tchaditude/index.html': 5, 'pole-tchaditude-en.html': 5 };
const words = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<summary>[\s\S]*?<\/summary>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const sorted = list => [...list].sort();

for (const [file, count] of Object.entries(pages)) test(`pole detail folds — ${file}`, () => {
  const before = withVisualPriorities(readFileSync(file, 'utf8'));
  const after = withPoleFolds(before);
  assert.equal(withPoleFolds(after), after, 'idempotent');
  const folds = after.match(/<details class="pp-dfold" data-detail-fold>/g) || [];
  assert.equal(folds.length, count);
  assert.ok(!/<details class="pp-dfold" data-detail-fold open/.test(after), 'closed by default');
  assert.deepEqual(sorted(after.match(/<section[^>]*\bid="[^"]+"/g).map(s => s.match(/id="([^"]+)"/)[1]).filter(id => id !== 'detail-pole')), sorted(before.match(/<section[^>]*\bid="[^"]+"/g).map(s => s.match(/id="([^"]+)"/)[1])), 'section ids kept');
  assert.deepEqual(sorted(after.match(/href="[^"]*"/g)), sorted(before.match(/href="[^"]*"/g)), 'links kept');
  // Hors libellés de repli, tous les mots d'origine restent présents.
  const kept = words(after), lost = words(before).split(' ').filter(word => word.length > 3 && !kept.includes(word));
  assert.deepEqual(lost, []);
  assert.equal((after.match(/<h2\b/g) || []).length, (before.match(/<h2\b/g) || []).length + 1, 'one group heading added');
  assert.ok(after.indexOf('id="detail-pole"') < after.indexOf('data-detail-fold') && after.lastIndexOf('data-detail-fold') < after.search(/<section id="(?:carnets-|offre-tiers)/), 'folds sit between the visible sections and the contact chapter');
  assert.ok(!after.includes('data-mobile-fold open'), 'lot 132 mobile folds are replaced');
  assert.ok(after.includes('id="pp-dfold-js"') && after.includes('beforeprint') && after.includes('hashchange'));
  if (file.includes('amont')) assert.ok(/<section id="offre"[^>]*>(?!<details)/.test(after), 'upstream technical offer stays visible');
});

test('pole detail folds — other pages are untouched', () => {
  for (const file of ['index.html', 'contact.html', 'tchaditech/outils.html', 'amont/eor.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withPoleFolds(html), html);
  }
});
