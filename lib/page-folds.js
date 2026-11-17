import { htmlToDOM } from 'html-react-parser';
import { STYLE, SCRIPT } from './block-folds.js';

// Lot 147 (17 novembre 2026) : dernières pages longues du pôle Raffinage & distribution.
// - Produits raffinés : les chapitres « GPL & gaz » et « Lubrifiants, bitumes… » gardent leur titre et leurs repères chiffrés ;
//   le texte qui suit se replie sous « Afficher le détail ».
// - Réseau de stations : chaque encadré de la section principale garde son titre et son introduction ; schémas et tableaux se
//   replient, avec le composant déjà utilisé sur cette page (details.rsx-more).
// Rien n'est supprimé ; un lien d'ancre vers un élément replié l'ouvre, l'impression ouvre tout (script de lib/block-folds.js).
const ROUTES = {
  '/aval/produits': { sections: ['gpl', 'lubrifiants-bitumes'] }, '/aval/produits-en': { sections: ['gpl', 'lubrifiants-bitumes'] },
  '/aval/reseau': { panels: 'reseau' }, '/aval/reseau-en': { panels: 'reseau' },
};
const MIN_WORDS = 60;
// Les encadrés de Réseau de stations portent surtout des schémas et des tableaux : peu de mots, beaucoup de hauteur.
const PANEL_WORDS = 40;

const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);
const elements = node => (node.children || []).filter(child => child.type === 'tag');
const text = node => node.name === 'style' || node.name === 'script' ? '' : node.data || (node.children || []).map(text).join(' ');
const count = list => list.reduce((sum, node) => sum + text(node).split(/\s+/).filter(Boolean).length, 0);
const find = (node, test) => { if (test(node)) return node; for (const child of node.children || []) { const hit = find(child, test); if (hit) return hit; } };
const isHeading = node => /^h[2-4]$/.test(node.name || '');
const isAction = node => node.type === 'tag' && (hasClass(node, 'pp-link') || hasClass(node, 'pp-btn') || 'data-et-action' in (node.attribs || {}) || (node.children || []).some(isAction));

export function withPageFolds(html) {
  if (html.includes('data-page-fold')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const config = ROUTES[route];
  if (!config) return html;
  const en = /<html\b[^>]*lang="en"/.test(html);
  const roots = htmlToDOM(html, { withStartIndices: true, withEndIndices: true });
  const section = id => { for (const root of roots) { const hit = find(root, node => node.name === 'section' && node.attribs?.id === id); if (hit) return hit; } };
  const folds = [];
  const fold = (title, nodes, extra = '', least = MIN_WORDS) => {
    while (nodes.length && isAction(nodes.at(-1))) nodes = nodes.slice(0, -1);
    if (nodes.length && !nodes.some(isAction) && count(nodes) >= least) folds.push([title, nodes, extra]);
  };
  for (const id of config.sections || []) {
    const prose = find(section(id) || {}, node => hasClass(node, 'pp-prose'));
    const items = prose ? elements(prose) : [];
    const title = items.find(isHeading);
    if (!title) throw Error(`Missing chapter #${id} on ${route}`);
    // Le titre et la grille de repères restent visibles ; les paragraphes qui suivent se replient.
    fold(text(title), items.slice(items.indexOf(title) + 1).filter((node, index) => !(index === 0 && hasClass(node, 'pp-grid'))));
  }
  if (config.panels) {
    const wrap = find(section(config.panels) || {}, node => hasClass(node, 'wrap'));
    if (!wrap) throw Error(`Missing panels #${config.panels} on ${route}`);
    // L'en-tête de la section (svc-head) est l'introduction de la page : il reste ouvert.
    for (const panel of elements(wrap).filter(node => hasClass(node, 'reveal') && !hasClass(node, 'svc-head'))) {
      const items = elements(panel);
      const head = items.findIndex(node => isHeading(node) || find(node, isHeading));
      if (head < 0) continue;
      const holder = items[head], title = isHeading(holder) ? holder : find(holder, isHeading);
      // L'introduction tient soit dans le bloc du titre, soit dans le paragraphe qui suit un titre nu.
      const rest = items.slice(head + 1).filter((node, index) => !(isHeading(holder) && index === 0 && node.name === 'p'));
      fold(text(title), rest, ' rsx-more', PANEL_WORDS);
    }
  }
  if (!folds.length) throw Error(`No foldable chapter on ${route}`);
  const label = en ? 'Show the detail' : 'Afficher le détail';
  const changes = [];
  for (const [title, nodes, extra] of folds) {
    const name = title.replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;');
    changes.push([nodes[0].startIndex, `<details class="pp-bfold${extra}" data-block-fold data-page-fold><summary aria-label="${label} — ${name}"><span class="pp-bfold-o">${label}</span><span class="pp-bfold-c">${en ? 'Close' : 'Replier'}</span></summary><div class="pp-bfold-b">`, 1]);
    changes.push([nodes.at(-1).endIndex + 1, '</div></details>', 0]);
  }
  changes.sort((a, b) => b[0] - a[0] || a[2] - b[2]);
  for (const [at, value] of changes) html = html.slice(0, at) + value + html.slice(at);
  return html.includes('id="pp-bfold-css"') ? html : html.replace('</main>', `${STYLE}${SCRIPT}</main>`);
}
