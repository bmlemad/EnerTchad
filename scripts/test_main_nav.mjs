// Lot 80 puis lot 124 : en-tête minimaliste (lib/main-nav.js, clé « header » de assets/data/navigation.json).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { withMainNav, centreOf } from '../lib/main-nav.js';

const nav = JSON.parse(readFileSync('assets/data/navigation.json', 'utf8'));
const pages = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0')
  .filter(p => p.endsWith('.html') && !/^(?:scripts|qa|docs-sources)\//.test(p));
const navOf = html => { const i = html.indexOf('id="nav"'); return html.slice(i, html.indexOf('</nav>', i)); };
const outside = html => { const i = html.indexOf('id="nav"'); return html.slice(0, html.lastIndexOf('<', i)) + html.slice(html.indexOf('</nav>', i)); };
const routeExists = p => {
  if (['/atlas/', '/atlas-en'].includes(p)) return true;
  // 23 novembre 2026 (DG, recentrage sur la vision) : les deux outils d'estimation passent au Centre (rubrique Documentation) ; leurs
  // adresses publiques diffèrent du nom de leur fichier source.
  const ALIAS = { '/amont/calculateur-baril-additionnel': 'Calculateur_Baril_Additionnel.html', '/configurateur-service-integre': 'Configurateur_Service_Integre_v2.html' };
  if (ALIAS[p]) return existsSync(ALIAS[p]);
  return existsSync(p.endsWith('/') ? p.slice(1) + 'index.html' : p.slice(1) + '.html');
};

// 16 novembre 2026 (décision du DG, « épurer la navigation ») : sixième entrée, le Centre de connaissances.
// 17 novembre 2026 (décision du DG, comparaison avec les majors) : « Contact » devient le bouton et quitte le menu, « Carrières » y entre.
// 20 novembre 2026 (décision du DG) : deux espaces. Site principal : cinq entrées et le bouton Contact ; Centre de Connaissances : sept entrées et un bouton de retour.
test('FR and EN headers have the same five entries, in the DG order, and one button', () => {
  assert.deepEqual(nav.header.fr.links.map(l => l[0]), ['Vision', 'Activités', 'Impact', 'Leadership', 'Investisseurs']);
  assert.deepEqual(nav.header.en.links.map(l => l[0]), ['Vision', 'Activities', 'Impact', 'Leadership', 'Investors']);
  assert.deepEqual(nav.header.fr.links.map(l => l[1]), ['/societe', '/nos-activites', '/communautes', '/leadership', '/investisseurs']);
  assert.deepEqual(nav.header.en.links.map(l => l[1]), ['/societe-en', '/nos-activites-en', '/communautes-en', '/leadership-en', '/investisseurs-en']);
  assert.deepEqual(nav.centre.fr.links.map(l => l[0]), ['Gouvernance', 'Publications', 'HSE', 'Éthique', 'Atlas', 'FAQ', 'Documentation']);
  assert.deepEqual(nav.centre.en.links.map(l => l[0]), ['Governance', 'Publications', 'HSE', 'Ethics', 'Atlas', 'FAQ', 'Documentation']);
  assert.deepEqual(nav.centre.fr.button, ['Site EnerTchad', '/']);
  assert.deepEqual(nav.centre.en.button, ['EnerTchad site', '/index-en']);
  for (const lang of ['fr', 'en']) {
    for (const [, href] of nav.centre[lang].links) assert(routeExists(href.split('#')[0]), lang + ' centre ' + href);
    assert(routeExists(nav.centre[lang].home), lang + ' centre home');
    for (const [from, to] of Object.entries(nav.centre[lang].sections)) {
      assert(routeExists(from), lang + ' centre section ' + from);
      assert(nav.centre[lang].links.some(l => l[1] === to), lang + ' centre section target ' + to);
    }
    // aucune page n'appartient aux deux en-têtes
    for (const [, href] of nav.header[lang].links) assert.equal(centreOf(lang, href), null, lang + ' ' + href + ' reste sur le site principal');
  }
  assert.deepEqual(nav.header.fr.button, ['Contact', '/contact']);
  for (const lang of ['fr', 'en']) assert(!nav.header[lang].links.some(l => l[1] === nav.header[lang].button[1]), lang + ' : le bouton ne double aucune entrée du menu');
  assert.deepEqual(nav.header.en.button, ['Contact', '/contact-en']);
  assert.equal(nav.header.fr.slogan, 'L’énergie du Tchad. Intégrée.');
  assert.equal(nav.header.en.slogan, 'Chad’s energy. Integrated.');
});

test('every internal destination of the header exists, and the full menus still exist for the footer', () => {
  for (const lang of ['fr', 'en']) {
    for (const [, href] of [...nav.header[lang].links, nav.header[lang].button]) assert(routeExists(href), lang + ' ' + href);
    const routes = new Set(['/boutique/clients', '/boutique/en/clients', '/amont/calculateur-baril-additionnel', '/configurateur-service-integre', '/atlas/', '/atlas-en']);
    for (const m of nav[lang]) for (const l of [m.overview, ...m.groups.flatMap(g => g.links)]) {
      const p = l[2].split('#')[0].split('?')[0];
      if (!routes.has(p)) assert(routeExists(p), lang + ' ' + l[2]);
    }
  }
});

test('every corporate page gets the five links, keeps everything outside the nav and stays idempotent', () => {
  let count = 0;
  for (const page of pages) {
    const before = readFileSync(page, 'utf8');
    if (!/<nav\b[^>]*class="nav nx pn"/.test(before)) continue;
    const after = withMainNav(before);
    const lang = (before.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr').slice(0, 2);
    if (!nav.header[lang]) { assert.equal(after, before, page + ' other languages untouched'); continue; }
    count++;
    assert.equal(withMainNav(after), after, page + ' idempotence');
    // 20 novembre 2026 (revue des en-têtes) : hors de l'en-tête, seule la barre mobile du bas change, et seulement dans le Centre.
    const noBar = h => h.replace(/(<nav\b[^>]*\bid="nezBar"[^>]*>)[\s\S]*?(<\/nav>)/, '$1$2');
    assert.equal(outside(noBar(after)), outside(noBar(before)), page + ' outside the nav and the bottom bar');
    const barOf = h => [...(h.match(/<nav\b[^>]*\bid="nezBar"[^>]*>[\s\S]*?<\/nav>/)?.[0] || '').matchAll(/<a href="([^"]+)" aria-label="([^"]+)"/g)].map(m => m[1]);
    const centreHere = after.includes('data-et-space="centre"');
    if (!centreHere) assert.deepEqual(barOf(after), barOf(before), page + ' bottom bar untouched on the main site');
    else if (barOf(before).length) assert.deepEqual(barOf(after), [nav.centre[lang].home, nav.centre[lang].links[1][1], nav.centre[lang].button[1]], page + ' bottom bar of the Centre');
    if (centreHere) assert(after.includes(`class="brand" aria-label="EnerTchad — ${nav.centre[lang].slogan}"`), page + ' logo named after the Centre');
    const n = navOf(after);
    const route = before.match(/<link rel="canonical" href="https:\/\/enertchad.com([^"]*)"/)?.[1];
    const centre = centreOf(lang, route === undefined ? '' : (route || '/'));
    const cfg = centre ? centre.cfg : nav.header[lang];
    assert.equal(after.includes('data-et-space="centre"'), !!centre, page + ' espace');
    assert.equal((n.match(/class="nav-trigger nx-direct(?: is-active)?"/g) || []).length, centre ? 7 : 5, page + ' number of links');
    if (centre) assert(n.includes(`<a href="${cfg.home}" class="brand"`), page + ' logo du Centre');
    assert.equal((n.match(/aria-controls="nxm-/g) || []).length, 0, page + ' no dropdown');
    assert(!n.includes('nx-mega'), page + ' no panel');
    assert.equal(n.includes('nx-util-m'), navOf(before).includes('nx-util-m'), page + ' mobile utility bar');
    assert(n.includes(`class="nx-invest">${cfg.button[0]}</a>`) || n.includes(`class="nx-invest" aria-current="page">${cfg.button[0]}</a>`), page + ' button');
    assert(n.includes(`<small>${cfg.slogan}</small>`), page + ' slogan');
  }
  assert(count > 200, 'corporate pages: ' + count);
});

// Lot 125 : en-tête arabe à cinq liens (lib/ar-nav.js), sans « بحث (FR) », page courante conservée.
import { withArNav } from '../lib/ar-nav.js';
import { readFileSync as readAr } from 'node:fs';
// 17 novembre 2026 : quatre liens et le bouton « اتصل بنا » (il ne double plus « المستثمرون »).
// 20 novembre 2026 (décision du DG, deux espaces) : les cinq entrées du site principal — الرؤية، الأنشطة، الأثر، القيادة، المستثمرون.
test('Arabic header: five plain links and a contact button, current page marked, idempotent', () => {
  for (const [file, current] of [['ar.html', '/ar'], ['ar-contact.html', '/ar-contact'], ['ar-amont.html', '/ar-poles'], ['ar-poles.html', '/ar-poles'], ['ar-leadership.html', '/ar-leadership'], ['ar-societe.html', '/ar-societe']]) {
    const out = withArNav(readAr(new URL('../' + file, import.meta.url), 'utf8'));
    const nav = out.match(/<nav class="arh-nav" data-et-header="minimal"[^>]*>([\s\S]*?)<\/nav>/)[1];
    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(hrefs, ['/ar-societe', '/ar-poles', '/ar#impact', '/ar-leadership', '/ar-investisseurs'], file);
    assert.equal((nav.match(/aria-current="page"/g) || []).length, ['/ar', '/ar-contact'].includes(current) ? 0 : 1, file + ' : une entrée marquée, sauf accueil et contact');
    assert(out.includes('<a class="arh-cta" href="/ar-contact"' + (current === '/ar-contact' ? ' aria-current="page"' : '') + '>اتصل بنا</a>'), file + ' button');
    assert.equal(nav.includes('/recherche'), false, file);
    const header = out.slice(out.indexOf('<header class="arh">'), out.indexOf('</header>'));
    assert(header.includes(`href="${current}" aria-current="page"`), file + ' current');
    assert.equal(withArNav(out), out, file + ' idempotent');
  }
});

// 17 novembre 2026 (revue des menus) : une page secondaire met en évidence sa rubrique d'en-tête (aria-current="true"),
// jamais en plus d'une entrée qui est la page elle-même ; la page de l'entrée garde aria-current="page".
test('secondary pages mark their header section, and never two entries at once', () => {
  const marks = (file) => {
    const n = navOf(withMainNav(readFileSync(file, 'utf8')));
    return [...n.matchAll(/<a class="nav-trigger nx-direct( is-active)?" href="([^"]+)"( aria-current="(true|page)")?/g)].map(m => { assert.equal(!!m[1], !!m[3], 'is-active suit aria-current : ' + m[2]); return m; }).filter(m => m[3]).map(m => `${m[2]}:${m[4]}`);
  };
  const expected = {
    'gouvernance.html': ['/gouvernance:page'], 'ethique.html': ['/ethique:page'], 'achats.html': ['/societe:true'],
    'cibles-2030.html': ['/communautes:true'], 'faq.html': ['/faq:page'], 'glossaire-petrolier.html': ['/sources:true'],
    'publications.html': ['/publications:page'], 'communiques.html': ['/publications:true'], 'presse.html': ['/publications:true'],
    'journal-prix-litre.html': ['/publications:true'], 'communique/cp-2026-010.html': ['/publications:true'],
    'conformite.html': ['/ethique:true'], 'rapports.html': ['/sources:true'], 'cadre-hse.html': ['/cadre-hse:page'], 'savoirs.html': [],
    'gouvernance-en.html': ['/gouvernance-en:page'], 'cibles-2030-en.html': ['/communautes-en:true'], 'presse-en.html': ['/publications-en:true'],
    'societe.html': ['/societe:page'], 'carrieres.html': ['/societe:true'], 'leadership.html': ['/leadership:page'], 'investisseurs.html': ['/investisseurs:page'],
    'nos-activites.html': ['/nos-activites:page'], 'amont/index.html': ['/nos-activites:page'],
    'contact.html': [], 'projets.html': [], 'index.html': [],
  };
  for (const [file, want] of Object.entries(expected)) assert.deepEqual(marks(file), want, file);
  for (const file of pages.filter(p => /<nav\b[^>]*class="nav nx pn"/.test(readFileSync(p, 'utf8')))) {
    const m = marks(file);
    assert(m.length <= 1, file + ' : au plus une entrée marquée, trouvé ' + m.join(', '));
    assert.equal(withMainNav(withMainNav(readFileSync(file, 'utf8'))), withMainNav(readFileSync(file, 'utf8')), file + ' idempotence');
  }
});

// 21 novembre 2026 (décision du DG, comparaison avec les majors) : un seul panneau, sous « Activités » — les quatre métiers et la vue
// d'ensemble, FR et EN, sur le site principal seulement ; le Centre de Connaissances n'en a pas.
test('Activities panel — four business lines and the overview, main site only', () => {
  const expect = {
    fr: { file: 'societe.html', titles: ['Produire', 'Transporter', 'Transformer', 'Distribuer'], hrefs: ['/amont/', '/intermediaire/', '/petrochimie/', '/aval/'], overview: '/nos-activites', extra: '/services-tiers' },
    en: { file: 'societe-en.html', titles: ['Produce', 'Transport', 'Transform', 'Distribute'], hrefs: ['/pole-amont-en', '/pole-intermediaire-en', '/pole-enerchimie-en', '/pole-aval-en'], overview: '/nos-activites-en', extra: '/services-tiers-en' }
  };
  for (const [lang, e] of Object.entries(expect)) {
    assert.deepEqual(nav.header[lang].panel.links.map(l => l[0]), e.titles, lang);
    assert.deepEqual(nav.header[lang].panel.links.map(l => l[2]), e.hrefs, lang);
    for (const href of [...e.hrefs, e.overview, e.extra]) assert.ok(routeExists(href), `${lang} ${href} exists`);
    // 23 novembre 2026 : « Services aux tiers », sous les quatre segments, avant la vue d'ensemble.
    assert.equal(nav.header[lang].panel.extra[2], e.extra, `${lang} extra entry`);
    const html = withMainNav(readFileSync(e.file, 'utf8'));
    const n = navOf(html);
    assert.equal((n.match(/data-et-sub/g) || []).length, 1, `${lang} one panel`);
    assert.match(n, new RegExp(`<div class="nav-item pn-item et-has-sub" data-et-sub><a class="nav-trigger nx-direct[^"]*" href="${e.overview}"`), `${lang} under Activities`);
    assert.match(n, /<button type="button" class="et-sub-tog" aria-expanded="false" aria-controls="et-sub-activites" aria-label="[^"]+" hidden><\/button>/, `${lang} toggle hidden until the script runs`);
    assert.match(n, /<div class="et-sub" id="et-sub-activites" hidden>/, `${lang} panel closed`);
    assert.deepEqual([...n.matchAll(/<a class="et-sub-link" href="([^"]+)"/g)].map(m => m[1]), e.hrefs, `${lang} links`);
    assert.match(n, new RegExp(`<a class="et-sub-all" href="${e.overview}">`), `${lang} overview link`);
    assert.match(n, new RegExp(`</ul><a class="et-sub-extra" href="${e.extra}"><b>`), `${lang} extra link after the four segments`);
    assert.equal((html.match(/<style id="et-sub-css">/g) || []).length, 1, `${lang} styles once`);
    assert.equal(withMainNav(html), html, `${lang} idempotent`);
  }
  for (const file of ['gouvernance.html', 'gouvernance-en.html', 'faq.html']) {
    const html = withMainNav(readFileSync(file, 'utf8'));
    assert.ok(!html.includes('data-et-sub') && !html.includes('et-sub-css'), `${file} (centre) has no panel`);
  }
});

test('Activities panel — the current business line is marked on its pages', () => {
  const marked = file => [...navOf(withMainNav(readFileSync(file, 'utf8'))).matchAll(/<a class="et-sub-link" href="([^"]+)" aria-current="page">/g)].map(m => m[1]);
  assert.deepEqual(marked('amont/index.html'), ['/amont/']);
  assert.deepEqual(marked('aval/produits.html'), ['/aval/']);
  assert.deepEqual(marked('pole-aval-en.html'), ['/pole-aval-en']);
  assert.deepEqual(marked('societe.html'), []);
  assert.ok(navOf(withMainNav(readFileSync('services-tiers.html', 'utf8'))).includes('<a class="et-sub-extra" href="/services-tiers" aria-current="page">'), 'services page marked');
});
