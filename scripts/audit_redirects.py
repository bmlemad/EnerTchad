#!/usr/bin/env python3
from pathlib import Path
import json, re, sys
ROOT=Path(__file__).resolve().parents[1]
cfg=ROOT/'vercel.json'
if not cfg.exists(): sys.exit('vercel.json absent')
v=json.loads(cfg.read_text(encoding='utf-8'))
files={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts}
def exists(path):
    path=(path.split('#',1)[0].split('?',1)[0] or '/').lstrip('/')
    c={path,path.rstrip('/')+'/index.html',path+'.html'}
    if path.endswith('/index'): c.add(path[:-6]+'/index.html')
    if path.endswith('/'): c.add(path+'index.html')
    return any(x in files for x in c)
sources={}; duplicates=[]; self_redirects=[]; chains=[]; missing=[]
for item in v.get('redirects',[]):
    src=item.get('source','').strip(); dst=item.get('destination','').strip()
    if not src or not dst: continue
    if src in sources: duplicates.append(src)
    sources[src]=dst
    if src==dst: self_redirects.append(src)
for src,dst in sources.items():
    if re.search(r'[:*+()]',dst) or dst.startswith(('http://','https://')): continue
    target=dst.split('#',1)[0]
    if target in sources: chains.append((src,dst))
    elif not exists(dst): missing.append((src,dst))
lines=['# Audit des redirections — 2026','',f'- Redirections déclarées : **{len(sources)}**',f'- Sources dupliquées : **{len(duplicates)}**',f'- Auto-redirections : **{len(self_redirects)}**',f'- Chaînes détectées : **{len(chains)}**',f'- Destinations statiques introuvables : **{len(missing)}**','', 'Les chaînes sont signalées pour optimisation mais restent compatibles avec des alias historiques.']
for title,items in [('Sources dupliquées',sorted(set(duplicates))),('Auto-redirections',self_redirects),('Chaînes de redirection',[f'{a} → {b}' for a,b in chains]),('Destinations statiques introuvables',[f'{a} → {b}' for a,b in missing])]:
    if items: lines += ['',f'## {title}','']+[f'- `{x}`' for x in items[:200]]
report=ROOT/'reports/redirects-audit-2026.md'; report.parent.mkdir(exist_ok=True); report.write_text('\n'.join(lines)+'\n',encoding='utf-8')
if duplicates or self_redirects: sys.exit('Erreur structurelle dans les redirections')
print(f'OK: {len(sources)} redirections; chaînes={len(chains)}; destinations introuvables={len(missing)}')
