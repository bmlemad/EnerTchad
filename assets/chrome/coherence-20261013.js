/* Cohérence 2026-10-13 (audit, chantier 6) — bascule clair/sombre dans l'en-tête.
   Même bouton que l'en-tête arabe (#arh-theme, gen_premium_ar.py) : demi-disque,
   aria-pressed="true" quand le mode sombre est actif, préférence dans localStorage.
   - Pages à nav principale (carnets, calculateur) : le bouton est inséré dans
     #nav .nav-cta, avant la loupe, et reprend son style (.nav-search).
   - Atlas, Espace Clients, pages React : le bouton est déjà dans le balisage de
     l'en-tête (.et-theme-hdr) ; ce script ne fait que le relier.
   Classe pilotée : et-jlight sur /journal-*, et-plight ailleurs, sp-dark (inverse)
   sur les pages React (body.sp) — comme le script de tête de chaque gabarit.
   Les deux clés et-plight / et-jlight sont écrites, comme #jlightBtn et #etThemeBtn. */
(function(){try{
  var d=document.documentElement,b=document.body;if(!b)return;
  var react=b.classList.contains('sp');
  var K=/^\/journal-/.test(location.pathname)?'et-jlight':'et-plight';
  var en=(d.lang||'').indexOf('en')===0;
  var LABEL=en?'Dark mode':'Mode sombre';
  var ICON='<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 0 0 16.4z" fill="currentColor"/></svg>';
  function dark(){return react?d.classList.contains('sp-dark'):!d.classList.contains(K)}
  function sync(){
    if(!react){var light=d.classList.contains(K);d.classList.toggle(K==='et-plight'?'et-jlight':'et-plight',light);}
    var on=dark();
    [].forEach.call(document.querySelectorAll('.et-theme-hdr'),function(x){x.setAttribute('aria-pressed',on?'true':'false')});
    // Commandes existantes du panneau Affichage : aria-pressed = mode clair actif.
    [].forEach.call(document.querySelectorAll('#etThemeBtn,#jlightBtn,#plightBtn'),function(x){x.setAttribute('aria-pressed',on?'false':'true')});
  }
  function set(on){
    if(react)d.classList.toggle('sp-dark',on);else{d.classList.toggle('et-plight',!on);d.classList.toggle('et-jlight',!on);}
    try{localStorage.setItem('et-plight',on?'0':'1');localStorage.setItem('et-jlight',on?'0':'1')}catch(e){}
    sync();
  }
  if(!document.querySelector('.et-theme-hdr')){
    var cta=document.querySelector('#nav .nav-cta');
    if(cta){
      var t=document.createElement('button');
      t.type='button';t.className='nav-search et-theme-hdr';t.id='etThemeHdr';
      t.setAttribute('aria-label',LABEL);t.title=LABEL;t.innerHTML=ICON;
      cta.insertBefore(t,document.getElementById('navSearch')||cta.firstChild);
    }
  }
  [].forEach.call(document.querySelectorAll('.et-theme-hdr'),function(x){
    if(x.getAttribute('data-et-bound'))return;x.setAttribute('data-et-bound','1');
    x.addEventListener('click',function(){set(!dark())});
  });
  // Chantier 7 — menus mobiles des en-têtes Atlas / Clients (details.et-al-tog) et React
  // (details.sp-mobile-menu) : Échap le referme et rend le focus au bouton « Menu », un lien
  // suivi le referme, comme le menu principal (c_ac04328f0f47.js).
  var tog=document.querySelector('#nav details.et-al-tog,.sp-top details.sp-mobile-menu');
  if(tog&&!tog.getAttribute('data-et-bound')){
    tog.setAttribute('data-et-bound','1');
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&tog.open){tog.open=false;tog.querySelector('summary').focus()}});
    tog.parentNode.addEventListener('click',function(e){if(tog.open&&e.target.closest&&e.target.closest('a'))tog.open=false});
  }
  sync();
  new MutationObserver(sync).observe(d,{attributes:true,attributeFilter:['class']});
}catch(e){}})();
/* et-visual:start */
/* Keep mobile display settings available without covering page content. */
(function(){function init(){
 var ctl=document.getElementById('lum-ctl'),foot=document.querySelector('footer');
 if(!ctl||!foot||!document.querySelector('.et-theme-hdr'))return;
 var origin=ctl.classList.contains('lum-in-menu')?document.body:ctl.parentNode;
 var media=matchMedia('(max-width:900px)');
 function layout(){var target=media.matches?foot:origin;if(ctl.parentNode!==target){target.appendChild(ctl);var panel=document.getElementById('lum-panel');if(panel)panel.hidden=true;}ctl.classList.remove('lum-in-menu');ctl.classList.toggle('et-display-footer',media.matches);}
 layout();media.addEventListener('change',layout);matchMedia('(max-width:760px)').addEventListener('change',layout);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
/* et-visual:end */
