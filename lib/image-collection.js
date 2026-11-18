// Conceptual sector artwork, generated for EnerTchad on 17 November 2026.
// Scope is limited to six activity entrances, the customer scene and image credits.
// Since 18 November 2026 the Leadership, Reports, Sources and Compliance pages also use these images, written directly in their source (main.vi, pole-premium.css).
const ROOT = '/assets/img/collection-20261117/';
const POLES = {
  '/amont/': 'upstream', '/pole-amont-en': 'upstream',
  '/intermediaire/': 'transport', '/pole-intermediaire-en': 'transport',
  '/aval/': 'refining', '/pole-aval-en': 'refining',
  '/petrochimie/': 'petrochemicals', '/pole-enerchimie-en': 'petrochemicals',
  '/enerconseils/': 'engineering', '/pole-enerconseils-en': 'engineering',
  '/greentech/': 'transition', '/pole-greentech-en': 'transition'
};
const LABELS = {
  upstream: ['Forage sur une plaine sahélienne', 'Drilling on a Sahelian plain'],
  transport: ['Terminal de stockage et camion-citerne', 'Storage terminal and tanker truck'],
  refining: ['Unité modulaire de raffinage', 'Modular refining unit'],
  petrochemicals: ['Module de transformation pétrochimique', 'Petrochemical processing module'],
  engineering: ['Maquette industrielle et plans d’ingénierie', 'Industrial scale model and engineering drawings'],
  transition: ['Production solaire et stockage électrique', 'Solar generation and electrical storage'],
  clients: ['Livraison de carburant à un site industriel', 'Fuel delivery to an industrial customer']
};
const MOBILE = '(max-width:440px) and (orientation:portrait)';
const srcset = key => `${ROOT}${key}-800.webp 800w, ${ROOT}${key}-1400.webp 1400w`;
const credit = en => en ? 'AI-generated conceptual illustration · No actual EnerTchad facility depicted.' : 'Illustration de synthèse générée par IA · Aucune installation réelle d’EnerTchad représentée.';
function picture(key, en) {
  const alt = `${en ? 'Conceptual illustration' : 'Illustration de synthèse'} : ${LABELS[key][en ? 1 : 0]}`;
  return `<picture data-et-collection="${key}"><source type="image/avif" media="${MOBILE}" srcset="${ROOT}${key}-m720.avif" width="720" height="927"><source media="${MOBILE}" srcset="${ROOT}${key}-m720.webp" width="720" height="927"><img class="pp-hero-img" src="${ROOT}${key}-1400.webp" srcset="${srcset(key)}" sizes="100vw" alt="${alt}" width="1400" height="788" fetchpriority="high"></picture>`;
}
export function withImageCollection(html) {
  if (html.includes('data-et-collection=')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const en = /<html\b[^>]*\blang="en/.test(html);
  const key = POLES[route];
  if (key) {
    const hero = /(<header\b[^>]*\bid="top-pole"[^>]*>)<picture>[\s\S]*?<\/picture>/;
    if (!hero.test(html)) return html;
    html = html.replace(hero, (_, open) => open + picture(key, en));
    html = html.replace(/<link\b(?=[^>]*\brel="preload")(?=[^>]*\bas="image")[^>]*>/g, '');
    const preloads = `<link rel="preload" as="image" type="image/avif" href="${ROOT}${key}-m720.avif" media="${MOBILE}" fetchpriority="high"><link rel="preload" as="image" href="${ROOT}${key}-1400.webp" imagesrcset="${srcset(key)}" imagesizes="100vw" media="not all and ${MOBILE}" fetchpriority="high">`;
    html = html.replace('</head>', preloads + '</head>');
    // Keep the disclosure in the normal document flow, with the existing body typography.
    const at = html.indexOf('id="top-pole"');
    const end = html.indexOf('</header>', at);
    const note = `<div class="pp-wrap" data-et-image-credit><p><small><a href="/credits-photos${en ? '-en' : ''}#collection-20261117">${credit(en)}</a></small></p></div>`;
    return html.slice(0, end + 9) + note + html.slice(end + 9);
  }
  if (route === '/clients' || route === '/clients-en') {
    return html.replace(/(<section\b[^>]*\bid="g568-r"[^>]*>)([\s\S]*?)(<\/section>)/, (_, open, body, close) => {
      const scene = body.replace(/<img\b[^>]*\bclass="im-bg"[^>]*>/, `<img class="im-bg" data-et-collection="clients" aria-hidden="true" alt="" src="${ROOT}clients-1400.webp" srcset="${srcset('clients')}" sizes="100vw" width="1400" height="788" loading="lazy" decoding="async">`);
      if (scene === body) return open + body + close;
      return open + scene + close + `<div class="pp-wrap" data-et-image-credit><p><small><a href="/credits-photos${en ? '-en' : ''}#collection-20261117">${credit(en)}</a></small></p></div>`;
    });
  }
  if (route === '/credits-photos' || route === '/credits-photos-en') {
    html = html.replaceAll(en ? 'original line illustrations drawn for EnerTchad' : 'illustrations originales au trait, dessinées pour EnerTchad', en ? 'line illustrations and AI-generated conceptual artwork created for EnerTchad' : 'illustrations au trait et visuels de synthèse générés par IA pour EnerTchad');
    html = html.replace(en ? 'Since 12 November 2026, the images on this site are line illustrations drawn for EnerTchad.' : 'Depuis le 12 novembre 2026, les images de ce site sont des illustrations au trait dessinées pour EnerTchad.', en ? 'This site combines line illustrations introduced on 12 November 2026 with a collection of AI-generated conceptual illustrations created on 17 November 2026.' : 'Ce site associe les illustrations au trait introduites le 12 novembre 2026 à une collection de visuels de synthèse générés par IA le 17 novembre 2026.');
    html = html.replace(en ? 'Original illustrations drawn for EnerTchad' : 'Illustrations originales dessinées pour EnerTchad', en ? 'Line illustrations and conceptual artwork created for EnerTchad' : 'Illustrations au trait et visuels de synthèse créés pour EnerTchad');
    const cards = Object.entries(LABELS).map(([id, labels]) => `<article class="cr-item"><span class="cr-th"><img src="${ROOT}${id}-800.webp" alt="" width="112" height="63" loading="lazy" decoding="async"></span><div><h3>${labels[en ? 1 : 0]}</h3><p>${credit(en)}</p></div></article>`).join('');
    const section = `<section id="collection-20261117" data-et-collection="credits" aria-labelledby="collection-title"><div class="pp-wrap"><div class="pp-head"><h2 id="collection-title">${en ? 'Conceptual collection · November 2026' : 'Collection de synthèse · Novembre 2026'}</h2></div><div class="pp-prose"><p>${en ? 'Seven AI-generated editorial illustrations, created with the image generation tool for EnerTchad. These imagined sector scenes do not document any real place, company-owned asset, operating capacity or completed project. They are not technical designs.' : 'Sept illustrations éditoriales générées par IA avec l’outil de création d’images pour EnerTchad. Ces scènes métiers imaginées ne documentent aucun lieu réel, actif détenu par la société, capacité opérationnelle ou projet réalisé. Elles ne constituent pas des plans techniques.'}</p></div><div class="cr-list">${cards}</div></div></section>`;
    return html.replace('<section aria-labelledby="cr-h1">', section + '<section aria-labelledby="cr-h1">');
  }
  return html;
}
