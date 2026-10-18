
try{(function(){
  var mq=window.matchMedia('(min-width:1241px)');
  var links=document.getElementById('navLinks');if(!links)return;

  var PROPS=['visibility','opacity','pointer-events','transform'];
  function nu(item){var m=item&&item.querySelector('.nx-mega');
    if(m)PROPS.forEach(function(k){m.style.removeProperty(k)});}
  function closeAll(except){

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

      var m=item.querySelector('.nx-mega');
      if(was){
        nu(item);
        item.classList.add('kbesc');
        var clear=function(e){

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

    item.addEventListener('mouseenter',function(){if(mq.matches&&!item.classList.contains('kbesc'))btn.setAttribute('aria-expanded','true');});
    item.addEventListener('mouseleave',function(){if(mq.matches&&!item.classList.contains('open')&&!item.matches(':focus-within'))btn.setAttribute('aria-expanded','false');});

    item.addEventListener('focusin',function(){
      if(!mq.matches||item.classList.contains('kbesc'))return;
      var m=item.querySelector('.nx-mega');
      if(m&&getComputedStyle(m).visibility==='visible')btn.setAttribute('aria-expanded','true');
    });

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


try{(function(){
  var lang=(document.documentElement.getAttribute('lang')||'').slice(0,2);
  var target=lang==='fr'?'en':(lang==='en'?'fr':'');
  if(!target)return;
  var alt=document.querySelector('link[rel="alternate"][hreflang="'+target+'"]');if(!alt)return;
  var href=alt.getAttribute('href');if(!href)return;
  href=href.replace(/^https?:\/\/[^\/]+/,'')||'/';
  document.querySelectorAll('a.nx-lang').forEach(function(a){a.href=href;});
})()}catch(e){}


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


try{(function(){var nav=document.getElementById('nav')||document.querySelector('.nav.nx');if(!nav)return;
var f=function(){nav.classList.toggle('scrolled',(window.scrollY||window.pageYOffset||0)>20)};
addEventListener('scroll',f,{passive:true});f();})()}catch(e){}

;(function(){/* a11y: keyboard-operable mega-menu (desktop) + truthful aria-expanded */var mq=window.matchMedia("(max-width:1240px)");var items=[].slice.call(document.querySelectorAll(".nav-item.nx-item"));function setAria(it,v){var b=it.querySelector(".nav-trigger");if(b)b.setAttribute("aria-expanded",v?"true":"false");}function reveal(it,on){var m=it.querySelector(".nx-mega");if(!m)return;if(on){m.style.setProperty("visibility","visible","important");m.style.setProperty("opacity","1","important");m.style.setProperty("pointer-events","auto","important");m.style.setProperty("transform","translateY(0) scale(1)","important");}else{m.style.removeProperty("visibility");m.style.removeProperty("opacity");m.style.removeProperty("pointer-events");m.style.removeProperty("transform");}}function ariaFromVis(it){if(mq.matches)return;var m=it.querySelector(".nx-mega");if(!m)return;var cs=getComputedStyle(m);setAria(it,cs.visibility!=="hidden"&&parseFloat(cs.opacity)>0.5&&cs.display!=="none");}function closeOthers(except){items.forEach(function(it){if(it!==except){reveal(it,false);if(!it.matches(":hover"))setAria(it,false);}});}items.forEach(function(item){var btn=item.querySelector(".nav-trigger");if(!btn)return;var mega=item.querySelector(".nx-mega");item.addEventListener("focusin",function(){if(mq.matches)return;closeOthers(item);item.classList.remove("kbesc");reveal(item,true);setAria(item,true);});item.addEventListener("focusout",function(){if(mq.matches)return;setTimeout(function(){if(!item.contains(document.activeElement)){reveal(item,false);ariaFromVis(item);}},10);});["mouseenter","mouseleave"].forEach(function(ev){item.addEventListener(ev,function(){setTimeout(function(){ariaFromVis(item);},20);setTimeout(function(){ariaFromVis(item);},340);});});if(mega)mega.addEventListener("transitionend",function(){ariaFromVis(item);});});document.addEventListener("keydown",function(e){if(e.key!=="Escape"||mq.matches)return;items.forEach(function(item){if(item.contains(document.activeElement)){reveal(item,false);setAria(item,false);item.classList.add("kbesc");/*  : le focusin declenche par le retour du focus au declencheur venait de retirer .kbesc ; sans elle, :focus-within rouvrait le panneau alors que aria-expanded disait false */var b=item.querySelector(".nav-trigger");if(b)b.focus();}});});})();

try{(function(){
  var re=document.documentElement,dernier=-1,tid=0;
  function pile(){
    var vh=window.innerHeight||800,vw=window.innerWidth||360,bas=0;
    var n=document.querySelectorAll('header,nav,div,section,aside'),i,e,c,h,t,r,cv=null;
    for(i=0;i<n.length;i++){
      e=n[i];

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

try{(function(){var o=[];
 addEventListener('beforeprint',function(){try{o=[];
   Array.prototype.forEach.call(document.querySelectorAll('details:not([open])'),function(d){o.push(d);d.open=true});
 }catch(e){}});
 addEventListener('afterprint',function(){try{o.forEach(function(d){d.open=false});o=[];}catch(e){}});
})();}catch(e){}

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



try{(function(){
  var u=document.querySelector('.nx-util-in');if(!u)return;
  if(u.querySelector('[data-et-short="essentiel"],a[href="/essentiel"],a[href="/essentiel-en"]'))return;
  var lang=(document.documentElement.getAttribute('lang')||'fr').slice(0,2);
  var a=document.createElement('a');
  a.setAttribute('data-et-short','essentiel');
  if(lang==='en'){a.href='/essentiel-en';a.textContent='90 seconds';a.setAttribute('aria-label','EnerTchad in 90 seconds');}
  else if(lang==='ar'){a.href='/ar';a.textContent='لمحة';a.setAttribute('aria-label','لمحة عن EnerTchad');}
  else{a.href='/essentiel';a.textContent='90 secondes';a.setAttribute('aria-label','EnerTchad en 90 secondes');}
  var first=u.querySelector('a');u.insertBefore(a,first||null);
})()}catch(e){}


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


(function(){var s=document.createElement("script");s.src="/assets/chrome/audience-consent.js?v=20261008";s.defer=true;document.head.appendChild(s)})();


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
/* et-mobile-focus:start */
(function(factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.bind(document);})(function(){
 function cycle(event,sheet,active){
  if(sheet.hidden||event.key!=='Tab')return;
  var items=Array.prototype.filter.call(sheet.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'),function(el){return el.getClientRects().length;});
  if(!items.length){event.preventDefault();sheet.focus();return;}
  var first=items[0],last=items[items.length-1];
  if(event.shiftKey&&(active===first||active===sheet)){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(active===last||active===sheet)){event.preventDefault();first.focus();}
 }
 function bind(doc){
  var sheet=doc.getElementById('nezSheet'),dim=doc.getElementById('nezDim');
  if(!sheet)return;
  sheet.addEventListener('keydown',function(e){cycle(e,sheet,doc.activeElement);});
  if(dim)dim.addEventListener('click',function(){var trigger=doc.querySelector('[aria-controls="nezSheet"]');if(trigger)trigger.focus();});
 }
 return {cycle:cycle,bind:bind};
});
/* et-mobile-focus:end */
