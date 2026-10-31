(function () {
  'use strict';
  var fields = {
    supply: [['eq-product','Produit','Product'],['eq-volume','Volume et unité','Volume and unit'],['eq-frequency','Fréquence / durée','Frequency / duration'],['eq-supply-location','Lieu de livraison','Delivery location'],['eq-supply-date','Échéance','Preferred date']],
    fleet: [['eq-vehicles','Véhicules','Vehicles'],['eq-fleet-location','Zones de circulation','Operating areas'],['eq-fleet-needs','Suivi / contrôle','Reporting / control'],['eq-fleet-date','Échéance','Preferred date']],
    engineering: [['eq-service','Mission','Assignment'],['eq-installation','Installation / projet','Facility / project'],['eq-phase','Phase du projet','Project phase'],['eq-engineering-location','Localisation','Location'],['eq-deliverable','Livrable / question','Output / question'],['eq-engineering-date','Échéance','Preferred date']]
  };
  var services = ['amont','depot','raffinage','petrochimie','faisabilite','conception','assistance','suivi'];
  function kindFor(profile, mode) { return profile === 'ep' ? 'engineering' : profile === 'b2b' ? mode === 'fleet' ? 'fleet' : 'supply' : ''; }
  function summary(kind, values, en) {
    if (!fields[kind]) return '';
    var titles = {supply:en?'Fuel supply':'Approvisionnement en carburants',fleet:en?'Fleet management':'Gestion de flottes',engineering:en?'Engineering assignment':'Mission d’ingénierie'};
    return [(en?'Requirement: ':'Besoin : ')+titles[kind]].concat(fields[kind].map(function (item) {
      var value = String(values[item[0]] || '').trim();
      return value ? item[en ? 2 : 1] + ': ' + value : '';
    }).filter(Boolean)).join('\n');
  }
  function contextFor(search,data,en) {
    var query=new URLSearchParams(search),project=query.get('projet'),sector=query.get('secteur'),language=en?'en':'fr';
    function known(group,key){return !!(key&&data&&data[group]&&Object.prototype.hasOwnProperty.call(data[group],key)&&typeof data[group][key][language]==='string');}
    project=known('projects',project)?project:'';sector=known('sectors',sector)?sector:'';
    return {project:project,sector:sector,label:[project?(en?'Project: ':'Projet : ')+data.projects[project][language]:'',sector?(en?'Sector: ':'Secteur : ')+data.sectors[sector][language]:''].filter(Boolean).join('\n')};
  }
  if (typeof module !== 'undefined') module.exports = { kindFor: kindFor, summary: summary, contextFor:contextFor };
  if (typeof document === 'undefined') return;
  var form = document.getElementById('ctForm'), root = document.getElementById('et-enquiry');
  if (!form || !root) return;
  var en = document.documentElement.lang === 'en', type = document.getElementById('ctType');
  var mode = document.getElementById('et-enquiry-mode'), service = document.getElementById('eq-service');
  var params = new URLSearchParams(location.search), incomingService = params.get('service');
  var contextData=document.getElementById('et-enquiry-context-data'),data={};
  try{if(contextData)data=JSON.parse(contextData.textContent);}catch(error){}
  var context=contextFor(location.search,data,en);
  if (params.get('besoin') === 'flotte') mode.value = 'fleet';
  if (services.indexOf(incomingService) !== -1) {
    if (Array.from(service.options).some(function (o) { return o.value === incomingService; })) service.value = incomingService;
    // Older engineering cards used the partnership profile. Keep those deep links useful.
    if (params.get('profil') === 'partenariat') {
      var ep = Array.from(type.options).find(function (o) { return o.dataset.contactProfile === 'ep'; });
      if (ep) { type.value = ep.value; type.dispatchEvent(new Event('change', {bubbles:true})); }
    }
  }
  function update() {
    var option = Array.from(type.options).find(function (o) { return o.value === type.value; });
    var profile = option && (option.dataset.contactProfile || (/^(Approvisionnement|Supply)/.test(option.value) ? 'b2b' : ''));
    var kind = kindFor(profile, mode.value), values = {};
    root.querySelectorAll('fieldset').forEach(function (group) {
      var active = group.getAttribute('data-enquiry-kind') === kind;
      group.hidden = !active; group.disabled = !active;
    });
    document.getElementById('et-enquiry-business').hidden = profile !== 'b2b';
    mode.disabled = profile !== 'b2b';
    root.querySelector('.et-enquiry-help').hidden = !kind;
    (fields[kind] || []).forEach(function (item) {
      var field = document.getElementById(item[0]);
      values[item[0]] = field.tagName === 'SELECT' ? field.value ? field.options[field.selectedIndex].textContent : '' : field.value;
    });
    document.getElementById('et-enquiry-summary').value = [context.label,summary(kind, values, en)].filter(Boolean).join('\n');
    var contextNotice=document.getElementById('et-enquiry-context');
    if(contextNotice){contextNotice.textContent=context.label;contextNotice.hidden=!context.label;}
    document.querySelectorAll('#nav a.nx-lang, #nav #mLang, #nav a[lang="fr"], #nav a[lang="en"]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'), location.origin);
      if (!/^\/contact(?:-en)?$/.test(url.pathname)) return;
      url.searchParams.delete('besoin'); url.searchParams.delete('service');
      url.searchParams.delete('projet');url.searchParams.delete('secteur');
      if(context.project)url.searchParams.set('projet',context.project);
      if(context.sector)url.searchParams.set('secteur',context.sector);
      if (kind === 'fleet') url.searchParams.set('besoin','flotte');
      if (kind === 'engineering' && service.value) url.searchParams.set('service',service.value);
      else if (kind === 'engineering' && services.indexOf(incomingService) !== -1) url.searchParams.set('service',incomingService);
      link.setAttribute('href',url.pathname+url.search+url.hash);
    });
  }
  form.addEventListener('input', update);
  form.addEventListener('change', function (event) { if (event.target === service) incomingService = ''; update(); });
  form.addEventListener('submit', update, true);
  form.addEventListener('reset', function () { incomingService = ''; context={project:'',sector:'',label:''};setTimeout(update,0); });
  update();
})();
