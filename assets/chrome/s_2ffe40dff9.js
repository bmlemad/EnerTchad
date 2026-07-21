/* sommaire lateral a pastilles (style aurail) */
(function(){
if(document.getElementById('aurail')||document.getElementById('secrail'))return;
function init(){
var main=document.querySelector('main')||document.body;
var all=[].slice.call(main.querySelectorAll('h2'));
var items=[];
all.forEach(function(h){
 if(h.closest('footer,nav,#secrail,.nx-mega,.mega-ultra,form,dialog,[hidden],.pgr,template'))return;
 var hc=h.cloneNode(true);[].slice.call(hc.querySelectorAll('[id$="Count"],[data-secrail-ignore]')).forEach(function(x){x.parentNode.removeChild(x)});var t=(hc.textContent||'').replace(/\s+/g,' ').trim();
 if(!t||t.length<3)return;
 var tgt=h.closest('section[id]')||((h.id&&h)||null)||h.closest('[id]');
 if(!tgt||tgt===document.body||tgt.tagName==='MAIN'){tgt=h;}
 if(!tgt.id){var b='sr-'+items.length,id=b,k=2;while(document.getElementById(id)){id=b+'-'+(k++);}tgt.id=id;}
 if(items.some(function(it){return it.id===tgt.id}))return;
 items.push({id:tgt.id,label:t,el:tgt});
});
if(items.length<3||items.length>14)return;
if(items.length>9)items=items.slice(0,9);
var cols=['var(--gold-l,#E8C36A)','#34D399','var(--blue-l,#5AA7F0)','#C4B5FD','var(--amber-l,#F2A65A)','#38BDF8','#D177B4','#7EE08A','#E8C36A'];
var r=document.createElement('nav');r.id='secrail';
var lang=(document.documentElement.lang||'').indexOf('en')===0;
r.setAttribute('aria-label',lang?'On this page':'Sommaire de la page');
var as=items.map(function(it,i){
 var a=document.createElement('a');a.href='#'+it.id;a.style.setProperty('--c',cols[i%cols.length]);a.style.setProperty('--d',i);
 var lb=it.label.length>30?it.label.slice(0,29).replace(/\s+\S*$/,'')+'…':it.label;
 var d=document.createElement('span');d.className='ad';d.setAttribute('aria-hidden','true');
 var l=document.createElement('b');l.className='axl';l.textContent=lb;
 a.setAttribute('aria-label',it.label);a.appendChild(d);a.appendChild(l);r.appendChild(a);return a;
});
document.body.appendChild(r);
var lock=-1,tick=false;
function upd(){tick=false;
 var sc=window.scrollY||0;
 r.classList.toggle('show',sc>460);
 var cur=0,line=innerHeight*0.35;
 for(var i=0;i<items.length;i++){if(items[i].el.getBoundingClientRect().top<=line)cur=i;}
 if(sc<80)cur=0;
 if(cur!==lock){lock=cur;as.forEach(function(a,i){a.classList.toggle('on',i===cur)});}
}
function onScroll(){if(!tick){tick=true;requestAnimationFrame(upd);}}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',onScroll,{passive:true});
upd();
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}
})();
