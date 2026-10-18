"""Keep keyboard navigation inside the existing mobile activities dialog."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
START,END='/* et-mobile-focus:start */','/* et-mobile-focus:end */'

def patch_js(source,code):
    source=re.sub(re.escape(START)+r'.*?'+re.escape(END)+r'\n?','',source,flags=re.S)
    if "s.id='nezSheet'" not in source:raise ValueError('Review activities dialog before applying focus handling')
    return source.rstrip()+'\n'+START+'\n'+code.rstrip()+'\n'+END+'\n'

def main():
    p=ROOT/'assets/chrome/nav_a.js';p.write_text(patch_js(p.read_text(),(ROOT/'scripts/mobile-sheet-focus.js').read_text()))
    excluded={'.git','.next','out','public','node_modules','reports','qa','docs','docs-sources','scripts'}
    for p in ROOT.rglob('*.html'):
        if any(x in excluded for x in p.relative_to(ROOT).parts):continue
        old=p.read_text();new=re.sub(r'/assets/chrome/nav_a\.js(?:\?[^"\'<>\s]+)?','/assets/chrome/nav_a.js?b=2026101801',old)
        if new!=old:p.write_text(new)
if __name__=='__main__':main()
