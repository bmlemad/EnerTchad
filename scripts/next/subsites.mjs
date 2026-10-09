import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { htmlToDOM } from 'html-react-parser';

export const corporate = 'https://enertchad.com';
export const atlasSlugs = ['', 'carte', 'bassins-champs', 'infrastructures', 'cadre-sectoriel', 'sources'];
export const commercialPages = [
  { source: 'aval/boutique.html', route: '/boutique/', local: '/boutique', language: 'fr', kind: 'catalogue' },
  { source: 'aval/boutique-en.html', route: '/boutique/en/', local: '/en/boutique', language: 'en', kind: 'catalogue' },
  { source: 'clients.html', route: '/boutique/clients', local: '/', language: 'fr', kind: 'clients' },
  { source: 'clients-en.html', route: '/boutique/en/clients', local: '/en/', language: 'en', kind: 'clients' }
];
export const atlasPages = ['fr', 'en'].flatMap(language => atlasSlugs.map(slug => ({
  source: slug ? `atlas/${slug}${language === 'en' ? '-en' : ''}.html` : language === 'en' ? 'atlas-en.html' : 'atlas/index.html',
  route: slug ? `/atlas/${slug}${language === 'en' ? '-en' : ''}` : language === 'en' ? '/atlas-en' : '/atlas/',
  local: slug ? `${language === 'en' ? '/en' : ''}/${slug}` : language === 'en' ? '/en/' : '/',
  language, kind: slug || 'home'
})));

function nodes(html) {
  const result = [];
  const walk = n => { result.push(n); (n.children || []).forEach(walk); };
  htmlToDOM(html, {withStartIndices: true, withEndIndices: true}).forEach(walk);
  return result;
}
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// One editorial source per page. Public paths work immediately; domain-specific
// copies are only mounted on their assigned Netlify aliases after DNS activation.
export function renderSubsite(html, page, space, hosted = false) {
  const pages = space === 'boutique' ? commercialPages : atlasPages;
  const en = page.language === 'en';
  const origin = hosted ? `https://${space === 'boutique' ? 'clients' : space}.enertchad.com` : corporate;
  const pathFor = p => hosted ? p.local : p.route;
  const url = p => origin + pathFor(p);
  const byRoute = new Map(pages.flatMap(p => [[p.route, p], [p.route.replace(/\/$/, ''), p], ['/' + p.source.replace(/\.html$/, ''), p], ['/' + p.source, p]]));
  if (space === 'boutique') {
    byRoute.set('/boutique', commercialPages[0]); byRoute.set('/boutique-en', commercialPages[1]);
  }
  const ownLink = href => {
    if (!href.startsWith('/') && !href.startsWith(corporate + '/')) return href;
    const relative = href.startsWith(corporate) ? href.slice(corporate.length) : href;
    const match = relative.match(/^([^?#]*)([?#].*)?$/);
    const target = byRoute.get(match[1]);
    return target ? pathFor(target) + (match[2] || '') : corporate + relative;
  };
  // Change anchor destinations only; preserve scripts, SVG use references,
  // resource URLs and fragment links used by catalogue and map widgets.
  let output = html.replace(/<a\b[^>]*>/g, tag => tag.replace(/\bhref="([^"]*)"/, (_, href) => `href="${ownLink(href)}"`));
  const partner = space === 'boutique' ? 'atlas' : 'boutique';
  const partnerUrl = hosted ? `https://${partner === 'boutique' ? 'clients' : partner}.enertchad.com${en ? '/en/' : '/'}` : corporate + (partner === 'atlas' ? en ? '/atlas-en' : '/atlas/' : en ? '/boutique/en/' : '/boutique/');
  const sibling = pages.find(p => p.kind === page.kind && p.language !== page.language);
  const client = commercialPages.find(p => p.kind === 'clients' && p.language === page.language);
  const catalogue = commercialPages.find(p => p.kind === 'catalogue' && p.language === page.language);
  const links = space === 'boutique' ? [
    [pathFor(catalogue), en ? 'Catalogue' : 'Catalogue', page.kind === 'catalogue'],
    [pathFor(client), en ? 'Customers & services' : 'Clients & services', page.kind === 'clients'],
    [pathFor(client) + '#programmes', en ? 'Fleet programmes' : 'Programmes flottes', false],
    [pathFor(catalogue) + '#boutique', en ? 'Prepare a quote' : 'Préparer un devis', false]
  ] : atlasPages.filter(p => p.language === page.language).map((p, i) => [pathFor(p), (en ? ['Atlas home', 'Map', 'Basins & fields', 'Infrastructure', 'Sector framework', 'Sources'] : ['Accueil Atlas', 'Carte', 'Bassins & champs', 'Infrastructures', 'Cadre sectoriel', 'Sources'])[i], page.kind === p.kind]);
  const label = space === 'boutique' ? en ? 'Customer space' : 'Espace Clients' : 'Atlas';
  const header = `<nav id="nav" class="et-space-header" aria-label="${en ? 'Main navigation' : 'Navigation principale'}"><div class="et-space-top"><a href="${corporate}${en ? '/index-en' : '/'}">← ${en ? 'EnerTchad group' : 'Groupe EnerTchad'}</a><div><a href="${partnerUrl}">${partner === 'atlas' ? 'Atlas' : en ? 'Customer space' : 'Espace Clients'}</a><a href="${pathFor(sibling)}" lang="${en ? 'fr' : 'en'}">${en ? 'Français' : 'English'}</a></div></div><div class="et-space-brand"><a href="${pathFor(pages.find(p => p.language === page.language && (p.kind === 'home' || p.kind === 'clients')))}" aria-label="EnerTchad — ${label}"><img src="/icon-192.png" alt="" width="40" height="40"><span>EnerTchad <strong>${label}</strong></span></a><a class="et-space-contact" href="${corporate}/contact${en ? '-en' : ''}">${space === 'atlas' ? 'Contact EnerTchad' : en ? 'Contact sales' : 'Contact commercial'}</a></div><div class="et-space-links">${links.map(([href, text, active]) => `<a href="${href}"${active ? ' aria-current="page"' : ''}>${text}</a>`).join('')}</div></nav>`;
  const all = nodes(output);
  const oldNav = all.find(n => n.attribs?.id === 'nav');
  if (!oldNav) throw Error('Missing main navigation in ' + page.source);
  const mobileNav = all.find(n => n.attribs?.id === 'nezBar');
  const replacements = [[oldNav.startIndex, oldNav.endIndex + 1, header]];
  if (mobileNav) replacements.push([mobileNav.startIndex, mobileNav.endIndex + 1, '']);
  for (const [start, end, text] of replacements.sort((a, b) => b[0] - a[0])) output = output.slice(0, start) + text + output.slice(end);
  output = output.replace('<html', `<html data-et-space="${space}"`)
    .replace('</head>', '<link rel="stylesheet" href="/assets/chrome/subsites.css"></head>')
    .replace(/src="\/assets\/chrome\/c_ac04328f0f47\.js[^\"]*"/g, 'src="/assets/chrome/subsites-core.js"');
  const canonical = url(page);
  const fr = pages.find(p => p.kind === page.kind && p.language === 'fr');
  const english = pages.find(p => p.kind === page.kind && p.language === 'en');
  output = output.replace(/<link\b[^>]*rel="canonical"[^>]*>/g, `<link rel="canonical" href="${canonical}">`)
    .replace(/<link\b[^>]*rel="alternate"[^>]*hreflang[^>]*>/g, '')
    .replace('</head>', `<link rel="alternate" hreflang="fr" href="${url(fr)}"><link rel="alternate" hreflang="en" href="${url(english)}"><link rel="alternate" hreflang="x-default" href="${url(fr)}"></head>`)
    .replace(/(<meta\b[^>]*property="og:url"[^>]*content=")[^"]*/, '$1' + canonical);
  // Preserve Organization metadata; update only page/breadcrumb references.
  output = output.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g, (tag, json) => {
    const map = value => {
      if (typeof value === 'string') {
        const base = value.split('#')[0];
        const target = byRoute.get(base.replace(corporate, ''));
        return target ? url(target) + value.slice(base.length) : value;
      }
      if (Array.isArray(value)) return value.map(map);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, map(v)]));
      return value;
    };
    return tag.replace(json, JSON.stringify(map(JSON.parse(json))));
  });
  if (hosted) {
    // Corporate service-worker navigation caches must not take over a subsite.
    output = output.replace(/<script\b[^>]*id="sw-reg"[^>]*>[\s\S]*?<\/script>/g, '');
  }
  return output;
}

const fileFor = route => route.endsWith('/') ? route.slice(1) + 'index.html' : route.slice(1) + '.html';
async function save(path, content) { await mkdir(dirname(path), {recursive: true}); await writeFile(path, content); }

export function commercialSitemap(sitemap) {
  for (const page of commercialPages) sitemap = sitemap.replaceAll('<loc>' + corporate + '/' + page.source.replace(/\.html$/, '') + '</loc>', '<loc>' + corporate + page.route + '</loc>');
  return sitemap;
}

export async function buildSubsites() {
  // Keep the common reveal/forms/widgets initializers. The corporate menu is
  // absent in a dedicated space, so its listeners must be guarded independently.
  let core = await readFile('assets/chrome/c_ac04328f0f47.js', 'utf8');
  if (!core.includes('function setMenu(open){') || !core.includes('// reveal + count')) throw Error('Shared chrome changed: review subsite menu guard');
  core = core.replace('function setMenu(open){', 'if(tog && links){\nfunction setMenu(open){')
    .replace('// reveal + count', '}\n// reveal + count');
  await save('out/assets/chrome/subsites-core.js', core);
  for (const [space, pages] of [['boutique', commercialPages], ['atlas', atlasPages]]) {
    // Read before writing so public Atlas pages are transformed exactly once.
    const originals = await Promise.all(pages.map(p => readFile('out/' + p.source, 'utf8')));
    for (const [i, page] of pages.entries()) {
      await save('out/' + fileFor(page.route), renderSubsite(originals[i], page, space));
      await save(`out/_subsites/${space}/` + fileFor(page.local), renderSubsite(originals[i], page, space, true));
    }
    const domain = `https://${space === 'boutique' ? 'clients' : space}.enertchad.com`;
    await save(`out/_subsites/${space}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${escape(domain + p.local)}</loc></url>`).join('')}</urlset>`);
    await save(`out/_subsites/${space}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /_subsites/\nSitemap: ${domain}/sitemap.xml\n`);
  }
  const sitemapPath = 'out/sitemap.xml';
  await writeFile(sitemapPath, commercialSitemap(await readFile(sitemapPath, 'utf8')));
  console.log('Generated Boutique + Clients (4 bilingual pages), Atlas navigation (12 pages), and host-specific copies/sitemaps.');
}
