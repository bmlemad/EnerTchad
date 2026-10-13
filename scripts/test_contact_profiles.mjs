import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync('assets/chrome/contact_profiles.js', 'utf8');
function fixture(lang, search = '') {
  const english = lang === 'en';
  const names = english ? ['Supply / B2B contract', 'E&P operator — study / pilot / OFS', 'Industrial or technical partnership', 'Public contracts / Institutions (B2G)', 'Investment', 'Application / Talent', 'Press', 'Other'] : ['Approvisionnement / Contrat B2B', 'Opérateur E&P — étude / pilote / OFS', 'Partenariat industriel ou technique', 'Marchés publics / Institutions (B2G)', 'Investissement', 'Candidature / Talents', 'Presse', 'Autre'];
  const options = [{ value: '', dataset: {} }, ...names.map(value => ({ value, dataset: {} })), ...['particulier', 'fournisseur', 'centrale-achat', 'achats'].map(profile => ({ value: profile, dataset: { contactProfile: profile } }))];
  const listeners = {};
  const select = { options, value: '', addEventListener(name, callback) { listeners[name] = callback; } };
  const links = ['/contact?source=menu#formulaire', '/contact-en', 'https://other.example/contact', '/achats', 'mailto:', '/contact-en?profil=invest', '/contact-en?profil=fournisseur'].map(href => ({ href, textContent: '', attrs: {}, getAttribute(name) { return name === 'href' ? this.href : (this.attrs[name] || null); }, setAttribute(name, value) { if (name === 'href') this.href = value; else this.attrs[name] = value; } }));
  runInNewContext(script, { URL, URLSearchParams, location: { search, origin: 'https://enertchad.com' }, document: { documentElement: { lang }, getElementById() { return { querySelector() { return select; } }; }, querySelectorAll() { return links; } } });
  return { select, links, change(value) { select.value = value; listeners.change(); } };
}

test('all supported request types preselect and survive language switching in both languages', () => {
  for (const lang of ['fr', 'en']) {
    for (const profile of ['ep', 'b2b', 'partenariat', 'b2g', 'invest', 'talents', 'presse', 'autre', 'particulier', 'fournisseur', 'centrale-achat', 'achats']) {
      const f = fixture(lang, '?profil=' + profile);
      assert.notEqual(f.select.value, '', lang + ' ' + profile);
      assert.equal(new URL(f.links[1].href, 'https://enertchad.com').searchParams.get('profil'), profile);
    }
  }
});

test('a changed selection replaces the incoming context and preserves other URL details', () => {
  const f = fixture('en', '?profil=invest');
  f.change('fournisseur');
  assert.equal(f.links[0].href, '/contact?source=menu&profil=fournisseur#formulaire');
  assert.equal(f.links[1].href, '/contact-en?profil=fournisseur');
});

test('selection works without an incoming profile and clearing removes stale context', () => {
  const f = fixture('fr');
  f.change('achats');
  assert.equal(f.links[1].href, '/contact-en?profil=achats');
  f.change('');
  assert.equal(f.links[1].href, '/contact-en');
});

test('unknown context and unrelated destinations do not propagate', () => {
  const f = fixture('en', '?profil=unknown');
  assert.equal(f.select.value, '');
  assert.equal(f.links[1].href, '/contact-en');
  f.change('Investment');
  assert.deepEqual(f.links.slice(2).map(link => link.href), ['https://other.example/contact', '/achats', 'mailto:', '/contact-en?profil=invest', '/contact-en?profil=fournisseur']);
});


test('dedicated investor and supplier links keep their own profile after selection changes', () => {
  const f = fixture('en', '?profil=achats');
  assert.equal(f.links[5].href, '/contact-en?profil=invest');
  assert.equal(f.links[6].href, '/contact-en?profil=fournisseur');
  f.change('Investment');
  f.change('');
  assert.equal(f.links[5].href, '/contact-en?profil=invest');
  assert.equal(f.links[6].href, '/contact-en?profil=fournisseur');
});

test('language links still follow selection when they already carry a profile', () => {
  const f = fixture('en', '?profil=achats');
  const language = f.links[5];
  language.attrs['aria-label'] = 'Version française';
  f.change('fournisseur');
  assert.equal(language.href, '/contact-en?profil=fournisseur');
});

test('mobile language labels and generic cloned links follow the current selection', () => {
  const f = fixture('en', '?profil=achats');
  const language = f.links[5];
  language.textContent = 'Français';
  const clonedGeneric = { ...f.links[0], attrs: { ...f.links[0].attrs } };
  f.links.push(clonedGeneric);
  f.change('fournisseur');
  assert.equal(language.href, '/contact-en?profil=fournisseur');
  assert.equal(new URL(clonedGeneric.href, 'https://enertchad.com').searchParams.get('profil'), 'fournisseur');
});
