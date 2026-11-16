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
    // Lot 132 : sur mobile, les cas d'usage et les cinq principes de la méthode se replient sous leur titre ; sur ordinateur
    // ils restent ouverts et sans bouton. Le repli ne s'applique qu'avec JavaScript : sans lui, tout reste ouvert.
    for(const [id,count,tag,label] of [['cas',5,'<li>',en?'See the five cases':'Voir les cinq cas'],['approche',5,'<span class="pp-no">',en?'See the five principles':'Voir les cinq principes']]){
      let done=false;
      html=html.replace(new RegExp(`(<section id="${id}"[^>]*>[\\s\\S]*?<div class="pp-head">[\\s\\S]*?</div>)([\\s\\S]*?)(</div></section>)`),(_,head,body,tail)=>{
        if(body.split(tag).length-1!==count)throw Error(`Expected ${count} items in upstream section ${id}`);
        done=true;
        return `${head}<details class="pp-mfold" data-mobile-fold open><summary>${label}</summary>${body}</details>${tail}`;
      });
      if(!done)throw Error(`Missing upstream section ${id}`);
    }
    html=html.replace('</main>',`<style>.pp-mfold>summary{display:none}@media(max-width:760px){.pp-mfold>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;padding:0 4px;border-top:1px solid currentColor;border-bottom:1px solid currentColor;font-weight:600;cursor:pointer;list-style:none}.pp-mfold>summary::-webkit-details-marker{display:none}.pp-mfold>summary::after{content:"+";font-size:1.5rem;font-weight:300;line-height:1}.pp-mfold[open]>summary::after{content:"−"}.pp-mfold>summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}}</style><script>if(matchMedia("(max-width:760px)").matches)document.querySelectorAll("details[data-mobile-fold]").forEach(function(d){d.open=false})</script></main>`);
    html=html.replace(/href="#offre">(Voir l’offre|See the offer)<\/a>/,`href="#solutions">${en?'Explore the offers':'Voir les offres'}</a>`);
  }else if(['/contact','/contact-en'].includes(route)){
    html=html.replace(/<header class="pp-hero pp-hero-s" id="top-pole">([\s\S]*?)<\/header>/,(_,content)=>
      `<header class="pp-hero pp-hero-s" id="top-pole" style="min-height:0!important">${content.replace('<div class="pp-wrap">','<div class="pp-wrap ct-hero-wrap" style="padding-top:var(--ct-pt,40px)!important;padding-bottom:var(--ct-pb,40px)!important">').replace('</div>',`<div class="pp-actions"><a class="pp-btn pp-btn-light" href="#ctForm">${en?'Write to EnerTchad':'Écrire à EnerTchad'}</a></div></div>`)}</header>`);
    // Lot 132 : « Contact rapide » se replie sous son titre (texte et liens conservés) pour rapprocher le formulaire ; bandeau resserré sur mobile.
    let folded=false;
    html=html.replace(/(<section aria-label="(?:Contact rapide|Quick contact)[^"]*" id="contact-rapide"[^>]*><div[^>]*>)(<h2[^>]*>[\s\S]*?<\/h2>)([\s\S]*?)(<\/div><\/section>)/,(_,open,title,rest,close)=>{folded=true;return `${open}<details class="ct-fold"><summary>${title}</summary>${rest}</details>${close}`;});
    if(!folded)throw Error('Missing quick contact block');
    html=html.replace('</main>',`<style>@media(max-width:760px){.ct-hero-wrap{--ct-pt:12px;--ct-pb:20px}.ct-hero-wrap .pp-sublead{font-size:1rem!important;line-height:1.45!important}}.ct-fold>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;cursor:pointer;list-style:none}.ct-fold>summary::-webkit-details-marker{display:none}.ct-fold>summary h2{margin:0!important}.ct-fold>summary::after{content:"+";font-size:1.5rem;font-weight:300;line-height:1;color:currentColor}.ct-fold[open]>summary::after{content:"−"}.ct-fold>summary:focus-visible{outline:2px solid currentColor;outline-offset:3px}</style></main>`);
  }else if(['/enerconseils/','/pole-enerconseils-en'].includes(route)){
    // Existing original illustration, listed in credits-photos; no third-party photo.
    html=html.replaceAll('lac-tchad-espace','complexe-industriel')
      .replace(/alt="(?:Illustration abstraite[^\"]*|Abstract illustration[^\"]*)"/,`alt="${en?'Illustration: schematic industrial facilities':'Illustration : schéma d’installations industrielles'}"`)
      .replace(/\/assets\/img\/p\/complexe-industriel-[\w]+\.(?:webp|avif)/g,url=>`${url}?v=${createHash('sha256').update(readFileSync('.'+url)).digest('hex').slice(0,12)}`);
  }else return html;
  return html.replace('id="top-pole"','id="top-pole" data-visual-priorities');
}
