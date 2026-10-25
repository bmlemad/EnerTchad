  /* et-search-accessibility:start */
  let searchOpener=null,searchInert=[],searchOverflow='',searchRootOverflow='',searchCount=-1,searchTimer;
  input.setAttribute('role','combobox');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-haspopup','listbox');
  input.setAttribute('aria-controls',res.id);
  input.setAttribute('aria-expanded','false');
  const searchStatus=document.createElement('div');
  searchStatus.className='et-nav-live';
  searchStatus.setAttribute('role','status');
  searchStatus.setAttribute('aria-live','polite');
  searchStatus.setAttribute('aria-atomic','true');
  modal.querySelector('.cmdk-panel').appendChild(searchStatus);
  const searchClose=document.createElement('button');
  searchClose.type='button';searchClose.className='et-search-close';
  searchClose.textContent='×';
  searchClose.setAttribute('aria-label',EN?'Close search':'Fermer la recherche');
  searchClose.title=EN?'Close search (Esc)':'Fermer la recherche (Échap)';
  const searchHint=input.parentElement.querySelector('kbd');
  if(searchHint)searchHint.replaceWith(searchClose);else input.parentElement.appendChild(searchClose);
  searchClose.addEventListener('click',()=>close());
  function searchAnnounce(count){
    if(count===searchCount)return;
    searchCount=count;clearTimeout(searchTimer);
    searchTimer=setTimeout(()=>{searchStatus.textContent=EN?count+' results':count+' résultats';},180);
  }
  function searchSelection(){
    res.setAttribute('role',current.length?'listbox':'region');
    input.setAttribute('aria-expanded',modal.style.display==='flex'&&current.length?'true':'false');
    const option=res.querySelector('.cmdk-item.on');
    if(option&&modal.style.display==='flex')input.setAttribute('aria-activedescendant',option.id);
    else input.removeAttribute('aria-activedescendant');
    searchAnnounce(current.length);
  }
  function searchLock(){
    searchOpener=document.activeElement;searchOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    // Lot 28 (M1) : html porte overflow-x:clip, le verrou doit aussi porter sur la racine.
    if(document.documentElement){searchRootOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';}
    let branch=modal;
    while(branch&&branch!==document.body){
      const parent=branch.parentElement;if(!parent)break;
      Array.from(parent.children).forEach(sibling=>{
        if(sibling!==branch&&!/^(SCRIPT|STYLE|LINK)$/.test(sibling.tagName)){
          searchInert.push([sibling,sibling.inert]);sibling.inert=true;
        }
      });branch=parent;
    }
    input.setAttribute('aria-expanded','true');
  }
  function searchUnlock(){
    searchInert.forEach(([element,wasInert])=>{element.inert=wasInert;});searchInert=[];
    document.body.style.overflow=searchOverflow;
    if(document.documentElement)document.documentElement.style.overflow=searchRootOverflow;
    input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');
    clearTimeout(searchTimer);searchStatus.textContent='';searchCount=-1;
    const candidates=[searchOpener,document.getElementById('navSearch'),document.getElementById('navTog')];
    const target=candidates.find(e=>e&&e.isConnected&&e.matches('a[href],button,input,select,textarea,[tabindex]')&&!e.disabled&&e.getClientRects().length&&!e.closest('[inert]'));
    if(target)target.focus({preventScroll:true});
  }
  function searchTrap(event){
    const items=Array.from(modal.querySelectorAll('a[href],button,input,[tabindex]')).filter(e=>
      !e.disabled&&e.tabIndex>=0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');
    const first=items[0]||input,last=items[items.length-1]||input;
    if(!modal.contains(document.activeElement)){event.preventDefault();first.focus();}
    else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
  document.addEventListener('focusin',event=>{
    if(modal.style.display==='flex'&&!modal.contains(event.target))input.focus();
  });
  /* et-search-accessibility:end */
