# -*- coding: utf-8 -*-
"""Refonte premium (phase 8) : mini-site arabe (8 pages, de droite a gauche).

Le mini-site arabe a son propre gabarit (pas de menu standard : il n existe que huit
pages arabes). Le generateur lui donne l habillage premium du reste du site :
  - en-tete arabe sobre (marque, six liens arabes, langues, bouton investisseurs) ;
  - heros photographique repris du heros de la page (sur-titre, titre, chapeau,
    chiffres, boutons, le fait marquant) ;
  - centre de confiance (.et-proof-center, cinq cartes) et acces rapides gardes, en cartes ;
  - contenu des sections conserve par le convertisseur « prose » de
    scripts/gen_premium_institution.py ;
  - pied de page nuit (structure footer.pft du site) avec les liens arabes, les versions
    completes, le courriel et les reseaux repris du pied de page arabe.
Feuilles : assets/chrome/home-inline-ar-premium.css (base, en-tete, sens de lecture, polices
arabes Noto Naskh / Noto Sans), pole-premium.css et premium-chrome.css. Theme clair par
defaut, comme le reste du site. Metadonnees et donnees structurees inchangees.
Controle : au moins 97 % du texte visible conserve. Idempotent (class="ppl").
Usage : python3 scripts/gen_premium_ar.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_institution as G  # noqa: E402
from gen_premium_pole import sp, inner, text, SUBNAV_JS, BeautifulSoup  # noqa: E402

BUILD = '202610012300'
PAGES = [('ar.html', 'pompe-petrole'), ('ar-poles.html', 'complexe-industriel'), ('ar-amont.html', 'chantier-ferraillage'),
         ('ar-intermediaire.html', 'pipeline'), ('ar-aval.html', 'raffinerie-jour'), ('ar-societe.html', 'dunes-sahara'),
         ('ar-investisseurs.html', 'flamme-gaz'), ('ar-contact.html', 'village-sahel')]
ALT_AR = {'pompe-petrole': 'مضخة نفط', 'complexe-industriel': 'مجمع صناعي', 'chantier-ferraillage': 'فريق في موقع عمل',
          'pipeline': 'خط أنابيب يعبر واديًا', 'raffinerie-jour': 'أعمدة مصفاة', 'dunes-sahara': 'كثبان الصحراء',
          'flamme-gaz': 'شعلة غاز', 'village-sahel': 'قرية في الساحل'}
CSS_LINKS = ('<link rel="preload" href="/assets/fonts/NotoNaskhArabic-500-arabic.woff2" as="font" type="font/woff2" crossorigin>\n'
             '<link rel="preload" href="/assets/fonts/NotoSansArabic-arabic.woff2" as="font" type="font/woff2" crossorigin>\n'
             f'<link rel="stylesheet" id="ar-premium" href="/assets/chrome/home-inline-ar-premium.css?b={BUILD}">\n'
             f'<link rel="stylesheet" id="pole-premium" href="/assets/chrome/pole-premium.css?b={BUILD}">\n'
             '<link rel="stylesheet" id="premium-chrome" href="/assets/chrome/premium-chrome.css?b=202610011500">\n')
DROP_TAIL = ['id="toTop"', 'lum-', 'u_cd226c00eb4b', 'cue-tact', 'hxShuffle', 'hx-slide', 'prem-home-js', 'secrail', 'id="subbar-fix"', 'id="flip',
             'id="kpi-count"', 'id="scrollguard"', 'id="tchad-heure-js"', 'idx563']


NOTS = ''.join(f':not(#r{i})' for i in range(26))
A = f'html[dir="rtl"]{NOTS}'
AD = f'html[dir="rtl"]:not(.et-plight){NOTS}'
AM = f'{A} body main.ppl'
THEME_BTN = ('<button class="arh-theme" id="arh-theme" type="button" aria-pressed="false" aria-label="الوضع الداكن">'
             '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">'
             '<circle cx="12" cy="12" r="8.2"></circle><path d="M12 3.8a8.2 8.2 0 0 0 0 16.4z" fill="currentColor"></path></svg></button>')
THEME_JS = ('<script id="arh-theme-js">(function(){var b=document.getElementById("arh-theme");if(!b)return;var d=document.documentElement;'
            'function s(){b.setAttribute("aria-pressed",d.classList.contains("et-plight")?"false":"true")}'
            'b.addEventListener("click",function(){var on=!d.classList.contains("et-plight");d.classList.toggle("et-plight",on);'
            'try{localStorage.setItem("et-plight",on?"1":"0")}catch(e){}s()});s()})();</script>')


def build_css():
    from pole_premium_css import imp
    src = open('scripts/ar-premium.src.css', encoding='utf-8').read()
    src = src.replace('@AM', AM).replace('@AD', AD).replace('@A', A)

    def rule(m):
        sel, body = m.group(1), m.group(2)
        if '@font-face' in sel:
            return m.group(0)
        return sel + '{' + imp(body) + '}'
    out = re.sub(r'([^{}]+)\{([^{}]*)\}', rule, src)
    open('assets/chrome/home-inline-ar-premium.css', 'w', encoding='utf-8').write(out)
    return len(out)


def add_class(sec_html, cls):
    m = re.match(r'<section\b[^>]*>', sec_html)
    tag = m.group(0)
    if ' class="' in tag:
        tag2 = tag.replace(' class="', f' class="{cls} ', 1)
    else:
        tag2 = tag[:-1] + f' class="{cls}">'
    return tag2 + sec_html[m.end():]


PARENT = {'ar-amont.html': '/ar-poles', 'ar-intermediaire.html': '/ar-poles', 'ar-aval.html': '/ar-poles'}


def current_of(a, path):
    """Lien courant : la page elle-meme, ou sa rubrique (pages de pole -> /ar-poles)."""
    href = a.get('href', '')
    own = '/ar' if path == 'ar.html' else '/' + path.replace('.html', '')
    if href == own:
        return ' aria-current="page"'
    if PARENT.get(path) == href:
        return ' aria-current="true"'
    return ''


def canon_nav():
    """Menu arabe commun : le plus complet des menus d origine (meme liens, meme ordre sur les huit pages)."""
    best = None
    for p, _ in PAGES:
        s = BeautifulSoup(open(p, encoding='utf-8').read(), 'html.parser')
        if 'class="ppl"' in str(s.find('main')):
            continue
        n = s.find('header', class_='top').find_next_sibling('nav')
        if best is None or len(n.find_all('a')) > len(best.find_all('a')):
            best = n
    return best


def header(old_header, old_nav, path):
    brand = old_header.select_one('a.brand')
    svg = brand.find('svg')
    lang = old_header.select_one('.lang')
    links = ''
    for a in old_nav.find_all('a'):
        cur = current_of(a, path)
        al = f' aria-label="{escape(a["aria-label"])}"' if a.get('aria-label') else ''
        links += f'<a href="{escape(a["href"])}"{cur}{al}>{inner(a)}</a>'
    langs = ''.join(f'<a href="{escape(a["href"])}"' + (' aria-current="page"' if 'on' in (a.get('class') or []) else '')
                    + (f' lang="{a["lang"]}"' if a.get('lang') else '') + f'>{inner(a)}</a>' for a in lang.find_all('a'))
    inv = next((a for a in old_nav.find_all('a') if 'investisseurs' in a['href']), None)
    cta = f'<a class="arh-cta" href="{escape(inv["href"])}">{inner(inv)}</a>' if inv is not None else ''
    return (f'<header class="arh"><div class="arh-in"><a class="arh-brand" href="/ar">{str(svg) if svg else ""}'
            f'<span dir="ltr">Ener<b>Tchad</b></span></a>'
            f'<nav class="arh-nav" aria-label="{escape(old_nav.get("aria-label", "التنقل بالعربية"))}">{links}</nav>'
            f'<div class="arh-tools"><span class="arh-lang" role="navigation" aria-label="{escape(lang.get("aria-label", "اللغة"))}">{langs}</span>{THEME_BTN}{cta}</div>'
            f'</div></header>')


def hero(h, img, hi=None):
    k = h.select_one('.kick')
    h1 = h.find('h1')
    lead = h.select_one('p.lead') or h.find('p')
    btns = ''
    for i, a in enumerate(h.select('.cta a, a.btn, a.btn2')):
        lab = escape(sp(a.get_text()).replace('←', '').replace('→', '').strip())
        cls = 'pp-btn pp-btn-light' if i == 0 else 'pp-link pp-link-l'
        btns += f'<a class="{cls}" href="{escape(a["href"])}">{lab}</a>'
    figs = ''.join(f'<div><b>{inner(x.b)}</b><span>{inner(x.span)}</span></div>' for x in h.select('.kpis .kpi')[:4])
    figs = f'<div class="pp-figs pp-figs-{min(4, len(h.select(".kpis .kpi")))}">{figs}</div>' if figs else ''
    hl = ''
    hi = h.select_one('[class^="h4"], [class^="m4"]') or hi
    if hi is not None and hi.find('a') is not None:
        a = hi.find('a')
        hl = (f'<p class="pp-fignote">{text(hi.find("i"))} · <a href="{escape(a["href"])}">'
              f'{text(a.find("time"))} — {text(a.find("span"))}</a></p>')
    himg = (f'<img class="pp-hero-img" src="/assets/img/p/{img}-1400.webp" srcset="/assets/img/p/{img}-800.webp 800w, '
            f'/assets/img/p/{img}-1400.webp 1400w" sizes="100vw" alt="{ALT_AR[img]}" width="1400" height="934" fetchpriority="high" decoding="async">')
    return (f'<header class="pp-hero pp-hero-s" id="top-pole">{himg}<div class="pp-wrap">'
            + (f'<p class="pp-k">{text(k)}</p>' if k is not None else '') + f'<h1>{inner(h1)}</h1>'
            + (f'<p class="pp-sublead">{inner(lead)}</p>' if lead is not None else '')
            + (f'<div class="pp-actions">{btns}</div>' if btns else '') + figs + hl + '</div></header>')


def proof(sec):
    """Centre de confiance : classes du contrat QA gardees (.et-proof-center, 5 .et-proof-card)."""
    hd = sec.select_one('.et-proof-head')
    cards = ''
    for a in sec.select('a.et-proof-card'):
        dl = ' download' if a.has_attr('download') else ''
        cards += (f'<li><a class="et-proof-card pp-card" href="{escape(a["href"])}"{dl}><span class="pp-k">{text(a.select_one(".et-proof-k"))}</span>'
                  f'<b>{inner(a.strong)}</b><span>{inner(a.find("span", class_=False))}</span>'
                  f'<em>{escape(sp(a.b.get_text()).replace("←", "").strip())}</em></a></li>')
    foot = sec.select_one('.et-proof-foot')
    foot_h = ''
    if foot is not None:
        foot_h = '<p class="pp-note">' + text(foot.find('span')) + ' · ' + ' · '.join(
            f'<a href="{escape(a["href"])}">{escape(sp(a.get_text()).replace("→", "").strip())}</a>' for a in foot.find_all('a')) + '</p>'
    return (f'<section class="et-proof-center" aria-labelledby="et-proof-title-ar"><div class="pp-wrap">'
            f'<div class="pp-head"><p class="pp-k">{text(hd.select_one(".sec-k"))}</p><h2 id="et-proof-title-ar">{inner(hd.h2)}</h2>'
            f'<p class="pp-lead">{inner(hd.p)}</p></div><ul class="pp-cards">{cards}</ul>{foot_h}</div></section>')


def intents(sec):
    items = ''
    for a in sec.select('a.et-intent'):
        sp_ = a.find('span')
        small = sp_.find('small')
        small_t = inner(small) if small is not None else ''
        if small is not None:
            small.extract()
        items += f'<li><a class="pp-card" href="{escape(a["href"])}"><b>{inner(sp_)}</b><span>{small_t}</span></a></li>'
    return (f'<section class="pp-compact" aria-label="{escape(sec.get("aria-label", ""))}"><div class="pp-wrap">'
            f'<ul class="pp-cards pp-cards-4">{items}</ul></div></section>')


def footer(old_footer, old_nav, motto, phone):
    w = old_footer.select_one('.wrap') or old_footer
    copy = sp(''.join(str(x) for x in w.contents if isinstance(x, str)).split('·')[0])
    links = [a for a in w.find_all('a')]
    full = ''.join(f'<a href="{escape(a["href"])}">{inner(a)}</a>' for a in links if 'mentions' not in a['href'])
    legal = ''.join(f'<a href="{escape(a["href"])}">{inner(a)}</a>' for a in links if 'mentions' in a['href'])
    arl = ''.join(f'<a href="{escape(a["href"])}">{inner(a)}</a>' for a in old_nav.find_all('a'))
    mail = w.find('span', dir='ltr')
    mail_t = sp(mail.get_text()) if mail is not None else ''
    contact = f'<a href="mailto:{mail_t}" dir="ltr">{mail_t}</a>' if mail_t else ''
    if phone is not None:
        contact += f'<a href="{escape(phone["href"])}" dir="ltr">{escape(sp(phone.get_text()))}</a>'
    soc = old_footer.select_one('.et-soc-foot')
    soc_h = ''
    if soc is not None:
        soc_h = ('<div class="foot-social" aria-label="' + escape(soc.get('aria-label', '')) + '">'
                 + ''.join(str(a) for a in soc.find_all('a')) + '</div>')
    return (f'<footer class="pft pft-ar"><div class="wrap">'
            + (f'<p class="pft-motto">{motto}</p>' if motto else '')
            + '<div class="foot-grid pft-grid"><div class="foot-brand"><a class="brand" href="/ar">'
            + '<span class="brand-tx" dir="ltr">Ener<span class="s">Tchad</span></span></a>'
            + f'<p class="foot-desc">{escape(motto_desc)}</p><div class="pft-contact">{contact}</div>{soc_h}</div>'
            + f'<div class="foot-col"><h3>بالعربية</h3>{arl}</div>'
            + f'<div class="foot-col"><h3>الموقع الكامل (FR · EN)</h3>{full}</div></div>'
            + f'<div class="foot-legal"><span class="pft-legal">{escape(copy)}</span><span class="foot-legal-links">{legal}</span>'
            + '<a class="pft-top" href="#top">أعلى الصفحة ↑</a></div></div></footer>')


motto_desc = 'شركة نفط متكاملة تشادية 100٪، قيد التأسيس — من الصخر الأم إلى المضخة.'


def phone_link():
    """Telephone du pied de page premium francais (copie, jamais retape)."""
    s = BeautifulSoup(open('societe.html', encoding='utf-8').read(), 'html.parser')
    return s.select_one('footer .pft-contact a[href^="tel:"]')


def rebuild(path, img, phone, nav):
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h:
        return 'deja migre'
    head_, rest = h[:h.find('<body')], h[h.find('<body'):]
    head_ = re.sub(r'<link\b[^>]*rel="stylesheet"[^>]*>\s*', '', head_)
    head_ = re.sub(r'<link\b[^>]*rel="preload"[^>]*>\s*', '', head_)
    head_ = re.sub(r'<style\b[^>]*>[\s\S]*?</style>\s*', '', head_)
    # theme clair par defaut, comme le reste du site
    head_, n = re.subn(r'function etSysClair\(\)\{try\{[\s\S]*?\}catch\(e\)\{return true\}\}', 'function etSysClair(){return true}', head_, count=1)
    assert n == 1, path
    head_ = head_.replace('</head>', CSS_LINKS + '</head>') if '</head>' in head_ else head_ + CSS_LINKS
    soup = BeautifulSoup(rest, 'html.parser')
    body = soup.body
    body_tag = re.match(r'<body[^>]*>', rest).group(0)
    skip = body.select_one('a[href="#main-content"]')
    skip_h = f'<a class="et-skip skip-link" href="#main-content">{inner(skip)}</a>'
    old_header = body.find('header', class_='top')
    old_nav = nav
    old_hero = body.select_one('div.hero')
    main = body.find('main')
    old_footer = body.find('footer')
    before = G.visible_text(str(old_hero) + ''.join(str(x) for x in old_hero.find_next_siblings('section')) + str(main))
    # fleches finales des liens : la feuille premium ajoute la sienne (pp-link)
    for a in main.find_all('a'):
        for t in reversed(list(a.find_all(string=True))):
            if not sp(t):
                continue
            t2 = re.sub(r'\s*[←→]\s*$', '', str(t))
            if t2 != str(t):
                t.replace_with(t2)
            break
    # rangee « chaine » (etapes separees par des fleches decoratives) : id stable pour la feuille arabe
    nch = 0
    for d in main.find_all('div'):
        kids = d.find_all(True, recursive=False)
        seps = [k for k in kids if k.name == 'span' and k.get('aria-hidden') == 'true' and sp(k.get_text()) in ('←', '→')]
        if seps and all(k.name in ('span', 'a') for k in kids):
            for k in seps:
                k.decompose()
            for k in d.find_all(True, recursive=False):
                if 'gold' in k.get('style', '') and k.name == 'span':
                    k['aria-current'] = 'step'
            nch += 1
            d.attrs = {'id': 'pp-chain-ar' + ('' if nch == 1 else f'-{nch}')}
    # rangee de documents a telecharger : id stable pour la feuille arabe
    for d in main.find_all('div'):
        kids = d.find_all(True, recursive=False)
        if len(kids) >= 2 and all(k.name == 'a' and k.has_attr('download') and k.find('b') is not None for k in kids):
            d.attrs = {'id': 'pp-docs-ar'}
            break
    hi = main.find('div', class_=re.compile(r'^m4'), recursive=False)
    if hi is not None:
        hi.extract()
    pre = []
    for el in old_hero.find_next_siblings():
        if el is main:
            break
        if el.name == 'section':
            pre.append(el)
    # contenu principal
    toc = []
    tnav = main.select_one('nav.idx563')
    if tnav is not None:
        toc = [(a['href'], sp(a.get_text())) for a in tnav.find_all('a')]
        tnav.decompose()
    secs_h = []
    for el in pre:
        if 'et-proof-center' in (el.get('class') or []):
            secs_h.append(proof(el))
        elif 'et-intents' in (el.get('class') or []):
            secs_h.append(intents(el))
    idx = 0
    for u in G.units(main):
        idx += 1
        hid = f'pp-h{idx}'
        if u['kind'] in ('sec', 'grp'):
            s = u['el']
            k, h2, lead, rest_ = G.split_head(s)
            if h2 is None:
                secs_h.append(f'<section{G.id_attr(s)} class="pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w">{G.prose(list(s.children), demote=False)}</div></div></section>')
                continue
            secs_h.append(f'<section{G.id_attr(s)} aria-labelledby="{hid}"><div class="pp-wrap">'
                          + G.head(text(k) if k is not None else '', hid, inner(h2), inner(lead) if lead is not None else '')
                          + f'<div class="pp-prose pp-prose-w">{G.prose(rest_)}</div></div></section>')
        else:
            nodes = u['nodes'] if u.get('h2') is None else [u['h2']] + u['nodes']
            secs_h.append(f'<section class="pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w">{G.prose(nodes, demote=False)}</div></div></section>')
    # fonds alternes
    out = []
    for i, s in enumerate(secs_h):
        if i % 2 == 1:
            s = add_class(s, 'pp-mist')
        out.append(s)
    subnav = ''
    if toc:
        subnav = '<nav class="pp-sub" aria-label="أقسام هذه الصفحة"><div class="pp-wrap">' + ''.join(
            f'<a href="{escape(hh)}">{escape(lb)}</a>' for hh, lb in toc[:10]) + '</div></nav>'
    motto = 'من الصخر الأم إلى المضخة.'
    main_h = (f'<main id="main-content" tabindex="-1" class="ppl" dir="rtl">\n{hero(old_hero, img, hi)}\n{subnav}\n' + '\n\n'.join(out)
              + f'\n{SUBNAV_JS}\n</main>')
    # scripts de fin de page utiles (enregistrement du service worker, etc.)
    tail = ''.join(str(x) for x in body.find_all('script', recursive=False)
                   if not any(k in str(x)[:400] for k in DROP_TAIL))
    after = G.visible_text(main_h)
    ratio = len(after) / max(1, len(before))
    out_h = (head_ + body_tag + '\n' + skip_h + '\n' + header(old_header, old_nav, path) + '\n' + main_h + '\n'
             + footer(old_footer, old_nav, motto, phone) + '\n' + tail + THEME_JS + '\n</body>\n</html>\n')
    out_h = re.sub(r'[ \t]+\n', '\n', re.sub(r'\n{4,}', '\n\n\n', out_h))
    if ratio < 0.97:
        raise SystemExit(f'{path} : texte conserve a {ratio:.1%} seulement, page non ecrite')
    open(path, 'w', encoding='utf-8').write(out_h)
    return f'{len(out_h)} octets, texte conserve {ratio:.1%}'


if __name__ == '__main__':
    print('ar-premium.css', build_css(), 'octets')
    ph = phone_link()
    nav = canon_nav()
    for p, img in PAGES:
        print(p, rebuild(p, img, ph, nav))
