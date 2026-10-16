"""Expose the planned engineering capability through existing bilingual routes.

Runs after the shared editorial migrations. Preserve contact data, navigation
behavior, historical articles, existing page anchors and language pairs.
"""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'.git', '.next', 'out', 'public', 'node_modules', 'reports', 'qa', 'docs-sources'}
PAGES = {'enerconseils/index.html': False, 'pole-enerconseils-en.html': True}
START = '<!-- engineering-offer:start -->'
END = '<!-- engineering-offer:end -->'
ACTIVITIES = [
    ('amont/index.html', 'pole-amont-en.html', '/amont/', '/pole-amont-en',
     'Exploration & production', 'Exploration & production',
     'Capacité prévue : études de réservoir, conception des installations, assistance au développement et suivi des projets.',
     'Planned capability: reservoir studies, facility design, development assistance and project monitoring.'),
    ('intermediaire/index.html', 'pole-intermediaire-en.html', '/intermediaire/', '/pole-intermediaire-en',
     'Transport & stockage', 'Transport & storage',
     'Capacité prévue : études de flux, conception des dépôts et réseaux, assistance technique et suivi des infrastructures.',
     'Planned capability: flow studies, depot and network design, technical assistance and infrastructure monitoring.'),
    ('aval/index.html', 'pole-aval-en.html', '/aval/', '/pole-aval-en',
     'Raffinage & distribution', 'Refining & distribution',
     'Capacité prévue : études de procédés, conception des unités et stations, assistance technique et suivi des projets.',
     'Planned capability: process studies, plant and station design, technical assistance and project monitoring.'),
    ('petrochimie/index.html', 'pole-enerchimie-en.html', '/petrochimie/', '/pole-enerchimie-en',
     'Pétrochimie', 'Petrochemicals',
     'Capacité prévue : études de faisabilité, choix des procédés, coordination de la conception et suivi des unités.',
     'Planned capability: feasibility studies, process selection, design coordination and plant project monitoring.'),
]


def section(en):
    label = 'Engineering & Advisory' if en else 'Ingénierie & Conseil'
    title = 'From the study to project delivery' if en else 'De l’étude au suivi de projet'
    intro = ('A cross-cutting capability planned for exploration and production, transport and storage, refining and petrochemicals. The scope of each assignment will depend on the project, the expertise mobilised and the required approvals.' if en else
             'Une capacité transversale prévue pour l’exploration-production, le transport et le stockage, le raffinage et la pétrochimie. Le périmètre de chaque mission dépendra du projet, des expertises mobilisées et des autorisations nécessaires.')
    cards = [
        ('Studies & feasibility', 'Define the need, compare technical options and assess costs, risks and environmental constraints.', 'Expected outputs: scoping note, options analysis and feasibility report.'),
        ('Design & project preparation', 'Prepare design requirements, coordinate specialist studies and define technical specifications appropriate to local conditions.', 'Expected outputs: design basis, technical specifications and consultation documents.'),
        ('Technical assistance', 'Support the project owner in reviewing technical proposals, coordinating interfaces and preparing decisions.', 'Expected outputs: review reports, interface register and decision records.'),
        ('Project monitoring', 'Plan milestones, monitor quality, cost and schedule, and prepare acceptance and commissioning with qualified partners.', 'Expected outputs: progress reports, action register and acceptance documents.'),
    ] if en else [
        ('Études & faisabilité', 'Définir le besoin, comparer les options techniques et évaluer les coûts, les risques et les contraintes environnementales.', 'Livrables envisagés : note de cadrage, analyse des options et rapport de faisabilité.'),
        ('Conception & préparation', 'Préparer les bases de conception, coordonner les études spécialisées et définir les spécifications adaptées aux conditions locales.', 'Livrables envisagés : bases de conception, spécifications techniques et dossiers de consultation.'),
        ('Assistance technique', 'Accompagner le maître d’ouvrage dans la revue des propositions techniques, la coordination des interfaces et la préparation des décisions.', 'Livrables envisagés : rapports de revue, registre des interfaces et notes de décision.'),
        ('Suivi de projets', 'Planifier les jalons, suivre la qualité, les coûts et les délais, puis préparer la réception et la mise en service avec des partenaires qualifiés.', 'Livrables envisagés : rapports d’avancement, registre des actions et dossiers de réception.'),
    ]
    note = ('EnerTchad is a company in formation. These are planned capabilities, not evidence of current operations or completed assignments. Delivery is subject to studies, approvals, funding and the mobilisation of qualified teams and partners.' if en else
            'EnerTchad est une société en constitution. Ces capacités sont prévues ; elles ne constituent pas des références de missions réalisées ni des activités en cours. Leur mise en œuvre reste soumise aux études, autorisations, financements et à la mobilisation d’équipes et de partenaires qualifiés.')
    contact = '/contact-en#ctForm' if en else '/contact#ctForm'
    cta = 'Discuss an engineering project' if en else 'Échanger sur un projet d’ingénierie'
    items = ''.join(f'<article class="pp-cell"><h3>{escape(t)}</h3><p>{escape(d)}</p><p>{escape(o)}</p></article>' for t, d, o in cards)
    activity_title = 'Engineering across four activities' if en else 'L’ingénierie au service de quatre activités'
    applications = ''.join(f'<li><a href="{a[3] if en else a[2]}">{escape(a[5] if en else a[4])}</a> — {escape(a[7] if en else a[6])}</li>' for a in ACTIVITIES)
    return (f'{START}\n<section id="ingenierie" aria-labelledby="engineering-title"><div class="pp-wrap">'
            f'<div class="pp-head"><p class="pp-k">{escape(label)}</p><h2 id="engineering-title">{escape(title)}</h2>'
            f'<p class="pp-lead">{escape(intro)}</p></div><div class="pp-prose"><div class="pp-grid">{items}</div>'
            f'<h3>{activity_title}</h3><ul>{applications}</ul>'
            f'<p class="pp-note">{escape(note)}</p><div class="pp-actions"><a class="pp-link" href="{contact}">{cta} →</a></div>'
            f'</div></div></section>\n{END}')


def hub(text, en):
    label = 'Engineering &amp; Advisory' if en else 'Ingénierie &amp; Conseil'
    old = 'Advisory' if en else 'Conseil'
    text = text.replace(f'<h1>{old}</h1>', f'<h1>{label}</h1>')
    text = text.replace(f'<span aria-current="page">{old}</span>', f'<span aria-current="page">{label}</span>')
    text = text.replace('Capacité intégrée · Au cœur des trois pôles', 'Capacité intégrée · Au service des quatre segments industriels')
    text = text.replace('Integrated capability · At the heart of the three hubs', 'Integrated capability · Supporting four industrial segments')
    text = text.replace('Built-in capability · Inside the core hubs', 'Integrated capability · Supporting four industrial segments')
    lead = ('Studies, design, technical assistance and project monitoring: a planned capability to prepare robust decisions and projects suited to Chad.' if en else
            'Études, conception, assistance technique et suivi de projets : une capacité prévue pour préparer des décisions solides et des projets adaptés au Tchad.')
    text = re.sub(r'<p class="pp-sublead">.*?</p>', lambda _: f'<p class="pp-sublead">{lead}</p>', text, count=1, flags=re.S)
    if START in text:
        text = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda _: section(en), text, flags=re.S)
    else:
        boundary = '<section id="conviction"'
        if boundary not in text:
            raise ValueError('Engineering hub section boundary changed')
        text = text.replace(boundary, section(en) + '\n' + boundary, 1)
    def subnav(m):
        block = m[0]
        if 'href="#ingenierie"' not in block:
            block = block.replace('<div class="pp-wrap">', '<div class="pp-wrap"><a href="#ingenierie">' + ('Engineering' if en else 'Ingénierie') + '</a>', 1)
        return block
    text = re.sub(r'<nav class="pp-sub".*?</nav>', subnav, text, flags=re.S)
    text = text.replace('href="#conseil">Voir le détail', 'href="#ingenierie">Découvrir l’ingénierie')
    text = text.replace('href="#conseil">See the detail', 'href="#ingenierie">Explore engineering')
    text = text.replace('>Demander un conseil sectoriel</a>', '>Parler de votre projet</a>')
    text = text.replace('>Request sector advice</a>', '>Discuss your project</a>')
    title = ('Engineering &amp; Advisory · EnerConseils | EnerTchad' if en else 'Ingénierie &amp; Conseil · EnerConseils | EnerTchad')
    desc = ('EnerConseils: planned engineering and advisory capabilities for energy projects in Chad. Studies, design, technical assistance and project monitoring.' if en else
            'EnerConseils : capacités prévues d’ingénierie et de conseil pour les projets énergétiques au Tchad. Études, conception, assistance technique et suivi de projets.')
    text = re.sub(r'<title>.*?</title>', lambda _: f'<title>{title}</title>', text, count=1)
    for attr, key, value in [('name', 'description', desc), ('property', 'og:title', title), ('property', 'og:description', desc), ('name', 'twitter:title', title), ('name', 'twitter:description', desc)]:
        pattern = r'(<meta\b[^>]*\b' + attr + '="' + re.escape(key) + r'"[^>]*\bcontent=")[^"]*'
        text = re.sub(pattern, lambda m: m[1] + value, text)
    def metadata(m):
        data = json.loads(m[2])
        records = data if isinstance(data, list) else [data]
        for record in records:
            if record.get('@type') == 'WebPage':
                record['name'] = title.replace('&amp;', '&')
                record['description'] = desc
            if record.get('@type') == 'BreadcrumbList':
                for item in record.get('itemListElement', []):
                    if item.get('name') in ('Conseil', 'Advisory'):
                        item['name'] = label.replace('&amp;', '&')
        return m[1] + json.dumps(data, ensure_ascii=False) + m[3]
    text = re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', metadata, text, flags=re.S)
    return text


def navigation(text):
    def link(m):
        tag = m[0]
        en = 'pole-enerconseils-en' in tag
        label = 'Engineering &amp; Advisory' if en else 'Ingénierie &amp; Conseil'
        # French links occasionally occur in the English source menu. The
        # page language is corrected below; do not infer language from copy.
        if re.search(r'<html\b[^>]*\blang="en(?:-[^"]*)?"', text) and re.search(r'>(Conseil|Advisory|EnerConseils|Conseil &amp; audits indépendants)<', tag):
            en = True
            label = 'Engineering &amp; Advisory'
            tag = tag.replace('href="/enerconseils/"', 'href="/pole-enerconseils-en"')
        if 'Français</a>' in tag:
            return tag.replace('href="/pole-enerconseils-en"', 'href="/enerconseils/"')
        tag = re.sub(r'>(Conseil|Advisory|EnerConseils|Conseil &amp; audits indépendants)<', lambda _: '>' + label + '<', tag)
        tag = re.sub(r'EnerConseils(?:\s|&nbsp;)*:\s*(?:études, audits|studies, audits)', 'EnerConseils: ' + ('studies, design, projects' if en else 'études, conception, projets'), tag)
        tag = tag.replace('Atlas du secteur, conseil, audits.', 'Ingénierie, conseil, atlas du secteur.')
        tag = tag.replace('Sector atlas, advisory, audits.', 'Engineering, advisory, sector atlas.')
        return tag
    return re.sub(r'<a\b[^>]*href="/(?:enerconseils/(?:#[^"]*)?|pole-enerconseils-en(?:#[^"]*)?)"[^>]*>.*?</a>', link, text, flags=re.S)


def homepage_access(text, en):
    """Keep engineering visible beside the programme, outside its four segments."""
    marker = 'id="engineering-home-access"'
    if marker in text:
        return text
    label = 'Engineering &amp; Advisory' if en else 'Ingénierie &amp; Conseil'
    href = '/pole-enerconseils-en#ingenierie' if en else '/enerconseils/#ingenierie'
    note = ('Planned cross-cutting capability: studies, design, technical assistance and project monitoring.' if en else
            'Capacité transversale prévue : études, conception, assistance technique et suivi de projets.')
    block = (f'<div id="engineering-home-access"><p>{note}</p><div class="et-actions">'
             f'<a class="et-secondary" href="{href}">{label} →</a></div></div>')
    def insert(m):
        boundary = '</div></div></section>'
        if not m[0].endswith(boundary):
            raise ValueError('Homepage programme boundary changed')
        return m[0][:-len(boundary)] + '</div>' + block + '</div></section>'
    text, count = re.subn(r'<section\b[^>]*\bid="chaine"[^>]*>.*?</section>', insert, text, count=1, flags=re.S)
    if count != 1:
        raise ValueError('Missing homepage programme section')
    return text


def activity_access(text, page):
    match = next(((a, page == a[1]) for a in ACTIVITIES if page in a[:2]), None)
    if match is None:
        return text
    activity, en = match
    route = '/pole-enerconseils-en' if en else '/enerconseils/'
    description = activity[7] if en else activity[6]
    def body(m):
        def link(anchor):
            tag = anchor[0].replace('href="' + route + '"', 'href="' + route + '#ingenierie"')
            if '<b>' in tag:
                tag = re.sub(r'<span>[^<]*</span>', lambda _: '<span>' + escape(description) + '</span>', tag)
            return tag
        return re.sub(r'<a\b[^>]*href="' + re.escape(route) + r'(?:#ingenierie)?"[^>]*>.*?</a>', link, m[0], flags=re.S)
    return re.sub(r'<main\b[^>]*>.*?</main>', body, text, count=1, flags=re.S)


def main():
    count = 0
    for path in ROOT.rglob('*.html'):
        rel = path.relative_to(ROOT)
        if any(p in SKIP for p in rel.parts):
            continue
        old = path.read_text()
        new = navigation(old)
        if rel.as_posix() in PAGES:
            new = hub(new, PAGES[rel.as_posix()])
        if rel.as_posix() in ('index.html', 'index-en.html'):
            new = homepage_access(new, rel.name == 'index-en.html')
        new = activity_access(new, rel.as_posix())
        # Refresh the existing search assets without introducing requests.
        new = re.sub(r'/assets/chrome/(cmdk_en|cmdk_extra|c_abd9013c3955|c_df4f446df566)\.js(?:\?[^"\'<>\s]+)?', r'/assets/chrome/\1.js?b=2026101603', new)
        if old != new:
            path.write_text(new)
            count += 1
    for name, en in [('cmdk_extra.js', False), ('cmdk_en.js', True)]:
        path = ROOT / 'assets/chrome' / name
        old = path.read_text()
        prefix, raw = old.split('=', 1)
        entries = json.loads(raw.strip().rstrip(';'))
        ident = 'engineering-offer-en' if en else 'engineering-offer-fr'
        entries = [e for e in entries if e.get('id') != ident]
        entries.append({'c': 'Advisory' if en else 'Conseil', 'id': ident,
                        't': 'Engineering & Advisory' if en else 'Ingénierie & Conseil',
                        'k': 'engineering ingénierie ingenierie études conception faisabilité feasibility design technical assistance assistance technique project monitoring suivi projets EnerConseils',
                        'url': '/pole-enerconseils-en#ingenierie' if en else '/enerconseils/#ingenierie'})
        new = prefix + '=' + json.dumps(entries, ensure_ascii=False) + ';\n'
        if old != new:
            path.write_text(new)
    for name in ['c_abd9013c3955.js', 'c_df4f446df566.js']:
        path = ROOT / 'assets/chrome' / name
        old = path.read_text()
        new = old.replace("t:'Conseil (EnerConseils) · données'", "t:'Ingénierie & Conseil (EnerConseils)'")
        new = new.replace("k:'enerconseils conseil conseil données atlas structuration secteur'", "k:'enerconseils ingénierie ingenierie engineering conseil études conception faisabilité assistance technique suivi projets données atlas structuration secteur'")
        if old != new:
            path.write_text(new)
    print(f'Engineering offer aligned: {count} pages, 2 bilingual hubs and search entries')


if __name__ == '__main__':
    main()
