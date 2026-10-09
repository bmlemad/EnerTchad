try{
(function(){
  function gen(seed,base){var pts=[],v=base,s=seed;for(var i=0;i<12;i++){s=(s*9301+49297)%233280;var r=s/233280-0.5;v=v*(1+r*0.012);pts.push(v);}return pts;}
  function draw(svg,vals){
    var NS='http://www.w3.org/2000/svg';
    var min=Math.min.apply(null,vals),max=Math.max.apply(null,vals),sp=(max-min)||1;
    var coords=vals.map(function(v,i){return [i*4,(12-((v-min)/sp*10)+1)];});
    var pts=coords.map(function(c){return c[0]+','+c[1].toFixed(1);}).join(' ');
    var pl=svg.querySelector('polyline');pl.setAttribute('points',pts);
    var col=getComputedStyle(pl).stroke||'currentColor';
    var last=coords[coords.length-1];
    /* charte dataviz unifiée · aire dégradée sous la courbe */
    var fill=svg.querySelector('polygon.spark-fill');
    if(!fill){fill=document.createElementNS(NS,'polygon');fill.setAttribute('class','spark-fill');fill.setAttribute('stroke','none');fill.setAttribute('fill',col);fill.setAttribute('opacity','.13');svg.insertBefore(fill,pl);}
    fill.setAttribute('points',pts+' '+last[0]+',14 0,14');
    /* dernier point accentué */
    var dot=svg.querySelector('circle.spark-dot');
    if(!dot){dot=document.createElementNS(NS,'circle');dot.setAttribute('class','spark-dot');dot.setAttribute('r','1.7');dot.setAttribute('fill',col);dot.setAttribute('stroke','rgba(6,11,20,.85)');dot.setAttribute('stroke-width','.6');svg.appendChild(dot);}
    dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1].toFixed(1));dot.style.opacity='0';
    var len=pl.getTotalLength?pl.getTotalLength():60;
    pl.style.strokeDasharray=len;pl.style.strokeDashoffset=len;
    pl.style.transition='stroke-dashoffset 1.4s ease';
    fill.style.opacity='0';fill.style.transition='opacity 1.2s ease .3s';
    dot.style.transition='opacity .4s ease 1.2s';
    requestAnimationFrame(function(){requestAnimationFrame(function(){pl.style.strokeDashoffset=0;fill.style.opacity='.13';dot.style.opacity='1';});});
  }
  function init(){
    document.querySelectorAll('svg.spark').forEach(function(s,ix){
      var el=document.getElementById(s.getAttribute('data-for'));
      var base=parseFloat((el&&el.textContent||'').replace(',','.'))||[82.4,80.1,74.5][ix];
      draw(s,gen(7+ix*13,base));
    });
  }
  if(document.readyState==='complete')setTimeout(init,600);
  else addEventListener('load',function(){setTimeout(init,600);});
})();

}catch(_e){/* section absente sur cette page */}