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
    btn.addEventListener('click',function(){
      if(!mq.matches)return; /* mobile : accordéon du chrome commun */
      var item=btn.closest('.nav-item'),was=item.classList.contains('open');
      closeAll(item);
      item.classList.toggle('open',!was);
      btn.setAttribute('aria-expanded',String(!was));
    });
  });
  document.addEventListener('click',function(e){
    if(mq.matches&&!e.target.closest('.nav-item'))closeAll(null);
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&mq.matches){
      closeAll(null);
      /* neutralise :focus-within pour masquer le panneau ouvert au clavier */
      if(document.activeElement&&document.activeElement.closest('.nav-item'))document.activeElement.blur();
    }
  });
})();}catch(_e){}
