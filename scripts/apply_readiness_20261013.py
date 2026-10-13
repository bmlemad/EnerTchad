"""Maintain the first corporate-readiness improvements after page regeneration.

Run from the repository root. Does not invent project facts, approvals, biographies,
funding commitments or English translations of French documents.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SHEET = '<style id="et-readiness-style">' + (ROOT / 'assets/chrome/readiness-20261013.css').read_text() + '</style>'


def section(text, identity, transform):
    return re.sub(r'<section\b[^>]*\bid="' + identity + r'"[^>]*>.*?</section>',
                  lambda m: transform(m[0]), text, flags=re.S)


def insert_before(text, marker, block, identity):
    if f'id="{identity}"' in text:
        return text
    if marker not in text:
        raise ValueError('Missing insertion point: ' + marker)
    return text.replace(marker, block + '\n' + marker, 1)


def vocabulary(en):
    rows = ([('Implemented', 'A specific item exists, supported by a dated record.'),
             ('In progress', 'Work has started; identify the owner and next deliverable.'),
             ('Planned', 'An intended action, with prerequisites still to meet.'),
             ('Conditional', 'Depends on a stated approval, agreement, financing or validation.'),
             ('Not currently available', 'A service or resource cannot currently be accessed.')]
            if en else
            [('En place', 'Un élément précis existe, avec un justificatif daté.'),
             ('En cours', 'Le travail a commencé ; préciser le responsable et le prochain livrable.'),
             ('Prévu', 'Une action envisagée, avec des prérequis à satisfaire.'),
             ('Conditionnel', 'Dépend d’une autorisation, d’un accord, d’un financement ou d’une validation précisés.'),
             ('Non disponible à ce jour', 'Un service ou une ressource ne peut pas être utilisé actuellement.')])
    title = 'How to read a status' if en else 'Comment lire un statut'
    note = ('These definitions describe individual items. Company formation, study completion and asset operation are separate milestones. They do not assign a new status to any project.' if en else
            'Ces définitions portent sur un élément précis. Constitution de la société, étude achevée et mise en exploitation sont des jalons distincts. Elles n’attribuent pas un nouveau statut aux projets.')
    terms = ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in rows)
    return f'<aside class="et-readiness" id="lecture-statuts" aria-labelledby="lecture-statuts-title"><h2 id="lecture-statuts-title">{title}</h2><p>{note}</p><dl class="et-readiness-terms">{terms}</dl></aside>'


def home(text, en):
    changes = ({
        'EnerTchad is preparing an integrated oil value chain in Chad: production, transport, processing and distribution.':
        'EnerTchad is developing a proposed integrated oil programme in Chad, from production to distribution.',
        'Company in formation. Projects, capacities and funding described are targets subject to studies, approvals and partnerships.':
        'Company in formation. The projects and capacities presented are targets, subject to the necessary studies, approvals, financing and partnerships.',
        'Explore projects and their status': 'View projects and their status',
        'Contact EnerTchad</a>': 'Contact the team</a>',
        '<b>Investors</b>': '<b>Investors and partners</b>',
        'Project status, assumptions, risks and public documents.': 'Status, assumptions, risks and public documents.',
        'Supply needs, planned services and contact options.': 'Discuss your requirements and explore proposed offers.',
        'Present your expertise, capabilities and references.': 'Introduce your company and request supplier registration.',
    } if en else {
        'EnerTchad prépare une chaîne pétrolière intégrée au Tchad : production, transport, transformation et distribution.':
        'EnerTchad prépare un programme pétrolier intégré au Tchad, de la production à la distribution.',
        'Société en constitution. Les projets, capacités et financements décrits sont des objectifs soumis aux études, autorisations et partenariats.':
        'Société en constitution. Les projets et capacités présentés sont des objectifs, soumis aux études, autorisations, financements et partenariats nécessaires.',
        'Voir les projets et leur statut': 'Consulter les projets et leur statut',
        'Contacter EnerTchad</a>': 'Contacter l’équipe</a>',
        '<b>Investisseurs</b>': '<b>Investisseurs et partenaires</b>',
        'Statut du projet, hypothèses, risques et documents publics.': 'Statut, hypothèses, risques et documents publics.',
        'Besoins d’approvisionnement, services envisagés et prise de contact.': 'Présenter votre besoin et consulter les offres envisagées.',
        'Présenter vos compétences, vos capacités et vos références.': 'Présenter votre entreprise et demander un référencement.',
    })
    for a, b in changes.items():
        text = text.replace(a, b)
    if 'id="programme-cible"' not in text:
        metrics = re.search(r'<div class="et-metrics">.*?</div></div>(?=</div></header>)', text, re.S)
        if not metrics:
            raise ValueError('Homepage metrics not found')
        block = metrics[0].replace('class="et-metrics"', 'class="et-programme-metrics"', 1)
        text = text[:metrics.start()] + text[metrics.end():]
        title = 'Target programme' if en else 'Programme cible'
        note = ('Programme structure and future targets; these figures are not operating results or secured funding.' if en else
                'Structure du programme et objectifs futurs ; ces chiffres ne sont ni des résultats d’exploitation ni des financements acquis.')
        new = f'<section id="programme-cible" aria-labelledby="programme-cible-title"><div class="et-inner"><h2 id="programme-cible-title">{title}</h2><p>{note}</p>{block}</div></section>'
        text = text.replace('<section id="chaine"', new + '\n<section id="chaine"', 1)
    return text


def governance(text, en):
    paragraph = ('EnerTchad aims to establish IFRS financial reporting and external audit arrangements. Implementation status, appointed responsible parties and the first available documents will be published here as they are formalised.' if en else
                 'EnerTchad vise un reporting financier selon les normes IFRS et un audit externe. Le statut de mise en place, les responsables désignés et les premiers documents disponibles seront précisés ici à mesure de leur formalisation.')
    def accounts(s):
        s = re.sub(r'<p class="pp-lead">.*?</p>', '<p class="pp-lead">' + paragraph + '</p>', s, count=1, flags=re.S)
        pairs = ([('IFRS accounts', 'IFRS reporting targeted'),
                  ('Accounting to international standards, comparable from one market to another.', 'Target framework; the reporting scope and available statements will be identified when formalised.'),
                  ('Independent certification of the accounts, inherent to the OHADA SA form.', 'External audit targeted; appointment and completed audit reports must be identified separately.'),
                  ('Every target is dated; every franc raised is earmarked and verifiable.', 'Target process: document the date, use of funds and supporting records for each funding stage.')]
                 if en else
                 [('Comptes IFRS', 'Reporting IFRS visé'),
                  ('Une comptabilité aux standards internationaux, comparable d’un marché à l’autre.', 'Cadre visé ; le périmètre du reporting et les états disponibles seront précisés à leur formalisation.'),
                  ('Certification indépendante des comptes, inhérente à la forme SA OHADA.', 'Audit externe visé ; la nomination et les rapports d’audit achevés doivent être identifiés séparément.'),
                  ('Chaque cible est datée\u00a0; chaque franc levé est fléché et vérifiable.', 'Processus visé : documenter la date, l’emploi des fonds et les justificatifs de chaque étape de financement.')])
        for a, b in pairs:
            s = s.replace(a, b)
        return s
    text = section(text, 'comptes', accounts)
    return insert_before(text, '<section id="comptes"', vocabulary(en), 'lecture-statuts')


PROJECTS = {
    'ch-ep': ('Périmètre des services, compétences mobilisables, accords de consortium et plan HSE.', 'Service scope, available expertise, consortium agreements and HSE plan.'),
    'ch-eor': ('Protocole d’essai, accès aux champs, compatibilité réservoir, résultats de laboratoire et revue indépendante du gain de récupération.', 'Test protocol, field access, reservoir compatibility, laboratory results and independent review of the recovery gain.'),
    'ch-corridor': ('Accords d’accès au corridor, volumes additionnels, hypothèses tarifaires et étude logistique.', 'Corridor access agreements, additional volumes, tariff assumptions and logistics study.'),
    'ch-relais': ('Sites envisagés, homologations, sécurité, logistique et base du délai de déploiement visé.', 'Proposed sites, approvals, safety, logistics and the basis of the target deployment time.'),
    'ch-raffinerie': ('Approvisionnement en brut, spécifications produits, utilités, maturité de l’ingénierie, coût estimatif et financement.', 'Crude supply, product specifications, utilities, engineering maturity, cost estimate and financing.'),
    'ch-eau': ('Composition de l’eau, essais de traitement, bilan matière, destination des flux et autorisations environnementales.', 'Water composition, treatment tests, mass balance, destination of output streams and environmental approvals.'),
    'ch-engrais': ('Accès au gaz, base de ressources, technologie, débouchés, utilités et étude de faisabilité.', 'Gas access, resource basis, technology, market outlets, utilities and feasibility study.'),
    'ch-hybride': ('Demande locale, sites, dimensionnement, modèle tarifaire, financement et conditions de raccordement.', 'Local demand, sites, system sizing, tariff model, financing and connection requirements.'),
}


def projects(text, en):
    for identity, pair in PROJECTS.items():
        pattern = r'(<div class="pp-cell" id="' + identity + r'">)(.*?)(?=<div class="pp-cell" id="ch-|</div></div></div></section>)'
        def card(m):
            content = m[0]
            content = re.sub(r'(<dt>(?:Conditions de réalisation|Implementation conditions)</dt><dd>).*?(</dd>)',
                             lambda x: x[1] + pair[1 if en else 0] + x[2], content, count=1, flags=re.S)
            if 'class="et-project-evidence"' not in content:
                title = 'Evidence to document before the next decision' if en else 'Pièces à documenter avant la prochaine décision'
                note = ('For this project: identify the accountable lead, current stage and evidence date, rights and partner status, cost-estimate basis, funding status and next decision. This checklist is not a statement that these items are completed.' if en else
                        'Pour ce projet : préciser le responsable, le stade et la date des justificatifs, les droits et partenariats, la base du coût estimatif, le statut du financement et la prochaine décision. Cette liste ne signifie pas que ces éléments sont réalisés.')
                content = content.replace('</dl>', f'</dl><details class="et-project-evidence"><summary>{title}</summary><p>{note}</p></details>', 1)
            return content
        text, count = re.subn(pattern, card, text, count=1, flags=re.S)
        if count != 1:
            raise ValueError('Project not found: ' + identity)
    return insert_before(text, '<section id="avancement"', vocabulary(en), 'lecture-statuts')


def financing(en):
    title = 'Capital targets and project funding' if en else 'Capital visé et financement des projets'
    lead = ('Corporate equity targets do not represent the total funding requirement of the industrial programme. Each project needs its own budget, assumptions and funding plan.' if en else
            'Les objectifs de capital de la société ne représentent pas le besoin total de financement du programme industriel. Chaque projet nécessite son budget, ses hypothèses et son plan de financement.')
    rows = ([('Corporate equity', 'Published capital trajectory: targets, not a statement of secured funds.', 'For each stage: amount, intended use, conditions and milestone financed.'),
             ('Studies and project development', 'Budget and funding status to document for each project.', 'Study scope, cost basis, deliverables and decision conditions.'),
             ('Industrial investment and working capital', 'Separate from the corporate equity trajectory.', 'Project cost, contingency, working capital, proposed funding sources and commitments actually secured.')]
            if en else
            [('Capital de la société', 'Trajectoire publiée : des cibles, pas une déclaration de fonds acquis.', 'Pour chaque palier : montant, emploi prévu, conditions et jalon financé.'),
             ('Études et développement des projets', 'Budget et statut du financement à documenter par projet.', 'Périmètre des études, base de coût, livrables et conditions de décision.'),
             ('Investissement industriel et trésorerie', 'À distinguer de la trajectoire de capital de la société.', 'Coût du projet, provisions, fonds de roulement, sources envisagées et engagements effectivement acquis.')])
    headings = ('Funding category', 'How to read it', 'Evidence required') if en else ('Catégorie', 'Clé de lecture', 'Justificatifs attendus')
    head = ''.join(f'<th scope="col">{x}</th>' for x in headings)
    body = ''.join('<tr><th scope="row">' + row[0] + '</th>' + ''.join(f'<td>{x}</td>' for x in row[1:]) + '</tr>' for row in rows)
    href = '/contact-en?profil=invest' if en else '/contact?profil=invest'
    label = 'Contact investor relations' if en else 'Contacter l’équipe investisseurs'
    return f'<section class="et-readiness" id="financement-projets" aria-labelledby="financement-projets-title"><h2 id="financement-projets-title">{title}</h2><p>{lead}</p><div class="et-readiness-scroll" role="region" aria-label="{title}" tabindex="0"><table><caption>{title}</caption><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div><p><a href="{href}">{label}</a></p></section>'


def investor(text, en):
    marker = re.search(r'<section\b[^>]*\bid="documents"[^>]*>', text)[0]
    return insert_before(text, marker, financing(en), 'financement-projets')


def purchasing(text, en):
    pairs = ([('what our central purchasing body pools, stocks and moves all the way to site.', 'the proposed scope of central purchasing, with availability to confirm for your needs.'),
              ('Buffer stock of critical references in Chad', 'Buffer stock of critical references in Chad: capacity to confirm'),
              ('Membership open to third-party operators', 'Proposed membership for third-party operators; conditions to confirm')]
             if en else
             [('ce que notre centrale d’achat mutualise, stocke et achemine jusqu’au site.', 'le périmètre envisagé de la centrale d’achat, avec une disponibilité à confirmer selon votre besoin.'),
              ('<li>Stock tampon de références critiques au Tchad</li>', '<li>Stock tampon de références critiques au Tchad : capacité à confirmer</li>'),
              ('Adhésion possible pour les opérateurs tiers', 'Adhésion envisagée pour les opérateurs tiers ; conditions à confirmer')])
    for a, b in pairs:
        text = text.replace(a, b)
    title = 'Purchasing: current contact, target operating model' if en else 'Achats : prise de contact actuelle, modèle de fonctionnement cible'
    note = ('Supplier introductions can be sent through the contact page. The central purchasing capabilities and procedures below describe a target model; stock availability, contracts, logistics and service coverage must be confirmed with the team. A registration request is not a contract award.' if en else
            'Les entreprises peuvent présenter leur activité via la page contact. Les capacités et procédures de la centrale d’achat ci-dessous décrivent un modèle cible ; stocks, contrats, logistique et couverture doivent être confirmés avec l’équipe. Une demande de référencement ne vaut pas attribution de marché.')
    block = f'<aside class="et-readiness" id="disponibilite-achats"><h2>{title}</h2><p>{note}</p></aside>'
    return insert_before(text, '<section id="orientation"', block, 'disponibilite-achats')


def customers(text, en):
    suffix = '-en' if en else ''
    title = 'Start with your requirements' if en else 'Commencez par votre besoin'
    note = ('Offers are in preparation. Availability, scope, geography and terms must be confirmed with the team before any commitment.' if en else
            'Offres en préparation. Disponibilité, périmètre, zone desservie et conditions doivent être confirmés avec l’équipe avant tout engagement.')
    routes = ([('Industrial and fleet requirements', 'Discuss your volumes, location and proposed supply needs.', '/contact-en'),
               ('Oilfield and technical services', 'Describe the field, scope and technical support required.', '/contact-en'),
               ('Suppliers and partners', 'Introduce your company and request registration.', '/achats-en')]
              if en else
              [('Industriels et flottes', 'Présenter vos volumes, votre localisation et votre besoin d’approvisionnement.', '/contact'),
               ('Services pétroliers et techniques', 'Préciser le champ, le périmètre et l’appui technique recherché.', '/contact'),
               ('Fournisseurs et partenaires', 'Présenter votre entreprise et demander un référencement.', '/achats')])
    cards = ''.join(f'<a href="{url}"><b>{label}</b><span>{detail}</span></a>' for label, detail, url in routes)
    block = f'<section class="et-readiness" id="besoin-client" aria-labelledby="besoin-client-title"><h2 id="besoin-client-title">{title}</h2><p>{note}</p><div class="et-readiness-routes">{cards}</div></section>'
    if 'id="besoin-client"' not in text:
        text = re.sub(r'(<main\b[^>]*>.*?</header>)', lambda m: m[0] + block, text, count=1, flags=re.S)
    text = text.replace('>Demander un devis</a>', '>Présenter votre besoin</a>').replace('>Request a quote</a>', '>Discuss your requirements</a>')
    # Keep all existing topics accessible, with an optional directory after the short path.
    if 'id="programme-clients-details"' not in text:
        label = 'Explore the full proposed customer programme' if en else 'Explorer le programme clients envisagé'
        text = re.sub(r'<section class="pp-compact">(?:(?!</section>).)*?Parcourir cette page.*?</section>' if not en else
                      r'<section class="pp-compact">(?:(?!</section>).)*?Browse this page.*?</section>',
                      lambda m: m[0].replace('<section class="pp-compact">', '<section class="pp-compact">' +
                          f'<details class="et-readiness-details" id="programme-clients-details"><summary>{label}</summary>', 1).replace('</section>', '</details></section>'), text, count=1, flags=re.S)
    return text


def english_documents(text):
    labels = {
        'Download investor fact sheet': 'Download investor factsheet — French PDF',
        '2026 progress report (PDF)': '2026 progress report (French PDF)',
        'Investor factsheet (PDF)': 'Investor factsheet (French PDF)',
        '2026 progress update</h3>': '2026 progress update — French PDF</h3>',
    }
    for a, b in labels.items():
        text = text.replace(a, b)
    return text


def transform(text, name):
    en = name.endswith('-en.html')
    if name in ('index.html', 'index-en.html'):
        text = home(text, en)
    elif name.startswith('gouvernance'):
        text = governance(text, en)
    elif name.startswith('projets'):
        text = projects(text, en)
    elif name.startswith('investor-center'):
        text = investor(text, en)
    elif name.startswith('achats'):
        text = purchasing(text, en)
    elif name.startswith('clients'):
        text = customers(text, en)
    if en:
        text = english_documents(text)
    text = text.replace('Page presentation updated on 7 October 2026.', 'Page presentation updated on 13 October 2026.')
    text = text.replace('Présentation de la page mise à jour le 7 octobre 2026.', 'Présentation de la page mise à jour le 13 octobre 2026.')
    # Match labels to contact outcomes; preserve the legacy subscription section URL.
    if en:
        text = text.replace('href="/investisseurs-en#souscrire"', 'href="/contact-en?profil=invest"')
        text = text.replace('>Subscribe to the capital<', '>Contact investor relations<').replace('>Invest</a>', '>Investor contact</a>')
    else:
        text = text.replace('href="/investisseurs#souscrire"', 'href="/contact?profil=invest"')
        text = text.replace('>Souscrire au capital<', '>Contacter l’équipe investisseurs<').replace('>Investir</a>', '>Contact investisseurs</a>')
    text = text.replace('<link rel="stylesheet" href="/assets/chrome/readiness-20261013.css">', '')
    text = re.sub(r'<style id="et-readiness-style">.*?</style>\n?', '', text, flags=re.S)
    if name in ('index.html', 'index-en.html'):
        text = text.replace('href="/assets/chrome/home-photos.css"', 'href="/assets/chrome/home-photos.css?b=20261013"')
    elif SHEET not in text:
        text = text.replace('</head>', SHEET + '\n</head>', 1)
    return text


def main():
    # Homepages prohibit inline styles. Extend their existing stylesheet, keeping
    # the request count unchanged; its versioned URL refreshes cached copies.
    home_sheet = ROOT / 'assets/chrome/home-photos.css'
    marker = '\n/* Corporate readiness — 13 October 2026 */\n'
    old_css = home_sheet.read_text(encoding='utf-8')
    css = old_css.split(marker)[0] + marker + (ROOT / 'assets/chrome/readiness-20261013.css').read_text()
    if css != old_css:
        home_sheet.write_text(css, encoding='utf-8')
    files = [name + suffix + '.html' for name in ('index', 'gouvernance', 'projets', 'investor-center', 'achats', 'clients') for suffix in ('', '-en')]
    changed = []
    for name in files:
        p = ROOT / name
        old = p.read_text(encoding='utf-8')
        new = transform(old, name)
        if new != old:
            p.write_text(new, encoding='utf-8')
            changed.append(name)
    print('Corporate-readiness pages updated: ' + ', '.join(changed))


if __name__ == '__main__':
    main()
    import runpy
    runpy.run_path(str(ROOT / 'scripts/refresh_document_metadata.py'), run_name='__main__')

    runpy.run_path(str(ROOT / 'scripts/align_investor_journeys.py'), run_name='__main__')

    for page_name in ('contact.html', 'contact-en.html'):
        page = ROOT / page_name
        old = page.read_text(encoding='utf-8')
        new = re.sub(r'/assets/chrome/contact_profiles\.js(?:\?b=\d+)?', '/assets/chrome/contact_profiles.js?b=2026101307', old)
        if new != old:
            page.write_text(new, encoding='utf-8')

    for page in ROOT.rglob('*.html'):
        if any(part in {'.git', '.next', 'out', 'node_modules', 'public', 'reports', 'qa'} for part in page.relative_to(ROOT).parts):
            continue
        old = page.read_text(encoding='utf-8')
        new = re.sub(r'/assets/chrome/cmdk_en\.js(?:\?b=\d+)?', '/assets/chrome/cmdk_en.js?b=2026101305', old)
        if new != old:
            page.write_text(new, encoding='utf-8')

    for asset_name in ('c_abd9013c3955.js', 'c_df4f446df566.js'):
        asset = ROOT / 'assets/chrome' / asset_name
        old = asset.read_text(encoding='utf-8')
        new = old.replace("url:'/#poles'", "url:'/#chaine'").replace("t:'Nos Pôles d’activité'", "t:'Programme pétrolier intégré'")
        if new != old:
            asset.write_text(new, encoding='utf-8')
    for page in ROOT.rglob('*.html'):
        if any(part in {'.git', '.next', 'out', 'node_modules', 'public', 'reports', 'qa'} for part in page.relative_to(ROOT).parts):
            continue
        old = page.read_text(encoding='utf-8')
        new = re.sub(r'/assets/chrome/(c_abd9013c3955|c_df4f446df566)\.js(?:\?b=\d+)?', r'/assets/chrome/\1.js?b=2026101305', old)
        if new != old:
            page.write_text(new, encoding='utf-8')

    runpy.run_path(str(ROOT / 'scripts/align_company_descriptions.py'), run_name='__main__')
