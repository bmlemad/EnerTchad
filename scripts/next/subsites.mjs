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
  // Header aligned on the corporate navigation (audit, item 7): utility bar with
  // Contact, FR · EN, Arabic and Invest — the same destinations as the source page's
  // own #nav (nx-langx → /ar, nx-invest → /investisseurs#souscrire) — then brand,
  // space links and the theme switch (item 6). Styles: assets/chrome/subsites.css;
  // theme switch behaviour: assets/chrome/coherence-20261013.js.
  // Mobile (≤ 900 px): a single 64 px bar (brand, theme switch, Menu). The Menu toggle is a
  // <details> placed first, as on the React pages (.sp-mobile-menu); opening it reveals the
  // utility links and the space links in place (CSS sibling selector, no script needed).
  const menuToggle = `<details class="et-al-tog"><summary>Menu</summary></details>`;
  const partnerLabel = partner === 'atlas' ? 'Atlas' : en ? 'Customer space' : 'Espace Clients';
  const themeLabel = en ? 'Dark mode' : 'Mode sombre';
  const themeButton = `<button type="button" class="et-theme-hdr" aria-pressed="false" aria-label="${themeLabel}" title="${themeLabel}"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 0 0 16.4z" fill="currentColor"/></svg></button>`;
  // Exactly one a[lang] in #nav (the FR/EN switch, as before); the Arabic link carries
  // lang on its letter only. Class names et-space-top / et-space-links are kept for QA.
  const languageSwitch = `<a class="et-al-lang" href="${pathFor(sibling)}" lang="${en ? 'fr' : 'en'}" aria-label="${en ? 'Version française' : 'English version'}" title="${en ? 'Français' : 'English'}">${en ? '<b>FR</b>&nbsp;·&nbsp;EN' : 'FR&nbsp;·&nbsp;<b>EN</b>'}</a>`;
  const arabic = `<a class="et-al-ar" href="${corporate}/ar" aria-label="${en ? 'Arabic version' : 'Version arabe'}"><span lang="ar">ع</span></a>`;
  const contact = `${corporate}/contact${en ? '-en' : ''}`;
  const header = `<nav id="nav" class="et-space-header et-al" aria-label="${en ? 'Main navigation' : 'Navigation principale'}">${menuToggle}<div class="et-space-top et-al-util"><div class="et-al-utin"><a class="et-al-back" href="${corporate}${en ? '/index-en' : '/'}" aria-label="${en ? 'EnerTchad group' : 'Groupe EnerTchad'}">←&nbsp;<span class="et-al-long">${en ? 'EnerTchad group' : 'Groupe EnerTchad'}</span></a><span class="et-al-pill"><a class="et-al-partner" href="${partnerUrl}">${partnerLabel}</a><a class="et-al-contact" href="${contact}">Contact</a>${languageSwitch}${arabic}<a class="et-al-invest" href="${corporate}/investisseurs${en ? '-en' : ''}#souscrire">${en ? 'Invest' : 'Investir'}</a></span></div></div><div class="et-al-bar"><a class="et-al-brand" href="${pathFor(pages.find(p => p.language === page.language && (p.kind === 'home' || p.kind === 'clients')))}" aria-label="EnerTchad — ${label}"><svg class="et-al-mk" aria-hidden="true" focusable="false" viewBox="4 4 192 192" width="44" height="44"><defs><linearGradient id="etalg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#DBAE4A"/><stop offset="1" stop-color="#C2922E"/></linearGradient></defs><path d="M100 96L126.98 67.9A37.4 37.4 0 1 0 73.02 67.9Z" fill="url(#etalg)"/><path d="M96 100L67.9 73.02A37.4 37.4 0 1 0 67.9 126.98Z" fill="#1E6EC2"/><path d="M104 100L132.1 126.98A37.4 37.4 0 1 0 132.1 73.02Z" fill="#218A2C"/><path d="M100 104L73.02 132.1A37.4 37.4 0 1 0 126.98 132.1Z" fill="#E8CD7F"/></svg><span class="et-al-tx"><span>Ener<span>Tchad</span></span><small>${label}</small></span></a><div class="et-space-links et-al-links">${links.map(([href, text, active]) => `<a href="${href}"${active ? ' aria-current="page"' : ''}>${text}</a>`).join('')}</div>${themeButton}</div></nav>`;
  const all = nodes(output);
  const oldNav = all.find(n => n.attribs?.id === 'nav');
  if (!oldNav) throw Error('Missing main navigation in ' + page.source);
  const mobileNav = all.find(n => n.attribs?.id === 'nezBar');
  const replacements = [[oldNav.startIndex, oldNav.endIndex + 1, header]];
  if (mobileNav) replacements.push([mobileNav.startIndex, mobileNav.endIndex + 1, '']);
  if (space === 'boutique') {
    const hero = all.find(n => n.attribs?.id === 'top-pole' && /(?:^|\s)pp-hero(?:\s|$)/.test(n.attribs?.class || ''));
    const wrap = hero?.children?.find(n => /(?:^|\s)pp-wrap(?:\s|$)/.test(n.attribs?.class || ''));
    // The premium stylesheet has 24-ID specificity. Inline custom-property
    // fallbacks preserve desktop sizing while removing its fixed-nav gap on mobile.
    for (const [node, style] of [[hero, 'min-height:var(--et-space-hero-min-height,clamp(560px,78svh,780px))!important'], [wrap, 'padding-top:var(--et-space-hero-top,190px)!important']]) {
      if (!node || node.attribs.style) throw Error('Review commercial hero spacing in ' + page.source);
      const end = output.indexOf('>', node.startIndex) + 1;
      replacements.push([node.startIndex, end, output.slice(node.startIndex, end).replace(/>$/, ` style="${style}">`)]);
    }
  }
  if (space === 'atlas') {
    for (const n of all.filter(n => /(?:^|\s)atlas-(?:languages|nav)(?:\s|$)/.test(n.attribs?.class || ''))) replacements.push([n.startIndex, n.endIndex + 1, '']);
  }
  for (const [start, end, text] of replacements.sort((a, b) => b[0] - a[0])) output = output.slice(0, start) + text + output.slice(end);
  output = output.replace('<html', `<html data-et-space="${space}"`)
    .replace('</head>', '<link rel="stylesheet" href="/assets/chrome/subsites.css"><link rel="stylesheet" href="/assets/chrome/coherence-20261013.css"></head>')
    .replace(/<\/body>(?![\s\S]*<\/body>)/, '<script defer src="/assets/chrome/coherence-20261013.js"></script></body>')
    .replace(/src="\/assets\/chrome\/c_ac04328f0f47\.js[^\"]*"/g, 'src="/assets/chrome/subsites-core.js"');
  // The source Atlas stylesheet intentionally has very high specificity.
  // Inline spacing overrides its fixed-header offset without another CSS arms race.
  if (space === 'atlas') output = output.replace(/(<main\b[^>]*class="atlas-space")/, '$1 style="padding-top:28px!important"');
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

// Since the OVH move (free hosting: enertchad.com and www only), the dedicated
// spaces live under the group domain; the sitemap keeps its enertchad.com URLs.
export function commercialSitemap(sitemap) {
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
