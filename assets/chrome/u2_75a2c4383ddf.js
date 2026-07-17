/* dedoublonnage v2 */
(function(){if(matchMedia("(hover:none)").matches)return;var sel=".pcard,.card-m,.cp-card,.voie-card,.fam-card,.esg-card,.app-card,.site,.divc",raf=0;addEventListener("pointermove",function(e){if(raf)return;raf=requestAnimationFrame(function(){raf=0;var el=e.target.closest&&e.target.closest(sel);if(!el)return;var r=el.getBoundingClientRect();el.style.setProperty("--mx",((e.clientX-r.left)/r.width*100)+"%");el.style.setProperty("--my",((e.clientY-r.top)/r.height*100)+"%");});},{passive:true});})();
;
(function(){if(/(^\/$|index\.html$)/.test(location.pathname))return;var b=document.getElementById("homeFab");if(!b)return;addEventListener("scroll",(function(){var q=0;return function(){if(!q){q=1;requestAnimationFrame(function(){q=0;b.classList.toggle("show",scrollY>360);});}};})(),{passive:true});})();
;
(function(){var t=[].slice.call(document.querySelectorAll('.nav-trigger')).filter(function(x){return x.textContent.trim().indexOf('Activités')===0})[0];if(!t)return;t.style.cursor='pointer';t.addEventListener('click',function(e){if(!matchMedia('(min-width:1241px)').matches)return;var l=document.querySelector('.nav-links a[href*="poles"]');if(!l)return;e.preventDefault();var loc=document.getElementById('poles');if(loc){loc.scrollIntoView({behavior:'smooth'});history.replaceState(null,'','#poles');}else{location.href=l.getAttribute('href');}});})();
;
try{
/* Curseurs : remplissage progressif de la piste + reprise de l'accent par curseur */
(function(){
  function rng(r){
    var ac=r.style.accentColor||''; if(ac) r.style.setProperty('--rng',ac);
    function fill(){var mn=+r.min||0,mx=+r.max||100,v=+r.value;var p=mx>mn?(v-mn)/(mx-mn)*100:0;r.style.setProperty('--p',p.toFixed(2)+'%');}
    r.addEventListener('input',fill); fill();
  }
  document.querySelectorAll('input[type=range]').forEach(rng);
})();

}catch(_e){/* section absente sur cette page */}
;
try{(function(){var b=document.getElementById('toTop');if(!b)return;var p=b.querySelector('.ttp'),C=2*Math.PI*24;p.style.strokeDasharray=C;p.style.strokeDashoffset=C;var r=matchMedia('(prefers-reduced-motion:reduce)').matches,t=false;function u(){var s=scrollY||document.documentElement.scrollTop,hh=document.documentElement.scrollHeight-innerHeight,pr=hh>0?Math.min(s/hh,1):0;p.style.strokeDashoffset=C*(1-pr);b.classList.toggle('show',s>600);t=false;}addEventListener('scroll',function(){if(!t){t=true;requestAnimationFrame(u);}},{passive:true});b.addEventListener('click',function(){scrollTo({top:0,behavior:r?'auto':'smooth'});});u();})();
}catch(_e){/* section absente sur cette page */}
;
try{
(function(){
  var p=document.getElementById('nezProg'),b=null;
  var red=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function upd(){
    var d=document.documentElement, s=scrollY||d.scrollTop, m=d.scrollHeight-innerHeight;
    if(p) p.style.width=(m>0?Math.min(100,100*s/m):0)+'%';
    if(b) b.classList.toggle('on', s>600);
  }
  addEventListener('scroll',(function(){var q=0;return function(){if(!q){q=1;requestAnimationFrame(function(){q=0;upd();});}};})(),{passive:true}); upd();
  if(b) b.addEventListener('click',function(){scrollTo({top:0,behavior:red?'auto':'smooth'});});
})();

}catch(_e){/* section absente sur cette page */}
;
try{(function(){var bar=document.getElementById('nezBar');if(!bar)return;var links=[].slice.call(bar.querySelectorAll('a[href^="#"]'));var map={};links.forEach(function(a){var id=a.getAttribute('href').slice(1);var el=document.getElementById(id);if(el)map[id]=a;});var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('nz-on');a.removeAttribute('aria-current');});var a=map[e.target.id];if(a){a.classList.add('nz-on');a.setAttribute('aria-current','true');}}});},{rootMargin:'-30% 0px -55% 0px'});Object.keys(map).forEach(function(id){io.observe(document.getElementById(id));});})();
}catch(_e){/* section absente sur cette page */}
;
try{(function(){var red=matchMedia('(prefers-reduced-motion: reduce)').matches;function settle(id){var el=document.getElementById(id);if(!el)return;var H=document.documentElement,pv=H.style.scrollBehavior;var stop=false;function cxl(){stop=true;H.style.scrollBehavior=pv;}addEventListener('wheel',cxl,{passive:true,once:true});addEventListener('touchstart',cxl,{passive:true,once:true});addEventListener('keydown',cxl,{once:true});var tries=0;var last=null;function step(){if(stop)return;H.style.scrollBehavior='auto';var t=el.getBoundingClientRect().top;if(last!==null&&Math.abs(t-last)<2){H.style.scrollBehavior=pv;return;}last=t;if(tries<14){tries++;if(Math.abs(t)>4)el.scrollIntoView({block:'start'});setTimeout(step,tries<6?90:200);}else{H.style.scrollBehavior=pv;}}setTimeout(step,red?60:750);}addEventListener('hashchange',function(){var id=location.hash.slice(1);if(id)settle(id);});document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a)return;var id=a.getAttribute('href').slice(1);if(id)settle(id);},true);if(location.hash.length>1){setTimeout(function(){settle(location.hash.slice(1));},300);}})();
}catch(_e){/* section absente sur cette page */}
;
try{(function(){function openIt(id){var el=document.getElementById(id);if(!el)return;var d=el.querySelector('details.atl-d');if(d)d.open=true;}document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href^="#atl-"]');if(a)openIt(a.getAttribute('href').slice(1));},true);if(/^#atl-/.test(location.hash))openIt(location.hash.slice(1));addEventListener('hashchange',function(){if(/^#atl-/.test(location.hash))openIt(location.hash.slice(1));});})();
}catch(_e){/* section absente sur cette page */}
;
try{(function(){var ultras=Array.prototype.slice.call(document.querySelectorAll('.nav-item-ultra'));ultras.forEach(function(it){var tr=it.querySelector('.nav-trigger');if(!tr)return;function setX(v){tr.setAttribute('aria-expanded',v?'true':'false');it.classList.toggle('kbopen',v);}it._setX=setX;tr.addEventListener('click',function(e){if(window.matchMedia('(max-width:1240px)').matches)return;e.preventDefault();var open=!it.classList.contains('kbopen');ultras.forEach(function(o){o!==it&&o._setX&&o._setX(false);});setX(open);});it.addEventListener('focusout',function(){setTimeout(function(){if(!it.contains(document.activeElement))setX(false);},10);});});document.addEventListener('keydown',function(e){if(e.key==='Escape')ultras.forEach(function(it){if(it.contains(document.activeElement)){var t=it.querySelector('.nav-trigger');t&&t.focus();}it._setX&&it._setX(false);});});document.addEventListener('click',function(e){ultras.forEach(function(it){if(!it.contains(e.target))it._setX&&it._setX(false);});});})();
}catch(_e){/* section absente sur cette page */}
;
try{(function(){var items=[].slice.call(document.querySelectorAll('.nav-item-mini'));items.forEach(function(it){var tr=it.querySelector('.nav-trigger');if(!tr)return;function setX(v){tr.setAttribute('aria-expanded',v?'true':'false');it.classList.toggle('kbopen',v);}it.addEventListener('mouseenter',function(){setX(true);});it.addEventListener('mouseleave',function(){setX(false);});tr.addEventListener('click',function(e){e.preventDefault();setX(!it.classList.contains('kbopen'));});it.addEventListener('focusout',function(){setTimeout(function(){if(!it.contains(document.activeElement))setX(false);},10);});});document.addEventListener('keydown',function(e){if(e.key==='Escape')items.forEach(function(it){if(it.contains(document.activeElement)){var f=it.querySelector('.nav-trigger');f&&f.focus();}it.classList.remove('kbopen');var t=it.querySelector('.nav-trigger');t&&t.setAttribute('aria-expanded','false');});});document.addEventListener('click',function(e){items.forEach(function(it){if(!it.contains(e.target)){it.classList.remove('kbopen');var t=it.querySelector('.nav-trigger');t&&t.setAttribute('aria-expanded','false');}});});})();
}catch(_e){/* section absente sur cette page */}
;
try{
(function(){
  var fine=window.matchMedia('(pointer:fine)').matches;
  var calm=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(fine&&!calm){
    /* spotlight doré sur les liens des méga-panneaux */
    document.querySelectorAll('.mu-col>a,.mu-feat').forEach(function(c){
      c.addEventListener('pointermove',function(e){
        var r=c.getBoundingClientRect();
        c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
        c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
      });
    });
    /* CTA magnétique (rayon court, retour doux) */
    var mag=document.querySelector('.nav-cta .btn-p');
    if(mag){
      mag.addEventListener('pointermove',function(e){
        var r=mag.getBoundingClientRect();
        var dx=(e.clientX-(r.left+r.width/2))/r.width, dy=(e.clientY-(r.top+r.height/2))/r.height;
        mag.style.transform='translate('+(dx*6).toFixed(1)+'px,'+(dy*4).toFixed(1)+'px)';
      });
      mag.addEventListener('pointerleave',function(){mag.style.transform='';});
    }
  }
  /* anneau de progression sur toTop */
  var tt=document.getElementById('toTop');
  if(tt&&!tt.querySelector('.ring')){
    var s=document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.setAttribute('class','ring');s.setAttribute('viewBox','0 0 52 52');
    s.innerHTML='<circle cx="26" cy="26" r="24"/>';
    tt.appendChild(s);
    var c=s.querySelector('circle'),L=151,tk;
    function up(){
      var max=document.documentElement.scrollHeight-innerHeight;
      var p=max>0?Math.min(1,scrollY/max):0;
      c.style.strokeDashoffset=(L*(1-p)).toFixed(1);
    }
    addEventListener('scroll',function(){if(!tk){tk=requestAnimationFrame(function(){up();tk=null;});}},{passive:true});
    up();
  }
})();

}catch(_e){/* section absente sur cette page */}
;
try{
(function(){
  if(window.matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  var h1s=document.querySelectorAll('.hx-h1');if(!h1s.length)return;
  var wi=0;
  function split(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(ch){
      if(ch.nodeType===3){
        var frag=document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function(tok){
          if(!tok)return;
          if(/^\s+$/.test(tok)){frag.appendChild(document.createTextNode(tok));return;}
          var s=document.createElement('span');s.className='w';s.style.setProperty('--wi',wi++);s.textContent=tok;
          frag.appendChild(s);
        });
        node.replaceChild(frag,ch);
      } else if(ch.nodeType===1&&ch.tagName!=='BR'&&ch.tagName!=='EM'){split(ch);}
    });
  }
  h1s.forEach(function(h1){wi=0;split(h1);});
})();

}catch(_e){/* section absente sur cette page */}
