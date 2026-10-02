# -*- coding: utf-8 -*-
"""Harmonisation des pages premium (main.ppl) : la feuille premium dessine la fleche des
liens (.pp-link::after) ; une fleche ecrite en fin de libelle faisait donc double emploi.
Retire la fleche finale (→ ← ↗) du libelle des liens .pp-link / .pp-btn.
Rangees d etiquettes (au moins trois <span> courts, sans icone, seuls dans un <div>) : le
convertisseur leur retirait leur classe et elles s affichaient collees ; elles recoivent la
classe .pp-tags (pastilles). Deux libelles courts cote a cote : classe .pp-meta (separes
par un point). Listes « libelle + valeur » (chaque puce commence par un <b> colle au texte qui
suit) : classe .pp-dl (libelle au-dessus de la valeur). Petits libelles colles au texte qui
suit (<p><span>, <th><span>, <span><b>, <div><b>) : classes .pp-lab et .pp-lb (libelle sur sa
ligne). Compteurs (suite de <span><b>n</b>libelle</span>) : classe .pp-stats. Puces ecrites
en texte (<li><span>▸</span>) retirees : la feuille dessine deja la puce. Encart « Continuer
dans <pole> » des pages metier (titres et descriptions colles) : cartes .pp-navcards et lien de
retour .pp-back. Suites d etapes (libelle, titre, texte, fleches) : .pp-steps ; intertitres
en <div> : .pp-minih ; date + texte : .pp-dated ; sommaire (intitules et liens) : .pp-toc ;
lien « ← Retour / destination » : .pp-backcard ; note precedee d un losange : .pp-box. Idempotent.
Usage : python3 scripts/harmonize_premium.py
"""
import glob
import re

A_RX = re.compile(r'(<a\b[^>]*\bclass="[^"]*\bpp-(?:link|btn)\b[^"]*"[^>]*>)((?:(?!</a>|<a\b).)*?)(</a>)', re.S)
END_RX = re.compile(r'(?:\s|&nbsp;)*[→←↗](\s*(?:</(?:span|b|strong|em)>\s*)*)$')


TAGS_RX = re.compile(r'<div>((?:\s*<span>((?:(?!</?(?:div|span)\b)[\s\S])*?)</span>\s*){3,})</div>')


NAV_RX = re.compile(r'(<nav\b(?![^>]*\bclass=)[^>]*>)((?:(?!</?nav\b)[\s\S])*?)</nav>')
DL_RX = re.compile(r'<ul>((?:\s*<li><b>[^<]{1,48}</b>(?:[^\s:;,.·—–<-]|<a\b)(?:(?!</?(?:li|ul)\b)[\s\S])*?</li>)+\s*)</ul>')
LAB_RX = re.compile(r'(<(?:p|th)\b[^>]*>)<span>([^<]{1,48})</span>(?=[A-Za-zÀ-ÿ0-9«(])')
LB_RX = re.compile(r'<(span|div)><b>([^<]{1,60})</b>(?=[A-Za-zÀ-ÿ0-9«(])')
MARK_RX = re.compile(r'<li><span>[▸►•]</span>')
STATS_RX = re.compile(r'<div( id="[^"]*")?>(\s*(?:<span><b>[^<]{1,14}</b>[^<]{1,48}</span>\s*){2,}(?:<span>[^<]{1,90}</span>\s*)?)</div>')
MORE_RX = re.compile(r'<div><div class="pp-k">([^<]+)</div><div>((?:<a href="[^"]*"><span><span>[^<]*</span><span>[^<]*</span></span></a>)+)</div>(<a href="[^"]*">[^<]*</a>)?</div>')
MORE_A_RX = re.compile(r'<a href="([^"]*)"><span><span>([^<]*)</span><span>([^<]*)</span></span></a>')
STEPS_RX = re.compile(r'<div>((?:\s*<div>(?:<(?:div|span)>[^<]{1,24}</(?:div|span)>)?<b>[^<]{1,60}</b><span>(?:(?!</?(?:div|span)\b)[\s\S])*?</span></div>\s*(?:<div(?: aria-hidden="true")?>→</div>)?)+\s*)</div>')
STEP_RX = re.compile(r'<div>((?:<(?:div|span)>[^<]{1,24}</(?:div|span)>)?<b>)')
ARROW_RX = re.compile(r'<div>→</div>')
CHIPS_RX = re.compile(r'<div><span>([^<]{2,40})</span>((?:<a href="[^"]*">[^<]{1,60}</a>){2,})</div>')
DOCS_RX = re.compile(r'<div>(\s*(?:<a\b[^>]*>(?:(?!</?a\b|</?div\b)[\s\S])*?</a>\s*){2,})</div>')
MINIH_RX = re.compile(r'(</p>|</div>)<div>([^<]{3,60})</div>(?=<p>)')
DATED_RX = re.compile(r'<div><span>([^<]*\w[^<]{0,11})</span><span>((?:(?!</?(?:div|span)\b)[\s\S])*?)</span></div>')
NOTE_RX = re.compile(r'<div><span>[◆◇]</span><span>((?:(?!</?(?:div|span)\b)[\s\S])*?)</span></div>')
TOC_RX = re.compile(r'<nav( aria-label="[^"]*")>((?:<span>[^<]*</span>|<a href="[^"]*">[^<]*</a>)+)</nav>')
BACKCARD_RX = re.compile(r'<a href="([^"]*)"><span>(←[^<]*)</span><span>([^<]*)</span></a>')
META_RX = re.compile(r'<div>((?:<span>((?:(?!</?(?:div|span)\b)[\s\S])*?)</span>\s*){2})</div>')


def tags(body):
    n = 0

    def short(m, lim=48):
        spans = re.findall(r'<span>((?:(?!</?(?:div|span)\b)[\s\S])*?)</span>', m.group(1))
        return '<svg' not in m.group(1) and all(0 < len(re.sub(r'<[^>]+>', '', x).strip()) <= lim for x in spans)

    def rep(m):
        nonlocal n
        if not short(m, 72):
            return m.group(0)
        n += 1
        return '<div class="pp-tags">' + m.group(1) + '</div>'

    def rep2(m):
        # deux libelles courts cote a cote (date et pole, mention et valeur) : separes par un point
        nonlocal n
        if not short(m):
            return m.group(0)
        n += 1
        return '<div class="pp-meta">' + m.group(1) + '</div>'
    body = TAGS_RX.sub(rep, body)
    body = META_RX.sub(rep2, body)

    def rep3(m):
        # menu de cartes (liens titre + sous-titre) : grille de cartes
        nonlocal n
        links = re.findall(r'<a\b[^>]*>((?:(?!</?a\b)[\s\S])*?)</a>', m.group(2))
        rest = re.sub(r'<a\b[^>]*>(?:(?!</?a\b)[\s\S])*?</a>', '', m.group(2)).strip()
        if rest or len(links) < 3 or not all(x.lstrip().startswith('<b>') for x in links):
            return m.group(0)
        n += 1
        return m.group(1)[:-1] + ' class="pp-navcards">' + m.group(2) + '</nav>'
    body = NAV_RX.sub(rep3, body)

    def rep4(m):
        # liste libelle + valeur : le libelle en gras etait colle a la valeur
        nonlocal n
        n += 1
        return '<ul class="pp-dl">' + m.group(1) + '</ul>'
    body = DL_RX.sub(rep4, body)

    def rep5(m):
        # compteur : chiffres sur une ligne, libelles dessous
        nonlocal n
        n += 1
        inner = re.sub(r'<span>(?!<b>)', '<span class="pp-cap">', m.group(2))
        return f'<div{m.group(1) or ""} class="pp-stats">' + inner + '</div>'
    body = STATS_RX.sub(rep5, body)

    def rep6(m):
        nonlocal n
        n += 1
        return m.group(1) + '<span class="pp-lab">' + m.group(2) + '</span>'
    body = LAB_RX.sub(rep6, body)

    def rep7(m):
        nonlocal n
        if m.string.rfind('class="pp-stats"', 0, m.start()) > m.string.rfind('</div>', 0, m.start()):
            return m.group(0)
        n += 1
        return f'<{m.group(1)}><b class="pp-lb">{m.group(2)}</b>'
    body = LB_RX.sub(rep7, body)
    def rep8(m):
        # « Continuer dans <pole> » : cartes titre + description, lien de retour au pole
        nonlocal n
        n += 1
        cards = MORE_A_RX.sub(r'<a href="\1"><b>\2</b><span>\3</span></a>', m.group(2))
        back = f'<p class="pp-back">{m.group(3)}</p>' if m.group(3) else ''
        return f'<div class="pp-more-pole"><p class="pp-k">{m.group(1)}</p><nav class="pp-navcards" aria-label="{m.group(1)}">{cards}</nav>{back}</div>'
    body = MORE_RX.sub(rep8, body)

    def rep9(m):
        # suite d etapes : rangee de cartes, fleches entre elles
        nonlocal n
        n += 1
        inner = ARROW_RX.sub('<div aria-hidden="true">→</div>', STEP_RX.sub(r'<div class="pp-step">\1', m.group(1)))
        return '<div class="pp-steps">' + inner + '</div>'
    body = STEPS_RX.sub(rep9, body)
    body, k1 = MINIH_RX.subn(r'\1<div class="pp-minih">\2</div>', body)
    body, k2 = NOTE_RX.subn(r'<div class="pp-box">\1</div>', body)
    body, k3 = DATED_RX.subn(r'<div class="pp-dated"><span>\1</span><span>\2</span></div>', body)

    def rep10(m):
        nonlocal n
        if '<span>' not in m.group(2):
            return m.group(0)
        n += 1
        return f'<nav class="pp-toc"{m.group(1)}>{m.group(2)}</nav>'
    body = TOC_RX.sub(rep10, body)
    body, k4 = BACKCARD_RX.subn(r'<a class="pp-backcard" href="\1"><span>\2</span><span>\3</span></a>', body)
    n += k1 + k2 + k3 + k4

    def rep11(m):
        # « Explorer par vous-meme : » suivi de liens : pastilles
        nonlocal n
        n += 1
        return f'<div class="pp-chips"><span class="pp-chips-k">{m.group(1)}</span>{m.group(2)}</div>'
    body = CHIPS_RX.sub(rep11, body)

    def rep12(m):
        # liste de documents (lien : titre en gras, description, format) : cartes
        nonlocal n
        links = re.findall(r'<a\b[^>]*>((?:(?!</?a\b)[\s\S])*?)</a>', m.group(1))
        if sum('<b>' in x for x in links) < 2:
            return m.group(0)
        n += 1
        inner = re.sub(r'<a href="([^"]*)">(?=[^<]*</a>)', r'<a class="pp-docs-all" href="\1">', m.group(1))
        return '<div class="pp-docs">' + inner + '</div>'
    body = DOCS_RX.sub(rep12, body)
    body, k5 = re.subn(r'<div><strong>([^<]{1,60})</strong><span>', r'<div><strong class="pp-lb">\1</strong><span>', body)
    n += k5
    body, k = MARK_RX.subn('<li>', body)
    return body, n + k


def fix(html):
    i = html.find('class="ppl"')
    if i < 0:
        return html, 0
    start = html.rfind('<main', 0, i)
    end = html.find('</main>', i)
    body = html[start:end]
    n = 0

    def rep(m):
        nonlocal n
        inner = END_RX.sub(r'\1', m.group(2))
        if inner != m.group(2) and re.sub(r'<[^>]+>', '', inner).strip():
            n += 1
            return m.group(1) + inner + m.group(3)
        return m.group(0)
    body2 = A_RX.sub(rep, body)
    if re.search(r'<html\b[^>]*\bdir="rtl"', html):
        # mini-site arabe : feuille et composants propres
        return html[:start] + body2 + html[end:], n
    body2, nt = tags(body2)
    return html[:start] + body2 + html[end:], n + nt


if __name__ == '__main__':
    tot = 0
    for f in sorted(glob.glob('**/*.html', recursive=True)):
        h = open(f, encoding='utf-8').read()
        h2, n = fix(h)
        if n:
            open(f, 'w', encoding='utf-8').write(h2)
            print(f, n)
            tot += n
    print(tot, 'correction(s) (fleches, etiquettes, libelles, compteurs)')
