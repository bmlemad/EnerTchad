/* EnerTchad — Navigation « Direction A » : ouverture des méga-menus
   au clic/clavier sur desktop (tactile compris). Le mobile (accordéon,
   tiroir, verrou de défilement) reste géré par le chrome commun. */
try{(function(){
  var mq=window.matchMedia('(min-width:1241px)');
  var links=document.getElementById('navLinks');if(!links)return;
  function closeAll(except){
    links.querySelectorAll('.nav-item.open').forEach(function(i){
      if(i===except)return;
      i.classList.remove('open');
      var b=i.querySelector('.nav-trigger');if(b)b.setAttribute('aria-expanded','false');
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
        var clear=function(){it.classList.remove('kbesc');it.removeEventListener('focusout',clear);it.removeEventListener('mouseleave',clear);};
        it.addEventListener('focusout',clear);
        it.addEventListener('mouseleave',clear);
      }
    }
  });
})();}catch(_e){}
