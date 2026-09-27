#!/usr/bin/env python3
"""Audit statique des parcours de conversion et d’information de la homepage."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/"index.html"; OUT=ROOT/"reports"/"conversion-audit-2026.md"
s=P.read_text(encoding="utf-8",errors="ignore") if P.exists() else ""
anchors=re.findall(r"<a\b([^>]*)>(.*?)</a>",s,re.I|re.S)
labels=[]
for attrs,body in anchors:
    txt=re.sub(r"<[^>]+>"," ",body); txt=re.sub(r"\s+"," ",txt).strip()
    href=re.search(r"""\bhref=["\']([^"\']+)""",attrs,re.I)
    if txt or re.search(r"""aria-label=["\']""",attrs,re.I): labels.append((txt or "[aria-label]",href.group(1) if href else ""))
terms={"Investir":r"invest|capital|actionna|finance","Clients":r"client|service|produit|carbur","Fournisseurs":r"fournisseur|achat|appel|marché|procurement","Carrières":r"carri|emploi|recrut|talent","Contact":r"contact|écrire|joindre","Documentation":r"document|rapport|publication|donnée|atlas"}
lines=["# Audit des parcours de conversion — 2026","","Audit descriptif : présence de libellés/liens correspondant à des intentions utilisateur.","","| Intention | Détection | Exemples de liens |","|---|---|---|"]
for name,pat in terms.items():
    hits=[(t,h) for t,h in labels if re.search(pat,t+" "+h,re.I)]
    ex=", ".join((t[:50] or h[:50]) for t,h in hits[:4]) or "Aucun"
    lines.append("| {} | {} | {} |".format(name,"Présente" if hits else "À examiner",ex))
lines += ["","","## Règle","","Ce rapport identifie les parcours à vérifier ; il ne remplace pas une analyse UX avec utilisateurs ni une décision éditoriale."]
OUT.parent.mkdir(exist_ok=True); OUT.write_text("\n".join(lines)+"\n",encoding="utf-8")
print("OK: audit conversion généré")