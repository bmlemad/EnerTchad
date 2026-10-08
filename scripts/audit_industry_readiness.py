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
centre = read(ROOT / "investor-center.html")
centre_en = read(ROOT / "investor-center-en.html")

def has_reporting_section(content, document_route):
    """Require a labelled section linking to public documents, independent of CSS."""
    for section in re.finditer(r'<section\b([^>]*)>(.*?)</section>', content, re.I | re.S):
        label = re.search(r'\baria-labelledby="([^"]+)"', section.group(1), re.I)
        if not label:
            continue
        body = section.group(2)
        has_heading = any(
            re.search(r'<h[1-6]\b[^>]*\bid="' + re.escape(identifier) + r'"[^>]*>\s*[^<]+', body, re.I)
            for identifier in label.group(1).split()
        )
        if has_heading and re.search(r'\bhref="' + re.escape(document_route) + r'"', body):
            return True
    return False

home_requirements = {
    "reporting investisseurs": r'href="/(?:publications#pub-inv|investor-center)"',
    "gouvernance": r'href="/ethique"',
    "newsroom": r'href="/communiques"',
    "portefeuille": r'href="/projets"',
    "limites des données": r'href="/avertissements"',
}
for label, pattern in home_requirements.items():
    if not re.search(pattern, home, re.I | re.S):
        errors.append(f"index.html: élément corporate attendu absent ({label})")

# The simplified homepages route visitors to the document centre rather than
# duplicating its downloads. Keep the labelled gateway and the actual download.
for filename, content, route, investor_route in [
    ("index.html", home, "/publications", "/investor-center"),
    ("index-en.html", home_en, "/publications-en", "/investor-center-en"),
    ("ar.html", home_ar, "/publications", "/ar-investisseurs"),
]:
    if not has_reporting_section(content, route):
        errors.append(f"{filename}: section documentaire nommée ou accès aux publications absent")
    if not re.search(r'href="' + re.escape(investor_route) + r'"', content):
        errors.append(f"{filename}: reporting gateway absent")

pub_requirements = {
    "reporting navigation": r'aria-label="Navigation du centre de reporting"',
    "investissement": r'href="#pub-inv"',
    "opérations": r'href="#pub-ops"',
    "gouvernance": r'href="#pub-societe"',
    "actualités": r'href="#pub-presse"',
    "data book": r'href="/Data_Book_EnerTchad.xlsx"',
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

multilingual = [
    ("publications-en.html", pub_en, r'aria-label="Reporting center navigation"', r'href="#pub-inv"'),
]
for filename, content, pattern_one, pattern_two in multilingual:
    if not re.search(pattern_one, content, re.I | re.S):
        errors.append(f"{filename}: multilingual corporate layer absent")
    if not re.search(pattern_two, content, re.I | re.S):
        errors.append(f"{filename}: reporting gateway absent")

for filename in ("publications-en.html", "ar-investisseurs.html"):
    if not re.search(r'href="/Data_Book_EnerTchad.xlsx"', read(ROOT / filename)):
        errors.append(f"{filename}: téléchargement du data book absent")

# The consolidated homepage route must still lead to the published reporting
# centre and the investor factsheet in each language.
for filename, content, suffix in [
    ("investor-center.html", centre, ""),
    ("investor-center-en.html", centre_en, "-en"),
]:
    if not re.search(r'href="/publications' + suffix + r'(?:#[^"\s]+)?"', content):
        errors.append(f"{filename}: accès au reporting documentaire absent")
    if not re.search(r'href="/Fiche_Investisseur_EnerTchad.pdf"', content):
        errors.append(f"{filename}: fiche investisseur absente")

# Redirect aliases for the reporting center must remain canonical shortcuts.
vercel = ROOT / "vercel.json"
if vercel.exists():
    data = vercel.read_text(encoding="utf-8", errors="ignore")
    if not re.search(r'"source"\s*:\s*"/reporting"[^}]*"destination"\s*:\s*"/publications"[^}]*"permanent"\s*:\s*true', data, re.S):
        errors.append("vercel.json: alias /reporting absent ou non permanent")
    if not re.search(r'"source"\s*:\s*"/reporting-en"[^}]*"destination"\s*:\s*"/publications-en"[^}]*"permanent"\s*:\s*true', data, re.S):
        errors.append("vercel.json: alias /reporting-en absent ou non permanent")
else:
    errors.append("vercel.json: fichier absent")

report = ROOT / "reports" / "industry-readiness-2026.md"
report.parent.mkdir(exist_ok=True)
report.write_text(
    "# Niveau corporate & reporting — 2026\n\n"
    "Contrôle statique des surfaces de confiance, de reporting, des accès multilingues et des ressources documentaires.\n\n"
    "## Couverture contrôlée\n\n"
    "- Accueils FR/EN/AR : section documentaire nommée + accès aux publications\n"
    "- Accueils FR/EN/AR : accès investisseurs\n"
    "- Publications FR/EN et investisseurs AR : téléchargement du data book\n"
    "- Publications FR/EN : navigation reporting par domaine\n"
    "- Investisseurs FR/EN/AR : accès direct aux documents clés\n"
    "- Aliases reporting : /reporting et /reporting-en\n"
    "- Compatibilité : transparence réduite, forced colors, fallback sans backdrop-filter\n\n"
    "Le présent rapport est structurel ; il ne remplace pas une mesure de performance réelle ou une revue par utilisateurs.\n",
    encoding="utf-8"
)

if errors:
    print("\n".join(errors))
    print(f"\nECHEC : {len(errors)} problème(s)")
    sys.exit(1)

print("OK : centre corporate/reporting présent, multilingue, relié et documenté")
