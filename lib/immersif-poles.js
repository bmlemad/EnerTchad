// Lot 113 (10 novembre 2026, choix du DG) : direction immersive, phase B — pages d'entrée des huit pôles, FR et EN.
// Sur ces 16 pages seulement (adresse canonique), au build :
//   - la section #conviction devient une scène : photo de fond propre au pôle (déjà publiée sur le site, chargée au
//     défilement, marquée décorative), manifeste posé dans une carte en verre, texte clair ;
//   - dans #statut-reel, les libellés « Fait », « En cours », « Priorité », « Visé » deviennent des pastilles d'état.
// Les styles sont écrits en ligne (bloc #et-immersif-poles), repris d'assets/chrome/immersif-2026.css entre les repères
// poles:start / poles:end : une feuille liée de plus changerait l'empreinte de ces pages et désactiverait leur CSS critique
// (même choix que lib/main-nav.js). Textes inchangés. Idempotent.
import { readFileSync } from 'node:fs';

const SHEET = readFileSync(`${process.cwd()}/assets/chrome/immersif-2026.css`, 'utf8');
const CUT = SHEET.match(/\/\* poles:start[^*]*\*\/([\s\S]*?)\/\* poles:end \*\//);
const CSS = CUT ? CUT[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s*/g, '').trim() : '';
// Règles propres aux pôles : le thème clair du gabarit force une encre sombre sur les titres et paragraphes ; dans la carte
// en verre, le texte reste clair. Même couche et-verre que le verre lui-même (première couche déclarée de la page).
const POLES = '.im-scene .im-glass.pp-sig{padding:clamp(20px,3vw,36px)}'
  + '@layer et-verre{main.ppl .im-scene .im-glass :is(h2,h3,p,b,span){color:#F1F3F6!important;-webkit-text-fill-color:currentColor!important}'
  + 'main.ppl .im-scene .im-glass .pp-k{color:#E0BD70!important}'
  // Le gabarit impose « height:auto!important » à toutes les images : sans cette ligne, la photo ne couvre que le haut de la scène sur mobile.
  + 'main.ppl .im-scene>.im-bg{height:100%!important}}';
const STYLE = `<style id="et-immersif-poles">${CSS}${POLES}</style>`;

// Adresse canonique → photo de fond (assets/img/p/<nom>-800.webp et -1400.webp), différente de celle du héros de la page.
const PHOTO = {
  '/amont/': 'pompe-petrole', '/pole-amont-en': 'pompe-petrole',
  '/intermediaire/': 'camion-route', '/pole-intermediaire-en': 'camion-route',
  '/aval/': 'aval-reseau', '/pole-aval-en': 'aval-reseau',
  '/petrochimie/': 'complexe-industriel', '/pole-enerchimie-en': 'complexe-industriel',
  '/greentech/': 'dunes-sahara', '/pole-greentech-en': 'dunes-sahara',
  '/tchaditech/': 'lac-tchad-espace', '/pole-tchaditech-en': 'lac-tchad-espace',
  '/tchaditude/': 'chantier-ferraillage', '/pole-tchaditude-en': 'chantier-ferraillage',
  '/enerconseils/': 'flamme-gaz', '/pole-enerconseils-en': 'flamme-gaz'
};
const STATUS = {
  Fait: 'fait', Done: 'fait', 'En cours': 'cours', 'In progress': 'cours',
  'Priorité': 'confirmer', Priority: 'confirmer', 'Visé': 'vise', Targeted: 'vise'
};

export function withImmersifPoles(html) {
  if (!CSS || html.includes('id="et-immersif-poles"') || !html.includes('class="ppl"')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const photo = PHOTO[route];
  if (!photo) return html;
  const open = '<section id="conviction" aria-labelledby="pp-conv">';
  const at = html.indexOf(open);
  if (at < 0) return html;
  const close = html.indexOf('</section>', at);
  const section = html.slice(at + open.length, close);
  const sig = '<div class="pp-sig">';
  if (!section.includes(sig)) return html; // certaines pages posent une ancre entre la section et son conteneur : on cherche le bloc, pas la suite exacte
  const bg = `<img class="im-bg" aria-hidden="true" alt="" src="/assets/img/p/${photo}-1400.webp" srcset="/assets/img/p/${photo}-800.webp 800w, /assets/img/p/${photo}-1400.webp 1400w" sizes="100vw" width="1400" height="934" loading="lazy" decoding="async">`;
  let out = html.slice(0, at) + '<section id="conviction" class="im-scene" aria-labelledby="pp-conv">' + bg
    + section.replace(sig, '<div class="pp-sig im-glass">') + html.slice(close);
  const start = out.indexOf('id="statut-reel"');
  if (start >= 0) {
    const end = out.indexOf('</section>', start);
    const block = out.slice(start, end).replace(/<li><b>([^<]+)<\/b> — /g, (m, label) =>
      STATUS[label] ? `<li><span class="im-status im-status-${STATUS[label]}">${label}</span> ` : m);
    out = out.slice(0, start) + block + out.slice(end);
  }
  return out.replace('</head>', STYLE + '</head>');
}
