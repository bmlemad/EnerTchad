// Lot 37 (sous-lot 3 du chantier LCP mobile) : CSS critique en ligne pour le gabarit de pôle.
// Pour les pages listées dans scripts/critical/pole.json, chaque feuille bloquante du <head> est
// remplacée, à sa place (la cascade est inchangée), par :
//   <style data-et-crit>règles de cette feuille utiles au-dessus du pli</style>
//   <link rel="stylesheet" media="not all" data-et-defer href="…">
// puis un script en fin de <body> leur rend leur media (empreinte posée
// par la politique CSP de page, calculée ensuite par hardenHtml), avec un <noscript> de repli.
// Garde-fous : la page doit porter exactement les feuilles attendues, dans l'ordre, et chaque
// feuille publiée doit avoir l'empreinte (?v=) relevée lors de l'extraction ; sinon la page
// reste inchangée (feuilles bloquantes, comme avant). Extraction : scripts/critical/extract.py.
// Mesure au prototype (/amont/, profil mobile Slow 4G, CPU ×4) : FCP 3,2 → 1,0 s, CLS 0,01.
import { readFileSync } from 'node:fs';

export const CRITICAL_FILES = ['scripts/critical/pole.json', 'scripts/critical/journal-a.json', 'scripts/critical/journal-b.json'];
// Lot 38 : les feuilles différées sont téléchargées en priorité la plus basse (media="not all")
// et ne s'appliquent qu'une fois l'image du héros chargée PUIS peinte (deux images d'animation :
// le recalcul de style des feuilles complètes, ~200 ms à CPU ×4, ne retarde plus la peinture du
// LCP), ou au plus tard à « load ». Pas de minuterie : sur réseau lent, une bascule à 2,5 s
// tombait avant l'image et retardait sa peinture (mesuré).
// Lot 39 : image de héros par gabarit (champ « hero » du fichier ; absent = bascule immédiate).
export const loader = hero => '(function(){var l=document.querySelectorAll("link[data-et-defer]"),d=0;function late(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}function go(){if(d)return;d=1;for(var i=0;i<l.length;i++){l[i].media=l[i].getAttribute("data-media")||"all"}}' +
  (hero ? 'var m=document.querySelector(' + JSON.stringify(hero) + ');if(m&&!m.complete){m.addEventListener("load",late);m.addEventListener("error",late)}else go();' : 'go();') +
  'addEventListener("load",go)})()';
export const LOADER = loader('.pp-hero-img');

let sets = null;
function load() {
  if (sets) return sets;
  sets = [];
  for (const file of CRITICAL_FILES) {
    try { sets.push(JSON.parse(readFileSync(`${process.cwd()}/${file}`, 'utf8'))); } catch { /* absent : rien à injecter */ }
  }
  return sets;
}

const nameOf = href => href.split('?')[0].split('/').pop();

// html : page exportée (URL déjà versionnées) ; page : chemin relatif (ex. « amont/eau.html ») ;
// versions : table des empreintes (.generated/fingerprints.json).
export function inlineCritical(html, page, versions) {
  if (html.includes('data-et-defer')) return html;
  const set = load().find(s => s.pages.includes(page));
  if (!set) return html;
  const end = html.indexOf('</head>');
  const close = html.lastIndexOf('</body>');
  if (end < 0 || close < end) return html;
  const links = [...html.slice(0, end).matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*>/g)];
  const hrefs = links.map(m => (m[0].match(/\bhref="([^"]+)"/) || [])[1] || '');
  if (hrefs.map(nameOf).join(',') !== set.order.join(',')) return html;
  if (!hrefs.every(h => h.startsWith('/assets/chrome/'))) return html;
  for (const name of set.order) if (!set.sheets[name] || versions[name] !== set.sheets[name].v) return html;
  let out = html;
  for (let i = links.length - 1; i >= 0; i--) {
    const tag = links[i][0], at = links[i].index;
    const media = (tag.match(/\bmedia="([^"]+)"/) || [])[1];
    const css = set.sheets[nameOf(hrefs[i])].css;
    const repl = (css ? `<style data-et-crit>${css}</style>` : '') +
      `<link rel="stylesheet" media="not all" data-et-defer${media ? ` data-media="${media}"` : ''} href="${hrefs[i]}">`;
    out = out.slice(0, at) + repl + out.slice(at + tag.length);
  }
  const at = out.lastIndexOf('</body>');
  const tail = `<noscript>${links.map(m => m[0]).join('')}</noscript><script id="et-defer-css">${loader(set.hero === undefined ? '.pp-hero-img' : set.hero)}</script>`;
  return out.slice(0, at) + tail + out.slice(at);
}
