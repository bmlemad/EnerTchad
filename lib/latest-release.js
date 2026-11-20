// 17 novembre 2026 (audit face aux majors, décision du DG) : l'accueil n'affichait rien de daté, alors que TotalEnergies et Shell
// ouvrent sur leur dernière publication. Une ligne « Dernier communiqué » suit le héros de l'accueil (français et anglais).
// Elle est lue au build dans la liste officielle (communiques.html, communiques-en.html) : aucun texte n'est écrit ici,
// le prochain communiqué ajouté à la liste remplace celui-ci sans autre intervention.
import { readFileSync } from 'node:fs';

const cache = {};
const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
function latest(en) {
  const key = en ? 'en' : 'fr';
  if (key in cache) return cache[key];
  let item = null;
  try {
    const list = readFileSync(`${process.cwd()}/communiques${en ? '-en' : ''}.html`, 'utf8');
    const li = list.match(/<ol class="pp-releases">\s*(<li id="cp-\d+">[\s\S]*?<\/li>)/)?.[1] || '';
    const time = li.match(/<time datetime="([^"]+)">([^<]+)<\/time>/);
    const ref = li.match(/<span>(CP-\d{4}-\d+)<\/span>/)?.[1];
    const link = li.match(/<h2><a href="([^"]+)">([\s\S]*?)<\/a><\/h2>/);
    if (time && ref && link) {
      // Première proposition du titre officiel (avant les deux-points), comme la balise <title> des pages de communiqué.
      const title = strip(link[2]).split(/\s?:\s/)[0];
      item = { date: time[1], dateText: time[2], ref, href: link[1], title };
    }
  } catch { item = null; }
  return (cache[key] = item);
}

// La ligne suit le thème de la page (texte et fond hérités) : les feuilles du thème clair repeignent les textes, et un fond
// sombre imposé donnait 3 défauts de contraste en thème clair (mesure axe du 17 novembre 2026). Le style reste sous 230 octets :
// l'accueil est à 228 octets de son plafond de CSS écrit dans la page (qa/css-debt-budget.spec.js) ; le conteneur est .et-inner.
const CSS = '<style id="et-latest-css">.et-cp .et-inner{display:flex;flex-wrap:wrap;gap:4px 16px;padding-block:12px}'
  + '.et-cp a{color:inherit;text-decoration:underline}.et-cp a+a{margin-left:auto}</style>';

// Lot 144 (17 novembre 2026, remarque de relecture) : la référence « CP-2026-012 » se coupait au trait d'union sur mobile ;
// elle prend la classe .et-nw de l'accueil (clarity-20261005.css, white-space:nowrap), sans octet de CSS en plus dans la page.
export function withLatestRelease(html) {
  if (html.includes('class="et-cp"')) return html;
  const canonical = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  if (canonical !== '' && canonical !== '/' && canonical !== '/index-en') return html;
  const en = canonical === '/index-en';
  const hero = html.indexOf('<header class="et-hero"');
  if (hero < 0) return html;
  const end = html.indexOf('</header>', hero);
  const item = latest(en);
  if (end < 0 || !item) return html;
  const at = end + '</header>'.length;
  const label = en ? 'Latest press release' : 'Dernier communiqué';
  const all = en ? ['/communiques-en', 'All press releases'] : ['/communiques', 'Tous les communiqués'];
  const line = `<aside class="et-cp" style="padding-inline:max(20px,4vw)" aria-label="${label}"><div class="et-inner"><b>${label}</b><time datetime="${item.date}">${item.dateText}</time>`
    + `<a href="${item.href}">${item.title} · <span class="et-nw">${item.ref}</span></a><a class="et-cp-all" href="${all[0]}">${all[1]} →</a></div></aside>`;
  return html.slice(0, at) + CSS + line + html.slice(at);
}
