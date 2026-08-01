
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

/* Barre d'adresse de Safari accordee au theme reellement affiche.
   Le site declare un seul theme-color, #060B14 : en mode clair, iOS gardait
   donc une barre bleu nuit au-dessus d'une page ivoire. Une variante statique
   media="(prefers-color-scheme:light)" ne suffirait pas — le mode clair du site
   est un choix memorise, qui peut contredire la preference du systeme. On suit
   donc la classe reellement posee sur <html> (et-plight ou et-jlight). */
try{(function(){
  var SOMBRE=null, CLAIR='#FAF7F1';
  var m=document.querySelector('meta[name="theme-color"]');
  if(!m)return;
  SOMBRE=m.getAttribute('content')||'#060B14';
  function sync(){
    var c=document.documentElement.classList;
    var v=(c.contains('et-plight')||c.contains('et-jlight'))?CLAIR:SOMBRE;
    if(m.getAttribute('content')!==v)m.setAttribute('content',v);
  }
  sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
})()}catch(e){}

/* Hauteur reelle de la barre, tenue a jour.
   c_ac04328f0f47.js pose --nav-h au parse puis seulement au redimensionnement.
   Sur les gabarits ou la barre se replie sur deux lignes, elle grandit apres
   coup — au chargement de la police de marque — sans qu'aucun redimensionnement
   ne survienne : la variable restait a 72px pour une barre de 93px en tablette
   et de 132px en grand ecran. Le panneau de menu mobile et le mega-menu, qui
   se dimensionnent par calc(100dvh - var(--nav-h)), depassaient donc le bas de
   la fenetre de 21 a 60px. On observe la barre plutot que la fenetre. */
try{(function(){
  var n=document.getElementById('nav');
  if(!n)return;
  function pose(){
    var h=Math.round(n.getBoundingClientRect().height);
    if(h>0&&document.documentElement.style.getPropertyValue('--nav-h')!==h+'px')
      document.documentElement.style.setProperty('--nav-h',h+'px');
  }
  pose();
  if(window.ResizeObserver)new ResizeObserver(pose).observe(n);
  else window.addEventListener('resize',pose);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(pose);
  window.addEventListener('load',pose);
})()}catch(e){}


/* ---------------------------------------------------------------------------
   MOBILIER FLOTTANT EN BAS DE PAGE — 01/08/2026
   Mesure d'occlusion reelle (elementsFromPoint, 10 pages, 1280px et 390px,
   defilement jusqu'en bas) : trois defauts.

   1. #scrollcue — le bouton « Suite v » invite a descendre, mais restait
      affiche une fois arrive tout en bas, ou il n'y a plus rien a montrer, et
      recouvrait « Accessibilite » / « Plan du site » dans le pied (societe,
      investisseurs, contact, journal, glossaire). La regle .scrollcue.hide
      existait deja dans la feuille : AUCUN script ne l'ajoutait jamais.
   2. #scrollcue n'avait aucun gestionnaire de clic. Un <button> annonce
      « Voir la suite plus bas » qui ne fait rien au clic est un piege pour le
      clavier autant que pour la souris.
   3. #secrail — le sommaire lateral chevauchait le lien « Engagements » du
      pied sur /boutique. Un sommaire de page n'a rien a faire au-dessus du
      pied ; il s'efface quand celui-ci entre dans le champ.
   4. #plightBtn recouvrait « FAQ ». Le degagement du pied existait deja sous
      520px (etFootClear) ; il manquait au-dessus.
   --------------------------------------------------------------------------- */
;(function(){try{
  var s=document.createElement('style');s.id='etFloatClear';
  s.textContent=
    '#secrail,#aurail{pointer-events:none}'+
    '#secrail a,#aurail a{pointer-events:auto}'+
    '#secrail.pied-off,#aurail.pied-off{opacity:0!important;pointer-events:none!important;'+
      'transform:translateX(14px)!important}'+
    '#secrail,#aurail{transition:opacity .28s ease,transform .28s ease}'+
    '@media(min-width:521px){footer .foot-legal{padding-bottom:64px}}'+
    '@media(prefers-reduced-motion:reduce){#secrail,#aurail{transition:none}}';
  (document.head||document.documentElement).appendChild(s);

  var tick=false;
  function upd(){
    tick=false;
    var d=document.documentElement;
    var y=window.scrollY||d.scrollTop||0;
    var vh=window.innerHeight||d.clientHeight;
    var reste=d.scrollHeight-y-vh;          // ce qu'il reste a derouler
    var f=document.querySelector('footer');
    var pied=f?f.getBoundingClientRect().top:1e9;

    var cue=document.getElementById('scrollcue');
    if(cue){
      // on masque des qu'il n'y a plus rien dessous, des que le pied est
      // entame, ou si la page n'est pas defilante du tout.
      var off=(reste<=120)||(pied<vh-40)||((d.scrollHeight-vh)<80);
      cue.classList.toggle('hide',off);
      cue.setAttribute('aria-hidden',off?'true':'false');
      cue.tabIndex=off?-1:0;
    }
    var rail=document.getElementById('secrail')||document.getElementById('aurail');
    if(rail)rail.classList.toggle('pied-off',pied<vh*0.62);
  }
  function onS(){if(!tick){tick=true;requestAnimationFrame(upd);}}

  function arme(){
    var cue=document.getElementById('scrollcue');
    if(cue&&!cue.getAttribute('data-et-cue')){
      cue.setAttribute('data-et-cue','1');
      cue.addEventListener('click',function(){
        var red=false;
        try{red=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
        var pas=Math.round((window.innerHeight||600)*0.85);
        if(window.scrollBy)window.scrollBy({top:pas,left:0,behavior:red?'auto':'smooth'});
        else window.scrollTo(0,(window.scrollY||0)+pas);
      });
    }
    upd();
  }

  addEventListener('scroll',onS,{passive:true});
  addEventListener('resize',onS,{passive:true});
  addEventListener('load',function(){setTimeout(arme,60)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',arme);
  else arme();
}catch(e){}})();
