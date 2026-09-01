
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
var PAGES=['/communiques','/communiques-en','/faq','/faq-en','/glossaire-petrolier','/glossaire-petrolier-en','/avertissements','/mentions-legales','/cookies','/accessibilite','/publications','/carnets','/carnets-en','/ethique','/ethique-en','/societe','/societe-en','/engagements','/engagements-en','/communautes','/cibles-2030','/investisseurs','/investisseurs-en','/projets','/projets-en','/clients','/clients-en','/amont','/amont/activites','/amont/eor','/amont/services-ep','/aval','/aval/distribution','/aval/produits','/aval/raffinage','/aval/reseau','/enerconseils','/enerconseils/atlas','/enerconseils/conseil','/tchaditude','/tchaditude/academie','/tchaditude/partenariats','/tchaditude/rayonnement','/tchaditude/services','/tchaditech','/tchaditech/innovations','/tchaditech/outils','/tchaditech/rd','/tchaditech/recits','/tchaditech/socle','/greentech','/greentech/hseq','/greentech/impact','/greentech/patrimoine','/greentech/transition','/impact','/intermediaire','/intermediaire/logistique','/intermediaire/services','/intermediaire/sites','/petrochimie','/petrochimie/chimie-eor','/petrochimie/produits','/amont/activites-en','/brochure','/carrieres','/charte','/confidentialite-en','/confidentialite','/contact-en','/contact','/cookies-en','/aval/distribution-en','/amont/eor-en','/innovation','/mentions-legales-en','/plan-du-site','/pole-amont-en','/pole-aval-en','/pole-enerchimie-en','/pole-enerconseils-en','/pole-tchaditude-en','/pole-tchaditech-en','/pole-greentech-en','/pole-intermediaire-en','/aval/produits-en','/publications-en','/aval/raffinage-en','/aval/reseau-en','/amont/services-ep-en','/ar','/en','/','/index-en','/solutions','/solutions-en','/achats','/achats-en','/gouvernance','/boutique','/boutique-en','/amont/parc','/amont/parc-en','/enerconseils/audits','/enerconseils/audits-en','/404','/calculateur-baril-additionnel','/configurateur-service-integre','/explorateur-chaine','/explorateur-chaine-en'];
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
if(!g.hasAttribute('aria-label')){var _b=en?'Cards — scroll horizontally':'Cartes — faire defiler horizontalement';window.__etRegL=window.__etRegL||{};var _n=(window.__etRegL[_b]=(window.__etRegL[_b]||0)+1);g.setAttribute('aria-label',_n>1?_b+' ('+_n+')':_b);}
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
    if(!el.hasAttribute('aria-label')){var _b2=en?'Scrollable content — scroll horizontally':'Contenu defilant — faire defiler horizontalement';window.__etRegL=window.__etRegL||{};var _n2=(window.__etRegL[_b2]=(window.__etRegL[_b2]||0)+1);el.setAttribute('aria-label',_n2>1?_b2+' ('+_n2+')':_b2);}
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

/* Ch169 : compteurs KPI — les chiffres se comptent a l'apparition. */
try{(function etcCount(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var els=[].slice.call(document.querySelectorAll('.tri-kpi b,.pgh-kpi b,.ppj-kpi,.atc-stat b,.ilede-stat b,.cb-num'));
var re=/^(\s*)([0-9]{1,3}(?:[\u00A0\u202F ][0-9]{3})+|[0-9]+(?:[.,][0-9]+)?)/;
els.forEach(function(el){
 if(el.childElementCount>0)return;
 var t=el.textContent,m=re.exec(t);if(!m)return;
 var raw=m[2],suf=t.slice(m[0].length);
 var num=parseFloat(raw.replace(/[\u00A0\u202F ]/g,'').replace(',','.'));
 if(!isFinite(num)||num<=0||num>1e7)return;
 var dec=(raw.match(/[.,]([0-9]+)/)||[0,''])[1].length;
 var sepm=raw.match(/[\u00A0\u202F ]/),sep=sepm?sepm[0]:'';
 var comma=raw.indexOf(',')>=0;
 var io=new IntersectionObserver(function(en){en.forEach(function(e){
  if(!e.isIntersecting)return;io.unobserve(el);
  var t0=performance.now(),D=900;
  function fmt(v){var s=v.toFixed(dec);if(comma)s=s.replace('.',',');
   if(sep){var pi=s.search(/[.,]/);if(pi<0)pi=s.length;var ent=s.slice(0,pi).replace(/\B(?=(\d{3})+(?!\d))/g,sep);s=ent+s.slice(pi);}
   return s;}
  function step(now){var k=Math.min(1,(now-t0)/D);k=1-Math.pow(1-k,3);
   el.textContent=m[1]+fmt(num*k)+suf;
   if(k<1)requestAnimationFrame(step);else el.textContent=t;}
  requestAnimationFrame(step);
 })},{threshold:.6});
 io.observe(el);
});
})()}catch(e){}

/* Ch231 : le controle de luminosite (#lum-ctl, markup present sur les 207 pages)
   n'avait AUCUN gestionnaire — bouton, curseur et preregles morts depuis leur pose.
   Implementation par le voile #lum-veil prevu a cet effet (jamais de filter sur
   html : il ferait defiler les elements fixed avec la page). */
try{(function(){
var btn=document.getElementById('lum-btn'),panel=document.getElementById('lum-panel'),
    rng=document.getElementById('lum-range'),veil=document.getElementById('lum-veil');
if(!btn||!panel)return;
if(veil)veil.style.opacity='0'; /* opacite par defaut = 1 (fond transparent) : sans cette mise a zero, la premiere application animerait 1 vers cible = eclair noir */
function apply(v,save){
  v=Math.max(80,Math.min(130,Math.round(v)));
  if(rng)rng.value=v;
  if(veil){
    if(v===100){veil.style.opacity='0';}
    else if(v<100){veil.style.background='#000';veil.style.opacity=String(((100-v)/20*0.42).toFixed(3));}
    else{veil.style.background='#fff';veil.style.opacity=String(((v-100)/30*0.28).toFixed(3));}
    veil.style.transition='opacity .25s ease';
  }
  panel.querySelectorAll('button[data-l]').forEach(function(b){
    b.setAttribute('aria-pressed',(+b.dataset.l===v)?'true':'false');});
  if(save!==false){try{localStorage.setItem('et-lum',String(v))}catch(e){}}
}
function toggle(open){
  if(open===undefined)open=panel.hidden;
  panel.hidden=!open;
  btn.setAttribute('aria-expanded',open?'true':'false');
  if(open&&rng)try{rng.focus({preventScroll:true})}catch(e){}
}
btn.addEventListener('click',function(){toggle();});
if(rng)rng.addEventListener('input',function(){apply(+rng.value);});
panel.querySelectorAll('button[data-l]').forEach(function(b){
  b.addEventListener('click',function(){apply(+b.dataset.l);});});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&!panel.hidden){toggle(false);try{btn.focus({preventScroll:true})}catch(_){}}});
document.addEventListener('click',function(e){
  if(!panel.hidden&&!(e.target.closest&&e.target.closest('#lum-ctl')))toggle(false);});
try{var s=localStorage.getItem('et-lum');if(s!==null&&+s!==100)apply(+s,false);}catch(e){}
})()}catch(e){}

/* Ch231c : barre d'application mobile (#nezBar) - etat actif inter-pages.
   L'IntersectionObserver existant ne marque que les liens d'ancre (#...) : sur toute
   page interieure, aucun des 5 onglets n'indiquait la position courante. Ici on marque
   le lien dont le chemin correspond a la page (aria-current="page" + .nz-on). */
try{(function(){
var bar=document.getElementById('nezBar');if(!bar)return;
if(bar.querySelector('a.nz-on'))return;
function norm(p){p=(p||'').replace(/\/index(-en)?(\.html)?$/,'/').replace(/\.html$/,'');if(p.length>1)p=p.replace(/\/$/,'');return p||'/';}
var here=norm(location.pathname);
var hit=null;
[].slice.call(bar.querySelectorAll('a[href]')).forEach(function(a){
  if(hit)return;var h=a.getAttribute('href');if(!h||h.charAt(0)==='#')return;
  var u;try{u=new URL(h,location.href)}catch(e){return}
  if(u.origin!==location.origin)return;
  if(norm(u.pathname)===here)hit=a;});
if(!hit){
  /* page pointee par un lien d'ancre du meme document (ex. Services sur /amont/services-ep) :
     l'IO ne marquera l'onglet qu'a l'intersection de la section — on pose l'etat initial ici */
  [].slice.call(bar.querySelectorAll('a[href^="#"]')).some(function(a){
    var id=a.getAttribute('href').slice(1);
    if(id&&document.getElementById(id)){hit=a;return true}
    return false});
}
if(hit){hit.classList.add('nz-on');hit.setAttribute('aria-current','page');}
})()}catch(e){}

/* Ch236 : avis cookies universel. Le bandeau n'existait en dur que sur 40 pages sur 159 :
   un visiteur arrivant par une recherche ou un lien partage sur une page interieure ne le
   voyait jamais. Ce bloc le construit quand il manque, dans la langue de la page, avec des
   styles en ligne pour ne dependre d'aucune feuille (les 119 pages concernees ne chargent
   pas toutes celle du bandeau d'origine). Il ne fait rien si le bandeau est deja present. */
try{(function(){
if(document.getElementById('ckn'))return;
try{if(localStorage.getItem('ckok')||localStorage.getItem('et-ck'))return}catch(e){}
var L=(document.documentElement.lang||'fr').slice(0,2).toLowerCase();
var T={fr:{t:'Cookies essentiels.',d:'Stockage local de vos préférences d’affichage uniquement — pas de suivi, pas de tiers.',p:'Politique cookies',b:'J’ai compris',u:'/cookies',a:'Avis cookies'},
       en:{t:'Essential cookies.',d:'Local storage of your display preferences only — no tracking, no third parties.',p:'Cookie policy',b:'Got it',u:'/cookies-en',a:'Cookie notice'},
       ar:{t:'ملفات تعريف أساسية.',d:'تخزين محلي لتفضيلات العرض فقط — دون تتبع أو أطراف ثالثة.',p:'سياسة ملفات التعريف',b:'فهمت',u:'/cookies',a:'إشعار ملفات التعريف'}};
var t=T[L]||T.fr;
function boot(){
 if(document.getElementById('ckn'))return;
 var n=document.createElement('div');
 n.id='ckn'; n.className='show'; n.setAttribute('role','dialog'); n.setAttribute('aria-label',t.a);
 var S={position:'fixed',left:'0',right:'0',bottom:'0',top:'auto',width:'100%','max-width':'none','z-index':'2147483400',
   display:'flex','align-items':'center',gap:'16px','flex-wrap':'wrap',padding:'10px 22px',
   background:'#0B1422',color:'rgba(245,247,250,.92)','font-size':'.8rem',
   'border-top':'1px solid rgba(232,195,106,.34)','box-shadow':'0 -8px 30px rgba(0,0,0,.42)',
   'border-radius':'0','font-family':'var(--fs,system-ui,sans-serif)'};
 for(var k in S)n.style.setProperty(k,S[k],'important');n.style.setProperty('line-height','1.45');
 var b=document.createElement('b'); b.textContent=t.t; b.style.setProperty('color','#F0CE82','important');
 var sp=document.createElement('span'); sp.textContent=' '+t.d;
 var row=document.createElement('div'); row.className='ck-row';
 row.style.cssText='margin-inline-start:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap';
 var a=document.createElement('a'); a.href=t.u; a.textContent=t.p;
 a.style.cssText='color:#F0CE82;text-decoration:underline;text-underline-offset:.18em;padding:10px 8px;display:inline-block;min-height:44px;display:inline-flex;align-items:center';
 var btn=document.createElement('button'); btn.type='button'; btn.textContent=t.b;
 btn.style.cssText='min-height:44px;padding:9px 18px;border-radius:999px;border:1px solid rgba(232,195,106,.55);background:rgba(232,195,106,.14);color:#F0CE82;font:600 .8rem/1 var(--fs,system-ui,sans-serif);cursor:pointer';
 btn.addEventListener('click',function(){try{localStorage.setItem('ckok',1);localStorage.setItem('et-ck','1')}catch(e){}n.remove();});
 row.appendChild(a); row.appendChild(btn);
 n.appendChild(b); n.appendChild(sp); n.appendChild(row);
 document.body.appendChild(n);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,1200)});
else setTimeout(boot,1200);
})()}catch(e){}

;/* Ch257 : le bouton toTop etait mort sur 117 pages — le balisage y est mais seul
   u2_75a2c4383ddf.js (90 pages) l'animait. Bloc repris ici avec garde d'idempotence
   (les 90 pages saines chargent les deux scripts). */
try{(function(){var b=document.getElementById('toTop');if(!b||b.dataset.ttInit)return;b.dataset.ttInit='1';var p=b.querySelector('.ttp'),C=2*Math.PI*24;if(p){p.style.strokeDasharray=C;p.style.strokeDashoffset=C;}var r=matchMedia('(prefers-reduced-motion:reduce)').matches,t=false;function u(){var s=scrollY||document.documentElement.scrollTop,hh=document.documentElement.scrollHeight-innerHeight,pr=hh>0?Math.min(s/hh,1):0;if(p)p.style.strokeDashoffset=C*(1-pr);b.classList.toggle('show',s>600);t=false;}addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(u);}},{passive:true});b.addEventListener('click',function(){scrollTo({top:0,behavior:r?'auto':'smooth'});});u();})();}catch(_e){}
