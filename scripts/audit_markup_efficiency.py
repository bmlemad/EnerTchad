#!/usr/bin/env python3
"""Audit HTML whitespace, empty nodes and void-element syntax without destructive cleanup."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "markup-efficiency-audit-2026.md"
pages = [p for p in ROOT.rglob("*.html") if not any(x in p.parts for x in {".git","node_modules","reports"})]

EMPTY = re.compile(r"<([a-z][\w:-]*)(?:\s[^>]*)?>\s*</\1\s*>", re.I)
VOID_XHTML = re.compile(r"<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(?:\s[^>]*)?\s*/>", re.I)
SPACE_BEFORE_GT = re.compile(r"[ \t]+>")
TAB_LINES = re.compile(r"\n\t+[^\n]")
BLANK_LINES = re.compile(r"(?:\n[ \t]*){3,}")

totals = {"empty":0,"void_xhtml":0,"space_before_gt":0,"tab_lines":0,"blank_runs":0,"whitespace_bytes":0}
rows = []

for p in pages:
    s = p.read_text(encoding="utf-8", errors="ignore")
    empty = len(EMPTY.findall(s))
    void_xhtml = len(VOID_XHTML.findall(s))
    space_before_gt = len(SPACE_BEFORE_GT.findall(s))
    tab_lines = len(TAB_LINES.findall(s))
    blank_runs = len(BLANK_LINES.findall(s))
    whitespace_bytes = sum(len(m.group(0)) for m in re.finditer(r"[ \t]+(?=\n)|\n[ \t]+", s))
    totals["empty"] += empty
    totals["void_xhtml"] += void_xhtml
    totals["space_before_gt"] += space_before_gt
    totals["tab_lines"] += tab_lines
    totals["blank_runs"] += blank_runs
    totals["whitespace_bytes"] += whitespace_bytes
    if any((empty, void_xhtml, space_before_gt, tab_lines, blank_runs)):
        rows.append((empty + void_xhtml + space_before_gt + tab_lines + blank_runs,
                     p.relative_to(ROOT).as_posix(), empty, void_xhtml,
                     space_before_gt, tab_lines, blank_runs, whitespace_bytes))

rows.sort(reverse=True)
lines = [
"# Audit markup / espaces / void — 2026", "",
f"- Pages HTML analysées : {len(pages)}",
"- Audit statique : les candidats sont signalés, pas supprimés automatiquement.",
"- Un élément vide peut être intentionnel (icône, ancre, composant JS) : suppression uniquement après vérification.",
"",
"## Synthèse", "",
"| Signal | Occurrences |",
"|---|---:|",
f"| Éléments vides potentiels | {totals['empty']} |",
f"| Void elements avec syntaxe XHTML /&gt; | {totals['void_xhtml']} |",
f"| Espaces avant &gt; | {totals['space_before_gt']} |",
f"| Lignes avec tabulations | {totals['tab_lines']} |",
f"| Runs de 3+ lignes vides | {totals['blank_runs']} |",
f"| Octets de whitespace en fin de ligne / indentation | {totals['whitespace_bytes']} |",
"",
"## Priorité de nettoyage",
"1. Corriger la syntaxe XHTML sur les éléments void si elle est inutile, sans toucher au rendu.",
"2. Examiner les éléments réellement vides avant suppression.",
"3. Réduire les runs de lignes vides et espaces de fin, faible gain réseau mais meilleure maintenabilité.",
"4. Ne pas minifier agressivement le HTML sans mesure : les espaces textuels peuvent être visuels.",
"",
"## Pages avec le plus de signaux", "",
"| Page | Total | Empty | Void | Space | Tabs | Blank runs | Whitespace bytes |",
"|---|---:|---:|---:|---:|---:|---:|---:|"
]
for total, path, e, v, sp, t, b, w in rows[:100]:
    lines.append(f"| {path} | {total} | {e} | {v} | {sp} | {t} | {b} | {w} |")
REPORT.parent.mkdir(exist_ok=True)
REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"OK: {len(pages)} pages; {len(rows)} pages with markup signals")
