// Lot 80 : menu principal du site (structure validée par le DG le 31 octobre 2026).
// Une seule définition (assets/data/navigation.json, FR et EN) remplace au build les entrées
// .nav-item du <nav id="nav" class="nav nx pn"> de chaque page ; la barre utilitaire, le logo,
// les boutons et le menu mobile restent ceux de la page. Appliqué avant navigation-review.js.
// Les styles des colonnes sont posés en ligne dans le menu (#et-main-nav) : une feuille de
// plus changerait l'empreinte des pages et désactiverait leur CSS critique.
import { readFileSync } from 'node:fs';

const NAV = JSON.parse(readFileSync(`${process.cwd()}/assets/data/navigation.json`, 'utf8'));
const CHEV = '<svg aria-hidden="true" focusable="false" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';
// Le gabarit pose ses grilles avec des sélecteurs à 25 identifiants (html:not(#p0)…, !important) et,
// pour .nx-resource-groups, dans la couche et-glass (une règle !important en couche l'emporte sur
// toute règle hors couche). D'où un conteneur .nx-groups propre et le préfixe Q (30 identifiants).
const Q = 'html' + Array.from({ length: 30 }, (_, i) => `:not(#q${i})`).join('') + ' #nav.pn .pn-mega.nx-grouped';
const STYLE = '<style id="et-main-nav">'
  + `${Q} .nx-groups{display:grid!important;gap:16px 24px!important;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))!important}`
  + `${Q} .nx-resource-group{min-width:0!important}`
  + `${Q} .nx-resource-title{text-shadow:none!important}`
  // ≥ 1241 px : 3 pistes (1fr 1.7fr 1fr) ; sans encart, les groupes prennent les deux dernières.
  + `@media(min-width:1241px){${Q}:not(:has(.pn-feat)) .nx-groups{grid-column:2 / span 2!important}}`
  + `@media(max-width:1240px){${Q} .nx-groups{grid-template-columns:1fr!important}${Q} .nx-resource-group+.nx-resource-group{border-top:1px solid var(--et-glass-line)!important;padding-top:16px!important}}`
  + '</style>';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const path = href => href.split('#')[0].split('?')[0];

function link([label, desc, href], route) {
  const current = !href.includes('#') && path(href) === route ? ' aria-current="page"' : '';
  return `<a href="${esc(href)}"${current}><strong>${esc(label)}</strong><em>${esc(desc)}</em></a>`;
}

function menu(m, route) {
  const hrefs = [m.overview, ...m.groups.flatMap(g => g.links)].map(l => l[2]);
  const active = hrefs.some(h => !h.includes('#') && path(h) === route);
  const trigger = `<button type="button" class="nav-trigger${active ? ' is-active' : ''}"${active ? ' aria-current="true"' : ''} style="font-size:var(--et-corporate-nav-size,13px)!important;padding-inline:var(--et-corporate-nav-pad,8px)!important" aria-expanded="false" aria-haspopup="true" aria-controls="nxm-${m.id}">${esc(m.label)} ${CHEV}</button>`;
  const groups = m.groups.map(g => `<section class="nx-resource-group" aria-label="${esc(g.title)}"><h3 class="nx-resource-title">${esc(g.title)}</h3>${g.links.map(l => link(l, route)).join('')}</section>`).join('');
  const feat = m.feature ? `<a class="nx-feat pn-feat" href="${esc(m.feature[3])}"><span class="tag">${esc(m.feature[0])}</span><strong>${esc(m.feature[1])}</strong><em>${esc(m.feature[2])}</em><span class="arr">→</span></a>` : '';
  return `<div class="nav-item pn-item">${trigger}<div class="nx-mega pn-mega nx-grouped" id="nxm-${m.id}" role="region" aria-label="${esc(m.label)}">`
    + `<div class="nx-col pn-intro"><p class="nxh">${esc(m.label)}</p><p class="pn-d">${esc(m.description)}</p>${link(m.overview, route).replace('<a ', '<a class="pn-all" ')}</div>`
    + `<div class="nx-col pn-links nx-groups">${groups}</div>${feat}</div></div>`;
}

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

export function withMainNav(html) {
  if (html.includes('id="et-main-nav"')) return html;
  const navOpen = html.search(/<nav\b[^>]*\bid="nav"[^>]*\bclass="nav nx pn"|<nav\b[^>]*\bclass="nav nx pn"[^>]*\bid="nav"/);
  if (navOpen < 0) return html;
  const lang = (html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr').slice(0, 2);
  if (!NAV[lang]) return html;
  const navClose = html.indexOf('</nav>', navOpen);
  const first = html.indexOf('<div class="nav-item pn-item">', navOpen);
  if (first < 0 || first > navClose) return html;
  const end = itemsEnd(html, first, navClose);
  const canonical = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const route = canonical === undefined ? '' : (canonical || '/');
  return html.slice(0, first) + STYLE + NAV[lang].map(m => menu(m, route)).join('') + html.slice(end);
}
