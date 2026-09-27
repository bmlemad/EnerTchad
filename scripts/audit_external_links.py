#!/usr/bin/env python3
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import re, ssl
ROOT=Path(__file__).resolve().parents[1]
urls=set()
for p in ROOT.rglob('*.html'):
    if any(x in p.parts for x in {'.git','node_modules','reports'}): continue
    urls.update(re.findall(r'''(?:href|src)=["'](https?://[^"']+)["']''',p.read_text(encoding='utf-8',errors='ignore'),re.I))
for p in [ROOT/'robots.txt',ROOT/'sitemap.xml']:
    if p.exists(): urls.update(re.findall(r'''https?://[^\\s<>"']+''',p.read_text(encoding='utf-8',errors='ignore')))
site='enertchad-delta.vercel.app'
targets=sorted(u.split('#',1)[0] for u in urls if urlparse(u).scheme in {'http','https'} and urlparse(u).netloc!=site)
ctx=ssl._create_unverified_context(); failed=[]
for u in targets:
    try:
        with urlopen(Request(u,headers={'User-Agent':'EnerTchad-QA/2026'},method='HEAD'),timeout=12,context=ctx) as r: code=r.status
    except Exception:
        try:
            with urlopen(Request(u,headers={'User-Agent':'EnerTchad-QA/2026'},method='GET'),timeout=12,context=ctx) as r: code=r.status
        except Exception as e: failed.append((u,type(e).__name__)); continue
    if code>=400: failed.append((u,code))
out=ROOT/'reports'/'external-links-audit-2026.md'; out.parent.mkdir(exist_ok=True)
out.write_text('# Audit des liens externes — 2026\n\n'+f'- URLs externes détectées : **{len(targets)}**\n- Échecs : **{len(failed)}**\n',encoding='utf-8')
print(f'checked={len(targets)} failed={len(failed)}')
raise SystemExit(1 if failed else 0)
