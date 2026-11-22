// Cohérence des boutons — audit design du 20 novembre 2026, étendu par l'audit « boutons face aux majors » du 22 novembre 2026.
// Le bouton d'action maison est à angles vifs, 56 px de haut, Inter 16 px / 600 (`.pp-btn`). Trois niveaux seulement :
// or plein #E3BC62 (action principale), encre pleine #0A1A2F (action secondaire), texte. Les majors mesurés (ExxonMobil,
// TotalEnergies, bp, Eni, Chevron, Shell) n'ont chacun qu'une géométrie de bouton et des libellés courts.
//
// Les écarts sont ramenés au gabarit par des styles en ligne posés à l'export, sans toucher aux feuilles liées (leurs jeux de
// CSS critique ne bougent pas). Couleurs posées seulement là où le survol ne change pas la couleur de fond.
//
// Géométrie : `.mod-button`, `#ctSend`, envoi du formulaire fournisseur (`.sf button`), `.isv-cta` (Collecte, Services),
// `.btn` (Atlas, Carnets, Outils TchadiTech), `.fl-cta` (Réseau), accusé de réception arabe, héros de l'accueil.
// Clients (`.ec-primary`) : corrigé à la source, scripts/next/clients.mjs (pages générées après cette transformation).
// Couleurs : second or #D9B567 (`.pp-btn-gold`, héros de l'accueil) → #E3BC62 ; bleu `.isv-cta` → encre ; envois de formulaire
// (#172638, #C9A227) → or principal.
// Contact : pilules E-mail et WhatsApp portées à 44 px (cible tactile).
// Libellés : une formule par action (contact, échange sur un projet), flèches réservées à l'externe (↗) et au téléchargement (↓).

const GEOM = 'border-radius:0!important;min-height:56px!important';
const TYPE = 'font-family:inherit!important;font-size:1rem!important;font-weight:600!important';
const GOLD = 'background:#E3BC62!important;color:#0A1220!important;border-color:#E3BC62!important';
const INK = 'background:#0A1A2F!important;color:#FFFFFF!important';

export const MOD_BUTTON_STYLE = 'border-radius:0!important';
export const SUBMIT_STYLE = `border-radius:0;font-family:inherit;min-height:56px;margin-top:16px;${GOLD};${TYPE}`;
export const HOME_PRIMARY_STYLE = `min-height:56px!important;background:#E3BC62!important`;
export const POLE_GOLD_STYLE = 'background:#E3BC62!important';
export const ISV_STYLE = `${GEOM};${TYPE};${INK};padding:13px 22px!important`;
export const ATLAS_STYLE = `${GEOM};${TYPE};${INK};align-items:center`;
export const SUPPLIER_SUBMIT_STYLE = `${GEOM};${TYPE};${GOLD};border:1px solid #E3BC62`;
export const PILL_STYLE = 'min-height:44px';

// Libellés : clé = texte relevé (sans flèche finale), valeur = libellé canonique.
export const LABELS = {
  'Nous écrire': 'Nous contacter', 'Écrire à EnerTchad': 'Nous contacter', 'Contacter EnerTchad': 'Nous contacter',
  'Write to us': 'Contact us', 'Write to EnerTchad': 'Contact us', 'Contact EnerTchad': 'Contact us',
  'Discuter de cette étude': 'Discuter de ce projet', 'Discuter de ce service': 'Discuter de ce projet',
  'Discuter ce périmètre avec nous': 'Discuter de ce projet', 'Discuter ce chantier': 'Discuter de ce projet',
  'Parler de votre projet': 'Discuter de ce projet',
  'Discuss this study': 'Discuss this project', 'Discuss this service': 'Discuss this project',
  'Discuss this scope with us': 'Discuss this project', 'Discuss this work': 'Discuss this project',
  'Discuss this project with us': 'Discuss this project', 'Discuss your project': 'Discuss this project',
};

const HOME = /<main\b[^>]*\bclass="[^"]*\bet-home\b/;
// Boutons d'action : balise ouvrante dont la classe désigne un bouton, contenu sans balise de bloc.
const ACTION = /<(a|button|summary)\b([^>]*\bclass="(?:pp-btn[^"]*|mod-button|isv-cta|btn|btn btn-[ps]|fl-cta|et-primary|et-secondary|ec-primary[^"]*)"[^>]*)>([^<]*)<\/\1>/g;

function addStyle(attrs, css) {
  if (/\bstyle="/.test(attrs)) {
    if (attrs.includes(css)) return attrs;
    return attrs.replace(/\bstyle="([^"]*)"/, (_, s) => `style="${s.replace(/;?$/, ';')}${css}"`);
  }
  return `${attrs} style="${css}"`;
}

function cleanLabel(text, href) {
  const m = text.match(/^(\s*)(.*?)(\s*)$/s);
  let label = m[2], arrow = '';
  const t = label.match(/^(.*?)\s*([→↓↗])$/s);
  if (t) { label = t[1]; arrow = t[2]; }
  label = LABELS[label] || label;
  const external = /^https?:\/\//.test(href || '') && !/enertchad\.com/.test(href);
  const download = /\.(pdf|xlsx|csv|ics|zip)(?:[?#]|$)/i.test(href || '');
  const keep = external ? ' ↗' : download && arrow === '↓' ? ' ↓' : '';
  return m[1] + label + keep + m[3];
}

export function withButtonCoherence(html) {
  if (typeof html !== 'string') return html;
  let out = html
    .replace(/<(a|summary) class="mod-button"(?![^>]*\bstyle=)/g, (_, tag) => `<${tag} class="mod-button" style="${MOD_BUTTON_STYLE}"`)
    .replace(/<button id="ctSend" type="submit"(?:\s+style="[^"]*")?/g, `<button id="ctSend" type="submit" style="${SUBMIT_STYLE}"`);
  if (HOME.test(out)) {
    // Boutons secondaires du héros : la flèche décorative (lien interne) part, comme sur les autres boutons.
    out = out.replace(/(<a class="et-secondary"[^>]*>[^<]*?)\s*<span aria-hidden="true">→<\/span><\/a>/g, '$1</a>');
    out = out.replace(/<a class="et-primary"(?:\s+style="[^"]*")?/g, `<a class="et-primary" style="${HOME_PRIMARY_STYLE}"`);
  }
  out = out.replace(ACTION, (all, tag, attrs, text) => {
    const cls = (attrs.match(/\bclass="([^"]*)"/) || [])[1] || '';
    const href = (attrs.match(/\bhref="([^"]*)"/) || [])[1] || '';
    let a = attrs;
    if (/\bpp-btn-gold\b/.test(cls)) a = addStyle(a, POLE_GOLD_STYLE);
    else if (cls === 'isv-cta') a = addStyle(a, ISV_STYLE);
    else if (/^btn( btn-p)?$/.test(cls)) a = addStyle(a, ATLAS_STYLE);
    else if (cls === 'fl-cta') a = addStyle(a, `${GEOM};${TYPE};${GOLD};display:inline-flex;align-items:center;padding:0 22px`);
    return `<${tag}${a}>${cleanLabel(text, href)}</${tag}>`;
  });
  // Accusé de réception (arabe) : boutons à 10 px d'arrondi et 46 px.
  out = out.replace(/<div class="svc-actions">([\s\S]*?)<\/div>/g, (all, inner) =>
    `<div class="svc-actions">${inner.replace(/<a href="([^"]*)">/g, (m, href) => `<a href="${href}" style="${GEOM};${TYPE};display:inline-flex;align-items:center;padding:0 22px">`)}</div>`);
  // Envoi du formulaire fournisseur (Achats) : seul bouton de soumission de `.sf`.
  out = out.replace(/(<form\b[^>]*\bclass="sf"[^>]*>(?:(?!<\/form>)[\s\S])*?)<button type="submit"(?: style="[^"]*")?>/g,
    (_, before) => `${before}<button type="submit" style="${SUPPLIER_SUBMIT_STYLE}">`);
  // Pilules E-mail / WhatsApp de la page Contact : 44 px de cible tactile.
  out = out.replace(/style="(display:inline-flex;align-items:center;[^"]*border-radius:999px;padding:9px 16px;[^"]*)"/g,
    (all, css) => css.includes(PILL_STYLE) ? all : `style="${css};${PILL_STYLE}"`);
  return out;
}
