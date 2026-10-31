# -*- coding: utf-8 -*-
"""Libellés des capacités intégrées : format « Métier · Marque » (lot 70) partout, y compris sur les
pages stratégiques Next.js (lot 77). Échoue si une carte reprend un nom court (GreenTech seul, etc.)."""
import re, subprocess, sys
FR = ['Durabilité · GreenTech', 'Technologies · TchadiTech', 'Capital humain · Tchaditude', 'Ingénierie &amp; Conseil · EnerConseils']
EN = ['Sustainability · GreenTech', 'Technologies · TchadiTech', 'Human capital · Tchaditude', 'Engineering &amp; Advisory · EnerConseils']
SHORT = re.compile(r'<b><i aria-hidden="true"></i>(GreenTech|TchadiTech|Tchaditude|Ingénierie &amp; Conseil|Engineering &amp; Advisory)</b>')
gaps = []
for f in ('essentiel.html', 'essentiel-en.html'):
    s = open(f, encoding='utf-8').read()
    for label in (EN if f.endswith('-en.html') else FR):
        if f'<b>{label}</b>' not in s: gaps.append(f'{f}: libellé absent « {label} »')
    for m in re.finditer(r'class="sp-node"[^>]*>.*?<b>([^<]*)</b>', s):
        if m.group(1) in ('GreenTech', 'TchadiTech', 'Tchaditude', 'Ingénierie &amp; Conseil', 'Engineering &amp; Advisory'): gaps.append(f'{f}: nom court « {m.group(1)} »')
for f in subprocess.run(['git', 'ls-files', '*.html'], capture_output=True, text=True).stdout.split():
    s = open(f, encoding='utf-8').read()
    if '<b><i aria-hidden="true"></i>' in s:
        for m in SHORT.finditer(s): gaps.append(f'{f}: nom court « {m.group(1)} »')
print('\n'.join(gaps) or 'Libellés des capacités : OK')
sys.exit(1 if gaps else 0)
