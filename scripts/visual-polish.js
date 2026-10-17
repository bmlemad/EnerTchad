/* Keep mobile display settings available without covering page content. */
(function(){function init(){
 var ctl=document.getElementById('lum-ctl'),foot=document.querySelector('footer');
 if(!ctl||!foot||!document.querySelector('.et-theme-hdr'))return;
 var place=document.createComment('display-control-origin');ctl.parentNode.insertBefore(place,ctl);
 var media=matchMedia('(max-width:900px)');
 function layout(){if(media.matches){foot.appendChild(ctl);ctl.classList.add('et-display-footer');}else{place.parentNode.insertBefore(ctl,place.nextSibling);ctl.classList.remove('et-display-footer');}}
 layout();media.addEventListener('change',layout);
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();})();
