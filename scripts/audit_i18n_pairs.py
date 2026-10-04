#!/usr/bin/env python3
from pathlib import Path
import re, html

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "reports" / "i18n-pairs-audit-2026.md"
BASE = "https://enertchad.netlify.app"

LANG_RE = re.compile(r"""<html\b[^>]*\blang=['"]([^'"]+)['"]""", re.I)
CAN_RE = re.compile(r"""<link\b[^>]*\brel=['"]canonical['"][^>]*\bhref=['"]([^'"]+)['"]""", re.I)
ALT_RE = re.compile(r"""<link\b[^>]*\brel=['"]alternate['"][^>]*\bhreflang=['"]([^'"]+)['"][^>]*\bhref=['"]([^'"]+)['"]""", re.I)

EXCLUDE = {"404.html", "google9146d41010c5e702.html"}
EXCLUDE_PREFIXES = {"docs-sources/"}
VIRTUAL_ROUTES = {"/amont/calculateur-baril-additionnel", "/configurateur-service-integre"}
ROUTE_ALIASES = {
    "/Calculateur_Baril_Additionnel": "/amont/calculateur-baril-additionnel",
    "/Configurateur_Service_Integre_v2": "/configurateur-service-integre",
}

def norm(url):
    url = html.unescape(url.strip())
    if url.startswith(BASE):
        url = url[len(BASE):]
    if not url.startswith("/"):
        return url
    return url.rstrip("/") or "/"

def route_for(path):
    rel = "/" + path.relative_to(ROOT).as_posix()
    if rel.endswith("/index.html"):
        return rel[:-10].rstrip("/") or "/"
    if rel.endswith(".html"):
        return rel[:-5].rstrip("/") or "/"
    return rel.rstrip("/") or "/"

def read_page(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    lang_m = LANG_RE.search(text)
    can_m = CAN_RE.search(text)
    lang = lang_m.group(1).lower() if lang_m else None
    canonical = norm(can_m.group(1)) if can_m else ""
    alts = {m.group(1).lower(): norm(m.group(2)) for m in ALT_RE.finditer(text)}
    return lang, canonical, alts

pages = {}
for path in ROOT.rglob("*.html"):
    if any(part in {".git", "node_modules"} for part in path.parts):
        continue
    rel_path = path.relative_to(ROOT).as_posix()
    if path.name in EXCLUDE or any(rel_path.startswith(prefix) for prefix in EXCLUDE_PREFIXES):
        continue
    pages[route_for(path)] = read_page(path)

def alias(route):
    route = route.rstrip("/") or "/"
    return ROUTE_ALIASES.get(route, route)

errors = []
relations = 0
for route, (lang, canonical, alts) in sorted(pages.items()):
    if lang not in {"fr", "en", "ar"}:
        continue
    # Canonical/hreflang routes may use either /route or /route/.
    if alias(canonical) != alias(route):
        errors.append(f"{route}: canonical={canonical!r}, expected={route!r}")
    if alts.get(lang) and alias(alts[lang]) != alias(canonical or route):
        errors.append(f"{route}: self hreflang {lang}={alts.get(lang)!r}, expected {canonical or route!r}")
    for other, target in alts.items():
        if other not in {"fr", "en", "ar"} or not target:
            continue
        target_route = alias(target)
        if target_route not in pages:
            if target_route in VIRTUAL_ROUTES:
                relations += 1
                continue
            errors.append(f"{route}: hreflang {other} targets missing route {target}")
            continue
        target_lang, _, target_alts = pages[target_route]
        if target_lang != other:
            errors.append(f"{route}: hreflang {other} targets {target} with lang={target_lang!r}")
        if target_alts.get(lang) and alias(target_alts[lang]) != alias(canonical or route):
            errors.append(f"{route}: reciprocal {other}->{lang} on {target}: {target_alts.get(lang)!r}")
        relations += 1

REPORT.parent.mkdir(exist_ok=True)
REPORT.write_text(
    "# Audit des paires linguistiques — 2026\n\n"
    f"- Pages HTML inspectées : **{len(pages)}**\n"
    f"- Relations hreflang vérifiées : **{relations}**\n"
    f"- Anomalies : **{len(errors)}**\n\n"
    + ("## Résultat\n\n✅ Toutes les relations déclarées sont cohérentes et réciproques.\n"
       if not errors else
       "## Anomalies\n\n" + "\n".join(f"- {e}" for e in errors) + "\n"),
    encoding="utf-8",
)
if errors:
    raise SystemExit("\n".join(errors))
print(f"i18n pair audit OK: {len(pages)} pages, {relations} relations")
