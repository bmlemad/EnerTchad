import { htmlToDOM } from 'html-react-parser';

// Lot 142 (17 novembre 2026) : sur la page Distribution, la conversion d'une ancienne page avait rangé des
// conteneurs entiers (introduction, listes de cartes, tout un chapitre de détail) comme les cartes d'une même grille à quatre
// colonnes : le détail tenait dans des colonnes de 266 px hautes de plusieurs milliers de pixels, à côté de colonnes presque
// vides. Chaque conteneur reprend toute la largeur, et les listes de cartes qu'il contient redeviennent des grilles (la règle
// « .pp-cell > div { display:block } » les empilait, une carte par ligne). Aucun texte n'est modifié. Sur mobile, où tout est
// déjà sur une colonne, seul l'espacement entre cartes change légèrement.
// Lot 143 : même réparation sur Récupération assistée. La page n'y raccourcit pas (ses quatre colonnes étaient remplies en
// parallèle), mais chaque chapitre se lit désormais de haut en bas sur toute la largeur au lieu de colonnes de 266 px.
const ROUTES = { '/aval/distribution': ['distribution'], '/aval/distribution-en': ['distribution'], '/amont/eor': ['eor'], '/amont/eor-en': ['eor'] };
const FULL = 'grid-column:1/-1!important';
// 240 px au minimum par carte : quatre cartes par ligne à 1440 px au lieu de six colonnes de 188 px, une seule sur mobile.
const GRID = 'display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))!important';
const CARD_WORDS = 70;
const STYLE = '<style id="pp-lgrid-css">[data-legacy-grid] p{max-width:72ch}</style>';

const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);
const elements = node => (node.children || []).filter(child => child.type === 'tag');
const text = node => node.data || (node.children || []).map(text).join(' ');
const words = node => text(node).split(/\s+/).filter(Boolean).length;
const find = (node, test) => { if (test(node)) return node; for (const child of node.children || []) { const hit = find(child, test); if (hit) return hit; } };
const some = (node, test) => (node.children || []).some(child => test(child) || some(child, test));
// Une carte : un élément court, sans grille à l'intérieur. Tout le reste (titres, paragraphes, chapitres) prend la ligne entière.
const isCard = node => (node.name === 'article' || ((node.name === 'div' || node.name === 'a') && hasClass(node, 'pp-cell'))) && words(node) < CARD_WORDS && !some(node, child => hasClass(child, 'pp-grid'));

export function withLegacyGrids(html) {
  if (html.includes('id="pp-lgrid-css"')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const ids = ROUTES[route];
  if (!ids) return html;
  const roots = htmlToDOM(html, { withStartIndices: true, withEndIndices: true });
  const styles = new Map(), marked = [];
  const add = (node, css) => { const list = styles.get(node) || []; if (!list.includes(css)) styles.set(node, [...list, css]); };
  for (const id of ids) {
    let section;
    for (const root of roots) { section = find(root, node => node.name === 'section' && node.attribs?.id === id); if (section) break; }
    const prose = section && find(section, node => hasClass(node, 'pp-prose'));
    const grids = prose ? elements(prose).filter(node => hasClass(node, 'pp-grid')) : [];
    if (!grids.length) throw Error(`Missing legacy grid #${id} on ${route}`);
    for (const grid of grids) {
      marked.push(grid);
      for (const child of elements(grid)) add(child, FULL);
      (function walk(node) {
        for (const child of elements(node)) {
          if (hasClass(child, 'pp-grid')) {
            add(child, GRID);
            // Une carte seule à côté de blocs pleine largeur resterait dans une colonne étroite : elle prend la ligne elle aussi.
            const items = elements(child), alone = items.filter(isCard).length < 2;
            for (const item of items) if (alone || !isCard(item)) add(item, FULL);
          }
          walk(child);
        }
      })(grid);
    }
  }
  const changes = marked.map(node => [node.startIndex + 1 + node.name.length, ' data-legacy-grid']);
  for (const [node, css] of styles) {
    if (node.attribs.style) throw Error(`Inline style already present in legacy grid on ${route}`);
    changes.push([node.startIndex + 1 + node.name.length, ` style="${css.join(';')}"`]);
  }
  changes.sort((a, b) => b[0] - a[0]);
  for (const [at, value] of changes) html = html.slice(0, at) + value + html.slice(at);
  return html.replace('</main>', `${STYLE}</main>`);
}
