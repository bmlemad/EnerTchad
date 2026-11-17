import { htmlToDOM } from 'html-react-parser';

// Lot 137 (17 novembre 2026, choix du DG) : sur les pages longues en blocs « titre à gauche, texte à droite » (Investisseurs,
// Services parapétroliers, puis Engagements, Société et Produits raffinés au lot 140, FR et EN), chaque bloc garde son titre et son premier paragraphe ; la suite se replie sous
// « Lire la suite ». Rien n'est supprimé : le texte reste dans le HTML, s'ouvre d'un clic, par un lien d'ancre ou à
// l'impression, et le repli natif fonctionne sans JavaScript. Les blocs courts et les blocs sans titre restent ouverts.
// Les liens d'action placés juste après l'amorce ou en fin de bloc restent visibles.
// Lot 140 : Engagements, Société et Produits raffinés rejoignent la règle (Clients est déjà replié par section, lot 134) ; le seuil passe de soixante à cinquante mots pour que les
// versions française et anglaise d'un même bloc se replient ensemble.
const ROUTES = new Set(['/investisseurs', '/investisseurs-en', '/amont/services-ep', '/amont/services-ep-en', '/engagements', '/engagements-en', '/societe', '/societe-en', '/aval/produits', '/aval/produits-en']);
const MIN_WORDS = 50;
const STYLE = '<style id="pp-bfold-css">.pp-bfold>summary{justify-content:space-between;gap:16px;list-style:none}.pp-bfold>summary::-webkit-details-marker{display:none}.pp-bfold>summary::after{content:"+";font-weight:300;font-size:1.5rem;line-height:1;flex:none}.pp-bfold[open]>summary::after{content:"−"}.pp-bfold>summary .pp-bfold-c,.pp-bfold[open]>summary .pp-bfold-o{display:none}.pp-bfold[open]>summary .pp-bfold-c{display:inline}.pp-bfold-b>p,.pp-bfold-b>ul,.pp-bfold-b>ol,.pp-bfold-b>blockquote{max-width:72ch}</style>';
const SCRIPT = '<script id="pp-bfold-js">(function(){function show(){var h=location.hash.slice(1);if(!h)return;var t;try{t=document.getElementById(decodeURIComponent(h))}catch(e){return}if(!t)return;var d=t.closest("details.pp-bfold")||(t.matches(".pp-block")?t.querySelector("details.pp-bfold"):null);if(d&&!d.open){d.open=true;t.scrollIntoView()}}addEventListener("hashchange",show);document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href^=\\"#\\"]");if(a&&a.getAttribute("href")===location.hash)setTimeout(show,0)});addEventListener("beforeprint",function(){document.querySelectorAll("details.pp-bfold").forEach(function(d){d.open=true})});show()})();</script>';

const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);
const elements = node => (node.children || []).filter(child => child.type === 'tag');
const text = node => node.data || (node.children || []).map(text).join(' ');
const isAction = node => node.type === 'tag' && (hasClass(node, 'pp-link') || hasClass(node, 'pp-btn') || 'data-et-action' in (node.attribs || {}) || (node.children || []).some(isAction));
const words = list => list.map(text).join(' ').split(/\s+/).filter(Boolean).length;

export function withBlockFolds(html) {
  if (html.includes('data-block-fold')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  if (!ROUTES.has(route)) return html;
  const en = /<html\b[^>]*lang="en"/.test(html);
  const blocks = [];
  const walk = node => { if (node.type === 'tag' && hasClass(node, 'pp-block')) blocks.push(node); (node.children || []).forEach(walk); };
  htmlToDOM(html, { withStartIndices: true, withEndIndices: true }).forEach(walk);
  const changes = [];
  for (const block of blocks) {
    const [head, prose, ...extra] = elements(block);
    if (!head || !prose || extra.length || !hasClass(head, 'pp-bh') || !hasClass(prose, 'pp-prose')) continue;
    const items = elements(prose);
    // Le premier paragraphe reste visible : il dit de quoi parle le bloc avant qu'on l'ouvre.
    const rest = items[0]?.name === 'p' ? items.slice(1) : items;
    // Les liens d'action (« Lire… », « Ouvrir… ») placés juste après l'amorce ou en fin de bloc restent visibles.
    while (rest.length && isAction(rest[0])) rest.shift();
    while (rest.length && isAction(rest.at(-1))) rest.pop();
    // Un bloc dont les liens d'action sont répartis dans le texte (agenda, souscription) reste ouvert : une action ne se cache pas.
    if (!rest.length || rest.some(isAction) || words(rest) < MIN_WORDS) continue;
    const title = text(elements(head).find(node => /^h[2-4]$/.test(node.name)) || head).replace(/\s+/g, ' ').trim().replace(/"/g, '&quot;');
    const label = items[0]?.name === 'p' ? (en ? 'Read more' : 'Lire la suite') : (en ? 'Show the detail' : 'Afficher le détail');
    changes.push([rest[0].startIndex, rest[0].startIndex, `<details class="pp-bfold" data-block-fold><summary aria-label="${label} — ${title}"><span class="pp-bfold-o">${label}</span><span class="pp-bfold-c">${en ? 'Close' : 'Replier'}</span></summary><div class="pp-bfold-b">`]);
    changes.push([rest.at(-1).endIndex + 1, rest.at(-1).endIndex + 1, '</div></details>']);
  }
  if (changes.length < 6) throw Error(`Expected at least three foldable blocks on ${route}, found ${changes.length / 2}`);
  // Insertions de la fin vers le début ; à position égale, la fermeture d'un repli passe avant l'ouverture du suivant.
  changes.sort((a, b) => b[0] - a[0] || (a[2].startsWith('</') ? 1 : -1));
  for (const [start, end, value] of changes) html = html.slice(0, start) + value + html.slice(end);
  return html.replace('</main>', `${STYLE}${SCRIPT}</main>`);
}
