/* EnerTchad — Navigation « Direction A » : ouverture des méga-menus
   au clic/clavier sur desktop (tactile compris). Le mobile (accordéon,
   tiroir, verrou de défilement) reste géré par le chrome commun. */
try{(function(){
  var mq=window.matchMedia('(min-width:1241px)');
  var links=document.getElementById('navLinks');if(!links)return;
  /* Ch322 : le gestionnaire de focus (plus bas) pose sur le panneau des styles
     en ligne !important ; les retirer fait partie de la fermeture, sinon le
     panneau reste peint alors que la classe .open a disparu. */
  var PROPS=['visibility','opacity','pointer-events','transform'];
  function nu(item){var m=item&&item.querySelector('.nx-mega');
    if(m)PROPS.forEach(function(k){m.style.removeProperty(k)});}
  function closeAll(except){
    links.querySelectorAll('.nav-item.open').forEach(function(i){
      if(i===except)return;
      i.classList.remove('open');
      var b=i.querySelector('.nav-trigger');if(b)b.setAttribute('aria-expanded','false');
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
      /* Ch322 : un declencheur de divulgation doit refermer au second appui.
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
          /* Ch322 : un focusout qui reste dans l'element (le panneau rend la main
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
    item.addEventListener('mouseleave',function(){if(mq.matches&&!item.classList.contains('open'))btn.setAttribute('aria-expanded','false');});
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
          if(e&&e.type==='focusout'&&it.contains(e.relatedTarget))return;   /* Ch322 */
          it.classList.remove('kbesc');it.removeEventListener('focusout',clear);it.removeEventListener('mouseenter',clear);};
        it.addEventListener('focusout',clear);
        it.addEventListener('mouseenter',clear);
      }
    }
  });
})();}catch(_e){}

/* Bascule linguistique directe : si la page declare un equivalent EN
   (hreflang), le bouton FR-EN y mene directement plutot qu'au portail /en. */
try{(function(){
  if((document.documentElement.getAttribute('lang')||'').slice(0,2)!=='fr')return;
  var alt=document.querySelector('link[rel="alternate"][hreflang="en"]');if(!alt)return;
  var href=alt.getAttribute('href');if(!href)return;
  href=href.replace(/^https?:\/\/[^\/]+/,'')||'/';
  if(href===location.pathname)return;
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

;(function(){/* a11y: keyboard-operable mega-menu (desktop) + truthful aria-expanded */var mq=window.matchMedia("(max-width:1240px)");var items=[].slice.call(document.querySelectorAll(".nav-item.nx-item"));function setAria(it,v){var b=it.querySelector(".nav-trigger");if(b)b.setAttribute("aria-expanded",v?"true":"false");}function reveal(it,on){var m=it.querySelector(".nx-mega");if(!m)return;if(on){m.style.setProperty("visibility","visible","important");m.style.setProperty("opacity","1","important");m.style.setProperty("pointer-events","auto","important");m.style.setProperty("transform","translateY(0) scale(1)","important");}else{m.style.removeProperty("visibility");m.style.removeProperty("opacity");m.style.removeProperty("pointer-events");m.style.removeProperty("transform");}}function ariaFromVis(it){if(mq.matches)return;var m=it.querySelector(".nx-mega");if(!m)return;var cs=getComputedStyle(m);setAria(it,cs.visibility!=="hidden"&&parseFloat(cs.opacity)>0.5&&cs.display!=="none");}function closeOthers(except){items.forEach(function(it){if(it!==except){reveal(it,false);if(!it.matches(":hover"))setAria(it,false);}});}items.forEach(function(item){var btn=item.querySelector(".nav-trigger");if(!btn)return;var mega=item.querySelector(".nx-mega");item.addEventListener("focusin",function(){if(mq.matches)return;closeOthers(item);item.classList.remove("kbesc");reveal(item,true);setAria(item,true);});item.addEventListener("focusout",function(){if(mq.matches)return;setTimeout(function(){if(!item.contains(document.activeElement)){reveal(item,false);ariaFromVis(item);}},10);});["mouseenter","mouseleave"].forEach(function(ev){item.addEventListener(ev,function(){setTimeout(function(){ariaFromVis(item);},20);setTimeout(function(){ariaFromVis(item);},340);});});if(mega)mega.addEventListener("transitionend",function(){ariaFromVis(item);});});document.addEventListener("keydown",function(e){if(e.key!=="Escape"||mq.matches)return;items.forEach(function(item){if(item.contains(document.activeElement)){reveal(item,false);setAria(item,false);item.classList.add("kbesc");/* Ch322 : le focusin declenche par le retour du focus au declencheur venait de retirer .kbesc ; sans elle, :focus-within rouvrait le panneau alors que aria-expanded disait false */var b=item.querySelector(".nav-trigger");if(b)b.focus();}});});})();
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
    var n=document.querySelectorAll('header,nav,div,section,aside'),i,e,c,h,t,r;
    for(i=0;i<n.length;i++){
      e=n[i];c=getComputedStyle(e);
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
