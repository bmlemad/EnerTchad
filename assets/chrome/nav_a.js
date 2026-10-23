/* EnerTchad — Navigation « Direction A » : ouverture des méga-menus
   au clic/clavier sur desktop (tactile compris). Le mobile (accordéon,
   tiroir, verrou de défilement) reste géré par le chrome commun. */
try{(function(){
  var mq=window.matchMedia('(min-width:1241px)');
  var links=document.getElementById('navLinks');if(!links)return;
  /*  : le gestionnaire de focus (plus bas) pose sur le panneau des styles
     en ligne !important ; les retirer fait partie de la fermeture, sinon le
     panneau reste peint alors que la classe .open a disparu. */
  var PROPS=['visibility','opacity','pointer-events','transform'];
  function nu(item){var m=item&&item.querySelector('.nx-mega');
    if(m)PROPS.forEach(function(k){m.style.removeProperty(k)});}
  function closeAll(except){
    /* 11 oct. 2026 : on parcourt toutes les rubriques, pas seulement .open.
       Sur certaines pages (carnets, pôles aval, crédits), un autre script pose
       aussi les styles en ligne !important sans la classe .open : Échap
       remettait aria-expanded à false mais le panneau restait peint. */
    links.querySelectorAll('.nav-item').forEach(function(i){
      if(i===except)return;
      if(i.classList.contains('open')){
        i.classList.remove('open');
        var b=i.querySelector('.nav-trigger');if(b)b.setAttribute('aria-expanded','false');
      }
      nu(i);
    });
  }
  links.querySelectorAll('.nav-item>.nav-trigger').forEach(function(btn){
    var item=btn.closest('.nav-item');
    btn.addEventListener('click',function(){
      if(!mq.matches)return; /* mobile : accordéon du chrome commun */
      var was=item.classList.contains('open');
      item.classList.remove('kbesc');
      closeAll(item);
      item.classList.toggle('open',!was);
      btn.setAttribute('aria-expanded',String(!was));
      /*  : un declencheur de divulgation doit refermer au second appui.
         Le clic donne le focus au bouton : le gestionnaire focusin vient de
         poser visibility/opacity en ligne !important, et :focus-within garde
         le panneau ouvert. On retire donc les styles en ligne et on pose
         .kbesc (deja utilisee par Echap) qui neutralise :hover et
         :focus-within jusqu'a ce que le focus ou la souris quitte l'element. */
      var m=item.querySelector('.nx-mega');
      if(was){
        nu(item);
        item.classList.add('kbesc');
        var clear=function(e){
          /*  : un focusout qui reste dans l'element (le panneau rend la main
             au declencheur) n'est pas une sortie : il ne doit pas lever .kbesc. */
          if(e&&e.type==='focusout'&&item.contains(e.relatedTarget))return;
          item.classList.remove('kbesc');
          item.removeEventListener('focusout',clear);
          item.removeEventListener('mouseenter',clear);};
        item.addEventListener('focusout',clear);
        item.addEventListener('mouseenter',clear);  /* re-entree seulement : sortir
           la souris ne doit pas rouvrir le panneau, le declencheur garde le focus */
      }else if(m){
        m.style.setProperty('visibility','visible','important');
        m.style.setProperty('opacity','1','important');
        m.style.setProperty('pointer-events','auto','important');
      }
    });
    /* synchronise aria-expanded avec l'ouverture au survol (desktop) */
    item.addEventListener('mouseenter',function(){if(mq.matches&&!item.classList.contains('kbesc'))btn.setAttribute('aria-expanded','true');});
    item.addEventListener('mouseleave',function(){if(mq.matches&&!item.classList.contains('open')&&!item.matches(':focus-within'))btn.setAttribute('aria-expanded','false');});
    /* Lot 20 : le focus seul n'ouvre plus le panneau (motif « disclosure ») ;
       aria-expanded ne change qu'au clic, a Entree/Espace, a la fleche bas ou a Echap. */
    /* 11 oct. 2026 : quand le focus quitte la rubrique (Tab après le dernier
       lien), on referme le panneau ouvert au clic ; sinon il restait ouvert
       sous le panneau suivant, ouvert par :focus-within. */
    item.addEventListener('focusout',function(e){
      if(!mq.matches)return;
      var to=e.relatedTarget;
      if(!to||item.contains(to))return;
      item.classList.remove('open');nu(item);
      if(!item.matches(':hover'))btn.setAttribute('aria-expanded','false');
    });
  });
  document.addEventListener('click',function(e){
    if(mq.matches&&!e.target.closest('.nav-item'))closeAll(null);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&mq.matches){
      closeAll(null);
      /* referme le panneau mais rend le focus au declencheur (a11y) ;
         .kbesc neutralise :focus-within le temps que le focus reparte */
      var it=document.activeElement&&document.activeElement.closest('.nav-item');
      if(it){
        var b=it.querySelector('.nav-trigger');
        it.classList.add('kbesc');
        if(b){b.setAttribute('aria-expanded','false');b.focus({preventScroll:true});}
        var clear=function(e){
          if(e&&e.type==='focusout'&&it.contains(e.relatedTarget))return;   /*  */
          it.classList.remove('kbesc');it.removeEventListener('focusout',clear);it.removeEventListener('mouseenter',clear);};
        it.addEventListener('focusout',clear);
        it.addEventListener('mouseenter',clear);
      }
    }
  });
})();}catch(_e){}

/* Bascule linguistique directe : utilise l'equivalent hreflang de la page
   courante. Ainsi FR -> EN et EN -> FR restent sur le meme contenu au lieu
   de retomber sur un portail generique. */
try{(function(){
  var lang=(document.documentElement.getAttribute('lang')||'').slice(0,2);
  var target=lang==='fr'?'en':(lang==='en'?'fr':'');
  if(!target)return;
  var alt=document.querySelector('link[rel="alternate"][hreflang="'+target+'"]');if(!alt)return;
  var href=alt.getAttribute('href');if(!href)return;
  href=href.replace(/^https?:\/\/[^\/]+/,'')||'/';
  document.querySelectorAll('a.nx-lang').forEach(function(a){a.href=href;});
})()}catch(e){}

/* Orientation : surligner la page courante dans les megamenus.
   Compare le pathname aux href des liens .nx-mega ; pose aria-current="page"
   (stylé en CSS). Si aucun onglet n'est actif, allume aussi le déclencheur parent. */
try{(function(){
  var norm=function(u){u=(u||'').replace(/^https?:\/\/[^\/]+/,'').split('#')[0].split('?')[0];
    u=u.replace(/index\.html$/,'').replace(/\.html$/,'');
    if(u.length>1)u=u.replace(/\/$/,'');return u||'/';};
  var here=norm(location.pathname);if(here==='/')return;
  var hit=null;
  document.querySelectorAll('.nx-mega a[href]').forEach(function(a){
    if(norm(a.getAttribute('href'))===here){a.setAttribute('aria-current','page');hit=a;}
  });
  if(!hit)return;
  if(!document.querySelector('.nav-trigger.is-active')){
    var mega=hit.closest('.nx-mega');
    if(mega&&mega.id){
      var t=document.querySelector('.nav-trigger[aria-controls="'+mega.id+'"]');
      if(t){t.classList.add('is-active');t.setAttribute('aria-current','page');}
    }
  }
})()}catch(e){}

/* Nav au scroll : repli universel (certaines pages ne chargent pas le script nav historique).
   Idempotent avec le gestionnaire existant. */
try{(function(){var nav=document.getElementById('nav')||document.querySelector('.nav.nx');if(!nav)return;
var f=function(){nav.classList.toggle('scrolled',(window.scrollY||window.pageYOffset||0)>20)};
addEventListener('scroll',f,{passive:true});f();})()}catch(e){}

;(function(){/* a11y: keyboard-operable mega-menu (desktop) + truthful aria-expanded */var mq=window.matchMedia("(max-width:1240px)");var items=[].slice.call(document.querySelectorAll(".nav-item.nx-item"));function setAria(it,v){var b=it.querySelector(".nav-trigger");if(b)b.setAttribute("aria-expanded",v?"true":"false");}function reveal(it,on){var m=it.querySelector(".nx-mega");if(!m)return;if(on){m.style.setProperty("visibility","visible","important");m.style.setProperty("opacity","1","important");m.style.setProperty("pointer-events","auto","important");m.style.setProperty("transform","translateY(0) scale(1)","important");}else{m.style.removeProperty("visibility");m.style.removeProperty("opacity");m.style.removeProperty("pointer-events");m.style.removeProperty("transform");}}function ariaFromVis(it){if(mq.matches)return;var m=it.querySelector(".nx-mega");if(!m)return;var cs=getComputedStyle(m);setAria(it,cs.visibility!=="hidden"&&parseFloat(cs.opacity)>0.5&&cs.display!=="none");}function closeOthers(except){items.forEach(function(it){if(it!==except){reveal(it,false);if(!it.matches(":hover"))setAria(it,false);}});}items.forEach(function(item){var btn=item.querySelector(".nav-trigger");if(!btn)return;var mega=item.querySelector(".nx-mega");item.addEventListener("focusin",function(){if(mq.matches)return;closeOthers(item);});item.addEventListener("focusout",function(){if(mq.matches)return;setTimeout(function(){if(!item.contains(document.activeElement)){reveal(item,false);ariaFromVis(item);}},10);});["mouseenter","mouseleave"].forEach(function(ev){item.addEventListener(ev,function(){setTimeout(function(){ariaFromVis(item);},20);setTimeout(function(){ariaFromVis(item);},340);});});if(mega)mega.addEventListener("transitionend",function(){ariaFromVis(item);});});document.addEventListener("keydown",function(e){if(e.key!=="Escape"||mq.matches)return;items.forEach(function(item){if(item.contains(document.activeElement)){reveal(item,false);setAria(item,false);item.classList.add("kbesc");/*  : le focusin declenche par le retour du focus au declencheur venait de retirer .kbesc ; sans elle, :focus-within rouvrait le panneau alors que aria-expanded disait false */var b=item.querySelector(".nav-trigger");if(b)b.focus();}});});})();
/* EnerTchad — Cale d'ancre. La feuille posait scroll-padding-top:116px, une
   constante qui ne correspond a aucun gabarit reel : la barre principale
   mesure 77, 93 ou 132 px selon la largeur, et les sous-nav collantes
   (corp-nav, nav.toc, #inv-toc, #cw-tabs) empilent 40 a 70 px de plus. Un
   titre vise par une ancre finissait donc sous les barres. On mesure la pile
   effective et on ecrit --et-anc sur la racine ; la feuille s'en sert et
   garde une valeur de repli par palier pour les pages sans ce script.
   Position collee = valeur de `top` calculee + hauteur : inutile de defiler
   pour la connaitre. Chiffres et protocole dans MAINTENANCE 18. */
try{(function(){
  var re=document.documentElement,dernier=-1,tid=0;
  function pile(){
    var vh=window.innerHeight||800,vw=window.innerWidth||360,bas=0;
    var n=document.querySelectorAll('header,nav,div,section,aside'),i,e,c,h,t,r,cv=null;
    for(i=0;i<n.length;i++){
      e=n[i];
      /* Sous un conteneur content-visibility:auto, seuls nav et header sont
         examines : lire le style d un bloc quelconque de ce sous-arbre force
         le rendu du contenu hors ecran que content-visibility economise. */
      if(cv&&cv.contains(e)){if(e.tagName!=='NAV'&&e.tagName!=='HEADER')continue;}else cv=null;
      c=getComputedStyle(e);
      if(!cv&&c.contentVisibility==='auto')cv=e;
      if(c.position!=='fixed'&&c.position!=='sticky')continue;
      if(c.display==='none'||c.visibility==='hidden'||+c.opacity===0)continue;
      if(c.pointerEvents==='none')continue;
      r=e.getBoundingClientRect();
      if(r.width<vw*0.6)continue;              /* pas une barre pleine largeur */
      h=r.height;if(h<12||h>vh*0.45)continue;  /* ni filet ni voile plein ecran */
      t=c.position==='fixed'?r.top:parseFloat(c.top);
      if(!isFinite(t)||t<-4||t>vh*0.4)continue;/* ne se colle pas en haut */
      if(t+h>bas)bas=t+h;
    }
    return Math.round(bas);
  }
  function pose(){
    var v=pile();if(v<=0||v===dernier)return;dernier=v;
    re.style.setProperty('--et-anc',(v+18)+'px');   /* 18 px d'air sous la barre */
  }
  function differe(){clearTimeout(tid);tid=setTimeout(pose,120);}
  pose();
  addEventListener('load',pose);
  addEventListener('resize',differe,{passive:true});
  addEventListener('orientationchange',differe,{passive:true});
  if(window.ResizeObserver){var ro=new ResizeObserver(differe);
    var b=document.querySelector('#nav,header');if(b)ro.observe(b);}
  setTimeout(pose,600);setTimeout(pose,1800);
})();}catch(e){}
/*  - a l impression, deplier les <details> replies puis les refermer.
   Complement au correctif CSS de nav_a.css pour les moteurs sans
   ::details-content. Idempotent, silencieux, sans effet a l ecran. */
try{(function(){var o=[];
 addEventListener('beforeprint',function(){try{o=[];
   Array.prototype.forEach.call(document.querySelectorAll('details:not([open])'),function(d){o.push(d);d.open=true});
 }catch(e){}});
 addEventListener('afterprint',function(){try{o.forEach(function(d){d.open=false});o=[];}catch(e){}});
})();}catch(e){}
/* Etat de l interface recopie sur <body data-etui> : menu mobile ouvert
   (#navLinks.open) et avis cookies affiche (#ckn.show, statique ou insere
   plus tard par script). Remplace des selecteurs body:has(...) qui faisaient
   recalculer le style de toute la page a chaque insertion ou changement de
   classe dans le document. */
try{(function(){
 var b=document.body;if(!b||!window.MutationObserver)return;
 var n=document.getElementById('navLinks'),k=null;
 var mo=new MutationObserver(sync);
 if(n)mo.observe(n,{attributes:true,attributeFilter:['class']});
 function sync(){
  var c=document.getElementById('ckn');
  if(c&&c!==k){k=c;mo.observe(k,{attributes:true,attributeFilter:['class']});}
  var t=[];
  if(n&&n.classList.contains('open'))t.push('navopen');
  if(c&&c.classList.contains('show'))t.push('cknshow');
  var v=t.join(' ');
  if((b.getAttribute('data-etui')||'')!==v){if(v)b.setAttribute('data-etui',v);else b.removeAttribute('data-etui');}
 }
 new MutationObserver(sync).observe(b,{childList:true});
 sync();
})();}catch(e){}


/* Strategic shortcut: 90-second institutional overview. */
try{(function(){
  var u=document.querySelector('.nx-util-in');if(!u)return;
  if(u.querySelector('[data-et-short="essentiel"],a[href="/essentiel"],a[href="/essentiel-en"]'))return;
  var lang=(document.documentElement.getAttribute('lang')||'fr').slice(0,2);
  var a=document.createElement('a');
  a.setAttribute('data-et-short','essentiel');
  if(lang==='en'){a.href='/essentiel-en';a.textContent='90 seconds';a.setAttribute('aria-label','EnerTchad in 90 seconds');}
  else if(lang==='ar'){a.href='/ar';a.textContent='لمحة';a.setAttribute('aria-label','لمحة عن EnerTchad');}
  else{a.href='/essentiel';a.textContent='90 secondes';a.setAttribute('aria-label','EnerTchad en 90 secondes');}
  /* Même place que dans les pages qui l'écrivent en dur : après Clients et Fournisseurs (audit m14). */
  var links=u.querySelectorAll('a');u.insertBefore(a,links[2]||null);
})()}catch(e){}

/* Pied de page : rubriques repliables sur mobile (boutons), toujours ouvertes sur ordinateur. */
try{(function(){
 function go(){
  var f=document.querySelector('footer.pft');if(!f||f.classList.contains('pft-acc'))return;
  var cols=f.querySelectorAll('.foot-col');if(!cols.length)return;
  var mq=window.matchMedia?matchMedia('(max-width:900px)'):null,items=[];
  [].forEach.call(cols,function(c,i){
   var h=c.querySelector('h3');if(!h)return;
   var p=document.createElement('div');p.className='pft-acc-panel';p.id='pft-acc-'+i;
   [].slice.call(c.children).forEach(function(x){if(x!==h)p.appendChild(x)});
   c.appendChild(p);
   var b=document.createElement('button');b.type='button';b.className='pft-acc-btn';b.setAttribute('aria-controls',p.id);
   b.innerHTML='<span></span><i aria-hidden="true"></i>';b.firstChild.textContent=h.textContent;
   h.textContent='';h.appendChild(b);
   b.addEventListener('click',function(){if(!mq||!mq.matches)return;var o=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',o?'true':'false');p.hidden=!o});
   items.push([b,p]);
  });
  function sync(){var m=mq&&mq.matches;items.forEach(function(x){x[0].setAttribute('aria-expanded',m?'false':'true');x[1].hidden=!!m;if(m)x[0].removeAttribute('tabindex');else x[0].setAttribute('tabindex','-1')})}
  sync();if(mq){if(mq.addEventListener)mq.addEventListener('change',sync);else if(mq.addListener)mq.addListener(sync)}
  f.classList.add('pft-acc');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})()}catch(e){}

/* Optional audience measurement loads locally; Google waits for consent. */
(function(){var s=document.createElement("script");s.src="/assets/chrome/audience-consent.js?v=20261008";s.defer=true;document.head.appendChild(s)})();

/* 15 oct. 2026 : intention de survol du mega menu (ordinateur, souris).
   Sans ce délai, aller en diagonale de l'intitulé vers les liens fait passer la souris sur l'intitulé
   voisin et ouvre son menu. Quand un menu est déjà ouvert, le voisin ne s'ouvre qu'après 160 ms de pause
   sur son intitulé ; le menu quitté reste affiché 280 ms. Premier menu ouvert sans délai ; clavier,
   tactile et mobile inchangés. Styles posés en ligne (CSSOM), retirés dès que l'état est réglé. */
;(function(){try{
 var nav=document.getElementById('nav');if(!nav||!nav.classList.contains('nx'))return;
 var mq=window.matchMedia('(min-width:1241px) and (hover:hover)');
 var items=[].slice.call(nav.querySelectorAll('.nav-links > .nav-item'));if(!items.length)return;
 var cur=null,tOpen=0,tClose=0,OPEN=160,CLOSE=280;
 function mega(it){return it.querySelector('.nx-mega')}
 function show(it){var m=mega(it);if(m){m.style.visibility='visible';m.style.opacity='1';m.style.transform='translateY(0)'}}
 function hide(it){var m=mega(it);if(m){m.style.visibility='hidden';m.style.opacity='0';m.style.pointerEvents='none';m.style.transition='none'}}
 function reset(it){var m=mega(it);if(m){['visibility','opacity','transform','pointer-events','transition'].forEach(function(k){m.style.removeProperty(k)})}}
 function aria(it,v){var b=it.querySelector('.nav-trigger');if(b&&!it.classList.contains('open')&&!it.matches(':focus-within'))b.setAttribute('aria-expanded',v?'true':'false')}
 function activate(it){if(cur&&cur!==it){reset(cur);aria(cur,false)}cur=it;reset(it);aria(it,true)}
 items.forEach(function(it){
  it.addEventListener('mouseenter',function(){if(!mq.matches)return;clearTimeout(tClose);clearTimeout(tOpen);
   if(cur===it){reset(it);return}
   if(!cur||!cur.matches(':hover')&&!cur.querySelector('.nx-mega[style*="visible"]')){activate(it);return}
   hide(it);show(cur);aria(it,false);
   tOpen=setTimeout(function(){if(it.matches(':hover'))activate(it);else reset(it)},OPEN)});
  it.addEventListener('mouseleave',function(){if(!mq.matches)return;
   if(cur===it){show(it);clearTimeout(tClose);tClose=setTimeout(function(){if(!it.matches(':hover')){reset(it);aria(it,false);if(cur===it)cur=null}},CLOSE)}
   else reset(it)});
  it.addEventListener('focusin',function(){reset(it)});
 });
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&cur){clearTimeout(tClose);clearTimeout(tOpen);items.forEach(reset);cur=null}});
}catch(e){}})();

/* Menu mobile ouvert : la tabulation reste dans la navigation (piège du focus).
   Les liens précèdent le bouton dans le DOM ; sans ce piège, Tab depuis le bouton
   sortait vers le contenu de la page, menu toujours ouvert. */
(function(){
  var mq=window.matchMedia('(max-width:1240px)');
  document.addEventListener('keydown',function(e){
    if(e.key!=='Tab'||!mq.matches)return;
    var t=document.getElementById('navTog'),n=document.getElementById('nav');
    if(!t||!n||t.getAttribute('aria-expanded')!=='true')return;
    var f=[].slice.call(n.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(function(el){
      var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';});
    if(!f.length)return;
    var i=f.indexOf(document.activeElement);
    if(e.shiftKey){if(i<=0){e.preventDefault();f[f.length-1].focus();}}
    else if(i===-1||i===f.length-1){e.preventDefault();f[0].focus();}
  });
})();

(function(){var b=document.getElementById('nezBar'),m=document.getElementById('nxm-b'),t=b&&b.querySelector('a[href^="/nos-activites"]');if(!t||!m)return;var d=document.createElement('div'),s=document.createElement('div'),h=document.createElement('div'),q=document.createElement('button'),g=document.createElement('nav'),k={},n=m.querySelector('.nxh');d.id='nezDim';s.id='nezSheet';s.setAttribute('role','dialog');s.setAttribute('aria-modal','true');s.setAttribute('aria-labelledby','nezSheetT');h.className='nzs-h';h.innerHTML='<b id="nezSheetT"></b>';h.firstChild.textContent=n?n.textContent:t.textContent.trim();q.type='button';q.className='nzs-x';q.setAttribute('aria-label',document.documentElement.lang=='en'?'Close':'Fermer');q.textContent='✕';h.appendChild(q);s.appendChild(h);s.appendChild(g);[].forEach.call(m.querySelectorAll('a[href]:not(.pn-feat)'),function(a){var r=a.getAttribute('href'),x=a.querySelector('strong,b'),y=a.querySelector('em'),l=document.createElement('a');if(k[r])return;k[r]=1;l.href=r;l.textContent=(x||a).textContent.replace(/\s*→\s*$/,'').trim();a.classList.contains('pn-all')&&(l.className='nzs-all');if(y){x=document.createElement('small');x.textContent=y.textContent;l.appendChild(x)}g.appendChild(l)});d.hidden=s.hidden=true;document.body.appendChild(d);document.body.appendChild(s);t.setAttribute('aria-controls','nezSheet');function c(o){d.hidden=s.hidden=!o;t.setAttribute('aria-expanded',!!o);b.classList.toggle('nz-open',!!o);document.documentElement.classList.toggle('nz-lock',!!o)}function p(){var y=b.getBoundingClientRect().top;s.style.top=y/2+'px';s.style.maxHeight=y-32+'px'}c(0);t.addEventListener('click',function(e){if(getComputedStyle(b).display=='none')return;e.preventDefault();if(!s.hidden)return c(0);p();c(1);(e.detail?s:g.firstChild).focus()});s.tabIndex=-1;q.addEventListener('click',function(){c(0);t.focus()});d.addEventListener('click',function(){c(0)});addEventListener('keydown',function(e){e.key=='Escape'&&!s.hidden&&(c(0),t.focus())});var w=innerWidth;addEventListener('resize',function(){s.hidden||p();innerWidth!=w&&(w=innerWidth,c(0))})})();

/* Lot 20 : mega-menu au clavier (ordinateur). Tab passe de rubrique en rubrique sans
   ouvrir les panneaux ; Entree/Espace (clic natif du bouton) ou fleche bas ouvrent,
   Echap ferme et rend le focus au declencheur. aria-haspopup est retire : le panneau
   est une zone de liens, pas un menu ARIA. */
try{(function(){
  var mq=window.matchMedia('(min-width:1241px)');
  [].forEach.call(document.querySelectorAll('#navLinks .nav-item>.nav-trigger'),function(btn){
    btn.removeAttribute('aria-haspopup');
    btn.addEventListener('keydown',function(e){
      if(e.key!=='ArrowDown'||!mq.matches)return;
      var item=btn.closest('.nav-item'),m=item&&item.querySelector('.nx-mega');if(!m)return;
      e.preventDefault();
      if(!item.classList.contains('open'))btn.click();
      var a=m.querySelector('a[href]');if(a)a.focus();
    });
  });
})();}catch(e){}
/* Lot 20 (WCAG 2.2 · 2.4.11) : un lien qui recoit le focus dans une barre a defilement
   horizontal (sous-navigation .pp-sub sur mobile) est ramene dans la partie visible ;
   Chrome ne la faisait pas defiler quand le lien commencait au bord droit. */
try{document.addEventListener('focusin',function(e){
  var t=e.target,p=t&&t.parentElement;
  while(p&&p!==document.body){
    var o=getComputedStyle(p).overflowX;
    if((o==='auto'||o==='scroll')&&p.scrollWidth>p.clientWidth){
      var r=t.getBoundingClientRect(),c=p.getBoundingClientRect();
      if(r.right>c.right)p.scrollLeft+=r.right-c.right+16;
      else if(r.left<c.left)p.scrollLeft-=c.left-r.left+16;
      return;
    }
    p=p.parentElement;
  }
},true);}catch(e){}


/* Lot 24 : la barre utilitaire (Clients … Manifester son intérêt) est une barre d'outils.
   Un seul arrêt de tabulation ; flèches gauche/droite, Début/Fin pour passer d'un lien à l'autre.
   Sans JavaScript, chaque lien reste un arrêt de tabulation. */
try{(function(){
 var u=document.querySelector('.nx-util-in');if(!u||u.getAttribute('role')==='toolbar')return;
 var lang=(document.documentElement.getAttribute('lang')||'fr').slice(0,2);
 u.setAttribute('role','toolbar');
 u.setAttribute('aria-label',lang==='en'?'Quick links':(lang==='ar'?'روابط سريعة':'Accès rapides'));
 function items(){return [].filter.call(u.querySelectorAll('a[href]'),function(a){return a.getClientRects().length>0})}
 var cur=null;
 function set(t){var l=items();if(!l.length)return;if(l.indexOf(t)<0)t=(cur&&l.indexOf(cur)>-1)?cur:l[0];cur=t;
  [].forEach.call(u.querySelectorAll('a[href]'),function(a){a.tabIndex=(a===t)?0:-1})}
 set(null);
 u.addEventListener('focusin',function(e){var a=e.target.closest?e.target.closest('a[href]'):null;if(a&&u.contains(a))set(a)});
 u.addEventListener('keydown',function(e){
  var l=items(),i=l.indexOf(document.activeElement);if(i<0)return;
  var rtl=getComputedStyle(u).direction==='rtl',k=e.key,j=-1;
  if(k==='ArrowRight')j=rtl?i-1:i+1;else if(k==='ArrowLeft')j=rtl?i+1:i-1;else if(k==='Home')j=0;else if(k==='End')j=l.length-1;else return;
  e.preventDefault();j=(j+l.length)%l.length;set(l[j]);l[j].focus();
 });
 var t=null;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(function(){set(cur)},150)});
})()}catch(e){}
