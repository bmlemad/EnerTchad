import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { htmlToDOM } from 'html-react-parser';
import { withNavigationReview } from '../lib/navigation-review.js';
import { withYouTubeBadge } from '../lib/youtube.js';
import { renderSubsite, commercialPages, atlasPages } from './next/subsites.mjs';

function nodes(html) {
  const all = [], walk = n => { all.push(n); (n.children || []).forEach(walk); };
  htmlToDOM(html, {withStartIndices:true, withEndIndices:true}).forEach(walk); return all;
}
const digest = value => createHash('sha256').update(value).digest('hex');
const fragments = (html, tag) => nodes(html).filter(n => n.name === tag).map(n => digest(html.slice(n.startIndex, n.endIndex + 1)));
const read = path => readFileSync(path, 'utf8');
const pages = execFileSync('git', ['ls-files', '-z'], {encoding:'utf8'}).split('\0').filter(p => p.endsWith('.html') && !/^(?:scripts|qa|docs-sources)\//.test(p));

test('shared review preserves main content, scripts, contact data and remains idempotent', () => {
  assert(pages.length > 220); // lot 78 : Investor Center fondu dans /investisseurs (229 pages)
  for (const page of pages) {
    const before = read(page), after = withNavigationReview(before);
    assert.equal(withNavigationReview(after), after, page + ' idempotence');
    assert.deepEqual(fragments(after, 'main'), fragments(before, 'main'), page + ' main content');
    assert.deepEqual(fragments(after, 'script'), fragments(before, 'script'), page + ' scripts');
    assert.deepEqual(after.match(/href="(?:tel:|mailto:)[^"]*"/g), before.match(/href="(?:tel:|mailto:)[^"]*"/g), page + ' contact data');
  }
});

test('corporate resources expose documents and preserve investor-specific enquiries', () => {
  for (const en of [false, true]) {
    const source = read(en ? 'index-en.html' : 'index.html'), output = withNavigationReview(source);
    const all = nodes(output), cta = all.find(n => n.name === 'a' && n.attribs?.class === 'nx-invest');
    assert.equal(cta.attribs.href, '/contact' + (en ? '-en' : ''), '17 novembre 2026 : le bouton de l’en-tête mène au contact (il ne double plus l’entrée Investisseurs)');
    // Lot 124 : la carte « investisseurs » du méga-menu a disparu avec le menu ; la demande propre aux investisseurs reste sur la page Investisseurs.
    assert(read(en ? 'investisseurs-en.html' : 'investisseurs.html').includes('/contact' + (en ? '-en' : '') + '?profil=invest#ctForm'));
    // Lot 124 : plus de panneaux de ressources dans l'en-tête ; Publications et les autres rubriques retirées vivent dans la rangée « Ressources » du pied de page.
    const groups = all.filter(n => n.name === 'section' && n.attribs?.class?.split(' ').includes('nx-resource-group'));
    assert.equal(groups.length, 0);
    // 16 novembre 2026 : la rangée « Ressources » a disparu ; ces pages sont indexées par le Centre de connaissances, que le
    // pied de page et l'en-tête portent tous deux. La colonne d'accès garde les entrées propres à un public, la ligne légale ne répète rien.
    assert(!all.some(n => n.name === 'nav' && n.attribs?.class?.split(' ').includes('foot-resources')), 'no Resources row');
    const sx = en ? '-en' : '', hub = read(en ? 'savoirs-en.html' : 'savoirs.html');
    for (const href of ['/gouvernance' + sx, '/publications' + sx, en ? '/atlas-en' : '/atlas/', '/faq' + sx, '/carrieres' + sx, '/communiques' + sx]) assert(hub.includes('href="' + href + '"'), 'hub indexes ' + href);
    const cols = all.filter(n => n.attribs?.class?.split(' ').includes('foot-col'));
    // 17 novembre 2026 : la colonne qui répétait l'en-tête est retirée ; deux colonnes restent (accès, informations).
    assert.equal(cols.length, 2, 'two footer columns');
    // 20 novembre 2026 (décision du DG) : « Carrières » quitte l'en-tête et revient dans la colonne d'accès (quatre liens).
    assert.equal((cols[0].children || []).filter(n => n.name === 'a').length, 4);
    assert((cols[0].children || []).some(n => n.name === 'a' && n.attribs.href === '/carrieres' + sx), 'Carrières au pied de page');
    assert.equal((cols[1].children || []).filter(n => n.name === 'a').at(-1).attribs.href, '/plan-du-site' + sx);
    const hrefs = [];
    for (const zone of cols) (function walk(n) { if (n.name === 'a' && n.attribs?.href?.startsWith('/')) hrefs.push(n.attribs.href); (n.children || []).forEach(walk); })(zone);
    assert.equal(hrefs.length, new Set(hrefs).size, 'no link twice in the footer columns: ' + hrefs.filter((h, i) => hrefs.indexOf(h) !== i));
    assert.doesNotMatch(output, /et-footer-pending/, '17 novembre 2026 : plus de mention « en préparation » dans le pied de page');
    assert(!output.includes('id="fnForm"'));
  }
});

test('Arabic footers expose the ethical reporting destination with a language disclosure', () => {
  for (const page of pages.filter(p => p.startsWith('ar') && /<footer\b/.test(read(p)))) {
    const output = withNavigationReview(read(page));
    assert.match(output, /href="\/ethique#alerte" hreflang="fr">الإبلاغ الأخلاقي \(FR\)/, page);
  }
});

test('Arabic footers have two columns like the French ones (lot 143), without losing a link beyond the repeated header entries', () => {
  const hrefs = html => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(m => m[1]);
  const arabic = pages.filter(p => p.startsWith('ar') && /<footer class="pft pft-ar"/.test(read(p)));
  assert(arabic.length >= 10, 'ten Arabic pages carry the premium footer');
  for (const page of arabic) {
    const source = read(page);
    const output = withNavigationReview(source);
    const foot = html => html.match(/<footer[\s\S]*?<\/footer>/)[0];
    const before = foot(source), after = foot(output);
    assert.match(after, /<footer data-et-footer-columns="2" class="pft pft-ar">/, page);
    assert.equal((after.match(/class="foot-col"/g) || []).length, 2, page);
    assert(!after.includes('<h3>بالعربية</h3>'), page);
    const lost = hrefs(before).filter(h => !hrefs(after).includes(h));
    assert.deepEqual([...new Set(lost)].sort(), ['/ar-investisseurs', '/ar-poles', '/ar-societe'].sort(), page + ' : seuls les liens de l’en-tête répétés disparaissent');
    assert.equal(hrefs(after).filter(h => h === '/recherche').length, 1, page + ' : la recherche reste, en colonne d’informations');
    assert(after.indexOf('/recherche') > after.indexOf('<h3>معلومات</h3>'), page);
    assert.equal(withNavigationReview(output), output, page + ' : idempotent');
  }
  const odd = '<html lang="ar"><body><footer class="pft pft-ar"><div class="foot-col"><h3>x</h3><a href="/ar">a</a></div><div class="foot-col"><h3>y</h3></div></footer></body></html>';
  assert(!withNavigationReview(odd).includes('data-et-footer-columns'), 'gabarit inattendu : inchangé');
});

// Lot 144 (17 novembre 2026, remarque de relecture) : le JSON-LD Organization reprend le slogan de l'en-tête (lib/structured-slogan.js).
test('structured data slogan matches the header slogan', () => {
  const nav = JSON.parse(read('assets/data/navigation.json')).header;
  let checked = 0;
  for (const page of pages) {
    const source = read(page);
    if (!source.includes('"slogan":"')) continue;
    const output = withYouTubeBadge(source);
    assert(!output.includes('"slogan":"Accès aux Énergies"') && !output.includes('"slogan":"Access to Energy"'), page + ' : ancien slogan dans le JSON-LD');
    const slogans = [...output.matchAll(/"slogan":("(?:[^"\\]|\\.)*")/g)].map(m => JSON.parse(m[1]));
    assert(slogans.length && slogans.every(s => s === nav.fr.slogan || s === nav.en.slogan), page);
    if (/<html\b[^>]*\blang="en/.test(source)) assert(slogans.every(s => s === nav.en.slogan), page + ' : slogan anglais');
    for (const block of output.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []) JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/g, ''));
    assert.equal((source.match(/<title>[\s\S]*?<\/title>/) || [''])[0], (output.match(/<title>[\s\S]*?<\/title>/) || [''])[0], page + ' : titre inchangé');
    checked++;
  }
  assert(checked >= 200, `pages vérifiées : ${checked}`);
});

test('dedicated headers use generic requirements while retaining language pairs and footer access', () => {
  for (const [space, set] of [['boutique', commercialPages], ['atlas', atlasPages]]) {
    for (const page of set) {
      const output = renderSubsite(withYouTubeBadge(read(page.source)), page, space);
      assert(output.includes('/contact' + (page.language === 'en' ? '-en' : '') + '#ctForm'), page.source);
      assert.equal((output.match(/<footer\b/g) || []).length, 1);
      assert(output.includes('et-al-lang'), page.source);
      const nav = nodes(output).find(n => n.attribs?.id === 'nav');
      const links = nodes(output.slice(nav.startIndex,nav.endIndex+1)).filter(n => n.name === 'a');
      assert(!links.some(n => n.attribs?.href?.startsWith('https://enertchad.com')), 'public space navigation must stay on the current host');
    }
  }
});

// Remarque de relecture (17 novembre 2026) : le pied de page reprend le slogan de l'en-tête, pas « Accès aux Énergies ».
test('footer brand carries the header slogan', () => {
  for (const [page, slogan, former] of [['societe.html', 'L’énergie du Tchad. Intégrée.', 'Accès aux Énergies'], ['societe-en.html', 'Chad’s energy. Integrated.', 'Access to Energy']]) {
    const after = withNavigationReview(read(page));
    const footer = after.slice(after.indexOf('<footer'));
    assert.ok(footer.includes(`<small>${slogan}</small>`), page);
    assert.ok(!footer.includes(`<small>${former}</small>`), page);
  }
});

// Lot 143 : l'Espace Clients et l'Atlas, qui n'ont pas le menu du site, reçoivent le Centre de connaissances dans leur pied de page.
test('sub-site footers link to the knowledge centre', () => {
  const page = (canonical, lang) => readFileSync(lang === 'en' ? 'index-en.html' : 'index.html', 'utf8').replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="https://enertchad.com${canonical}"`);
  const footerOf = html => { const out = withNavigationReview(html); return out.slice(out.indexOf('<footer'), out.indexOf('</footer>')); };
  for (const [canonical, lang, href] of [['/boutique/clients', 'fr', '/savoirs'], ['/atlas/', 'fr', '/savoirs'], ['/atlas-en', 'en', '/savoirs-en'], ['/boutique/en/clients', 'en', '/savoirs-en']]) assert.ok(footerOf(page(canonical, lang)).includes(`href="${href}"`), canonical);
  // 20 novembre 2026 (décision du DG) : le lien vers le Centre quitte l'en-tête du site principal ; tous les pieds de page le portent, une seule fois.
  for (const [canonical, lang, href] of [['/', 'fr', '/savoirs'], ['/index-en', 'en', '/savoirs-en'], ['/amont/', 'fr', '/savoirs']]) assert.equal(footerOf(page(canonical, lang)).split(`href="${href}"`).length - 1, 1, canonical + ' : un lien vers le Centre');
});

