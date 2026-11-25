// Complementary conceptual collection, generated 25 November 2026.
// Content illustrations preserve the segment line-art heroes and all existing copy.
const ROOT = '/assets/img/collection-20261125/';
export const EDITORIAL_IMAGES = [
  { key: 'station-service', routes: ['/aval/reseau', '/aval/reseau-en'], before: 'reseau-carte',
    title: ['Imaginer le réseau de proximité', 'Envisioning a local service network'],
    alt: ['Illustration de synthèse d’une station-service dans un paysage sahélien.', 'Conceptual illustration of a service station in a Sahelian landscape.'] },
  { key: 'projet-modulaire', routes: ['/aval/raffinage', '/aval/raffinage-en'], before: 'mini-raffinerie-modele',
    title: ['Une représentation du principe modulaire', 'An illustration of the modular approach'],
    alt: ['Illustration de synthèse d’une installation industrielle modulaire au Sahel.', 'Conceptual illustration of a modular industrial installation in the Sahel.'] },
  { key: 'inspection-hse', routes: ['/cadre-hse', '/cadre-hse-en'], before: 'detail',
    title: ['La prévention, un travail collectif', 'Prevention as a shared responsibility'],
    alt: ['Deux professionnels fictifs examinent une fiche d’inspection près d’équipements industriels.', 'Two fictional professionals review an inspection checklist near industrial equipment.'] },
  { key: 'formation-talents', routes: ['/carrieres', '/carrieres-en'], before: 'metiers',
    title: ['Apprendre autour des métiers techniques', 'Learning through technical practice'],
    alt: ['Une formatrice et deux apprenants fictifs étudient un banc de démonstration industriel.', 'A fictional instructor and two adult trainees study an industrial demonstration bench.'] },
  { key: 'supervision-numerique', routes: ['/tchaditech/', '/pole-tchaditech-en'], before: 'solutions',
    title: ['Illustrer le suivi des installations', 'Illustrating industrial monitoring'],
    alt: ['Une ingénieure fictive consulte des écrans de supervision industrielle.', 'A fictional engineer consults industrial monitoring screens.'] },
  { key: 'communautes-eau', routes: ['/communautes', '/communautes-en'], before: 'acces',
    title: ['L’eau et l’énergie à l’échelle locale', 'Water and energy at a local scale'],
    alt: ['Des adultes fictifs échangent près d’une installation solaire d’alimentation en eau.', 'Fictional adults discuss a solar-powered water supply installation.'] }
];
const disclosure = en => en
  ? 'AI-generated conceptual illustration — fictional scene. No actual EnerTchad facility, employee or completed project depicted. This is not a technical design.'
  : 'Illustration de synthèse générée par IA — scène fictive. Aucune installation, équipe ou réalisation existante d’EnerTchad représentée. Ce visuel ne constitue pas un plan technique.';
function picture(item, en) {
  return `<picture><source type="image/avif" media="(max-width:760px)" srcset="${ROOT}${item.key}-mobile720.avif" width="720" height="405"><source media="(max-width:760px)" srcset="${ROOT}${item.key}-mobile720.webp" width="720" height="405"><img data-et-editorial-image="${item.key}" src="${ROOT}${item.key}-1400.webp" srcset="${ROOT}${item.key}-800.webp 800w, ${ROOT}${item.key}-1400.webp 1400w" sizes="(max-width:760px) calc(100vw - 40px), (max-width:1200px) 90vw, 1120px" alt="${item.alt[en ? 1 : 0]}" width="1400" height="788" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;object-fit:contain;aspect-ratio:1400/788;border-radius:12px"></picture>`;
}
export function withEditorialImages(html) {
  if (html.includes('data-et-editorial-collection=')) return html;
  const route = html.match(/<link\b[^>]*rel="canonical"[^>]*href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const en = /<html\b[^>]*\blang="en/.test(html);
  const item = EDITORIAL_IMAGES.find(item => item.routes.includes(route));
  if (item) {
    const marker = new RegExp(`<section\\b[^>]*\\bid="${item.before}"[^>]*>`);
    if (!marker.test(html)) throw new Error(`Missing editorial image placement on ${route}`);
    const title = `editorial-${item.key}-title`;
    const section = `<section class="pp-compact" data-et-editorial-collection="20261125" aria-labelledby="${title}"><div class="pp-wrap"><div class="pp-head"><h2 id="${title}">${item.title[en ? 1 : 0]}</h2></div><figure style="margin:0">${picture(item, en)}<figcaption style="margin-top:12px;line-height:1.6"><small>${disclosure(en)} <a href="/credits-photos${en ? '-en' : ''}#collection-20261125">${en ? 'Image credits' : 'Crédits du visuel'}</a></small></figcaption></figure></div></section>`;
    return html.replace(marker, section + '$&');
  }
  if (route === '/credits-photos' || route === '/credits-photos-en') {
    const cards = EDITORIAL_IMAGES.map(item => `<article class="cr-item"><span class="cr-th"><img src="${ROOT}${item.key}-800.webp" alt="" width="112" height="63" loading="lazy" decoding="async"></span><div><h3>${item.title[en ? 1 : 0]}</h3><p>${disclosure(en)}</p></div></article>`).join('');
    const section = `<section id="collection-20261125" data-et-editorial-collection="20261125" aria-labelledby="collection-20261125-title"><div class="pp-wrap"><div class="pp-head"><h2 id="collection-20261125-title">${en ? 'Complementary collection · 25 November 2026' : 'Collection complémentaire · 25 novembre 2026'}</h2></div><div class="pp-prose"><p>${en ? 'Six original conceptual illustrations created with the image generation tool for the service network, modular industry, safety, training, digital monitoring and water infrastructure. All people and places are fictional.' : 'Six illustrations conceptuelles originales créées avec l’outil de génération d’images pour le réseau de stations, l’industrie modulaire, la sécurité, la formation, la supervision numérique et les infrastructures d’eau. Les personnes et les lieux sont fictifs.'}</p></div><div class="cr-list">${cards}</div></div></section>`;
    return html.replace('<section aria-labelledby="cr-h1">', section + '<section aria-labelledby="cr-h1">');
  }
  return html;
}
