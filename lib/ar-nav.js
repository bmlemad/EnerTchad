// Lot 108 : menu mobile des pages arabes.
// L'en-tête arabe (header.arh, posé par scripts/gen_premium_ar.py) n'avait pas de bouton de menu :
// sous 767 px, les six liens se rangeaient sur deux lignes et l'en-tête collant mesurait 160 px
// (19 % d'un écran de 844 px, mesure du 9 novembre 2026 sur le site en ligne).
// Au build : un bouton « القائمة » après la marque, la navigation et les outils (langues, thème,
// bouton investisseurs) enveloppés dans un tiroir #arh-drawer, la feuille ar-nav.css et un petit script.
// Sur ordinateur, le tiroir est en display:contents : la mise en page reste celle d'avant.
// Sans JavaScript, le tiroir reste ouvert (la feuille ne le cache que sous html.arh-js).
const LABEL = 'القائمة';
const ICON = '<svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const BUTTON = `<button type="button" class="arh-tog" id="arh-tog" aria-expanded="false" aria-controls="arh-drawer" aria-label="${LABEL}">${ICON}</button>`;
// La classe arh-js est posée dans <head> : le tiroir est replié dès le premier rendu (pas de saut de 96 px).
const LINK = '<link rel="stylesheet" id="ar-nav" href="/assets/chrome/ar-nav.css"><script id="arh-js-flag">document.documentElement.classList.add("arh-js")</script>';
const SCRIPT = '<script id="arh-nav-js">(function(){var d=document.documentElement,b=document.getElementById("arh-tog"),w=document.getElementById("arh-drawer");'
  + 'if(!b||!w){d.classList.remove("arh-js");return}var q=window.matchMedia("(max-width:767px)");'
  + 'function set(o){if(o){w.setAttribute("data-open","")}else{w.removeAttribute("data-open")}b.setAttribute("aria-expanded",o?"true":"false")}'
  + 'b.addEventListener("click",function(){set(b.getAttribute("aria-expanded")!=="true")});'
  + 'document.addEventListener("keydown",function(e){if(e.key==="Escape"&&b.getAttribute("aria-expanded")==="true"){set(false);b.focus()}});'
  + 'function c(){if(!q.matches)set(false)}if(q.addEventListener){q.addEventListener("change",c)}else if(q.addListener){q.addListener(c)}})();</script>';

// Lot 125 (décision du DG, 14 novembre 2026) : même logique que l'en-tête français du lot 124 — cinq liens simples
// (الرئيسية، الرؤية، الأنشطة، المستثمرون، اتصل بنا), sans « بحث (FR) » (déjà dans le pied de page) ; pas d'« الأثر » :
// il n'existe aucune page arabe d'engagements. Les pages de pôle marquent « الأنشطة » comme page courante.
const AR_LINKS = [['/ar', 'الرئيسية'], ['/ar-societe', 'الرؤية'], ['/ar-poles', 'الأنشطة'], ['/ar-investisseurs', 'المستثمرون'], ['/ar-contact', 'اتصل بنا']];
const AR_POLES = /^\/ar-(amont|aval|intermediaire)\/?$/;
function minimalArNav(html) {
  if (html.includes('data-et-header="minimal"')) return html;
  const m = html.match(/<nav class="arh-nav"([^>]*)>([\s\S]*?)<\/nav>/);
  if (!m) return html;
  const found = [...m[2].matchAll(/<a\b([^>]*)href="([^"]+)"([^>]*)>/g)].map(x => x[2]);
  if (!AR_LINKS.every(([href]) => found.includes(href))) return html; // gabarit inattendu : on ne touche à rien
  const canonical = html.match(/<link rel="canonical" href="https:\/\/enertchad.com([^"]*)"/)?.[1] || '';
  const route = canonical.replace(/\/+$/, '') || '/ar';
  const links = AR_LINKS.map(([href, label]) => {
    const current = route === href || (href === '/ar-poles' && AR_POLES.test(route)) ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${label}</a>`;
  }).join('');
  return html.replace(m[0], `<nav class="arh-nav" data-et-header="minimal"${m[1]}>${links}</nav>`);
}

export function withArNav(html) {
  if (html.includes('id="arh-tog"')) return html;
  if (!/<html\b[^>]*\blang=["']ar/i.test(html)) return html;
  html = minimalArNav(html);
  const start = html.indexOf('<header class="arh"><div class="arh-in">');
  if (start < 0) return html;
  const end = html.indexOf('</header>', start);
  const head = html.slice(start, end);
  const brandEnd = head.indexOf('</a>', head.indexOf('<a class="arh-brand"'));
  const nav = head.indexOf('<nav class="arh-nav"');
  const tools = head.indexOf('<div class="arh-tools">');
  if (brandEnd < 0 || nav < 0 || tools < 0 || !(brandEnd < nav && nav < tools)) return html;
  // .arh-in se ferme juste avant </header> : le tiroir va de la navigation à la fin des outils.
  const innerEnd = head.lastIndexOf('</div>');
  if (innerEnd <= tools) return html;
  const b = brandEnd + 4;
  const header = head.slice(0, b) + BUTTON + head.slice(b, nav)
    + '<div class="arh-drawer" id="arh-drawer">' + head.slice(nav, innerEnd) + '</div>' + head.slice(innerEnd);
  let out = html.slice(0, start) + header + html.slice(end);
  out = out.replace('</head>', LINK + '</head>');
  return out.replace(/<\/body>(?![\s\S]*<\/body>)/i, SCRIPT + '</body>');
}
