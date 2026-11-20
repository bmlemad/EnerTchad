// Lot 136 (17 novembre 2026, choix du DG) : les pages d'entrée des quatre pôles gardent visibles le statut, le métier, les offres,
// les enjeux, les projets et le contact ; le détail (offre détaillée, méthode, cas d'usage, chiffres, capacités, référentiel
// d'expertise, documents) est regroupé avant le chapitre de contact et se replie sous son titre. Rien n'est supprimé : chaque
// rubrique garde son identifiant, s'ouvre d'un clic, par un lien d'ancre ou à l'impression, et reste dans le HTML sans JavaScript.
// Une rubrique repliée sort de content-visibility:auto : sa hauteur réservée hors écran (680 px) fausserait la longueur de page.
// Sur la page Amont, l'offre technique (déjà condensée au lot 131) reste visible, et le repli mobile du lot 132 sur les cas et la
// méthode est remplacé par ce repli, valable à toutes les largeurs.
const ROUTES = {
  '/amont/': ['approche', 'cas', 'chiffres', 'capacites', 'expertises', 'documents'],
  '/pole-amont-en': ['approche', 'cas', 'chiffres', 'capacites', 'expertises', 'documents'],
  '/intermediaire/': ['offre', 'approche', 'cas', 'chiffres', 'capacites', 'expertises', 'documents'],
  '/pole-intermediaire-en': ['offre', 'approche', 'cas', 'chiffres', 'capacites', 'expertises', 'documents'],
  '/aval/': ['offre', 'approche', 'cas', 'chiffres', 'capacites', 'expertises', 'documents'],
  '/pole-aval-en': ['offre', 'approche', 'cas', 'chiffres', 'capacites', 'expertises', 'documents'],
  '/petrochimie/': ['offre', 'approche', 'cas', 'capacites'],
  '/pole-enerchimie-en': ['offre', 'approche', 'cas', 'capacites'],
  // Lot 141 : les quatre pôles de service, mêmes règles (cas d'usage, chiffres et détail technique se replient ; offres, enjeux, projets restent visibles).
  '/greentech/': ['cas', 'hseq', 'impact', 'transition', 'patrimoine'],
  '/pole-greentech-en': ['cas', 'hseq', 'impact', 'transition', 'patrimoine'],
  // Lot 142 : « Ingénierie » reste ouverte sur EnerConseils — elle porte les liens de demande de mission (qa/qualified-enquiries),
  // et une action ne se cache pas dans un repli.
  '/enerconseils/': ['cas', 'conseil', 'audits', 'esg'],
  '/pole-enerconseils-en': ['cas', 'conseil', 'audits', 'esg'],
  '/tchaditech/': ['cas', 'socle', 'rd', 'innovations', 'recits'],
  '/pole-tchaditech-en': ['cas', 'socle', 'rd', 'innovations', 'recits'],
  '/tchaditude/': ['emplois-jeunesse', 'cas', 'academie', 'rayonnement', 'partenariats'],
  '/pole-tchaditude-en': ['emplois-jeunesse', 'cas', 'academie', 'rayonnement', 'partenariats'],
};
const STYLE = '<style id="pp-dfold-css">.pp-dfold>summary{display:block;cursor:pointer;list-style:none;border-top:1px solid var(--pp-line)}.pp-dfold>summary::-webkit-details-marker{display:none}.pp-dfold-s{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:76px;padding-block:14px}.pp-dfold-l{display:grid;gap:6px}.pp-dfold-t{font:400 clamp(1.2rem,2vw,1.55rem)/1.2 var(--pp-serif);color:var(--pp-ink)}.pp-dfold-s::after{content:"+";font:300 1.8rem/1 var(--pp-sans);color:var(--pp-gold-ink);flex:none}.pp-dfold[open]>summary .pp-dfold-s::after{content:attr(data-close) "  −";font:500 .85rem/1 var(--pp-sans)}.pp-dfold[open]>summary .pp-dfold-l{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.pp-dfold[open]>summary .pp-dfold-s{justify-content:flex-end;min-height:56px}.pp-dfold-a{padding-block:0 18px}.pp-dfold-b{padding:clamp(20px,3vw,36px) 0 clamp(48px,6vw,80px)}.pp-dfold>summary:hover .pp-dfold-t{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}</style>';
const SCRIPT = '<script id="pp-dfold-js">(function(){var all=function(){return document.querySelectorAll("details.pp-dfold")};function show(){var h=location.hash.slice(1);if(!h)return;var t;try{t=document.getElementById(decodeURIComponent(h))}catch(e){return}if(!t)return;var d=t.matches("section")?t.querySelector("details.pp-dfold"):t.closest("details.pp-dfold");if(d&&!d.open){d.open=true;t.scrollIntoView()}}addEventListener("hashchange",show);document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href^=\\"#\\"]");if(a&&a.getAttribute("href")===location.hash)setTimeout(show,0)});addEventListener("beforeprint",function(){all().forEach(function(d){d.open=true})});show()})();</script>';
const ACTION = /<a\b[^>]*(?:class="[^"]*\bpp-(?:link|btn)\b[^"]*"|data-et-action=)/;
// Dernier élément de la rubrique, avant les fermetures de ses conteneurs : une rangée d'actions ou un paragraphe réduit à un lien d'action.
const TRAILING_ACTIONS = /(<div class="pp-actions[^"]*">(?:(?!<div\b)[\s\S])*?<\/div>|<p>\s*<a\b[^>]*class="[^"]*\bpp-(?:link|btn)\b[^"]*"[^>]*>(?:(?!<\/a>)[\s\S])*<\/a>\s*<\/p>)((?:\s*<\/div>)+)\s*$/;
const text = fragment => fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function withPoleFolds(html) {
  if (html.includes('data-detail-fold')) return html;
  const route = html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^"]*)"/)?.[1];
  const ids = ROUTES[route];
  if (!ids) return html;
  const en = /<html\b[^>]*lang="en"/.test(html);
  const folded = [];
  for (const id of ids) {
    let found = false;
    html = html.replace(new RegExp(`<section id="${id}"([^>]*)>([\\s\\S]*?)</section>`), (_, attributes, inner) => {
      if (inner.includes('<section')) throw Error(`Nested section in pole detail ${id} (${route})`);
      const head = inner.match(/<div class="pp-head">(?:<p class="pp-k">([\s\S]*?)<\/p>)?<h2 id="[^"]+">([\s\S]*?)<\/h2>/);
      if (!head) throw Error(`Missing heading in pole detail ${id} (${route})`);
      // Le repli mobile du lot 132 (cas, méthode de la page Amont) est remplacé par le repli de la rubrique.
      inner = inner.replace(/<details class="pp-mfold" data-mobile-fold open><summary>[^<]*<\/summary>([\s\S]*?)<\/details>/, '$1');
      // Correctif de recette (20 novembre 2026) : un lien d'action ne se cache pas dans un repli. Le bloc d'actions qui termine
      // une rubrique (« La boutique », « Tous les documents »…) sort du repli et reste visible sous son titre ; une rubrique
      // dont les actions sont réparties dans le texte (TchadiTude, « Emplois & jeunesse ») reste ouverte, à sa place.
      let actions = '';
      const tail = inner.match(TRAILING_ACTIONS);
      if (tail) { actions = tail[1]; inner = inner.slice(0, tail.index) + tail[2]; }
      if (ACTION.test(inner)) { found = true; return _; }
      const label = `${head[1] ? `<span class="pp-k">${head[1]}</span>` : ''}<span class="pp-dfold-t">${text(head[2])}</span>`;
      const kept = attributes.replace(/\bclass="([^"]*)"/, (m, classes) => {
        const rest = classes.split(/\s+/).filter(name => name && name !== 'pp-mist').join(' ');
        return rest ? `class="${rest}"` : '';
      }).replace(/\s+/g, ' ').trimEnd();
      folded.push(`<section id="${id}"${kept} style="padding:0!important;content-visibility:visible!important"><details class="pp-dfold" data-detail-fold><summary><span class="pp-wrap pp-dfold-s" data-close="${en ? 'Close' : 'Replier'}"><span class="pp-dfold-l">${label}</span></span></summary><div class="pp-dfold-b">${inner}</div></details>${actions ? `<div class="pp-wrap pp-dfold-a">${actions}</div>` : ''}</section>`);
      found = true;
      return '';
    });
    if (!found) throw Error(`Missing pole detail section ${id} (${route})`);
  }
  const intro = `<section class="pp-compact" id="detail-pole" aria-labelledby="pp-dfold-h" style="padding-bottom:clamp(20px,3vw,32px)!important"><div class="pp-wrap"><p class="pp-k">${en ? 'Going further' : 'Pour aller plus loin'}</p><h2 id="pp-dfold-h" style="font-size:clamp(1.7rem,3vw,2.4rem)!important;margin-top:12px!important">${en ? 'The detail, section by section' : 'Le détail, rubrique par rubrique'}</h2></div></section>`;
  let placed = false;
  html = html.replace(/<section id="(?:carnets-[a-z]+|offre-tiers)"/, cta => { placed = true; return intro + folded.join('') + cta; });
  if (!placed) throw Error(`Missing contact chapter on pole page ${route}`);
  return html.replace('</main>', `${STYLE}${SCRIPT}</main>`);
}
