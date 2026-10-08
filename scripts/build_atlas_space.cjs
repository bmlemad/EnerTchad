const fs = require('node:fs');
const { htmlToDOM } = require('html-react-parser');
const pages = [
  {slug:'',fr:'ATLAS — Le secteur pétrolier et gazier du Tchad',en:'ATLAS — Chad’s oil and gas sector',ids:[]},
  {slug:'carte',fr:'Carte et répertoire',en:'Map and directory',ids:['atlas-cadastre','atl-cadastre']},
  {slug:'bassins-champs',fr:'Bassins et champs',en:'Basins and fields',ids:['atl-geologie','atl-bassins','atl-champs','atl-reserves','atl-stoiip']},
  {slug:'infrastructures',fr:'Infrastructures et opérations',en:'Infrastructure and operations',ids:['atl-infra','atl-assay','atl-reseaux','atl-gaz','atl-climat']},
  {slug:'cadre-sectoriel',fr:'Cadre sectoriel',en:'Sector framework',ids:['atl-regime','atl-histoire','atl-expansion','atl-entrer']},
  {slug:'sources',fr:'Sources et méthode',en:'Sources and methodology',ids:['atl-sources']}
];
const summaries = {
  fr:['Explorez les bassins, les champs et les infrastructures à partir des informations publiques réunies dans l’Atlas EnerTchad, avec leurs sources et leurs limites.','Repérez les bassins, les champs et les blocs. La liste du cadastre offre une autre façon de consulter la carte.','Consultez le cadre géologique, les bassins, les champs, les réserves et l’estimateur volumétrique pédagogique.','Parcourez les infrastructures d’export, les caractéristiques du brut et les conditions d’appui aux opérations.','Retrouvez le cadre juridique, l’histoire du secteur et les informations pour préparer un projet.','Consultez les références utilisées par l’Atlas et les conventions de lecture des données.'],
  en:['Explore basins, fields and infrastructure using the public information collected in the EnerTchad Atlas. Check the sources and limitations of the data.','Locate basins, fields and blocks. The cadastre list provides another way to explore the map.','Explore the geological setting, basins, fields, reserves and educational volumetric estimator.','Explore export infrastructure, crude characteristics and operating conditions.','Consult the legal framework, sector history and information for preparing a project.','Consult the Atlas references and the conventions used to interpret the data.']
};
// L accueil francais de l Atlas est servi a /atlas/ (atlas/index.html) : /atlas redirige en 301 vers /atlas/.
// Canonical, hreflang, sitemap et liens visent donc directement /atlas/.
const route=(p,lang)=>p.slug?'/atlas/'+p.slug+(lang==='en'?'-en':''):(lang==='en'?'/atlas-en':'/atlas/');
// Ancres de l ancienne page /enerconseils/atlas(-en) : meme table que assets/chrome/atlas-route.js.
const oldRoutes={'atlas-cadastre':'carte','atl-cadastre':'carte','atl-geologie':'bassins-champs','atl-bassins':'bassins-champs','atl-champs':'bassins-champs','atl-reserves':'bassins-champs','atl-stoiip':'bassins-champs','atl-infra':'infrastructures','atl-assay':'infrastructures','atl-reseaux':'infrastructures','atl-gaz':'infrastructures','atl-climat':'infrastructures','atl-regime':'cadre-sectoriel','atl-histoire':'cadre-sectoriel','atl-expansion':'cadre-sectoriel','atl-entrer':'cadre-sectoriel','atl-sources':'sources'};
const oldLink=(en,id)=>{if(id==='atl-investir')id='atl-entrer';if(id==='donnees-secteur')id='atl-geologie';const r=oldRoutes[id];return r?'/atlas/'+r+(en?'-en':'')+'#'+id:(en?'/atlas-en':'/atlas/')};
const css = `.atlas-space{max-width:1240px;margin:auto;padding:calc(var(--nav-h,138px) + 28px) 24px 48px!important}.atlas-hero{padding:40px 32px;border-radius:20px;background:#172638;color:#faf7ee}.atlas-kicker{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}.atlas-hero h1{font-size:clamp(2rem,4.5vw,3.6rem);line-height:1.12;margin:14px 0 20px;max-width:950px}.atlas-hero p{max-width:780px;line-height:1.7}.atlas-hero h1,.atlas-hero p{color:#faf7ee!important;-webkit-text-fill-color:currentColor!important}.atlas-nav{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.atlas-nav a{padding:12px 16px;border:1px solid #9ca6b0;border-radius:8px;text-decoration:none;line-height:1.4;min-height:44px}.atlas-nav [aria-current=page]{background:#172638!important;color:#fff!important;-webkit-text-fill-color:currentColor!important}.atlas-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:24px 0}.atlas-card{display:block;border:1px solid #a4acb5;border-radius:14px;padding:24px;text-decoration:none;line-height:1.6}.atlas-card h2{font-size:1.25rem;line-height:1.3;margin:0 0 12px}.atlas-note{padding:18px 22px;border-left:4px solid #9e7d3f;background:#eff1f4;color:#172638;line-height:1.7;margin:24px 0}.atlas-method{padding:24px;border:1px solid #a4acb5;border-radius:14px;line-height:1.8}.atlas-method h2{font-size:1.6rem;line-height:1.3}.atlas-content .atl-sec{margin:28px 0;scroll-margin-top:calc(var(--nav-h,138px) + 20px)}.atlas-space a:focus-visible,.atlas-space button:focus-visible{outline:3px solid #2575c5;outline-offset:4px}.atlas-content{min-width:0}.atlas-content table{max-width:100%}.atlas-languages{display:flex;gap:18px;margin:0 0 20px}.atlas-footer-links{display:flex;flex-wrap:wrap;gap:18px;margin:32px 0}@media(max-width:760px){.atlas-space{padding-inline:16px}.atlas-hero{padding:26px 20px}.atlas-cards{grid-template-columns:1fr}.atlas-nav a{flex:1 1 140px}.atlas-content .atl-d{max-width:100%}}`;
const strong = 'html'+Array.from({length:44},(_,i)=>`:not(#atlas-theme-${i})`).join('')+' #main-content.atlas-space';
const scoped = css.replace(/(^|})(\.atlas[^{}]+)\{/g,(_,close,sel)=>close+sel.split(',').map(x=>strong+' '+x.replace(/^\.atlas-space\s*/, '')).join(',')+'{');
for (const lang of ['fr','en']) {
 const source=fs.readFileSync(`enerconseils/atlas${lang==='en'?'-en':''}.html`,'utf8');
 const dom=htmlToDOM(source,{withStartIndices:true,withEndIndices:true});
 const nodes=[];const walk=n=>{nodes.push(n);(n.children||[]).forEach(walk)};dom.forEach(walk);
 const main=nodes.find(n=>n.name==='main');
 const section=id=>{const n=nodes.find(n=>n.attribs?.id===id);if(!n)throw Error('Missing '+lang+' '+id);return source.slice(n.startIndex,n.endIndex+1)};
 const map=new Map(pages.flatMap(p=>p.ids.map(id=>[id,p])));
 const fragments=s=>s.replace(/href="#(atl-[^"]+|atlas-cadastre)"/g,(m,id)=>map.has(id)?`href="${route(map.get(id),lang)}#${id}"`:m);
 for (const [i,p] of pages.entries()) {
  const url=route(p,lang), title=p[lang]+' | EnerTchad', desc=summaries[lang][i];
  let head=source.slice(0,main.startIndex);
  head=head.replace(/<title>[\s\S]*?<\/title>/,`<title>${title}</title>`)
   .replace(/<meta\b[^>]*name="description"[^>]*>/g,`<meta name="description" content="${desc}">`)
   .replace(/<link\b[^>]*rel="canonical"[^>]*>/g,`<link rel="canonical" href="https://enertchad.com${url}">`)
   .replace(/<link\b[^>]*rel="alternate"[^>]*hreflang[^>]*>/g,'')
   .replace(/(<meta\b[^>]*(?:property|name)="og:(?:url|title|description)"[^>]*content=")[^"]*("[^>]*>)/g,(m,a,b)=>a+(a.includes('og:url')?'https://enertchad.com'+url:a.includes('og:title')?title:desc)+b)
   .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'')
   .replace('</head>',`<link rel="alternate" hreflang="fr" href="https://enertchad.com${route(p,'fr')}"><link rel="alternate" hreflang="en" href="https://enertchad.com${route(p,'en')}"><link rel="alternate" hreflang="x-default" href="https://enertchad.com${route(p,'fr')}"><style id="atlas-space-style">${scoped}</style><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,url:'https://enertchad.com'+url,inLanguage:lang,description:desc,isPartOf:{'@type':'WebSite',name:'EnerTchad',url:'https://enertchad.com'}})}</script></head>`);
  const nav=`<nav class="atlas-nav" aria-label="${lang==='fr'?'Navigation ATLAS':'ATLAS navigation'}">${pages.map(x=>`<a href="${route(x,lang)}"${x===p?' aria-current="page"':''}>${x.slug?x[lang]:(lang==='fr'?'Accueil ATLAS':'ATLAS home')}</a>`).join('')}</nav>`;
  const note=lang==='fr'?'Cet espace organise le contenu de l’Atlas existant. La date de réorganisation du 8 octobre 2026 ne constitue pas une actualisation des données. Les statuts et chiffres restent ceux des sources citées ; les activités des opérateurs ne sont pas des réalisations d’EnerTchad.':'This space reorganizes the existing Atlas. The reorganization date of 8 October 2026 is not a data update. Statuses and figures remain those of the cited sources; operators’ activities are not EnerTchad achievements.';
  let content=p.ids.map(section).join('\n');
  // Sous-pages : les sections reprises de l ancienne page commencent en h3 sous le h1 (axe heading-order).
  // Niveau annonce corrige par aria-level, sans changer les balises ni le style.
  if(p.slug)content=content.replace(/<h([3-6])(?=[\s>])/g,(m,n)=>`<h${n} aria-level="${n-1}"`);
  if(!p.slug)content=`<div class="atlas-cards">${pages.slice(1).map((x,j)=>`<a class="atlas-card" href="${route(x,lang)}"><h2>${x[lang]}</h2><p>${summaries[lang][j+1]}</p><span>${lang==='fr'?'Explorer':'Explore'} →</span></a>`).join('')}</div>`;
  if(p.slug==='cadre-sectoriel')content=`<p><a href="${route(pages[1],lang)}#atl-cadastre">${lang==='fr'?'Consulter le cadastre et la liste des blocs':'View the cadastre and block directory'} →</a></p>`+content;
  if(p.slug==='sources')content=`<section class="atlas-method"><h2>${lang==='fr'?'Comment lire l’Atlas':'How to read the Atlas'}</h2><p>${lang==='fr'?'Consultez la source et sa date avant de réutiliser une donnée. Une date de consultation ou de revue ne remplace pas la date de la mesure originale. Une coordonnée indicative ne constitue pas un relevé topographique.':'Check the source and its date before reusing data. A consultation or review date does not replace the original measurement date. Indicative coordinates are not a topographical survey.'}</p><p>${lang==='fr'?'Les réserves, les ressources et les résultats du calculateur pédagogique sont des notions distinctes. Les résultats du calculateur dépendent de ses hypothèses et ne constituent pas une certification de réserves.':'Reserves, resources and results from the educational calculator are distinct concepts. Calculator results depend on its assumptions and are not a reserves certification.'}</p><p>${lang==='fr'?'Le statut d’un actif décrit l’information disponible dans sa source ; il ne garantit pas sa situation actuelle. Signalez une correction avec le nom de l’élément, une référence publique et sa date.':'An asset’s status reflects information in its source and does not guarantee its current situation. Report a correction with the item name, a public reference and its date.'}</p><a href="/contact${lang==='en'?'-en':''}">${lang==='fr'?'Signaler une correction':'Report a correction'}</a></section>`+content;
  let body=`<main id="main-content" tabindex="-1" class="atlas-space"><div class="atlas-languages"><a href="/${lang==='en'?'index-en':''}">${lang==='fr'?'← EnerTchad':'← EnerTchad'}</a><a href="${route(p,lang==='fr'?'en':'fr')}" lang="${lang==='fr'?'en':'fr'}">${lang==='fr'?'English':'Français'}</a></div><header id="top-pole" class="atlas-hero"><p class="atlas-kicker">ATLAS · EnerTchad</p><h1>${p[lang]}</h1><p>${desc}</p></header>${nav}<aside class="atlas-note">${note}</aside><div class="atlas-content">${fragments(content)}</div><div class="atlas-footer-links"><a href="${route(pages[5],lang)}">${lang==='fr'?'Sources et méthode':'Sources and methodology'}</a><a href="/${lang==='en'?'pole-enerconseils-en#conseil':'enerconseils/#conseil'}">${lang==='fr'?'Conseil et accompagnement':'Advisory services'}</a><a href="/investor-center${lang==='en'?'-en':''}">${lang==='fr'?'Centre investisseurs':'Investor center'}</a></div></main>`;
  // Preserve guarded widget initializers located between sections in the original main.
  // Scripts already inside a selected section must execute only once.
  const initializers=nodes.filter(n=>n.name==='script' && n.startIndex>main.startIndex && n.endIndex<main.endIndex)
    .map(n=>source.slice(n.startIndex,n.endIndex+1)).filter(script=>!body.includes(script)).join('\n');
  body=body.replace('</main>',initializers+'</main>');
  let tail=source.slice(main.endIndex+1);
  // Links from the shared navigation enter the new space; specialized old anchors remain usable.
  let output=head+body+tail;
  output=output.replace(/href="\/enerconseils\/atlas(-en)?(?:#([^"]*))?"/g,(_,en,id)=>`href="${oldLink(!!en,id)}"`);
  if(!p.slug)output=output.replace('</body>',`<script src="/assets/chrome/atlas-route.js?v=20261008"></script></body>`);
  const file=!p.slug&&lang==='fr'?'atlas/index.html':url.slice(1)+'.html';fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,output);
 }
}
console.log('Generated 12 dedicated ATLAS pages from existing French and English content.');
