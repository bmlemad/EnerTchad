#!/usr/bin/env python3
from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/"reports"/"benchmark-site-2026.md"
pages=[p for p in ROOT.rglob("*.html") if not any(x in p.parts for x in {".git","node_modules","reports"})]
def local_size(url):
    clean=url.split("?",1)[0].split("#",1)[0]
    if not clean.startswith("/"): return None
    p=ROOT/clean.lstrip("/")
    return p.stat().st_size if p.is_file() else None
rows=[]; css_files=set(); js_files=set(); tot_html=tot_css=tot_js=0
for p in pages:
    s=p.read_text(encoding="utf-8",errors="ignore"); rel=p.relative_to(ROOT).as_posix()
    title=re.search(r"<title\b[^>]*>(.*?)</title>",s,re.I|re.S)
    canonical=re.search(r"<link\\b[^>]*rel=[\"']canonical[\"'][^>]*href=[\"']([^\"']+)",s,re.I)
    h1=re.findall(r"<h1\b[^>]*>(.*?)</h1>",s,re.I|re.S); css=js=0
    for m in re.finditer(r"<link\\b[^>]*href=[\"']([^\"']+\\.css(?:\\?[^\"']*)?)[\"'][^>]*>",s,re.I):
        n=local_size(m.group(1))
        if n is not None: css+=n; css_files.add(m.group(1).split("?",1)[0])
    for m in re.finditer(r"<script\\b[^>]*src=[\"']([^\"']+\\.js(?:\\?[^\"']*)?)[\"'][^>]*>",s,re.I):
        n=local_size(m.group(1))
        if n is not None: js+=n; js_files.add(m.group(1).split("?",1)[0])
    hs=p.stat().st_size; tot_html+=hs; tot_css+=css; tot_js+=js
    rows.append((rel,hs,css,js,bool(title and title.group(1).strip()),len(h1),bool(canonical)))
rows.sort(key=lambda x:-(x[1]+x[2]+x[3]))
sitemap=ROOT/"sitemap.xml"; sitemap_urls=len(re.findall(r"<loc>",sitemap.read_text(encoding="utf-8",errors="ignore"),re.I)) if sitemap.exists() else 0
redirects=0; v=ROOT/"vercel.json"
if v.exists():
    try: redirects=len(json.loads(v.read_text(encoding="utf-8")).get("redirects",[]))
    except Exception: pass
lines=["# Benchmark technique du site — 2026","",
"Rapport objectif destiné au suivi de qualité. Aucun score global ni classement n'est produit.","",
"## Indicateurs dépôt","",
"- Pages HTML : **"+str(len(pages))+"**",
"- HTML cumulé : **"+format(tot_html/1024,".1f")+" KiB**",
"- CSS local référencé : **"+format(tot_css/1024,".1f")+" KiB**",
"- JS local référencé : **"+format(tot_js/1024,".1f")+" KiB**",
"- Fichiers CSS distincts référencés : **"+str(len(css_files))+"**",
"- Fichiers JS distincts référencés : **"+str(len(js_files))+"**",
"- URLs sitemap : **"+str(sitemap_urls)+"**",
"- Redirections Vercel déclarées : **"+str(redirects)+"**","",
"## Plus gros parcours HTML + CSS + JS local","","| Page | HTML | CSS référencé | JS référencé |","|---|---:|---:|---:|"]
for rel,hs,css,js,_,_,_ in rows[:15]: lines.append("| "+rel+" | "+format(hs/1024,".1f")+" KiB | "+format(css/1024,".1f")+" KiB | "+format(js/1024,".1f")+" KiB |")
lines += ["","## Garde-fous éditoriaux/SEO","",
"- Pages avec title non vide : **"+str(sum(r[4] for r in rows))+"/"+str(len(rows))+"**",
"- Pages avec exactement un H1 : **"+str(sum(r[5]==1 for r in rows))+"/"+str(len(rows))+"**",
"- Pages avec canonical détectable : **"+str(sum(r[6] for r in rows))+"/"+str(len(rows))+"**",
"","## Mesures navigateur","",
"- LCP : cible Core Web Vitals ≤ 2,5 s au 75e percentile.",
"- INP : cible ≤ 200 ms au 75e percentile.",
"- CLS : cible ≤ 0,1 au 75e percentile.",
"- Les résultats lab Lighthouse et les données terrain doivent être distingués.",
"","## Priorités","",
"1. Examiner les parcours les plus lourds avant toute suppression de CSS/JS.",
"2. Mesurer desktop et mobile avec Lighthouse en environnement reproductible.",
"3. Corréler ensuite avec des données terrain si disponibles.",
"4. Ne modifier que les ressources dont l'impact et les dépendances sont établis."]
REPORT.parent.mkdir(exist_ok=True); REPORT.write_text("\n".join(lines)+"\n",encoding="utf-8")
print("OK: benchmark généré pour "+str(len(pages))+" pages")
