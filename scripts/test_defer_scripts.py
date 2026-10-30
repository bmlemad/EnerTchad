# Lot 69 : les trois scripts u_cd226c00eb4b.js, u2_881fcf8bc439.js et u2_e8be195d19be.js sont
# toujours chargés en « defer » dans les pages exportées (aucun chargement bloquant).
import glob
import re
import sys

bad = pages = 0
for f in glob.glob('out/**/*.html', recursive=True):
    h = open(f, encoding='utf-8').read()
    tags = re.findall(r'<script\b[^>]*src="/assets/chrome/(?:u_cd226c00eb4b|u2_881fcf8bc439|u2_e8be195d19be)\.js[^>]*>', h)
    if tags:
        pages += 1
    for t in tags:
        if 'defer' not in t:
            bad += 1
            print('KO', f, t)
print(pages, 'pages,', bad, 'chargement(s) bloquant(s)')
sys.exit(1 if bad or pages < 200 else 0)
