import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withButtonCoherence, MOD_BUTTON_STYLE, SUBMIT_STYLE, HOME_PRIMARY_STYLE } from '../lib/button-coherence.js';

// Audit design du 20 novembre 2026 : trois boutons ramenés au bouton d'action maison.
test('button coherence — module buttons lose their rounded corners', () => {
  const html = '<a class="mod-button" href="/contact">Discuter →</a><summary class="mod-button">Détail</summary><a class="mod-button-x">x</a>';
  const out = withButtonCoherence(html);
  assert.equal(out, `<a class="mod-button" style="${MOD_BUTTON_STYLE}" href="/contact">Discuter →</a><summary class="mod-button" style="${MOD_BUTTON_STYLE}">Détail</summary><a class="mod-button-x">x</a>`);
  assert.equal(withButtonCoherence(out), out, 'idempotent');
});

test('button coherence — contact submit follows the house button', () => {
  const out = withButtonCoherence('<form><button id="ctSend" type="submit">Envoyer ma demande</button></form>');
  assert.equal(out, `<form><button id="ctSend" type="submit" style="${SUBMIT_STYLE}">Envoyer ma demande</button></form>`);
  assert.equal(withButtonCoherence(out), out, 'idempotent');
});

test('button coherence — home primary button only on the home page', () => {
  const link = '<a class="et-primary" href="/societe#vision">Découvrir la vision</a>';
  assert.equal(withButtonCoherence(`<main id="main-content" class="et-home hm-review">${link}</main>`),
    `<main id="main-content" class="et-home hm-review"><a class="et-primary" style="${HOME_PRIMARY_STYLE}" href="/societe#vision">Découvrir la vision</a></main>`);
  assert.equal(withButtonCoherence(`<main class="pp">${link}</main>`), `<main class="pp">${link}</main>`);
});

for (const file of ['contact.html', 'contact-en.html', 'aval/index.html', 'enerconseils/index.html']) test(`button coherence — ${file} gains only style attributes`, () => {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const out = withButtonCoherence(html);
  assert.equal(out.replace(/ style="(?:border-radius:0!important|border-radius:0;font-family:inherit;min-height:56px;margin-top:16px|min-height:56px!important)"/g, ''), html);
});

test('button coherence — non-string input is returned as is', () => {
  assert.equal(withButtonCoherence(null), null);
});
