/* EnerTchad — modern home interactions 2026 */
(function(){
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var els = document.querySelectorAll("[data-et-reveal]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); }});
    },{threshold:.12,rootMargin:"0px 0px -40px"});
    els.forEach(function(el){io.observe(el);});
  } else { els.forEach(function(el){el.classList.add("is-visible");}); }
  var counters=document.querySelectorAll("[data-et-counter]");
  if ("IntersectionObserver" in window && counters.length && !reduce) {
    var co=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting)return;
        var el=e.target, target=parseFloat(el.getAttribute("data-et-counter"));
        if(!isFinite(target)){co.unobserve(el);return;}
        var start=performance.now(), dur=850;
        function tick(now){
          var p=Math.min(1,(now-start)/dur), eased=1-Math.pow(1-p,3);
          el.textContent=Math.round(target*eased).toLocaleString("fr-FR");
          if(p<1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick); co.unobserve(el);
      });
    },{threshold:.6});
    counters.forEach(function(el){co.observe(el);});
  }
})();