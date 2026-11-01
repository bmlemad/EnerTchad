import { readFileSync } from 'node:fs';
import parse, { htmlToDOM } from 'html-react-parser';
import { withYouTubeBadge } from './youtube.js';
import { fingerprintUrl } from './fingerprint.js';
import { logoSvg } from './logo.js'; // lot 29 (B3)
import { corporateSections } from './corporate-architecture.js';

function source(name) {
  if (!['essentiel','essentiel-en'].includes(name)) throw new Error('Unknown strategic page');
  return readFileSync(`${process.cwd()}/${name}.html`, 'utf8');
}
function headElements(name) {
  const html = source(name);
  return htmlToDOM(html.match(/<head>([\s\S]*?)<\/head>/i)[1]);
}
export function strategicMetadata(name) {
  const elements = headElements(name);
  const meta = key => elements.find(el => el.name === 'meta' && (el.attribs.name === key || el.attribs.property === key))?.attribs.content;
  const canonical = elements.find(el => el.name === 'link' && el.attribs.rel === 'canonical').attribs.href;
  const languages = Object.fromEntries(elements.filter(el => el.name === 'link' && el.attribs.hreflang).map(el => [el.attribs.hreflang, el.attribs.href]));
  return {
    title: elements.find(el => el.name === 'title').children.map(el => el.data || '').join(''),
    description: meta('description'),
    robots: meta('robots'),
    alternates: { canonical, languages },
    icons: { icon: '/favicon-32.png' },
    openGraph: { title: meta('og:title'), description: meta('og:description'), url: canonical, type: 'website', siteName: meta('og:site_name'), locale: meta('og:locale'), images: [{ url: meta('og:image'), alt: meta('og:image:alt') }] },
    twitter: { card: 'summary_large_image', title: meta('twitter:title'), description: meta('twitter:description'), images: [meta('twitter:image')] }
  };
}
export function StrategicHeader({ name }) {
  const en = name.endsWith('-en');
  const suffix = en ? '-en' : '';
  const investor = name.startsWith('investor-center');
  const links = investor
    ? [[`/essentiel${suffix}`, en ? '90 seconds' : '90 secondes'], [`/investisseurs${suffix}`, en ? 'Investor page' : 'Page investisseurs'], [`/publications${suffix}`, 'Documents'], [`/contact${suffix}?profil=invest#ctForm`, en ? 'Register interest' : 'Manifester son intérêt', true]]
    : corporateSections(en).map(section => [section.href, section.label, section.id === 'd']);
  // Header aligned on the corporate navigation (audit 2026-10-13, item 7): utility bar
  // (Contact, FR · EN, Arabic, Invest — the destinations of the corporate #nav), then
  // brand, page links and the theme switch (item 6, assets/chrome/coherence-20261013.js).
  const languageLink = <a className="et-al-lang" href={'/' + (en ? name.slice(0, -3) : name + '-en')} hrefLang={en ? 'fr' : 'en'} lang={en ? 'fr' : 'en'} aria-label={en ? 'Version française' : 'English version'}>{en ? <><b>FR</b>{'\u00a0·\u00a0'}EN</> : <>FR{'\u00a0·\u00a0'}<b>EN</b></>}</a>;
  // Arabic: no equivalent page, link to the closest Arabic page (as the ع link does across the site).
  const arabicLink = <a className="et-al-ar" href={investor ? '/ar-investisseurs' : '/ar'} aria-label={en ? 'Arabic version' : 'Version arabe'}><span lang="ar">ع</span></a>;
  const label = investor ? (en ? 'Investor Centre' : 'Centre investisseurs') : (en ? 'Essentials' : 'L’essentiel');
  const theme = en ? 'Dark mode' : 'Mode sombre';
  // Utility links: in the desktop utility bar, and at the top of the mobile menu (≤ 900 px,
  // where the utility bar is hidden so the header is a single 64 px bar).
  const utility = <><a href={`/contact${suffix}`}>Contact</a>{languageLink}{arabicLink}<a className="et-al-invest" href={`/contact${suffix}#ctForm`}>{en ? 'Discuss your requirements' : 'Présenter un besoin'}</a></>;
  const items = () => <>{links.map(([href,label,cta]) => <a key={href} href={href} className={cta ? 'sp-cta' : undefined}>{label}</a>)}</>;
  return <header className="sp-top et-al"><div className="et-al-util"><div className="sp-wrap et-al-utin"><span className="et-al-pill">{utility}</span></div></div><div className="sp-wrap sp-topin"><a className="sp-brand et-al-brand" href={en ? '/index-en' : '/'} aria-label={`EnerTchad — ${label}`}>{parse(logoSvg())}<span className="et-al-tx et-tag"><small>{label}</small></span></a><nav className="sp-nav et-al-links" aria-label={en ? 'Main navigation' : 'Navigation principale'}>{items()}</nav><button type="button" className="et-theme-hdr" aria-pressed="false" aria-label={theme} title={theme}><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8.2" /><path d="M12 3.8a8.2 8.2 0 0 0 0 16.4z" fill="currentColor" /></svg></button><details className="sp-mobile-menu"><summary>Menu</summary><nav aria-label={en ? 'Mobile navigation' : 'Navigation mobile'}><div className="et-al-mutil">{utility}</div>{items()}</nav></details></div></header>;
}
export function StrategicPage({ name }) {
  const html = withYouTubeBadge(source(name));
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
  const structured = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  const styles = html.match(/<head>([\s\S]*?)<\/head>/i)[1].match(/<style\b[^>]*>[\s\S]*?<\/style>/gi)?.join('') || '';
  // The shared strategic stylesheet is bundled by the layouts; retain page-specific stylesheets.
  const extraStylesheets = headElements(name).filter(el => el.name === 'link' && el.attribs.rel === 'stylesheet' && !el.attribs.href?.split('?')[0].endsWith('/strategic-premium.css'));
  const pageStyles = extraStylesheets.map(el => <link key={fingerprintUrl(el.attribs.href)} rel="stylesheet" href={fingerprintUrl(el.attribs.href)} />);
  // Trusted, repository-owned editorial HTML becomes server-rendered React elements.
  // Interactive navigation is a shared component; legacy browser scripts are absent here.
  return <>{structured && <script type="application/ld+json" dangerouslySetInnerHTML={{__html: structured.replace(/</g, '\\u003c')}} />}{pageStyles}{parse(styles)}{parse(body, { replace: node => node.name === 'header' && node.attribs?.class === 'sp-top' ? <StrategicHeader name={name} /> : undefined })}</>;
}
