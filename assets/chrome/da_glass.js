/* Ch544 - univers energetique vivant, couche commune du site.
   Canvas fixe derriere la page : rubans or et cyan, particules en fusion additive.
   Absent en mouvement reduit ; pause quand l onglet est cache ; allege sous 640 px. */
(function(){
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(document.getElementById('uni540')||document.getElementById('uni542')||document.getElementById('uni544'))return;
var c=document.createElement('canvas');c.id='uni544';c.setAttribute('aria-hidden','true');
c.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:-2;pointer-events:none';
document.body.prepend(c);
var x=c.getContext('2d');if(!x){c.remove();return}
var W,H,DPR,t=0,run=true,last=0;
function rs(){DPR=Math.min(window.devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;c.width=W*DPR;c.height=H*DPR;x.setTransform(DPR,0,0,DPR,0,0)}
rs();addEventListener('resize',rs);
document.addEventListener('visibilitychange',function(){run=!document.hidden;if(run)requestAnimationFrame(fr)});
function light(){var h=document.documentElement.classList;return h.contains('et-plight')||h.contains('et-jlight')}
var STR=[{c:[255,183,3],y:.28,ph:0},{c:[0,180,216],y:.55,ph:2.1},{c:[255,183,3],y:.74,ph:4.2},{c:[0,150,190],y:.42,ph:1.3}];
var NP=W<640?22:44,pts=[];
for(var i=0;i<NP;i++){var s=STR[i%STR.length];pts.push({s:s,u:Math.random(),v:.00045+Math.random()*.0009,r:.7+Math.random()*1.7})}
function yOf(s,u,tt){return H*(s.y+.085*Math.sin(u*5.1+tt*.00021+s.ph)+.05*Math.sin(u*11.7-tt*.00013+s.ph*1.7))}
function fr(ts){if(!run)return;requestAnimationFrame(fr);if(ts-last<33)return;last=ts;t=ts;
var L=light();x.clearRect(0,0,W,H);
var nR=W<640?3:STR.length;
x.globalCompositeOperation=L?'source-over':'lighter';
for(var k=0;k<nR;k++){var s=STR[k];var a=L?.05:.09;
x.beginPath();for(var u=0;u<=1.001;u+=.033){var px=u*W,py=yOf(s,u,t);u===0?x.moveTo(px,py):x.lineTo(px,py)}
x.strokeStyle='rgba('+(L?[0,72,100]:s.c).join(',')+','+a+')';x.lineWidth=W<640?18:28;x.lineCap='round';x.stroke();
x.strokeStyle='rgba('+(L?[0,96,130]:s.c).join(',')+','+(L?.09:.20)+')';x.lineWidth=1.4;x.stroke()}
for(var j=0;j<pts.length;j++){var p=pts[j];p.u+=p.v;if(p.u>1.03){p.u=-.03;p.r=.7+Math.random()*1.7}
var px=p.u*W,py=yOf(p.s,p.u,t);var col=L?[0,96,130]:p.s.c;
var g=x.createRadialGradient(px,py,0,px,py,p.r*6);
g.addColorStop(0,'rgba('+col.join(',')+','+(L?.30:.7)+')');g.addColorStop(1,'rgba('+col.join(',')+',0)');
x.fillStyle=g;x.beginPath();x.arc(px,py,p.r*6,0,6.284);x.fill()}
x.globalCompositeOperation='source-over'}
requestAnimationFrame(fr);
})();

/* Ch559 - filet a11y elargi. Le filet du Ch544 ne visait que "main div, main pre" :
   une barre de navigation interne (nav.corp-nav) defilait horizontalement sur mobile
   sans jamais devenir atteignable au clavier. On balaye desormais tout le document,
   et on repasse au redimensionnement — un conteneur ne devient a defilement qu a
   partir d une certaine largeur. Le test de debordement passe en premier : il lit des
   proprietes deja calculees, la ou getComputedStyle force un recalcul de style ; sur
   les pages a dix mille noeuds l ordre inverse coutait des centaines de millisecondes. */
(function(){
function pose(){try{
var n=document.querySelectorAll('body *'),i,e,cs,sx,sy;
for(i=0;i<n.length;i++){e=n[i];
 if(e.scrollWidth<=e.clientWidth+1&&e.scrollHeight<=e.clientHeight+1)continue;
 if(e.hasAttribute('tabindex'))continue;
 if(e===document.body||e===document.documentElement)continue;
 cs=getComputedStyle(e);
 sx=cs.overflowX==='auto'||cs.overflowX==='scroll';
 sy=cs.overflowY==='auto'||cs.overflowY==='scroll';
 if(sx||sy){e.setAttribute('tabindex','0')}
}}catch(_e){}}
addEventListener('load',function(){pose();(window.requestIdleCallback||function(f){setTimeout(f,300)})(pose)});
var t;addEventListener('resize',function(){clearTimeout(t);t=setTimeout(pose,220)},{passive:true});
if(document.readyState==='complete')pose();
})();
