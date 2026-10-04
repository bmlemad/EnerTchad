#!/usr/bin/env python3
from pathlib import Path
import re, html

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "i18n-pairs-audit-2026.md"
BASE = "https://enertchad.netlify.app"

LANG_RE = re.compile(r"<html\b[^>]*\blang=['"]([^'"]+)['"]", re.I)
CAN_RE = re.compile(r"<link\b[^>]*\brel=['"]canonical['"][^>]*\bhref=['"]([^'"]+)['"]", re.I)
ALT_RE = re.compile(r"<link\b[^>]*\brel=['"]alternate['"][^>]*\bhreflang=['"]([^'"]+)['"][^>]*\bhref=['"]([^'"]+)['"]", re.I)

def norm(url):
    url = html.unescape(url.strip())
    if url.startswith(BASE):
        url = url[len(BASE):]
    if not url.startswith("/"):
        return url
    return url.rstrip("/") or "/"

def read_page(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    lang = (LANG_RE.search(text) or [None, None])[1]
    canonical = (CAN_RE.search(text) or [None, None])[1]
    alts = {m.group(1).lower(): norm(m.group(2)) for m in ALT_RE.finditer(text)}
    return lang, norm(canonical or ""), alts

pages = {}
for path in ROOT.rglob("*.html"):
    if any(part in {".git", "node_modules"} for part in path.parts):
        continue
    rel = "/" + path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        route = rel[:-10] or "/"
    else:
        route = rel[:-5]
    pages[route] = read_page(path)

errors = []
pairs = 0
for route, (lang, canonical, alts) in sorted(pages.items()):
    if lang not in {"fr", "en", "ar"}:
        continue
    if canonical != route:
        errors.append(f"{route}: canonical={canonical!r}, expected={route!r}")
    if alts.get(lang) != canonical:
        errors.append(f"{route}: self hreflang {lang}={alts.get(lang)!r}, expected {canonical!r}")

    for other in ("fr", "en", "ar"):
        target = alts.get(other)
        if not target:
            continue
        if target not in pages:
            errors.append(f"{route}: hreflang {other} targets missing route {target}")
            continue
        target_lang, target_can, target_alts = pages[target]
        if target_lang != other:
            errors.append(f"{route}: hreflang {other} targets {target} with lang={target_lang!r}")
        if target_alts.get(lang) != canonical:
            errors.append(f"{route}: reciprocal {other}->{lang} missing/wrong on {target}: {target_alts.get(lang)!r} != {canonical!r}")
        pairs += 1

for route, (lang, canonical, alts) in sorted(pages.items()):
    if lang == "fr" and "en" in alts and "en" in pages:
        pairs += 0

REPORT.parent.mkdir(exist_ok=True)
REPORT.write_text(
    "# Audit des paires linguistiques — 2026\n\n"
    f"- Pages HTML inspectées : **{len(pages)}**\n"
    f"- Relations hreflang vérifiées : **{pairs}**\n"
    f"- Anomalies : **{len(errors)}**\n\n"
    + ("## Résultat\n\n✅ Toutes les relations déclarées sont cohérentes et réciproques.\n"
       if not errors else
       "## Anomalies\n\n" + "\n".join(f"- {e}" for e in errors) + "\n"),
    encoding="utf-8",
)

if errors:
    raise SystemExit("\n".join(errors))
print(f"i18n pair audit OK: {len(pages)} pages, {pairs} relations")
