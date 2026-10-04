#!/usr/bin/env python3
"""Audit des routes internes : liens cassés et pages HTML sans entrée détectable."""
from pathlib import Path
from collections import defaultdict
from urllib.parse import urlsplit
import posixpath
import re

ROOT=Path(__file__).resolve().parents[1]
PAGES=sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "reports" not in p.parts)
ROUTED={"/plan-du-site","/accessibilite","/amont/calculateur-baril-additionnel","/configurateur-service-integre"}
SKIP={"404.html","google9146d41010c5e702.html"}

def normalize(href, source):
    href=href.strip()
    if not href or href.startswith(("#","mailto:","tel:","javascript:","data:")): return None
    u=urlsplit(href)
    if u.scheme or u.netloc: return None
    path=u.path or "/"
    if not path.startswith("/"):
        path = posixpath.normpath(posixpath.join("/" + posixpath.dirname(source), path))
        if not path.startswith("/"):
            path = "/" + path
    return path.rstrip("/") or "/"

def resolve(path):
    if path in ROUTED: return True
    if path=="/": return (ROOT/"index.html").exists()
    return (ROOT/(path.lstrip("/")+".html")).exists() or (ROOT/(path.lstrip("/")+"/index.html")).exists()

incoming=defaultdict(list); broken=[]
for page in PAGES:
    rel=page.relative_to(ROOT).as_posix()
    text=page.read_text(encoding="utf-8",errors="ignore")
    for m in re.finditer(r'<a\b[^>]*\bhref\s*=\s*["\']([^"\']+)["\']',text,re.I):
        target=normalize(m.group(1),rel)
        if target is None: continue
        if not resolve(target): broken.append((rel,target))
        else: incoming[target].append(rel)

orphans=[]
for page in PAGES:
    rel=page.relative_to(ROOT).as_posix()
    if rel in SKIP: continue
    route="/" if rel=="index.html" else "/" + rel[:-5].rstrip("/")
    if route not in incoming: orphans.append(rel)

out=["# EnerTchad — audit routes internes 2026","",f"Pages HTML analysées : **{len(PAGES)}**","",f"Liens internes cassés : **{len(broken)}**","", "## Liens cassés",""]
out += [f"- `/{src}` → `{dst}`" for src,dst in broken[:200]] or ["Aucun."]
out += ["","## Candidats sans lien entrant détectable","", "Un candidat orphelin n'est pas nécessairement une erreur : certaines pages sont des destinations profondes, des outils ou des pages accessibles par script/navigation dynamique.",""]
out += [f"- `/{p}`" for p in orphans[:200]] or ["Aucun."]
(ROOT/"reports").mkdir(exist_ok=True)
(ROOT/"reports"/"routes-audit-2026.md").write_text("\n".join(out)+"\n",encoding="utf-8")
print(f"Routes audit: {len(broken)} broken internal links; {len(orphans)} orphan candidates.")
