#!/usr/bin/env python3
"""Pages anglaises : séparateur de milliers en virgule et pourcentage collé au nombre (texte visible uniquement)."""
import re,sys,os,glob
root=sys.argv[1]; apply='--apply' in sys.argv
TOK=re.compile(r'(<!--.*?-->|<(script|style|pre|code|svg|textarea)\b.*?</\2>|<[^>]*>)',re.S|re.I)
TH=re.compile(r'(?<![\d.,])\d{1,3}(?:[   ]\d{3})+(?!\d)')
PC=re.compile(r'(\d)[   ]%')
def fix(s):
    s=TH.sub(lambda m:re.sub(r'[   ]',',',m.group(0)),s)
    return PC.sub(r'\1%',s)
tot=0;nf=0
for f in sorted(glob.glob(os.path.join(root,'**','*-en.html'),recursive=True)):
    rel=os.path.relpath(f,root)
    if re.search(r'(^|/)(essentiel|investor-center)-en\.html$',rel) or rel.startswith(('node_modules','out','docs-sources')): continue
    t=open(f,encoding='utf8').read();parts=TOK.split(t);out=[];n=0;i=0
    while i<len(parts):
        seg=parts[i];new=fix(seg)
        if new!=seg: n+=len(TH.findall(seg))+len(PC.findall(seg))
        out.append(new)
        if i+2<len(parts): out.append(parts[i+1])
        i+=3
    if n:
        tot+=n;nf+=1
        if apply: open(f,'w',encoding='utf8').write(''.join(out))
print(tot,'nombres corriges dans',nf,'pages anglaises')
