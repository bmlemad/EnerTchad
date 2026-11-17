import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBlockFolds } from '../lib/block-folds.js';

// Lot 137 : la suite des blocs longs se replie ; aucun texte, lien ou identifiant ne disparaît.
const sorted = list => [...list].sort();
const words = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<summary[\s\S]*?<\/summary>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

for (const file of ['investisseurs.html', 'investisseurs-en.html', 'amont/services-ep.html', 'amont/services-ep-en.html']) test(`block folds — ${file}`, () => {
  const before = readFileSync(file, 'utf8'), after = withBlockFolds(before);
  assert.equal(withBlockFolds(after), after, 'idempotent');
  const opened = (after.match(/<details class="pp-bfold" data-block-fold>/g) || []).length;
  assert.ok(opened >= 8, `${opened} folds`);
  assert.equal((after.match(/<\/div><\/details>/g) || []).length - (before.match(/<\/div><\/details>/g) || []).length, opened, 'each fold is closed');
  assert.ok(!/data-block-fold open/.test(after), 'closed by default');
  assert.deepEqual(sorted(after.match(/\bid="[^"]+"/g)), sorted([...before.match(/\bid="[^"]+"/g), 'id="pp-bfold-css"', 'id="pp-bfold-js"']), 'ids kept');
  assert.deepEqual(sorted(after.match(/href="[^"]*"/g)), sorted(before.match(/href="[^"]*"/g)), 'links kept');
  assert.equal(words(after), words(before), 'text kept, in the same order');
  if (file.startsWith('investisseurs')) for (const label of file.includes('-en') ? ['Read the strategic editorial', 'Open the Notebooks RSS feed'] : ['Lire l’éditorial stratégique', 'Ouvrir le flux RSS des Carnets']) {
    const at = after.indexOf(label);
    assert.ok(at > 0 && after.lastIndexOf('</details>', at) > after.lastIndexOf('data-block-fold>', at), `${label} stays outside the folds`);
  }
  // Chaque repli vit dans la colonne de texte d'un bloc titré, jamais autour du titre.
  for (const fold of after.split('<details class="pp-bfold" data-block-fold>').slice(1)) assert.ok(!fold.slice(0, fold.indexOf('</details>')).includes('class="pp-bh"'));
});

test('block folds — other pages are untouched', () => {
  for (const file of ['index.html', 'clients.html', 'amont/index.html', 'engagements.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withBlockFolds(html), html);
  }
});
