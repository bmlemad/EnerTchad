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
TECHNICAL_EXEMPT = {'404.html','ar.html','google9146d41010c5e702.html'}
PRINT_PREFIXES = ('docs-sources/',)
def is_technical(rel):
    return rel in TECHNICAL_EXEMPT or rel.startswith(PRINT_PREFIXES)

issues=[]; stats=Counter()
for p in pages:
    s=p.read_text(encoding='utf-8',errors='ignore')
    rel=p.relative_to(ROOT).as_posix()
    technical = is_technical(rel)
    def flag(kind,detail): issues.append((rel,kind,detail)); stats[kind]+=1
    if not technical and not re.search(r'<html\b[^>]*\blang\s*=',s,re.I): flag('LANG','missing html lang')
    head_match = re.search(r'<head\b.*?</head>', s, re.I | re.S)
    # Certaines pages historiques sont valides en HTML5 sans balise <head>
    # explicite : le navigateur reconstruit le document. Pour éviter les faux
    # positifs, auditer alors le document entier en retirant scripts/styles.
    head = head_match.group(0) if head_match else s
    head_clean = re.sub(r'<script\b.*?</script>|<style\b.*?</style>', '', head, flags=re.I | re.S)
    title_count = len(re.findall(r'<title\b', head_clean, re.I))
    if not technical and title_count != 1: flag('TITLE', f"title count={title_count}")
    print_page = rel.startswith(PRINT_PREFIXES)
    if not (technical or print_page) and not re.search(r'<meta\b[^>]*name\s*=\s*["\']description["\']',s,re.I): flag('DESCRIPTION','missing meta description')
    if not (technical or print_page) and not re.search(r'<meta\b[^>]*name\s*=\s*["\']viewport["\']',s,re.I): flag('VIEWPORT','missing viewport')
    if not (technical or print_page) and not re.search(r'<link\b[^>]*rel\s*=\s*["\']canonical["\']',s,re.I): flag('CANONICAL','missing canonical')
    h1=len(re.findall(r'<h1\b',s,re.I))
    if not technical and h1!=1: flag('H1',f'h1 count={h1}')
    if not (technical or print_page) and not re.search(r'href\s*=\s*(?:["\']#(?:main-content|root)["\']|#(?:main-content|root)(?=\s|>))',s,re.I): flag('SKIP','missing skip link')
    if not (technical or print_page) and not re.search(r'id\s*=\s*["\'](?:main-content|root)["\']',s,re.I): flag('MAIN','missing main target id')
    if not (technical or print_page) and 'modern-inner-2026.css' not in s and 'nav_a.css' not in s and 'premium-chrome.css' not in s and not rel.startswith('ar-') and rel not in ('index.html','index-en.html'): flag('INNER_UI','missing shared inner UI layer')
    long_inline_styles = re.findall(r'\\bstyle\\s*=\\s*["\\']([^"\\']{240,})["\\']', s, re.I)
    if not technical and long_inline_styles:
        flag('INLINE_STYLE', f'very large inline style ({len(long_inline_styles)} found)')
    inline_scripts = [m.group(0) for m in re.finditer(r'<script\\b([^>]*)>', s, re.I|re.S) if not re.search(r'\\bsrc\\s*=', m.group(1), re.I)]
    if len(inline_scripts) > 15:
        flag('INLINE_JS', f'{len(inline_scripts)} inline script tags')
    ids=re.findall(r'\bid\s*=\s*["\']([^"\']+)["\']',s,re.I)
    dup=[k for k,v in Counter(ids).items() if v>1]
    if dup: flag('DUP_ID',', '.join(dup[:8]))
    # Images: toutes doivent avoir un attribut alt explicite.
    for m in re.finditer(r'<img\b([^>]*)>',s,re.I|re.S):
        tag=m.group(0)
        if not re.search(r'\balt\s*=',tag,re.I): flag('IMG_ALT','img without alt')

    # Contrôles interactifs: détecter les noms accessibles manifestement absents.
    for m in re.finditer(r'<(?:a|button)\b([^>]*)>(.*?)</(?:a|button)>',s,re.I|re.S):
        tag, body = m.group(1), m.group(2)
        if re.search(r"""\baria-hidden\s*=\s*["']true["']""",tag,re.I): continue
        named = re.search(r"""\baria-label\s*=\s*["'][^"']+[^"']["']""",tag,re.I) or re.search(r"""\baria-labelledby\s*=\s*["'][^"']+["']""",tag,re.I)
        visible = re.sub(r'<[^>]+>', ' ', body)
        visible = re.sub(r'&(?:nbsp|#160);', ' ', visible, flags=re.I)
        if not named and not visible.strip() and not re.search(r"""<img\b[^>]*\balt\s*=\s*["'][^"']+["']""",body,re.I):
            flag('EMPTY_CONTROL','link/button without accessible name')

    # Form fields should expose a label or an ARIA name.
    for m in re.finditer(r'<(?:input|select|textarea)\b([^>]*)>',s,re.I|re.S):
        tag=m.group(0)
        if re.search(r"""\btype\s*=\s*["'](?:hidden|submit|button|reset|image)["']""",tag,re.I): continue
        wrapped_label = False
        before = s.rfind('<label', 0, m.start())
        closed_before = s.rfind('</label>', 0, m.start())
        after = s.find('</label>', m.end())
        if before > closed_before and after != -1:
            wrapped_label = True
        if not (re.search(r"""\baria-label(?:ledby)?\s*=""",tag,re.I) or (re.search(r'\bid\s*=',tag,re.I) and re.search(r"""<label\b[^>]*\bfor\s*=\s*["'][^"']+["']""",s,re.I)) or wrapped_label):
            flag('FORM_NAME','form field without detectable label/ARIA name')

    main_end = s.lower().rfind('</main>')
    for m in re.finditer(r'<script\b([^>]*)>',s,re.I|re.S):
        tag=m.group(0)
        if m.start() > main_end:
            continue
        if re.search(r'\bsrc\s*=',tag,re.I) and not re.search(r'\b(defer|async)\b',tag,re.I):
            flag('SCRIPT_BLOCK','external script before end of main without defer/async')

lines=['# Audit UI, accessibilité & SEO technique — 2026','',f'Pages analysées : **{len(pages)}**','','## Synthèse','', '| Contrôle | Occurrences |','|---|---:|']
for k in ['LANG','TITLE','DESCRIPTION','VIEWPORT','CANONICAL','H1','SKIP','MAIN','INNER_UI','IMG_ALT','EMPTY_CONTROL','FORM_NAME','DUP_ID','SCRIPT_BLOCK','INLINE_STYLE','INLINE_JS']: lines.append(f'| {k} | {stats[k]} |')
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
for rel,k,d in issues:
    print(f'FINDING: {rel} | {k} | {d}')