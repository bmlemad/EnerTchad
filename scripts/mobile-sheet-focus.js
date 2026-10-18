(function(factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else api.bind(document);})(function(){
 function cycle(event,sheet,active){
  if(sheet.hidden||event.key!=='Tab')return;
  var items=Array.prototype.filter.call(sheet.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'),function(el){return el.getClientRects().length;});
  if(!items.length){event.preventDefault();sheet.focus();return;}
  var first=items[0],last=items[items.length-1];
  if(event.shiftKey&&(active===first||active===sheet)){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&(active===last||active===sheet)){event.preventDefault();first.focus();}
 }
 function bind(doc){
  var sheet=doc.getElementById('nezSheet'),dim=doc.getElementById('nezDim');
  if(!sheet)return;
  sheet.addEventListener('keydown',function(e){cycle(e,sheet,doc.activeElement);});
  if(dim)dim.addEventListener('click',function(){var trigger=doc.querySelector('[aria-controls="nezSheet"]');if(trigger)trigger.focus();});
 }
 return {cycle:cycle,bind:bind};
});
