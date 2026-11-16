import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Scoped export presentation: source content and historical deep links remain available.
export function withVisualPriorities(html){
  if(html.includes('data-visual-priorities'))return html;
  const route=html.match(/<link rel="canonical" href="https:\/\/enertchad\.com([^\"]*)"/)?.[1];
  const en=/<html\b[^>]*lang="en"/.test(html);
  if(['/amont/','/pole-amont-en'].includes(route)){
    const labels=en?['Our offers','Technical expertise','Projects','Documents','Contact']:['Nos offres','Expertises techniques','Projets','Documents','Contact'];
    const ids=['solutions','offre','chantiers','documents','carnets-amont'];
    html=html.replace(/<nav class="pp-sub"[\s\S]*?<\/nav>/,`<nav class="pp-sub" aria-label="${en?'Upstream pathways':'Parcours Amont'}"><div class="pp-wrap">${ids.map((id,i)=>`<a href="#${id}">${labels[i]}</a>`).join('')}</div></nav>`);
    html=html.replace(/<section id="offre"[\s\S]*?<\/section>/,section=>{
      section=section.replace('<div class="pp-groups">','<div class="pp-exp" data-upstream-details>');
      let count=0;
      section=section.replace(/<div class="pp-group"><p class="pp-k">([^<]+)<\/p>(<ul>[\s\S]*?<\/ul>)<\/div>/g,(_,title,list)=>{count++;return `<details><summary>${title}</summary><div class="pp-group">${list}</div></details>`;});
      if(count!==3)throw Error('Expected three upstream technical groups');
      return section.replace('</section>',`<div class="pp-wrap"><div class="pp-actions"><a class="pp-link" href="/contact${en?'-en':''}?activite=amont&amp;profil=ep&amp;service=faisabilite#ctForm">${en?'Discuss your technical requirements':'Présenter votre besoin technique'} →</a></div></div></section>`);
    });
    html=html.replace(/href="#offre">(Voir l’offre|See the offer)<\/a>/,`href="#solutions">${en?'Explore the offers':'Voir les offres'}</a>`);
  }else if(['/contact','/contact-en'].includes(route)){
    html=html.replace(/<header class="pp-hero pp-hero-s" id="top-pole">([\s\S]*?)<\/header>/,(_,content)=>
      `<header class="pp-hero pp-hero-s" id="top-pole" style="min-height:0!important">${content.replace('<div class="pp-wrap">','<div class="pp-wrap" style="padding-block:40px!important">').replace('</div>',`<div class="pp-actions"><a class="pp-btn pp-btn-light" href="#ctForm">${en?'Write to EnerTchad':'Écrire à EnerTchad'}</a></div></div>`)}</header>`);
  }else if(['/enerconseils/','/pole-enerconseils-en'].includes(route)){
    // Existing original illustration, listed in credits-photos; no third-party photo.
    html=html.replaceAll('lac-tchad-espace','complexe-industriel')
      .replace(/alt="(?:Illustration abstraite[^\"]*|Abstract illustration[^\"]*)"/,`alt="${en?'Illustration: schematic industrial facilities':'Illustration : schéma d’installations industrielles'}"`)
      .replace(/\/assets\/img\/p\/complexe-industriel-[\w]+\.(?:webp|avif)/g,url=>`${url}?v=${createHash('sha256').update(readFileSync('.'+url)).digest('hex').slice(0,12)}`);
  }else return html;
  return html.replace('id="top-pole"','id="top-pole" data-visual-priorities');
}
