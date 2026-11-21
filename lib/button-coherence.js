// Cohérence des boutons — audit design du 20 novembre 2026.
// Le bouton d'action maison est à angles vifs, 56 px de haut, Inter 16 px / 600 (`.pp-btn`, héros des pages intérieures).
// Trois boutons s'en écartaient ; ils y sont ramenés par des styles en ligne posés à l'export, sans toucher aux feuilles
// liées (leurs jeux de CSS critique et le budget de dette CSS ne bougent pas). Seules des propriétés sans état de survol
// sont posées ici : les couleurs, qui changent au survol, restent aux feuilles.
//
// 1. `.mod-button` (« Discuter de cette étude → », pages de pôle) : rayon de 8 px, seul bouton arrondi de ces pages.
// 2. `#ctSend` (envoi du formulaire de contact) : rayon de 10 px, police système, 48 px de haut, collé au texte qui le précède.
// 3. `.et-primary` du héros de l'accueil : 54 px de haut à côté de boutons secondaires de 56 px.

export const MOD_BUTTON_STYLE = 'border-radius:0!important';
export const SUBMIT_STYLE = 'border-radius:0;font-family:inherit;min-height:56px;margin-top:16px';
export const HOME_PRIMARY_STYLE = 'min-height:56px!important';

const MOD_BUTTON = /<(a|summary) class="mod-button"(?![^>]*\bstyle=)/g;
const SUBMIT = /<button id="ctSend" type="submit"(?![^>]*\bstyle=)/g;
const HOME_PRIMARY = /<a class="et-primary"(?![^>]*\bstyle=)/g;
const HOME = /<main\b[^>]*\bclass="[^"]*\bet-home\b/;

export function withButtonCoherence(html) {
  if (typeof html !== 'string') return html;
  let out = html
    .replace(MOD_BUTTON, (_, tag) => `<${tag} class="mod-button" style="${MOD_BUTTON_STYLE}"`)
    .replace(SUBMIT, `<button id="ctSend" type="submit" style="${SUBMIT_STYLE}"`);
  if (HOME.test(out)) out = out.replace(HOME_PRIMARY, `<a class="et-primary" style="${HOME_PRIMARY_STYLE}"`);
  return out;
}
