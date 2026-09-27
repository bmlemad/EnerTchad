#!/usr/bin/env python3
"""Analyse des coûts CSS/JS référencés par parcours HTML."""
from pathlib import Path
import re
from collections import defaultdict

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/"reports"/"resource-cost-audit-2026.md"
pages=[p for p in ROOT.rglob("*.html") if not any(x in p.parts for x in {".git","node_modules","reports"})]

def local(url):
    u=url.split("?",1)[0].split("#",1)[0]
    if not u.startswith("/"): return None
    p=ROOT/u.lstrip("/")
    return p if p.is_file() else None

usage=defaultdict(set); sizes={}; kinds={}; page_totals=[]
for p in pages:
    s=p.read_text(encoding="utf-8",errors="ignore")
    rel=p.relative_to(ROOT).as_posix(); total=0
    for pat in [r'<link\b[^>]*href=["\']([^"\']+\.css(?:\?[^"\']*)?)["\'][^>]*>', r'<script\b[^>]*src=["\']([^"\']+\.js(?:\?[^"\']*)?)["\'][^>]*>']:
        for m in re.finditer(pat,s,re.I):
            q=local(m.group(1))
            if q:
                key=q.relative_to(ROOT).as_posix(); sizes[key]=q.stat().st_size; kinds[key]="JS" if q.suffix.lower()==".js" else "CSS"; usage[key].add(rel); total+=q.stat().st_size
    page_totals.append((total,rel))
page_totals.sort(reverse=True)
rows=sorted(((sizes[k],k,len(v)) for k,v in usage.items()),reverse=True)
lines=["# Audit des coûts CSS/JS — 2026","","Analyse statique des ressources locales réellement référencées.","","## Ressources les plus lourdes","","| Ressource | Type | Taille | Pages |","|---|---|---:|---:|"]
for n,k,c in rows[:50]: lines.append("| `{}` | {} | {:.1f} KiB | {} |".format(k,kinds[k],n/1024,c))
lines += ["","## Parcours les plus lourds","","| Page | CSS/JS local référencé |","|---|---:|"]
for n,k in page_totals[:40]: lines.append("| `{}` | {:.1f} KiB |".format(k,n/1024))
lines += ["","## Méthode","","- Aucun asset n’est supprimé automatiquement.","- Les ressources partagées sont conservées jusqu’à analyse des dépendances.","- La validation finale utilise Lighthouse navigateur."]
REPORT.parent.mkdir(exist_ok=True); REPORT.write_text("\n".join(lines)+"\n",encoding="utf-8")
print("OK: {} ressources analysées sur {} pages".format(len(sizes),len(pages)))