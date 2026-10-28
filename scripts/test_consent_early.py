# Lot 66 : chaque page exportée qui charge nav_a.js déclare aussi audience-consent.js en différé
# dans son <head>, une seule fois, à la même version que celle injectée par nav_a.js (repli conservé).
import glob
import re
import sys

nav = open('out/assets/chrome/nav_a.js', encoding='utf-8').read()
m = re.search(r'/assets/chrome/audience-consent\.js\?v=([0-9a-f]{12})', nav)
assert m, 'nav_a.js : injection du script de consentement absente'
ver = m.group(1)
pages = bad = 0
for f in glob.glob('out/**/*.html', recursive=True):
    h = open(f, encoding='utf-8').read()
    if '/assets/chrome/nav_a.js' not in h or '</head>' not in h:  # sans <head> fermé : rien à insérer
        continue
    pages += 1
    head = h[:h.find('</head>')]
    tags = re.findall(r'<script defer src="/assets/chrome/audience-consent\.js\?v=([0-9a-f]{12})"></script>', head)
    if tags != [ver]:
        bad += 1
        print('KO', f, tags)
print(pages, 'pages,', bad, 'en écart')
sys.exit(1 if bad or pages < 200 else 0)
