"""Apply shared glass materials without adding a blocking stylesheet."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
START='/* et-liquid-glass:start */'
END='/* et-liquid-glass:end */'

def main():
    # Declare the important material layer before the legacy `verre` layer.
    head=ROOT/'assets/chrome/bundle_head_b2.css'
    content=head.read_text()
    if not content.startswith('@layer et-glass;'):
        head.write_text('@layer et-glass;\n'+content)
    asset=ROOT/'assets/chrome/premium-chrome.css'
    old=asset.read_text()
    block=START+'\n'+Path(__file__).with_name('liquid-glass.css').read_text()+'\n'+END
    new=re.sub(re.escape(START)+r'.*?'+re.escape(END),lambda _:block,old,flags=re.S) if START in old else old+'\n'+block+'\n'
    if old!=new:asset.write_text(new)
    # Native strategic pages load their existing investor sheet instead.
    investor=ROOT/'assets/chrome/investor-premium.css'
    old=investor.read_text()
    new=re.sub(re.escape(START)+r'.*?'+re.escape(END),lambda _:block,old,flags=re.S) if START in old else old+'\n'+block+'\n'
    if not new.startswith('@layer et-glass;'):
        new='@layer et-glass;\n'+new
    if old!=new:investor.write_text(new)
    count=0
    for page in ROOT.rglob('*.html'):
        if any(p in {'.git','.next','out','public','node_modules','reports','qa'} for p in page.relative_to(ROOT).parts):continue
        old=page.read_text()
        new=re.sub(r'/assets/chrome/premium-chrome\.css(?:\?[^"\'<>\s]+)?','/assets/chrome/premium-chrome.css?b=2026101506',old)
        new=re.sub(r'/assets/chrome/bundle_head_b2\.css(?:\?[^"\'<>\s]+)?','/assets/chrome/bundle_head_b2.css?b=2026101506',new)
        new=re.sub(r'/assets/chrome/investor-premium\.css(?:\?[^"\'<>\s]+)?','/assets/chrome/investor-premium.css?b=2026101506',new)
        if old!=new:page.write_text(new);count+=1
    print(f'Glass materials aligned: {count} source pages')

if __name__=='__main__':main()
