import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withMobileFixes, TAGLINE_STYLE, BAND_IMAGE_STYLE, BACK_TO_TOP_STYLE } from '../lib/mobile-fixes.js';

// Audit design du 20 novembre 2026 : slogan du pied de page et image des bandes immersives sur mobile.
test('mobile fixes — footer tagline is no longer capped, header tagline is untouched', () => {
  const html = '<header><span class="brand-tx et-tag"><small>S</small></span></header><footer><a class="brand"><span class="brand-tx et-tag"><small>S</small></span></a></footer>';
  const out = withMobileFixes(html);
  assert.equal(out, `<header><span class="brand-tx et-tag"><small>S</small></span></header><footer><a class="brand"><span class="brand-tx et-tag" style="${TAGLINE_STYLE}"><small>S</small></span></a></footer>`);
  assert.equal(withMobileFixes(out), out, 'idempotent');
});

test('mobile fixes — band image fills its band', () => {
  const html = '<section class="vi-band"><img class="vi-band-img" aria-hidden="true" alt="" src="/a.webp"></section>';
  const out = withMobileFixes(html);
  assert.ok(out.includes(`<img class="vi-band-img" style="${BAND_IMAGE_STYLE}" aria-hidden="true"`));
  assert.equal(withMobileFixes(out), out, 'idempotent');
});

for (const file of ['gouvernance.html', 'gouvernance-en.html', 'leadership.html', 'engagements.html', 'aval/reseau.html']) test(`mobile fixes — ${file} keeps its text and gains only style attributes`, () => {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const out = withMobileFixes(html);
  const strip = s => s.replace(/ style="(?:max-width:none|height:100%!important)"/g, '').replace('<button style="display:var(--et-totop,grid)!important"', '<button');
  assert.equal(strip(out), html);
  assert.equal((out.match(/class="vi-band-img" style="/g) || []).length, (html.match(/class="vi-band-img"/g) || []).length);
});

test('mobile fixes — back-to-top button reads its display from --et-totop', () => {
  const html = '<button type="button" id="toTop" aria-label="Retour en haut"><svg></svg></button><button id="other">x</button>';
  const out = withMobileFixes(html);
  assert.equal(out, `<button style="${BACK_TO_TOP_STYLE}" type="button" id="toTop" aria-label="Retour en haut"><svg></svg></button><button id="other">x</button>`);
  assert.equal(withMobileFixes(out), out, 'idempotent');
  const css = readFileSync(new URL('../assets/chrome/audience-consent.js', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:768px\)\{:root\{--et-totop:none\}\}/);
});

test('mobile fixes — non-string input is returned as is', () => {
  assert.equal(withMobileFixes(undefined), undefined);
});
