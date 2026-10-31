# Lot 73 : dans les pages exportées, le menu « Activités & Ingénierie » (FR/EN) liste les quatre capacités
# intégrées, une seule fois chacune, dans l'ordre Durabilité, Technologies, Capital humain, Ingénierie & Conseil.
import glob
import re
import sys

ORDER = {'fr': ['/greentech/', '/tchaditech/', '/tchaditude/', '/enerconseils/'],
         'en': ['/pole-greentech-en', '/pole-tchaditech-en', '/pole-tchaditude-en', '/pole-enerconseils-en']}
pages = bad = 0
for f in glob.glob('out/**/*.html', recursive=True):
    h = open(f, encoding='utf-8').read()
    m = next((x for x in re.finditer(r'<div class="nx-col pn-links">(.*?)</div>', h, re.S) if '<strong>Technologies</strong>' in x.group(1)), None)
    if not m:
        continue
    pages += 1
    hrefs = re.findall(r'<a href="([^"]+)"', m.group(1))
    lang = 'en' if '/pole-tchaditech-en' in hrefs else 'fr'
    caps = [x for x in hrefs if x in ORDER[lang]]
    if caps != ORDER[lang]:
        bad += 1
        print('KO', f, caps)
print(pages, 'pages,', bad, 'en écart')
sys.exit(1 if bad or pages < 200 else 0)
