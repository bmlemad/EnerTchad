"""Give the five-item mobile navigation equal space and accessible short labels."""
import html
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
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
    new=re.sub(r'<nav\b[^>]*\bid="nezBar"[^>]*>.*?</nav>',bar,text,flags=re.S)
    if 'et-mobile-label-long' in new and '/assets/chrome/mobile-quick-nav.css' not in new:
        new=new.replace('</head>','<link rel="stylesheet" href="/assets/chrome/mobile-quick-nav.css?b=2026101403"></head>',1)
    return new

def main():
    count=0
    for p in ROOT.rglob('*.html'):
        if any(x in {'.git','.next','out','node_modules','public','reports','qa'} for x in p.relative_to(ROOT).parts):continue
        old=p.read_text();new=transform(old)
        if old!=new:p.write_text(new);count+=1
    print(f'Mobile quick navigation aligned: {count} source pages')

if __name__=='__main__':main()
