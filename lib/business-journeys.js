import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {htmlToDOM} from 'html-react-parser';
const journeys=JSON.parse(readFileSync(resolve(process.cwd(),'assets/data/business-journeys.json'),'utf8'));
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const text=n=>n?.data||(n?.children||[]).map(text).join('');
function nodes(html){const all=[],walk=n=>{all.push(n);(n.children||[]).forEach(walk);};htmlToDOM(html,{withStartIndices:true,withEndIndices:true}).forEach(walk);return all;}
function reviewedDate(value){
  const match=value.match(/\b(\d{1,2})\s+([\p{L}]+)\s+(\d{4})\b/u);if(!match)return null;
  const month=match[2].normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const months=[['janvier','january'],['fevrier','february'],['mars','march'],['avril','april'],['mai','may'],['juin','june'],['juillet','july'],['aout','august'],['septembre','september'],['octobre','october'],['novembre','november'],['decembre','december']];
  const index=months.findIndex(m=>m.includes(month));
  return index<0?null:{iso:`${match[3]}-${String(index+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`,label:match[0]};
}
export function withBusinessJourneys(html){
  const language=html.match(/<html\b[^>]*lang="([^"]+)"/)?.[1];if(!['fr','en'].includes(language))return html;
  const en=language==='en',suffix=en?'-en':'',changes=[];let styled=false;
  if(html.includes('id="avancement"')){
    const all=nodes(html),section=all.find(n=>n.attribs?.id==='avancement');
    if(section){
      const inSection=n=>{for(let p=n.parent;p;p=p.parent)if(p===section)return true;return false;};
      const date=reviewedDate(text(all.find(n=>n.name==='p'&&inSection(n))));
      for(const card of all.filter(n=>n.name==='article'&&/\bmod-card\b/.test(n.attribs?.class||'')&&inSection(n))){
        if(card.attribs['data-project-reference'])continue;
        const title=text(card.children.find(n=>n.name==='h3')).trim();
        const key=Object.keys(journeys.projects).find(k=>journeys.projects[k][language]===title);if(!key)continue;
        let content=html.slice(card.startIndex,card.endIndex+1);
        const state=date?`<p class="et-project-date">${en?'Published status — reviewed':'État publié — revue du'} <time datetime="${date.iso}">${escape(date.label)}</time></p>`:'';
        const proof=content.includes('data-project-evidence="unpublished"')?`<p class="et-project-proof">${en?'Milestone evidence: not published.':'Justificatif propre au jalon : non publié.'}</p>`:'';
        content=content.replace('<article ',`<article data-project-reference="${key}"${card.attribs.id?'':` id="projet-${key}"`} `)
          .replace('</h3>',`</h3>${state}${proof}`)
          .replace('</article>',`<a class="et-project-contact" href="/contact${suffix}?profil=partenariat&amp;projet=${key}#ctForm">${en?'Ask about this project':'Poser une question sur ce projet'}</a></article>`);
        changes.push([card.startIndex,card.endIndex+1,content]);styled=true;
      }
    }
  }
  if(html.includes('id="industriels"')&&html.includes('id="flottes"')&&html.includes('id="operateurs"')){
    const all=nodes(html);
    for(const [id,key] of [['industriels','industrie-chantiers'],['flottes','transport-flottes'],['operateurs','operateurs-petroliers']]){
      const block=all.find(n=>n.attribs?.id===id);if(!block||block.attribs['data-sector-journey'])continue;
      let content=html.slice(block.startIndex,block.endIndex+1);
      const docs=id==='industriels'?[
        [en?'/Brochure_EnerTchad_EN.pdf':'/Brochure_EnerTchad.pdf',en?'Corporate brochure — English PDF':'Brochure institutionnelle — PDF'],
        [en?'/aval/distribution-en':'/aval/distribution',en?'Proposed supply and distribution model':'Modèle d’approvisionnement et de distribution envisagé'],
        [en?'/pole-enerconseils-en#ingenierie':'/enerconseils/#ingenierie',en?'Engineering for your site':'Ingénierie pour votre site']
      ]:id==='flottes'?[
        [en?'/aval/distribution-en':'/aval/distribution',en?'Proposed supply and acceptance model':'Modèle d’approvisionnement et d’acceptation envisagé'],
        [en?'/aval/reseau-en':'/aval/reseau',en?'Target network and conditions':'Réseau cible et conditions'],
        [en?'/Brochure_EnerTchad_EN.pdf':'/Brochure_EnerTchad.pdf',en?'Corporate brochure — English PDF':'Brochure institutionnelle — PDF']
      ]:[
        [en?'/Fiche_Technique_Amont_EnerTchad_EN.pdf':'/Fiche_Technique_Amont_EnerTchad.pdf',en?'Upstream technical factsheet — English PDF':'Fiche technique Amont — PDF'],
        [en?'/amont/services-ep-en':'/amont/services-ep',en?'Oilfield studies and services':'Études et services pétroliers'],
        [en?'/pole-enerconseils-en#ingenierie':'/enerconseils/#ingenierie',en?'Engineering assignments and expected outputs':'Missions d’ingénierie et livrables envisagés']
      ];
      const resources=`<aside class="et-sector-resources" aria-label="${en?'Useful resources':'Ressources utiles'}"><h4>${en?'Documents and scope':'Documents et périmètre'}</h4><ul>${docs.map(([href,label])=>`<li><a href="${href}">${escape(label)}</a></li>`).join('')}</ul></aside>`;
      content=content.replace('>',` data-sector-journey="${key}"><p class="et-sector-tag">${en?'Your pathway:':'Votre parcours :'} ${escape(journeys.sectors[key][language])}</p>`)
        .replace(/<a\b[^>]*href="\/contact(?:-en)?\?[^\"]*"[^>]*>/g,tag=>tag.replace(/href="([^"]+)"/,(_,href)=>{
          const url=new URL(href.replace(/&amp;/g,'&'),'https://enertchad.com');url.searchParams.set('secteur',key);
          if(id==='flottes')url.searchParams.set('besoin','flotte');return `href="${escape(url.pathname+url.search+url.hash)}"`;
        }));
      const end=content.lastIndexOf('</div>');content=content.slice(0,end)+resources+content.slice(end);
      changes.push([block.startIndex,block.endIndex+1,content]);styled=true;
    }
  }
  for(const [start,end,content]of changes.sort((a,b)=>b[0]-a[0]))html=html.slice(0,start)+content+html.slice(end);
  if(styled&&!html.includes('id="business-journeys-css"'))html=html.replace('</head>','<link id="business-journeys-css" rel="stylesheet" href="/assets/chrome/business-journeys.css"></head>');
  if(html.includes('id="ctForm"')&&!html.includes('id="et-enquiry-context-data"'))html=html.replace('</body>',`<script type="application/json" id="et-enquiry-context-data">${JSON.stringify(journeys).replace(/</g,'\\u003c')}</script></body>`);
  return html;
}
