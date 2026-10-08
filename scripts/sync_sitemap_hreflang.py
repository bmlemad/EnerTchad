#!/usr/bin/env python3
"""Aligne les xhtml:link du sitemap sur les balises hreflang de chaque page."""
import re,sys,os
root=sys.argv[1]; apply='--apply' in sys.argv
sm=os.path.join(root,'sitemap.xml'); t=open(sm,encoding='utf8').read()
def page(loc):
    p=loc.replace('https://enertchad.com','').strip('/')
    cands=[p+'.html',p+'/index.html'] if p else ['index.html']
    for c in cands:
        f=os.path.join(root,c)
        if os.path.exists(f): return f
changed=[]
def fix(m):
    u=m.group(0); loc=re.search(r'<loc>(.*?)</loc>',u).group(1)
    f=page(loc)
    if not f: return u
    h=open(f,encoding='utf8').read()
    alts=re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"',h)
    if not alts: return u
    new=''.join('<xhtml:link rel="alternate" hreflang="%s" href="%s"/>'%a for a in sorted(set(alts),key=lambda a:(a[0]=='x-default',a[0])))
    old=''.join(re.findall(r'<xhtml:link[^>]*/>',u))
    norm=lambda s:sorted(re.findall(r'hreflang="([^"]+)" href="([^"]+)"',s))
    if norm(old)==norm(new): return u
    changed.append(loc)
    u2=re.sub(r'(<xhtml:link[^>]*/>)+',new,u,count=1) if old else u.replace('</url>',new+'</url>')
    return u2
t2=re.sub(r'<url>.*?</url>',fix,t,flags=re.S)
print(len(changed),'URL a realigner');[print(' ',c) for c in changed]
if apply: open(sm,'w',encoding='utf8').write(t2)
