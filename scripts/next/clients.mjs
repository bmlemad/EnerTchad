import { htmlToDOM } from 'html-react-parser';

function find(html, id) {
  const walk = list => { for (const n of list) { if(n.attribs?.id===id)return n; const child=walk(n.children||[]); if(child)return child; } };
  return walk(htmlToDOM(html,{withStartIndices:true,withEndIndices:true}));
}
function replace(html,id,content){const n=find(html,id);if(!n)throw Error('Missing customer section: '+id);return html.slice(0,n.startIndex)+content+html.slice(n.endIndex+1);}

// Presentation for both public and hosted customer routes. Product and enquiry
// details remain in the single, reviewed bilingual editorial source.
export function moderniseClients(html,en){
  if(html.includes('id="client-modern-css"'))return html;
  const suffix=en?'-en':'';
  const title=en?'Your business. Your energy needs.':'Votre activité. Vos besoins en énergie.';
  const lead=en?'Fuel supply, fleet management or engineering: find the right team and prepare a scoped request.':'Approvisionnement, gestion des flottes ou ingénierie : trouvez le bon interlocuteur et préparez une demande adaptée à votre activité.';
  const status=en?'Company in formation · offers in preparation':'Société en constitution · offres en préparation';
  const hero=`<header id="top-pole" class="ec-hero"><div class="ec-shell"><p class="ec-kicker">${en?'ENERTCHAD · CUSTOMER SPACE':'ENERTCHAD · ESPACE CLIENTS'}</p><div class="ec-hero-grid"><div><h1>${title}</h1><p class="ec-lead">${lead}</p><div class="ec-actions"><a class="ec-primary" href="#besoin-client">${en?'Find your solution':'Choisir votre solution'}<span aria-hidden="true"> ↗</span></a><a class="ec-text-link" href="/contact${suffix}?profil=b2b#ctForm">${en?'Discuss your requirements':'Présenter votre besoin'}<span aria-hidden="true"> →</span></a></div></div><aside class="ec-status"><span class="ec-status-dot" aria-hidden="true"></span><strong>${status}</strong><p>${en?'Scope, service area, capacity and commercial terms are confirmed for each request before commitment.':'Périmètre, zone desservie, capacités et conditions commerciales sont confirmés pour chaque demande avant engagement.'}</p><a href="#parcours">${en?'How to prepare your request':'Comment préparer votre demande'} <span aria-hidden="true">→</span></a></aside></div></div></header>`;
  html=replace(html,'top-pole',hero);
  // Lot 30 : le heros editorial (image pompe-petrole) est remplace par ec-hero sans image ; retirer les
  // preloads d'image dont la ressource n'apparait plus dans la page (14 Ko charges pour rien, fetchpriority=high).
  html=html.replace(/<link rel="preload" as="image"[^>]*>\s*/g,tag=>{const href=tag.match(/href="([^"]+)"/)?.[1];return href&&html.replace(/<link rel="preload"[^>]*>/g,'').includes(href)?tag:'';});
  const intro=find(html,'besoin-client');
  const original=html.slice(intro.startIndex,intro.endIndex+1);
  const routes=original.match(/<div class="et-readiness-routes">([\s\S]*?)<\/div>/)?.[1];
  if(!routes)throw Error('Reviewed B2B routes missing');
  let count=0;
  let cards=routes.replace(/<a href="/g,()=>`<a class="ec-offer" href="`).replace(/<b>/g,()=>`<span class="ec-number" aria-hidden="true">0${++count}</span><b>`).replace(/<\/a>/g,`<em>${en?'Explore this offer':'Découvrir cette offre'} <span aria-hidden="true">↗</span></em></a>`);
  let offerIndex=0;
  cards=cards.replace(/<a class="ec-offer"[\s\S]*?<\/a>/g,card=>{
    const index=offerIndex++, profile=['b2b','b2b','ep'][index];
    return `<article class="ec-offer-path">${card}<a class="ec-contact" href="/contact${suffix}?profil=${profile}${index===1?'&amp;besoin=flotte':''}#ctForm">${en?'Discuss this requirement':'Présenter ce besoin'} <span aria-hidden="true">→</span></a></article>`;
  });
  html=replace(html,'besoin-client',`<section id="besoin-client" class="ec-entry" aria-labelledby="besoin-client-title"><div class="ec-shell"><div class="ec-heading"><div><p class="ec-kicker">${en?'FOR YOUR BUSINESS':'POUR VOTRE ACTIVITÉ'}</p><h2 id="besoin-client-title">${en?'Three offers. A clear starting point.':'Trois offres. Un point de départ clair.'}</h2></div><p>${en?'Choose your requirement to see the proposed scope and dedicated contact.':'Choisissez votre besoin pour découvrir le périmètre envisagé et le contact dédié.'}</p></div><div class="ec-offers">${cards}</div><div class="ec-other"><span>${en?'Other requirements':'Autres besoins'}</span><a href="#particuliers">${en?'Individuals':'Particuliers'}</a><a href="#b2g">${en?'Public sector':'Acteurs publics'}</a><a href="/achats${suffix}">${en?'Suppliers & contractors':'Fournisseurs & sous-traitants'}</a></div></div></section>`);
  // Keep the orientation anchor, without repeating the three offer cards.
  html=replace(html,'orientation',`<div class="ec-directory" id="orientation"><h3>${en?'A pathway for every profile':'Un parcours pour chaque profil'}</h3><p>${en?'For domestic needs, local authorities or public-sector projects, explore the dedicated profiles below. Suppliers use the purchasing registration pathway.':'Pour les besoins des particuliers, des collectivités et des acteurs publics, retrouvez les profils dédiés ci-dessous. Les fournisseurs disposent du parcours de référencement achats.'}</p><div class="ec-other"><a href="#particuliers">${en?'Individuals':'Particuliers'}</a><a href="#collectivites">${en?'Local authorities':'Collectivités'}</a><a href="#b2g">${en?'Public sector':'Acteurs publics'}</a><a href="/achats${suffix}">${en?'Supplier registration':'Référencement fournisseur'}</a></div></div>`);
  // Secondary references retain their historical deep links.
  for (const [id,label] of [['g568-s',en?'Profiles: detailed directory':'Profils : répertoire détaillé'],['g568-t',en?'Programmes, process and commitments':'Programmes, parcours et engagements']]) {
    const n=find(html,id);if(!n)throw Error('Missing customer reference section: '+id);
    const body=html.slice(n.startIndex,n.endIndex+1);
    html=html.slice(0,n.startIndex)+`<details class="ec-reference"><summary>${label}</summary>${body}</details>`+html.slice(n.endIndex+1);
  }
  html=html.replace('</body>','<script src="/assets/chrome/clients-reference.js" defer></script></body>');
  html=html.replace(/<body\b([^>]*class=")/, '<body$1ec-page ');
  return html.replace('</head>','<link id="client-modern-css" rel="stylesheet" href="/assets/chrome/clients-modern.css"></head>');
}
