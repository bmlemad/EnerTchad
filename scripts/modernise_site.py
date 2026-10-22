"""Apply the approved industrial-premium refresh without inventing project facts."""
import html
import json
import re
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE = {'.git', '.next', 'out', 'public', 'node_modules', 'reports', 'qa', 'docs', 'docs-sources', 'scripts'}
VERSION = '2026101703'
START, END = '<!-- et-modern:start -->', '<!-- et-modern:end -->'
SERVICES = [
    ('amont/index.html', 'pole-amont-en.html', 'amont', 'Étude de développement amont', 'Upstream development study',
     'Préparer le développement d’un champ ou une intervention sur un actif existant.', 'Prepare field development or an intervention on an existing asset.',
     'Cadrage des données, comparaison des options et coordination des expertises nécessaires.', 'Scope the available data, compare options and coordinate the required expertise.',
     'Note de cadrage, options techniques et liste des études complémentaires.', 'Scoping note, technical options and further-study requirements.'),
    ('intermediaire/index.html', 'pole-intermediaire-en.html', 'depot', 'Étude de dépôt et de logistique', 'Storage and logistics study',
     'Dimensionner une solution de stockage et organiser les flux.', 'Size a storage solution and plan product flows.',
     'Analyse des besoins, scénarios d’implantation et interfaces logistiques.', 'Requirements analysis, siting scenarios and logistics interfaces.',
     'Scénarios de capacité, schéma de flux et points de décision.', 'Capacity scenarios, flow diagram and decision points.'),
    ('aval/index.html', 'pole-aval-en.html', 'raffinage', 'Étude de raffinage et de distribution', 'Refining and distribution study',
     'Évaluer une unité de transformation ou un dispositif de distribution.', 'Assess a processing unit or a distribution solution.',
     'Cadrage des charges et produits, revue des utilités et des interfaces de distribution.', 'Scope feedstock and products, review utilities and distribution interfaces.',
     'Bases de conception, options de procédé et conditions de réalisation.', 'Design basis, process options and implementation conditions.'),
    ('petrochimie/index.html', 'pole-enerchimie-en.html', 'petrochimie', 'Faisabilité pétrochimique', 'Petrochemical feasibility',
     'Étudier la valorisation d’une ressource et ses débouchés industriels.', 'Study resource valorisation and industrial markets.',
     'Revue des intrants, des technologies, des utilités et des débouchés.', 'Review inputs, technologies, utilities and market outlets.',
     'Analyse des options et des prérequis techniques, environnementaux et économiques.', 'Options analysis and technical, environmental and economic prerequisites.'),
]


def lang(text):
    m = re.search(r'<html\b[^>]*\blang=["\']([^"\']+)', text)
    return m[1].split('-')[0] if m else 'fr'


def plain(text):
    return html.unescape(re.sub('<[^>]*>', ' ', text)).strip()


def insert_block(text, block, marker):
    text = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n*', '', text, flags=re.S)
    if marker not in text:
        raise ValueError('Modernisation insertion point missing: ' + marker)
    return text.replace(marker, START + block + END + '\n' + marker, 1)


def navigation(text, en):
    # Keep the existing buttons, aria-controls and drawer behaviour. Consolidate
    # the six editorial groups into four while retaining every original URL.
    nav = re.search(r'<div\b[^>]*\bid="navLinks"[^>]*>.*?(?=<div class="nav-cta"|</nav>)', text, re.S)
    if not nav:
        return text
    original = nav[0]
    item_rx = r'<div class="nav-item pn-item[^\"]*">.*?(?=<div class="nav-item pn-item|<div class="nx-util-m")'
    items = re.findall(item_rx, original, re.S)
    if len(items) not in (4, 6):
        return text
    by_id = {}
    for item in items:
        m = re.search(r'aria-controls="(nxm-[a-f])"', item)
        if m:
            by_id[m[1]] = item
    def links(item):
        m = re.search(r'<div class="nx-col pn-links">(.*?)</div>', item, re.S)
        return re.findall(r'<a\b[^>]*>.*?</a>', m[1], re.S) if m else []
    for target, extra in [('nxm-a', 'nxm-f'), ('nxm-e', 'nxm-c')]:
        if extra not in by_id:
            continue
        existing = set(re.findall(r'href="([^"]+)"', by_id[target]))
        additions = ''.join(a for a in links(by_id[extra]) if re.search(r'href="([^"]+)"', a)[1] not in existing)
        existing.update(re.findall(r'href="([^"]+)"', additions))
        for anchor in re.findall(r'<a\b[^>]*>.*?</a>', by_id[extra], re.S):
            href = re.search(r'href="([^"]+)"', anchor)[1]
            if href in existing:
                continue
            label = ('Energy transition' if en else 'Transition énergétique') if '#transition' in href else ('Sustainability' if en else 'Durabilité')
            additions += f'<a href="{href}"><strong>{label}</strong></a>'
            existing.add(href)
        by_id[target] = re.sub(r'(<div class="nx-col pn-links">)(.*?)(</div>)', lambda m: m[1] + m[2] + additions + m[3], by_id[target], count=1, flags=re.S)
    # lot13 : la rubrique courante d'un groupe fusionné reste signalée sur son groupe d'accueil
    # (Durabilité -> Ressources, Carrières -> Entreprise).
    def activate(m):
        tag = m[0]
        if 'is-active' not in tag:
            tag = re.sub(r'class="nav-trigger', 'class="nav-trigger is-active', tag, count=1)
        if 'aria-current=' not in tag:
            tag = tag.replace('<button', '<button aria-current="true"', 1)
        return tag
    for merged, host in (('nxm-c', 'nxm-e'), ('nxm-f', 'nxm-a')):
        if merged in by_id and host in by_id and re.search(r'class="nav-trigger is-active"', by_id[merged]):
            by_id[host] = re.sub(r'<button\b[^>]*class="nav-trigger(?: [^"]*)?"[^>]*>', activate, by_id[host], count=1)
    labels = ['Company', 'Activities & Engineering', 'Projects & Investors', 'Resources'] if en else ['Entreprise', 'Activités & Ingénierie', 'Projets & Investisseurs', 'Ressources']
    ordered = []
    for ident, label in zip(['nxm-a', 'nxm-b', 'nxm-d', 'nxm-e'], labels):
        item = by_id[ident]
        item = re.sub(r'(<button\b[^>]*class="nav-trigger(?: [^"]*)?"[^>]*>)[^<]+', lambda m: m[1] + html.escape(label) + ' ', item, count=1)
        item = re.sub(r'(id="' + ident + r'"[^>]*aria-label=")[^"]*', lambda m: m[1] + html.escape(label), item, count=1)
        item = re.sub(r'(<p class="nxh">).*?(</p>)', lambda m: m[1] + html.escape(label) + m[2], item, count=1, flags=re.S)
        if ident == 'nxm-d':
            href = '/projets-en' if en else '/projets'
            if 'href="' + href + '"' not in item:
                project = f'<a href="{href}"><strong>{"Projects and status" if en else "Projets et avancement"}</strong><em>{"Published stages and prerequisites" if en else "Étapes publiées et prérequis"}</em></a>'
                item = item.replace('<div class="nx-col pn-links">', '<div class="nx-col pn-links">' + project, 1)
        ordered.append(item)
    new = original
    for item in items:
        new = new.replace(item, '', 1)
    # The first removed group starts directly after the navLinks opening tag.
    opening = new.index('>') + 1
    new = new[:opening] + ''.join(ordered) + new[opening:]
    return text[:nav.start()] + new + text[nav.end():]


def footer_sections(text, en):
    """lot13 : la colonne « Rubriques »/« Sections » du pied reprend les 4 rubriques de l'en-tête."""
    col = re.compile(r'<div class="foot-col"><h3>(Rubriques|Sections)</h3>.*?</div>', re.S)
    if not col.search(text):
        return text
    nav = re.search(r'<div\b[^>]*\bid="navLinks"[^>]*>.*?(?=<div class="nav-cta"|</nav>)', text, re.S)
    if not nav:
        return text
    groups = []
    for button in re.finditer(r'<button\b([^>]*)class="nav-trigger(?: [^"]*)?"([^>]*)>([^<]+)', nav[0]):
        ident = re.search(r'aria-controls="(nxm-[a-f])"', button[1] + button[2])
        if not ident:
            continue
        region = re.search(r'id="' + ident[1] + r'".*?class="pn-all" href="([^"]+)"', nav[0][button.end():], re.S)
        if not region:
            raise ValueError('Footer sections: overview link missing for ' + ident[1])
        groups.append((region[1], button[3].strip()))
    if len(groups) != 4:
        return text
    body = ''.join(f'<a href="{href}">{label}</a>' for href, label in groups)
    return col.sub(lambda m: f'<div class="foot-col"><h3>{m[1]}</h3>' + body + '</div>', text, count=1)


def mobile(text, en):
    def bar(m):
        old = m[0]
        anchors = re.findall(r'<a\b[^>]*>.*?</a>', old, re.S)
        if not anchors:
            return old
        home, contact = anchors[0], anchors[-1]
        def target(anchor, href, label):
            icon = ''.join(re.findall(r'<svg\b.*?</svg>', anchor, re.S))
            return f'<a href="{href}" aria-label="{label}">{icon}<span class="et-mobile-label-long" aria-hidden="true">{label}</span></a>'
        content = target(home, '/index-en' if en else '/', 'Home' if en else 'Accueil')
        content += target(anchors[1], '/nos-activites-en' if en else '/nos-activites', 'Activities' if en else 'Activités')
        content += target(contact, '/contact-en#ctForm' if en else '/contact#ctForm', 'Contact')
        return re.sub(r'>.*</nav>', '>' + content + '</nav>', old, count=1, flags=re.S)
    return re.sub(r'<nav\b[^>]*\bid="nezBar"[^>]*>.*?</nav>', bar, text, flags=re.S)


def home(text, en):
    title = 'Developing an integrated energy value chain in Chad.' if en else 'Développer au Tchad une chaîne énergétique intégrée.'
    signature = 'From source rock to the pump.' if en else 'De la roche-mère à la pompe.'
    text = re.sub(r'(<header class="et-hero".*?<h1\b[^>]*>).*?(</h1>)', lambda m: m[1] + title + m[2], text, count=1, flags=re.S)
    if 'class="mod-signature"' not in text:
        text = re.sub(r'(<header class="et-hero".*?</h1>)', lambda m: m[1] + f'<p class="mod-signature">{signature}</p>', text, count=1, flags=re.S)
    def hero(m):
        block = m[0]
        primary = 'Present a project' if en else 'Présenter un projet'
        secondary = 'Explore projects and status' if en else 'Consulter les projets'
        block = re.sub(r'<div class="et-actions">.*?</div>', f'<div class="et-actions"><a class="et-primary" href="/contact{"-en" if en else ""}?profil=partenariat#ctForm">{primary}</a><a class="et-secondary" href="/projets{"-en" if en else ""}#avancement">{secondary} →</a></div>', block, count=1, flags=re.S)
        return block
    text = re.sub(r'<header class="et-hero".*?</header>', hero, text, count=1, flags=re.S)
    # Show the actual programme before numeric targets. Keep target disclosures.
    metrics = re.search(r'<section id="programme-cible".*?</section>', text, re.S)
    chain = re.search(r'<section id="chaine".*?</section>', text, re.S)
    if metrics and chain and metrics.start() < chain.start():
        text = text[:metrics.start()] + text[metrics.end():]
        chain = re.search(r'<section id="chaine".*?</section>', text, re.S)
        text = text[:chain.end()] + metrics[0] + text[chain.end():]
    suffix = '-en' if en else ''
    people = ('A published governance, identifiable responsibilities' if en else 'Une gouvernance publiée, des responsabilités identifiées')
    context = ('The Chair and CEO below are designated by the founders, to be confirmed by the constitutive general meeting. Biographies and original portraits will be added when authorised and documented.' if en else 'Le PCA et le DG ci-dessous sont désignés par les fondateurs, à confirmer par l’assemblée constitutive. Les parcours et portraits originaux seront ajoutés lorsqu’ils seront autorisés et documentés.')
    source = (ROOT / 'gouvernance.html').read_text()
    published = []
    for role in ['Président du Conseil (PCA)', 'Directeur général (DG)']:
        match = re.search(re.escape(role) + r'.*?</[^>]+>\s*<[^>]+>([^<]+)', source, re.S)
        if not match:
            raise ValueError('Published leadership entry missing: ' + role)
        published.append(plain(match[1]).split('·')[0].strip())
    cards = [(published[0], 'Chair of the Board' if en else 'Président du Conseil d’administration', '/gouvernance' + suffix + '#organes'),
             (published[1], 'Chief Executive Officer' if en else 'Directeur général', '/gouvernance' + suffix + '#organes')]
    cells = ''.join(f'<article class="mod-card"><p class="mod-eyebrow">{role}</p><h3>{name}</h3><a href="{href}">{"View published governance" if en else "Voir la gouvernance publiée"} →</a></article>' for name, role, href in cards)
    block = f'<section id="mod-equipe"><div class="et-inner"><h2>{people}</h2><p>{context}</p><div class="mod-grid">{cells}</div><div class="et-actions"><a href="/atlas/">{"Explore the sector atlas" if en else "Explorer l’Atlas du secteur"} →</a><a href="/publications{suffix}">{"Read the public documents" if en else "Consulter les documents publics"} →</a></div></div></section>'
    return insert_block(text, block, '</main>')


def service_offer(text, page, en):
    service = next((s for s in SERVICES if page in s[:2]), None)
    if service is None:
        return text
    _, _, key, fr, english, need_fr, need_en, work_fr, work_en, output_fr, output_en = service
    title, need, work, output = (english, need_en, work_en, output_en) if en else (fr, need_fr, work_fr, output_fr)
    fields = [('Your need' if en else 'Votre besoin', need), ('Planned intervention' if en else 'Intervention envisagée', work), ('Expected outputs' if en else 'Livrables envisagés', output)]
    details = ''.join(f'<div><dt>{label}</dt><dd>{html.escape(value)}</dd></div>' for label, value in fields)
    condition = ('Company in formation. Scope and delivery depend on data, studies, approvals, funding and qualified teams and partners.' if en else 'Société en constitution. Le périmètre et la réalisation dépendent des données, études, autorisations, financements et équipes et partenaires qualifiés.')
    href = '/contact' + ('-en' if en else '') + '?' + urlencode({'profil': 'partenariat', 'service': key}) + '#ctForm'
    block = f'<section id="offre-services" aria-labelledby="mod-service-title"><div class="pp-wrap"><p class="pp-k">{"Project services · planned capability" if en else "Services projet · capacité prévue"}</p><h2 id="mod-service-title">{title}</h2><div class="mod-card"><dl class="mod-service-fields">{details}</dl><p>{condition}</p><a class="mod-button" href="{html.escape(href)}">{"Discuss this study" if en else "Discuter de cette étude"} →</a></div></div></section>'
    marker = '<section id="conviction"'
    if marker not in text:
        match = re.search(r'<section\b', text[text.index('<main'):])
        marker = text[text.index('<main') + match.start():].split('>', 1)[0] + '>'
    return insert_block(text, block, marker)


def engineering(text, en):
    def module(m):
        block = m[0]
        articles = list(re.finditer(r'<article class="pp-cell">.*?</article>', block, re.S))
        keys = ['faisabilite', 'conception', 'assistance', 'suivi']
        for article, key in reversed(list(zip(articles, keys))):
            content = article[0]
            content = re.sub(r'<a class="mod-button".*?</a>', '', content, flags=re.S)
            href = '/contact' + ('-en' if en else '') + '?profil=partenariat&amp;service=' + key + '#ctForm'
            content = content.replace('</article>', f'<a class="mod-button" href="{href}">{"Discuss this service" if en else "Discuter de ce service"} →</a></article>')
            block = block[:article.start()] + content + block[article.end():]
        return block
    return re.sub(r'<section id="ingenierie".*?</section>', module, text, count=1, flags=re.S)


def projects(text, en):
    def progress(m):
        block = re.sub(r'<!-- modern-projects:start -->.*?<!-- modern-projects:end -->', '', m[0], flags=re.S)
        block = re.sub(r'<details class="mod-project-table"><summary\b[^>]*>.*?</summary>(.*?)</details>', lambda m: m[1], block, flags=re.S)
        table = re.search(r'<table class="et-project-table">.*?</table>', block, re.S)
        if not table:
            raise ValueError('Published project table missing')
        rows = re.findall(r'<tr>(.*?)</tr>', table[0], re.S)[1:]
        cards = []
        for row in rows:
            cells = re.findall(r'<(?:td|th)\b[^>]*>(.*?)</(?:td|th)>', row, re.S)
            if len(cells) != 4:
                raise ValueError('Project row structure changed')
            title, status, condition, sources = cells
            cards.append(f'<article class="mod-card"><p class="mod-status">{status}</p><h3>{title}</h3><p><strong>{"Next prerequisite" if en else "Prochain prérequis"}</strong><br>{condition}</p><details><summary>{"Published evidence" if en else "Supports publics"}</summary><p>{sources}</p></details></article>')
        cards = '<!-- modern-projects:start --><div class="mod-grid">' + ''.join(cards) + '</div><p><a href="/atlas/">' + ('Sector atlas' if en else 'Atlas du secteur') + ' →</a></p><!-- modern-projects:end -->'
        block = block.replace('<div class="et-project-scroll"', cards + '<div class="et-project-scroll"', 1)
        if 'class="mod-project-table"' not in block:
            block = re.sub(r'<div class="et-project-scroll".*?</div>', lambda m: '<details class="mod-project-table"><summary class="mod-button">' + ('Table view' if en else 'Vue tableau') + '</summary>' + m[0] + '</details>', block, count=1, flags=re.S)
        block = re.sub(r'(<details class="mod-project-table"><summary class="mod-button">).*?(</summary>)', lambda m: m[1] + ('Table view' if en else 'Vue tableau') + m[2], block, count=1, flags=re.S)
        return block
    return re.sub(r'<section id="avancement".*?</section>', progress, text, count=1, flags=re.S)


def publications(text, en, registry):
    text = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n*', '', text, flags=re.S)
    documents = {d['path']: d for d in registry['documents']}
    text = re.sub(r'<div class="et-dr-explorer">.*?<div data-et-docroom(?:="[^"]*")?></div></div>', '', text, flags=re.S)
    def card(m):
        opening, body, closing = m.groups()
        href = re.search(r'href="([^"]+)"', opening)
        if not href or html.unescape(href[1]) not in documents:
            return m[0]
        doc = documents[html.unescape(href[1])]
        if not re.search(r'class="[^\"]*(?:pp-card|pp-cell|sp-doc|et-dr-card)', opening):
            return m[0]
        return ''
    text = re.sub(r'(<a\b[^>]*>)(.*?)(</a>)', card, text, flags=re.S)
    text = re.sub(r'<li>\s*</li>', '', text)
    labels = ['Search documents', 'All categories', 'All languages', 'All formats', 'Reset filters'] if en else ['Rechercher un document', 'Toutes les catégories', 'Toutes les langues', 'Tous les formats', 'Réinitialiser']
    categories = sorted({d['category'] for d in documents.values()})
    category_labels = {'investors': ('Investisseurs', 'Investors'), 'operations': ('Activités', 'Activities'), 'corporate': ('Société', 'Company'), 'esg': ('Durabilité', 'Sustainability'), 'media': ('Presse', 'Media')}
    opts = ''.join(f'<option value="{html.escape(c)}">{html.escape(category_labels.get(c, (c, c))[int(en)])}</option>' for c in categories)
    languages = ''.join(f'<option value="{v}">{label}</option>' for v, label in [('fr', 'Français' if not en else 'French'), ('en', 'English' if en else 'Anglais'), ('ar', 'العربية' if not en else 'Arabic'), ('multi', 'Multilingue' if not en else 'Multilingual')])
    formats = ''.join(f'<option value="{v}">{v}</option>' for v in sorted({d['format'] for d in documents.values()}))
    cards = []
    languages_by_code = {'fr': 'French' if en else 'Français', 'en': 'English' if en else 'Anglais', 'ar': 'Arabic' if en else 'Arabe', 'multi': 'Multilingual' if en else 'Multilingue'}
    status_labels = {'published': 'Published' if en else 'Publié', 'progress-update': 'Progress update' if en else 'Point d’étape', 'target-data': 'Target data' if en else 'Données cibles'}
    for doc in documents.values():
        attrs = ' '.join(f'data-document-{key}="{html.escape(str(doc[key]))}"' for key in ['format', 'language', 'category'])
        role = doc['role_en' if en else 'role_fr']
        version = doc.get('version') or ('Version not specified' if en else 'Version non précisée')
        date = (' · Document dated ' if en else ' · Document daté ') + doc['document_date'] if doc.get('document_date') else ''
        if doc.get('document_updated'):
            date += (' · Updated ' if en else ' · Mis à jour ') + doc['document_updated']
        cards.append(f'<a class="mod-card" href="{html.escape(doc["path"])}" {attrs}><p class="mod-status">{html.escape(status_labels.get(doc["status"], doc["status"]))}</p><h3>{html.escape(role)}</h3><p>{html.escape(doc["format"])} · {languages_by_code[doc["language"]]} · {round(doc["bytes"]/1024)} {"KB" if en else "Ko"}</p><p>{html.escape(version + date)}</p><span>{"Open file" if en else "Ouvrir le fichier"} →</span></a>')
    block = (f'<section id="mod-library" class="mod-library" aria-labelledby="mod-library-title"><div class="pp-wrap"><h2 id="mod-library-title">{"Find a document" if en else "Trouver un document"}</h2><p>{"Filter the published files. Dates refer to the documents; register verification is separate." if en else "Filtrez les fichiers publiés. Les dates concernent les documents ; la vérification du registre est distincte."}</p><form class="mod-filters" role="search" data-document-filter hidden>'
             f'<label>{labels[0]}<input type="search" name="query" placeholder="PDF, EOR, brochure…"></label>'
             f'<label>{"Category" if en else "Catégorie"}<select name="category"><option value="">{labels[1]}</option>{opts}</select></label>'
             f'<label>{"Language" if en else "Langue"}<select name="language"><option value="">{labels[2]}</option>{languages}</select></label>'
             f'<label>Format<select name="format"><option value="">{labels[3]}</option>{formats}</select></label><button type="reset">{labels[4]}</button></form><p role="status" data-document-count></p><div class="mod-grid" data-document-grid>{"".join(cards)}</div></div></section>')
    marker = re.search(r'<section\b', text[text.index('<main'):])
    marker = text[text.index('<main') + marker.start():].split('>', 1)[0] + '>'
    return insert_block(text, block, marker)


def append_asset(path, start, end, content):
    old = path.read_text()
    block = start + '\n' + content + '\n' + end
    new = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block, old, flags=re.S) if start in old else old + '\n' + block + '\n'
    if new != old:
        path.write_text(new)


def main():
    registry = json.loads((ROOT / 'assets/data/document-registry.json').read_text())
    for path in ROOT.rglob('*.html'):
        relative = path.relative_to(ROOT)
        if EXCLUDE.intersection(relative.parts):
            continue
        old = path.read_text()
        language = lang(old)
        if language not in ('fr', 'en'):
            continue
        en, name = language == 'en', relative.as_posix()
        new = navigation(old, en)
        new = mobile(new, en)
        new = footer_sections(new, en)  # lot13
        new = re.sub(r'<html\b([^>]*)>', lambda m: '<html' + re.sub(r' data-et-modern="[^"]*"', '', m[1]) + ' data-et-modern="industrial">', new, count=1)
        if name in ('index.html', 'index-en.html'):
            new = home(new, en)
        new = service_offer(new, name, en)
        if name in ('enerconseils/index.html', 'pole-enerconseils-en.html'):
            new = engineering(new, en)
        if name in ('projets.html', 'projets-en.html'):
            new = projects(new, en)
        if name in ('publications.html', 'publications-en.html'):
            new = publications(new, en, registry)
        new = re.sub(r'/assets/chrome/(premium-chrome\.css|contact_profiles\.js|document-room\.js)(?:\?[^"\'<>\s]+)?', lambda m: '/assets/chrome/' + m[1] + '?b=' + VERSION, new)
        if new != old:
            path.write_text(new)
    append_asset(ROOT / 'assets/chrome/premium-chrome.css', '/* et-modern:start */', '/* et-modern:end */', Path(__file__).with_name('modernisation.css').read_text())
    core = ROOT / 'assets/chrome/c_ac04328f0f47.js'
    content = core.read_text()
    clean = re.sub(r'/\* et-modern:start \*/.*?/\* et-modern:end \*/\n?', '', content, flags=re.S)
    if clean != content:
        core.write_text(clean)
    append_asset(ROOT / 'assets/chrome/contact_profiles.js', '/* et-modern:start */', '/* et-modern:end */', Path(__file__).with_name('modernisation-contact.min.js').read_text())
    library = ROOT / 'assets/chrome/document-room.js'
    code = Path(__file__).with_name('modernisation-ui.min.js').read_text()
    if library.read_text() != code:
        library.write_text(code)
    print('Industrial modernisation aligned: navigation, home, services, projects, documents and enquiry context')


if __name__ == '__main__':
    main()
