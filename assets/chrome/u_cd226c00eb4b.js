
/* Mode lecture claire des carnets : bouton dans la barre du haut, persistant. */
try{(function(){var KEY='et-jlight';
function apply(on){document.documentElement.classList.toggle('et-jlight',on)}
try{var _v=localStorage.getItem('et-jlight')||localStorage.getItem('et-plight');if(_v==='1'||(_v===null&&matchMedia('(prefers-color-scheme: light)').matches))apply(true)}catch(e){}
function init(){var bar=document.querySelector('.jtop');if(!bar||!document.querySelector('.jback'))return;if(document.getElementById('jlightBtn'))return;
var b=document.createElement('button');b.id='jlightBtn';b.type='button';b.title='Basculer lecture claire / sombre';b.setAttribute('aria-label','Basculer lecture claire ou sombre');
b.setAttribute('aria-pressed',document.documentElement.classList.contains('et-jlight')?'true':'false');b.textContent='☀';
b.addEventListener('click',function(){var on=!document.documentElement.classList.contains('et-jlight');apply(on);b.setAttribute('aria-pressed',on?'true':'false');try{localStorage.setItem('et-jlight',on?'1':'0');localStorage.setItem('et-plight',on?'1':'0')}catch(e){}});
bar.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})()}catch(e){}

/* Mode clair des pages editoriales (liste blanche) : bouton fixe en bas a gauche, persistant. */
try{(function(){var KEY='et-plight';
var PAGES=['/communiques','/communiques-en','/faq','/faq-en','/glossaire-petrolier','/glossaire-petrolier-en','/avertissements','/mentions-legales','/cookies','/accessibilite','/publications','/carnets','/carnets-en','/ethique','/ethique-en','/societe','/societe-en','/engagements','/engagements-en','/communautes','/cibles-2030','/investisseurs','/investisseurs-en','/projets','/projets-en','/clients','/clients-en','/amont','/amont/activites','/amont/eor','/amont/services-ep','/aval','/aval/distribution','/aval/produits','/aval/raffinage','/aval/reseau','/enerconseils','/enerconseils/atlas','/enerconseils/conseil','/enertalents','/enertalents/academie','/enertalents/partenariats','/enertalents/rayonnement','/enertech','/enertech/innovations','/enertech/outils','/enertech/rd','/enertech/recits','/enertech/socle','/greentech','/greentech/hseq','/greentech/impact','/greentech/patrimoine','/greentech/transition','/impact','/intermediaire','/intermediaire/logistique','/intermediaire/services','/intermediaire/sites','/petrochimie','/petrochimie/chimie-eor','/petrochimie/produits','/activites-en','/brochure','/carrieres','/charte','/confidentialite-en','/confidentialite','/contact-en','/contact','/cookies-en','/distribution-en','/eor-en','/innovation','/mentions-legales-en','/plan-du-site','/pole-amont-en','/pole-aval-en','/pole-enerchimie-en','/pole-enerconseils-en','/pole-enertalents-en','/pole-enertech-en','/pole-greentech-en','/pole-intermediaire-en','/produits-en','/publications-en','/raffinage-en','/reseau-en','/services-ep-en'];
var p=location.pathname.replace(/\.html$/,'').replace(/\/index$/,'').replace(/\/$/,'')||'/';
if(PAGES.indexOf(p)<0)return;
function apply(on){document.documentElement.classList.toggle('et-plight',on)}
try{var _v=localStorage.getItem('et-jlight')||localStorage.getItem('et-plight');if(_v==='1'||(_v===null&&matchMedia('(prefers-color-scheme: light)').matches))apply(true)}catch(e){}
function init(){if(document.getElementById('plightBtn'))return;
var b=document.createElement('button');b.id='plightBtn';b.type='button';b.title='Basculer lecture claire / sombre';b.setAttribute('aria-label','Basculer lecture claire ou sombre');
b.setAttribute('aria-pressed',document.documentElement.classList.contains('et-plight')?'true':'false');b.textContent='☀';
b.addEventListener('click',function(){var on=!document.documentElement.classList.contains('et-plight');apply(on);b.setAttribute('aria-pressed',on?'true':'false');try{localStorage.setItem('et-jlight',on?'1':'0');localStorage.setItem('et-plight',on?'1':'0')}catch(e){}});
document.body.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})()}catch(e){}
