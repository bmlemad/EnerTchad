#!/usr/bin/env python3
"""Audit statique léger des budgets de chargement HTML."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "performance-audit-2026.md"
pages = [p for p in ROOT.rglob("*.html") if not any(x in p.parts for x in {".git","node_modules","reports"})]
findings = []
blocking_script_usage = {}

for p in pages:
    s = p.read_text(encoding="utf-8", errors="ignore")
    rel = p.relative_to(ROOT).as_posix()
    blocking = []
    late_sync = []
    for m in re.finditer(r"<script\b[^>]*\bsrc\s*=\s*[^>]+>", s, re.I):
        tag = m.group(0)
        if re.search(r"\b(?:defer|async)\b", tag, re.I):
            continue
        src = re.search(r"\bsrc\s*=\s*["']([^"']+)", tag, re.I)
        if not src:
            continue
        src_url = src.group(1)
        if m.start() > s.lower().rfind("</main>"):
            late_sync.append(src_url)
        else:
            blocking.append(src_url)
    if blocking:
        findings.append((rel, "scripts externes bloquants", len(blocking)))
        for src_url in blocking:
            findings.append((rel, f"script synchrone: {src_url}", 1))
            blocking_script_usage[src_url] = blocking_script_usage.get(src_url, 0) + 1
    if late_sync:
        for src_url in late_sync:
            key = f"[fin de body] {src_url}"
            blocking_script_usage[key] = blocking_script_usage.get(key, 0) + 1
    # Seules les feuilles réellement bloquantes comptent ici : les préloads
    # et les fallbacks <noscript> ne bloquent pas le rendu quand JS est actif.
    # Ne compter que les feuilles qui bloquent réellement le rendu. Les
    # préloads de CSS avec onload et leurs fallbacks noscript sont non bloquants.
    body_without_noscript = re.sub(r"<noscript\b.*?</noscript>", "", s, flags=re.I | re.S)
    stylesheet_tags = re.findall(r"<link\b[^>]*\brel\s*=\s*[\"']stylesheet[\"'][^>]*>", body_without_noscript, re.I)
    stylesheets = [tag for tag in stylesheet_tags if not re.search(r"\bonload\s*=", tag, re.I)]
    if len(stylesheets) > 14: findings.append((rel, "nombre élevé de feuilles CSS bloquantes", len(stylesheets)))
    images = re.findall(r"<img\b[^>]*>", s, re.I)
    for tag in images:
        if not re.search(r"\b(?:loading|fetchpriority)\s*=", tag, re.I): findings.append((rel, "image sans hint loading/fetchpriority", 1))

common_blocking = sorted(blocking_script_usage.items(), key=lambda item: (-item[1], item[0]))
lines = ["# Audit performance statique — 2026", "", f"- Pages HTML analysées : **{len(pages)}**", f"- Anomalies détectées : **{len(findings)}**", "", "Cet audit signale des candidats à optimisation ; il ne remplace pas une mesure Lighthouse/WebPageTest.", ""]
if common_blocking:
    lines += ["## Scripts synchrones récurrents", "", "Les scripts réellement bloquants sont prioritaires ; les scripts placés en fin de body sont suivis séparément.", ""]
    for src, count in common_blocking[:30]:
        lines.append(f"- `{src}` — {count} page(s)")
if findings:
    lines += ["## Anomalies", ""]
    for rel, kind, n in findings[:300]: lines.append(f"- `{rel}` — {kind} ({n})")
else: lines.append("Aucune anomalie détectée par ces garde-fous.")
REPORT.parent.mkdir(exist_ok=True)
REPORT.write_text("\\n".join(lines) + "\\n", encoding="utf-8")
print(f"OK: {len(pages)} pages, {len(findings)} findings")