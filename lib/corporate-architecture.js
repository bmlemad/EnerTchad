import {htmlToDOM} from 'html-react-parser';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const navigation=JSON.parse(readFileSync(resolve(process.cwd(),'assets/data/navigation.json'),'utf8'));
export const corporateArchitectureCss=readFileSync(resolve(process.cwd(),'assets/chrome/corporate-architecture.css'),'utf8');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function nodes(html){const all=[],walk=n=>{all.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html,{withStartIndices:true,withEndIndices:true}).forEach(walk);return all;}
const cls=(n,c)=>(n.attribs?.class||'').split(/\s+/).includes(c);
// The existing manifest remains the sole source of navigation labels and routes.
export function corporateSections(en=false){return navigation[en?'en':'fr'].map(m=>({id:m.id,label:m.label,href:m.overview[2],description:m.description,groups:m.groups.map(g=>({title:g.title,links:g.links.map(([label,description,href])=>[href,label])}))}));}
export function withCorporateFooter(html,en){
  if(html.includes('data-et-corporate-sections'))return html;
  const all=nodes(html),column=all.find(n=>cls(n,'foot-col'));if(!column)return html;
  const heading=(column.children||[]).find(n=>n.name==='h3');if(!heading)return html;
  const inside=corporateSections(en).map(s=>`<a href="${esc(s.href)}">${esc(s.label)}</a>`).join('');
  const opening=html.slice(column.startIndex,heading.endIndex+1).replace('>',' data-et-corporate-sections>');
  return html.slice(0,column.startIndex)+opening+inside+'</div>'+html.slice(column.endIndex+1);
}
export function withArchitectureWayfinding(html){
  if(html.includes('id="et-architecture-context"'))return html;
  const lang=html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1];if(!['fr','en'].includes(lang))return html;
  const en=lang==='en',s=en?'-en':'',canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];if(!canonical)return html;
  const route=new URL(canonical).pathname.replace(/\.html$/,'').replace(/\/$/,'');
  const section=corporateSections(en).find(sec=>sec.href.replace(/\/$/,'')===route);
  if(!section)return html;
  const next=section.id==='a'?[['/gouvernance'+s,en?'Governance':'Gouvernance'],['/engagements'+s,en?'Commitments & evidence':'Engagements & preuves']]:section.id==='b'?[[en?'/boutique/en/clients':'/boutique/clients',en?'Find your client solution':'Trouver votre solution client'],['/projets'+s,en?'Proposed projects':'Projets envisagés']]:section.id==='c'?[['/investisseurs'+s,en?'Investor information':'Informations investisseurs'],['/publications'+s,en?'Public documents':'Documents publics']]:section.id==='e'?[['/communautes'+s,en?'Communities & local content':'Communautés & contenu local'],['/publications'+s,en?'Published documents':'Documents publiés']]:section.id==='f'?[['/communiques'+s,en?'Official announcements':'Annonces officielles'],['/carnets'+s,en?'Editorial analysis':'Analyses & Carnets']]:[['/projets'+s+'#avancement',en?'Project status & prerequisites':'État des projets & prérequis'],['/contact'+s+'?profil=invest#ctForm',en?'Investor enquiry':'Échange investisseur']];
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
