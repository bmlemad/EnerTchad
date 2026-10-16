"""Repair navigation behavior in existing assets and native source templates."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HELPERS=Path(__file__).with_name('search-navigation-accessibility.js').read_text()
START='  /* et-search-accessibility:start */'
END='  /* et-search-accessibility:end */'

def replace_once(text,old,new):
    if text.count(old)!=1:raise ValueError('Search source boundary changed: '+old[:70])
    return text.replace(old,new,1)

def transform_search(text):
    if START in text:
        text=re.sub(re.escape(START)+r'.*?'+re.escape(END),lambda _:HELPERS.rstrip(),text,flags=re.S)
        return text.replace("input.removeAttribute('aria-activedescendant');searchAnnounce(0);res.innerHTML=",'searchSelection();res.innerHTML=')
    text=replace_once(text,'  if(!modal)return;','  if(!modal)return;\n'+HELPERS.rstrip())
    text=replace_once(text,'role="option" data-i="${i}"','role="option" id="cmdk-option-${i}" tabindex="-1" data-i="${i}"')
    text=replace_once(text,'    res.innerHTML=html;','    res.innerHTML=html;searchSelection();')
    text=replace_once(text,'if(!current.length){res.innerHTML=',"if(!current.length){searchSelection();res.innerHTML=")
    text=replace_once(text,"function open(){modal.style.display='flex';input.value='';current=idx.slice();active=0;render();setTimeout(()=>input.focus(),30);}","function open(){if(modal.style.display==='flex'){input.focus();return;}searchLock();modal.style.display='flex';input.value='';current=idx.slice();active=0;render();setTimeout(()=>{if(modal.style.display==='flex')input.focus();},30);}")
    text=replace_once(text,"function close(){modal.style.display='none';var b=document.getElementById('navSearch');if(b)b.focus({preventScroll:true});}","function close(){modal.style.display='none';ftxSeq++;searchUnlock();}")
    text=replace_once(text,"    if(e.key==='Escape')close();\n    else if(e.key==='ArrowDown')", "    if(e.key==='Tab'){searchTrap(e);return;}\n    if(e.key==='Escape'){e.preventDefault();close();return;}\n    if(e.target!==input)return;\n    if(e.key==='ArrowDown')")
    return text

def main():
    for name in ['c_abd9013c3955.js','c_df4f446df566.js']:
        path=ROOT/'assets/chrome'/name
        old=path.read_text();new=transform_search(old)
        if old!=new:path.write_text(new)
    native=ROOT/'lib/strategic.jsx'
    old=native.read_text()
    pattern=r"\['mailto:[^']+', en \? 'Investor contact' : 'Contact investisseur', true\]"
    replacement="[`/contact${suffix}?profil=invest#ctForm`, en ? 'Investor contact' : 'Contact investisseur', true]"
    new,count=re.subn(pattern,lambda _:replacement,old)
    if not count and replacement not in old:raise ValueError('Native investor navigation changed')
    if old!=new:native.write_text(new)
    count=0
    for path in ROOT.rglob('*.html'):
        if any(p in {'.git','.next','out','public','node_modules','reports','qa'} for p in path.relative_to(ROOT).parts):continue
        old=path.read_text()
        new=re.sub(r'/assets/chrome/(c_abd9013c3955|c_df4f446df566)\.js(?:\?[^"\'<>\s]+)?',r'/assets/chrome/\1.js?b=2026101601',old)
        if old!=new:path.write_text(new);count+=1
    print(f'Navigation accessibility aligned: 2 search bundles, native header, {count} source references')

if __name__=='__main__':main()
