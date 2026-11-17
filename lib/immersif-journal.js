// Lot 138 (phase C, articles du journal, plan validé par le DG) : une scène immersive par article, 33 articles en français et 33 en anglais.
// Un article est une colonne de lecture (div.jbody, 680 px) sans section pleine largeur : la scène ne peut donc pas « devenir » une section
// existante comme sur les pages de pôle. Au build, sur les adresses canoniques /journal-*, la colonne est coupée avant un intertitre choisi
// et rouverte après son passage ; ce passage, déjà présent dans l'article (aucun texte ajouté), est posé dans la carte de verre sur une
// illustration de fond déjà publiée (chargée au défilement), texte clair. Une seule scène par article, jamais plus.
// Choix du passage, identique en FR et en EN (même structure) : parmi les intertitres dont le passage ne contient que des paragraphes, listes
// ou citations (pas de chiffre clé, tableau, figure ni gadget) et compte de 40 à 170 mots, le dernier situé au plus à l'avant-dernier
// intertitre (celui qui porte la thèse) ; à défaut, le premier qui convient. Styles en ligne (bloc #et-immersif-journal), repris de
// assets/chrome/immersif-2026.css entre les repères poles:start / poles:end : une feuille liée de plus changerait l'empreinte de ces pages.
// Idempotent ; inchangé si le gabarit manque.
import { readFileSync } from 'node:fs';

const SHEET = readFileSync(`${process.cwd()}/assets/chrome/immersif-2026.css`, 'utf8');
const CUT = SHEET.match(/\/\* poles:start[^*]*\*\/([\s\S]*?)\/\* poles:end \*\//);
const CSS = CUT ? CUT[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '').trim() : '';
const JOURNAL = '.im-journal{margin:clamp(20px,4vw,40px) 0}'
  + '.im-journal .im-jin{max-width:820px;margin:0 auto;padding:clamp(48px,7vw,96px) clamp(16px,4vw,24px)}'
  + '.im-journal .im-glass{padding:clamp(20px,3vw,40px)}'
  + '.im-journal .jbody{padding:0}'
  + '.im-journal .jbody h2{margin-top:0}'
  + '.im-journal .jbody>:last-child{margin-bottom:0}'
  + '@layer et-verre{.im-journal .im-glass :is(h2,p,li,blockquote,strong,em,b,i,span,cite){color:#F1F3F6!important;-webkit-text-fill-color:currentColor!important}'
  + '.im-journal .im-glass a{color:#E8CD7F!important;-webkit-text-fill-color:currentColor!important;text-decoration:underline;text-underline-offset:3px}'
  + '.im-journal .im-glass blockquote{border-color:rgba(255,255,255,.4)!important;background:transparent!important}'
  + '.im-journal>.im-bg{height:100%!important}}';
const STYLE = `<style id="et-immersif-journal">${CSS}${JOURNAL}</style>`;

// Illustration de fond par article (déjà publiées, 800 et 1400 px), jamais la planche de l'article.
const PHOTOS = {
  'atlas-secteur': 'dunes-sahara', 'bitume-routes': 'aval-produits', 'brut-par-camion': 'camion-route',
  'champ-numerique': 'code-numerique', 'chimie-eor-locale': 'unite-petrochimie', 'corridor-doba-kribi': 'pipeline',
  'criblage-eor': 'pompe-petrole', 'eau-de-production': 'lac-tchad-espace', 'enigme-densite-brut': 'raffinerie-jour',
  'eor-baril-additionnel': 'pompe-petrole', 'forage-directionnel': 'chantier-ferraillage', 'former-avant-extraire': 'village-sahel',
  'gaz-sedigui': 'flamme-gaz', 'gaz-torche': 'flamme-gaz', 'gouvernance-avant-actifs': 'complexe-industriel',
  'gpl-bois-energie': 'village-sahel', 'hybride-gaz-solaire': 'solaire-champ', 'integrite-faire-durer': 'complexe-industriel',
  'interview-comptage': 'aval-reseau', 'interview-controle': 'raffinerie-jour', 'interview-wellpads': 'chantier-ferraillage',
  'marques-clients': 'aval-commercialisation', 'mecanique-fluides': 'raffinerie-jour', 'mini-raffinerie-modulaire': 'raffinerie-jour',
  'mobile-stations': 'aval-distribution', 'premiere-du-genre': 'complexe-industriel', 'prix-litre': 'aval-produits',
  'prix-uree': 'unite-petrochimie', 'production-anticipee': 'pompe-petrole', 'rente-partagee': 'village-sahel',
  'robotique-terrain': 'code-numerique', 'stockage-strategique': 'complexe-industriel', 'transfert-garde': 'dunes-sahara',
};

const VOID = new Set(['br', 'img', 'input', 'link', 'meta', 'hr', 'source', 'path', 'circle', 'rect', 'line', 'use', 'stop']);
const ALLOWED = new Set(['p', 'ul', 'ol', 'blockquote']);

// Enfants de premier niveau du conteneur ouvert en `from` (juste après sa balise ouvrante) : [{ tag, cls, start, end }], et la fin du conteneur.
function scan(html, from) {
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  re.lastIndex = from;
  const children = [];
  let depth = 0;
  let open = null;
  let m;
  while ((m = re.exec(html))) {
    const [all, close, tag, attrs] = m;
    const name = tag.toLowerCase();
    if (!close && (name === 'script' || name === 'style')) {
      const end = html.indexOf(`</${name}>`, re.lastIndex);
      if (end < 0) return null;
      re.lastIndex = end + name.length + 3;
      if (depth === 0) children.push({ tag: name, cls: '', start: m.index, end: re.lastIndex });
      continue;
    }
    if (close) {
      if (depth === 0) return { children, end: m.index };
      depth--;
      if (depth === 0 && open) { open.end = re.lastIndex; children.push(open); open = null; }
      continue;
    }
    if (VOID.has(name) || attrs.endsWith('/')) {
      if (depth === 0) children.push({ tag: name, cls: '', start: m.index, end: re.lastIndex });
      continue;
    }
    if (depth === 0) open = { tag: name, cls: attrs.match(/class="([^"]*)"/)?.[1] || '', start: m.index };
    depth++;
  }
  return null;
}

const words = fragment => fragment.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').split(/\s+/).filter(Boolean).length;

// Passages candidats : [{ from, to, words }], un par intertitre de premier niveau dont le passage ne contient que des éléments admis.
function candidates(html, children) {
  const heads = children.map((c, i) => (c.tag === 'h2' ? i : -1)).filter(i => i >= 0);
  return heads.map((h, k) => {
    const next = k + 1 < heads.length ? heads[k + 1] : children.length;
    const parts = children.slice(h + 1, next);
    const ok = parts.every(c => ALLOWED.has(c.tag) && !/\bjkey\b/.test(c.cls));
    return { from: children[h].start, to: children[next - 1].end, words: words(html.slice(children[h].start, children[next - 1].end)), ok, index: k, total: heads.length };
  });
}

export function withImmersifJournal(html) {
  if (!CSS || html.includes('id="et-immersif-journal"')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com\/journal-([a-z0-9-]+?)(-en)?"/);
  const photo = route && PHOTOS[route[1]];
  if (!photo) return html;
  const open = '<div class="jbody">';
  const start = html.indexOf(open);
  if (start < 0 || html.indexOf(open, start + 1) >= 0) return html;
  const inner = start + open.length;
  const scanned = scan(html, inner);
  if (!scanned) return html;
  const list = candidates(html, scanned.children).filter(c => c.ok && c.words >= 40 && c.words <= 170);
  if (!list.length) return html;
  const target = list.filter(c => c.index <= c.total - 2).pop() || list[0];
  const before = html.slice(inner, target.from);
  const passage = html.slice(target.from, target.to);
  const after = html.slice(target.to, scanned.end);
  const h2 = passage.match(/^<h2\b([^>]*)>/);
  if (!h2 || /\sid=/.test(h2[1])) return html;
  const titled = passage.replace(/^<h2\b/, '<h2 id="im-journal-h"');
  const bg = `<img class="im-bg" aria-hidden="true" alt="" src="/assets/img/p/${photo}-1400.webp" srcset="/assets/img/p/${photo}-800.webp 800w, /assets/img/p/${photo}-1400.webp 1400w" sizes="100vw" width="1400" height="934" loading="lazy" decoding="async">`;
  const scene = `<section class="im-scene im-journal" aria-labelledby="im-journal-h">${bg}<div class="im-jin"><div class="im-glass"><div class="jbody">${titled}</div></div></div></section>`;
  const rest = after.trim() ? `<div class="jbody">${after}` : '<div class="jbody" style="padding:0">';
  const out = html.slice(0, inner) + before + '</div>' + scene + rest + html.slice(scanned.end);
  return out.replace('</head>', STYLE + '</head>');
}
