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

export const CRITICAL_FILES = ['scripts/critical/pole.json', 'scripts/critical/journal-a.json', 'scripts/critical/journal-b.json', 'scripts/critical/aval-reseau.json', 'scripts/critical/boutique.json', 'scripts/critical/aval-hub.json', 'scripts/critical/home-fr.json', 'scripts/critical/home-en.json', 'scripts/critical/amont-hub.json', 'scripts/critical/atlas.json', 'scripts/critical/ar-pole.json', 'scripts/critical/ar-home.json', 'scripts/critical/hub-b.json', 'scripts/critical/hub-enerconseils.json', 'scripts/critical/hub-petrochimie.json', 'scripts/critical/hub-intermediaire.json', 'scripts/critical/hub-tchaditude.json', 'scripts/critical/boutique-clients.json', 'scripts/critical/contact.json', 'scripts/critical/petrochimie-produits.json', 'scripts/critical/services-ep.json', 'scripts/critical/projets.json', 'scripts/critical/gouvernance.json', 'scripts/critical/cibles-2030.json', 'scripts/critical/carnets.json', 'scripts/critical/nos-activites.json', 'scripts/critical/intermediaire-sites.json', 'scripts/critical/tchaditech-outils.json', 'scripts/critical/glossaire.json', 'scripts/critical/essentiel.json', 'scripts/critical/ar-investisseurs.json'];
// Lot 38 : les feuilles différées sont téléchargées en priorité la plus basse (media="not all")
// et ne s'appliquent qu'une fois l'image du héros chargée PUIS peinte (deux images d'animation :
// le recalcul de style des feuilles complètes, ~200 ms à CPU ×4, ne retarde plus la peinture du
// LCP), ou au plus tard à « load ». Pas de minuterie : sur réseau lent, une bascule à 2,5 s
// tombait avant l'image et retardait sa peinture (mesuré).
// Lot 39 : image de héros par gabarit (champ « hero » du fichier ; absent = bascule immédiate).
// Lot 69 : « hero »: "load" = bascule à l'événement load seulement (Carnets : l'image du bandeau est un
// fond CSS ; sans attente, les feuilles différées lui prenaient la bande passante, LCP 2,6 → 3,8 s mesuré).
export const loader = hero => '(function(){var l=document.querySelectorAll("link[data-et-defer]"),d=0;function late(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,0)})})}function go(){if(d)return;d=1;for(var i=0;i<l.length;i++){l[i].media=l[i].getAttribute("data-media")||"all"}}' +
  (hero === 'load' ? '' : hero ? 'var m=document.querySelector(' + JSON.stringify(hero) + ');if(m&&!m.complete){m.addEventListener("load",late);m.addEventListener("error",late)}else go();' : 'go();') +
  'addEventListener("load",go)})()';
export const LOADER = loader('.pp-hero-img');
// Lot 41 : avant l'arrivée des feuilles différées, les icônes sociales du pied de page (SVG sans
// taille propre) s'affichaient à 348 px puis retombaient à 16-18 px : décalage compté dans le CLS
// (0,35 mesuré en ligne, 2 chargements sur 10). Règle de spécificité nulle : les règles des
// feuilles complètes l'emportent, le rendu final est inchangé.
export const FOOT_GUARD = ':where(.foot-social svg){width:18px;height:18px}';

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
    const first = i === 0;
    const repl = (css || first ? `<style data-et-crit>${first ? FOOT_GUARD : ''}${css}</style>` : '') +
      `<link rel="stylesheet" media="not all" data-et-defer${media ? ` data-media="${media}"` : ''} href="${hrefs[i]}">`;
    out = out.slice(0, at) + repl + out.slice(at + tag.length);
  }
  const at = out.lastIndexOf('</body>');
  const tail = `<noscript>${links.map(m => m[0]).join('')}</noscript><script id="et-defer-css">${loader(set.hero === undefined ? '.pp-hero-img' : set.hero)}</script>`;
  return out.slice(0, at) + tail + out.slice(at);
}

// Lot 66 : bandeau de consentement affiché plus tôt. audience-consent.js était chargé en deux
// sauts (nav_a.js, différé et de basse priorité, l'injecte à son exécution) : pour un nouveau
// visiteur, le bandeau, plus grand que le texte du héros sur mobile, devenait l'élément LCP
// (Tchaditude 6,3 s, Espace clients 4,6 s, mesures en ligne). Le script est désormais aussi
// déclaré en différé dans le <head> des pages qui chargent nav_a.js ; l'injection de nav_a.js
// reste (repli) et ne fait rien grâce au garde « if(window.etAudienceConsent)return ».
// Comportement inchangé : consentement préalable, aucune requête Google avant « Accepter ».
// Lot 89 : « async » au lieu de « defer ». En différé, le script arrivait à 2,5 s mais le bandeau n'était
// peint qu'à 4,3–4,4 s (Slow 4G, CPU ×4) : la file des scripts différés et DOMContentLoaded occupaient
// le fil principal. En asynchrone, le script s'exécute dès son arrivée (bandeau peint à 1,1–3,1 s mesuré).
// Il est autonome (feuille en ligne, garde window.etAudienceConsent partagée avec l'injection de nav_a.js).
export const CONSENT_TAG = '<script async src="/assets/chrome/audience-consent.js"></script>';
export function earlyConsent(html) {
  const end = html.indexOf('</head>');
  if (end < 0 || !html.includes('/assets/chrome/nav_a.js')) return html;
  if (/<script\b[^>]*\/assets\/chrome\/audience-consent\.js/.test(html.slice(0, end))) return html;
  return html.slice(0, end) + CONSENT_TAG + html.slice(end);
}

// Lot 90, étape 1 (choix du DG, 1er novembre 2026) : un seul verre sur le chrome. La feuille
// assets/chrome/verre-2026.css (source unique, commentée) est mise en ligne EN TÊTE du <head> de chaque
// page qui porte une des surfaces concernées : sa couche @layer et-verre est ainsi déclarée la première,
// et ses déclarations !important l'emportent sur les couches et-glass (premium-chrome.css) et verre
// (pole-premium.css) comme sur les règles hors couche — ordre des couches, pas spécificité (CSS Cascading 5,
// § 6.4). En ligne plutôt que liée : 1,2 Ko, aucune requête, appliquée dès la première peinture, avant les
// feuilles différées des jeux critiques. Idempotent. Mesure : 140 styles calculés conformes sur 6 pages,
// 2 thèmes, 2 largeurs (verre_check.py).
const VERRE_CSS = readFileSync(new URL('../../assets/chrome/verre-2026.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n+/g, '\n').trim();
export const VERRE_TAG = '<style data-et-verre>' + VERRE_CSS + '</style>';
const VERRE_RX = /<nav\b[^>]*\bid="nav"|<header class="arh|<nav\b[^>]*\bet-space-header\b|id="nezBar"|<nav\b[^>]*\bpp-sub\b/;
// Lot 102 (choix du DG, 2 novembre 2026) : la feuille assets/chrome/allege-2026.css (chrome allégé : fusion de la
// barre utilitaire à partir de 1 536 px, masquage au défilement en dessous, sous-navigation non collante) suit la
// feuille de verre, en ligne elle aussi : sa couche et-allege est déclarée la deuxième.
const ALLEGE_CSS = readFileSync(new URL('../../assets/chrome/allege-2026.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n+/g, '\n').trim();
export const ALLEGE_TAG = '<style data-et-allege>' + ALLEGE_CSS + '</style>';
export function glassChrome(html) {
  if (html.includes('data-et-verre') || !VERRE_RX.test(html)) return html;
  // Une page (Configurateur) n'écrit pas <head> : la feuille suit alors la balise <html> (en-tête implicite).
  const m = /<head>|<html\b[^>]*>/.exec(html);
  if (!m) return html;
  const at = m.index + m[0].length;
  return html.slice(0, at) + VERRE_TAG + ALLEGE_TAG + html.slice(at);
}


// Lot 99, suite (choix du DG, 2 novembre 2026) : l'espace presse a sa page (/presse, /presse-en, /ar-presse,
// scripts/gen_presse_pages.py). Les pieds de page de 243 sources pointent encore vers l'ancre /communiques#presse ;
// ils sont réécrits à l'export (une règle au lieu de 243 sources, comme le menu par lib/main-nav.js et les
// capacités du menu par navCapabilities). L'ancre reste valable sur la page des communiqués. Idempotent.
export const pressRoom = html => html.replace(/href="\/communiques#presse"/g, 'href="/presse"').replace(/href="\/communiques-en#presse"/g, 'href="/presse-en"');

// Lot 100 (choix du DG, 2 novembre 2026) : « Dernière publication » sous le héros de l'accueil FR et EN.
// Revue ExxonMobil, écart « accueil sans fil d'actualité en tête » : la pièce datée la plus récente arrivait en
// 8e position, à 4 000 px. Une bande fine, calculée à l'export depuis les sources déjà datées au jour — les
// communiqués (liste de communiques(-en).html) et les carnets (datePublished des journal-*.html) ; les documents
// n'ont qu'un mois de date et ne concourent pas. Aucun chiffre ni texte nouveau : date, type, titre, lien.
// Idempotent ; contrôle : scripts/test_home_latest.py.
import { readdirSync } from 'node:fs';
const SRC_ROOT = new URL('../../', import.meta.url);
const MONTHS = { fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
                 en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const dateText = (iso, lang) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[lang][m - 1]} ${y}`; };
function latestOf(lang) {
  const en = lang === 'en';
  const items = [];
  try {
    const list = readFileSync(new URL(`communiques${en ? '-en' : ''}.html`, SRC_ROOT), 'utf8');
    for (const li of list.match(/<li id="cp-\d+">[\s\S]*?<\/li>/g) || []) {
      const date = (li.match(/<time datetime="([^"]+)"/) || [])[1], ref = (li.match(/<span>(CP-\d{4}-\d{3})<\/span>/) || [])[1];
      const title = ((li.match(/<h2>([\s\S]*?)<\/h2>/) || [])[1] || '').replace(/<[^>]+>/g, '').trim();
      if (date && ref && title) items.push({ date, title, href: `/communique/${ref.toLowerCase()}${en ? '-en' : ''}`, type: en ? 'Press release' : 'Communiqué' });
    }
    for (const f of readdirSync(SRC_ROOT)) {
      if (!/^journal-.*\.html$/.test(f) || f.endsWith('-en.html') !== en) continue;
      const t = readFileSync(new URL(f, SRC_ROOT), 'utf8');
      const date = (t.match(/"datePublished":"(\d{4}-\d{2}-\d{2})"/) || [])[1], title = (t.match(/"headline":"([^"]+)"/) || [])[1];
      if (date && title) items.push({ date, title, href: '/' + f.slice(0, -5), type: en ? 'Notebook' : 'Carnet' });
    }
  } catch { return null; }
  items.sort((a, b) => b.date.localeCompare(a.date) || a.href.localeCompare(b.href));
  return items[0] || null;
}
const LATEST = { fr: latestOf('fr'), en: latestOf('en') };
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const LATEST_CSS = '<style data-et-latest>.hm-latest{background:var(--et-paper,#faf8f3);color:var(--et-ink-900,#0A1A2F);border-bottom:1px solid rgba(16,26,44,.14);padding:10px 24px;font-size:.92rem;line-height:1.5}html:not(.et-plight) .hm-latest{background:var(--et-night-2,#0F1B2C);color:var(--et-snow,#F1F3F6);border-bottom-color:rgba(255,255,255,.14)}.hm-latest .hm-latest-row{margin:0;display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}.hm-latest strong{font-size:.72rem;letter-spacing:.12em;text-transform:uppercase}.hm-latest .hm-latest-row>*{display:inline-block;max-width:100%}.hm-latest a{color:inherit;text-decoration:underline;text-underline-offset:.2em}.hm-latest .hm-latest-all{margin-left:auto;text-decoration:none;opacity:.85}.hm-latest .hm-latest-sep{opacity:.5}</style>';
export function latestPublication(html, page = '') {
  const lang = page === 'index.html' ? 'fr' : page === 'index-en.html' ? 'en' : null;
  const it = lang && LATEST[lang];
  if (!it || html.includes('hm-latest')) return html;
  const hero = html.indexOf('<header class="et-hero"');
  const end = hero < 0 ? -1 : html.indexOf('</header>', hero);
  if (end < 0) return html;
  const at = end + '</header>'.length;
  const en = lang === 'en';
  const band = `<aside class="hm-latest" aria-label="${en ? 'Latest publication' : 'Dernière publication'}"><div class="et-inner"><div class="hm-latest-row"><strong>${en ? 'Latest publication' : 'Dernière publication'}</strong>` +
    `<span class="hm-latest-sep" aria-hidden="true">·</span><time datetime="${it.date}">${dateText(it.date, lang)}</time><span class="hm-latest-sep" aria-hidden="true">·</span><span>${it.type}</span>` +
    `<span class="hm-latest-sep" aria-hidden="true">·</span><a href="${it.href}">${esc(it.title)}</a><a class="hm-latest-all" href="${en ? '/publications-en' : '/publications'}">${en ? 'All publications' : 'Toutes les publications'} <span aria-hidden="true">→</span></a></div></div></aside>` + LATEST_CSS;
  return html.slice(0, at) + band + html.slice(at);
}

// Lot 69 (option A retenue par le DG) : trois scripts chargés sans « defer » vers la fin du <body>
// de 197 pages bloquaient la lecture de la page jusqu'à leur arrivée, et donc tous les scripts
// différés (dont le bandeau de consentement). Ils passent en « defer », dans le même ordre, comme
// sur les 81 pages qui les chargent déjà ainsi. Leurs globales sont gardées par « || » (verrou de
// défilement identique à celui de c_ac04328f0f47.js) ; aucun script en ligne ne les lit ensuite.
export const DEFER_SCRIPTS = ['u_cd226c00eb4b.js', 'u2_881fcf8bc439.js', 'u2_e8be195d19be.js'];
const DEFER_RX = new RegExp('<script src="(/assets/chrome/(?:' + DEFER_SCRIPTS.map(n => n.replace(/\./g, '\\.')).join('|') + ')[^"]*)"></script>', 'g');
export const deferScripts = html => html.replace(DEFER_RX, '<script defer src="$1"></script>');

// Lot 73 (choix du DG) : le menu « Activités & Ingénierie » présente les quatre capacités intégrées, pas deux.
// Les entrées Durabilité · GreenTech et Capital humain · Tchaditude sont insérées à l'export autour de
// Technologies · TchadiTech, dans les 217 pages FR/EN qui portent ce menu (une seule règle au lieu de
// 217 sources). Page courante marquée aria-current comme les autres entrées. Idempotent.
const NAV_CAPS = {
  fr: { tech: '/tchaditech/', green: ['/greentech/', 'Durabilité', 'GreenTech : eau, torchage, HSE-Q', 'greentech/index.html'],
        human: ['/tchaditude/', 'Capital humain', 'Tchaditude : académie, relève', 'tchaditude/index.html'] },
  en: { tech: '/pole-tchaditech-en', green: ['/pole-greentech-en', 'Sustainability', 'GreenTech: water, flaring, HSE-Q', 'pole-greentech-en.html'],
        human: ['/pole-tchaditude-en', 'Human capital', 'Tchaditude: academy, next generation', 'pole-tchaditude-en.html'] },
};
export function navCapabilities(html, page = '') {
  for (const lang of ['fr', 'en']) {
    const c = NAV_CAPS[lang];
    const rx = new RegExp('(<div class="nx-col pn-links">(?:(?!</div>).)*?)(<a href="' + c.tech.replace(/\//g, '\\/') + '"(?: aria-current="page")?><strong>Technologies</strong><em>[^<]*</em></a>)', 's');
    const m = html.match(rx);
    if (!m || m[1].includes('href="' + c.green[0] + '"')) continue;
    const link = ([href, label, sub, src]) => `<a href="${href}"${page === src ? ' aria-current="page"' : ''}><strong>${label}</strong><em>${sub}</em></a>`;
    html = html.replace(rx, (all, before, tech) => before + link(c.green) + tech + link(c.human));
  }
  return html;
}
