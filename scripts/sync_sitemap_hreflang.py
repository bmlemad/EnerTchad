#!/usr/bin/env python3
"""Aligne les xhtml:link du sitemap sur les balises hreflang de chaque page.
Option --lastmod : <lastmod> = date du dernier commit de la page (git), ou date du jour si la page
est modifiee dans l'arbre de travail."""
import re,sys,os,subprocess,datetime
root=sys.argv[1]; apply='--apply' in sys.argv; lastmod='--lastmod' in sys.argv
sm=os.path.join(root,'sitemap.xml'); t=open(sm,encoding='utf8').read()
def page(loc):
    p=loc.replace('https://enertchad.com','').strip('/')
    cands=[p+'.html',p+'/index.html'] if p else ['index.html']
    for c in cands:
        f=os.path.join(root,c)
        if os.path.exists(f): return f
changed=[]
def gitdate(f):
    rel=os.path.relpath(f,root)
    if subprocess.run(['git','-C',root,'diff','--quiet','HEAD','--',rel]).returncode: return datetime.date.today().isoformat()
    return subprocess.run(['git','-C',root,'log','-1','--format=%cs','--',rel],capture_output=True,text=True).stdout.strip()
def fix(m):
    u=m.group(0); loc=re.search(r'<loc>(.*?)</loc>',u).group(1)
    f=page(loc)
    if not f: return u
    if lastmod:
        d=gitdate(f); cur=re.search(r'<lastmod>(.*?)</lastmod>',u)
        if d and cur and d>cur.group(1): u=u.replace(cur.group(0),'<lastmod>%s</lastmod>'%d,1); changed.append(loc+' lastmod '+d)
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
