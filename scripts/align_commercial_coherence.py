"""Harmonise commercial claims across the bilingual customer journey.

Only reviewed pages are changed. Interactive logic, forms, contact data, illustrations,
dated documents and their original identifiers remain untouched.
"""
import re
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
from align_b2b_strategy import replace_node

ROOT = Path(__file__).resolve().parents[1]
PAIRS = [
    ('index.html', 'index-en.html'),
    ('nos-activites.html', 'nos-activites-en.html'),
    ('aval/index.html', 'pole-aval-en.html'),
    ('aval/distribution.html', 'aval/distribution-en.html'),
    ('aval/commercialisation.html', 'aval/commercialisation-en.html'),
    ('aval/reseau.html', 'aval/reseau-en.html'),
    ('aval/produits.html', 'aval/produits-en.html'),
    ('aval/raffinage.html', 'aval/raffinage-en.html'),
    ('aval/boutique.html', 'aval/boutique-en.html'),
    ('aval/gpl.html', 'aval/gpl-en.html'),
    ('aval/lubrifiants.html', 'aval/lubrifiants-en.html'),
    ('intermediaire/index.html', 'pole-intermediaire-en.html'),
    ('intermediaire/logistique.html', 'intermediaire/logistique-en.html'),
    ('intermediaire/sites.html', 'intermediaire/sites-en.html'),
    ('intermediaire/services.html', 'intermediaire/services-en.html'),
    ('clients.html', 'clients-en.html'),
    ('contact.html', 'contact-en.html'),
    ('achats.html', 'achats-en.html'),
    ('enerconseils/index.html', 'pole-enerconseils-en.html'),
    ('amont/services-ep.html', 'amont/services-ep-en.html'),
    ('tchaditech/index.html', 'pole-tchaditech-en.html'),
    ('brochure.html', 'brochure-en.html'),
    ('projets.html', 'projets-en.html'),
    ('journal-mobile-stations.html', 'journal-mobile-stations-en.html'),
    ('journal-stockage-strategique.html', 'journal-stockage-strategique-en.html'),
    ('journal-marques-clients.html', 'journal-marques-clients-en.html'),
    ('journal-brut-par-camion.html', 'journal-brut-par-camion-en.html'),
]

# Reviewed wording substitutions, applied to markup outside executable scripts.
FR = [
    ('Standards qualité et HSE garantis.', 'Standards qualité et HSE à définir et à vérifier avant exploitation.'),
    ('approvisionnement garanti et standards d’exploitation', 'approvisionnement à contractualiser et standards d’exploitation à confirmer'),
    ('Qualité Garantie', 'Qualité à vérifier par lot'),
    ('0 fraude', 'Contrôles'),
    ('−40%', 'À chiffrer'),
    ('Couverture territoriale · monopole de fait', 'Couverture territoriale · demande à qualifier'),
    ('Capter les zones sans concurrence.', 'Étudier les zones sous-desservies.'),
    ('Grand Nord — monopole de fait sur un vaste territoire, marge forte malgré la faible densité.', 'Grand Nord — demande, concurrence et coût de desserte à étudier avant implantation.'),
    ('Aucune redistribution concurrente sérieuse à l’est — zone à capter en priorité.', 'La demande, les acteurs en place et les conditions de desserte sont à documenter avant toute implantation à l’est.'),
    ('Marge élevée.', 'Contribution après livraison à établir.'),
    ('Sobre en capital, fort en marge', 'Capital et contribution à valider'),
    ('Qualité certifiée (EN 590 / 228 / 589)', 'Spécifications et preuves qualité à confirmer'),
    ('Disponible sur tout le territoire', 'Zone desservie à confirmer'),
    ('distribués sur tout le réseau dès l’ouverture commerciale', 'distribuables selon les capacités, les autorisations et les zones confirmées'),
    ('Certificat de conformité par lot disponible sur demande.', 'Documents qualité et conformité du lot à définir dans l’offre avant livraison.'),
    ('stations homologuées', 'stations cibles, autorisations à confirmer'),
    ('Stations Tchadium homologuées', 'Stations Tchadium cibles'),
    ('qualité tracée et garantie.', 'traçabilité et qualité à contrôler avant livraison.'),
    ('cétane ≥ 51 · soufre ≤ 50 ppm · EN 590', 'spécifications produit et conformité à confirmer par lot'),
    ('EN 590, cétane ≥ 51, soufre ≤ 50 ppm', 'spécifications contractuelles à confirmer par lot'),
    ('Cétane ≥ 51 · soufre ≤ 50 ppm', 'Spécifications contractuelles et contrôle par lot'),
    ('trois hubs-dépôts au lancement, cinq dépôts régionaux à terme', 'un point d’appui pilote à sélectionner, puis des hubs régionaux conditionnés à la demande et au financement'),
    ('qui approvisionnent en gros, dès le lancement, les clients professionnels servis par import régional', 'dont le déploiement et l’approvisionnement des clients professionnels dépendront des volumes, des autorisations et du financement'),
    ('une force d’intervention parapétrolière intégrée, de la sismique à la récupération…', 'des missions techniques amont définies selon les expertises et partenaires mobilisés.'),
    ('Portefeuille carburant prépayé — commander sans smartphone, par USSD ou WhatsApp.', 'Boutique et services de proximité envisagés ; modalités de commande à confirmer.'),
    ('Paiement &amp; boutique', 'Boutique &amp; services'),
    ('vous recevrez un devis au prix ARSAT.', 'la disponibilité, le prix applicable et les conditions seront à confirmer.'),
    ('Devis ARSAT', 'Offre indicative'),
    ('Recevez un devis transparent, aligné sur le prix réglementé.', 'Recevez une offre précisant disponibilité, zone, prix applicable et conditions de paiement.'),
    ('Validez la commande et le créneau de livraison souhaité.', 'Confirmez les conditions proposées avant toute commande ferme.'),
    ('Du dépôt à votre site ou station — jusqu’au dernier kilomètre.', 'Une livraison sera convenue selon la zone et les moyens effectivement disponibles.'),
    ('avec un devis au prix ARSAT.', 'pour confirmer disponibilité, prix applicable et conditions.'),
    ('Opérateur E&amp;P — étude / pilote / OFS', 'Ingénierie / services amont — étude / pilote'),
    ('Services parapétroliers, EOR, task force pour opérer vos sites.', 'Études aval et missions amont à cadrer selon les expertises, partenaires et moyens disponibles.'),
    ('certifiée ATEX', 'conformité ATEX à valider'),
    ('Portefeuille carburant prépayé', 'Services de proximité envisagés'),
    ('rechargeable et transférable par mobile money', 'modalités et disponibilité à confirmer'),
    ('Facture réglée sous 30 jours après réception conforme, et performance fournisseur notée pour la consultation suivante.', 'Paiement selon les conditions convenues au contrat après réception conforme et facture complète ; évaluation de la prestation pour les consultations suivantes.'),
]
EN = [
    ('Quality and HSE standards guaranteed.', 'Quality and HSE standards to define and verify before operations.'),
    ('guaranteed supply and operating standards', 'contracted supply and operating standards to be confirmed'),
    ('Guaranteed Quality', 'Quality to verify by batch'),
    ('Quality Guaranteed', 'Quality to verify by batch'),
    ('0 fraud', 'Controls'),
    ('−40%', 'To cost'),
    ('Territorial coverage · de facto monopoly', 'Territorial coverage · demand to qualify'),
    ('Capture the areas without competition.', 'Assess underserved areas.'),
    ('Far North — de facto monopoly over a vast territory, strong margin despite low density.', 'Far North — demand, competition and delivery economics to assess before deployment.'),
    ('High margin.', 'Contribution after delivery to establish.'),
    ('Capital-light, strong margins', 'Capital and contribution to validate'),
    ('Certified quality (EN 590 / 228 / 589)', 'Specifications and quality evidence to confirm'),
    ('Available across the country', 'Service area to confirm'),
    ('distributed across the whole network from commercial opening', 'subject to confirmed capacity, approvals and service areas'),
    ('Batch conformity certificate available on request.', 'Batch quality and conformity documents to define in the offer before delivery.'),
    ('approved stations', 'target stations, approvals to confirm'),
    ('cetane ≥ 51 · sulphur ≤ 50 ppm · EN 590', 'product specifications and batch conformity to confirm'),
    ('EN 590, cetane ≥ 51, sulphur ≤ 50 ppm', 'contractual specifications to confirm by batch'),
    ('Cetane ≥ 51 · sulphur ≤ 50 ppm', 'Contractual specifications and batch controls'),
    ('three hub-depots at launch, five regional depots in time', 'a pilot supply base to select, followed by regional hubs subject to demand and funding'),
    ('which supply wholesale, from launch, professional customers served by regional imports', 'whose rollout and professional supply depend on volumes, approvals and funding'),
    ('Prepaid fuel wallet — order without a smartphone, by USSD or WhatsApp.', 'Planned convenience retail and services; ordering arrangements to be confirmed.'),
    ('Payment &amp; shop', 'Shop &amp; services'),
    ('you will receive a quote at the ARSAT price.', 'availability, applicable pricing and terms must be confirmed.'),
    ('ARSAT quote', 'Indicative offer'),
    ('Confirm the order and your preferred delivery slot.', 'Confirm the proposed terms before placing a firm order.'),
    ('E&amp;P operator — study / pilot / OFS', 'Engineering / upstream services — study / pilot'),
    ('ATEX-certified', 'ATEX conformity to validate'),
    ('Prepaid fuel wallet', 'Planned convenience services'),
    ('top-up and transferable by mobile money', 'terms and availability to confirm'),
    ('Invoice settled within 30 days of compliant receipt, and supplier performance scored for the next tender.', 'Payment under the agreed contract terms after compliant receipt and a complete invoice; supplier performance reviewed for future consultations.'),
]


def plain(text):
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', ' ', text))).strip()


def paragraph_copy(markup, en):
    """Replace complete arguments that otherwise survive as contradictory copy."""
    def rewrite(match):
        p = match[0]
        text = plain(p).lower()
        new = None
        if 'price premium' in text or 'prime de prix' in text:
            new = ('An additivised product is a possible development. Performance claims, product approval and pricing require evidence and confirmation within the applicable framework.' if en else
                   'Une gamme additivée est un développement possible. Les bénéfices annoncés, la conformité du produit et sa tarification nécessitent des preuves et une validation dans le cadre applicable.')
        elif 'même prix' in text and 'intégrée' in text and 'possible' in text:
            new = 'L’objectif d’accès territorial suppose un coût complet de desserte soutenable, un financement identifié et le respect du cadre tarifaire applicable. L’intégration seule ne démontre pas la rentabilité du dernier kilomètre.'
        elif ('c’est possible parce que la chaîne est intégrée' in text or 'possible because the chain is integrated' in text or 'this is possible because the chain is integrated' in text):
            new = ('This access objective requires sustainable delivery economics, identified financing and compliance with applicable pricing. Integration alone does not establish last-mile profitability.' if en else
                   'Cet objectif d’accès suppose une économie de desserte soutenable, un financement identifié et le respect du cadre tarifaire applicable. L’intégration seule ne prouve pas la rentabilité du dernier kilomètre.')
        elif ('sobre en capital et fort en marge' in text or 'capital-light and strong-margin' in text or 'capital-light and high-margin' in text):
            new = ('The target hub and mobile network will be developed progressively. Siting, storage capacity, investment and contribution after delivery must be validated before rollout.' if en else
                   'Le réseau cible de hubs et d’unités mobiles sera développé progressivement. Implantation, stockage, investissement et contribution après livraison doivent être validés avant déploiement.')
        elif ('regulatory price' in text or 'prix arsat' in text) and ('two ways to buy' in text or 'les produits raffinés atteignent' in text):
            new = ('Retail and professional delivery are separate target channels. Availability, quality specifications, pricing and delivery terms are confirmed for each requirement before commitment.' if en else
                   'Le détail et la livraison professionnelle sont deux canaux cibles distincts. Disponibilité, spécifications qualité, prix et conditions de livraison sont à confirmer pour chaque besoin avant engagement.')
        elif 'une gamme additivée maison nettoie' in text or 'an in-house additivised range cleans' in text:
            new = ('Possible additives require documented product performance and compatibility before any commercial claim.' if en else
                   'L’éventuelle additivation nécessite des performances documentées et une compatibilité validée avant toute promesse commerciale.')
        elif ('retour en charge' in text or 'return load' in text or 'backhaul' in text) and ('produits finis' in text or 'finished products' in text):
            new = ('Crude and refined products require distinct logistics assessments. A shared vehicle or return load cannot be assumed without validated compatibility, contamination controls and approved procedures.' if en else
                   'Le brut et les produits raffinés nécessitent des études logistiques distinctes. Un véhicule partagé ou un retour en charge ne peut être retenu sans compatibilité validée, maîtrise de la contamination et procédures approuvées.')
        if new is None:
            return p
        opening = p[:p.index('>') + 1]
        return opening + escape(new) + '</p>'
    return re.sub(r'<p\b[^>]*>.*?</p>', rewrite, markup, flags=re.S)


def markup_copy(markup, en):
    markup = paragraph_copy(markup, en)
    for old, new in (EN if en else FR):
        markup = markup.replace(old, new)
    if en:
        markup = re.sub(r'(?:deployable|deployed) in 24[-–]48[\s\u00a0]*h(?:ours)?', 'subject to confirmed mobilisation conditions', markup, flags=re.I)
        markup = re.sub(r'(?:deployment in |deployment |to deploy a Mobile Station™ in )24[-–]48[\s\u00a0]*h', 'Mobilisation timing to confirm', markup, flags=re.I)
        markup = markup.replace('Approved Tchadium stations', 'Target Tchadium stations')
        markup = markup.replace('The far North — a de facto monopoly over a vast territory, strong margin despite low density.', 'Far North — demand, competition and delivery economics to assess before deployment.')
    else:
        markup = re.sub(r'déployables? en 24[-–]48[\s\u00a0]*h', 'à mobilisation conditionnelle', markup, flags=re.I)
        markup = re.sub(r'déployée?s? en 24[-–]48[\s\u00a0]*h', 'à mobilisation conditionnelle', markup, flags=re.I)
        markup = re.sub(r'déploiement (?:en )?24[-–]48[\s\u00a0]*h', 'Mobilisation à confirmer', markup, flags=re.I)
    # Standalone KPI cells must not read as delivery commitments.
    markup = re.sub(r'(?<=>)24[-–]48[\s\u00a0]*h(?=<)', 'To confirm' if en else 'À confirmer', markup)
    return markup


def outside_scripts(source, en):
    parts = re.split(r'(<(?:script|style)\b[^>]*>.*?</(?:script|style)>)', source, flags=re.S | re.I)
    return ''.join(part if re.match(r'<(?:script|style)\b', part, re.I) else markup_copy(part, en) for part in parts)


def brochure_script_copy(script, en):
    """Change only approved display strings in the brochure's interactive data."""
    pairs = ([
        ('la Mobile Station™ conteneurisée se déploie en 24-48 h.', 'la mobilisation de la Mobile Station™ conteneurisée reste à confirmer selon le site, le transport et les autorisations.'),
        ('certifiée ATEX', 'conformité ATEX à valider'),
        ('Autonomie 30 j', 'Autonomie à dimensionner'),
    ] if not en else [
        ('the containerised Mobile Station™ deploys in 24-48 h.', 'mobilisation of the containerised Mobile Station™ depends on site conditions, transport and approvals.'),
        ('ATEX-certified', 'ATEX conformity to validate'),
        ('30-day autonomy', 'Autonomy to size'),
    ])
    for old, new in pairs:
        script = script.replace(old, new)
    return script


def context_note(path, en):
    suffix = '-en' if en else ''
    journal = path.startswith('journal-')
    engineering = 'enerconseils' in path or 'services-ep' in path
    catalogue = 'boutique' in path
    if journal:
        title = 'Commercial update · 18 October 2026' if en else 'Mise au point commerciale · 18 octobre 2026'
        body = ('This dated article describes a target concept. Current offers, capacities, deployment timing and service areas must be confirmed from the current offer pages before commitment.' if en else
                'Ce carnet daté décrit un concept cible. Offres, capacités, calendrier de déploiement et zones desservies sont à confirmer sur les pages d’offre actuelles avant tout engagement.')
    elif engineering:
        title = 'A technical scope defined for each assignment' if en else 'Un périmètre technique défini pour chaque mission'
        body = ('Downstream engineering and specialist upstream services are scoped separately. Each proposal must identify deliverables, qualified expertise, confirmed partners, required approvals and acceptance terms. Capabilities in development are not operating references.' if en else
                'L’ingénierie aval et les services amont spécialisés font l’objet de périmètres distincts. Chaque proposition doit préciser livrables, expertises qualifiées, partenaires confirmés, autorisations et réception. Une capacité en développement ne constitue pas une référence opérationnelle.')
    elif catalogue:
        title = 'Prepare a request, without a firm order' if en else 'Préparer une demande, sans commande ferme'
        body = ('The catalogue is a planning aid. Products, packaging, acceptance locations, applicable pricing and payment terms remain subject to confirmation. No sales opening, payment or credit facility is created by preparing a request.' if en else
                'Le catalogue aide à préparer un besoin. Produits, conditionnements, points de service, prix applicables et paiement restent à confirmer. Préparer une demande n’ouvre ni vente, ni paiement, ni facilité de crédit.')
    else:
        title = 'Professional supply · progressive development' if en else 'Approvisionnement professionnel · développement progressif'
        body = ('EnerTchad is a company in formation. The proposed launch prioritises qualified recurring professional demand in serviceable areas. Sourcing, stock, transport, approvals and financing must be confirmed. Hubs, mobile units and wider coverage depend on demonstrated demand and delivery economics.' if en else
                'EnerTchad est une société en constitution. Le lancement envisagé privilégie les besoins professionnels récurrents qualifiés dans les zones desservables. Sourcing, stock, transport, autorisations et financement sont à confirmer. Hubs, unités mobiles et extension de couverture dépendent de la demande et de l’économie de desserte démontrées.')
    links = [(f'/clients{suffix}#industriels', 'Professional supply' if en else 'Approvisionnement'),
             (f'/clients{suffix}#flottes', 'Fleet management' if en else 'Gestion des flottes'),
             (f'/clients{suffix}#operateurs', 'Engineering' if en else 'Ingénierie')]
    inner_style = ' style="max-width:70ch;margin:24px auto;padding:20px;border:1px solid currentColor;border-radius:12px"' if journal else ''
    return ('<section class="pp-compact pp-mist" id="commercial-scope" aria-labelledby="commercial-scope-title">'
            f'<div class="pp-wrap"><div class="pp-prose pp-prose-w"{inner_style}><h2 id="commercial-scope-title">{title}</h2><p>{body}</p><div class="pp-actions">'
            + ''.join(f'<a class="pp-link" style="display:inline-block;min-height:44px;margin-right:14px" href="{escape(href, quote=True)}">{label}</a>' for href, label in links) + '</div></div></div></section>')


class EditorialBoundary(HTMLParser):
    """Find real DOM boundaries, ignoring tag-like strings inside CSS and JS."""
    def __init__(self, source):
        super().__init__()
        self.source = source
        self.lines = [0] + [m.end() for m in re.finditer('\n', source)]
        self.main = self.article = self.hero = None
        self.article_body = None
        self.inside_main = False

    def position(self):
        row, col = self.getpos()
        return self.lines[row - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag == 'main' and self.main is None:
            self.main = self.source.index('>', self.position()) + 1
            self.inside_main = True
        if tag == 'article' and dict(attrs).get('role') == 'main' and self.article is None:
            self.article = self.source.index('>', self.position()) + 1
        if tag == 'div' and self.article is not None and 'jbody' in dict(attrs).get('class', '').split() and self.article_body is None:
            self.article_body = self.source.index('>', self.position()) + 1

    def handle_endtag(self, tag):
        if tag == 'header' and self.inside_main and self.hero is None:
            self.hero = self.source.index('>', self.position()) + 1
        if tag == 'main':
            self.inside_main = False


def insert_note(source, path, en):
    if path.startswith(('clients', 'aval/distribution', 'aval/commercialisation')):
        return source
    note = context_note(path, en)
    if 'id="commercial-scope"' in source:
        source = replace_node(source, 'commercial-scope', '')
    boundary = EditorialBoundary(source)
    boundary.feed(source)
    at = boundary.hero or boundary.main or boundary.article_body or boundary.article
    if at is None:
        raise ValueError(f'Missing editorial insertion boundary in {path}')
    return source[:at] + note + source[at:]


def mobile_table(source, en):
    caption = 'Reference concepts · engineering approval required' if en else 'Concepts de référence · validation d’ingénierie requise'
    cells = [('MS-5000', '5 000 L'), ('MS-10000', '10 000 L'), ('MS-15000 Pro', '15 000 L')]
    new = ('<table><caption>' + caption + '</caption><thead><tr><th scope="col">' + ('Concept' if en else 'Concept')
           + '</th><th scope="col">' + ('Target fuel capacity' if en else 'Capacité carburant cible') + '</th></tr></thead><tbody>'
           + ''.join(f'<tr><th scope="row">{name}</th><td>{volume}</td></tr>' for name, volume in cells) + '</tbody></table><p>'
           + ('These design targets do not establish a certified product. Useful capacity, product compatibility, site installation and mobilisation timing must be validated before commitment.' if en else
              'Ces objectifs de conception ne constituent pas un produit certifié. Capacité utile, compatibilité des produits, implantation et calendrier de mobilisation sont à valider avant engagement.') + '</p>')
    return re.sub(r'<table\b[^>]*>.*?</table>', lambda m: new if '12 min' in m[0] and '20 m³' in m[0] else m[0], source, flags=re.S)


def product_specs(source, en):
    identifier = 'specs-products' if en else 'specs-produits'
    title = 'Product specifications and batch evidence' if en else 'Spécifications produit et preuves par lot'
    intro = ('For every proposed product, define the intended use, applicable specifications, compatibility, quality documents and acceptance checks before supply. Published product families do not establish current availability or certification.' if en else
             'Pour chaque produit envisagé, définir usage, spécifications applicables, compatibilité, documents qualité et contrôles de réception avant fourniture. Une famille de produits présentée ne démontre ni disponibilité actuelle ni certification.')
    items = ([('Motor fuels', 'Confirm the diesel or petrol specification and vehicle requirements.'), ('Aviation', 'A separate quality, authorisation and operating assessment is required.'), ('LPG', 'Confirm the product specification, approved containers and distribution arrangements.'), ('Lubricants and bitumen', 'Confirm grade, equipment or project requirements and batch documentation.')]
             if en else [('Carburants moteurs', 'Confirmer la spécification gasoil ou essence et les exigences des véhicules.'), ('Aviation', 'Prévoir un dossier qualité, autorisations et exploitation distinct.'), ('GPL', 'Confirmer spécification, contenants autorisés et modalités de distribution.'), ('Lubrifiants et bitume', 'Confirmer grade, exigences des équipements ou du chantier et documents de lot.')])
    content = (f'<section id="{identifier}" class="pp-mist" aria-labelledby="pp-h6"><div class="pp-wrap"><div class="pp-prose pp-prose-w"><h2 id="pp-h6">{title}</h2><p>{intro}</p><ul>'
               + ''.join(f'<li><strong>{name}</strong> — {desc}</li>' for name, desc in items) + '</ul></div></div></section>')
    return replace_node(source, identifier, content)


def network(source, en):
    source = mobile_table(source, en)
    # Replace unsupported economics rather than adding a disclaimer to them.
    specific = ([
        ('Le modèle hub + mobile couvre le territoire avec moins d’actifs fixes qu’un réseau classique.', 'Le capital nécessaire doit être comparé à service et volumes équivalents, stockage et financement du cycle inclus.'),
        ('Ouvrir un nouveau point de vente mobile prend des jours, pas des mois.', 'La mobilisation dépend du transport, de la préparation du site et des autorisations.'),
        ('Livraison camion-citerne · engagements de délai', 'Livraison camion-citerne · délais à confirmer par site'),
        ('Zone 1 · N’Djamena &amp; périphérie — <b>24 h</b>', 'Zone 1 · N’Djamena &amp; périphérie — <b>à confirmer</b>'),
        ('Un carburant différencié justifie une prime de prix et bâtit la préférence de marque.', 'Toute différenciation doit être documentée et sa tarification validée dans le cadre applicable.'),
        ('−5 FCFA/L · lavage mensuel offert', 'Avantages à définir selon les conditions du programme'),
        ('Vidange offerte tous les 3 mois', 'Services à confirmer avant souscription'),
        ('Stocké en hubs-dépôts, 30 j d’autonomie.', 'Stockage et autonomie à dimensionner selon la demande et le réapprovisionnement.'),
        ('Autonomie 30 j', 'Autonomie à dimensionner'),
        ('en À confirmer', 'selon un calendrier à confirmer'),
        ('en <strong>À confirmer</strong>', 'selon un <strong>calendrier à confirmer</strong>'),
        ('Le carburant est stocké dans des hubs-dépôts', 'Le stockage envisagé repose sur des hubs-dépôts'),
    ] if not en else [
        ('The hub + mobile model covers the territory with fewer fixed assets than a conventional network.', 'Required capital must be compared at equivalent service and volumes, including storage and working-capital funding.'),
        ('Opening a new mobile point of sale takes days, not months.', 'Mobilisation depends on transport, site preparation and approvals.'),
        ('−5 CFA/L · free monthly wash', 'Benefits subject to confirmed programme terms'),
        ('−5 FCFA/L · free monthly wash', 'Benefits subject to confirmed programme terms'),
        ('Free oil change every 3 months', 'Services to confirm before subscription'),
        ('Stored in hub-depots, 30 days’ autonomy.', 'Storage and autonomy to size against demand and replenishment.'),
        ('30-day autonomy', 'Autonomy to size'),
        ('Fuel is stored in one-hectare hub-depots', 'Target storage involves hub-depots whose design is to be validated'),
    ])
    def apply(part):
        for old, new in specific:
            part = part.replace(old, new)
        # Fixed delivery windows and rapid-opening comparisons are not commitments.
        part = re.sub(r'(?<![\w])(?:24[-–]48|48[-–]72|24|48)\s*h\b', 'To confirm' if en else 'À confirmer', part)
        if not en:
            part = part.replace('en À confirmer', 'selon un calendrier à confirmer').replace('en <strong>À confirmer</strong>', 'selon un <strong>calendrier à confirmer</strong>')
        return part
    parts = re.split(r'(<(?:script|style)\b[^>]*>.*?</(?:script|style)>)', source, flags=re.S | re.I)
    return ''.join(p if re.match(r'<(?:script|style)\b', p, re.I) else apply(p) for p in parts)


def transform(source, path, en):
    source = outside_scripts(source, en)
    if path.startswith('brochure'):
        source = re.sub(r'<script\b[^>]*>.*?</script>', lambda m: brochure_script_copy(m[0], en), source, flags=re.S)
    if path.startswith('aval/reseau'):
        source = network(source, en)
    if path.startswith('aval/produits'):
        source = product_specs(source, en)
    return insert_note(source, path, en)


def main():
    changed = []
    for pair in PAIRS:
        for en, path in enumerate(pair):
            page = ROOT / path
            before = page.read_text(encoding='utf-8')
            after = transform(before, path, bool(en))
            if before != after:
                page.write_text(after, encoding='utf-8')
                changed.append(path)
    print(f'Commercial coherence aligned across {len(PAIRS) * 2} reviewed pages; {len(changed)} updated.')


if __name__ == '__main__':
    main()
