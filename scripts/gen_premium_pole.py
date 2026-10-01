# -*- coding: utf-8 -*-
"""Refonte premium (phase 3) : pages de pole FR et EN.

Reconstruit le <main> des huit pages de pole (amont, intermediaire, aval, petrochimie
et leurs versions anglaises) sur le gabarit premium valide dans la maquette :
heros photographique et trois chiffres, sous-navigation, conviction, metier,
solutions, offre, pour qui, methode, cas, chiffres, projets, capacites, expertises,
documents, chapitre nuit (devenir client + carnets), suite de la chaine.

Le contenu est extrait de la page existante (aucun texte reecrit) ; l en-tete, le
pied de page, les metadonnees et les donnees structurees restent inchanges.
Idempotent : une page deja migree (class="ppl") est ignoree.
Usage : python3 scripts/gen_premium_pole.py
"""
import re
from html import escape
from bs4 import BeautifulSoup

BUILD = '202610011800'
POLES = [
    # page, langue, image du heros, image de la conviction (fichier, largeur, hauteur, alt fr, alt en)
    ('amont/index.html', 'fr', 'chantier-ferraillage', ('drone-terrain', 1200, 659, 'Drone d’inspection au-dessus d’un champ', 'Inspection drone above a field')),
    ('intermediaire/index.html', 'fr', 'pipeline', ('reservoirs', 700, 980, 'Bacs de stockage d’un dépôt pétrolier', 'Storage tanks at an oil depot')),
    ('aval/index.html', 'fr', 'raffinerie-jour', ('station-nuit', 700, 466, 'Station-service éclairée de nuit', 'Service station lit at night')),
    ('petrochimie/index.html', 'fr', 'unite-petrochimie', ('complexe-industriel', 800, 532, 'Complexe industriel de transformation', 'Industrial processing complex')),
    ('pole-amont-en.html', 'en', 'chantier-ferraillage', ('drone-terrain', 1200, 659, '', '')),
    ('pole-intermediaire-en.html', 'en', 'pipeline', ('reservoirs', 700, 980, '', '')),
    ('pole-aval-en.html', 'en', 'raffinerie-jour', ('station-nuit', 700, 466, '', '')),
    ('pole-enerchimie-en.html', 'en', 'unite-petrochimie', ('complexe-industriel', 800, 532, '', '')),
]
HERO_ALT = {
    'chantier-ferraillage': ('Équipe sur un chantier', 'Crew on a construction site'),
    'pipeline': ('Pipeline traversant une vallée', 'Pipeline crossing a valley'),
    'raffinerie-jour': ('Colonnes de raffinerie', 'Refinery columns'),
    'unite-petrochimie': ('Unité pétrochimique', 'Petrochemical unit'),
}
FIG_ALT_EN = {
    'drone-terrain': 'Inspection drone above a field', 'reservoirs': 'Storage tanks at an oil depot',
    'station-nuit': 'Service station lit at night', 'complexe-industriel': 'Industrial processing complex',
}
L = {
    'fr': dict(home='Accueil', act=('Nos activités', '/nos-activites'), sub='Dans cette page',
               conv='La conviction', metier='Le métier', sol='Nos solutions', offre='L’offre', pourqui='Pour qui',
               meth='La méthode', cas='Cas d’usage', chif='Les chiffres', proj='Projets', caps='Capacités',
               exp='Expertises', docs='Documents', lire='À lire', pages='Toutes les pages du pôle',
               defi='Défi', rep='Réponse EnerTchad', cible='Cible', syn='Synergie', contrib='Contribue aussi à',
               carn='Les carnets du pôle', next='La suite de la chaîne', capsk='Le socle intégré'),
    'en': dict(home='Home', act=('What we do', '/nos-activites-en'), sub='On this page',
               conv='The conviction', metier='The trade', sol='Our solutions', offre='The offer', pourqui='Who it serves',
               meth='The method', cas='Use cases', chif='Key figures', proj='Projects', caps='Capabilities',
               exp='Expertise', docs='Documents', lire='Read', pages='All pages of the division',
               defi='Challenge', rep='EnerTchad response', cible='Target', syn='Synergy', contrib='Also contributes to',
               carn='The division’s notebooks', next='Along the chain', capsk='The integrated base'),
}
KEEP_CSS = ('bundle_head_b2', 'bundle_core_a1', 'nav_a.css', 'premium-chrome', 'x_00bf8a1c8438')
DROP_TAIL = ['hx-slide', 'hxShuffle', 'prem-home-js', 'id="subbar-fix"', 'id="flip-js"', 'id="flip2-js"', 'tilehub-js',
             'id="pl-close"', 'id="scrollguard"', 'id="kpi-count"', 'id="tchad-heure-js"', 'id="fil-js"', 'id="et640-js"',
             's_bded434d4e', 's_321e9a1a41', 's_1d29ed9395', 'id="cue-tact-js"', 'secrail-js', 'id="hero-x-js"']

SUBNAV_JS = ('<script id="pp-sub-js">(function(){var s=document.querySelector(".pp-sub"),n=document.getElementById("nav");'
             'if(!s||!n)return;var r=0;function f(){r=0;var b=n.getBoundingClientRect().bottom;'
             's.style.setProperty("--pp-st",Math.max(0,Math.round(b))+"px")}'
             'addEventListener("scroll",function(){if(!r)r=requestAnimationFrame(f)},{passive:true});'
             'addEventListener("resize",f);f()})();</script>')


def sp(s):
    return re.sub(r'\s+', ' ', s).strip()


def inner(el, drop=()):
    """HTML interne d un element (sans svg, styles, ni les sous-elements demandes)."""
    if el is None:
        return ''
    el = BeautifulSoup(str(el), 'html.parser').find()
    for t in el.find_all(['svg', 'style', 'script']):
        t.decompose()
    for sel in drop:
        for t in el.select(sel):
            t.decompose()
    for t in el.find_all(True):
        for a in ('style', 'class', 'data-eh', 'data-d', 'title'):
            if t.name != 'a' or a != 'title':
                t.attrs.pop(a, None)
    return sp(el.decode_contents())


def text(el):
    return escape(sp(el.get_text(' '))) if el is not None else ''


def img(name, alt, sizes, eager=False, cls=''):
    c = f' class="{cls}"' if cls else ''
    pr = 'fetchpriority="high" ' if eager else 'loading="lazy" '
    return (f'<img{c} src="/assets/img/p/{name}-1400.webp" srcset="/assets/img/p/{name}-700.webp 700w, '
            f'/assets/img/p/{name}-1400.webp 1400w" sizes="{sizes}" alt="{alt}" width="1400" height="934" '
            f'{pr}decoding="async">')


def head_block(k, h2id, h2, lead=''):
    lead = f'<p class="pp-lead">{lead}</p>' if lead else ''
    return f'<div class="pp-head"><p class="pp-k">{k}</p><h2 id="{h2id}">{h2}</h2>{lead}</div>'


def build_main(m, lang, hero, fig):
    t = L[lang]
    q = m.select_one
    secs, sub = [], []

    # Heros
    ph = q('header.pghero')
    h1 = inner(ph.select_one('h1'))
    eyebrow = text(ph.select_one('.pgk'))
    lead = inner(ph.select_one('.pgl'))
    kp = q('nav.plnav ul.plnav-kpi')
    if kp:
        figs = [(inner(li.b), inner(li.span)) for li in kp.find_all('li')][:3]
    else:
        figs = [(inner(k.b), inner(k.i)) for k in ph.select('.pgh-kpi')][:3]
    btn = ph.select_one('a.pgh-btn')
    btn2 = ph.select_one('a.pgh-btn2')
    figs_h = ''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a, b in figs)
    a2 = ''
    if btn2:
        h2ref = btn2['href']
        a2 = f'<a class="pp-link pp-link-l" href="{escape(h2ref)}">{escape(sp(btn2.get_text()).rstrip(" ↓→").strip())}</a>'
    halt = HERO_ALT[hero][0 if lang == "fr" else 1]
    himg = (f'<img class="pp-hero-img" src="/assets/img/p/{hero}-1400.webp" srcset="/assets/img/p/{hero}-800.webp 800w, '
            f'/assets/img/p/{hero}-1400.webp 1400w" sizes="100vw" alt="{halt}" width="1400" height="934" fetchpriority="high" decoding="async">')
    hero_h = (f'<header class="pp-hero" id="top-pole">{himg}'
              f'<div class="pp-wrap"><nav class="pp-crumb" aria-label="{"Fil d’Ariane" if lang == "fr" else "Breadcrumb"}">'
              f'<a href="{"/" if lang == "fr" else "/index-en"}">{t["home"]}</a><span aria-hidden="true">›</span>'
              f'<a href="{t["act"][1]}">{t["act"][0]}</a><span aria-hidden="true">›</span><span aria-current="page">{h1}</span></nav>'
              f'<p class="pp-k">{eyebrow}</p><h1>{h1}</h1><p class="pp-sublead">{lead}</p>'
              f'<div class="pp-actions"><a class="pp-btn pp-btn-light" href="{escape(btn["href"])}">{escape(sp(btn.get_text()).rstrip(" →").strip())}</a>{a2}</div>'
              f'<div class="pp-figs">{figs_h}</div></div></header>')

    # Conviction (+ cap du pole)
    pm = q('section.pmani')
    il = q('section.ilede')
    cap = ''
    if il:
        cap = f'<div class="pp-cap"><h3>{inner(il.h2)}</h3><p>{inner(il.p)}</p></div>'
    fname, fw, fh, falt_fr, _ = fig
    falt = falt_fr if lang == 'fr' else FIG_ALT_EN[fname]
    secs.append(('conviction', t['conv'], '',
                 f'<section id="conviction" aria-labelledby="pp-conv"><div class="pp-wrap pp-manifesto"><div class="pp-sig">'
                 f'<h2 id="pp-conv" class="pp-k">{text(pm.select_one(".pmani-k"))}</h2>'
                 f'<p class="pp-big">{inner(pm.select_one(".pmani-q"))}</p><p class="pp-lead">{inner(pm.select_one(".pmani-sub"))}</p>{cap}</div>'
                 f'<figure><img src="/assets/img/p/{fname}-fig.webp" alt="{falt}" width="{fw}" height="{fh}" loading="lazy" decoding="async"></figure>'
                 f'</div></section>'))

    # Le metier (etapes)
    ch = q('nav.chn603')
    if ch:
        steps = ''.join(f'<li><a href="{escape(a["href"])}"><b>{inner(a.b)}</b><span>{inner(a.span)}</span></a></li>'
                        for a in ch.select('ol > li > a'))
        secs.append(('metier', t['metier'], 'mist',
                     f'<section id="metier" class="pp-mist" aria-labelledby="pp-metier"><div class="pp-wrap">'
                     + head_block(text(ch.select_one('.k')), 'pp-metier', inner(ch.h2), inner(ch.select_one('p.n')))
                     + f'<ol class="pp-steps">{steps}</ol></div></section>'))

    # Nos solutions + toutes les pages du pole
    ps = q('section.psol')
    cards = ''
    for a in ps.select('a.plc-card'):
        if a['href'].startswith('#'):
            continue
        badge = a.select_one('.plc-badge')
        bd = f'<em>{inner(badge)}</em>' if badge else ''
        cards += f'<li><a href="{escape(a["href"])}"><b>{inner(a.select_one(".plc-t"))}</b><span>{inner(a.select_one(".plc-d"))}</span>{bd}</a></li>'
    pages = ''
    sn = q('nav.pole-subnav')
    if sn:
        pages = ''.join(f'<li><a href="{escape(a["href"])}">{inner(a)}</a></li>' for a in sn.select('a.psn-link') if 'is-active' not in (a.get('class') or []))
        pages = f'<div class="pp-pages"><p class="pp-k">{t["pages"]}</p><ul>{pages}</ul></div>'
    secs.append(('solutions', t['sol'], '',
                 f'<section id="solutions" aria-labelledby="pp-sol"><div class="pp-wrap">'
                 + head_block(text(ps.select_one('.psol-h')), 'pp-sol', inner(ps.h2))
                 + f'<ul class="pp-domains">{cards}</ul>{pages}</div></section>'))

    # L offre
    po = q('section.poffer')
    groups = ''
    for b in po.select('.vt-b'):
        lab = inner(b.select_one('.vt-ct'), drop=('.vt-n', '.vt-dot'))
        items = ''.join(f'<li><b>{inner(li.b, drop=("i",))}</b><span>{inner(li.span)}</span></li>' for li in b.select('ul.vt-grid > li'))
        groups += f'<div class="pp-group"><p class="pp-k">{lab}</p><ul>{items}</ul></div>'
    pp = q('section.ppt')
    if pp:
        items = ''.join(f'<li><b>{inner(c.select_one(".ppt-t"))}</b><span>{inner(c.select_one(".ppt-d"))}</span></li>' for c in pp.select('.ppt-card'))
        groups += f'<div class="pp-group"><p class="pp-k">{inner(pp.h2)}</p><p class="pp-gl">{inner(pp.select_one(".ppt-lead"))}</p><ul>{items}</ul></div>'
    go = po.select_one('a.vt-go')
    links = ''.join(f'<a class="pp-link" href="{escape(a["href"])}">{escape(sp(a.get_text()).rstrip(" →").strip())}</a>' for a in po.select('.vt-links a'))
    cta = f'<div class="pp-actions pp-actions-d"><a class="pp-btn pp-btn-ink" href="{escape(go["href"])}">{escape(sp(go.get_text()).rstrip(" →").strip())}</a>{links}</div>' if go else ''
    secs.append(('offre', t['offre'], 'mist',
                 f'<section id="offre" class="pp-mist" aria-labelledby="pp-offre"><div class="pp-wrap">'
                 + head_block(text(po.select_one('.pof-k')), 'pp-offre', inner(po.h2), inner(po.select_one('.pof-lead')))
                 + f'<div class="pp-groups">{groups}</div>{cta}</div></section>'))

    # Pour qui : promesse + portes d entree
    mk = q('section.mkt-sec')
    cl = q('section#clients')
    prom = ''.join(f'<div><p class="pp-k">{text(d.select_one(".n"))}</p><h3>{inner(d.h3)}</h3><p>{inner(d.select_one("p:not(.n)"))}</p></div>'
                   for d in mk.select('.mkt-promise > .pl'))
    doors = ''.join(f'<a href="{escape(a["href"])}"><b>{inner(a.b)}</b><span>{inner(a.span)}</span></a>' for a in cl.select('a.otr-c'))
    secs.append(('pourqui', t['pourqui'], '',
                 f'<section id="enjeux" aria-labelledby="pp-pq"><div class="pp-wrap">'
                 + head_block(text(mk.select_one('.mkt-head .k')), 'pp-pq', inner(mk.select_one('.mkt-head h2')), inner(mk.select_one('.mkt-head h2 + p')))
                 + f'<div class="pp-promise">{prom}</div><div class="pp-doors">{doors}</div></div></section>'))

    # La methode
    ap = q('section.apr')
    prin = ''.join(f'<div><span class="pp-no">{text(s.select_one(".apr-no"))}</span><h3>{inner(s.h3)}</h3><p>{inner(s.p)}</p></div>' for s in ap.select('.apr-step'))
    secs.append(('approche', t['meth'], 'mist',
                 f'<section id="approche" class="pp-mist" aria-labelledby="pp-meth"><div class="pp-wrap">'
                 + head_block(text(ap.select_one('.apr-k')), 'pp-meth', inner(ap.h2), inner(ap.select_one('.apr-lead')))
                 + f'<div class="pp-principles">{prin}</div></div></section>'))

    # Cas d usage
    bz = q('section.bizcases')
    rows = ''
    for c in bz.select('article.biz-card'):
        rws = c.select('.biz-row')
        cib = c.select_one('.biz-cible')
        rows += (f'<li><span class="pp-no">{text(c.select_one(".biz-no"))}</span>'
                 f'<div><p class="pp-k">{t["defi"]}</p><h3>{inner(c.select_one(".biz-defi"))}</h3><p>{inner(c.select_one(".biz-ctx"))}</p></div>'
                 f'<div><p class="pp-k">{t["rep"]}</p><p>{inner(c.select_one(".biz-rep"))}</p></div>'
                 f'<div><p class="pp-k">{t["cible"]}</p><p class="pp-tg">{inner(cib, drop=(".biz-clab",))}</p></div></li>')
    secs.append(('cas', t['cas'], '',
                 f'<section id="cas" aria-labelledby="pp-cas"><div class="pp-wrap">'
                 + head_block(text(bz.select_one('.biz-k')), 'pp-cas', inner(bz.h2), inner(bz.select_one('.biz-lead')))
                 + f'<ol class="pp-cases">{rows}</ol></div></section>'))

    # Les chiffres
    ak = q('section.avkpi')
    if ak:
        big = ''.join(f'<div><b>{text(c.b)}</b><span>{inner(c.i)}</span></div>' for c in ak.select('.avk-card'))
        secs.append(('chiffres', t['chif'], 'mist',
                     f'<section id="chiffres" class="pp-mist" aria-labelledby="pp-chif"><div class="pp-wrap">'
                     + head_block(text(ak.select_one('.avk-k')), 'pp-chif', inner(ak.h2))
                     + f'<div class="pp-bigfigs">{big}</div><p class="pp-note">{inner(ak.select_one(".avk-note"))}</p></div></section>'))

    # Projets
    pj = q('section.pole-proj')
    cards = ''
    for c in pj.select('article.ppj-card'):
        k = ' · '.join(text(x) for x in c.select('.ppj-kpi'))
        syn = ''.join(f'<a href="{escape(a["href"])}">{text(a)}</a>' for a in c.select('a.ppj-syn'))
        cards += (f'<article><p class="pp-k">{text(c.select_one(".ppj-h"))}</p><h3>{inner(c.select_one(".ppj-t"))}</h3>'
                  f'<p>{inner(c.select_one(".ppj-d"))}</p><p class="pp-kpis">{k}</p>'
                  f'<p class="pp-syn"><span>{t["syn"]}</span>{syn}</p></article>')
    sup = ''.join(f'<li><a href="{escape(a["href"])}"><b>{inner(a.b)}</b><span>{inner(a.i)}</span></a></li>' for a in pj.select('a.ppj-sup'))
    sup = f'<div class="pp-contrib"><p class="pp-k">{text(pj.select_one(".ppj-supk")) or t["contrib"]}</p><ul>{sup}</ul></div>' if sup else ''
    cls_pj = '' if ak else ' class="pp-mist"'
    cls_ca = ' class="pp-mist"' if ak else ''
    secs.append(('chantiers', t['proj'], 'plain' if ak else 'mist',
                 f'<section id="chantiers"{cls_pj} aria-labelledby="pp-proj"><div class="pp-wrap">'
                 + head_block(text(pj.select_one('.ppj-k')), 'pp-proj', inner(pj.h2), inner(pj.select_one('.ppj-note')))
                 + f'<div class="pp-proj">{cards}</div>{sup}</div></section>'))

    # Capacites integrees
    ca = q('section#capacites')
    caps = ''.join(f'<a href="{escape(a["href"])}"><b>{inner(a.b)}</b><span>{inner(a.span)}</span></a>' for a in ca.select('a.capint-c'))
    secs.append(('capacites', t['caps'], 'mist' if ak else '',
                 f'<section id="capacites"{cls_ca} aria-labelledby="pp-caps"><div class="pp-wrap">'
                 + head_block(text(ca.select_one('.sec-k')), 'pp-caps', inner(ca.h2), inner(ca.select_one('h2 + p')))
                 + f'<div class="pp-caps">{caps}</div></div></section>'))

    # Expertises (repliees)
    ex = q('section#expertises')
    if ex:
        items = ''
        for c in ex.select('.exp-c'):
            b = c.b
            title = inner(b, drop=('.exp-badge',))
            badge = b.select_one('.exp-badge')
            bd = f' <em>{text(badge)}</em>' if badge else ''
            body = inner(c.p) if c.p else ' · '.join(text(s) for s in c.select('.exp-items span'))
            items += f'<details><summary>{title}{bd}</summary><p>{body}</p></details>'
        note = ex.select_one('.exp-note')
        secs.append(('expertises', t['exp'], '',
                     f'<section id="expertises" aria-labelledby="pp-exp"><div class="pp-wrap pp-twocol"><div>'
                     + head_block(text(ex.select_one('.exp-k')), 'pp-exp', inner(ex.h2), inner(ex.select_one('.exp-lede')))
                     + (f'<p class="pp-note">{inner(note)}</p>' if note else '')
                     + f'</div><div class="pp-exp">{items}</div></div></section>'))

    # Documents
    dc = q('section#documents')
    if dc:
        docs = ''
        for a in dc.select('a.doc-c'):
            sps = a.find_all('span', recursive=False)
            dl = ' download' if a.has_attr('download') else ''
            docs += (f'<li><a href="{escape(a["href"])}"{dl}><span class="pp-k">{text(a.select_one(".dt"))}</span>'
                     f'<b>{inner(a.b)}</b><span>{inner(sps[-1]) if len(sps) > 1 else ""}</span></a></li>')
        al = dc.select_one('a.doc-all')
        alh = f'<p><a class="pp-link" href="{escape(al["href"])}">{escape(sp(al.get_text()).rstrip(" →").strip())}</a></p>' if al else ''
        secs.append(('documents', t['docs'], 'mist',
                     f'<section id="documents" class="pp-mist" aria-labelledby="pp-docs"><div class="pp-wrap">'
                     + head_block(text(dc.select_one('.doc-k')).lstrip('◆ '), 'pp-docs', inner(dc.h2))
                     + f'<ul class="pp-docs">{docs}</ul>{alh}</div></section>'))

    # Chapitre nuit : devenir client + carnets
    cn = m.select_one('section[id^="carnets-"]')
    feed = []
    for a in cn.select('a.c7c'):
        feed.append((text(a.select_one('.c7d')), inner(a.select_one('.c7t')), a['href']))
    if not feed:
        a = ph.select_one('a.m457-a')
        if a:
            feed.append((text(a.time), inner(a.span), a['href']))
    go = cn.select_one('a.jn-go') or cn.select_one('a.c7all')
    feed_h = ''.join(f'<li><a href="{escape(h)}"><time>{d}</time><b>{tt}</b></a></li>' for d, tt, h in feed)
    golink = f'<p><a class="pp-link pp-link-l" href="{escape(go["href"])}">{escape(sp(go.get_text()).rstrip(" →").strip())}</a></p>' if go else ''
    ctas = cl.select('.otr-cta a')
    btns = ''
    if ctas:
        btns = f'<a class="pp-btn pp-btn-gold" href="{escape(ctas[0]["href"])}">{escape(sp(ctas[0].get_text()).rstrip(" →").strip())}</a>'
        btns += ''.join(f'<a class="pp-link pp-link-l" href="{escape(a["href"])}">{escape(sp(a.get_text()).rstrip(" →").strip())}</a>' for a in ctas[1:])
    kick = text(cn.select_one('.jn-kick') or cn.select_one('.c7k')).lstrip('◆ ')
    secs.append(('carnets', t['lire'], 'night',
                 f'<section id="{cn["id"]}" class="pp-night" aria-labelledby="pp-cta"><div class="pp-wrap">'
                 f'<div class="pp-sig"><p class="pp-k">{text(cl.select_one(".sec-k"))}</p><h2 id="pp-cta">{inner(cl.h2)}</h2>'
                 f'<p class="pp-lead">{inner(cl.select_one("h2 + p"))}</p><div class="pp-actions">{btns}</div></div>'
                 f'<div><p class="pp-k">{kick}</p><ul class="pp-feed">{feed_h}</ul>{golink}</div></div></section>'))

    # La suite de la chaine
    li = q('section.lie558')
    nxt = ''.join(f'<a href="{escape(a["href"])}"><span class="pp-k">{text(a.i)}</span><b>{inner(a.b)}</b><span>{inner(a.span)}</span></a>' for a in li.select('a.lie558-c'))
    chain = q('nav.chv')
    chain_h = ''
    if chain:
        parts = []
        for a in chain.select('a'):
            cur = ' aria-current="page"' if a.get('aria-current') else ''
            parts.append(f'<a href="{escape(a["href"])}"{cur}>{inner(a)}</a>')
        chain_h = (f'<nav class="pp-chain" aria-label="{escape(chain.get("aria-label", ""))}"><span class="pp-k">{text(chain.select_one(".chv-k"))}</span>'
                   + '<span aria-hidden="true">→</span>'.join(parts) + '</nav>')
    secs.append(('suite', li.h2.get_text(), '',
                 f'<section class="pp-nextsec" aria-labelledby="pp-next"><div class="pp-wrap">'
                 f'<h2 id="pp-next" class="pp-k">{text(li.h2)}</h2><div class="pp-next">{nxt}</div>{chain_h}</div></section>'))

    # Sous-navigation (ancres des sections presentes)
    want = ['conviction', 'metier', 'solutions', 'offre', 'approche', 'cas', 'chiffres', 'chantiers', 'documents']
    ids = {'conviction': 'conviction', 'metier': 'metier', 'solutions': 'solutions', 'offre': 'offre', 'approche': 'approche',
           'cas': 'cas', 'chiffres': 'chiffres', 'chantiers': 'chantiers', 'documents': 'documents'}
    present = {s[0]: s[1] for s in secs}
    subnav = ''.join(f'<a href="#{ids[k]}">{present[k]}</a>' for k in want if k in present)
    subnav = f'<nav class="pp-sub" aria-label="{t["sub"]}"><div class="pp-wrap">{subnav}</div></nav>'

    return (f'<main id="main-content" tabindex="-1" class="ppl">\n{hero_h}\n{subnav}\n'
            + '\n\n'.join(s[3] for s in secs)
            + f'\n{SUBNAV_JS}\n</main>')


def rebuild(path, lang, hero, fig):
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h:
        return 'deja migre'
    head, rest = h[:h.find('<body')], h[h.find('<body'):]
    # feuilles : seules celles de l en-tete commun restent ; ajout de la feuille premium des poles
    def css(mm):
        tag = mm.group(0)
        return tag if any(k in tag for k in KEEP_CSS) else ''
    head = re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>\s*', css, head)
    head = re.sub(r'<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>\s*', '', head)
    head = head.replace('<link rel="stylesheet" id="premium-chrome"',
                        f'<link rel="stylesheet" id="pole-premium" href="/assets/chrome/pole-premium.css?b={BUILD}">\n'
                        '<link rel="stylesheet" id="premium-chrome"', 1)
    body_tag = re.match(r'<body[^>]*>', rest).group(0)
    skip = re.search(r'<a [^>]*href="#main-content"[^>]*>[^<]*</a>', rest).group(0)
    nav = re.search(r'<nav class="nav nx pn" id="nav"[\s\S]*?</nav>\s*(?=<script src="/assets/chrome/nav_a)', rest).group(0).rstrip()
    navjs = re.search(r'<script src="/assets/chrome/nav_a\.js[^>]*></script>', rest).group(0)
    footer = re.search(r'<footer class="pft">[\s\S]*?</footer>', rest).group(0)
    tail = rest[rest.find('</footer>') + len('</footer>'):rest.rfind('</body>')]
    tail = re.sub(r'<script[^>]*>[\s\S]*?</script>',
                  lambda mm: '' if any(k in mm.group(0)[:400] for k in DROP_TAIL) else mm.group(0), tail)
    tail = re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>\s*', css, tail)
    tail = re.sub(r'<div class="(rootland|subland)"[^>]*></div>', '', tail)
    tail = re.sub(r'<button type="button" id="scrollcue"[\s\S]*?</button>', '', tail)
    tail = re.sub(r'\n{3,}', '\n\n', tail)
    soup = BeautifulSoup(rest[rest.find('<main'):rest.find('</main>') + 7], 'html.parser')
    main = build_main(soup.find('main'), lang, hero, fig)
    out = (head + body_tag + '\n' + skip + '\n<div id="readbar" aria-hidden="true"></div>\n' + nav + '\n' + navjs + '\n'
           + main + '\n' + footer + tail + '\n</body>\n</html>\n')
    out = re.sub(r'\n{4,}', '\n\n\n', out)
    open(path, 'w', encoding='utf-8').write(out)
    return len(out)


if __name__ == '__main__':
    for p, lang, hero, fig in POLES:
        print(p, rebuild(p, lang, hero, fig))
