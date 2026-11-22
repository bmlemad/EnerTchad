import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withButtonCoherence, MOD_BUTTON_STYLE, SUBMIT_STYLE, HOME_PRIMARY_STYLE, POLE_GOLD_STYLE, ISV_STYLE, ATLAS_STYLE,
  SUPPLIER_SUBMIT_STYLE, PILL_STYLE, LABELS } from '../lib/button-coherence.js';

// Audit design du 20 novembre 2026, étendu par l'audit « boutons face aux majors » du 22 novembre 2026.
test('button coherence — module buttons lose their rounded corners and get the canonical label', () => {
  const html = '<a class="mod-button" href="/contact">Discuter de cette étude →</a><summary class="mod-button">Détail</summary><a class="mod-button-x">x</a>';
  const out = withButtonCoherence(html);
  assert.equal(out, `<a class="mod-button" style="${MOD_BUTTON_STYLE}" href="/contact">Discuter de ce projet</a><summary class="mod-button" style="${MOD_BUTTON_STYLE}">Détail</summary><a class="mod-button-x">x</a>`);
  assert.equal(withButtonCoherence(out), out, 'idempotent');
});

test('button coherence — contact submit becomes the gold primary', () => {
  const out = withButtonCoherence('<form><button id="ctSend" type="submit">Envoyer ma demande</button></form>');
  assert.equal(out, `<form><button id="ctSend" type="submit" style="${SUBMIT_STYLE}">Envoyer ma demande</button></form>`);
  assert.equal(withButtonCoherence(out), out, 'idempotent');
});

test('button coherence — home primary button only on the home page, secondary arrows removed', () => {
  const link = '<a class="et-primary" href="/societe#vision">Découvrir la vision</a><a class="et-secondary" href="/projets">Projets <span aria-hidden="true">→</span></a>';
  assert.equal(withButtonCoherence(`<main id="main-content" class="et-home hm-review">${link}</main>`),
    `<main id="main-content" class="et-home hm-review"><a class="et-primary" style="${HOME_PRIMARY_STYLE}" href="/societe#vision">Découvrir la vision</a><a class="et-secondary" href="/projets">Projets</a></main>`);
  assert.equal(withButtonCoherence(`<main class="pp">${link}</main>`).includes(HOME_PRIMARY_STYLE), false);
});

test('button coherence — off-standard colours and shapes join the house button', () => {
  assert.equal(withButtonCoherence('<a class="pp-btn pp-btn-gold" href="/x">Devenir client</a>'), `<a class="pp-btn pp-btn-gold" href="/x" style="${POLE_GOLD_STYLE}">Devenir client</a>`);
  assert.equal(withButtonCoherence('<a class="isv-cta" href="/contact">Discuter ce périmètre avec nous →</a>'), `<a class="isv-cta" href="/contact" style="${ISV_STYLE}">Discuter de ce projet</a>`);
  assert.equal(withButtonCoherence('<a class="btn btn-p" href="/contact" style="white-space:nowrap">Devenir partenaire ↓</a>'), `<a class="btn btn-p" href="/contact" style="white-space:nowrap;${ATLAS_STYLE}">Devenir partenaire</a>`);
  const form = '<form class="sf" id="sfForm"><input><button type="submit">Envoyer mon dossier</button></form>';
  assert.equal(withButtonCoherence(form), form.replace('<button type="submit">', `<button type="submit" style="${SUPPLIER_SUBMIT_STYLE}">`));
});

test('button coherence — arrows only for external links and downloads', () => {
  assert.equal(withButtonCoherence('<a class="pp-btn" href="https://wa.me/1">Être prévenu</a>'), '<a class="pp-btn" href="https://wa.me/1">Être prévenu ↗</a>');
  assert.equal(withButtonCoherence('<a class="pp-btn" href="/x.pdf">Télécharger ↓</a>'), '<a class="pp-btn" href="/x.pdf">Télécharger ↓</a>');
  assert.equal(withButtonCoherence('<a class="pp-btn" href="/contact">Nous écrire →</a>'), '<a class="pp-btn" href="/contact">Nous contacter</a>');
});

test('button coherence — contact pills reach 44 px', () => {
  const pill = '<a href="mailto:x" style="display:inline-flex;align-items:center;background:#1FA496;border-radius:999px;padding:9px 16px;font-size:.85rem">WhatsApp</a>';
  const out = withButtonCoherence(pill);
  assert.ok(out.includes(`font-size:.85rem;${PILL_STYLE}"`));
  assert.equal(withButtonCoherence(out), out, 'idempotent');
});

for (const file of ['contact.html', 'contact-en.html', 'aval/index.html', 'enerconseils/index.html', 'intermediaire/collecte.html', 'achats.html']) test(`button coherence — ${file} keeps its markup, idempotent, no old label left`, () => {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const out = withButtonCoherence(html);
  assert.equal(withButtonCoherence(out), out, 'idempotent');
  const tags = s => (s.match(/<[a-z]+\b/g) || []).length;
  assert.equal(tags(out), tags(html), 'no element added or removed except arrow spans');
  for (const old of Object.keys(LABELS)) assert.ok(!new RegExp(`class="(?:pp-btn[^"]*|mod-button|isv-cta)"[^>]*>${old}\\b`).test(out), `${file}: ${old}`);
});

test('button coherence — non-string input is returned as is', () => {
  assert.equal(withButtonCoherence(null), null);
});
