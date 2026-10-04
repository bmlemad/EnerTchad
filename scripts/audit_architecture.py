#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Audit cartographique de l'architecture EnerTchad.

Produit reports/site-architecture-2026.md sans modifier les pages.
"""
import glob, html, os, re
from collections import Counter, defaultdict

PAGES = sorted(glob.glob("**/*.html", recursive=True))
EXCLUDED = {"404.html", "google9146d41010c5e702.html"}

def read(path):
    return open(path, encoding="utf-8", errors="replace").read()

def one(pattern, text):
    m = re.search(pattern, text, re.I | re.S)
    return html.unescape(m.group(1).strip()) if m else ""

def classify(path):
    p=path.lower().replace("\\","/")
    if p in {"index.html","index-en.html","ar.html"}: return "Accueil"
    if p.startswith("amont/") or p.startswith("pole-amont"): return "01 · Exploration & Production"
    if p.startswith("intermediaire/") or p.startswith("pole-intermediaire"): return "01 · Transport & stockage"
    if p.startswith("aval/") or p.startswith("pole-aval"): return "01 · Raffinage & distribution"
    if p.startswith("greentech/") or p.startswith("pole-greentech"): return "02 · GreenTech"
    if p.startswith("tchaditech/") or p.startswith("pole-tchaditech"): return "02 · TchadiTech"
    if p.startswith("tchaditude/") or p.startswith("pole-tchaditude") or p.startswith("enertalents"): return "02 · Tchaditude"
    if p.startswith("enerconseils/") or p.startswith("pole-enerconseils"): return "02 · EnerConseils"
    if p.startswith("petrochimie/") or p.startswith("pole-petrochimie") or p.startswith("enerchimie"): return "02 · Pétrochimie / support métier"
    if p.startswith("docs-sources/"): return "10 · Sources documentaires"
    if p.startswith("journal-"): return "06 · Médias & connaissances"
    if p.startswith("ar-"): return "09 · Informations / arabe"
    if p.startswith("brochure"): return "03 · Entreprise"
    if p.startswith("charte"): return "03 · Entreprise"
    if p.startswith("ethique"): return "03 · Entreprise"
    if p.startswith("glossaire-petrolier"): return "06 · Médias & connaissances"
    if p.startswith("innovation"): return "02 · GreenTech & innovation"
    if p.startswith("mentions-legales"): return "09 · Informations"
    if p.startswith("plan-du-site"): return "09 · Informations"
    if p.startswith("recherche"): return "09 · Informations"
    if p.startswith("projets"): return "03 · Entreprise / projets"
    names={
      "societe":"03 · Entreprise","gouvernance":"03 · Entreprise","vision":"03 · Entreprise",
      "cibles-2030":"03 · Entreprise","engagements":"03 · Entreprise","communautes":"03 · Entreprise",
      "paiements-etats":"03 · Entreprise","investisseurs":"04 · Investir","solutions":"05 · Clients & fournisseurs",
      "clients":"05 · Clients & fournisseurs","achats":"05 · Clients & fournisseurs","presse":"06 · Médias & connaissances",
      "communiques":"06 · Médias & connaissances","carnets":"06 · Médias & connaissances","publications":"06 · Médias & connaissances",
      "carrieres":"07 · Carrières","configurateur-service-integre":"08 · Outils","contact":"09 · Informations",
      "faq":"09 · Informations","accessibilite":"09 · Informations","confidentialite":"09 · Informations",
      "cookies":"09 · Informations","avertissements":"09 · Informations"
    }
    stem=os.path.basename(path).rsplit(".",1)[0]
    stem=re.sub(r"-en$","",stem)
    return names.get(stem,"À classer")

rows=[]
canon=defaultdict(list)
for p in PAGES:
    if p in EXCLUDED: continue
    h=read(p)
    c=one(r'<link[^>]+rel=["\'][^"\']*canonical[^"\']*["\'][^>]+href=["\']([^"\']+)',h)
    lang=one(r'<html[^>]+lang=["\']([^"\']+)',h)
    title=one(r'<title[^>]*>(.*?)</title>',h)
    h1=len(re.findall(r'<h1\b',h,re.I))
    rows.append((p,classify(p),lang,c,title,h1))
    if c: canon[c].append(p)

out=["# EnerTchad — cartographie automatique des pages","",
     f"Pages HTML analysées : **{len(rows)}**","",
     "| Page | Domaine | Langue | Canonical | H1 | Titre |","|---|---|---|---:|---:|---|"]
for p,cat,lang,c,title,h1 in rows:
    out.append(f"| `/{p}` | {cat} | {lang or '—'} | {c or '—'} | {h1} | {title.replace('|','/')} |")

dups=[(c,ps) for c,ps in canon.items() if len(ps)>1]
out += ["","## Canonical partagées",""]
if dups:
    for c,ps in dups: out.append(f"- **{c}** ← "+", ".join(f"`/{p}`" for p in ps))
else: out.append("Aucune canonical partagée détectée.")

out += ["","## Pages à classer",""]
unc=[p for p,cat,*_ in rows if cat=="À classer"]
out.append("Aucune." if not unc else "\n".join(f"- `/{p}`" for p in unc))

os.makedirs("reports",exist_ok=True)
open("reports/site-architecture-2026.md","w",encoding="utf-8").write("\n".join(out)+"\n")
print(f"Architecture audit: {len(rows)} pages; {len(dups)} canonical partagées; {len(unc)} pages à classer")
