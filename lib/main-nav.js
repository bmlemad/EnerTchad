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
  + '</style>';
const H = NAV.header;
// Les pages de pôle (et leurs sous-pages) relèvent de « Activités » : l'entrée est marquée page courante.
const POLES = /^\/(amont|intermediaire|aval|greentech|petrochimie|tchaditech|pole-[a-z-]+)(?:[\/-]|$)/;
const direct = ([label, href], route) => {
  const current = path(href) === route || (path(href).startsWith('/nos-activites') && POLES.test(route)) ? ' aria-current="page"' : '';
  return `<div class="nav-item pn-item"><a class="nav-trigger nx-direct" href="${esc(href)}"${current} style="font-size:var(--et-corporate-nav-size,13px)!important;padding-inline:var(--et-corporate-nav-pad,8px)!important">${esc(label)}</a></div>`;
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
  const out = html.slice(0, first) + HSTYLE + cfg.links.map(l => direct(l, route)).join('') + html.slice(end);
  const close = out.indexOf('</nav>', navOpen);
  return out.slice(0, navOpen) + trimUtility(out.slice(navOpen, close), cfg).replace('<nav', '<nav data-et-header="minimal"') + out.slice(close);
}
