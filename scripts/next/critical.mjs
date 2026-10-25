// Lot 37 (sous-lot 3 du chantier LCP mobile) : CSS critique en ligne pour le gabarit de pôle.
// Pour les pages listées dans scripts/critical/pole.json, chaque feuille bloquante du <head> est
// remplacée, à sa place (la cascade est inchangée), par :
//   <style data-et-crit>règles de cette feuille utiles au-dessus du pli</style>
//   <link rel="preload" as="style" data-et-defer href="…">
// puis un script en fin de <body> rebascule ces liens en rel="stylesheet" (empreinte posée
// par la politique CSP de page, calculée ensuite par hardenHtml), avec un <noscript> de repli.
// Garde-fous : la page doit porter exactement les feuilles attendues, dans l'ordre, et chaque
// feuille publiée doit avoir l'empreinte (?v=) relevée lors de l'extraction ; sinon la page
// reste inchangée (feuilles bloquantes, comme avant). Extraction : scripts/critical/extract.py.
// Mesure au prototype (/amont/, profil mobile Slow 4G, CPU ×4) : FCP 3,2 → 1,0 s, CLS 0,01.
import { readFileSync } from 'node:fs';

export const CRITICAL_FILES = ['scripts/critical/pole.json'];
export const LOADER = '(function(){var l=document.querySelectorAll("link[data-et-defer]");for(var i=0;i<l.length;i++){l[i].rel="stylesheet"}})()';

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
      `<link rel="preload" as="style" data-et-defer href="${hrefs[i]}"${media ? ` media="${media}"` : ''}>`;
    out = out.slice(0, at) + repl + out.slice(at + tag.length);
  }
  const at = out.lastIndexOf('</body>');
  const tail = `<noscript>${links.map(m => m[0]).join('')}</noscript><script id="et-defer-css">${LOADER}</script>`;
  return out.slice(0, at) + tail + out.slice(at);
}
