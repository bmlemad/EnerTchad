try{
/* Palette de recherche Ctrl+K / Cmd+K — autonome, resultats groupes par categorie */
(function(){
  const idx=[
    {c:'Nos Pôles',id:'pole-amont',t:'Pôle Amont · Exploration-Production',k:'amont eor exploration production récupération champs matures blocs',url:'/pole-amont.html'},{c:'Nos Pôles',id:'pole-intermediaire',t:'Pôle Intermédiaire · Transport & stockage',k:'intermédiaire transport stockage corridor pipeline dépôts',url:'/pole-intermediaire.html'},{c:'Nos Pôles',id:'pole-aval',t:'Pôle Aval · Raffinage & distribution',k:'aval raffinage distribution stations mini-raffineries réseau produits',url:'/pole-aval.html'},{c:'Nos Pôles',id:'pole-greentech',t:'Durabilité (GreenTech) · énergie des opérations',k:'greentech solaire gaz décarbonation renouvelables esg hybridation',url:'/pole-greentech.html'},{c:'Nos Pôles',id:'pole-enertech',t:'Technologies (EnerTech) · IA·OT·IT',k:'enertech scada ia robotique cyber numérique l1-l4',url:'/pole-enertech.html'},{c:'Nos Pôles',id:'pole-enertalents',t:'Capital humain (EnerTalents) · académie & talents',k:'enertalents académie talents formation capital humain alternance',url:'/pole-enertalents.html'},{c:'Nos Pôles',id:'pole-enerconseils',t:'Conseil (EnerConseils) · données',k:'enerconseils conseil conseil données atlas structuration secteur',url:'/pole-enerconseils.html'},{c:'Nos Pôles',id:'pole-petrochimie',t:'Pétrochimie · extension chimie de l’Aval',k:'petrochimie chimie pétrolière intrants locaux eor gaz engrais urée natron gomme arabique dérivés',url:'/pole-petrochimie.html'},
    {c:'Services & projets',id:'services-ep',t:'Nos services · parapétrolier, réseau, data',k:'services parapétrolier forage EOR distribution réseau conseil data offre'},
    {c:'Services & projets',id:'innovations',t:'Nos innovations',k:'innovations approche mobile station actif-léger signatures'},
    {c:'Pôles & modèle',id:'poles',t:'Nos Pôles d’activité',k:'pôles activité amont intermédiaire aval services énergies technologies structure'},
    {c:'Pôles & modèle',id:'poles',t:'Chaîne de valeur · Nos Pôles',k:'chaîne intégrée amont midstream aval métiers pôles'},
    {c:'Pôles & modèle',id:'investir',t:'Modèle de revenus · cascade',k:'moteur trésorerie cascade financement revenus'},
    {c:'Pôles & modèle',id:'vision',t:'Vision & Mission',k:'raison d’être vision mission objectif ambition voie'},
    {c:'Pôles & modèle',id:'technologie',t:'Technologies (EnerTech)',k:'né numérique IA intelligence artificielle digital SCADA data'},
    {c:'Amont & technique',id:'eor',t:'Récupération assistée (EOR)',k:'EOR récupération assistée baril réservoir OOIP natron'},
    {c:'Amont & technique',id:'services-ep',t:'Services E&P / parapétrolier',k:'forage services champ pétrolier force d’intervention sismique'},
    {c:'Amont & technique',id:'sites',t:'Infrastructures nationales',k:'pipeline raffinerie terminal oléoduc sites CPF'},
    {c:'Amont & technique',id:'scada',t:'Dashboard SCADA temps réel',k:'SCADA supervision pipeline débit pression température stations intégrité'},
    {c:'Amont & technique',id:'robotique',t:'Robotique · drones, racleurs, crawlers',k:'robotique drones racleurs pigs crawlers inspection ILI HSE'},
    {c:'Aval & raffinage',id:'mini-raffinerie',t:'Mini-raffinerie modulaire 2.0',k:'mini raffinerie modulaire amovible redéployable module skid'},
    {c:'Amont & technique',id:'valorisation',t:'Valorisation des matières premières',k:'autonomie chimique bentonite proppant saumure gomme arabique'},
    {c:'Amont & technique',id:'rd',t:'R&D & Conception',k:'bureau d’études innovation recherche conception'},
    {c:'Aval & distribution',id:'produits',t:'Produits & tarifs',k:'carburant gasoil essence GPL bitume prix ARSAT lubrifiants'},
    {c:'Aval & distribution',id:'reseau',t:'Réseau de distribution',k:'stations hubs mobile station trésorerie distribution'},
    {c:'Aval & distribution',id:'modele-distribution',t:'Modèle de distribution',k:'flux import dépôt carte hubs comparatif'},
    {c:'Secteur (Atlas)',id:'atlas',t:'Secteur pétrolier du Tchad · outil d’information',k:'atlas secteur pétrolier tchad bassins cadastre blocs géologie Doba Bongor réserves grades brut oléoduc'},
    {c:'Secteur (Atlas)',id:'secteur',t:'Nos innovations au service du secteur',k:'secteur état SHT opérateurs baril additionnel pipeline tarif multiplicateur'},
    {c:'Transition & engagement',id:'transition',t:'Durabilité (GreenTech)',k:'greentech transition solaire hybride micro-réseaux ESG décarbonation IRVE décarbonation gaz batterie énergies'},
    {c:'Transition & engagement',id:'impact',t:'ESG · RSE · HSE',k:'ESG RSE HSE conformité environnement sécurité ITIE'},
    {c:'Transition & engagement',id:'impact-rural',t:'Impact rural · Agriculture & élevage',k:'rural agriculture élevage agropastoral irrigation GPL engrais'},
    {c:'Transition & engagement',id:'talents-tchad',t:'Les bâtisseurs',k:'talents compétences nationales équipe emploi tchadien'},
    {c:'Transition & engagement',id:'partenaires',t:'Partenaires & écosystème',k:'partenaires écosystème alliances'},
    {c:'Outils interactifs',id:'apps',t:'Outils interactifs',k:'simulateur calculateur STOIIP flotte dashboard modélisation'},
    {c:'Outils interactifs',id:'apps',t:'Configurateur Service Intégré',k:'configurateur service intégré IPM contrat domaines périmètre rendez-vous'},
    {c:'Outils interactifs',id:'apps',t:'Calculateur du Baril Additionnel',k:'calculateur baril additionnel EOR OOIP part État tarif pipeline'},
    {c:'Investir',id:'investir',t:'Investisseurs & financement',k:'investisseurs thèse mémorandum financement capital opportunité'},
    {c:'Investir',id:'actualites',t:'Actualités & jalons',k:'actualités jalons presse newsroom'},
    {c:'Investir',id:'faq',t:'Questions fréquentes',k:'FAQ questions réponses'},
    {c:'Investir',id:'infos',t:'Newsletter',k:'newsletter actualités inscription rester informé'},
    {c:'Contact',id:'contact',t:'Travaillons ensemble',k:'contact contrat B2B devis approvisionnement'},
    {c:'Atlas · Investisseur',id:'atl-investir',t:'Pourquoi investir au Tchad',k:'investir rente blocs libres opportunité oléoduc réserves fenêtre'},
    {c:'Atlas · Investisseur',id:'atl-entrer',t:'Comment entrer au Tchad — pack investisseur',k:'entrer bloc appel offres CPP concession data room dossier investisseur'},
    {c:'Atlas · Data ops',id:'atl-assay',t:'Fiche technique du brut (Doba Blend)',k:'assay brut doba API soufre doux TAN acide naphténique métallurgie'},
    {c:'Atlas · Data ops',id:'atl-reseaux',t:'Réseaux d’appui aux opérations',k:'réseaux oléoduc électricité eau trucking scada infrastructure statut'},
    {c:'Atlas · Data ops',id:'atl-gaz',t:'Gaz & sécurité — H₂S et gaz associé',k:'h2s sulfure hydrogène gaz associé souring seuils niosh osha détection'},
    {c:'Atlas · Data ops',id:'atl-climat',t:'Climat & fenêtres opérationnelles',k:'climat saison pluies harmattan chaleur forage logistique fenêtre'},
    {c:'HSE-Q',id:'biodiversite',t:'Protection faune & flore sur sites',k:'biodiversité faune flore oryx zakouma habitat éviter réduire restaurer'},
    {c:'HSE-Q',id:'qualite-air',t:'Qualité de l’air sur nos sites',k:'qualité air torchage flaring méthane LDAR poussières émissions SO2 NOx'},
    {c:'HSE-Q',id:'process-safety',t:'Sécurité des procédés',k:'process safety sécurité procédés bowtie barrières HAZOP LOPA MOC ESD SIS tier'},
    {c:'Impact',id:'energie-juste-prix',t:'De l’énergie chère au juste prix',k:'précarité énergétique coût industriel prix produits juste prix pouvoir achat'}
  ];
  const modal=document.getElementById('cmdk'),input=document.getElementById('cmdk-input'),res=document.getElementById('cmdk-results');
  if(!modal)return;
  const SVG=p=>'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
  const ICON={'Services & projets':SVG('<path d="M3 7h18M3 12h18M3 17h12"/>'),'Pôles & modèle':SVG('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>'),'Amont & technique':SVG('<path d="M5 21h14M8 21 12 3l4 18M9 13h6"/>'),'Aval & distribution':SVG('<path d="M12 21s-7-5.7-7-11a7 7 0 0 1 14 0c0 5.3-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>'),'Secteur (Atlas)':SVG('<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15"/>'),'Transition & engagement':SVG('<path d="M12 21C7 17 4 13.5 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 4-3 7.5-8 11.5z"/>'),'Outils interactifs':SVG('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),'Investir':SVG('<path d="M3 17l6-6 4 4 8-8M14 7h7v7"/>'),'Contact':SVG('<path d="M4 4h16v16H4zM4 8l8 5 8-5"/>'),_:SVG('<circle cx="12" cy="12" r="4"/>')};
  let active=0,current=idx.slice();
  const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  function render(){
    if(!current.length){res.innerHTML='<div style="padding:22px;color:#9FB0C9;font-size:.88rem;text-align:center">Aucun résultat</div>';return;}
    let html='',lastC=null;
    current.forEach((it,i)=>{
      if(it.c!==lastC){html+='<div class="cmdk-group">'+it.c+'</div>';lastC=it.c;}
      html+=`<a href="#${it.id}" role="option" data-i="${i}" class="cmdk-item${i===active?' on':''}" aria-selected="${i===active}"><span class="ci-ic">${ICON[it.c]||ICON._}</span><span class="ci-tx"><span class="ci-t">${it.t}</span><span class="ci-k">${it.k.split(' ').slice(0,6).join(' · ')}</span></span><span class="ci-go" aria-hidden="true">&#8629;</span></a>`;
    });
    res.innerHTML=html;
    const el=res.querySelector('.cmdk-item.on');if(el)el.scrollIntoView({block:'nearest'});
  }
  function open(){modal.style.display='flex';input.value='';current=idx.slice();active=0;render();setTimeout(()=>input.focus(),30);}
  function close(){modal.style.display='none';}
  function go(){const it=current[active];if(it){close();if(it.url){location.href=it.url;return;}const el=document.getElementById(it.id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});history.replaceState(null,'','#'+it.id);}}
  input.addEventListener('input',()=>{const q=norm(input.value);current=q?idx.filter(it=>norm(it.t+' '+it.k).includes(q)):idx.slice();active=0;render();});
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();modal.style.display==='flex'?close():open();return;}
    if(modal.style.display!=='flex')return;
    if(e.key==='Escape')close();
    else if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(active+1,current.length-1);render();}
    else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(active-1,0);render();}
    else if(e.key==='Enter'){e.preventDefault();go();}
  });
  res.addEventListener('click',e=>{const a=e.target.closest('.cmdk-item');if(a){e.preventDefault();active=+a.dataset.i;go();}});
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  window.openCmdk=open;
})();

}catch(_e){/* section absente sur cette page */}