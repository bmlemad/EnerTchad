"""Apply the six reviewed visual corrections to shared and standalone layouts."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]

def block(source, name, code):
    start,end=f'/* {name}:start */',f'/* {name}:end */'
    source=re.sub(re.escape(start)+r'.*?'+re.escape(end)+r'\n?', '',source,flags=re.S)
    return source.rstrip()+'\n'+start+'\n'+code.rstrip()+'\n'+end+'\n'

def page_patch(source, kind=None):
    if kind:
        source=re.sub(r'<html\b([^>]*)>',lambda m:'<html'+re.sub(r' data-et-visual="[^"]*"','',m[1])+f' data-et-visual="{kind}">',source,count=1)
    source=re.sub(r'/assets/chrome/coherence-20261013\.js(?:\?[^"\'<>\s]+)?','/assets/chrome/coherence-20261013.js?b=2026101703',source)
    if kind=='config':
        source=re.sub(r'<style id="et-config-visual">.*?</style>\n?','',source,flags=re.S)
        source=source.replace('</body>','<style id="et-config-visual">'+(ROOT/'scripts/visual-polish.css').read_text()+(ROOT/'scripts/configurator-visual.css').read_text()+'</style>\n</body>')
    return source

def main():
    css=ROOT/'assets/chrome/premium-chrome.css';css.write_text(block(css.read_text(),'et-visual',(ROOT/'scripts/visual-polish.css').read_text()))
    js=ROOT/'assets/chrome/coherence-20261013.js';source=js.read_text()
    old="if(react)d.classList.toggle('sp-dark',on);else d.classList.toggle(K,!on);"
    new="if(react)d.classList.toggle('sp-dark',on);else{d.classList.toggle('et-plight',!on);d.classList.toggle('et-jlight',!on);}"
    if old not in source and new not in source:raise ValueError('Review theme setter structure')
    source=source.replace(old,new)
    js.write_text(block(source,'et-visual',(ROOT/'scripts/visual-polish.js').read_text()))
    kinds={'Configurateur_Service_Integre_v2.html':'config','enerconseils/index.html':'engineering','pole-enerconseils-en.html':'engineering','contact.html':'contact','contact-en.html':'contact'}
    excluded={'.git','.next','out','public','node_modules','reports','qa','docs','docs-sources','scripts'}
    for p in ROOT.rglob('*.html'):
        rel=p.relative_to(ROOT)
        if any(x in excluded for x in rel.parts):continue
        old=p.read_text();new=page_patch(old,kinds.get(str(rel)))
        if new!=old:p.write_text(new)
if __name__=='__main__':main()
