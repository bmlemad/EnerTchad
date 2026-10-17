const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {execFileSync}=require('node:child_process');
const vm=require('node:vm');
for(const lang of ['', '-en']) {
 const original=readFileSync(`aval/boutique${lang}.html`,'utf8');
 const source=execFileSync('python3',['-c',`import sys;sys.path.insert(0,'scripts');from align_catalogue_quantity import patch;print(patch(sys.stdin.read(),${lang ? 'True' : 'False'}))`],{input:original,maxBuffer:20e6}).toString();
 test(`inline catalogue scripts parse (${lang||'fr'})`,()=>{
  for(const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
   if(!/^<script[^>]*type=/.test(match[0])) new vm.Script(match[1]);
  }
 });
 const add=source.match(/function add\(id\)\{[\s\S]*?\nfunction rm/)[0].replace(/\nfunction rm$/, '');
 function run(value, initial=0) {
  let message='', reports=0, renders=0;
  const input={value,setCustomValidity(m){message=m},reportValidity(){reports++;return !message;}};
  const cart=initial?{'0:0':{id:0,q:initial,pack:'litre'}}:{};
  const p=[];p[11]=['litre'];p[5]='litre';
  const context={document:{getElementById(id){return id==='q0'?input:id==='pk0'?{value:'litre'}:{};}},P:[p],cart,renderCart(){renders++},window:{innerWidth:1200}};
  vm.runInNewContext(add+';add(0);',context);
  return {cart,message,reports,renders};
 }
 test(`invalid quantities preserve selection (${lang||'fr'})`,()=>{
  for(const value of ['', '0','-3','1.5','9007199254740992','NaN']){
   const r=run(value,2);assert.equal(r.cart['0:0'].q,2);assert.equal(r.renders,0);assert.ok(r.message);assert.equal(r.reports,1);
  }
 });
 test(`valid quantities add and accumulate (${lang||'fr'})`,()=>{
  assert.equal(run('3').cart['0:0'].q,3);assert.equal(run('3',2).cart['0:0'].q,5);
 });
 test(`unsafe accumulated total preserves selection (${lang||'fr'})`,()=>{
  const r=run('1',Number.MAX_SAFE_INTEGER);assert.equal(r.cart['0:0'].q,Number.MAX_SAFE_INTEGER);assert.equal(r.renders,0);assert.ok(r.message);
 });
}
