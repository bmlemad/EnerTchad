import { readFileSync } from 'node:fs';
import parse, { htmlToDOM } from 'html-react-parser';
import { withYouTubeBadge } from './youtube.js';

function source(name) {
  if (!['essentiel','essentiel-en','investor-center','investor-center-en'].includes(name)) throw new Error('Unknown strategic page');
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
    ? [[`/essentiel${suffix}`, en ? '90 seconds' : '90 secondes'], [`/investisseurs${suffix}`, en ? 'Investor page' : 'Page investisseurs'], [`/publications${suffix}`, 'Documents'], ['mailto:invest@enertchad.com', en ? 'Investor contact' : 'Contact investisseur', true]]
    : [[`/nos-activites${suffix}`, en ? 'Activities' : 'Activités'], [`/projets${suffix}`, en ? 'Projects' : 'Projets'], [`/publications${suffix}`, 'Documents'], [`/investor-center${suffix}`, en ? 'Investors' : 'Investisseurs', true]];
  const languageLink = <a href={'/' + (en ? name.slice(0, -3) : name + '-en')} hrefLang={en ? 'fr' : 'en'} lang={en ? 'fr' : 'en'} aria-label={en ? 'Version française' : 'English version'}>{en ? 'FR' : 'EN'}</a>;
  // Arabic: no equivalent page, link to the closest Arabic page (as the ع link does across the site).
  const arabicLink = <a href={investor ? '/ar-investisseurs' : '/ar'} lang="ar" title="العربية" aria-label="النسخة العربية">ع</a>;
  const items = () => <>{links.map(([href,label,cta]) => <a key={href} href={href} className={cta ? 'sp-cta' : undefined}>{label}</a>)}{languageLink}{arabicLink}</>;
  return <header className="sp-top"><div className="sp-wrap sp-topin"><a className="sp-brand" href={en ? '/index-en' : '/'}>Ener<span>Tchad</span></a><nav className="sp-nav" aria-label={en ? 'Main navigation' : 'Navigation principale'}>{items()}</nav><details className="sp-mobile-menu"><summary>Menu</summary><nav aria-label={en ? 'Mobile navigation' : 'Navigation mobile'}>{items()}</nav></details></div></header>;
}
export function StrategicPage({ name }) {
  const html = withYouTubeBadge(source(name));
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
  const structured = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  const styles = html.match(/<head>([\s\S]*?)<\/head>/i)[1].match(/<style\b[^>]*>[\s\S]*?<\/style>/gi)?.join('') || '';
  // The shared strategic stylesheet is bundled by the layouts; retain page-specific stylesheets.
  const extraStylesheets = headElements(name).filter(el => el.name === 'link' && el.attribs.rel === 'stylesheet' && !el.attribs.href?.split('?')[0].endsWith('/strategic-premium.css'));
  const pageStyles = extraStylesheets.map(el => <link key={el.attribs.href} rel="stylesheet" href={el.attribs.href} />);
  // Trusted, repository-owned editorial HTML becomes server-rendered React elements.
  // Interactive navigation is a shared component; legacy browser scripts are absent here.
  return <>{structured && <script type="application/ld+json" dangerouslySetInnerHTML={{__html: structured.replace(/</g, '\\u003c')}} />}{pageStyles}{parse(styles)}{parse(body, { replace: node => node.name === 'header' && node.attribs?.class === 'sp-top' ? <StrategicHeader name={name} /> : undefined })}</>;
}
