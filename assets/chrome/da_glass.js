/* Ch544 - univers energetique vivant, couche commune du site.
   Canvas fixe derriere la page : rubans or et cyan, particules en fusion additive.
   Absent en mouvement reduit ; pause quand l onglet est cache ; allege sous 640 px. */
(function(){
/* Mobile : la couche atmosphérique est volontairement désactivée pour préserver le budget CPU/GPU. */
if(matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 760px)').matches)return;
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

/* Zones defilantes atteignables au clavier — balayage unique (08/10/2026).
   COPIE IDENTIQUE dans u_cd226c00eb4b.js et da_glass.js : le premier fichier
   charge l installe (window.__etScan), l autre s abstient. Il remplace deux
   balayages qui se chevauchaient (da_glass : tabindex seul, toutes largeurs ;
   u_cd226c00eb4b : tabindex + role + libelle, mobile seulement) et se
   disputaient les memes tableaux : selon l ordre d arrivee, un tableau recevait
   ou non un nom accessible. Regle unique, toutes largeurs :
   - tout element en overflow auto/scroll qui deborde (> 1 px) recoit tabindex=0
     (WCAG 2.1.1, axe scrollable-region-focusable), jamais sous aria-hidden ;
   - s il ne contient rien de focalisable et n est pas dans la barre, le menu ou
     la palette, il devient une region nommee selon le sens du defilement.
   Lectures de style d abord, geometrie des seuls candidats ensuite, ecritures
   en dernier : aucune mise en page forcee en serie. */
(function(){
if(window.__etScan)return;window.__etScan=1;
var L=document.documentElement.lang||'',ar=L.indexOf('ar')===0,en=L.indexOf('en')===0;
var FOC='a[href],button,input,select,textarea,[tabindex]';
function lab(h){return ar?(h?'محتوى قابل للتمرير — مرّر أفقيًا':'محتوى قابل للتمرير — مرّر عموديًا')
  :en?(h?'Scrollable content — scroll horizontally':'Scrollable content — scroll vertically')
  :(h?'Contenu défilant — faire défiler horizontalement':'Contenu défilant — faire défiler verticalement')}
function pose(){try{
  var n=document.querySelectorAll('body *'),c=[],w=[],i,e,cs,ox,oy,sx,sy;
  for(i=0;i<n.length;i++){e=n[i];
    if(e.hasAttribute('tabindex'))continue;
    cs=getComputedStyle(e);ox=cs.overflowX;oy=cs.overflowY;
    if(ox==='auto'||ox==='scroll'||oy==='auto'||oy==='scroll')c.push(e);
  }
  for(i=0;i<c.length;i++){e=c[i];
    sx=e.scrollWidth>e.clientWidth+1;sy=e.scrollHeight>e.clientHeight+1;
    if(!sx&&!sy)continue;
    if(e.closest('[aria-hidden="true"]'))continue;
    w.push([e,sx,!e.querySelector(FOC)&&!e.closest('#nav,#nezBar,#cmdk,#ckn')]);
  }
  w.forEach(function(x){var e=x[0];e.setAttribute('tabindex','0');if(!x[2])return;
    if(!e.getAttribute('role'))e.setAttribute('role','region');
    if(!e.hasAttribute('aria-label')&&!e.hasAttribute('aria-labelledby')){var b=lab(x[1]);
      window.__etRegL=window.__etRegL||{};var k=(window.__etRegL[b]=(window.__etRegL[b]||0)+1);
      e.setAttribute('aria-label',k>1?b+' ('+k+')':b)}
  });
}catch(_e){}}
function idle(){(window.requestIdleCallback||function(f){setTimeout(f,300)})(pose)}
if(document.readyState==='complete'){pose();idle()}
else addEventListener('load',function(){pose();idle()});
var t;addEventListener('resize',function(){clearTimeout(t);t=setTimeout(pose,220)},{passive:true});
})();
