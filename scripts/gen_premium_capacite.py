# -*- coding: utf-8 -*-
"""Refonte premium (phase 4) : pages des quatre capacites integrees, FR et EN.

GreenTech (durabilite), TchadiTech (technologies), Tchaditude (capital humain) et
EnerConseils (conseil & atlas) : meme gabarit que les pages de pole
(scripts/gen_premium_pole.py, dont on reprend l en-tete, le pied de page et les
fonctions d extraction), mais ces pages ont des sections propres a chacune. Les
sections connues (conviction, solutions, cas d usage, offre aux tiers, projets,
carnets, a lire ensuite) ont leur rendu dedie ; toutes les autres passent par un
convertisseur generique (sur-titre, titre, chapeau, cartes ou points, notes et liens),
dans l ordre de la page d origine. Les identifiants d ancre d origine sont conserves.

Le contenu est extrait de la page existante (aucun texte reecrit).
Idempotent : une page deja migree (class="ppl") est ignoree.
Usage : python3 scripts/gen_premium_capacite.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_pole as P  # noqa: E402
from gen_premium_pole import sp, inner, text, head_block, SUBNAV_JS  # noqa: E402

DUR = (('Durabilité', '/greentech/'), ('Sustainability', '/pole-greentech-en'))
ACT = (('Nos activités', '/nos-activites'), ('What we do', '/nos-activites-en'))
CAPS = [
    # page, langue, heros, (image conviction, largeur, hauteur), rubrique du fil d Ariane (None : la page est le hub)
    ('greentech/index.html', 'fr', 'solaire-champ', ('acacia-couchant', 800, 533), None),
    ('tchaditech/index.html', 'fr', 'code-numerique', ('datacenter', 800, 449), ACT),
    ('tchaditude/index.html', 'fr', 'village-sahel', ('casques-chantier', 700, 933), DUR),
    ('enerconseils/index.html', 'fr', 'lac-tchad-espace', ('piste-desert', 800, 640), ACT),
    ('pole-greentech-en.html', 'en', 'solaire-champ', ('acacia-couchant', 800, 533), None),
    ('pole-tchaditech-en.html', 'en', 'code-numerique', ('datacenter', 800, 449), ACT),
    ('pole-tchaditude-en.html', 'en', 'village-sahel', ('casques-chantier', 700, 933), DUR),
    ('pole-enerconseils-en.html', 'en', 'lac-tchad-espace', ('piste-desert', 800, 640), ACT),
]
ALT = {
    'solaire-champ': ('Champ de panneaux solaires', 'Solar panel field'),
    'code-numerique': ('Code informatique sur un écran', 'Computer code on a screen'),
    'village-sahel': ('Village du Sahel', 'Sahel village'),
    'lac-tchad-espace': ('Le lac Tchad photographié depuis l’orbite', 'Lake Chad photographed from orbit'),
    'acacia-couchant': ('Acacia au soleil couchant', 'Acacia at sunset'),
    'datacenter': ('Salle de serveurs', 'Server room'),
    'casques-chantier': ('Casques de chantier', 'Hard hats on a site'),
    'piste-desert': ('Piste dans le désert', 'Desert track'),
}
KNOWN = {'pmani', 'ilede', 'psol', 'bizcases', 'pole-proj', 'lie558'}
K_RX = re.compile(r'(^|-)k$|^(sec-k|kick)$')
LABEL_RX = re.compile(r'(-n|-no|-tag|-k|-h)$')


def clean_more(s):
    return escape(sp(s).rstrip(' →↓').strip())


def eyebrow_of(sec, h2):
    for el in sec.find_all(True):
        if el is h2:
            break
        if any(K_RX.search(c) for c in (el.get('class') or [])):
            return text(el).lstrip('◆ ')
    return ''


def card_fields(c, lang):
    """Champs d une carte : etiquette, titre, sous-titre, texte, chiffre, legende, lien interne."""
    title = c.find(['h3', 'h2']) or c.find('b') or c.find('strong')
    label = sub = body = fig = fl = ''
    more = None
    for el in c.find_all(['span', 'p', 'em', 'i', 'a']):
        cls = ' '.join(el.get('class') or [])
        if title is not None and (el is title or title in el.parents or el in title.parents):
            continue
        tx = sp(el.get_text(' '))
        if not tx:
            continue
        if el.name == 'a':
            if more is None and c.name != 'a':
                more = el
            continue
        if el.find_parent('a') is not None and el.find_parent('a') is not c:
            continue
        if re.search(r'-f$', cls):
            fig = inner(el); continue
        if re.search(r'-fl$', cls):
            fl = inner(el); continue
        if 'sub' in cls:
            sub = inner(el); continue
        if '→' in tx:
            continue
        before = title is not None and el.sourceline is not None and title.sourceline is not None and \
            (el.sourceline, el.sourcepos) < (title.sourceline, title.sourcepos)
        if not label and (before or LABEL_RX.search(cls)) and len(tx) < 48:
            label = escape(tx); continue
        if not body and el.name in ('p', 'span', 'em') and not el.find(['p', 'span']):
            body = inner(el)
    return label, inner(title) if title is not None else '', sub, body, fig, fl, more


def render_card(c, lang):
    label, title, sub, body, fig, fl, more = card_fields(c, lang)
    parts = (f'<span class="pp-k">{label}</span>' if label else '') + (f'<b>{title}</b>' if title else '') \
        + (f'<em>{sub}</em>' if sub else '') + (f'<span>{body}</span>' if body else '') \
        + (f'<strong>{fig}</strong>' if fig else '') + (f'<small>{fl}</small>' if fl else '')
    if c.name == 'a' and c.get('href'):
        return f'<li><a class="pp-card" href="{escape(c["href"])}">{parts}</a></li>'
    if more is not None and more.get('href'):
        parts += f'<a class="pp-link" href="{escape(more["href"])}">{clean_more(more.get_text())}</a>'
    return f'<li><div class="pp-card">{parts}</div></li>'


def find_cards(sec, h2):
    a = [x for x in sec.find_all('a') if x.find(['h3', 'b', 'div']) is not None and x.find_parent('p') is None]
    if a:
        return a
    d = [x for x in sec.find_all(['div', 'article'])
         if (x.name == 'article' or any('card' in c for c in (x.get('class') or [])))
         and x.find(['b', 'h3', 'strong']) is not None and not x.find(['div', 'article'], recursive=True)]
    if d:
        return d
    return [li for li in sec.find_all('li') if li.find(['b', 'h3', 'strong']) is not None]


def generic(sec, idx, lang):
    sec = P.BeautifulSoup(str(sec), 'html.parser').find()
    for t in sec.find_all(['svg', 'style', 'script', 'figure']):
        t.decompose()
    sid = sec.get('id') or f'pp-s{idx}'
    hid = f'pp-h{idx}'
    h2s = sec.find_all('h2')
    if len(h2s) > 1 and sec.find('article'):
        # recits en articles, chacun avec son propre titre
        head = head_block('', hid, escape(sec.get('aria-label', '')))
        cards = ''
        for art in sec.find_all('article'):
            h = art.find('h2')
            h.name = 'h3'
            cards += render_card(art, lang)
        return sid, escape(sec.get('aria-label', '')), (f'<div class="pp-wrap">{head}<ul class="pp-cards">{cards}</ul></div>')
    h2 = h2s[0] if h2s else None
    k = eyebrow_of(sec, h2) if h2 is not None else ''
    lead_el = h2.find_next_sibling('p') if h2 is not None else None
    if lead_el is None and h2 is not None:
        lead_el = h2.find_next('p')
    cards = find_cards(sec, h2)
    if lead_el is not None and any(lead_el in c.descendants for c in cards):
        lead_el = None
    head = head_block(k, hid, inner(h2) if h2 is not None else escape(sec.get('aria-label', '')), inner(lead_el) if lead_el is not None else '')
    items = ''.join(render_card(c, lang) for c in cards)
    # notes et liens hors cartes
    inside = set()
    for c in cards:
        inside.add(id(c))
        inside.update(id(x) for x in c.descendants)
    notes, links = '', ''
    for el in sec.find_all(['p', 'a']):
        if id(el) in inside or el is lead_el or (h2 is not None and h2 in el.parents):
            continue
        if el.name == 'p':
            if el.find_parent(['li', 'article']) is not None or any('card' in ' '.join(x.get('class') or []) for x in el.parents if x.name):
                continue
            if el.sourceline is not None and h2 is not None and (el.sourceline, el.sourcepos) < (h2.sourceline, h2.sourcepos):
                continue
            notes += f'<p class="pp-note">{inner(el)}</p>'
        elif el.find_parent('p') is None and el.get('href'):
            links += f'<a class="pp-link" href="{escape(el["href"])}">{clean_more(el.get_text())}</a>'
    body = (f'<ul class="pp-cards">{items}</ul>' if items else '') + (f'<div class="pp-notes">{notes}</div>' if notes else '') \
        + (f'<div class="pp-actions pp-actions-d">{links}</div>' if links else '')
    return sid, (inner(h2) if h2 is not None else ''), f'<div class="pp-wrap">{head}{body}</div>'


def build_cap(m, lang, hero, fig, crumb=None):
    t = P.L[lang]
    q = m.select_one
    li = 0 if lang == 'fr' else 1

    # Heros
    ph = q('header.pghero')
    h1 = inner(ph.select_one('h1'))
    figs = [(inner(k.b), inner(k.i)) for k in ph.select('.pgh-kpi')][:3]
    btn, btn2 = ph.select_one('a.pgh-btn'), ph.select_one('a.pgh-btn2')
    a2 = f'<a class="pp-link pp-link-l pgh-btn2" href="{escape(btn2["href"])}">{clean_more(btn2.get_text())}</a>' if btn2 else ''
    sig = ph.select_one('.tchsig')
    sig = f'<p class="pp-tagline">{inner(sig)}</p>' if sig else ''
    crumb_h = ''
    if crumb:
        crumb_h = f'<a href="{crumb[li][1]}">{crumb[li][0]}</a><span aria-hidden="true">›</span>'
    himg = (f'<img class="pp-hero-img" src="/assets/img/p/{hero}-1400.webp" srcset="/assets/img/p/{hero}-800.webp 800w, '
            f'/assets/img/p/{hero}-1400.webp 1400w" sizes="100vw" alt="{ALT[hero][li]}" width="1400" height="934" fetchpriority="high" decoding="async">')
    hero_h = (f'<header class="pp-hero" id="top-pole">{himg}<div class="pp-wrap">'
              f'<nav class="pp-crumb" aria-label="{"Fil d’Ariane" if lang == "fr" else "Breadcrumb"}">'
              f'<a href="{"/" if lang == "fr" else "/index-en"}">{t["home"]}</a><span aria-hidden="true">›</span>{crumb_h}'
              f'<span aria-current="page">{h1}</span></nav>'
              f'<p class="pp-k">{text(ph.select_one(".pgk"))}</p><h1>{h1}</h1><p class="pp-sublead">{inner(ph.select_one(".pgl"))}</p>{sig}'
              f'<div class="pp-actions pgh-cta"><a class="pp-btn pp-btn-light pgh-btn" href="{escape(btn["href"])}">{clean_more(btn.get_text())}</a>{a2}</div>'
              f'<div class="pp-figs">{"".join(f"<div><b>{a}</b><span>{b}</span></div>" for a, b in figs)}</div></div></header>')

    # Sequence des sections d origine (les groupes grp565 sont deplies)
    seq, anchors = [], {}
    for el in m.find_all(recursive=False):
        if el.name != 'section':
            continue
        cls = set(el.get('class') or [])
        if 'grp565' in cls:
            kids = el.find_all('section', recursive=False)
            if kids and el.get('id'):
                anchors[id(kids[0])] = [el['id']]
            seq.extend(kids)
        else:
            seq.append(el)

    secs, idx = [], 0
    tiers = carn = lie = None
    for el in seq:
        cls = set(el.get('class') or [])
        extra = anchors.get(id(el), [])
        if el.get('id') == 'offre-tiers':
            tiers = el; continue
        if (el.get('id') or '').startswith('carnets-'):
            carn = el; continue
        if 'lie558' in cls:
            lie = el; continue
        if 'pmani' in cls:
            il = q('section.ilede')
            cap = f'<div class="pp-cap"><h3>{inner(il.h2)}</h3><p>{inner(il.p)}</p></div>' if il else ''
            if il is not None and il.get('id'):
                extra = extra + [il['id']]
            fname, fw, fh = fig
            secs.append(('conviction', t['conv'], extra,
                         f'<div class="pp-wrap pp-manifesto"><div class="pp-sig">'
                         f'<h2 id="pp-conv" class="pp-k">{text(el.select_one(".pmani-k"))}</h2>'
                         f'<p class="pp-big">{inner(el.select_one(".pmani-q"))}</p><p class="pp-lead">{inner(el.select_one(".pmani-sub"))}</p>{cap}</div>'
                         f'<figure><img src="/assets/img/p/{fname}-fig.webp" alt="{ALT[fname][li]}" width="{fw}" height="{fh}" loading="lazy" decoding="async"></figure></div>'))
            continue
        if 'ilede' in cls:
            continue
        if 'psol' in cls:
            cards = ''
            for a in el.select('a.plc-card'):
                if a['href'].startswith('#'):
                    continue
                badge = a.select_one('.plc-badge')
                cards += (f'<li><a href="{escape(a["href"])}"><b>{inner(a.select_one(".plc-t"))}</b><span>{inner(a.select_one(".plc-d"))}</span>'
                          + (f'<em>{inner(badge)}</em>' if badge else '') + '</a></li>')
            pages = ''
            sn = q('nav.pole-subnav')
            if sn:
                pages = ''.join(f'<li><a href="{escape(a["href"])}">{inner(a)}</a></li>' for a in sn.select('a.psn-link') if 'is-active' not in (a.get('class') or []))
                pages = f'<div class="pp-pages"><p class="pp-k">{t["pages"]}</p><ul>{pages}</ul></div>' if pages else ''
            if el.get('id'):
                extra = extra + [el['id']]
            secs.append(('solutions', t['sol'], extra, f'<div class="pp-wrap">' + head_block(text(el.select_one('.psol-h')), 'pp-sol', inner(el.h2))
                         + f'<ul class="pp-domains">{cards}</ul>{pages}</div>'))
            continue
        if 'bizcases' in cls:
            rows = ''
            for c in el.select('article.biz-card'):
                rows += (f'<li><span class="pp-no">{text(c.select_one(".biz-no"))}</span>'
                         f'<div><p class="pp-k">{t["defi"]}</p><h3>{inner(c.select_one(".biz-defi"))}</h3><p>{inner(c.select_one(".biz-ctx"))}</p></div>'
                         f'<div><p class="pp-k">{t["rep"]}</p><p>{inner(c.select_one(".biz-rep"))}</p></div>'
                         f'<div><p class="pp-k">{t["cible"]}</p><p class="pp-tg">{inner(c.select_one(".biz-cible"), drop=(".biz-clab",))}</p></div></li>')
            if el.get('id'):
                extra = extra + [el['id']]
            secs.append(('cas', t['cas'], extra, '<div class="pp-wrap">' + head_block(text(el.select_one('.biz-k')), 'pp-cas', inner(el.h2), inner(el.select_one('.biz-lead')))
                         + f'<ol class="pp-cases">{rows}</ol></div>'))
            continue
        if 'pole-proj' in cls:
            cards = ''
            for c in el.select('article.ppj-card'):
                k = ' · '.join(text(x) for x in c.select('.ppj-kpi'))
                syn = ''.join(f'<a href="{escape(a["href"])}">{text(a)}</a>' for a in c.select('a.ppj-syn'))
                cards += (f'<article><p class="pp-k">{text(c.select_one(".ppj-h"))}</p><h3>{inner(c.select_one(".ppj-t"))}</h3>'
                          f'<p>{inner(c.select_one(".ppj-d"))}</p><p class="pp-kpis">{k}</p>'
                          + (f'<p class="pp-syn"><span>{t["syn"]}</span>{syn}</p>' if syn else '') + '</article>')
            sup = ''.join(f'<li><a href="{escape(a["href"])}"><b>{inner(a.b)}</b><span>{inner(a.i)}</span></a></li>' for a in el.select('a.ppj-sup'))
            sup = f'<div class="pp-contrib"><p class="pp-k">{text(el.select_one(".ppj-supk")) or t["contrib"]}</p><ul>{sup}</ul></div>' if sup else ''
            secs.append(('chantiers', t['proj'], extra, '<div class="pp-wrap">' + head_block(text(el.select_one('.ppj-k')), 'pp-proj', inner(el.h2), inner(el.select_one('.ppj-note')))
                         + (f'<div class="pp-proj">{cards}</div>' if cards else '') + f'{sup}</div>'))
            continue
        idx += 1
        sid, label, html = generic(el, idx, lang)
        secs.append((sid, label, extra, html))

    # Chapitre nuit : l offre aux tiers + les carnets
    night = ''
    if tiers is not None:
        doors = ''.join(f'<li><a href="{escape(a["href"])}"><b>{inner(a.b)}</b><span>{inner(a.span)}</span></a></li>' for a in tiers.select('a.otr-c'))
        ctas = tiers.select('.otr-cta a')
        btns = ''
        if ctas:
            btns = f'<a class="pp-btn pp-btn-gold" href="{escape(ctas[0]["href"])}">{clean_more(ctas[0].get_text())}</a>'
            btns += ''.join(f'<a class="pp-link pp-link-l" href="{escape(a["href"])}">{clean_more(a.get_text())}</a>' for a in ctas[1:])
        right = ''
        if carn is not None:
            feed = [(text(a.select_one('.c7d')), inner(a.select_one('.c7t')), a['href']) for a in carn.select('a.c7c')]
            go = carn.select_one('a.jn-go') or carn.select_one('a.c7all')
            kick = text(carn.select_one('.jn-kick') or carn.select_one('.c7k')).lstrip('◆ ')
            right = (f'<div><p class="pp-k">{kick}</p><ul class="pp-feed">'
                     + ''.join(f'<li><a href="{escape(h)}"><time>{d}</time><b>{tt}</b></a></li>' for d, tt, h in feed) + '</ul>'
                     + (f'<p><a class="pp-link pp-link-l" href="{escape(go["href"])}">{clean_more(go.get_text())}</a></p>' if go else '') + '</div>')
        night_id = carn['id'] if carn is not None else 'offre-tiers'
        anc = '' if night_id == 'offre-tiers' else '<span id="offre-tiers" class="pp-anchor"></span>'
        night = (f'<section id="{night_id}" class="pp-night" aria-labelledby="pp-cta">{anc}<div class="pp-wrap">'
                 f'<div class="pp-sig"><p class="pp-k">{text(tiers.select_one(".sec-k"))}</p><h2 id="pp-cta">{inner(tiers.h2)}</h2>'
                 f'<p class="pp-lead">{inner(tiers.select_one("h2 + p"))}</p><ul class="pp-feed pp-doors-n">{doors}</ul>'
                 f'<div class="pp-actions">{btns}</div></div>{right}</div></section>')

    suite = ''
    if lie is not None:
        nxt = ''.join(f'<a href="{escape(a["href"])}"><span class="pp-k">{text(a.i)}</span><b>{inner(a.b)}</b><span>{inner(a.span)}</span></a>' for a in lie.select('a.lie558-c'))
        suite = (f'<section class="pp-nextsec" aria-labelledby="pp-next"><div class="pp-wrap">'
                 f'<h2 id="pp-next" class="pp-k">{text(lie.h2)}</h2><div class="pp-next">{nxt}</div></div></section>')

    # Sections avec fond alterne, ancres d origine conservees
    out = []
    for i, (sid, label, extra, html) in enumerate(secs):
        mist = ' class="pp-mist"' if i % 2 else ''
        anc = ''.join(f'<span id="{escape(x)}" class="pp-anchor"></span>' for x in extra if x != sid)
        html = html.replace('<div class="pp-wrap', anc + '<div class="pp-wrap', 1) if anc else html
        hid = re.search(r'<h2 id="([^"]+)"', html).group(1)
        out.append(f'<section id="{escape(sid)}"{mist} aria-labelledby="{hid}">{html}</section>')

    # Sous-navigation : sections nommees courtement
    nav = []
    for sid, label, extra, html in secs:
        lab = re.sub(r'<[^>]+>', '', label)
        if sid in ('conviction', 'solutions', 'cas', 'chantiers') or (lab and len(lab) <= 30):
            nav.append(f'<a href="#{escape(sid)}">{lab}</a>')
    if tiers is not None:
        nav.append(f'<a href="#{carn["id"] if carn is not None else "offre-tiers"}">{"Aux tiers" if lang == "fr" else "For third parties"}</a>')
    subnav = f'<nav class="pp-sub" aria-label="{t["sub"]}"><div class="pp-wrap">{"".join(nav[:10])}</div></nav>'

    return (f'<main id="main-content" tabindex="-1" class="ppl">\n{hero_h}\n{subnav}\n' + '\n\n'.join(out)
            + f'\n\n{night}\n\n{suite}\n{SUBNAV_JS}\n</main>')


if __name__ == '__main__':
    for p, lang, hero, fig, crumb in CAPS:
        print(p, P.rebuild(p, lang, hero, fig, builder=lambda m, l, h, f, c=crumb: build_cap(m, l, h, f, c)))
