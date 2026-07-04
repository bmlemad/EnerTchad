try{
// NAV
const nav=document.getElementById('nav');
const readbar=document.getElementById('readbar');
const dotnavEl=document.getElementById('dotnav');
addEventListener('scroll',()=>{
  nav.classList.toggle('scrolled',scrollY>20);
  const h=document.documentElement.scrollHeight-innerHeight;
  const pct=h>0?(scrollY/h)*100:0;
  readbar.style.width=pct+'%';
  if(dotnavEl)dotnavEl.style.setProperty('--dp',pct+'%');
  if(dotnavEl)dotnavEl.classList.toggle('at-end',pct>90);
},{passive:true});
// Sommaire latéral à points : section active via IntersectionObserver
(function(){
  const dots=document.querySelectorAll('#dotnav a');
  if(!dots.length)return;
  const map={};dots.forEach(d=>map[d.getAttribute('data-dot')]=d);
  const ids=Object.keys(map);
  const order=[...dots];const setActive=id=>{const ai=order.findIndex(d=>d.getAttribute('data-dot')===id);order.forEach((d,i)=>{d.classList.toggle('active',i===ai);d.classList.toggle('done',ai>=0&&i<ai);});};
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{if(e.isIntersecting)setActive(e.target.id);});
  },{rootMargin:'-45% 0px -45% 0px',threshold:0});
  ids.forEach(id=>{const el=document.getElementById(id);if(el)obs.observe(el);});
})();
const tog=document.getElementById('navTog'),links=document.getElementById('navLinks'),navEl=document.getElementById('nav');
// hauteur réelle de la nav -> --nav-h (positionnement du méga-menu pleine largeur)
// Preloader : masquer après chargement (avec durée minimale pour voir les slogans)
(function(){
  var pl=document.getElementById('preloader');if(!pl)return;
  var start=Date.now(),minShow=1100;
  function hide(){
    var wait=Math.max(0,minShow-(Date.now()-start));
    setTimeout(function(){pl.classList.add('done');setTimeout(function(){pl.remove();},800);},wait);
  }
  if(document.readyState==='complete')hide();
  else window.addEventListener('load',hide);
  // filet de sécurité : masquer au bout de 6 s quoi qu'il arrive
  setTimeout(function(){if(pl&&!pl.classList.contains('done')){pl.classList.add('done');setTimeout(function(){if(pl)pl.remove();},800);}},6000);
})();
function setNavH(){document.documentElement.style.setProperty('--nav-h',navEl.offsetHeight+'px');}
setNavH();window.addEventListener('resize',setNavH);window.addEventListener('load',function(){setNavH();setTimeout(setNavH,400);setTimeout(setNavH,3200);});
function setMenu(open){
  links.classList.toggle('open',open);
  tog.setAttribute('aria-expanded',open?'true':'false');
  // verrou de défilement quand le menu mobile est ouvert
  if(window.matchMedia('(max-width:1240px)').matches){
    document.body.style.overflow=open?'hidden':'';
    document.body.style.overflowX='hidden';
  }
}
tog.setAttribute('aria-expanded','false');
tog.setAttribute('aria-controls','navLinks');
tog.addEventListener('click',()=>setMenu(!links.classList.contains('open')));
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
// Méga-menu : accordéon sur mobile (clic sur le trigger ouvre/ferme le panneau)
links.querySelectorAll('.nav-trigger').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(!window.matchMedia('(max-width:1240px)').matches)return;
    const item=btn.closest('.nav-item');
    const isOpen=item.classList.contains('open');
    links.querySelectorAll('.nav-item.open').forEach(o=>{o.classList.remove('open');o.querySelector('.nav-trigger').setAttribute('aria-expanded','false');});
    if(!isOpen){item.classList.add('open');btn.setAttribute('aria-expanded','true');}
  });
});
// fermeture à la touche Échap
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&links.classList.contains('open'))setMenu(false);});
// fermeture au clic hors du menu
document.addEventListener('click',e=>{
  if(links.classList.contains('open')&&!navEl.contains(e.target))setMenu(false);
});
// réinitialise le verrou si on repasse en desktop
addEventListener('resize',()=>{if(!window.matchMedia('(max-width:1240px)').matches){document.body.style.overflow='';}});

// reveal + count
function countUp(el){const to=+el.dataset.to,t0=performance.now(),d=1200;
  (function tick(n){const p=Math.min((n-t0)/d,1),e=1-Math.pow(1-p,3);
    el.textContent=Math.round(to*e).toLocaleString('fr-FR');if(p<1)requestAnimationFrame(tick);})(t0);}
const io=new IntersectionObserver((es)=>{es.forEach(en=>{if(en.isIntersecting){
  en.target.classList.add('in');en.target.querySelectorAll?.('.ct').forEach(countUp);io.unobserve(en.target);}});},{threshold:.16});
(function(){
  // auto-stagger : les .reveal* frères dans une même grille reçoivent un délai progressif
  var GRID=/grid-template-columns|svc-grid|mu-grid|res|hse-grid/;
  document.querySelectorAll('.reveal,.reveal-up,.reveal-blur').forEach(function(el){
    if(el.dataset.d!=null)return;
    var p=el.parentElement;if(!p)return;
    var disp=getComputedStyle(p).display;
    if(disp.indexOf('grid')<0 && disp.indexOf('flex')<0)return;
    var sibs=Array.prototype.filter.call(p.children,function(c){return c.classList&&(c.classList.contains('reveal')||c.classList.contains('reveal-up')||c.classList.contains('reveal-blur'));});
    if(sibs.length<2||sibs.length>8)return;
    el.dataset.d=Math.min(sibs.indexOf(el),5);
  });
})();
document.querySelectorAll('.reveal,.reveal-up,.reveal-blur').forEach(el=>{const d=+(el.dataset.d||0);el.style.transitionDelay=(d*85)+'ms';io.observe(el);});
/* filet de sécurité : révèle tout .reveal amené dans le viewport (couvre IO manqué, content-visibility, file://) */
(function(){var sel='.reveal:not(.in),.reveal-up:not(.in),.reveal-blur:not(.in)';var tk;
 function flush(){var vh=innerHeight||800;var any=document.querySelectorAll(sel);for(var i=0;i<any.length;i++){var r=any[i].getBoundingClientRect();if(r.top<vh*0.96){any[i].classList.add('in');any[i].querySelectorAll('.ct').forEach&&any[i].querySelectorAll('.ct').forEach(function(c){try{countUp(c);}catch(e){}});}}}
 addEventListener('scroll',function(){if(!tk){tk=requestAnimationFrame(function(){flush();tk=null;});}},{passive:true});
 addEventListener('load',flush);addEventListener('resize',flush,{passive:true});setTimeout(flush,400);flush();})();

// ── Motion premium (respecte prefers-reduced-motion) ──
const reduceMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
if(!reduceMotion){
  // 1) Lueur qui suit la souris sur les cartes (divc + spotlight global)
  // Applique le spotlight aux grandes cartes du site pour un effet premium cohérent
  document.querySelectorAll('.htech-grid>div,.cp-card,.buy-grid>div,.univ-grid>div,.maint-grid>div,.taskforce-grid>div,.fin-grid>div,.appfeat-grid>div,.hstat').forEach(c=>c.classList.add('glow-card'));
  document.querySelectorAll('.divc,.glow-card').forEach(card=>{
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
      card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
    });
  });
  // 2) Parallaxe léger sur les éléments .hero-parallax
  const px=document.querySelectorAll('.hero-parallax');
  if(px.length){
    let ticking=false;
    addEventListener('scroll',()=>{
      if(ticking)return;ticking=true;
      requestAnimationFrame(()=>{
        const y=scrollY;
        px.forEach(el=>{const s=+(el.dataset.speed||0.15);el.style.transform='translateY('+(y*s)+'px)';});
        ticking=false;
      });
    },{passive:true});
  }
}

// 3) Scroll-spy : surligne le lien de nav de la section visible
const navLinks=[...document.querySelectorAll('.nav-links a[href^="#"]')];
const secMap=navLinks.map(a=>({a,sec:document.querySelector(a.getAttribute('href'))})).filter(o=>o.sec);
if(secMap.length){
  const spy=new IntersectionObserver((es)=>{es.forEach(en=>{
    if(en.isIntersecting){
      const id='#'+en.target.id;
      navLinks.forEach(a=>{
        const on=a.getAttribute('href')===id;
        a.classList.toggle('active',on);
        if(on)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');
      });
    }
  });},{rootMargin:'-45% 0px -50% 0px'});
  secMap.forEach(o=>spy.observe(o.sec));
}

// APP tabs
document.querySelectorAll('.app-tab').forEach(t=>t.addEventListener('click',()=>{
  const id=t.dataset.app;
  document.querySelectorAll('.app-tab').forEach(x=>x.classList.toggle('on',x===t));
  document.querySelectorAll('.app-panel').forEach(p=>p.classList.toggle('on',p.dataset.app===id));
  if(id==='chain')drawChain();
}));

// APP 1 : CHAIN throughput
const CHAIN=[
  {n:'Amont · production',v:144,max:250,c:'#2E86DE',u:'kb/j'},
  {n:'Intermédiaire · pipeline',v:144,max:250,c:'#0EA5E9',u:'kb/j'},
  {n:'Aval · raffinage Djermaya',v:20,max:40,c:'#B45309',u:'kb/j'},
  {n:'Aval · réseau stations',v:12,max:20,c:'#F59E0B',u:'stations'},
];
function drawChain(){
  const bars=document.getElementById('thrBars');
  if(!document.getElementById('thrBars'))return;
  bars.innerHTML=CHAIN.map(c=>`<div class="thr-row"><div class="thr-top"><span class="tn">${c.n}</span><span class="tv">${c.v.toLocaleString('fr-FR')} ${c.u} <span style="color:var(--muted)">/ ${c.max}</span></span></div><div class="bar"><i style="background:${c.c}"></i></div></div>`).join('');
  setTimeout(()=>bars.querySelectorAll('.bar i').forEach((b,i)=>b.style.width=(CHAIN[i].v/CHAIN[i].max*100)+'%'),100);
  // gauge = current avg utilization vs 2030 targets
  const util=Math.round(CHAIN.reduce((s,c)=>s+c.v/c.max,0)/CHAIN.length*100);
  const C=2*Math.PI*48, arc=document.getElementById('gaugeArc');
  setTimeout(()=>arc.setAttribute('stroke-dasharray',`${C*util/100} ${C}`),150);
  const uv=document.getElementById('utilVal'); let v0=0;
  const iv=setInterval(()=>{v0++;uv.textContent=v0+'%';if(v0>=util)clearInterval(iv);},22);
}
const chainIO=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){drawChain();chainIO.disconnect();}})},{threshold:.25});
chainIO.observe(document.querySelector('.apps'));
addEventListener('load',()=>setTimeout(drawChain,500));

// APP 2 : REFINING calculator
const PROFILES={
  essence:{'Essence':38,'Gasoil/Diesel':30,'Kérosène/Jet':10,'GPL':6,'Fioul lourd':10,'Bitume/autres':6},
  equilibre:{'Essence':28,'Gasoil/Diesel':40,'Kérosène/Jet':12,'GPL':6,'Fioul lourd':8,'Bitume/autres':6},
  diesel:{'Essence':20,'Gasoil/Diesel':50,'Kérosène/Jet':12,'GPL':5,'Fioul lourd':7,'Bitume/autres':6},
};
const PCOL={'Essence':'#2E86DE','Gasoil/Diesel':'#0EA5E9','Kérosène/Jet':'#38BDF8','GPL':'#5AA7F0','Fioul lourd':'#B45309','Bitume/autres':'#7C3A06'};
let refProfile='essence';
const crude=document.getElementById('crude');
function calcRef(){
  document.getElementById('crudeVal').textContent=(+crude.value).toLocaleString('fr-FR');
  const prof=PROFILES[refProfile], total=+crude.value;
  document.getElementById('refOut').innerHTML=Object.entries(prof).map(([k,pct])=>{
    const v=Math.round(total*pct/100);
    return `<div class="ref-prod"><span class="rp-n">${k}</span><span class="rp-bar"><i style="background:${PCOL[k]};width:${pct*2.2}%"></i></span><span class="rp-v">${v.toLocaleString('fr-FR')} b/j</span></div>`;
  }).join('');
}
crude.addEventListener('input',calcRef);
document.querySelectorAll('#refProfile button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#refProfile button').forEach(x=>{x.classList.toggle('on',x===b);x.style.background=x===b?'var(--blue)':'none';x.style.color=x===b?'#fff':'var(--muted)';x.style.fontWeight=x===b?'600':'400';});
  refProfile=b.dataset.p; calcRef();
}));
// init seg styling
document.querySelector('#refProfile button.on').style.background='var(--blue)';
document.querySelector('#refProfile button.on').style.color='#fff';
calcRef();

// APP 3 : BASINS
const BASINS={
  doba:{k:'En production',t:'Bassin de Doba',d:"Le bassin historique en production : cœur de l'activité E&P, brut tchadien (~21° API) exporté via le corridor d’export national. EOR chimique ASP (Natron Na₂CO₃, biopolymère, tensioactif local).",s:[['144 kb/j','capacité'],['735','puits'],['+8-17 %','OOIP / EOR']]},
  bongor:{k:'En production',t:'Bassin de Bongor',d:"Second bassin productif, brut plutôt léger (jusqu'à 31° API). Champs Ronier, Mimosa et Baobab ; pipeline Ronier-Djermaya alimentant la raffinerie nationale.",s:[['~31°','API léger'],['Ronier·Mimosa','champs'],['300 km','pipeline Djermaya']]},
  lactchad:{k:'Exploration',t:'Zone du Lac Tchad · gaz',d:"Zone gazière (champ de Sédigui) dans la région du Lac Tchad, à fort potentiel gas-to-power, hors des cinq bassins pétroliers.",s:[['exploration','phase'],['frontière','type'],['Nord-Ouest','zone']]},
  doseo:{k:'Exploration',t:'Bassin de Doséo',d:"Bassin d'exploration de l'Est tchadien, parmi les cinq bassins sédimentaires inventoriés au cadastre pétrolier national.",s:[['exploration','phase'],['Est','localisation'],['cadastre','42 blocs']]},
  madiago:{k:'Exploration',t:'Bassin de Salamat',d:"Bassin frontière du Sud-Est tchadien, en phase d'évaluation, ouvert au cadastre pétrolier national.",s:[['évaluation','phase'],['frontière','type'],['cadastre','42 blocs']]},
  sedigui:{k:'Champ gazier',t:'Champ gazier de Sédigui',d:"Ressource gazière stratégique de la région du Lac, destinée à alimenter notre activité électricité (gas-to-power) (gas-to-power).",s:[['gaz','ressource'],['→ power','débouché'],['Lac','région']]},
};
function showBasin(b){
  const d=BASINS[b];if(!d)return;
  document.getElementById('bK').textContent=d.k;
  document.getElementById('bT').textContent=d.t;
  document.getElementById('bD').textContent=d.d;
  document.getElementById('bS').innerHTML=d.s.map(x=>`<div class="ms"><div class="v">${x[0]}</div><div class="k">${x[1]}</div></div>`).join('');
  document.querySelectorAll('.bzone').forEach(c=>{const on=c.dataset.b===b;c.setAttribute('stroke',on?'#fff':'none');c.setAttribute('stroke-width',on?'2':'0');});
}
document.querySelectorAll('.bzone').forEach(c=>{
  c.setAttribute('tabindex','0');c.setAttribute('role','button');c.setAttribute('aria-label','Bassin '+c.dataset.b);
  c.addEventListener('click',()=>showBasin(c.dataset.b));
  c.addEventListener('mouseenter',()=>showBasin(c.dataset.b));
  c.addEventListener('focus',()=>showBasin(c.dataset.b));
  c.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showBasin(c.dataset.b);}});
});
showBasin('doba');

// APP 4 : B2B FORM
document.getElementById('cSubmit').addEventListener('click',()=>{
  const type=document.getElementById('cType').value;
  const name=document.getElementById('cName').value.trim();
  const sector=document.getElementById('cSector').value;
  const product=document.getElementById('cProduct').value;
  const vol=document.getElementById('cVol').value;
  const phone=document.getElementById('cPhone').value.trim();
  const mail=document.getElementById('cMail').value.trim();
  const precis=(document.getElementById('cMsg')||{}).value||'';
  const msg=document.getElementById('formMsg');
  if(!name||(!phone&&!mail)){
    msg.className='form-msg show';msg.style.background='rgba(217,168,79,.12)';msg.style.borderColor='rgba(217,168,79,.3)';msg.style.color='#E8C36A';
    msg.textContent='Merci d\'indiquer la raison sociale et au moins un moyen de contact (téléphone ou email).';return;
  }
  // Routage : demandes techniques E&P -> amont@, achats/produits -> distribution@
  const toEP=/parapétrolier|EOR|Force d’intervention|exploitation/i.test(type);
  const dest=toEP?'amont@enertchad.td':'distribution@enertchad.td';
  // Composition d'un email structuré pré-rempli
  const subject=`Demande ${name} — ${type}`;
  const body=
`Demande — EnerTchad
─────────────────────────────────────────
Type de demande : ${type}
Raison sociale  : ${name}
Secteur         : ${sector}
Produit / objet : ${product}
Volume mensuel  : ${vol}
Téléphone       : ${phone||'—'}
Email           : ${mail||'—'}

Précisions :
${precis||'—'}
─────────────────────────────────────────
Envoyé depuis enertchad.td / EnerTchad`;
  const href=`mailto:${dest}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href=href;
  msg.className='form-msg show';msg.style.background='';msg.style.borderColor='';msg.style.color='';
  msg.innerHTML=`Merci ${name} — votre logiciel de messagerie s'ouvre avec la demande pré-remplie. Validez l'envoi à <strong>${dest}</strong>. Réponse sous 48 h ouvrées. Si rien ne s'ouvre, écrivez directement à ${dest}.`;
  msg.scrollIntoView({behavior:'smooth',block:'center'});
});

/* Formulaire de contact */
(function(){
  var f=document.getElementById('ctForm');if(!f)return;
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=(document.getElementById('ctName').value||'').trim();
    var org=(document.getElementById('ctOrg').value||'').trim();
    var mail=(document.getElementById('ctMail').value||'').trim();
    var type=document.getElementById('ctType').value;
    var bodyt=(document.getElementById('ctMsg').value||'').trim();
    var msg=document.getElementById('ctFormMsg');
    var okMail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    if(!name||!okMail||!bodyt){
      msg.className='form-msg show';msg.style.background='rgba(217,168,79,.12)';msg.style.borderColor='rgba(217,168,79,.3)';msg.style.color='#E8C36A';
      msg.textContent='Merci de renseigner votre nom, un email valide et un message.';return;
    }
    var subject='['+type+'] '+name+(org?' / '+org:'');
    var body='Type : '+type+'\nNom : '+name+'\nOrganisation : '+(org||'-')+'\nEmail : '+mail+'\n\n'+bodyt+'\n\nEnvoye depuis enertchad.td';
    msg.removeAttribute('style');msg.className='form-msg show';
    msg.textContent='Merci '+name+', votre messagerie va s\'ouvrir vers contact@enertchad.td pour finaliser l\'envoi.';
    window.location.href='mailto:contact@enertchad.td?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
  });
})();
/* Inscription « Restez informé » */
(function(){
  var btn=document.getElementById('nlSubmit');if(!btn)return;
  btn.addEventListener('click',function(){
    var inp=document.getElementById('nlMail'),msg=document.getElementById('nlMsg');
    var mail=(inp.value||'').trim();
    var ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
    if(!ok){
      msg.className='form-msg show';msg.style.background='rgba(217,168,79,.12)';msg.style.borderColor='rgba(217,168,79,.3)';msg.style.color='#E8C36A';
      msg.textContent='Merci d\'indiquer une adresse email valide.';return;
    }
    var subject='Inscription actualités — EnerTchad';
    var body='Merci de m\'inscrire à vos actualités et jalons.\n\nEmail : '+mail+'\n\nEnvoyé depuis enertchad.td / EnerTchad';
    window.location.href='mailto:contact@enertchad.td?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    msg.className='form-msg show';msg.style.background='';msg.style.borderColor='';msg.style.color='';
    msg.innerHTML='Merci — votre logiciel de messagerie s\'ouvre pour confirmer votre inscription à <strong>contact@enertchad.td</strong>. Si rien ne s\'ouvre, écrivez-nous directement.';
    inp.value='';
  });
})();

/* Dashboard temps réel : KPI animés + statut stations (données illustratives) */
(function(){
  const stations=[
    ['N\'Djamena Farcha','Diesel · Super · GPL','ok'],
    ['N\'Djamena Diguel','Diesel · Super · IRVE','ok'],
    ['N\'Djamena Dembé','Diesel · Super','busy'],
    ['N\'Djamena Chagoua','Diesel · Super · GPL','ok'],
    ['Moundou','Diesel · Super · GPL','ok'],
    ['Moundou Zone Ind.','Diesel · Super','ok'],
    ['Sarh','Diesel · Super','ok'],
    ['Abéché','Diesel · Super · GPL','low'],
    ['Mongo','Diesel · Super','ok'],
    ['La Loumia','Diesel · Super','ok'],
    ['Dourbali','Diesel · Super','busy'],
    ['Massaguet','Diesel · Super','maint']
  ];
  const lbl={ok:['Opérationnel','var(--green-l)'],busy:['Forte affluence','var(--gold-l)'],low:['Stock faible','var(--amber-l)'],maint:['Maintenance','var(--muted)']};
  const wrap=document.getElementById('dash-stations');
  if(wrap){
    wrap.innerHTML=stations.map(([n,p,s])=>{
      const[t,c]=lbl[s];
      return `<div style="padding:14px 14px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--hair)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
          <strong style="font-size:.84rem;color:#fff">${n}</strong>
          <span style="width:7px;height:7px;border-radius:50%;background:${c};flex-shrink:0"></span>
        </div>
        <div style="font-size:.72rem;color:${c}">${t}</div>
        <div style="font-size:.66rem;color:var(--muted);margin-top:2px">${p}</div>
      </div>`;
    }).join('');
  }
  // animation légère des KPI
  const tx=document.getElementById('kpi-tx'),vol=document.getElementById('kpi-vol'),wait=document.getElementById('kpi-wait'),pulse=document.getElementById('dash-pulse');
  let active=false;
  function jitter(){
    if(!active)return;
    if(tx)tx.textContent=330+Math.floor(Math.random()*40);
    if(vol)vol.textContent=(126+Math.random()*6).toFixed(1);
    if(wait)wait.textContent=(2.1+Math.random()*0.6).toFixed(1);
    if(pulse)pulse.textContent='Mis à jour à l\'instant';
  }
  // ne tourner que quand le dashboard est visible (économie ressources mobile)
  const dash=document.getElementById('dashboard');
  if(dash&&'IntersectionObserver'in window){
    let timer=null;
    new IntersectionObserver(es=>es.forEach(e=>{
      active=e.isIntersecting;
      if(active&&!timer){timer=setInterval(jitter,8000);jitter();}
      else if(!active&&timer){clearInterval(timer);timer=null;}
    }),{threshold:.2}).observe(dash);
  }
})();

/* Simulateur Carte Flotte */
(function(){
  const veh=document.getElementById('ff-veh'),km=document.getElementById('ff-km'),cons=document.getElementById('ff-cons'),fuel=document.getElementById('ff-fuel'),tier=document.getElementById('ff-tier');
  if(!veh)return;
  const fmt=n=>Math.round(n).toLocaleString('fr-FR').replace(/\u202f/g,' ');
  function calc(){
    const nv=+veh.value, nkm=+km.value, nc=+cons.value, price=+fuel.value, rate=+tier.value;
    document.getElementById('ff-veh-val').textContent=nv;
    document.getElementById('ff-km-val').textContent=fmt(nkm);
    document.getElementById('ff-cons-val').textContent=nc;
    const volume=nv*nkm*nc/100;            // litres/mois
    const cost=volume*price;                // FCFA/mois
    const saveYear=cost*rate*12;            // économies NRJ+™ annuelles
    document.getElementById('ff-vol').textContent=fmt(volume);
    document.getElementById('ff-cost').textContent=fmt(cost);
    document.getElementById('ff-save').textContent=fmt(saveYear);
  }
  [veh,km,cons,fuel,tier].forEach(el=>el.addEventListener('input',calc));
  calc();
})();

/* Flux de distribution interactif : clic étage -> panneau détail */
(function(){
  const data=[
    {c:'var(--gold)',cl:'var(--gold-l)',t:'Approvisionnement local & dépôt',
     d:"L'approvisionnement privilégie le raffinage local : nos mini-raffineries modulaires, l'import régulé ne servant que de complément en transition. Le carburant est stocké dans des hubs-dépôts d'un hectare (N'Djamena, Moundou, Abéché) : acheter au bon moment, lisser les ruptures, tenir un prix stable.",
     tags:['Raffinage local prioritaire','Djermaya (national)','Hubs-dépôts','Autonomie 30 j']},
    {c:'var(--blue)',cl:'var(--blue-l)',t:'Stations-hubs & satellites',
     d:"Chaque hub-dépôt approvisionne en gros un réseau de stations satellites de sa zone. Vente au détail (essence, gasoil, GPL, lampant), services et lubrifiants, au prix homologué ARSAT identique sur tout le territoire. Modèle DODO pour une croissance capital-légère.",
     tags:['Prix ARSAT','Modèle DODO','GPL & services','Marque unique']},
    {c:'var(--amber)',cl:'var(--amber-l)',t:'Mobile Station™',
     d:"Là où une station fixe n'existe pas ou tombe en rupture, la Mobile Station™ conteneurisée se déploie en 24-48 h. Énergie de site autonome, télésurveillance IoT, certifiée ATEX — elle prolonge le réseau vers mines, chantiers, camps humanitaires et communautés rurales.",
     tags:['Déploiement 24-48h','Énergie de site autonome','ATEX Zone 1','Anti-pénurie']},
    {c:'var(--green)',cl:'var(--green-l)',t:'Client final & B2B',
     d:"Le dernier maillon : particuliers et clients professionnels (flottes, mines, BTP, ONG, agro-industrie). La relation est digitalisée — carte de fidélité NRJ+™, application Mon Espace, cartes flotte, livraison en vrac et eBoutique — pour fidéliser et simplifier l'achat.",
     tags:['Carte NRJ+™','App Mon Espace','Cartes flotte B2B','eBoutique']}
  ];
  const btns=[...document.querySelectorAll('.dist-btn')];
  const panel=document.getElementById('dist-detail');
  if(!btns.length||!panel)return;
  const ttl=document.getElementById('dd-title'),txt=document.getElementById('dd-text'),tagWrap=document.getElementById('dd-tags');
  function select(i){
    const d=data[i];
    panel.style.borderLeftColor=d.c;
    ttl.textContent=d.t; txt.textContent=d.d;
    tagWrap.innerHTML=d.tags.map(t=>`<span style="font-family:var(--fm);font-size:.7rem;color:${d.cl};border:1px solid ${d.cl};opacity:.9;padding:4px 10px;border-radius:999px">${t}</span>`).join('');
    btns.forEach((b,j)=>{b.style.transform=j===i?'translateY(-4px)':'none';b.style.boxShadow=j===i?'0 8px 24px rgba(0,0,0,.3)':'none';});
  }
  btns.forEach((b,i)=>{b.addEventListener('click',()=>select(i));});
  select(0);
})();

}catch(_e){/* section absente sur cette page */}