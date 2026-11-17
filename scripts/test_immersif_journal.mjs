import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { withImmersifJournal } from '../lib/immersif-journal.js';

// Lot 138 : une scène immersive par article du journal (33 FR, 33 EN) ; aucun texte, lien ni identifiant ne disparaît, rien n'est ajouté.
const files = readdirSync('.').filter(f => /^journal-.*\.html$/.test(f)).sort();
const words = html => html.replace(/<(script|style)[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const sorted = list => [...list].sort();
const indexOfScene = html => (html.slice(0, html.indexOf('id="im-journal-h"')).match(/<h2\b/g) || []).length;

test('journal scene — 33 articles in each language', () => {
  assert.equal(files.filter(f => !f.endsWith('-en.html')).length, 33);
  assert.equal(files.filter(f => f.endsWith('-en.html')).length, 33);
});

for (const file of files) test(`journal scene — ${file}`, () => {
  const before = readFileSync(file, 'utf8');
  const after = withImmersifJournal(before);
  assert.notEqual(after, before, 'scene added');
  assert.equal(withImmersifJournal(after), after, 'idempotent');
  assert.equal((after.match(/class="im-scene im-journal"/g) || []).length, 1, 'one scene only');
  assert.equal((after.match(/id="et-immersif-journal"/g) || []).length, 1);
  // Les mots, les liens et les identifiants d'origine sont conservés (le seul identifiant ajouté est celui de l'intertitre de la scène).
  assert.equal(words(after), words(before), 'text unchanged');
  assert.deepEqual(sorted(after.match(/href="[^"]*"/g)), sorted(before.match(/href="[^"]*"/g)), 'links kept');
  assert.deepEqual(sorted((after.match(/\bid="[^"]+"/g) || []).filter(id => id !== 'id="im-journal-h"' && id !== 'id="et-immersif-journal"')), sorted(before.match(/\bid="[^"]+"/g) || []), 'ids kept');
  assert.equal((after.match(/<h2\b/g) || []).length, (before.match(/<h2\b/g) || []).length, 'no heading added');
  // Le passage ne contient que des paragraphes, listes ou citations, de 40 à 170 mots.
  const scene = after.match(/<section class="im-scene im-journal"[\s\S]*?<\/section>/)[0];
  const tags = new Set([...scene.replace(/<img[^>]*>/, '').matchAll(/<([a-z0-9]+)/g)].map(m => m[1]));
  for (const tag of ['table', 'figure', 'script', 'style', 'svg']) assert.ok(!tags.has(tag), `no ${tag} in the scene`);
  assert.ok(!/\bjkey\b/.test(scene), 'no key figure card in the scene');
  const count = words(scene.replace(/<img[^>]*>/, '')).split(' ').length;
  assert.ok(count >= 40 && count <= 175, `passage of ${count} words`);
  assert.ok(/<img class="im-bg" aria-hidden="true" alt=""/.test(scene) && /loading="lazy"/.test(scene), 'decorative lazy background');
  assert.ok(after.includes('aria-labelledby="im-journal-h"'));
  // Même passage en français et en anglais.
  const twin = file.endsWith('-en.html') ? file.replace('-en.html', '.html') : file.replace('.html', '-en.html');
  assert.equal(indexOfScene(withImmersifJournal(readFileSync(twin, 'utf8'))), indexOfScene(after), 'same heading in FR and EN');
});

test('journal scene — other pages are untouched', () => {
  for (const file of ['index.html', 'carnets.html', 'carnets-en.html', 'contact.html', 'amont/index.html', 'clients.html']) {
    const html = readFileSync(file, 'utf8');
    assert.equal(withImmersifJournal(html), html);
  }
});
