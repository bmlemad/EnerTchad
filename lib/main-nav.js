// Lot 124 (14 novembre 2026, décision du DG) : l'en-tête est minimaliste. Cinq liens simples (clé « header » de
// assets/data/navigation.json : Vision, Activités, Impact, Investisseurs, Contact), la barre d'outils réduite aux langues et à la
// recherche, un bouton « Investisseurs » et le slogan « L'énergie du Tchad. Intégrée. » sous le logo. Les menus complets du lot 80
// (structure validée le 31 octobre 2026) restent dans le fichier : ils alimentent le pied de page et les liens de contexte.
// Lot 80 : menu principal du site (structure validée par le DG le 31 octobre 2026).
// Une seule définition (assets/data/navigation.json, FR et EN) remplace au build les entrées
// .nav-item du <nav id="nav" class="nav nx pn"> de chaque page ; la barre utilitaire, le logo,
// les boutons et le menu mobile restent ceux de la page. Appliqué avant navigation-review.js.
// Les styles des colonnes sont posés en ligne dans le menu (#et-main-nav) : une feuille de
// plus changerait l'empreinte des pages et désactiverait leur CSS critique.
import { readFileSync } from 'node:fs';

const NAV = JSON.parse(readFileSync(`${process.cwd()}/assets/data/navigation.json`, 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const path = href => href.split('#')[0].split('?')[0];

// Fin du dernier .nav-item frère : équilibre des <div> à partir du premier.
function itemsEnd(html, start, limit) {
  const rx = /<div\b|<\/div>/g; rx.lastIndex = start;
  let depth = 0, end = start, m;
  while ((m = rx.exec(html)) && m.index < limit) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) {
      end = rx.lastIndex;
      // s'arrêter au premier frère qui n'est pas une entrée du menu (ex. .nx-util-m)
      if (!/^\s*<div class="nav-item pn-item">/.test(html.slice(end, end + 40))) break;
    }
    if (depth < 0) break;
  }
  return end;
}

// Lot 124 : liens simples. Le gabarit style les entrées .nav-item avec des sélecteurs à identifiants (!important) : le bloc en ligne
// #et-main-nav (préfixe Q, 30 identifiants) rend le lien semblable à l'ancien bouton, sans panneau.
const HQ = 'html' + Array.from({ length: 30 }, (_, i) => `:not(#q${i})`).join('') + ' #nav.pn .nx-direct';
const HSTYLE = '<style id="et-main-nav">'
  + `${HQ}{display:inline-flex!important;align-items:center;gap:6px;text-decoration:none!important;color:inherit!important;white-space:nowrap}`
  + `${HQ}:hover,${HQ}:focus-visible,${HQ}[aria-current="page"]{color:var(--et-gold-300,#D9B567)!important}`
  + `${HQ}[aria-current="page"]{font-weight:600}`
  // 17 novembre 2026 : le slogan sous le logo debordait de 56 px sous la premiere entree du menu (mesure : slogan jusqu'a 288 px,
  // « Vision » a partir de 232 px). La premiere entree est decalee de 80 px (barre d'ordinateur seulement, pas le tiroir mobile) : le menu commence apres le slogan (293 px en francais, 271 px en anglais).
  + '@media(min-width:1241px){#nav.pn #et-main-nav+.nav-item{margin-inline-start:80px}}'
  + '</style>';
const H = NAV.header;
// Les pages de pôle (et leurs sous-pages) relèvent de « Activités » : l'entrée est marquée page courante.
const POLES = /^\/(amont|intermediaire|aval|greentech|petrochimie|tchaditech|pole-[a-z-]+)(?:[\/-]|$)/;
// 17 novembre 2026 (revue des menus) : une page secondaire (gouvernance, FAQ, communiqués…) ne mettait aucune entrée en évidence.
// Sa rubrique d'en-tête est déduite de navigation.json : chaque destination d'un menu complet relève de l'entrée d'en-tête de ce menu
// (Entreprise → Vision, Activités & Ingénierie → Activités, Engagements → Impact, Centre de connaissances → Centre, Investisseurs).
// Un menu sans entrée d'en-tête (Projets) n'attribue rien ; une destination présente dans deux menus relève du premier qui a une entrée.
// L'entrée de rubrique est marquée aria-current="true" ; la page elle-même garde aria-current="page". Les deux reçoivent la classe
// « is-active » : c'est elle que la feuille de style premium-chrome.css habille (filet d'or de la direction éditoriale du 11 novembre) ;
// les règles [aria-current] de ce fichier, hors couche « verre », sont écrasées par les règles de la couche « et-glass ».
const MENU_TO_HEADER = { a: 0, b: 1, e: 2, d: 3, f: 5 };
const trim = p => (p.length > 1 ? p.replace(/\/+$/, '') : p);
const SECTION = {};
for (const lang of Object.keys(H)) {
  SECTION[lang] = {};
  for (const menu of NAV[lang] || []) {
    const entry = MENU_TO_HEADER[menu.id] === undefined ? null : H[lang].links[MENU_TO_HEADER[menu.id]];
    if (!entry) continue;
    const targets = [menu.overview[2], ...menu.groups.flatMap(g => g.links.map(l => l[l.length - 1]))];
    for (const t of targets) if (!(trim(path(t)) in SECTION[lang])) SECTION[lang][trim(path(t))] = trim(path(entry[1]));
  }
}
// Les articles de carnets (« journal-… ») et les communiqués individuels relèvent du Centre de connaissances.
const CENTRE_PREFIX = /^\/(?:journal-|communique\/)/;
const sectionOf = (lang, route) => SECTION[lang]?.[trim(route)] || (CENTRE_PREFIX.test(route) ? trim(path(H[lang].links[5][1])) : '');
// Une page qui est elle-même une entrée de l'en-tête (Carrières) ou le bouton (Contact) ne marque pas de rubrique en plus.
const direct = ([label, href], route, section) => {
  const current = path(href) === route || (path(href).startsWith('/nos-activites') && POLES.test(route)) ? ' aria-current="page"'
    : section && section === trim(path(href)) ? ' aria-current="true"' : '';
  return `<div class="nav-item pn-item"><a class="nav-trigger nx-direct${current ? ' is-active' : ''}" href="${esc(href)}"${current}style="font-size:var(--et-corporate-nav-size,13px)!important;padding-inline:var(--et-corporate-nav-pad,8px)!important">${esc(label)}</a></div>`;
};
const anchors = html => html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || [];

// Barre d'outils (ordinateur) : langues et recherche seulement, puis le bouton. Copie du tiroir mobile : langues et bouton.
function trimUtility(nav, cfg) {
  const button = cfg.button;
  return nav
    .replace(/(<div class="nx-util-in">)([\s\S]*?)(<\/div><\/div>)/, (all, open, body, close) => {
      const keep = anchors(body).filter(a => /class="nx-(?:lang|langx|search)"/.test(a));
      return open + keep.join('') + `<a href="${esc(button[1])}" class="nx-invest">${esc(button[0])}</a>` + close;
    })
    .replace(/(<div class="nx-util-m">)([\s\S]*?)(<\/div>)/, (all, open, body, close) => {
      const keep = anchors(body).filter(a => />(?:English|Français|العربية)<\/a>/.test(a));
      return open + keep.join('') + `<a href="${esc(button[1])}" class="cta">${esc(button[0])}</a>` + close;
    })
    .replace(/(<span class="brand-tx et-tag"><small>)[^<]*(<\/small>)/, `$1${esc(cfg.slogan)}$2`);
}

export function withMainNav(html) {
  if (html.includes('id="et-main-nav"')) return html;
  const navOpen = html.search(/<nav\b[^>]*\bid="nav"[^>]*\bclass="nav nx pn"|<nav\b[^>]*\bclass="nav nx pn"[^>]*\bid="nav"/);
  if (navOpen < 0) return html;
  const lang = (html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr').slice(0, 2);
  const cfg = H[lang];
  if (!cfg) return html;
  const navClose = html.indexOf('</nav>', navOpen);
  const first = html.indexOf('<div class="nav-item pn-item">', navOpen);
  if (first < 0 || first > navClose) return html;
  const end = itemsEnd(html, first, navClose);
  const canonical = html.match(/<link rel="canonical" href="https:\/\/enertchad.com([^"]*)"/)?.[1];
  const route = canonical === undefined ? '' : (canonical || '/');
  const own = cfg.links.some(l => path(l[1]) === route) || path(cfg.button[1]) === route || POLES.test(route); // les pages de pôle marquent déjà « Activités »
  const out = html.slice(0, first) + HSTYLE + cfg.links.map(l => direct(l, route, own ? '' : sectionOf(lang, route))).join('') + html.slice(end);
  const close = out.indexOf('</nav>', navOpen);
  // 17 novembre 2026 : sur la page Contact, le bouton « Contact » est marque page courante (ordinateur et tiroir mobile).
  const onButton = path(cfg.button[1]) === route;
  const mark = nav => !onButton ? nav : nav.replace(`<a href="${esc(cfg.button[1])}" class="nx-invest">`, `<a href="${esc(cfg.button[1])}" class="nx-invest" aria-current="page">`).replace(`<a href="${esc(cfg.button[1])}" class="cta">`, `<a href="${esc(cfg.button[1])}" class="cta" aria-current="page">`);
  return out.slice(0, navOpen) + mark(trimUtility(out.slice(navOpen, close), cfg)).replace('<nav', '<nav data-et-header="minimal"') + out.slice(close);
}
