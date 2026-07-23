try{
(function(){
  if(window.matchMedia('(hover:none)').matches)return;
  var tip=document.createElement('div');tip.id='maptip';tip.setAttribute('role','status');document.body.appendChild(tip);
  function show(e,k,t,d){
    tip.innerHTML='<div class="tt-k">'+k+'</div><div class="tt-t">'+t+'</div><div class="tt-d">'+d+'</div>';
    tip.classList.add('on');move(e);
  }
  function move(e){
    var x=Math.min(e.clientX+16,innerWidth-280),y=e.clientY+18;
    if(y>innerHeight-130)y=e.clientY-tip.offsetHeight-14;
    tip.style.left=x+'px';tip.style.top=y+'px';
  }
  function hide(){tip.classList.remove('on');}
  /* Cadastre : statut par couleur */
  var cad=document.getElementById('cadmap');
  if(cad){
    var M={'rgba(217,168,79,.45)':['BLOC ATTRIBUÉ','Sous licence (secteur 2025)','Détenu par un opérateur en place — terrain de nos services parapétroliers et de l’EOR.'],
           'rgba(90,167,240,.10)':['BLOC LIBRE','Ouvert aux candidatures','L’un des 21 blocs du cadastre 2025 : notre terrain de chasse pour montage de consortiums.'],
           'rgba(245,158,11,.35)':['EN MUTATION','Reprise ou transition en cours','Périmètre en cours de réattribution — fenêtre d’opportunité à suivre.']};
    cad.querySelectorAll('rect').forEach(function(r){
      var m=M[r.getAttribute('fill')];if(!m)return;
      r.addEventListener('pointerenter',function(e){show(e,m[0],m[1],m[2]);});
      r.addEventListener('pointermove',move);
      r.addEventListener('pointerleave',hide);
    });
  }
  /* Hubs réseau : 3 plateformes */
  var hm=document.getElementById('hubmap');
  if(hm){
    var HUBS=[['HUB CAPITALE','N’Djamena','Plateforme d’un hectare visée : dépôt-réserve, station Tchadium, atelier — tête du corridor d’import et du B2B de la capitale.'],
              ['HUB EST','Abéché','Plateforme visée pour l’est : ravitaillement humanitaire et désenclavement des provinces orientales.'],
              ['HUB SUD','Moundou','Plateforme visée au cœur du bassin pétrolier : B2B champs, mines et BTP du grand sud.']];
    var cs=hm.querySelectorAll('circle');
    cs.forEach(function(c,i){
      var hub=HUBS[Math.min(Math.floor(i/2),2)];
      c.addEventListener('pointerenter',function(e){show(e,hub[0],hub[1],hub[2]);});
      c.addEventListener('pointermove',move);
      c.addEventListener('pointerleave',hide);
    });
  }
})();

}catch(_e){/* section absente sur cette page */}