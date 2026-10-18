"""Apply the reviewed bilingual B2B offer structure after editorial preparation.

Retain existing anchors, contact profiles, company data and public-sector paths.
This migration changes editorial copy only, without opening sales or credit.
"""
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Nodes(HTMLParser):
    def __init__(self, source, identifier):
        super().__init__(convert_charrefs=False)
        self.source, self.identifier = source, identifier
        self.lines = [0]
        for m in re.finditer('\n', source):
            self.lines.append(m.end())
        self.start = self.end = None
        self.tag = None
        self.depth = 0

    def absolute_position(self):
        row, col = self.getpos()
        return self.lines[row - 1] + col

    def handle_starttag(self, tag, attrs):
        if self.end is not None:
            return
        if self.start is None and dict(attrs).get('id') == self.identifier:
            self.start, self.tag, self.depth = self.absolute_position(), tag, 1
        elif self.start is not None and tag == self.tag:
            self.depth += 1

    def handle_endtag(self, tag):
        if self.start is not None and self.end is None and tag == self.tag:
            self.depth -= 1
            if not self.depth:
                self.end = self.source.index('>', self.absolute_position()) + 1


def replace_node(source, identifier, content):
    node = Nodes(source, identifier)
    node.feed(source)
    if node.start is None or node.end is None:
        raise ValueError(f'B2B migration: missing complete node {identifier}')
    return source[:node.start] + content + source[node.end:]


def link(url, label):
    # The arrow is drawn by the shared .pp-link::after rule; a text arrow doubles it.
    return f'<a class="pp-link" href="{escape(url, quote=True)}">{escape(label)}</a>'


def block(identifier, title, intro, bullets, actions=()):
    return (f'<div class="pp-block" id="{identifier}"><div class="pp-bh"><h3>{escape(title)}</h3></div>'
            f'<div class="pp-prose"><p class="pp-lp">{escape(intro)}</p><ul>'
            + ''.join(f'<li>{escape(s)}</li>' for s in bullets) + '</ul><div class="pp-actions">'
            + ''.join(link(*a) for a in actions) + '</div></div></div>')


def offers(en):
    return ([
        ('Professional fuel supply', 'Discuss the product, recurring volumes, delivery sites and purchasing schedule.', 'industriels'),
        ('EnerPro · fleet management', 'Define vehicle controls, consumption reporting and the acceptance area to be confirmed.', 'flottes'),
        ('Engineering & technical services', 'Scope a study, site installation or specialist oilfield assignment.', 'operateurs'),
    ] if en else [
        ('Approvisionnement professionnel', 'Préciser le produit, les volumes récurrents, les sites et le calendrier d’achat.', 'industriels'),
        ('EnerPro · gestion des flottes', 'Définir les droits par véhicule, le suivi des consommations et le périmètre à confirmer.', 'flottes'),
        ('Ingénierie & services techniques', 'Cadrer une étude, une installation sur site ou une mission pétrolière spécialisée.', 'operateurs'),
    ])


def introduction(en):
    suffix = '-en' if en else ''
    title = 'Three B2B offers, one clear starting point' if en else 'Trois offres B2B, un point de départ clair'
    note = ('Offers in preparation. Scope, supply capacity, service area, approvals and commercial terms must be confirmed for each requirement before commitment.' if en else
            'Offres en préparation. Périmètre, capacité d’approvisionnement, zone desservie, autorisations et conditions commerciales sont à confirmer pour chaque besoin avant engagement.')
    cards = ''.join(f'<a href="#{anchor}"><b>{escape(t)}</b><span>{escape(d)}</span></a>' for t, d, anchor in offers(en))
    supplier = 'Suppliers: request registration' if en else 'Fournisseurs : demander un référencement'
    public = 'Public-sector requirements' if en else 'Besoins des acteurs publics'
    return (f'<section class="et-readiness" id="besoin-client" aria-labelledby="besoin-client-title">'
            f'<h2 id="besoin-client-title">{title}</h2><p>{note}</p><div class="et-readiness-routes">{cards}</div>'
            f'<p><a href="/achats{suffix}">{supplier}</a> · <a href="#b2g">{public}</a></p></section>')


def customer_blocks(en):
    suffix = '-en' if en else ''
    contact = '/contact' + suffix
    b2b = contact + '?profil=b2b#ctForm'
    ep = contact + '?profil=ep#ctForm'
    engineering = '/pole-enerconseils-en#ingenierie' if en else '/enerconseils/#ingenierie'
    oilfield = '/amont/services-ep-en' if en else '/amont/services-ep'
    if en:
        return {
            'industriels': block('industriels', 'Professional fuel supply',
                'A proposed supply offer for construction, transport, agro-industry and backup power. Recurring requirements in serviceable areas will guide the first commercial phase.', [
                    'First discuss diesel requirements; other products depend on confirmed sourcing, specifications and site needs.',
                    'Provide the delivery location, monthly volume, seasonality, receiving facilities and purchasing schedule.',
                    'An offer specifies product, volume, delivery window, quality documents and payment terms. A framework agreement does not itself constitute an order.',
                    'Supply sources, storage sites and delivery capacity remain subject to confirmation. Commercial operations have not opened.',
                ], [(b2b, 'Discuss a supply requirement')]),
            'flottes': block('flottes', 'EnerPro · fleet management',
                'A planned service to control vehicle spending and simplify consumption reporting. Its rollout will follow the effective supply and acceptance network.', [
                    'Define vehicle permissions, spending limits, consumption records and invoice reconciliation.',
                    'Card acceptance locations, activation dates and reporting features must be confirmed before subscription.',
                    'Payment terms are assessed for each account; a card does not automatically provide credit.',
                    'Start with a defined fleet and service area, then review service performance before extending coverage.',
                ], [(b2b, 'Describe your fleet'), ('/aval/reseau-en', 'View the target network')]),
            'operateurs': block('operateurs', 'Engineering & technical services',
                'Two planned technical paths, each with an agreed scope, deliverables and identified project responsibility.', [
                    'Downstream engineering: requirements studies, storage and private-station design, metering, maintenance and consumption monitoring.',
                    'Upstream services: discuss geosciences, integrity, operations or EOR as separate specialist assignments.',
                    'Each proposal must identify the expertise available, partners confirmed for the assignment and capabilities still in development.',
                    'Execution depends on qualified teams, the required approvals, funding and a contract defining deliverables and acceptance.',
                ], [(engineering, 'Explore engineering'), (oilfield, 'Explore oilfield services'), (ep, 'Discuss a technical project')]),
            'fournisseurs': block('fournisseurs', 'Suppliers & subcontractors · registration',
                'A dedicated purchasing pathway for companies offering products, equipment or services to EnerTchad.', [
                    'Present your business, expertise, references, service area and supporting documents.',
                    'Registration is separate from customer enquiries and does not constitute a contract award.',
                ], [('/achats-en', 'Request supplier registration')]),
            'parcours': block('parcours', 'From requirements to a recurring relationship',
                'A proposed commercial process adapted to each account; every stage depends on confirmed delivery capability.', [
                    'Qualify the product or technical scope, volume, location, decision-makers, timing and payment requirements.',
                    'Arrange a technical site assessment when needed, then confirm feasibility and the delivery scope.',
                    'Prepare an itemised proposal covering pricing terms, responsibilities, acceptance and payment.',
                    'Agree a paid pilot where appropriate, then review deliveries, invoices and payments before a recurring contract.',
                    'Review service regularly: complete and timely delivery, product conformity, consumption records and claim resolution.',
                ], [(b2b, 'Present your requirements')]),
            'reperes-clients': block('reperes-clients', 'Commitments defined for each requirement',
                'EnerTchad is a company in formation. Proposed capabilities are distinct from services currently available.', [
                    'Product, volume, location and service window confirmed before commitment.',
                    'Technical scope, quality evidence and responsibilities defined in the proposal.',
                    'Acceptance network and payment terms confirmed for each account.',
                ]),
            'programmes': block('programmes', 'Customer programmes in preparation',
                'Programmes will be introduced as the operating network and services become available.', [
                    'EnerPro: proposed fleet controls and reporting, within a confirmed acceptance area.',
                    'EnerClub and NRJ+: planned retail loyalty and convenience services, separate from B2B agreements.',
                    'Any discount, subscription or credit arrangement requires explicit terms; no automatic benefit is granted at this stage.',
                ]),
        }
    return {
        'industriels': block('industriels', 'Approvisionnement professionnel',
            'Une offre de fourniture envisagée pour le BTP, le transport, l’agro-industrie et l’énergie de secours. Les besoins récurrents dans les zones desservables guideront la première phase commerciale.', [
                'Étudier d’abord les besoins en gasoil ; les autres produits dépendront du sourcing confirmé, des spécifications et du besoin du site.',
                'Préciser le lieu de livraison, le volume mensuel, la saisonnalité, les installations de réception et le calendrier d’achat.',
                'L’offre précise produit, volume, fenêtre de livraison, documents qualité et paiement. Un contrat-cadre ne constitue pas à lui seul une commande.',
                'Origines, sites de stockage et capacité de livraison restent à confirmer. L’ouverture commerciale n’a pas encore eu lieu.',
            ], [(b2b, 'Présenter un besoin d’approvisionnement')]),
        'flottes': block('flottes', 'EnerPro · gestion des flottes',
            'Un service prévu pour encadrer les dépenses par véhicule et simplifier le suivi des consommations. Son déploiement suivra le réseau d’approvisionnement et d’acceptation effectivement disponible.', [
                'Définir les droits par véhicule, les plafonds, les relevés et le rapprochement avec les factures.',
                'Points d’acceptation, dates d’activation des cartes et fonctions de reporting à confirmer avant souscription.',
                'Les conditions de paiement sont étudiées par compte ; une carte ne donne pas automatiquement accès au crédit.',
                'Commencer sur une flotte et une zone définies, puis examiner le service rendu avant toute extension.',
            ], [(b2b, 'Décrire votre flotte'), ('/aval/reseau', 'Voir le réseau cible')]),
        'operateurs': block('operateurs', 'Ingénierie & services techniques',
            'Deux parcours techniques envisagés, chacun avec un périmètre, des livrables et une responsabilité de projet définis.', [
                'Ingénierie aval : étude du besoin, conception du stockage et des stations privatives, métrologie, maintenance et suivi des consommations.',
                'Services amont : géosciences, intégrité, exploitation ou EOR à étudier sous forme de missions spécialisées.',
                'Chaque proposition doit distinguer les expertises disponibles, les partenaires confirmés pour la mission et les capacités encore en développement.',
                'La réalisation dépend des équipes qualifiées, des autorisations nécessaires, du financement et d’un contrat précisant livrables et réception.',
            ], [(engineering, 'Découvrir l’ingénierie'), (oilfield, 'Explorer les services pétroliers'), (ep, 'Présenter un projet technique')]),
        'fournisseurs': block('fournisseurs', 'Fournisseurs & sous-traitants · référencement',
            'Un parcours achats dédié aux entreprises proposant produits, équipements ou prestations à EnerTchad.', [
                'Présenter votre activité, vos compétences, vos références, votre zone d’intervention et les documents justificatifs.',
                'Le référencement est distinct d’une demande client et ne vaut pas attribution de marché.',
            ], [('/achats', 'Demander un référencement fournisseur')]),
        'parcours': block('parcours', 'Du besoin qualifié au contrat récurrent',
            'Un parcours commercial envisagé, adapté à chaque compte et conditionné aux moyens de réalisation confirmés.', [
                'Qualifier produit ou périmètre technique, volume, localisation, décideurs, calendrier et conditions de paiement.',
                'Prévoir une visite technique si nécessaire, puis confirmer la faisabilité et le périmètre de livraison.',
                'Établir une offre détaillant conditions de prix, responsabilités, réception et paiement.',
                'Convenir d’un pilote payant lorsque pertinent, puis examiner livraisons, factures et encaissements avant un contrat récurrent.',
                'Suivre le service : livraisons complètes et ponctuelles, conformité, consommations et traitement des réclamations.',
            ], [(b2b, 'Présenter votre besoin')]),
        'reperes-clients': block('reperes-clients', 'Des engagements définis pour chaque besoin',
            'EnerTchad est une société en constitution. Les capacités envisagées sont distinctes des services actuellement disponibles.', [
                'Produit, volume, localisation et fenêtre de service confirmés avant engagement.',
                'Périmètre technique, justificatifs qualité et responsabilités définis dans l’offre.',
                'Réseau d’acceptation et conditions de paiement confirmés pour chaque compte.',
            ]),
        'programmes': block('programmes', 'Des programmes clients en préparation',
            'Les programmes seront déployés au rythme du réseau et des services effectivement disponibles.', [
                'EnerPro : contrôle et reporting de flotte envisagés, dans un périmètre d’acceptation confirmé.',
                'EnerClub et NRJ+ : fidélité et services de proximité grand public prévus, distincts des contrats B2B.',
                'Toute remise, souscription ou facilité de paiement suppose des conditions explicites ; aucun avantage automatique n’est ouvert à ce stade.',
            ]),
    }


def customers(source, en):
    source = replace_node(source, 'besoin-client', introduction(en))
    for identifier, content in customer_blocks(en).items():
        # Keep the numbered profile eyebrow (01 to 07) already present in the source block.
        kicker = re.search(r'id="%s"><div class="pp-bh">(<p class="pp-k">[^<]*</p>)' % re.escape(identifier), source)
        if kicker:
            content = content.replace('<div class="pp-bh">', '<div class="pp-bh">' + kicker.group(1), 1)
        source = replace_node(source, identifier, content)
    title = 'Three B2B offers and dedicated pathways' if en else 'Trois offres B2B et des parcours dédiés'
    bullets = ([
        'Fuel supply: scoped volumes, destinations and delivery terms.',
        'Fleet management: controls and reporting, subject to confirmed network availability.',
        'Engineering: separate downstream and upstream technical scopes.',
        'Public-sector requests follow their own consultation process; suppliers use the purchasing registration pathway.',
    ] if en else [
        'Approvisionnement : volumes, destinations et conditions de livraison définis.',
        'Gestion des flottes : contrôle et reporting, selon le réseau effectivement disponible.',
        'Ingénierie : périmètres techniques aval et amont distincts.',
        'Les acteurs publics suivent leur procédure de consultation ; les fournisseurs disposent du parcours de référencement achats.',
    ])
    source = replace_node(source, 'comparer', block('comparer', title, 'EnerTchad · B2B', bullets))
    # Update directory and orientation cards without touching the retained anchors.
    for old, new in ([
        ('Un seul interlocuteur, tout le cycle du puits.', 'Ingénierie &amp; services techniques'),
        ('Carburant maîtrisé, flotte sous contrôle.', 'EnerPro · gestion des flottes'),
        ('De la commande-cadre à la livraison sur site.', 'Approvisionnement professionnel'),
        ('Des engagements simples, les mêmes pour tous.', 'Des engagements définis pour chaque besoin'),
        ('Du premier contact à la livraison.', 'Du besoin qualifié au contrat récurrent'),
        ('Cartes carburant, suivi de consommation et accès au réseau, partout au Tchad.', 'Gestion des consommations et périmètre d’acceptation à confirmer.'),
        ('Services parapétroliers intégrés, récupération assistée (EOR) et force d’intervention.', 'Études et missions techniques aval ou amont, selon les compétences mobilisées.'),
        ('Pour les opérateurs et consortiums\u00a0: une force d’intervention parapétrolière intégrée, de la sismique à la récupération…', 'Études et missions techniques aval ou amont, selon les compétences mobilisées.'),
        ('Cibles de service d’une société en constitution — affichées, datées, opposables à l’ouverture commerciale.', 'Périmètre, disponibilité et conditions à confirmer avant engagement.'),
        ('Un parcours simple, le même pour tous les profils. (processus cible · société en constitution)', 'Qualification, étude, offre et pilote adaptés à chaque besoin.'),
    ] if not en else [
        ('One point of contact, the whole well cycle.', 'Engineering &amp; technical services'),
        ('From the framework order to on-site delivery.', 'Professional fuel supply'),
        ('Fuel managed, fleet under control.', 'EnerPro · fleet management'),
        ('Simple commitments, the same for everyone.', 'Commitments defined for each requirement'),
        ('From first contact to delivery.', 'From requirements to a recurring relationship'),
        ('Fuel cards, consumption tracking and network access, everywhere in Chad.', 'Consumption controls and an acceptance area to be confirmed.'),
        ('Integrated oilfield services, enhanced oil recovery (EOR) and a task force.', 'Downstream and upstream technical assignments, subject to the expertise mobilised.'),
        ('For operators and consortia: an integrated oilfield-services task force, from seismic to enhanced recovery…', 'Scoped downstream and upstream technical assignments.'),
        ('Service targets of a company in formation — published, dated, binding at commercial opening.', 'Scope, availability and terms confirmed before commitment.'),
        ('A simple journey, the same for every profile. (target process · company in formation)', 'Qualification, assessment, proposal and pilot adapted to each requirement.'),
    ]):
        source = source.replace(old, new)
    # The supplier orientation card leads to procurement, not to a sales enquiry.
    def supplier_card(m):
        return m[0].replace('href="#fournisseurs"', 'href="/achats-en"' if en else 'href="/achats"').replace('<span>B2B</span>', '<span>' + ('Procurement' if en else 'Achats') + '</span>')
    source = re.sub(r'<a\b[^>]*class="pp-cell"[^>]*href="#fournisseurs"[^>]*>.*?</a>', supplier_card, source, flags=re.S)
    source = source.replace('href="#fournisseurs"><span>B2B</span>', 'href="/achats-en"><span>Procurement</span>' if en else 'href="/achats"><span>Achats</span>')
    return source


def commercial(source, en):
    suffix = '-en' if en else ''
    title = 'Three B2B offers, developed progressively' if en else 'Trois offres B2B, développées progressivement'
    intro = ('Fuel supply, fleet management and engineering: separate scopes, with availability and terms confirmed for each account. Retail, aviation and LPG remain separate developments subject to their own prerequisites.' if en else
             'Approvisionnement, gestion des flottes et ingénierie : des périmètres distincts, avec disponibilité et conditions confirmées par compte. Le grand public, l’aviation et le GPL restent des développements distincts, soumis à leurs propres prérequis.')
    cards = ''.join(f'<article class="pp-cell"><h3>{escape(t)}</h3><p>{escape(d)}</p>{link("/clients" + suffix + "#" + anchor, "Explore this offer" if en else "Découvrir cette offre")}</article>' for t, d, anchor in offers(en))
    method = ('Qualify demand and payment terms; assess the site when needed; prepare a scoped proposal; agree a paid pilot where appropriate; review service and collections before expansion.' if en else
              'Qualifier la demande et les conditions de paiement ; étudier le site si nécessaire ; préparer une offre cadrée ; convenir d’un pilote payant lorsque pertinent ; examiner le service et les encaissements avant toute extension.')
    note = ('Company in formation. No commercial opening has taken place. Delivery areas, sourcing, storage, teams and authorisations must be confirmed before commitment. Neither network-wide acceptance nor credit is automatic.' if en else
            'Société en constitution. L’ouverture commerciale n’a pas encore eu lieu. Zones de livraison, sourcing, stockage, équipes et autorisations sont à confirmer avant engagement. Ni l’acceptation sur tout le réseau ni le crédit ne sont automatiques.')
    content = (f'<section id="detail" class="pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w"><h2>{title}</h2>'
               f'<p>{intro}</p><div class="pp-grid">{cards}</div><h3>' + ('A scoped commercial process' if en else 'Un parcours commercial cadré') + f'</h3><p>{method}</p>'
               '<h3>' + ('A relationship built on service' if en else 'Une relation fondée sur le service') + '</h3><p>'
               + ('Track complete and timely deliveries, conformity, invoice accuracy and claims. Set pricing and payment terms explicitly for each offer within the applicable framework.' if en else
                  'Suivre les livraisons complètes et ponctuelles, la conformité, la justesse des factures et les réclamations. Préciser prix et paiement dans chaque offre, selon le cadre applicable.')
               + f'</p><p class="pp-note">{note}</p><div class="pp-actions">'
               + link('/clients' + suffix + '#besoin-client', 'Discuss your requirements' if en else 'Présenter votre besoin')
               + link('/achats' + suffix, 'Supplier registration' if en else 'Référencement fournisseur') + '</div></div></div></section>')
    return replace_node(source, 'detail', content)


def distribution(source, en):
    replacements = ([
        ('Le cash-flow se gagne à la pompe.', 'L’approvisionnement professionnel avant l’extension du réseau'),
        ('La distribution est le poumon financier visé de la société\u00a0: pendant que l’amont construit les barils de demain, le réseau…', 'Une première phase B2B conditionnée aux volumes, aux moyens confirmés et aux encaissements.'),
        ('volumes garantis, cartes de gestion et logistique livrée sur site.', 'volumes planifiés, suivi de consommation et livraison sur site selon les moyens confirmés.'),
        ('Le modèle de lancement d’EnerTchad est donc l’<strong>import de produits finis</strong>, stockés dans trois hubs répartis sur le territoire et livrés à une clientèle professionnelle.', 'Le modèle de lancement envisagé repose sur l’<strong>approvisionnement professionnel en produits finis</strong>, avec stockage et livraison contractualisés selon les besoins qualifiés. Les trois hubs restent un réseau cible, à déployer progressivement selon les volumes, les autorisations et le financement.'),
        ('c’est elle qui doit produire le flux de trésorerie qui finance les suivants', 'son développement dépend de la marge après livraison et des encaissements ; ceux-ci pourront contribuer aux étapes suivantes'),
    ] if not en else [
        ('Cash flow is won at the pump.', 'Professional supply before network expansion'),
        ('guaranteed volumes, management cards and on-site delivered logistics.', 'planned volumes, consumption reporting and on-site delivery subject to confirmed capacity.'),
        ('EnerTchad’s launch model is therefore the <strong>import of finished products</strong>, stored in three hubs spread across the territory and delivered to professional customers.', 'The proposed launch model is <strong>professional finished-product supply</strong>, with contracted storage and delivery aligned with qualified demand. The three hubs remain a target network, to be developed progressively according to volumes, approvals and funding.'),
        ('it must generate the cash flow that funds the next ones', 'its development depends on contribution after delivery and customer collections, which may support subsequent stages'),
    ])
    for old, new in replacements:
        if old != new:
            source = source.replace(old, new)
    title = 'Professional supply before network expansion' if en else 'L’approvisionnement professionnel avant l’extension du réseau'
    intro = ('The proposed first phase targets recurring construction, transport, agro-industry and backup-power requirements in serviceable areas. Engineering and fleet management follow separate scopes.' if en else
             'La première phase envisagée cible les besoins récurrents du BTP, du transport, de l’agro-industrie et de l’énergie de secours dans les zones desservables. L’ingénierie et la gestion des flottes suivent des périmètres distincts.')
    bullets = ([
        'Confirm supply, usable storage and transport capacity before accepting an order.',
        'Assess contribution after delivery, stock financing and customer payment terms for each account.',
        'Extend hubs, partners and mobile units as volumes, collections and approvals justify them.',
        'Retail, LPG and aviation developments remain subject to their own operational prerequisites.',
    ] if en else [
        'Confirmer l’approvisionnement, le stockage utilisable et les moyens de transport avant d’accepter une commande.',
        'Évaluer par compte la contribution après livraison, le financement du stock et les conditions de paiement.',
        'Étendre hubs, partenaires et unités mobiles lorsque volumes, encaissements et autorisations le justifient.',
        'Les développements grand public, GPL et aviation restent soumis à leurs propres prérequis opérationnels.',
    ])
    inner = block('b2b-developpement', title, intro, bullets, [('/clients-en#besoin-client' if en else '/clients#besoin-client', 'Explore the three B2B offers' if en else 'Découvrir les trois offres B2B')])
    return replace_node(source, 'dist-force', f'<section id="dist-force"><div class="pp-wrap">{inner}</div></section>')


def main():
    for en in (False, True):
        suffix = '-en' if en else ''
        for path, transform in [(f'clients{suffix}.html', customers), (f'aval/commercialisation{suffix}.html', commercial), (f'aval/distribution{suffix}.html', distribution)]:
            page = ROOT / path
            old = page.read_text(encoding='utf-8')
            new = transform(old, en)
            if new != old:
                page.write_text(new, encoding='utf-8')
    print('Bilingual B2B offers and procurement pathways aligned.')


if __name__ == '__main__':
    main()
