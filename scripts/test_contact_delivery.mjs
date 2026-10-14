import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const script = readFileSync('assets/chrome/contact-delivery.js','utf8');
function fixture({lang='en', fetchImpl=async()=>({ok:true}), valid=true, fields={name:'Test',message:'Enquiry',website:''}}={}) {
  const handlers={};let timer,cleared=false,resets=0,events=0,focused=false,fetches=0,signal;
  const status={hidden:true,textContent:'',focus(){focused=true;}};
  const button={disabled:false};
  const form={action:'https://enertchad.com/contact-received',getAttribute(){return 'enertchad-contact-'+lang;},setAttribute(){},reportValidity(){return valid;},addEventListener(name,fn){handlers[name]=fn;},dispatchEvent(){events++;},reset(){resets++;}};
  class FakeFormData { *[Symbol.iterator](){yield* Object.entries(fields);} }
  runInNewContext(script,{AbortController,URLSearchParams,FormData:FakeFormData,CustomEvent:class{},setTimeout(fn,ms){assert.equal(ms,30000);timer=fn;return 1;},clearTimeout(){cleared=true;},fetch(url,options){fetches++;signal=options.signal;return fetchImpl(url,options);},document:{documentElement:{lang},getElementById(id){return id==='ctForm'?form:id==='ctSend'?button:status;}}});
  return {status,button,get resets(){return resets;},get events(){return events;},get fetches(){return fetches;},get focused(){return focused;},get cleared(){return cleared;},get signal(){return signal;},timeout(){timer();},submit(){return handlers.submit({preventDefault(){}});}};
}
test('accepted requests reset once and acknowledge in each supported language',async()=>{
  for(const lang of ['fr','en','ar']){const f=fixture({lang});await f.submit();assert.equal(f.resets,1);assert.equal(f.events,1);assert.equal(f.cleared,true);assert.equal(f.focused,true);await f.submit();assert.equal(f.fetches,1);}
});
test('HTTP and network failures keep text and enable retry',async()=>{
  for(const fetchImpl of [async()=>({ok:false}),async()=>{throw new Error('Network failed');}]){const f=fixture({fetchImpl});await f.submit();assert.equal(f.resets,0);assert.equal(f.events,0);assert.equal(f.button.disabled,false);assert.equal(f.cleared,true);assert.match(f.status.textContent,/could not be confirmed/);await f.submit();assert.equal(f.fetches,2);}
});
test('a stalled request is aborted, retains text and releases the send control',async()=>{
  const f=fixture({fetchImpl:(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Aborted'))))});
  const pending=f.submit();assert.equal(f.button.disabled,true);f.timeout();await pending;assert.equal(f.signal.aborted,true);assert.equal(f.button.disabled,false);assert.equal(f.resets,0);assert.equal(f.events,0);assert.equal(f.cleared,true);assert.equal(f.focused,true);
});
test('a response arriving after timeout never clears the enquiry or acknowledges success',async()=>{
  let resolve;const f=fixture({fetchImpl:()=>new Promise(r=>{resolve=r;})});const pending=f.submit();f.timeout();resolve({ok:true});await pending;assert.equal(f.resets,0);assert.equal(f.events,0);assert.equal(f.button.disabled,false);
});
test('repeated clicks during an active request create only one send',async()=>{
  let resolve;const f=fixture({fetchImpl:()=>new Promise(r=>{resolve=r;})});const pending=f.submit();await f.submit();assert.equal(f.fetches,1);resolve({ok:true});await pending;
});
test('invalid or honeypot forms never send',async()=>{
  for(const opts of [{valid:false},{fields:{name:'Test',message:'Enquiry',website:'robot'}}]){const f=fixture(opts);await f.submit();assert.equal(f.fetches,0);assert.equal(f.resets,0);}
});
