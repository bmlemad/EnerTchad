// Défauts visibles sur mobile relevés par l'audit design du 20 novembre 2026.
// Styles en ligne : ils ne pèsent ni sur les feuilles ni sur les budgets de dette CSS, et
// l'emportent sur les règles concurrentes sans allonger les chaînes de sélecteurs.
//
// 1. Slogan du pied de page : `.brand-tx{max-width:145px}` (nav_a.css, mobile) tronquait
//    « L’énergie du Tchad. Intégrée. » (215 px) à « L’énergie du Tchad. » hors accueil.
// 2. Image des bandes immersives (`.vi-band-img`) : une règle `height:auto!important` des
//    pages de pôle la ramenait à sa hauteur naturelle sur mobile ; la bande, plus haute,
//    laissait voir une couture au milieu du texte.

// 3. Bouton « retour en haut » (#toTop) : sur mobile il recouvrait du contenu (liens, texte de cartes) au-dessus de la barre
//    du bas. Décision du DG (20 novembre 2026) : masqué sur mobile. Son `display` passe par la variable `--et-totop`, que
//    premium-chrome.css met à `none` sous 769 px (largeurs où la barre du bas #nezBar est affichée).

export const TAGLINE_STYLE = 'max-width:none';
export const BAND_IMAGE_STYLE = 'height:100%!important';
export const BACK_TO_TOP_STYLE = 'display:var(--et-totop,grid)!important';

const FOOTER = /<footer\b[\s\S]*?<\/footer>/g;
const TAGLINE = /<span class="brand-tx et-tag">/g;
const BAND_IMAGE = /<img class="vi-band-img"(?![^>]*\bstyle=)/g;
const BACK_TO_TOP = /<button\b(?=[^>]*\bid="toTop")(?![^>]*\bstyle=)/g;

export function withMobileFixes(html) {
  if (typeof html !== 'string') return html;
  return html
    .replace(FOOTER, footer => footer.replace(TAGLINE, `<span class="brand-tx et-tag" style="${TAGLINE_STYLE}">`))
    .replace(BAND_IMAGE, `<img class="vi-band-img" style="${BAND_IMAGE_STYLE}"`)
    .replace(BACK_TO_TOP, `<button style="${BACK_TO_TOP_STYLE}"`);
}
