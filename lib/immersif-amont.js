// Lot 122 (12 novembre 2026, choix du DG) : direction immersive, phase C, pilote sur les pages sous /amont — étape 1.
// Dix pages au même gabarit : développement de champ, eau de production, forage, réserves, traitement ; FR et EN.
// Au build, sur ces dix pages seulement (adresse canonique), la section « Ce que nous mettons en œuvre » (EN : « What we put
// in place ») devient une scène : photo de fond décorative (déjà publiée sur le site, chargée au défilement), titre et
// quatre cellules posés dans une carte en verre (le contenu garde sa colonne .pp-prose, donc la grille de cellules), texte clair. Textes inchangés. Idempotent.
// La section est dans une colonne de texte (div.pp-prose) : pour que la scène occupe toute la largeur, la section parente
// est coupée avant elle et rouverte après (#detail reste sur la première partie ; les ancres ne changent pas).
// Styles en ligne (bloc #et-immersif-amont), repris d'assets/chrome/immersif-2026.css entre les repères poles:start / poles:end :
// une feuille liée de plus changerait l'empreinte de ces pages et désactiverait leur CSS critique (même choix que lib/immersif-poles.js).
import { readFileSync } from 'node:fs';

const SHEET = readFileSync(`${process.cwd()}/assets/chrome/immersif-2026.css`, 'utf8');
const CUT = SHEET.match(/\/\* poles:start[^*]*\*\/([\s\S]*?)\/\* poles:end \*\//);
const CSS = CUT ? CUT[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '').trim() : '';
// Dans la carte en verre, le thème clair du gabarit force une encre sombre sur les titres et paragraphes : le texte reste clair.
// Même couche et-verre que le verre lui-même. La section reprise garde le remplissage vertical du gabarit (72 px) : sans l'avant-dernière règle, la carte aurait du vide en haut et en bas. Le gabarit impose « height:auto!important » aux images : sans la dernière
// ligne, la photo ne couvre que le haut de la scène sur mobile.
const AMONT = '.im-scene{padding-block:clamp(48px,7vw,96px)}'
  + '.im-scene .im-amont-card{padding:clamp(20px,3vw,40px)}'
  + '@layer et-verre{main.ppl .im-scene .im-glass :is(h2,h3,p,b,span,td,th){color:#F1F3F6!important;-webkit-text-fill-color:currentColor!important}'
  + 'main.ppl .im-scene .im-glass .pp-cell{background:transparent!important;border-color:rgba(255,255,255,.28)!important}'
  + 'main.ppl .im-scene .im-amont-card section{padding-block:0!important}'
  + 'main.ppl .im-scene>.im-bg{height:100%!important}}';
const STYLE = `<style id="et-immersif-amont">${CSS}${AMONT}</style>`;

const BASES = ['developpement', 'eau', 'forage', 'reserves', 'traitement'];
const ROUTES = new Set(BASES.flatMap(b => [`/amont/${b}`, `/amont/${b}-en`]));
const TITLES = ['Ce que nous mettons en œuvre', 'What we put in place'];
const PHOTO = 'pompe-petrole'; // différente du héros de ces pages (chantier de ferraillage)

export function withImmersifAmont(html) {
  if (!CSS || html.includes('id="et-immersif-amont"') || !html.includes('class="ppl"')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  if (!ROUTES.has(route)) return html;
  // La section visée : <section><h2>titre</h2> … </section>, sans <section> imbriquée (une grille de cellules, pas une section).
  let start = -1;
  let title = '';
  for (const t of TITLES) {
    start = html.indexOf(`<section><h2>${t}</h2>`);
    if (start >= 0) { title = t; break; }
  }
  if (start < 0) return html;
  const end = html.indexOf('</section>', start);
  if (end < 0) return html;
  const body = html.slice(start + `<section><h2>${title}</h2>`.length, end);
  if (body.includes('<section')) return html;
  // La section parente doit être celle de la colonne de texte, et se refermer après la section visée.
  const head = html.slice(0, start);
  const wrapOpen = head.lastIndexOf('<section id="detail" class="pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w">');
  if (wrapOpen < 0) return html;
  const after = html.slice(end + '</section>'.length);
  const wrapClose = after.indexOf('</div></div></section>');
  if (wrapClose < 0) return html;
  const bg = `<img class="im-bg" aria-hidden="true" alt="" src="/assets/img/p/${PHOTO}-1400.webp" srcset="/assets/img/p/${PHOTO}-800.webp 800w, /assets/img/p/${PHOTO}-1400.webp 1400w" sizes="100vw" width="1400" height="934" loading="lazy" decoding="async">`;
  const scene = `</div></div></section><section class="im-scene" aria-labelledby="im-amont-h">${bg}<div class="pp-wrap"><div class="im-glass im-amont-card"><div class="pp-prose pp-prose-w"><section><h2 id="im-amont-h">${title}</h2>${body}</section></div></div></div></section>`
    + '<section class="pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w">';
  const out = html.slice(0, start) + scene + after;
  return out.replace('</head>', STYLE + '</head>');
}
