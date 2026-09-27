#!/usr/bin/env python3
"""Garde-fou statique du niveau corporate / reporting du site EnerTchad."""
from pathlib import Path
import re, sys

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "index.html"
PUB = ROOT / "publications.html"
HOME_EN = ROOT / "index-en.html"
HOME_AR = ROOT / "ar.html"
PUB_EN = ROOT / "publications-en.html"
errors = []

def read(path):
    if not path.exists():
        errors.append(f"fichier absent: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

home = read(HOME)
pub = read(PUB)
home_en = read(HOME_EN)
home_ar = read(HOME_AR)
pub_en = read(PUB_EN)

home_requirements = {
    "centre de confiance": r'class="et-proof-center"[^>]*aria-labelledby="et-proof-title"',
    "reporting investisseurs": r'href="/publications#pub-inv"',
    "data book": r'href="/Data_Book_EnerTchad.xlsx"',
    "gouvernance": r'href="/ethique"',
    "newsroom": r'href="/communiques"',
    "portefeuille": r'href="/projets"',
    "limites des données": r'href="/avertissements"',
}
for label, pattern in home_requirements.items():
    if not re.search(pattern, home, re.I | re.S):
        errors.append(f"index.html: élément corporate attendu absent ({label})")

pub_requirements = {
    "reporting navigation": r'class="pub-radar"[^>]*aria-label="Navigation du centre de reporting"',
    "investissement": r'href="#pub-inv"',
    "opérations": r'href="#pub-ops"',
    "gouvernance": r'href="#pub-societe"',
    "actualités": r'href="#pub-presse"',
}
for label, pattern in pub_requirements.items():
    if not re.search(pattern, pub, re.I | re.S):
        errors.append(f"publications.html: élément de reporting attendu absent ({label})")

for asset in [
    "Data_Book_EnerTchad.xlsx",
    "Fiche_Investisseur_EnerTchad.pdf",
    "Point_Etape_EnerTchad_2026.pdf",
    "assets/data/indicateurs-esg-2030.csv",
]:
    if not (ROOT / asset).exists():
        errors.append(f"ressource documentaire attendue absente: {asset}")

if errors:
    print("\n".join(errors))
    print(f"\nECHEC : {len(errors)} problème(s)")
    sys.exit(1)

print("OK : centre corporate/reporting présent, relié et documenté")


multilingual = [
    ("index-en.html", home_en, r'class="et-proof-center"[^>]*aria-labelledby="et-proof-title-en"', r'/publications-en#pub-inv'),
    ("ar.html", home_ar, r'class="et-proof-center"[^>]*aria-labelledby="et-proof-title-ar"', r'/ar-investisseurs'),
    ("publications-en.html", pub_en, r'class="pub-radar"[^>]*aria-label="Reporting center navigation"', r'href="#pub-inv"'),
]
for filename, content, pattern_one, pattern_two in multilingual:
    if not re.search(pattern_one, content, re.I | re.S):
        errors.append(f"{filename}: multilingual corporate layer absent")
    if not re.search(pattern_two, content, re.I | re.S):
        errors.append(f"{filename}: reporting gateway absent")
