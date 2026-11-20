import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withBlockFolds } from '../lib/block-folds.js';

// Lot 137 : la suite des blocs longs se replie ; aucun texte, lien ou identifiant ne disparaît.
const sorted = list => [...list].sort();
const words = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<summary[\s\S]*?<\/summary>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const pages = { 'investisseurs.html': 8, 'investisseurs-en.html': 8, 'amont/services-ep.html': 8, 'amont/services-ep-en.html': 8, 'engagements.html': 4, 'engagements-en.html': 4, 'societe.html': 10, 'societe-en.html': 10, 'aval/produits.html': 8, 'aval/produits-en.html': 8 };
for (const [file, least] of Object.entries(pages)) test(`block folds — ${file}`, () => {
  const before = readFileSync(file, 'utf8'), after = withBlockFolds(before);
  assert.equal(withBlockFolds(after), after, 'idempotent');
  const opened = (after.match(/<details class="pp-bfold" data-block-fold>/g) || []).length;
  assert.ok(opened >= least, `${opened} folds`);
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
  for (const fold of after.split('<details class="pp-bfold" data-block-fold>').slice(1)) {
    const body = fold.slice(0, fold.indexOf('</div></details>'));
    assert.ok(!body.includes('class="pp-bh"'));
    assert.ok(!/class="[^"]*\bpp-(?:link|btn)\b|data-et-action=/.test(body), 'no action link inside a fold');
  }
});

test('block folds — other pages are untouched', () => {
  for (const file of ['index.html', 'projets.html', 'amont/index.html', 'clients.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withBlockFolds(html), html);
  }
});

// Remarque de relecture (17 novembre 2026) : les mêmes blocs se replient en français et en anglais (seuil de mots propre à chaque langue).
test('block folds — same number of folds in French and English', () => {
  for (const [fr, en] of [['investisseurs.html', 'investisseurs-en.html'], ['amont/services-ep.html', 'amont/services-ep-en.html'], ['engagements.html', 'engagements-en.html'], ['societe.html', 'societe-en.html'], ['aval/produits.html', 'aval/produits-en.html']]) {
    const count = file => (withBlockFolds(readFileSync(file, 'utf8')).match(/<details class="pp-bfold" data-block-fold>/g) || []).length;
    assert.equal(count(en), count(fr), `${fr} / ${en}`);
  }
});

// Harmonisation du 20 novembre 2026 : un seul libellé pour tous les replis de texte, dans les trois transformations.
test('text folds share one label and one summary style', async () => {
  const { withLegacyGrids } = await import('../lib/legacy-grids.js');
  const { withPageFolds } = await import('../lib/page-folds.js');
  const { LABEL, CLOSE, SUMMARY_STYLE } = await import('../lib/block-folds.js');
  for (const [file, lang] of [['investisseurs.html', 'fr'], ['investisseurs-en.html', 'en'], ['societe.html', 'fr'], ['aval/produits.html', 'fr'], ['aval/produits-en.html', 'en'], ['aval/distribution.html', 'fr'], ['amont/eor-en.html', 'en'], ['aval/reseau.html', 'fr'], ['aval/reseau-en.html', 'en']]) {
    const html = withPageFolds(withLegacyGrids(withBlockFolds(readFileSync(file, 'utf8'))));
    const summaries = html.match(/<details class="pp-bfold[^>]*><summary[^>]*>[\s\S]*?<\/summary>/g) || [];
    assert.ok(summaries.length >= 3, file);
    for (const summary of summaries) {
      assert.ok(summary.includes(`<span class="pp-bfold-o">${LABEL[lang]}</span><span class="pp-bfold-c">${CLOSE[lang]}</span>`), file + ' label');
      assert.ok(summary.includes(`aria-label="${LABEL[lang]} — `) && summary.includes(`style="${SUMMARY_STYLE}"`), file + ' name and style');
    }
  }
});

