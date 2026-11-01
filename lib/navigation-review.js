import { htmlToDOM } from 'html-react-parser';
import { withCorporateMenu, withCorporateFooter } from './corporate-architecture.js';

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
  if (!panel || output.includes('nx-resource-groups')) return output;
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
  const grouped = `<div class="nx-col pn-links nx-resource-groups">${buckets.map((items, i) => `<section class="nx-resource-group" aria-label="${labels[i]}"><h3 class="nx-resource-title">${labels[i]}</h3>${items.join('')}</section>`).join('')}</div>`;
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
  const labels = en ? [['Sections', 'Company &amp; activities'], ['Quick access', 'Professional access'], ['Information', 'Information &amp; trust']] : [['Rubriques', 'Entreprise &amp; activités'], ['Accès directs', 'Accès professionnels'], ['Informations', 'Informations &amp; confiance']];
  let output = html;
  for (const [old, label] of labels) output = output.replace(`<h3>${old}</h3>`, `<h3>${label}</h3>`);
  output = output.replace(en ? '<a href="/carnets-en">Resources</a>' : '<a href="/carnets">Ressources</a>', `<a href="/publications${en ? '-en' : ''}">${en ? 'Documents &amp; resources' : 'Documents &amp; ressources'}</a>`);
  const news = nodes(output).find(n => hasClass(n, 'foot-news'));
  if (news && !hasClass(news, 'et-footer-pending')) {
    const pending = `<div class="foot-news et-footer-pending"><p>${en ? 'Newsletter registration is being prepared.' : 'L’inscription à la newsletter est en préparation.'}</p><a href="/newsletter${en ? '-en' : ''}">${en ? 'Newsletter information' : 'À propos de la newsletter'} →</a></div>`;
    output = edit(output, [[news.startIndex, news.endIndex + 1, pending]]);
  }
  return withCorporateFooter(output, en);
}

// Shared rendering boundary: also covers native React footers and dedicated-space copies.
// Main content, contact details, language-pair links and executable scripts are untouched.
export function withNavigationReview(html) {
  const language = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1] || 'fr';
  const en = language.startsWith('en'), ar = language.startsWith('ar');
  const all = nodes(html), changes = [];
  const nav = all.find(n => n.name === 'nav' && n.attribs?.id === 'nav' && hasClass(n, 'nx'));
  const foot = all.find(n => n.name === 'footer');
  if (nav && !ar) changes.push([nav.startIndex, nav.endIndex + 1, withCorporateMenu(corporateNav(part(html, nav), en), en)]);
  if (foot) changes.push([foot.startIndex, foot.endIndex + 1, footer(part(html, foot), en, ar)]);
  let output = edit(html, changes);
  if (!ar && !output.includes('id="corporate-architecture-css"')) output = output.replace('</head>', '<link id="corporate-architecture-css" rel="stylesheet" href="/assets/chrome/corporate-architecture.css"></head>');
  return output;
}
