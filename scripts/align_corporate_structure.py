"""Align the published FR/EN pages with the corporate information architecture.

Run from the repository root after regenerating pages. Idempotent; keeps URLs,
page-specific language links, disclosure text and navigation DOM contracts.
"""
from pathlib import Path
import json
import re


def replace_block(text, pattern, transform):
    return re.sub(pattern, lambda m: transform(m.group(0)), text, flags=re.S)


def navigation(block, en):
    suffix = '-en' if en else ''
    centre = '/investor-center' + suffix
    block = block.replace('Trois pôles de cœur et la pétrochimie, prolongés par quatre capacités intégrées.',
                          'Quatre segments industriels, soutenus par quatre capacités intégrées.')
    block = block.replace('Three core divisions and petrochemicals, extended by four integrated capabilities.',
                          'Four industrial segments, supported by four integrated capabilities.')
    # The overview is the canonical investor entrance. Detailed thesis, agenda
    # and subscription links retain their original anchors.
    block = block.replace(f'href="/investisseurs{suffix}"', f'href="{centre}"')
    for cls in ('nx-util-in', 'nx-util-m'):
        def utilities(m):
            content = m.group(0)
            if f'href="/clients{suffix}"' not in content:
                label = 'Customers' if en else 'Clients'
                supplier = 'Suppliers' if en else 'Fournisseurs'
                content = content.replace(m.group(1), m.group(1) +
                    f'<a href="/clients{suffix}">{label}</a><a href="/achats{suffix}">{supplier}</a>', 1)
            return content
        block = re.sub(r'(<div class="' + cls + r'">).*?</div>', utilities, block, flags=re.S)
    return block


def mobile_bar(block, en):
    suffix = '-en' if en else ''
    centre = '/investor-center' + suffix
    labels = ('Customers', 'Suppliers', 'Investors') if en else ('Clients', 'Fournisseurs', 'Investisseurs')
    def link(m):
        tag = m.group(0)
        href = m.group(1)
        if 'services-ep' in href:
            tag = tag.replace(href, '/clients' + suffix)
            tag = re.sub(r'(?<=</svg>)[^<]+', labels[0], tag)
        elif '/aval/reseau' in href:
            tag = tag.replace(href, '/achats' + suffix)
            tag = re.sub(r'(?<=</svg>)[^<]+', labels[1], tag)
            tag = re.sub(r'<svg.*?</svg>', '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21V7l7 4V7l7 4V3h4v18H3z"/></svg>', tag, flags=re.S)
        elif href in ('/investisseurs', '/investisseurs-en'):
            tag = tag.replace(href, centre)
            tag = re.sub(r'(?<=</svg>)[^<]+', labels[2], tag)
        return tag
    return re.sub(r'<a href="([^"]+)".*?</a>', link, block, flags=re.S)


def homepage(text, en):
    suffix = '-en' if en else ''
    label = 'Investor Centre' if en else 'Centre investisseurs'
    text = text.replace('>Espace investisseurs</a>', '>Centre investisseurs</a>')
    text = text.replace('>Investor center</a>', '>Investor Centre</a>')
    def hero(header):
        note = re.search(r'<p class="ph-note">.*?</p>', header, re.S)
        if note:
            disclosure = note.group(0).strip()
            header = header[:note.start()] + header[note.end():]
            header = re.sub(r'\n{2,}', '\n', header)
            header = header.replace('<div class="ph-actions">', disclosure + '\n<div class="ph-actions">', 1)
        return header
    text = replace_block(text, r'<header class="ph-hero".*?</header>', hero)
    # Put audience routes immediately after the hero, before the long story.
    quick = re.search(r'\n?<section aria-label="(?:Accès directs|Quick access)">.*?</section>\n?', text, re.S)
    if quick:
        block = quick.group(0).strip().replace(f'href="/investisseurs{suffix}"', f'href="/investor-center{suffix}"')
        text = text[:quick.start()] + text[quick.end():]
        pos = text.index('</header>', text.index('<main')) + len('</header>')
        text = text[:pos] + '\n' + block + '\n' + text[pos:]
    def investor(section):
        pattern = r'<div class="ph-actions">.*?</div>'
        action = (f'<div class="ph-actions"><a class="ph-btn ph-btn-gold" data-et-action="invest" '
                  f'href="/investor-center{suffix}">{label}</a></div>')
        return re.sub(pattern, action, section, count=1, flags=re.S)
    text = replace_block(text, r'<section class="ph-night" aria-labelledby="ph-inv">.*?</section>', investor)
    def evidence(section):
        # News, projects and investors each already have their own homepage
        # section. The evidence section focuses on data and governance.
        return re.sub(r'<a class="et-proof-card" href="([^"]+)".*?</a>',
                      lambda m: '' if m.group(1).split('#')[0] in
                      ('/publications', '/publications-en', '/communiques', '/communiques-en', '/projets', '/projets-en')
                      else m.group(0), section, flags=re.S)
    text = replace_block(text, r'<section class="et-proof-center ph-mist".*?</section>', evidence)
    return text


def activities(text, en):
    if en:
        text = text.replace('Extract, move, transform — the same crude molecule crosses three core poles,',
                            'Extract, transport, refine, transform — the same crude molecule crosses four industrial segments,')
        text = text.replace('Petrochemicals extends the industrial chain. Four integrated capabilities',
                            'Four integrated capabilities')
        card = ('<a class="pp-cell" href="/pole-enerchimie-en"><i>04 · Petrochemicals</i><b>Petrochemicals</b>'
                '<p>Methanol, urea and bitumen: local transformation for agriculture, construction and industry.</p>'
                '<span>6 units planned in 3 phases</span><span>Explore →</span></a>')
    else:
        text = text.replace('Extraire, acheminer, transformer — la même molécule de brut traverse trois pôles de cœur,',
                            'Extraire, transporter, raffiner, transformer — la même molécule de brut traverse quatre segments industriels,')
        text = text.replace('La pétrochimie prolonge la chaîne industrielle. Quatre capacités intégrées',
                            'Quatre capacités intégrées')
        card = ('<a class="pp-cell" href="/petrochimie/"><i>04 · Pétrochimie</i><b>Pétrochimie</b>'
                '<p>Méthanol, urée et bitume : une transformation locale pour l’agriculture, le BTP et l’industrie.</p>'
                '<span>6 unités envisagées en 3 phases</span><span>Explorer →</span></a>')
    def segment(section):
        if ('04 · Petrochemicals' if en else '04 · Pétrochimie') not in section:
            section = section.replace('</div></div></div></section>', card + '</div></div></div></section>')
        return section
    text = replace_block(text, r'<section aria-labelledby="pp-h1">.*?</section>', segment)
    def capabilities(section):
        section = re.sub(r'<a href="/(?:petrochimie/|pole-enerchimie-en)">[^<]*</a>', '', section)
        if en:
            for a, b in [('/greentech/', '/pole-greentech-en'), ('/tchaditech/', '/pole-tchaditech-en'),
                         ('/tchaditude/', '/pole-tchaditude-en'), ('/enerconseils/', '/pole-enerconseils-en')]:
                section = section.replace(f'href="{a}"', f'href="{b}"')
        return section
    return replace_block(text, r'<section aria-labelledby="pp-h3">.*?</section>', capabilities)


def current_structure(text):
    # Keep dated press releases and journal stories unchanged. These replacements
    # are for current institutional descriptions, including FAQ structured data.
    pairs = [
        ('trois pôles de cœur — la Pétrochimie prolongeant le Raffinage &amp; distribution —', 'quatre segments industriels'),
        ('trois pôles de cœur — la Pétrochimie prolongeant le Raffinage & distribution —', 'quatre segments industriels'),
        ('three core poles — Petrochemicals extending Refining &amp; Distribution —', 'four industrial segments'),
        ('three core poles — Petrochemicals extending Refining & Distribution —', 'four industrial segments'),
        ('Trois pôles de cœur — la pétrochimie prolonge le Raffinage &amp; distribution —', 'Quatre segments industriels'),
        ('Trois forment la chaîne pétrolière, — la Pétrochimie prolonge le Raffinage &amp; distribution —', 'Quatre forment la chaîne industrielle, de l’exploration à la pétrochimie'),
        ('Three form the oil chain — Petrochemicals extends Refining &amp; Distribution —', 'Four form the industrial chain, from exploration to petrochemicals'),
        ('trois pôles de cœur — Exploration &amp; Production, Transport &amp; stockage, Raffinage &amp; distribution — la Pétrochimie prolongeant le Raffinage &amp; distribution — à',
         'quatre segments industriels — Exploration &amp; Production, Transport &amp; stockage, Raffinage &amp; distribution, Pétrochimie — soutenus par'),
        ('three core poles — Exploration &amp; Production, Transport &amp; Storage, Refining &amp; Distribution — Petrochemicals extending Refining &amp; Distribution — with',
         'four industrial segments — Exploration &amp; Production, Transport &amp; Storage, Refining &amp; Distribution, Petrochemicals — supported by'),
        ('trois maillons industriels de cœur, une extension de transformation', 'quatre segments industriels'),
        ('three core industrial links, one transformation extension', 'four industrial segments'),
        ('trois pôles de cœur', 'quatre segments industriels'), ('Trois pôles de cœur', 'Quatre segments industriels'),
        ('three core poles', 'four industrial segments'), ('Three core poles', 'Four industrial segments'),
        ('Three core divisions and petrochemicals, extended by four integrated capabilities.', 'Four industrial segments, supported by four integrated capabilities.'),
        ('3 pôles de cœur', '4 segments industriels'), ('3 core poles', '4 industrial segments'),
        ('data-count="3" data-suffix=" pôles de cœur"', 'data-count="4" data-suffix=" segments industriels"'),
        ('data-count="3" data-suffix=" core poles"', 'data-count="4" data-suffix=" industrial segments"'),
    ]
    for old, new in pairs:
        text = text.replace(old, new)
    return text


def main():
    changed = 0
    for page in Path('.').rglob('*.html'):
        if any(x in page.parts for x in ('.git', 'node_modules', 'reports', 'qa', 'docs-sources')):
            continue
        old = page.read_text(encoding='utf-8')
        text = old
        en = bool(re.search(r'<html[^>]*lang="en', text))
        # Arabic and standalone tools have their own navigation contract.
        if not re.search(r'<html[^>]*lang="(?:fr|en)', text):
            continue
        text = replace_block(text, r'<nav class="nav nx[^\"]*" id="nav".*?</nav>', lambda b: navigation(b, en))
        text = replace_block(text, r'<nav id="nezBar".*?</nav>', lambda b: mobile_bar(b, en))
        suffix = '-en' if en else ''
        def footer(block):
            return block.replace(f'href="/investisseurs{suffix}"', f'href="/investor-center{suffix}"')
        text = replace_block(text, r'<footer.*?</footer>', footer)
        institutional = {'societe.html', 'societe-en.html', 'faq.html', 'faq-en.html', 'essentiel.html', 'essentiel-en.html',
                         'presse.html', 'presse-en.html', 'brochure.html', 'brochure-en.html', 'charte.html', 'charte-en.html',
                         'cibles-2030.html', 'cibles-2030-en.html', 'plan-du-site.html', 'plan-du-site-en.html',
                         'pole-enerchimie-en.html', 'pole-tchaditude-en.html', 'pole-tchaditech-en.html',
                         'pole-greentech-en.html', 'pole-enerconseils-en.html'}
        capability_hubs = {'petrochimie/index.html', 'tchaditude/index.html', 'tchaditech/index.html',
                           'greentech/index.html', 'enerconseils/index.html'}
        if page.name in institutional or page.as_posix() in capability_hubs:
            # A company timeline contains historical release summaries.
            if page.name in ('societe.html', 'societe-en.html'):
                history = []
                def protect(m):
                    history.append(m.group(0))
                    return f'__ET_HISTORY_{len(history)-1}__'
                text = re.sub(r'<a class="pp-cell" href="/communiques(?:-en)?[^\"]*".*?</a>', protect, text, flags=re.S)
                text = current_structure(text)
                for i, block in enumerate(history):
                    text = text.replace(f'__ET_HISTORY_{i}__', block)
                text = text.replace('href="/index#poles"', 'href="/nos-activites"').replace('href="/index-en#poles"', 'href="/nos-activites-en"')
            else:
                text = current_structure(text)
        if page.name in ('index.html', 'index-en.html') and page.parent == Path('.'):
            text = homepage(text, en)
        if page.name in ('nos-activites.html', 'nos-activites-en.html'):
            text = activities(text, en)
        if page.name in ('recherche.html', 'recherche-en.html'):
            text = text.replace('Plus de cent pages, trois pôles de cœur, trente-deux carnets, quatre-vingts termes de glossaire : tapez un mot, la liste se filtre.',
                                'Quatre segments industriels, quatre capacités intégrées, actualités et ressources : tapez un mot, la liste se filtre.')
            text = text.replace('More than one hundred pages, three core poles, thirty-two notebooks, eighty glossary terms: type a word and the list narrows.',
                                'Four industrial segments, four integrated capabilities, news and resources: type a word and the list narrows.')
        if page.as_posix() in ('petrochimie/index.html', 'pole-enerchimie-en.html'):
            text = text.replace('Aval · Extension chimie', 'Pétrochimie · quatrième segment').replace('Downstream · Chemicals extension', 'Petrochemicals · fourth segment')
        if page.name in ('investor-center.html', 'investor-center-en.html'):
            text = text.replace('Investor Command Center', 'Investor Centre' if en else 'Centre investisseurs')
            text = text.replace('>Page investisseurs</a>', '>Thèse &amp; modèle détaillés</a>').replace('>Investor page</a>', '>Detailed thesis &amp; model</a>')
        if page.name in ('investisseurs.html', 'investisseurs-en.html'):
            text = text.replace('Ouvrir le Command Center →', 'Centre investisseurs · synthèse →').replace('Open Command Center →', 'Investor Centre · overview →')
            text = text.replace('Une vue décisionnelle pour statut, hypothèses et risques ; un registre machine-readable pour les pièces publiées.',
                                'Cette page détaille la thèse, le modèle et le capital. Le Centre investisseurs rassemble la synthèse, les hypothèses et les risques ; les publications donnent accès aux documents.')
            text = text.replace('One decision view for status, assumptions and risk; one machine-readable registry for the published evidence set.',
                                'This page details the thesis, model and capital. The Investor Centre brings together the overview, assumptions and risks; publications provide access to documents.')
            text = text.replace('<a href="/assets/data/document-registry.json">Registre documentaire →</a>', '<a href="/publications">Documents publiés →</a>')
            text = text.replace('<a href="/assets/data/document-registry.json">Document registry →</a>', '<a href="/publications-en">Published documents →</a>')
        if text != old:
            page.write_text(text, encoding='utf-8')
            changed += 1
    for lang in ('fr', 'en'):
        path = Path(f'assets/data/recherche-{lang}.json')
        entries = json.loads(path.read_text())
        for entry in entries:
            if entry['u'] in ('/nos-activites', '/nos-activites-en'):
                entry['d'] = ('Quatre segments industriels — exploration et production, transport et stockage, raffinage et distribution, pétrochimie — soutenus par quatre capacités intégrées.' if lang == 'fr' else
                              'Four industrial segments — exploration and production, transport and storage, refining and distribution, petrochemicals — supported by four integrated capabilities.')
                entry['k'] = 'pétrochimie quatre segments quatre capacités' if lang == 'fr' else 'petrochemicals four segments four capabilities'
        centre = '/investor-center' + ('-en' if lang == 'en' else '')
        entry = dict(u=centre, t='Centre investisseurs' if lang == 'fr' else 'Investor Centre',
                     d='Synthèse, statut, thèse, hypothèses, risques, gouvernance et documents.' if lang == 'fr' else 'Overview, status, thesis, assumptions, risks, governance and documents.',
                     s='Site', k='investisseurs capital financement synthèse risques' if lang == 'fr' else 'investors capital financing overview risks')
        entries = [x for x in entries if x['u'] != centre] + [entry]
        path.write_text(json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Aligned {changed} FR/EN pages and both search indexes.')


if __name__ == '__main__':
    main()
