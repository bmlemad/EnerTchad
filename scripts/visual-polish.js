/* Keep mobile display settings available without covering page content. */
(function(){function init(){
 var ctl=document.getElementById('lum-ctl'),foot=document.querySelector('footer');
 if(!ctl||!foot||!document.querySelector('.et-theme-hdr'))return;
 var origin=ctl.classList.contains('lum-in-menu')?document.body:ctl.parentNode;
 var media=matchMedia('(max-width:900px)');
 function layout(){var target=media.matches?foot:origin;if(ctl.parentNode!==target){target.appendChild(ctl);var panel=document.getElementById('lum-panel');if(panel)panel.hidden=true;}ctl.classList.remove('lum-in-menu');ctl.classList.toggle('et-display-footer',media.matches);}
 layout();media.addEventListener('change',layout);matchMedia('(max-width:760px)').addEventListener('change',layout);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
