"""Give the five-item mobile navigation equal space and accessible short labels."""
import html
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CSS=Path(__file__).with_name('mobile-quick-nav.css').read_text()
SHORT={'Investisseurs':'Invest.', 'Fournisseurs':'Fourn.'}

def transform(text):
    def bar(match):
        block=match[0]
        if len(re.findall(r'<a\b',block))!=5:return block
        def anchor(match):
            opening,body,closing=match.groups()
            if 'et-mobile-label-long' in body:return match[0]
            icon=''.join(re.findall(r'<svg\b.*?</svg>',body,re.S))
            label=html.unescape(re.sub(r'<[^>]+>','',body)).strip()
            if not label:return match[0]
            if 'aria-label=' not in opening:
                opening=opening[:-1]+' aria-label="'+html.escape(label,quote=True)+'">'
            short=SHORT.get(label)
            classes='et-mobile-label-long'+(' et-has-short' if short else '')
            rendered=icon+'<span class="'+classes+'" aria-hidden="true">'+html.escape(label)+'</span>'
            if short:rendered+='<span class="et-mobile-label-short" aria-hidden="true">'+html.escape(short)+'</span>'
            return opening+rendered+closing
        return re.sub(r'(<a\b[^>]*>)(.*?)(</a>)',anchor,block,flags=re.S)
    text=re.sub(r'<link\b[^>]*href="/assets/chrome/mobile-quick-nav\.css[^"]*"[^>]*>', '', text)
    new=re.sub(r'<nav\b[^>]*\bid="nezBar"[^>]*>.*?</nav>',bar,text,flags=re.S)
    new=re.sub(r'<style\b[^>]*id="et-mobile-quick-nav"[^>]*>.*?</style>', '', new, flags=re.S)
    if 'et-mobile-label-long' in new:
        new=re.sub(r'/assets/chrome/premium-chrome\.css(?:\?[^"\'<>\s]+)?', '/assets/chrome/premium-chrome.css?b=2026101403', new)
    return new

def main():
    count=0
    for p in ROOT.rglob('*.html'):
        if any(x in {'.git','.next','out','node_modules','public','reports','qa'} for x in p.relative_to(ROOT).parts):continue
        old=p.read_text();new=transform(old)
        if old!=new:p.write_text(new);count+=1
    shared=ROOT/'assets/chrome/premium-chrome.css'
    old=shared.read_text()
    block='/* et-mobile-quick-nav:start */\n'+CSS+'\n/* et-mobile-quick-nav:end */'
    if '/* et-mobile-quick-nav:start */' in old:
        new=re.sub(r'/\* et-mobile-quick-nav:start \*/.*?/\* et-mobile-quick-nav:end \*/',block,old,flags=re.S)
    else:
        new=old+'\n'+block+'\n'
    if old!=new:shared.write_text(new)
    print(f'Mobile quick navigation aligned: {count} source pages')

if __name__=='__main__':main()
