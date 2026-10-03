/* EnerTchad UX QA interaction patch */
(function(){"use strict";
function closeMenus(){document.querySelectorAll('.nav-trigger[aria-expanded=true]').forEach(function(b){b.setAttribute('aria-expanded','false')})}
function closeMenuFor(btn){btn.setAttribute('aria-expanded','false');var id=btn.getAttribute('aria-controls');if(id){var panel=document.getElementById(id);if(panel)panel.hidden=false}}
document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeMenus();var active=document.activeElement;if(active&&active.classList&&active.classList.contains('nav-trigger'))active.focus()}});
document.addEventListener('click',function(e){if(!e.target.closest('.nav'))closeMenus()});
document.querySelectorAll('.nav-trigger').forEach(function(btn){
 btn.addEventListener('click',function(){
  var wasOpen=btn.getAttribute('aria-expanded')==='true';
  document.querySelectorAll('.nav-trigger').forEach(function(b){if(b!==btn)b.setAttribute('aria-expanded','false')});
  btn.setAttribute('aria-expanded',wasOpen?'false':'true');
 });
});
document.querySelectorAll('.ph-kpi,.pgh-kpi,.ilede-stat,.atc-stat,.stats').forEach(function(card){
 var t=(card.textContent||'').toLowerCase(),kind=null,label=null;
 if(/objectif|visée|cible|ambition|projection|indicative/.test(t)){kind='target';label='Cible / projection'}
 else if(/2024|2025|base|actuel|réalisé/.test(t)){kind='base';label='Donnée de référence'}
 if(!label||card.querySelector('.qa-status'))return;
 var s=document.createElement('span');s.className='qa-status';s.dataset.kind=kind;s.textContent=label;card.appendChild(s);
});
})();