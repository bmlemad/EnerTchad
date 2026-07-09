try{
/* Calculateur STOIIP interactif */
(function(){
  var ids=['area','thick','poro','sat','rf'];
  var els={}; ids.forEach(function(k){els[k]=document.getElementById('st-'+k);});
  if(!els.area)return;
  function fmt(n,d){return n.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});}
  function calc(){
    var area=+els.area.value, thick=+els.thick.value, poro=+els.poro.value/100, sat=+els.sat.value/100, rf=+els.rf.value/100;
    // labels
    document.getElementById('st-area-v').textContent=area;
    document.getElementById('st-thick-v').textContent=thick;
    document.getElementById('st-poro-v').textContent=els.poro.value;
    document.getElementById('st-sat-v').textContent=els.sat.value;
    document.getElementById('st-rf-v').textContent=els.rf.value;
    // Physique : surface(km²)=1e6 m² · épaisseur(m). Volume brut en m³.
    var grossM3 = area*1e6*thick;           // m³
    var poreM3  = grossM3*poro;             // m³
    var Bo=1.1, conv=6.2898;                // m³ → bbl
    var stoiipBbl = poreM3*sat/Bo*conv;     // bbl
    var recBbl = stoiipBbl*rf;              // bbl
    // affichage : Mm³ pour volumes, Mbbl ou Gbbl pour réserves
    function bbl(v){ // v en bbl → string avec unité adaptée
      if(v>=1e9) return fmt(v/1e9,2)+' <span style="font-size:.9rem">Gbbl</span>';
      return fmt(v/1e6,1)+' <span style="font-size:.9rem">Mbbl</span>';
    }
    document.getElementById('st-gross').innerHTML=fmt(grossM3/1e6,1)+' <span style="font-size:.8rem;color:rgba(245,247,250,.62)">Mm³</span>';
    document.getElementById('st-pore').innerHTML=fmt(poreM3/1e6,1)+' <span style="font-size:.8rem;color:rgba(245,247,250,.62)">Mm³</span>';
    document.getElementById('st-stoiip').innerHTML=bbl(stoiipBbl);
    document.getElementById('st-rec').innerHTML=bbl(recBbl).replace('font-size:.9rem','font-size:.84rem;color:var(--gold-l)');
  }
  ids.forEach(function(k){els[k].addEventListener('input',calc);});
  calc();
})();

}catch(_e){/* section absente sur cette page */}