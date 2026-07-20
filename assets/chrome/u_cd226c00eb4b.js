
/* Mode lecture claire des carnets : bouton dans la barre du haut, persistant. */
try{(function(){var KEY='et-jlight';
function apply(on){document.documentElement.classList.toggle('et-jlight',on)}
try{if(localStorage.getItem(KEY)==='1')apply(true)}catch(e){}
function init(){var bar=document.querySelector('.jtop');if(!bar||!document.querySelector('.jback'))return;if(document.getElementById('jlightBtn'))return;
var b=document.createElement('button');b.id='jlightBtn';b.type='button';b.title='Basculer lecture claire / sombre';b.setAttribute('aria-label','Basculer lecture claire ou sombre');
b.setAttribute('aria-pressed',document.documentElement.classList.contains('et-jlight')?'true':'false');b.textContent='☀';
b.addEventListener('click',function(){var on=!document.documentElement.classList.contains('et-jlight');apply(on);b.setAttribute('aria-pressed',on?'true':'false');try{localStorage.setItem(KEY,on?'1':'0')}catch(e){}});
bar.appendChild(b)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init()})()}catch(e){}
