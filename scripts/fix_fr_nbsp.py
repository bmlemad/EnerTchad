#!/usr/bin/env python3
"""Espace insécable avant : ; ? ! » et après « dans le texte visible des pages françaises (convention du site : U+00A0)."""
import re,sys,os,glob
root=sys.argv[1]; apply='--apply' in sys.argv
SKIP=re.compile(r'(^|/)(essentiel|investor-center)(-en)?\.html$|-en\.html$|(^|/)ar-[^/]*\.html$')
TOK=re.compile(r'(<!--.*?-->|<(script|style|pre|code|svg|title|textarea)\b.*?</\2>|<[^>]*>)',re.S|re.I)
N=' '
def fix_text(s,first):
    s=re.sub(r'(?<=\S) +(?=[:;?!»])',N,s)
    s=re.sub(r'^ +(?=[:;?!»])',N,s) if not first else s
    s=re.sub(r'«(?: | )+',  '«'+N, s)
    s=re.sub(r'«(?=[^\s<])','«'+N,s) if False else s
    return s
tot=0;files=[]
for f in sorted(glob.glob(os.path.join(root,'**','*.html'),recursive=True)):
    rel=os.path.relpath(f,root)
    if SKIP.search(rel) or rel.startswith(('node_modules','out','docs-sources')): continue
    t=open(f,encoding='utf8').read()
    parts=TOK.split(t); out=[];n=0
    # re.split avec 2 groupes : [texte, tag, nom, texte, ...]
    i=0
    while i<len(parts):
        seg=parts[i]
        new=fix_text(seg,i==0)
        if new!=seg: n+=len(re.findall(r' ',new))-len(re.findall(r' ',seg))
        out.append(new)
        if i+2<len(parts): out.append(parts[i+1])
        i+=3
    if n:
        files.append((rel,n));tot+=n
        if apply: open(f,'w',encoding='utf8').write(''.join(out))
print(tot,'espaces corrigees dans',len(files),'fichiers')
if '--list' in sys.argv:
    for r,n in files: print(n,r)
