
/* Mode lecture claire des carnets : bouton dans la barre du haut, persistant. */
try{(function(){var KEY='et-jlight';
function apply(on){document.documentElement.classList.toggle('et-jlight',on)}
try{if(document.querySelector('.jback')){var _v=localStorage.getItem('et-jlight')||localStorage.getItem('et-plight');if(_v==='1'||(_v===null&&matchMedia('(prefers-color-scheme: light)').matches))apply(true)}}catch(e){}
function init(){var bar=document.querySelector('.jtop');if(!bar||!document.querySelector('.jback'))return;if(document.getElementById('jlightBtn'))return;
var b=document.createElement('button');b.id='jlightBtn';b.type='button';b.title='Basculer lecture claire / sombre';b.setAttribute('aria-label','Basculer lecture claire ou sombre');
b.setAttribute('aria-pressed',document.documentElement.classList.contains('et-jlight')?'true':'false');b.textContent='☀';
b.addEventListener('click',function(){var on=!document.documentElement.classList.contains('et-jlight');apply(on);b.setAttribute('aria-pressed',on?'true':'false');try{localStorage.setItem('et-jlight',on?'1':'0');localStorage.setItem('et-plight',on?'1':'0')}catch(e){}});
bar.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})()}catch(e){}

/* Mode clair des pages editoriales (liste blanche) : bouton fixe en bas a gauche, persistant. */
try{(function(){var KEY='et-plight';
var PAGES=['/communiques','/communiques-en','/faq','/faq-en','/glossaire-petrolier','/glossaire-petrolier-en','/avertissements','/mentions-legales','/cookies','/accessibilite','/publications','/carnets','/carnets-en','/ethique','/ethique-en','/societe','/societe-en','/engagements','/engagements-en','/communautes','/cibles-2030','/investisseurs','/investisseurs-en','/projets','/projets-en','/clients','/clients-en','/amont','/amont/activites','/amont/eor','/amont/services-ep','/aval','/aval/distribution','/aval/produits','/aval/raffinage','/aval/reseau','/enerconseils','/enerconseils/atlas','/enerconseils/conseil','/tchaditude','/tchaditude/academie','/tchaditude/partenariats','/tchaditude/rayonnement','/tchaditude/services','/tchaditech','/tchaditech/innovations','/tchaditech/outils','/tchaditech/rd','/tchaditech/recits','/tchaditech/socle','/greentech','/greentech/hseq','/greentech/impact','/greentech/patrimoine','/greentech/transition','/impact','/intermediaire','/intermediaire/logistique','/intermediaire/services','/intermediaire/sites','/petrochimie','/petrochimie/chimie-eor','/petrochimie/produits','/activites-en','/brochure','/carrieres','/charte','/confidentialite-en','/confidentialite','/contact-en','/contact','/cookies-en','/distribution-en','/eor-en','/innovation','/mentions-legales-en','/plan-du-site','/pole-amont-en','/pole-aval-en','/pole-enerchimie-en','/pole-enerconseils-en','/pole-tchaditude-en','/pole-tchaditech-en','/pole-greentech-en','/pole-intermediaire-en','/produits-en','/publications-en','/raffinage-en','/reseau-en','/services-ep-en','/ar','/en','/','/index-en','/solutions','/solutions-en','/achats','/achats-en','/gouvernance','/boutique','/boutique-en','/amont/parc','/parc-en','/enerconseils/audits','/enerconseils/audits-en','/404','/Calculateur_Baril_Additionnel','/Configurateur_Service_Integre_v2','/explorateur-chaine','/explorateur-chaine-en'];
var p=location.pathname.replace(/\.html$/,'').replace(/\/index$/,'').replace(/\/$/,'')||'/';
if(PAGES.indexOf(p)<0)return;
function apply(on){document.documentElement.classList.toggle('et-plight',on)}
try{var _v=localStorage.getItem('et-jlight')||localStorage.getItem('et-plight');if(_v==='1'||(_v===null&&matchMedia('(prefers-color-scheme: light)').matches))apply(true)}catch(e){}
function init(){if(document.getElementById('plightBtn'))return;
var b=document.createElement('button');b.id='plightBtn';b.type='button';b.title='Basculer lecture claire / sombre';b.setAttribute('aria-label','Basculer lecture claire ou sombre');
b.setAttribute('aria-pressed',document.documentElement.classList.contains('et-plight')?'true':'false');b.textContent='☀';
b.addEventListener('click',function(){var on=!document.documentElement.classList.contains('et-plight');apply(on);b.setAttribute('aria-pressed',on?'true':'false');try{localStorage.setItem('et-jlight',on?'1':'0');localStorage.setItem('et-plight',on?'1':'0')}catch(e){}});
document.body.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})()}catch(e){}

;(function(){try{var s=document.createElement('style');s.id='etFootClear';s.textContent='@media(max-width:520px){footer .foot-legal{padding-bottom:76px}}@media print{#plightBtn,#toTop,#nezBar,#oilticker,#readbar,#ckn{display:none!important}}';(document.head||document.documentElement).appendChild(s)}catch(e){}})();

/* Carrousels mobiles (modernisation 31/07/2026) : acces clavier + libelle — sans quoi
   axe leve scrollable-region-focusable (serious) sur les grilles passees en defilement
   horizontal par la couche mobile de bundle_core_a1.css / suffixe de bundle_head_b2.css.
   Heberge ici (155 pages dont index.html) et non dans s_2ffe40dff9.js (index ne le charge pas). */
(function(){
if(!matchMedia('(max-width:760px)').matches)return;
var en=(document.documentElement.lang||'').indexOf('en')===0;
document.querySelectorAll('.plc-grid,.biz-grid,.sb-grid,.pof-grid,.ppt-grid,.ppj-grid,.hpgrid,.hxi-grid,.hnews-grid,.ce-grid,.ttg-g').forEach(function(g){
if(!g.hasAttribute('tabindex'))g.setAttribute('tabindex','0');
if(!g.getAttribute('role'))g.setAttribute('role','region');
if(!g.hasAttribute('aria-label'))g.setAttribute('aria-label',en?'Cards — scroll horizontally':'Cartes — faire defiler horizontalement');
});
})();

/* QA mobile (31/07/2026) : tout element reellement defilant en largeur a <=760px
   (tableaux, comparatifs, bandeaux) recoit tabindex/role/label s'il n'a ni tabindex
   ni descendant focalisable — sans quoi axe leve scrollable-region-focusable
   (serious) au viewport mobile uniquement. Deferre apres load (il faut la mise en page). */
(function(){
if(!matchMedia('(max-width:760px)').matches)return;
function go(){
  /* Optimise 01/08/2026 : l'ancien balayage 'main *' + getComputedStyle sur CHAQUE
     element coutait 280+ ms de tache longue sur l'accueil (TBT mobile). On restreint
     aux conteneurs plausibles, on lit scrollWidth AVANT le style calcule (rarement
     vrai -> le style n'est presque jamais calcule), et on tourne en idle. */
  var en=(document.documentElement.lang||'').indexOf('en')===0;
  var sel='main div,main table,main ul,main ol,main pre,main figure,main section,body>section div,body>section table,body>section ul,body>div section div,body>div section table';
  document.querySelectorAll(sel).forEach(function(el){
    if(el.scrollWidth<=el.clientWidth+10)return;
    if(el.hasAttribute('tabindex'))return;
    if(el.closest('#nav,#nezBar,#cmdk,#ckn,[aria-hidden="true"]'))return;
    var cs=getComputedStyle(el);
    if(cs.overflowX!=='auto'&&cs.overflowX!=='scroll')return;
    if(el.querySelector('a,button,input,select,textarea,[tabindex]'))return;
    el.setAttribute('tabindex','0');
    if(!el.getAttribute('role'))el.setAttribute('role','region');
    if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',en?'Scrollable content — scroll horizontally':'Contenu defilant — faire defiler horizontalement');
  });
}
function idle(){if(window.requestIdleCallback)requestIdleCallback(go,{timeout:2000});else setTimeout(go,600);}
if(document.readyState==='complete'){idle();}
else addEventListener('load',idle);
})();
