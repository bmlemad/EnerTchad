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
test('display settings stay in footer on mobile and restore on desktop',()=>{
 const classes=new Set(['lum-in-menu']);const ctl={parentNode:null,classList:{contains:n=>classes.has(n),add:n=>classes.add(n),remove:n=>classes.delete(n),toggle(n,on){on?classes.add(n):classes.delete(n)}}};
 const body={appendChild(el){el.parentNode=this}},footer={appendChild(el){el.parentNode=this}},panel={hidden:false};
 ctl.parentNode={};const media={};
 function matchMedia(q){return media[q]||(media[q]={matches:true,addEventListener(_,f){this.listener=f}})}
 const document={documentElement:{lang:'fr'},body,readyState:'complete',getElementById:id=>id==='lum-ctl'?ctl:id==='lum-panel'?panel:null,querySelector:s=>s==='footer'?footer:{}};
 vm.runInNewContext(fs.readFileSync('scripts/visual-polish.js','utf8'),{document,matchMedia});
 assert.equal(ctl.parentNode,footer);assert.equal(panel.hidden,true);assert.ok(!classes.has('lum-in-menu'));
 media['(max-width:900px)'].matches=false;media['(max-width:900px)'].listener();assert.equal(ctl.parentNode,body);
 media['(max-width:900px)'].matches=true;media['(max-width:900px)'].listener();assert.equal(ctl.parentNode,footer);
 body.appendChild(ctl);media['(max-width:760px)'].listener();assert.equal(ctl.parentNode,footer);
});

test('English display presets are localized without changing their values',()=>{
 for(const lang of ['en','fr']){
  const presets=[{dataset:{l:'88'},textContent:'Sombre'},{dataset:{l:'100'},textContent:'Standard'},{dataset:{l:'116'},textContent:'Clair'}];
  const theme={title:'Basculer lecture claire / sombre'};const panel={querySelectorAll:()=>presets};
  const document={documentElement:{lang},readyState:'complete',getElementById:id=>id==='lum-panel'?panel:id==='etThemeBtn'?theme:null,querySelector:()=>null};
  vm.runInNewContext(fs.readFileSync('scripts/visual-polish.js','utf8'),{document});
  assert.deepEqual(presets.map(b=>b.textContent),lang==='en'?['Dim','Standard','Bright']:['Sombre','Standard','Clair']);
  assert.deepEqual(presets.map(b=>b.dataset.l),['88','100','116']);
  assert.equal(theme.title,lang==='en'?'Switch light / dark mode':'Basculer lecture claire / sombre');
 }
});
