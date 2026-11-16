import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {withVisualPriorities} from '../lib/visual-priorities.js';
const html=withVisualPriorities(readFileSync('amont/index.html','utf8'));
const source=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('details[data-mobile-fold]'))?.[1];
function fixture(mobile,legacy=false){
  const folds=[{open:true},{open:true}];let listener;
  const media={matches:mobile,addListener(fn){listener=fn;}};
  if(!legacy)media.addEventListener=(event,fn)=>{assert.equal(event,'change');listener=fn;};
  vm.runInNewContext(source,{matchMedia:query=>{assert.equal(query,'(max-width:760px)');return media;},document:{querySelectorAll:()=>folds}});
  return {folds,change(mobile){media.matches=mobile;listener?.();}};
}
test('mobile folds reopen on desktop and keep reading state when returning to mobile',()=>{
  const f=fixture(true);assert(f.folds.every(d=>!d.open));
  f.folds[0].open=true;f.change(false);assert(f.folds.every(d=>d.open));
  f.change(true);assert(f.folds.every(d=>d.open));
  f.folds[0].open=false;f.change(false);assert(f.folds.every(d=>d.open));
});
test('desktop first load leaves all content open',()=>{
  const f=fixture(false);assert(f.folds.every(d=>d.open));
});
test('legacy media-query listeners also restore desktop content',()=>{
  const f=fixture(true,true);assert(f.folds.every(d=>!d.open));f.change(false);assert(f.folds.every(d=>d.open));
});
