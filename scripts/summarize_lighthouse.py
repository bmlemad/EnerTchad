#!/usr/bin/env python3
"""Résumé lisible des rapports Lighthouse produits par le workflow benchmark."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/"reports"/"lighthouse"
OUT=ROOT/"reports"/"lighthouse-summary-2026.md"
files=sorted(DIR.glob("*.json")) if DIR.exists() else []
lines=["# Synthèse Lighthouse — 2026","","Les scores sont des mesures de laboratoire du run CI ; ils ne constituent pas des données terrain.","","| Parcours | Performance | Accessibilité | Best Practices | SEO | LCP | TBT | CLS |","|---|---:|---:|---:|---:|---:|---:|---:|"]
for f in files:
    try: d=json.loads(f.read_text(encoding="utf-8")); c=d.get("categories",{}); a=d.get("audits",{})
    except Exception: continue
    def score(k): return round((c.get(k,{}).get("score") or 0)*100)
    def val(k): return a.get(k,{}).get("displayValue","—")
    lines.append("| `{}` | {} | {} | {} | {} | {} | {} | {} |".format(f.stem,score("performance"),score("accessibility"),score("best-practices"),score("seo"),val("largest-contentful-paint"),val("total-blocking-time"),val("cumulative-layout-shift")))
if not files: lines.append("| Aucun rapport disponible | — | — | — | — | — | — | — |")
lines += ["","","## Référentiel","","- LCP ≤ 2,5 s : bon en données terrain au 75e percentile.","- INP ≤ 200 ms : bon en données terrain au 75e percentile.","- CLS ≤ 0,1 : bon en données terrain au 75e percentile.","- TBT est utilisé ici comme indicateur de laboratoire ; il ne remplace pas l’INP terrain."]
OUT.parent.mkdir(exist_ok=True); OUT.write_text("\n".join(lines)+"\n",encoding="utf-8")
print("OK: {} rapports résumés".format(len(files)))