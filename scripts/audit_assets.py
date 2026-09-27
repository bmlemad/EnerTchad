#!/usr/bin/env python3
from pathlib import Path
import re
import hashlib

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "assets-audit-2026.md"
HTML = [p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts]
TEXT_FILES = HTML + list((ROOT / "assets").rglob("*.css")) + list((ROOT / "assets").rglob("*.js"))
TEXT = {}
for p in TEXT_FILES:
    try:
        TEXT[p] = p.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        pass

def normalize_ref(value):
    value = value.split("?", 1)[0].split("#", 1)[0]
    return value[1:] if value.startswith("/") else value

refs = set()
for content in TEXT.values():
    for m in re.finditer(r'''(?:src|href)\s*=\s*["']([^"']+)["']''', content, re.I):
        v = normalize_ref(m.group(1))
        if v.startswith(("assets/", "scripts/", "qa/")):
            refs.add(v)
    for m in re.finditer(r'''url\(\s*["']?([^"')]+)''', content, re.I):
        v = normalize_ref(m.group(1).strip())
        if v.startswith("assets/"):
            refs.add(v)

asset_files = sorted(
    p.relative_to(ROOT).as_posix()
    for p in (ROOT / "assets").rglob("*")
    if p.is_file() and p.suffix.lower() in {".css", ".js"}
)
unreferenced = [p for p in asset_files if p not in refs]
css = [p for p in asset_files if p.endswith('.css')]
js = [p for p in asset_files if p.endswith('.js')]
large = sorted(((p, p.stat().st_size) for p in (ROOT/'assets').rglob('*') if p.is_file() and p.suffix.lower() in {'.css','.js'} and p.stat().st_size >= 50000), key=lambda x:-x[1])
hashes = {}
for p in (ROOT/'assets').rglob('*'):
    if p.is_file() and p.suffix.lower() in {'.css','.js'}:
        h=hashlib.sha256(p.read_bytes()).hexdigest()
        hashes.setdefault(h,[]).append(p.relative_to(ROOT).as_posix())
duplicates=[v for v in hashes.values() if len(v)>1]

REPORT.parent.mkdir(parents=True, exist_ok=True)
lines = [
    "# Audit des assets CSS/JS — 2026",
    "",
    f"- Pages HTML analysées : **{len(HTML)}**",
    f"- CSS : **{len(css)}**",
    f"- JavaScript : **{len(js)}**",
    f"- Assets CSS/JS sans référence détectée : **{len(unreferenced)}**",
    f"- Assets CSS/JS ≥ 50 KB : **{len(large)}**",
    f"- Groupes de doublons exacts : **{len(duplicates)}**",
    "",
    "Un asset non référencé est un candidat à vérification, pas une preuve qu'il peut être supprimé.",
    "",
    "## Candidats non référencés",
]
lines += [f"- {p}" for p in unreferenced] or ["- Aucun candidat détecté."]
lines += ['', '## Gros assets (≥ 50 KB)', ''] + [f'- `{p}` — {n/1024:.1f} KB' for p,n in large[:30]]
lines += ['', '## Doublons exacts', ''] + [f'- {", ".join(v)}' for v in duplicates[:30]] or ['- Aucun doublon exact.']
REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"OK: {len(asset_files)} assets CSS/JS, {len(unreferenced)} candidats non référencés")
