const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const source=fs.readFileSync('assets/chrome/coherence-20261013.js','utf8');
const original="if(react)d.classList.toggle('sp-dark',on);else d.classList.toggle(K,!on);";
const replacement="if(react)d.classList.toggle('sp-dark',on);else{d.classList.toggle('et-plight',!on);d.classList.toggle('et-jlight',!on);}";
const code=source.replace(original,replacement).match(/function set\(on\)\{([\s\S]*?)\n  \}/)[1];
test('dark and light switch both legacy theme classes together',()=>{
 for(const initial of [[],['et-plight'],['et-jlight'],['et-plight','et-jlight']]){
  const classes=new Set(initial);const d={classList:{toggle(n,on){on?classes.add(n):classes.delete(n)}}};
  const context={d,react:false,localStorage:{setItem(){}},sync(){}};
  vm.runInNewContext('function set(on){'+code+'};set(true);',context);assert.equal(classes.has('et-plight'),false);assert.equal(classes.has('et-jlight'),false);
  vm.runInNewContext('set(false);',context);assert.ok(classes.has('et-plight'));assert.ok(classes.has('et-jlight'));
 }
});
test('native React theme remains independent',()=>{const classes=new Set();const context={d:{classList:{toggle(n,on){on?classes.add(n):classes.delete(n)}}},react:true,localStorage:{setItem(){}},sync(){}};vm.runInNewContext('function set(on){'+code+'};set(true);',context);assert.deepEqual([...classes],['sp-dark']);});
