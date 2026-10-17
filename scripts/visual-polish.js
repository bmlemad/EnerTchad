/* Keep mobile display settings available without covering page content. */
(function(){function init(){
 var panel=document.getElementById('lum-panel');
 if((document.documentElement.lang||'').indexOf('en')===0&&panel){
  var labels={'88':'Dim','100':'Standard','116':'Bright'};
  panel.querySelectorAll('button[data-l]').forEach(function(b){if(labels[b.dataset.l])b.textContent=labels[b.dataset.l];});
  ['etThemeBtn','jlightBtn','plightBtn'].forEach(function(id){var b=document.getElementById(id);if(b)b.title='Switch light / dark mode';});
 }

 var ctl=document.getElementById('lum-ctl'),foot=document.querySelector('footer');
 if(!ctl||!foot||!document.querySelector('.et-theme-hdr'))return;
 var origin=ctl.classList.contains('lum-in-menu')?document.body:ctl.parentNode;
 var media=matchMedia('(max-width:900px)');
 function layout(){var target=media.matches?foot:origin;if(ctl.parentNode!==target){target.appendChild(ctl);var panel=document.getElementById('lum-panel');if(panel)panel.hidden=true;}ctl.classList.remove('lum-in-menu');ctl.classList.toggle('et-display-footer',media.matches);}
 layout();media.addEventListener('change',layout);matchMedia('(max-width:760px)').addEventListener('change',layout);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
