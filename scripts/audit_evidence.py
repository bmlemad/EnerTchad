#!/usr/bin/env python3
"""Repère les zones quantitatives qui devraient porter une date ou une source explicite."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/"reports"/"evidence-audit-2026.md"
pages=[p for p in ROOT.rglob("*.html") if not any(x in p.parts for x in {".git","node_modules","reports"})]
number=re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:%|kb/j|kbpd|M\s*FCFA|Md\s*FCFA|milliards?|millions?)\b",re.I)
source=re.compile(r"source|référence|document|rapport|mis(?:e)? à jour|actualis",re.I)
rows=[]
for p in pages:
    s=p.read_text(encoding="utf-8",errors="ignore")
    for m in number.finditer(re.sub(r"<[^>]+>"," ",s)):
        ctx=s[max(0,m.start()-180):min(len(s),m.end()+180)]
        if not source.search(ctx): rows.append((p.relative_to(ROOT).as_posix(),m.group(0)))
lines=["# Audit des preuves quantitatives — 2026","","Signalement préventif : les nombres détectés sans indice textuel proche de source/date doivent être vérifiés avant publication. Cet audit ne détermine pas qu’une donnée est fausse.","","| Page | Valeur à vérifier |","|---|---|"]
for p,v in rows[:200]: lines.append("| `{}` | `{}` |".format(p,v))
lines += ["","","Total des signaux : **{}**.".format(len(rows))]
OUT.parent.mkdir(exist_ok=True); OUT.write_text("\n".join(lines)+"\n",encoding="utf-8"); print("signals={}".format(len(rows)))