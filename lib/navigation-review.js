import { htmlToDOM } from 'html-react-parser';
import { withMainNav } from './main-nav.js';
import { withCorporateFooter, corporateArchitectureCss } from './corporate-architecture.js';

function nodes(html) {
  const all = [];
  const walk = node => { all.push(node); (node.children || []).forEach(walk); };
  htmlToDOM(html, { withStartIndices: true, withEndIndices: true }).forEach(walk);
  return all;
}
const hasClass = (node, name) => (node.attribs?.class || '').split(/\s+/).includes(name);
const content = node => node.data || (node.children || []).map(content).join('');
const part = (html, node) => html.slice(node.startIndex, node.endIndex + 1);
function edit(html, changes) {
  return changes.sort((a, b) => b[0] - a[0]).reduce((text, [start, end, value]) => text.slice(0, start) + value + text.slice(end), html);
}

function corporateNav(html, en) {
  if (html.includes('data-et-architecture="six"')) return html;
  let output = html.replace(/<a\b([^>]*\bclass="(?:nx-invest|cta)"[^>]*)>[\s\S]*?<\/a>/g, (tag, attrs) => {
    if (!/href="\/contact(?:-en)?\?profil=invest#ctForm"/.test(attrs)) return tag;
    return '<a' + attrs.replace(/href="[^"]*"/, `href="/contact${en ? '-en' : ''}#ctForm"`) + '>' + (en ? 'Discuss your requirements' : 'Présenter un besoin') + '</a>';
  });
  output = output.replace(en ? '>Customers</a>' : '>Clients</a>', en ? '>Client solutions</a>' : '>Solutions clients</a>');
  // Both utility copies must use the same name and route.
  output = output.replace(en ? '>Customers</a>' : '>Clients</a>', en ? '>Client solutions</a>' : '>Solutions clients</a>');
  const all = nodes(output), panel = all.find(n => n.attribs?.id === 'nxm-e');
  if (!panel || output.includes('nx-resource-groups') || output.includes('nx-grouped')) return output; // lot 80 : menu déjà groupé par main-nav.js
  const within = all.filter(n => n.startIndex > panel.startIndex && n.endIndex < panel.endIndex);
  const links = within.find(n => hasClass(n, 'pn-links'));
  const intro = within.find(n => hasClass(n, 'pn-intro'));
  if (!links || !intro) return output;
  const anchors = within.filter(n => n.name === 'a' && n.startIndex > links.startIndex && n.endIndex < links.endIndex);
  const buckets = [[], [], []];
  for (const anchor of anchors) {
    const href = anchor.attribs.href || '';
    const group = /^\/(?:carnets|communiques|presse)/.test(href) ? 0 : /^\/(?:publications|atlas|glossaire)/.test(href) ? 1 : 2;
    buckets[group].push(part(output, anchor));
  }
  if (!anchors.some(a => /^\/publications/.test(a.attribs.href))) buckets[1].unshift(`<a href="/publications${en ? '-en' : ''}"><strong>${en ? 'Publications &amp; documents' : 'Publications &amp; documents'}</strong><em>${en ? 'Brochures, fact sheets, Data Book' : 'Brochures, fiches, Data Book'}</em></a>`);
  const labels = en ? ['News &amp; press', 'Documents &amp; data', 'Commitments &amp; transparency'] : ['Actualités &amp; presse', 'Documents &amp; données', 'Engagements &amp; transparence'];
  const grouped = `<div class="nx-col pn-links nx-resource-groups">${buckets.map((items, i) => `<section class="nx-resource-group" aria-label="${labels[i]}"><p class="nx-resource-title">${labels[i]}</p>${items.join('')}</section>`).join('')}</div>`;
  const description = en ? 'News, public documents, sector data and commitments.' : 'Actualités, documents publics, données du secteur et engagements.';
  let introHtml = part(output, intro).replace(/<p class="pn-d">[\s\S]*?<\/p>/, `<p class="pn-d">${description}</p>`);
  introHtml = introHtml.replace(/<a class="pn-all"[\s\S]*?<\/a>/, `<a class="pn-all" href="/publications${en ? '-en' : ''}"><strong>${en ? 'Publications &amp; documents' : 'Publications &amp; documents'}</strong><em>${en ? 'Public group documents' : 'Documents publics du groupe'}</em></a>`);
  return edit(output, [[links.startIndex, links.endIndex + 1, grouped], [intro.startIndex, intro.endIndex + 1, introHtml]]);
}

function footer(html, en, ar) {
  if (ar) {
    if (html.includes('/ethique#alerte')) return html;
    return html.replace(/(<a href="\/avertissements"[^>]*>[\s\S]*?<\/a>)/, '$1<a href="/ethique#alerte" hreflang="fr">الإبلاغ الأخلاقي (FR)</a>');
  }
  if (html.includes('data-et-footer-columns="2"')) return html; // déjà traité (17 novembre 2026) : idempotence
  const labels = en ? [['Sections', 'Company &amp; activities'], ['Quick access', 'Professional access'], ['Information', 'Information &amp; trust']] : [['Rubriques', 'Entreprise &amp; activités'], ['Accès directs', 'Accès professionnels'], ['Informations', 'Informations &amp; confiance']];
  let output = html;
  for (const [old, label] of labels) output = output.replace(`<h3>${old}</h3>`, `<h3>${label}</h3>`);
  output = output.replace(en ? '<a href="/carnets-en">Resources</a>' : '<a href="/carnets">Ressources</a>', `<a href="/publications${en ? '-en' : ''}">${en ? 'Documents &amp; resources' : 'Documents &amp; ressources'}</a>`);
  const news = nodes(output).find(n => hasClass(n, 'foot-news'));
  if (news && !hasClass(news, 'et-footer-pending')) {
    const pending = `<div class="foot-news et-footer-pending"><p>${en ? 'Newsletter registration is being prepared.' : 'L’inscription à la newsletter est en préparation.'}</p><a href="/newsletter${en ? '-en' : ''}">${en ? 'Newsletter information' : 'À propos de la newsletter'} →</a></div>`;
    output = edit(output, [[news.startIndex, news.endIndex + 1, pending]]);
  }
  // 17 novembre 2026 (décision du DG, comparaison avec les majors) : aucune mention « en préparation » dans le pied de page.
  // Le bandeau newsletter disparaît tant que l'inscription n'est pas ouverte ; la page /newsletter reste accessible par le Centre.
  {
    const pendingNews = nodes(output).find(n => hasClass(n, 'et-footer-pending'));
    if (pendingNews) output = edit(output, [[pendingNews.startIndex, pendingNews.endIndex + 1, '']]);
  }
  output = withCorporateFooter(output, en);
  // 16 novembre 2026 (décision du DG, « épurer la navigation ») : le Centre de connaissances indexe toutes les pages secondaires.
  // La rangée « Ressources » du lot 124 disparaît ; la colonne d'accès garde les entrées propres à un public (le contact,
  // la FAQ et le plan du site sont dans l'en-tête, le Centre et la colonne d'information).
  const sx = en ? '-en' : '';
  const access = en
    ? [['/boutique/en/clients', 'Become a client'], ['/achats-en', 'Suppliers'], ['/presse-en', 'Press room']]
    : [['/boutique/clients', 'Devenir client'], ['/achats', 'Fournisseurs'], ['/presse', 'Espace presse']]; // lot 139 : « Carrières » est dans le menu (#164), le pied de page ne le répète plus
  const columns = nodes(output).filter(n => hasClass(n, 'foot-col'));
  if (columns.length === 3 && !output.includes('data-et-footer-access')) {
    const heading = (columns[1].children || []).find(n => n.name === 'h3');
    if (heading) output = edit(output, [[columns[1].startIndex, columns[1].endIndex + 1, '<div class="foot-col" data-et-footer-access>' + part(output, heading) + access.map(([href, label]) => `<a href="${href}">${label}</a>`).join('') + '</div>']]);
  }
  output = output.replace(/<nav class="foot-resources"[\s\S]*?<\/nav>/, '');
  // Le plan du site quitte la colonne d'accès pour la colonne d'information (la ligne légale, masquée par la feuille de style, ne change pas).
  const info = nodes(output).filter(n => hasClass(n, 'foot-col'))[2];
  if (info && !part(output, info).includes('/plan-du-site')) output = edit(output, [[info.endIndex - '</div>'.length + 1, info.endIndex + 1, `<a href="/plan-du-site${sx}">${en ? 'Site map' : 'Plan du site'}</a></div>`]]);
  // 17 novembre 2026 (décision du DG) : la première colonne répétait les six entrées de l'en-tête ; elle est retirée.
  // Les deux colonnes restantes (accès professionnels, informations) et le bloc de contact suffisent, comme chez les majors.
  {
    const repeated = nodes(output).find(n => hasClass(n, 'foot-col') && n.attribs && 'data-et-corporate-sections' in n.attribs);
    if (repeated) output = edit(output, [[repeated.startIndex, repeated.endIndex + 1, '']]).replace('<footer', '<footer data-et-footer-columns="2"');
  }
  // 17 novembre 2026 (remarque de relecture) : le pied de page reprend le slogan de l'en-tête (assets/data/navigation.json) au lieu de « Accès aux Énergies ».
  {
    const at = output.indexOf('<footer');
    if (at >= 0) output = output.slice(0, at) + output.slice(at).replace(en ? '<small>Access to Energy</small>' : '<small>Accès aux Énergies</small>', `<small>${en ? 'Chad’s energy. Integrated.' : 'L’énergie du Tchad. Intégrée.'}</small>`);
  }
  return output;
}

// Shared rendering boundary: also covers native React footers and dedicated-space copies.
// Main content, contact details, language-pair links and executable scripts are untouched.
export function withNavigationReview(html) {
  html = withMainNav(html);
  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr';
  const en = language.startsWith('en'), ar = language.startsWith('ar');
  const all = nodes(html), changes = [];
  const nav = all.find(n => n.name === 'nav' && n.attribs?.id === 'nav' && hasClass(n, 'nx'));
  const foot = all.find(n => n.name === 'footer');
  if (nav && !ar) changes.push([nav.startIndex, nav.endIndex + 1, corporateNav(part(html, nav), en)]);
  if (foot) changes.push([foot.startIndex, foot.endIndex + 1, footer(part(html, foot), en, ar)]);
  let output = edit(html, changes);
  if (!ar && !output.includes('id="corporate-architecture-css"')) output = output.replace('</head>', `<style id="corporate-architecture-css">${corporateArchitectureCss}</style></head>`);
  return output;
}
