import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./search-navigation-accessibility.js',import.meta.url),'utf8');

// Small DOM fixture for focus and inert restoration; browser QA covers rendering.
function fixture(){
  let doc;const timers=[];
  function element(tag,id=''){
    const attrs={};
    const e={tagName:tag,id,style:{},children:[],parentElement:null,inert:false,isConnected:true,disabled:false,
      tabIndex:['INPUT','BUTTON','A'].includes(tag)?0:-1,
      setAttribute(k,v){attrs[k]=String(v);},getAttribute(k){return attrs[k]??null;},removeAttribute(k){delete attrs[k];},
      appendChild(child){child.parentElement=this;this.children.push(child);return child;},
      replaceWith(child){const p=this.parentElement;child.parentElement=p;p.children[p.children.indexOf(this)]=child;},
      addEventListener(){},getClientRects(){return this.hidden?[]:[{}];},
      focus(){doc.activeElement=this;},matches(){return ['INPUT','BUTTON','A'].includes(tag)||'tabindex' in attrs;},
      closest(){for(let p=this;p;p=p.parentElement)if(p.inert)return p;return null;},
      contains(other){return this===other||this.children.some(c=>c.contains(other));},
      querySelector(q){if(q==='.cmdk-item.on')return this.option||null;return this.children.flatMap(c=>[c,...descendants(c)]).find(c=>q==='.cmdk-panel'?c.className==='cmdk-panel':q==='kbd'?c.tagName==='KBD':false)||null;},
      querySelectorAll(){return descendants(this).filter(c=>['INPUT','BUTTON','A'].includes(c.tagName));}
    };return e;
  }
  function descendants(e){return e.children.flatMap(c=>[c,...descendants(c)]);}
  const body=element('BODY');body.style.overflow='auto';
  const header=body.appendChild(element('HEADER'));
  const opener=header.appendChild(element('BUTTON','navSearch'));
  const wrapper=body.appendChild(element('DIV'));
  const main=wrapper.appendChild(element('MAIN'));
  const modal=wrapper.appendChild(element('DIV'));modal.style.display='none';
  const panel=modal.appendChild(element('DIV'));panel.className='cmdk-panel';
  const bar=panel.appendChild(element('DIV'));
  const input=bar.appendChild(element('INPUT','cmdk-input'));bar.appendChild(element('KBD'));
  const res=panel.appendChild(element('DIV','cmdk-results'));
  const footer=body.appendChild(element('FOOTER'));footer.inert=true;
  doc={body,activeElement:opener,createElement:tag=>element(tag.toUpperCase()),addEventListener(){},getElementById:id=>descendants(body).find(e=>e.id===id)||null};
  const context=vm.createContext({document:doc,modal,input,res,EN:false,current:[{},{}],close(){},getComputedStyle:()=>({visibility:'visible'}),setTimeout:fn=>{timers.push(fn);return timers.length-1;},clearTimeout:i=>{timers[i]=null;}});
  vm.runInContext(source,context);
  const run=code=>vm.runInContext(code,context);
  return {run,doc,body,header,wrapper,main,footer,opener,input,res,element,flush:()=>timers.forEach(fn=>fn?.())};
}

test('modal isolates siblings at every ancestor and restores prior inert and scroll states',()=>{
  const f=fixture();f.run('searchLock()');
  assert.equal(f.header.inert,true);assert.equal(f.main.inert,true);assert.equal(f.wrapper.inert,false);
  assert.equal(f.body.style.overflow,'hidden');
  f.run('searchUnlock()');
  assert.equal(f.header.inert,false);assert.equal(f.main.inert,false);assert.equal(f.footer.inert,true);
  assert.equal(f.body.style.overflow,'auto');assert.equal(f.doc.activeElement,f.opener);
});
test('Tab and Shift+Tab wrap between input and close without entering background',()=>{
  const f=fixture();f.run('searchLock();modal.style.display="flex";input.focus();searchTrap({shiftKey:true,preventDefault(){}})');
  assert.equal(f.doc.activeElement.className,'et-search-close');
  f.run('searchTrap({shiftKey:false,preventDefault(){}})');assert.equal(f.doc.activeElement,f.input);
});
test('active option is linked to input, then removed and zero results announced',()=>{
  const f=fixture();f.res.option=f.element('A','result-1');
  f.run('modal.style.display="flex";searchSelection()');
  assert.equal(f.input.getAttribute('aria-activedescendant'),'result-1');
  f.res.option=null;f.run('current=[];searchSelection()');f.flush();
  assert.equal(f.input.getAttribute('aria-activedescendant'),null);
  assert.equal(f.input.getAttribute('aria-expanded'),'false');
  assert.equal(f.res.getAttribute('role'),'region');
  assert.equal(f.run('searchStatus.textContent'),'0 résultats');
});
test('keyboard opening from body restores focus to a visible search control',()=>{
  const f=fixture();f.doc.activeElement=f.body;f.run('searchLock();searchUnlock()');
  assert.equal(f.doc.activeElement,f.opener);
});
