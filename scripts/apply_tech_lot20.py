"""Lot 20 : corrections techniques de l'audit (M4, M6, M7) appliquees au build.

Lance par apply_readiness_20261013.py (derniere etape), donc relancable : chaque
transformation est idempotente et verifie le nombre d'occurrences attendu.
- premium-chrome.css : bloc et-lot20 (scripts/tech-lot20.css), charge par toutes
  les pages de coeur ;
- projets(-en) : les trois scripts de fin de page passent en defer, comme sur les
  autres pages (le rendu n'attend plus 0,3 a 0,4 s d'execution, mesure CPU x4) ;
- accueil FR/EN : un seul prechargement de l'image du heros, avec imagesrcset et
  imagesizes identiques a l'<img> (audit m8) ; un mobile DPR 3 ne telecharge plus
  la variante 800 (21 Ko) en plus de la 1400 retenue par srcset.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START, END = '/* et-lot20:start */', '/* et-lot20:end */'
DEFER = ('u_cd226c00eb4b', 'u2_881fcf8bc439', 'u2_e8be195d19be')


def css_block():
    sheet = ROOT / 'assets/chrome/premium-chrome.css'
    old = sheet.read_text(encoding='utf-8')
    block = START + '\n' + (ROOT / 'scripts/tech-lot20.css').read_text(encoding='utf-8').strip() + '\n' + END
    if START in old:
        assert old.count(START) == 1 and old.count(END) == 1, 'et-lot20 block markers'
        new = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: block, old, flags=re.S)
    else:
        new = old.rstrip('\n') + '\n' + block + '\n'
    if new != old:
        sheet.write_text(new, encoding='utf-8')


def defer_scripts():
    for name in ('projets.html', 'projets-en.html'):
        page = ROOT / name
        old = page.read_text(encoding='utf-8')
        new = old
        for script in DEFER:
            sync = f'<script src="/assets/chrome/{script}.js"></script>'
            deferred = f'<script defer src="/assets/chrome/{script}.js"></script>'
            if deferred in new:
                continue
            assert new.count(sync) == 1, f'{name}: {script} expected once'
            new = new.replace(sync, deferred)
        if new != old:
            page.write_text(new, encoding='utf-8')


HERO = '/assets/img/p/lac-tchad-espace'
HERO_OLD = (f'<link rel="preload" as="image" href="{HERO}-1400.webp" media="(min-width:761px)" fetchpriority="high">',
            f'<link rel="preload" as="image" href="{HERO}-800.webp" media="(max-width:760px)" fetchpriority="high">')
HERO_NEW = (f'<link rel="preload" as="image" href="{HERO}-1400.webp" imagesrcset="{HERO}-800.webp 800w, '
            f'{HERO}-1400.webp 1400w" imagesizes="100vw" fetchpriority="high">')


def hero_preload():
    for name in ('index.html', 'index-en.html'):
        page = ROOT / name
        old = page.read_text(encoding='utf-8')
        if HERO_NEW in old:
            continue
        # L'<img> du heros doit garder le meme srcset/sizes que le prechargement.
        assert f'srcset="{HERO}-800.webp 800w, {HERO}-1400.webp 1400w" sizes="100vw"' in old, name + ': hero img'
        assert all(old.count(tag) == 1 for tag in HERO_OLD), name + ': hero preloads'
        new = old.replace(HERO_OLD[0], HERO_NEW).replace(HERO_OLD[1] + '\n', '').replace(HERO_OLD[1], '')
        page.write_text(new, encoding='utf-8')


def main():
    css_block()
    defer_scripts()
    hero_preload()
    print('Lot 20: et-lot20 CSS block, deferred end-of-page scripts on projets(-en), single hero preload on index(-en)')


if __name__ == '__main__':
    main()
