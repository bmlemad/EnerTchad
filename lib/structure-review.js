import { htmlToDOM } from 'html-react-parser';

// Keep one copy of each legal destination within each footer. Main-page links,
// contact details and social links are outside this small allowlist.
const LEGAL = /^\/(?:mentions-legales|confidentialite|cookies|accessibilite|avertissements|ethique)(?:-en)?(?:#alerte)?\/?$/;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
export function withStructureReview(html) {
  if (html.includes('data-et-structure="20261127"')) return html;
  const lang = html.match(/<html\b[^>]*\blang="([^"]+)"/)?.[1];
  if (!['fr', 'en', 'ar'].includes(lang)) return html;
  const all = [];
  const walk = n => { all.push(n); (n.children || []).forEach(walk); };
  htmlToDOM(html, { withStartIndices: true, withEndIndices: true }).forEach(walk);
  const changes = [];
  for (const foot of all.filter(n => n.name === 'footer')) {
    const seen = new Set();
    for (const a of all.filter(n => n.name === 'a' && n.startIndex > foot.startIndex && n.endIndex < foot.endIndex)) {
      const href = a.attribs?.href || '';
      if (!LEGAL.test(href)) continue;
      const key = href.replace(/\/$/, '');
      if (seen.has(key)) changes.push([a.startIndex, a.endIndex + 1, '']);
      else seen.add(key);
    }
  }
  html = changes.sort((a,b) => b[0]-a[0]).reduce((s,[a,b,value]) => s.slice(0,a)+value+s.slice(b),html);
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad.com([^"]*)"/)?.[1]?.replace(/\/$/, '');
  const en = lang === 'en', sx = en ? '-en' : '';
  const roles = en ? {
    ['/groupe'+sx]: 'The Group: identity, integrated model and governance. Explore our business segments under Activities.',
    ['/societe'+sx]: 'Vision and mission: why EnerTchad exists and the principles guiding its development.',
    ['/en-bref'+sx]: 'A short introduction to the Group. See the Group presentation for the full institutional overview.',
    ['/essentiel'+sx]: 'A visual introduction to the energy chain and the status of the proposed projects.',
    ['/savoirs'+sx]: 'Resources: public documents, sector knowledge, news and press. Each collection has a distinct purpose.'
  } : {
    '/groupe': 'Le Groupe : identité, modèle intégré et gouvernance. Retrouvez les cinq segments dans Activités.',
    '/societe': 'Vision et mission : la raison d’être d’EnerTchad et les principes qui guident son développement.',
    '/en-bref': 'Une présentation courte du Groupe. La page Le Groupe porte la présentation institutionnelle complète.',
    '/essentiel': 'Une lecture visuelle de la chaîne énergétique et du statut des projets envisagés.',
    '/savoirs': 'Ressources : documents publics, connaissances sectorielles, actualités et presse. Chaque collection répond à un usage précis.'
  };
  if (lang !== 'ar' && roles[route]) {
    const links = route === '/savoirs'+sx ? [
      ['/publications'+sx,en?'Official documents · Publications':'Documents officiels · Publications'],
      ['/rapports'+sx,en?'Reports':'Rapports'],
      [en?'/atlas-en':'/atlas/',en?'Sector knowledge · Atlas':'Connaissances sectorielles · Atlas'],
      ['/glossaire-petrolier'+sx,en?'Glossary':'Glossaire'],
      ['/faq'+sx,'FAQ'],
      ['/carnets'+sx,en?'News & analysis':'Actualités & analyses'],
      ['/presse'+sx,en?'Press room':'Espace presse']
    ] : [['/groupe'+sx,en?'About the Group':'Présentation du Groupe'],['/nos-activites'+sx,en?'Activities':'Activités']];
    const nav = `<p data-et-page-role>${esc(roles[route])}</p><nav class="et-architecture-context" aria-label="${en?'Explore this section':'Explorer cette rubrique'}">${links.map(([href,label])=>`<a href="${href}">${esc(label)} →</a>`).join('')}</nav>`;
    html = html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/, '$1'+nav);
  }
  if (lang === 'ar') {
    const notice = '<aside class="et-architecture-context" lang="ar" dir="rtl" aria-label="اللغات المتاحة"><p>المحتوى العربي متاح جزئيًا. تتوفر الموارد وحلول العملاء الكاملة بالفرنسية والإنجليزية.</p><a href="/savoirs" lang="fr" hreflang="fr">Ressources (FR)</a><a href="/savoirs-en" lang="en" hreflang="en">Resources (EN)</a><a href="/boutique/clients" lang="fr" hreflang="fr">Solutions clients (FR)</a><a href="/boutique/en/clients" lang="en" hreflang="en">Client solutions (EN)</a></aside>';
    html = html.replace(/<\/main>/, notice+'</main>');
  }
  return html.replace('<html', '<html data-et-structure="20261127"');
}
