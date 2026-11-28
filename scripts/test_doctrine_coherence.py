# -*- coding: utf-8 -*-
"""Audit de cohérence du 27 novembre 2026 (#327, #330) : les décisions du DG restent appliquées partout.

Contrôle sur les sources (pas besoin de out/) : pages HTML publiées, sources des PDF (docs-sources) et index de
recherche (assets/chrome/*.js). Sont exclus les textes figés : communiqués publiés (communique/*, listes Communiqués
et Presse qui en reprennent les extraits) et carnets datés (journal-*, Carnets). Chaque règle rappelle la décision.
Exit 1 si un écart réapparaît, avec le fichier et l'extrait."""
import html
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FROZEN = re.compile(r'^(communique/|journal-|carnets(-en)?\.html$|communiques(-en)?\.html$|presse(-en)?\.html$|ar-presse\.html$)')

RULES = [
    ('positionnement « groupe énergétique intégré en construction » (24/11, #297, #327)', re.compile(
        r'EnerTchad(?: S\.A\.)? (?:est une soci[ée]t[ée] p[ée]troli[èe]re int[ée]gr[ée]e|is an integrated oil company)'
        r'|Chadian-owned oil company|oil company (?:in formation|under construction|born)'
        r'|soci[ée]t[ée] p[ée]troli[èe]re en constitution|compagnie p[ée]troli[èe]re int[ée]gr[ée]e'
        r'|p[ée]troli[èe]re n[ée]e autrement|p[ée]trolier tchadien en construction'
        r'|Int[ée]gr[ée]e\. \| Soci[ée]t[ée] p[ée]troli[èe]re|Integrated\. \| Oil company'
        r'|شركة نفط متكاملة')),
    ('premier site de raffinage : Moussoro, pas Djermaya (22/11)', re.compile(
        r'انجمينا–جرمايا|(?:premier site|premi[èe]re mini-raffinerie|first mini-refinery|first site)[^.<]{0,60}Djermaya')),
    ('Douala–N’Djamena : 1 842 km, Banque mondiale (22/11)', re.compile(
        r'(?:environ|about|≈|plus de|more than) 1[ ,]?800 km'
        r'|1[ ,]?(?!842)\d{3} km</b><span>(?:Route |Corridor )?Douala'
        r'|Douala–N’Djamena[^.<]{0,40}?\b1[ ,]?(?!842)\d{3} km')),
    ('deux cibles nommées : 80 % d’achats locaux, 80 % de personnel tchadien (20/11)', re.compile(
        r'80 ?% (?:de contenu local|local content)(?! by)|80 ?%</span><span>(?:de contenu local|Chadian local content)'
        r'|<b>80 ?%</b><span>De contenu local')),
    ('libellés des segments : Raffinage & Distribution, Ingénierie & Services (24-26/11)', re.compile(
        r'P[ôo]le Distribution|EnerConseils — ing[ée]nierie & conseil|EnerConseils — engineering & advisory')),
    ('7 chantiers phares : le corridor est retiré (22/11)', re.compile(
        r'\b8 (?:chantiers phares|dated flagship projects|flagship projects)|>8</b><span>(?:chantiers phares|dated flagship|flagship projects)')),
    ('corridor Doba–Kribi : pas un débouché d’EnerTchad (22/11)', re.compile(
        r'option (?:pour|for) (?:un |a |an )?surplus')),
]


def normalise(raw):
    t = raw.replace('&nbsp;', ' ').replace('&#8239;', ' ')
    t = html.unescape(t)
    return re.sub(r'[   ]', ' ', t)


def sources():
    out = subprocess.check_output(['git', 'ls-files', '*.html', 'assets/chrome/*.js'], cwd=ROOT, text=True).split()
    return [p for p in out if not FROZEN.match(p) and not p.startswith(('out/', 'node_modules/', 'qa/', 'reports/'))]


def main():
    errors = []
    files = sources()
    for rel in files:
        text = normalise(open(os.path.join(ROOT, rel), encoding='utf-8', errors='replace').read())
        if rel.endswith('.js'):
            # Index de recherche : les entrées des carnets datés reprennent des textes figés.
            text = re.sub(r'\{[^{}]*— (?:Journal|Carnet)[^{}]*\}', '', text)
        for name, rx in RULES:
            for m in rx.finditer(text):
                extrait = text[max(0, m.start() - 50):m.end() + 30].replace('\n', ' ')
                errors.append(f'{rel} — {name} : « …{extrait}… »')
    if errors:
        print('Cohérence : écarts revenus')
        for e in errors[:60]:
            print(' -', e)
        sys.exit(1)
    print(f'Cohérence : {len(files)} fichiers contrôlés, {len(RULES)} règles respectées')


if __name__ == '__main__':
    main()
