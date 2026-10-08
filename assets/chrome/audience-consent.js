/* EnerTchad audience measurement: no Google requests before opt-in.
   No noscript Google iframe: measurement always requires an active choice. */
(function(){'use strict';
if(window.etAudienceConsent)return;
var KEY='et-audience-consent-v2',MID='G-VT3S6711WW',GTM='GTM-PC376CFG',MAX=180*86400000;
var en=(document.documentElement.lang||'fr').indexOf('en')===0,ar=(document.documentElement.lang||'fr').indexOf('ar')===0;
var active=false,box,loaded=false;
function state(){try{var s=JSON.parse(localStorage.getItem(KEY));return s&&Date.now()-s.time<MAX&&/^(granted|denied)$/.test(s.value)?s.value:null}catch(e){return null}}
function command(){window.dataLayer=window.dataLayer||[];window.dataLayer.push(arguments)}
function cleanURL(s){try{var u=new URL(s);return u.origin+u.pathname}catch(e){return ''}}
function start(){if(active)return;active=true;window['ga-disable-'+MID]=false;
command('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
command('set',{page_location:location.origin+location.pathname,page_referrer:cleanURL(document.referrer),cookie_expires:15552000,cookie_update:false,allow_google_signals:false,allow_ad_personalization_signals:false});
if(!loaded){loaded=true;window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});var s=document.createElement('script');s.async=true;s.id='et-gtm';s.src='https://www.googletagmanager.com/gtm.js?id='+GTM;document.head.appendChild(s)}}
// Only fixed categories reach Analytics; contact URLs and form values stay local.
function intent(name,method){if(!active||state()!=='granted'||window['ga-disable-'+MID])return;command('event',name,{send_to:MID,contact_method:method,page_language:ar?'ar':en?'en':'fr'})}
function contactClick(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;var u;try{u=new URL(a.getAttribute('href'),location.href)}catch(err){return}var m=u.protocol==='mailto:'?'email':u.protocol==='tel:'?'telephone':u.protocol==='https:'&&(u.hostname==='wa.me'||u.hostname==='api.whatsapp.com')?'whatsapp':null;if(m)intent('contact_action',m)}
function contactDraft(e){var f=e.target;if(!f||f.id!=='ctForm')return;var b=f.querySelector('#ctSend');if(b&&!b.hidden&&f.checkValidity())intent('contact_draft','email')}
function clearCookies(){document.cookie.split(';').forEach(function(c){var n=c.trim().split('=')[0];if(!/^_ga(?:_|$)|^_gid$|^_gat/.test(n))return;['',location.hostname,'.'+location.hostname,'.enertchad.com'].forEach(function(d){document.cookie=n+'=; Max-Age=0; path=/'+(d?'; domain='+d:'')+'; SameSite=Lax'})})}
function choose(v){try{localStorage.setItem(KEY,JSON.stringify({value:v,time:Date.now()}))}catch(e){if(v==='denied')clearCookies()}
box.hidden=true;if(v==='granted')start();else{window['ga-disable-'+MID]=true;clearCookies();if(active){command('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});location.reload()}}}
function show(){box.hidden=false;box.querySelector('button').focus()}
window.etAudienceConsent={open:show,status:state};
function init(){
var css=document.createElement('style');css.textContent='#et-consent{position:fixed;z-index:2147483000;bottom:0;left:0;right:0;background:#10283c!important;color:#fff!important;padding:18px 24px;box-shadow:0 -4px 20px #0003;font:16px/1.5 system-ui,sans-serif;max-height:80vh;overflow:auto}#et-consent[hidden]{display:none!important}#et-consent p,#et-consent strong{color:#fff!important;margin:0 0 12px}#et-consent a{color:#ffe09a!important;text-decoration:underline}#et-consent .et-choices{display:flex;gap:12px;flex-wrap:wrap}#et-consent button,#et-consent-settings{font:inherit;cursor:pointer;border:1px solid #c4cbd1;border-radius:6px;padding:10px 16px;background:#fff!important;color:#10283c!important;min-height:44px}#et-consent button:focus-visible,#et-consent-settings:focus-visible{outline:3px solid #e7b955;outline-offset:3px}#et-consent-settings{display:block;margin:16px auto;font:14px system-ui}';document.head.appendChild(css);
box=document.createElement('section');box.id='et-consent';box.hidden=true;box.setAttribute('role','region');box.setAttribute('aria-label',en?'Audience measurement preferences':'Préférences de mesure d’audience');
var p=document.createElement('p');p.textContent=ar?'قياس الجمهور اختياري: بموافقتك، يقيس Google Analytics الزيارات والصفحات المشاهدة وإجراءات الاتصال، دون محتوى الرسائل. لا يتم تحميل Google Tag Manager إلا بعد الموافقة. الرفض لا يمنع استخدام الموقع.':en?'Optional audience measurement: with your permission, Google Analytics measures visits, page views and contact actions, without message contents. Google Tag Manager loads only if you accept. Refusing keeps the site fully usable.':'Mesure d’audience facultative : avec votre accord, Google Analytics mesure les visites, les pages vues et les actions de contact, sans le contenu des messages. Google Tag Manager se charge uniquement si vous acceptez. Le refus permet d’utiliser tout le site.';box.appendChild(p);
var links=document.createElement('p');var link=document.createElement('a');link.href=en?'/cookies-en':'/cookies';link.textContent=ar?'معلومات ملفات الارتباط والخصوصية (بالفرنسية)':en?'Cookie and privacy information':'Informations cookies et confidentialité';links.appendChild(link);box.appendChild(links);
var row=document.createElement('div');row.className='et-choices';[['denied',ar?'رفض قياس الجمهور':en?'Refuse audience measurement':'Refuser la mesure d’audience'],['granted',ar?'السماح بقياس الجمهور':en?'Accept audience measurement':'Accepter la mesure d’audience']].forEach(function(x){var b=document.createElement('button');b.type='button';b.textContent=x[1];b.addEventListener('click',function(){choose(x[0])});row.appendChild(b)});box.appendChild(row);document.body.appendChild(box);
var settings=document.createElement('button');settings.id='et-consent-settings';settings.type='button';settings.textContent=ar?'تفضيلات قياس الجمهور':en?'Audience measurement preferences':'Préférences de mesure d’audience';settings.addEventListener('click',show);var footer=document.querySelector('footer');(footer||document.body).appendChild(settings);
function oldNotice(){var n=document.getElementById('ckn');if(n)n.remove()};oldNotice();new MutationObserver(oldNotice).observe(document.body,{childList:true});
document.addEventListener('click',contactClick);document.addEventListener('submit',contactDraft);
var v=state();if(v==='granted')start();else if(v==='denied'){window['ga-disable-'+MID]=true;clearCookies()}else{clearCookies();box.hidden=false;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
addEventListener('storage',function(e){if(e.key===KEY)location.reload()});
})();
