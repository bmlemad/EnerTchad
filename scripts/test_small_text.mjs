import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Audit design du 20 novembre 2026 : aucun corps de texte écrit dans ces pages ne descend sous 12 px (0,75 rem).
// Les étiquettes en capitales du design system (`.pp-k`, 11,5 px) vivent dans les feuilles liées et ne sont pas concernées ;
// les libellés des schémas SVG (px) suivent l'échelle du dessin.
for (const file of ['aval/reseau.html', 'aval/reseau-en.html', 'nos-activites.html', 'nos-activites-en.html']) {
  test(`small text — ${file} declares no font-size below .75rem`, () => {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const small = [...html.matchAll(/font-size:\s*(0?\.\d+)rem/g)].map(m => Number(m[1])).filter(v => v < 0.75);
    assert.deepEqual(small, []);
  });
}
