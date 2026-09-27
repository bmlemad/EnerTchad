#!/usr/bin/env python3
"""Audit UI/accessibilité/SEO technique statique pour toutes les pages HTML."""
from pathlib import Path
from collections import Counter
import re

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/"reports/ui-audit-2026.md"
pages=sorted(ROOT.rglob('*.html'))
skip_dirs={'.git','node_modules','reports'}
pages=[p for p in pages if not any(x in skip_dirs for x in p.parts)]
TECHNICAL_EXEMPT = {'404.html','google9146d41010c5e702.html'}
PRINT_PREFIXES = ('docs-sources/',)
def is_technical(rel):
    return rel in TECHNICAL_EXEMPT or rel.startswith(PRINT_PREFIXES)

issues=[]; stats=Counter()
for p in pages:
    s=p.read_text(encoding='utf-8',errors='ignore')
    rel=p.relative_to(ROOT).as_posix()
    def flag(kind,detail): issues.append((rel,kind,detail)); stats[kind]+=1
    if not technical and not re.search(r'<html\b[^>]*\blang\s*=',s,re.I): flag('LANG','missing html lang')
    head_match = re.search(r'<head\b.*?</head>', s, re.I | re.S)
    head = head_match.group(0) if head_match else ''
    head_clean = re.sub(r'<script\b.*?</script>|<style\b.*?</style>', '', head, flags=re.I | re.S)
    technical = is_technical(rel)
    title_count = len(re.findall(r'<title\b', head_clean, re.I))
    if not technical and title_count != 1: flag('TITLE', f"title count={title_count}")
    print_page = rel.startswith(PRINT_PREFIXES)
    if not (technical or print_page) and not re.search(r'<meta\b[^>]*name\s*=\s*["\']description["\']',s,re.I): flag('DESCRIPTION','missing meta description')
    if not (technical or print_page) and not re.search(r'<meta\b[^>]*name\s*=\s*["\']viewport["\']',s,re.I): flag('VIEWPORT','missing viewport')
    if not (technical or print_page) and not re.search(r'<link\b[^>]*rel\s*=\s*["\']canonical["\']',s,re.I): flag('CANONICAL','missing canonical')
    h1=len(re.findall(r'<h1\b',s,re.I))
    if not technical and h1!=1: flag('H1',f'h1 count={h1}')
    if not (technical or print_page) and not re.search(r'href\s*=\s*["\']#main-content["\']',s,re.I): flag('SKIP','missing #main-content skip link')
    if not (technical or print_page) and not re.search(r'id\s*=\s*["\']main-content["\']',s,re.I): flag('MAIN','missing id=main-content')
    if not (technical or print_page) and 'modern-inner-2026.css' not in s and 'nav_a.css' not in s and rel not in ('index.html','index-en.html'): flag('INNER_UI','missing shared inner UI layer')
    if re.search(r'\bstyle\s*=\s*["\'][^"\']{240,}["\']',s,re.I): flag('INLINE_STYLE','very large inline style')
    if len(re.findall(r'<script\b',s,re.I))>30: flag('INLINE_JS','high script tag count')
    ids=re.findall(r'\bid\s*=\s*["\']([^"\']+)["\']',s,re.I)
    dup=[k for k,v in Counter(ids).items() if v>1]
    if dup: flag('DUP_ID',', '.join(dup[:8]))
    for m in re.finditer(r'<img\b([^>]*)>',s,re.I|re.S):
        if not re.search(r'\balt\s*=',m.group(0),re.I): flag('IMG_ALT','img without alt')
    main_end = s.lower().rfind('</main>')
    for m in re.finditer(r'<script\b([^>]*)>',s,re.I|re.S):
        tag=m.group(0)
        if m.start() > main_end:
            continue
        if re.search(r'\bsrc\s*=',tag,re.I) and not re.search(r'\b(defer|async)\b',tag,re.I):
            flag('SCRIPT_BLOCK','external script before end of main without defer/async')

lines=['# Audit UI, accessibilité & SEO technique — 2026','',f'Pages analysées : **{len(pages)}**','','## Synthèse','', '| Contrôle | Occurrences |','|---|---:|']
for k in ['LANG','TITLE','DESCRIPTION','VIEWPORT','CANONICAL','H1','SKIP','MAIN','INNER_UI','IMG_ALT','DUP_ID','SCRIPT_BLOCK','INLINE_STYLE','INLINE_JS']: lines.append(f'| {k} | {stats[k]} |')
lines += ['', '## Anomalies', '']
if not issues: lines.append('Aucune anomalie détectée.')
else:
    by={}
    for rel,k,d in issues: by.setdefault(k,[]).append((rel,d))
    for k,items in by.items():
        lines.append(f'### {k} ({len(items)})')
        for rel,d in items[:80]: lines.append(f'- `{rel}` — {d}')
        if len(items)>80: lines.append(f'- … {len(items)-80} autres')
REPORT.parent.mkdir(exist_ok=True); REPORT.write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(f'Analysed {len(pages)} HTML pages; {len(issues)} findings.')
for k,v in stats.most_common(): print(f'{k}: {v}')