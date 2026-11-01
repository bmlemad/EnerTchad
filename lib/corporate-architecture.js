import {htmlToDOM} from 'html-react-parser';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const journeys=JSON.parse(readFileSync(resolve(process.cwd(),'assets/data/business-journeys.json'),'utf8'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function nodes(html){const all=[],walk=n=>{all.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html,{withStartIndices:true,withEndIndices:true}).forEach(walk);return all;}
const cls=(n,c)=>(n.attribs?.class||'').split(/\s+/).includes(c);
export function corporateSections(en=false){
  const s=en?'-en':'',t=(fr,eng)=>en?eng:fr;
  const l=(href,fr,eng)=>[href,t(fr,eng)];
  const group=(fr,eng,links)=>({title:t(fr,eng),links});
  return [
    {id:'a',label:t('Entreprise','Company'),href:'/societe'+s,description:t('Identité, statut de constitution, gouvernance et responsabilités.','Identity, formation status, governance and responsibilities.'),groups:[group('Identité & gouvernance','Identity & governance',[
      l('/societe'+s,'La Société','Company overview'),l('/gouvernance'+s,'Gouvernance','Governance'),l('/ethique'+s,'Éthique & conformité','Ethics & compliance'),l('/innovation'+s,'Innovation & recherche','Innovation & research')]),group('Travailler avec EnerTchad','Work with EnerTchad',[
      l('/achats'+s,'Achats & fournisseurs','Procurement & suppliers'),l('/carrieres'+s,'Métiers & candidatures','Careers & applications'),l('/faq'+s,'Questions fréquentes','Frequently asked questions'),l('/contact'+s,'Contact','Contact')])]},
    {id:'b',label:t('Activités & Ingénierie','Activities & Engineering'),href:'/nos-activites'+s,description:t('Quatre segments industriels, quatre capacités transversales et des parcours par besoin.','Four industrial segments, four cross-functional capabilities and pathways by requirement.'),groups:[group('Segments industriels','Industrial segments',[
      l(en?'/pole-amont-en':'/amont/','Exploration & Production','Exploration & Production'),l(en?'/pole-intermediaire-en':'/intermediaire/','Transport & stockage','Transport & storage'),l(en?'/pole-aval-en':'/aval/','Raffinage & distribution','Refining & distribution'),l(en?'/pole-enerchimie-en':'/petrochimie/','Pétrochimie','Petrochemicals')]),group('Capacités transversales','Cross-functional capabilities',[
      l(en?'/pole-enerconseils-en':'/enerconseils/','Ingénierie & Conseil · EnerConseils','Engineering & Advisory · EnerConseils'),l(en?'/pole-tchaditech-en':'/tchaditech/','Technologies & données · TchadiTech','Technology & data · TchadiTech'),l(en?'/pole-greentech-en':'/greentech/','Durabilité & HSE · GreenTech','Sustainability & HSE · GreenTech'),l(en?'/pole-tchaditude-en':'/tchaditude/','Formation & compétences · Tchaditude','Training & skills · Tchaditude')]),group('Solutions clients','Client solutions',Object.entries(journeys.sectors).map(([key,v],i)=>[(en?'/boutique/en/clients':'/boutique/clients')+'#'+['industriels','flottes','operateurs'][i],v[en?'en':'fr']]))]},
    {id:'p',label:t('Projets','Projects'),href:'/projets'+s,description:t('Huit projets envisagés : état publié, prochain prérequis et justificatifs disponibles.','Eight proposed projects: published status, next prerequisite and available evidence.'),groups:[group('Portefeuille & avancement','Portfolio & progress',[
      l('/projets'+s+'#avancement','État des huit projets','Status of the eight projects'),l('/cibles-2030'+s,'Cibles & indicateurs','Targets & indicators')]),group('Fiches projets','Project records',Object.entries(journeys.projects).map(([key,v])=>['/projets'+s+'#projet-'+key,v[en?'en':'fr']]))]},
    {id:'c',label:t('Engagements','Commitments'),href:'/engagements'+s,description:t('Sécurité, environnement, communautés et transparence : politiques, cibles et données publiées.','Safety, environment, communities and transparency: published policies, targets and data.'),groups:[group('HSE & environnement','HSE & environment',[
      l('/engagements'+s,'Politiques & indicateurs','Policies & indicators'),l(en?'/pole-greentech-en':'/greentech/','Environnement & durabilité','Environment & sustainability')]),group('Territoires & compétences','Communities & skills',[
      l('/communautes'+s,'Communautés & contenu local','Communities & local content'),l(en?'/pole-tchaditude-en':'/tchaditude/','Formation & compétences','Training & skills'),l('/achats'+s,'Achats locaux & fournisseurs','Local procurement & suppliers')]),group('Transparence','Transparency',[
      l('/paiements-etats'+s,'Paiements aux États','Payments to governments'),l('/ethique'+s,'Éthique & signalement','Ethics & reporting'),l('/cibles-2030'+s,'Cibles publiées','Published targets')])]},
    {id:'e',label:t('Actualités & Documents','News & Documents'),href:'/publications'+s,description:t('Distinguer les annonces officielles, les analyses et les documents de référence.','Find official announcements, editorial analysis and reference documents.'),groups:[group('Actualités officielles','Official news',[
      l('/communiques'+s,'Communiqués officiels','Official releases'),l('/communiques'+s+'#presse','Espace presse','Press centre')]),group('Analyses & Carnets','Analysis & Notebooks',[
      l('/carnets'+s,'Carnets · articles & entretiens','Notebooks · articles & interviews'),l(en?'/atlas-en':'/atlas/','Atlas du secteur · contexte national','Sector atlas · national context')]),group('Documents & données','Documents & data',[
      l('/publications'+s,'Publications & registre documentaire','Publications & document register'),l('/glossaire-petrolier'+s,'Glossaire pétrolier','Oil & gas glossary'),l('/brochure'+s,'Brochure institutionnelle','Corporate brochure')])]},
    {id:'d',label:t('Investisseurs','Investors'),href:'/investisseurs'+s,description:t('Évaluer le programme : modèle économique, financement par étapes, conditions et documents publics.','Evaluate the programme: business model, staged funding, conditions and public documents.'),groups:[group('Évaluer le programme','Evaluate the programme',[
      l('/investisseurs'+s+'#these','Thèse d’investissement','Investment thesis'),l('/investisseurs'+s+'#modele','Modèle économique','Business model'),l('/investisseurs'+s,'Financement, conditions & questions','Funding, conditions & questions'),l('/projets'+s+'#avancement','Projets & prérequis','Projects & prerequisites')]),group('Documents & échange','Documents & enquiries',[
      l('/publications'+s,'Documents publics','Public documents'),l('/gouvernance'+s,'Gouvernance','Governance'),l('/investisseurs'+s+'#agenda','Agenda investisseur','Investor calendar'),l('/contact'+s+'?profil=invest#ctForm','Échanger avec l’équipe','Contact the team')])]}
  ];
}
export function withCorporateMenu(html,en){
  if(html.includes('data-et-architecture="six"'))return html;
  const all=nodes(html),links=all.find(n=>n.attribs?.id==='navLinks');if(!links)return html;
  const items=all.filter(n=>n.parent===links&&cls(n,'nav-item'));if(!items.length)return html;
  const arrow='<svg aria-hidden="true" focusable="false" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5L6 8l3.5-3.5"/></svg>';
  const sections=corporateSections(en);
  const markup=sections.map(section=>`<div class="nav-item pn-item et-architecture-item"><button type="button" class="nav-trigger" style="font-size:var(--et-corporate-nav-size,13px)!important;padding-inline:var(--et-corporate-nav-pad,8px)!important" aria-expanded="false" aria-haspopup="true" aria-controls="nxm-${section.id}">${esc(section.label)} ${arrow}</button><div class="nx-mega pn-mega et-architecture-panel" id="nxm-${section.id}" role="region" style="grid-template-columns:var(--et-architecture-panel-columns,minmax(0,1fr) minmax(0,3fr))!important" aria-label="${esc(section.label)}"><div class="nx-col pn-intro"><p class="nxh">${esc(section.label)}</p><p class="pn-d">${esc(section.description)}</p><a class="pn-all" href="${esc(section.href)}"><strong>${en?'Overview':'Vue d’ensemble'}</strong><em>${esc(section.label)}</em></a></div><div class="nx-col pn-links et-architecture-groups" style="display:grid!important;grid-template-columns:var(--et-architecture-columns,repeat(${section.groups.length},minmax(0,1fr)))!important;gap:20px!important">${section.groups.map(g=>`<section class="et-architecture-group${section.id==='e'?' nx-resource-group':''}" aria-label="${esc(g.title)}"><h3 class="nx-resource-title">${esc(g.title)}</h3>${g.links.map(([href,label])=>`<a href="${esc(href)}"><strong>${esc(label)}</strong></a>`).join('')}</section>`).join('')}</div></div></div>`).join('');
  for(const [i,item]of [...items].reverse().entries())html=html.slice(0,item.startIndex)+(item===items[0]?markup:'')+html.slice(item.endIndex+1);
  return html.replace('id="navLinks"','id="navLinks" data-et-architecture="six"');
}
export function withCorporateFooter(html,en){
  if(html.includes('data-et-corporate-sections'))return html;
  const all=nodes(html),column=all.find(n=>cls(n,'foot-col'));if(!column)return html;
  const heading=(column.children||[]).find(n=>n.name==='h3');if(!heading)return html;
  const inside=corporateSections(en).map(s=>`<a href="${esc(s.href)}">${esc(s.label)}</a>`).join('');
  return html.slice(0,heading.endIndex+1)+`<div data-et-corporate-sections>${inside}</div></div>`+html.slice(column.endIndex+1);
}
export function withArchitectureWayfinding(html){
  if(html.includes('id="et-architecture-context"'))return html;
  const lang=html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1];if(!['fr','en'].includes(lang))return html;
  const en=lang==='en',s=en?'-en':'',canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];if(!canonical)return html;
  const route=new URL(canonical).pathname.replace(/\.html$/,'').replace(/\/$/,'');
  const section=corporateSections(en).find(sec=>sec.href.replace(/\/$/,'')===route);
  if(!section)return html;
  const next=section.id==='a'?[['/gouvernance'+s,en?'Governance':'Gouvernance'],['/engagements'+s,en?'Commitments & evidence':'Engagements & preuves']]:section.id==='b'?[[en?'/boutique/en/clients':'/boutique/clients',en?'Find your client solution':'Trouver votre solution client'],['/projets'+s,en?'Proposed projects':'Projets envisagés']]:section.id==='p'?[['/investisseurs'+s,en?'Investor information':'Informations investisseurs'],['/publications'+s,en?'Public documents':'Documents publics']]:section.id==='c'?[['/communautes'+s,en?'Communities & local content':'Communautés & contenu local'],['/publications'+s,en?'Published documents':'Documents publiés']]:section.id==='e'?[['/communiques'+s,en?'Official announcements':'Annonces officielles'],['/carnets'+s,en?'Editorial analysis':'Analyses & Carnets']]:[['/projets'+s+'#avancement',en?'Project status & prerequisites':'État des projets & prérequis'],['/contact'+s+'?profil=invest#ctForm',en?'Investor enquiry':'Échange investisseur']];
  const nav=`<nav id="et-architecture-context" class="et-architecture-context" aria-label="${en?'Related corporate sections':'Rubriques corporate associées'}"><span>${esc(section.label)}</span>${next.map(([href,label])=>`<a href="${esc(href)}">${esc(label)} →</a>`).join('')}</nav>`;
  return html.replace(/<\/main>/,nav+'</main>');
}
export function withEditorialType(html){
  if(html.includes('data-et-content-kind'))return html;
  const lang=html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1];if(!['fr','en'].includes(lang))return html;
  const en=lang==='en',canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];if(!canonical)return html;
  const route=new URL(canonical).pathname;
  const kind=/\/journal-/.test(route)?'analysis':/\/communiques(?:-en)?(?:\.html)?\/?$/.test(route)?'official':null;
  if(!kind)return html;
  const label=kind==='analysis'?(en?'Notebooks · analysis & interviews':'Carnets · analyses & entretiens'):(en?'Official announcements':'Annonces officielles');
  const date=kind==='analysis'?html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1]:null;
  const stamp=date?`<time datetime="${date}">${new Date(date+'T00:00:00Z').toLocaleDateString(en?'en-GB':'fr-FR',{timeZone:'UTC',day:'numeric',month:'long',year:'numeric'})}</time>`:'';
  return html.replace(/<\/main>/,`<aside class="et-architecture-context" data-et-content-kind="${kind}" aria-label="${en?'Publication type':'Nature de la publication'}"><strong>${label}</strong>${stamp}<a href="/${kind==='analysis'?'carnets':'communiques'}${en?'-en':''}">${en?'Browse this collection':'Parcourir cette rubrique'} →</a></aside></main>`);
}
