#!/usr/bin/env python3
"""Refonte de l'accueil « société pétrolière intégrée » (23 novembre 2026, maquette validée par le DG, logo inchangé).

Ordre : héros pleine largeur illustré (raffinerie) → vision et chiffres clés → quatre métiers en grandes cartes illustrées →
actualités (trois derniers communiqués, lus au build par lib/latest-release.js) → impact et engagements (bande illustrée) →
leadership (monogrammes, aucun portrait publié) → investisseurs et carrières → contact.
Textes et chiffres repris de l'accueil précédent et des pages publiées ; registre conditionnel conservé. Rejouable.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = '/assets/img/p/'


def hero_bg():
    return (f'<img class="et-hero-bg" aria-hidden="true" alt="" src="{IMG}raffinerie-jour-1400.webp" '
            f'srcset="{IMG}raffinerie-jour-800.webp 800w, {IMG}raffinerie-jour-1400.webp 1400w" sizes="100vw" '
            'width="1400" height="934" fetchpriority="high" decoding="async">')


def card(img, w, h, alt, label, title, cible, href, cta):
    return (f'<article class="hm-seg"><img class="et-seg-img" src="{IMG}{img}" width="{w}" height="{h}" loading="lazy" '
            f'decoding="async" alt="{alt}"><div class="hm-seg-body"><p class="hm-seg-k">{label}</p><h3>{title}</h3>'
            f'<p class="hm-cible">{cible}</p><a href="{href}">{cta}</a></div></article>')


T = {
 'fr': dict(
  kicker='EnerTchad · Société pétrolière intégrée · N’Djamena',
  h1='L’énergie du Tchad. <em>Intégrée.</em>', sig='De la roche-mère à la pompe.',
  lead='EnerTchad prépare un programme pétrolier intégré au Tchad : produire, transporter, raffiner, distribuer — d’abord pour le marché national.',
  actions='<a class="et-primary" href="/societe#vision">Découvrir la vision</a><a class="et-secondary" href="/projets#avancement">Projets et avancement</a><a class="et-secondary" href="/boutique/clients#besoin-client">Présenter un besoin professionnel</a>',
  note='Société en constitution. Activités envisagées, sous réserve d’études, d’autorisations, de financements et de partenariats. Illustration : vue d’une raffinerie, hors installations d’EnerTchad. <a href="/avertissements">Statut et limites</a>.',
  v_eyebrow='Vision', v_h2='Construire un groupe énergétique intégré à capitaux tchadiens.',
  v_lead='Le but de l’intégration est simple : que le consommateur tchadien paie ses carburants beaucoup moins cher. EnerTchad vise à approcher la moitié du prix officiel actuel (700 FCFA le litre de super et 800 FCFA le gasoil à N’Djamena, barème en vigueur en 2026), en raffinant au pays du brut tchadien plutôt qu’en important. C’est un objectif, soumis à l’homologation des prix par l’État, porté par une société en constitution qui sert d’abord le marché national et n’exporte rien tant que le pays importe ses carburants.',
  brief_label='EnerTchad en bref',
  brief=[('Capital fondateur · 100 % tchadien', '100 M FCFA'), ('Prix à la pompe visé · rapport au barème officiel 2026', '≈ ½'), ('D’achats locaux visés · horizon 2030', '80 %'), ('Actif en exploitation · société en constitution', '0')],
  v_link='<a href="/societe#vision">La Société et sa vision</a>',
  c_eyebrow='Nos activités · quatre segments', c_h2='Une seule chaîne, de la ressource aux besoins du pays.',
  cards=[('pompe-petrole-800.webp', 800, 534, 'Illustration : pompe à balancier', '01 · Produire', 'Exploration &amp; production', '<b>+8–17 %</b> OOIP visé · récupération assistée', '/amont/', 'Découvrir l’exploration-production'),
         ('pipeline-800.webp', 800, 534, 'Illustration : pipeline et bacs de stockage', '02 · Transporter', 'Transport &amp; stockage', '<b>3</b> hubs-dépôts ciblés · réserve du pays', '/intermediaire/', 'Découvrir le transport'),
         ('raffinerie-jour-800.webp', 800, 534, 'Illustration : colonnes, bacs et torche d’une raffinerie', '03 · Transformer', 'Raffinage &amp; pétrochimie', '<b>2 000 b/j</b> par train de mini-raffinerie · première implantation retenue : Moussoro', '/petrochimie/', 'Découvrir le raffinage et la pétrochimie'),
         ('station-nuit-fig.webp', 700, 466, 'Illustration : station-service de nuit', '04 · Distribuer', 'Distribution', '<b>12</b> stations fixes visées · 23 provinces visées', '/aval/', 'Découvrir la distribution')],
  c_note='Illustrations dessinées, hors installations d’EnerTchad. Les cibles sont des objectifs : aucun actif en exploitation à ce jour. <a href="/cibles-2030">Toutes les cibles, pôle par pôle</a> · <a href="/enerconseils/#ingenierie">Développer : ingénierie &amp; conseil</a>.',
  n_eyebrow='Actualités', n_h2='Communiqués et décisions.', n_all=('/communiques', 'Tous les communiqués'),
  i_eyebrow='Impact &amp; engagements', i_h2='Ce qui doit rester au pays.',
  i_lead='Emploi, contenu local, environnement, territoires : l’avantage visé par EnerTchad ne serait pas le pétrole, mais ce qui en reste au Tchad. Chaque carte dit si la donnée est publiée ou non.',
  impact=[('Emploi', '80 % de personnel tchadien visé : une cible, pas un résultat mesuré. Nombre de postes non publié.', '', 'Cible publiée · non mesurée', True),
          ('Contenu local', '80 % d’achats sourcés au Tchad à l’horizon 2030 : un objectif interne, pas un résultat mesuré.', '<a href="/achats#referencement">Déposer un dossier</a>', 'Cible publiée · non mesurée', True),
          ('Environnement', 'Une étude d’impact avant chaque ouvrage, la fin du torchage de routine visée.', '<a href="/engagements#plan-environnemental">Plan environnemental</a>', 'Méthode publiée · aucun ouvrage engagé', True),
          ('Développement territorial', 'Les implantations visées par les pôles, sur une seule carte.', '<a href="/cibles-2030#carte-operations">Carte des cibles</a>', 'Carte publiée · positions indicatives', True)],
  i_actions='<a href="/projets#impact-pays">Impact et feuille de route</a><a href="/engagements">Engagements</a>',
  l_eyebrow='Leadership', l_h2='Des responsabilités identifiées, avant les actifs.',
  l_lead='Le PCA et le DG ci-dessous sont désignés par les fondateurs, à confirmer par l’assemblée constitutive.',
  leaders=[('TGP', 'Président du Conseil d’administration', 'Théophile Gag Pinabei'), ('BLM', 'Directeur général', 'Bignero Le Madang')],
  l_link=('/leadership', 'Voir la direction et le conseil'),
  l_actions='<a href="/gouvernance">Structure de gouvernance</a><a href="/savoirs">Centre de Connaissances</a>',
  inv_eyebrow='Investisseurs', inv_h2='Un capital levé par paliers, avec des jalons datés.',
  inv_lead='Les objectifs de capital de la société ne représentent pas le besoin total de financement du programme industriel. Les informations publiées sont datées.',
  inv_data=[('Capital fondateur', '100 M FCFA · aujourd’hui'), ('Première levée', 'Visée · court terme'), ('Souscription', 'Aucune souscription ouverte à ce jour')],
  inv_links='<a href="/investisseurs">Thèse, capital et jalons</a><a href="/publications#pub-inv">Documents investisseurs</a><a href="/contact?profil=invest#ctForm">Relations investisseurs</a>',
  car_eyebrow='Carrières', car_h3='Bâtir l’équipe nationale avant le premier baril.',
  car_p='Aucun recrutement ouvert à ce jour : inscrivez-vous pour être prévenu à l’ouverture.',
  car_cta=('/carrieres#alerte-recrutement', 'Être prévenu'), car_more=('/carrieres', 'Métiers et règles de recrutement'),
  ct_eyebrow='Contact', ct_h2='Parlons de votre projet.',
  ct_lead='Industriels, opérateurs, investisseurs, talents ou presse : choisissez votre profil ou écrivez-nous directement.',
  exits=[('/boutique/clients#besoin-client', 'Présenter un besoin professionnel'), ('/contact#ctForm', 'Nous contacter'), ('/contact?profil=invest#ctForm', 'Relations investisseurs'), ('/presse', 'Espace presse')]),
 'en': dict(
  kicker='EnerTchad · Integrated oil company · N’Djamena',
  h1='Chad’s energy. <em>Integrated.</em>', sig='From source rock to the pump.',
  lead='EnerTchad is preparing an integrated oil programme in Chad: produce, transport, refine, distribute — for the national market first.',
  actions='<a class="et-primary" href="/societe-en#vision">Discover the vision</a><a class="et-secondary" href="/projets-en#avancement">Projects and status</a><a class="et-secondary" href="/boutique/en/clients#besoin-client">Discuss a business requirement</a>',
  note='Company in formation. Proposed activities remain conditional on studies, approvals, financing and partnerships. Illustration: view of a refinery, not an EnerTchad facility. <a href="/avertissements-en">Status and limitations</a>.',
  v_eyebrow='Vision', v_h2='Building an integrated energy group with Chadian capital.',
  v_lead='The purpose of integration is simple: Chadian consumers should pay much less for their fuels. EnerTchad aims to approach half of today’s official price (700 FCFA per litre of petrol and 800 FCFA for diesel in N’Djamena, the scale in force in 2026) by refining Chadian crude at home rather than importing. It is a target, subject to price approval by the State, carried by a company in formation that serves the national market first and exports nothing as long as the country imports its fuels.',
  brief_label='EnerTchad at a glance',
  brief=[('Founding capital · 100% Chadian', '100 M FCFA'), ('Targeted pump price · relative to the 2026 official scale', '≈ ½'), ('Local purchasing targeted · by 2030', '80%'), ('Operating assets · company in formation', '0')],
  v_link='<a href="/societe-en#vision">The Company and its vision</a>',
  c_eyebrow='Our activities · four segments', c_h2='One chain, from the resource to the country’s needs.',
  cards=[('pompe-petrole-800.webp', 800, 534, 'Illustration: pumpjack', '01 · Produce', 'Exploration &amp; production', '<b>+8–17%</b> OOIP targeted · enhanced recovery', '/pole-amont-en', 'Explore exploration and production'),
         ('pipeline-800.webp', 800, 534, 'Illustration: pipeline and storage tanks', '02 · Transport', 'Transport &amp; storage', '<b>3</b> targeted depot hubs · the country’s reserve', '/pole-intermediaire-en', 'Explore transport'),
         ('raffinerie-jour-800.webp', 800, 534, 'Illustration: columns, tanks and flare of a refinery', '03 · Transform', 'Refining &amp; petrochemicals', '<b>2,000 b/d</b> per mini-refinery train · first site selected: Moussoro', '/pole-enerchimie-en', 'Explore refining and petrochemicals'),
         ('station-nuit-fig.webp', 700, 466, 'Illustration: service station at night', '04 · Distribute', 'Distribution', '<b>12</b> fixed stations targeted · 23 provinces targeted', '/pole-aval-en', 'Explore distribution')],
  c_note='Drawn illustrations, not EnerTchad facilities. Targets are objectives: no asset in operation to date. <a href="/cibles-2030-en">All targets, pole by pole</a> · <a href="/pole-enerconseils-en#ingenierie">Develop: engineering &amp; advisory</a>.',
  n_eyebrow='News', n_h2='Press releases and decisions.', n_all=('/communiques-en', 'All press releases'),
  i_eyebrow='Impact &amp; commitments', i_h2='What must stay in the country.',
  i_lead='Jobs, local content, environment, territories: the advantage EnerTchad aims for would not be the oil, but what stays in Chad. Each card says whether the data is published.',
  impact=[('Jobs', '80% Chadian staff targeted: a target, not a measured result. Number of positions not published.', '', 'Target published · not measured', True),
          ('Local content', '80% of purchases sourced in Chad by 2030: an internal target, not a measured result.', '<a href="/achats-en#referencement">Submit a file</a>', 'Target published · not measured', True),
          ('Environment', 'An impact study before each project, the end of routine flaring targeted.', '<a href="/engagements-en#plan-environnemental">Environmental plan</a>', 'Method published · no project committed', True),
          ('Territorial development', 'The sites targeted by the poles, on a single map.', '<a href="/cibles-2030-en#carte-operations">Target map</a>', 'Map published · indicative positions', True)],
  i_actions='<a href="/projets-en#impact-pays">Impact and roadmap</a><a href="/engagements-en">Commitments</a>',
  l_eyebrow='Leadership', l_h2='Identified responsibilities, before the assets.',
  l_lead='The Chair and CEO below are designated by the founders, to be confirmed by the constitutive general meeting.',
  leaders=[('TGP', 'Chair of the Board', 'Théophile Gag Pinabei'), ('BLM', 'Chief Executive Officer', 'Bignero Le Madang')],
  l_link=('/leadership-en', 'View leadership and board'),
  l_actions='<a href="/gouvernance-en">Governance structure</a><a href="/savoirs-en">Knowledge Center</a>',
  inv_eyebrow='Investors', inv_h2='Capital raised in stages, with dated milestones.',
  inv_lead='The company’s capital objectives do not represent the total financing need of the industrial programme. Published information is dated.',
  inv_data=[('Founding capital', '100 M FCFA · today'), ('First raise', 'Targeted · short term'), ('Subscription', 'No subscription open to date')],
  inv_links='<a href="/investisseurs-en">Thesis, capital and milestones</a><a href="/publications-en#pub-inv">Investor documents</a><a href="/contact-en?profil=invest#ctForm">Investor relations</a>',
  car_eyebrow='Careers', car_h3='Building the national team before the first barrel.',
  car_p='No recruitment open to date: sign up to be notified when it opens.',
  car_cta=('/carrieres-en#alerte-recrutement', 'Get notified'), car_more=('/carrieres-en', 'Roles and recruitment rules'),
  ct_eyebrow='Contact', ct_h2='Let’s talk about your project.',
  ct_lead='Manufacturers, operators, investors, talent or press: choose your profile or write to us directly.',
  exits=[('/boutique/en/clients#besoin-client', 'Discuss a business requirement'), ('/contact-en#ctForm', 'Contact us'), ('/contact-en?profil=invest#ctForm', 'Investor relations'), ('/presse-en', 'Press area')]),
}


def main_markup(t):
    brief = ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in t['brief'])
    cards = ''.join(card(*c) for c in t['cards'])
    impact = ''.join(f'<li><h3>{h}</h3><p>{p}</p>{a}<p class="hm-flag{" hm-flag-ok" if ok else ""}">{f}</p></li>' for h, p, a, f, ok in t['impact'])
    leaders = ''.join(f'<article class="mod-card"><span class="hm-mono" aria-hidden="true">{m}</span><div><p class="mod-eyebrow">{r}</p><h3>{n}</h3><a href="{t["l_link"][0]}">{t["l_link"][1]}</a></div></article>' for m, r, n in t['leaders'])
    data = ''.join(f'<li><span>{a}</span><b>{b}</b></li>' for a, b in t['inv_data'])
    exits = ''.join(f'<a href="{h}">{l}</a>' for h, l in t['exits'])
    return (
        '<main id="main-content" tabindex="-1" class="et-home hm-review">'
        f'<header class="et-hero" id="top">{hero_bg()}<div class="et-inner"><p class="et-kicker">{t["kicker"]}</p>'
        f'<h1 id="ph-h1">{t["h1"]}</h1><p class="mod-signature">{t["sig"]}</p><p class="et-lead">{t["lead"]}</p>'
        f'<div class="et-actions">{t["actions"]}</div><p class="hm-note">{t["note"]}</p></div></header>'
        f'<section id="vision" class="hm-band" aria-labelledby="vision-title" data-et-reveal><div class="et-inner"><div class="hm-head">'
        f'<div><p class="hm-eyebrow">{t["v_eyebrow"]}</p><h2 id="vision-title">{t["v_h2"]}</h2></div><p class="hm-lead">{t["v_lead"]}</p></div>'
        f'<dl class="hm-brief" aria-label="{t["brief_label"]}">{brief}</dl><div class="et-actions">{t["v_link"]}</div></div></section>'
        f'<section id="chaine" class="hm-band hm-dark" aria-labelledby="ph-chaine" data-et-reveal><div class="et-inner">'
        f'<p class="hm-eyebrow">{t["c_eyebrow"]}</p><h2 id="ph-chaine">{t["c_h2"]}</h2><div class="et-segments">{cards}</div>'
        f'<p class="hm-footnote">{t["c_note"]}</p></div></section>'
        f'<section id="actualites-accueil" class="hm-band" aria-labelledby="actualites-title" data-et-reveal><div class="et-inner"><div class="hm-head">'
        f'<div><p class="hm-eyebrow">{t["n_eyebrow"]}</p><h2 id="actualites-title">{t["n_h2"]}</h2></div>'
        f'<a class="hm-btn" href="{t["n_all"][0]}">{t["n_all"][1]}</a></div><ul class="hm-news" data-et-news></ul></div></section>'
        f'<section id="impact" class="hm-band hm-dark" aria-labelledby="impact-title" data-et-reveal>'
        f'<img class="im-bg" aria-hidden="true" src="{IMG}flamme-gaz-1400.webp" srcset="{IMG}flamme-gaz-800.webp 800w, {IMG}flamme-gaz-1400.webp 1400w" sizes="100vw" width="1400" height="934" loading="lazy" decoding="async" alt="">'
        f'<div class="et-inner"><p class="hm-eyebrow">{t["i_eyebrow"]}</p><h2 id="impact-title">{t["i_h2"]}</h2><p class="hm-lead hm-lead-wide">{t["i_lead"]}</p>'
        f'<ul class="hm-impact">{impact}</ul><div class="et-actions">{t["i_actions"]}</div></div></section>'
        f'<section id="gouvernance-accueil" class="hm-band" aria-labelledby="gouvernance-accueil-title" data-et-reveal><div class="et-inner">'
        f'<p class="hm-eyebrow">{t["l_eyebrow"]}</p><h2 id="gouvernance-accueil-title">{t["l_h2"]}</h2><p class="hm-lead hm-lead-wide">{t["l_lead"]}</p>'
        f'<div class="mod-grid">{leaders}</div><div class="et-actions">{t["l_actions"]}</div></div></section>'
        f'<section id="investisseurs-accueil" class="hm-band" aria-labelledby="investisseurs-accueil-title" data-et-reveal><div class="et-inner hm-duo">'
        f'<div class="hm-inv"><p class="hm-eyebrow">{t["inv_eyebrow"]}</p><h2 id="investisseurs-accueil-title">{t["inv_h2"]}</h2><p class="hm-lead">{t["inv_lead"]}</p>'
        f'<ul class="im-data">{data}</ul><div class="et-inline-links">{t["inv_links"]}</div></div>'
        f'<div class="hm-car" id="carrieres-accueil"><p class="hm-eyebrow">{t["car_eyebrow"]}</p><h3>{t["car_h3"]}</h3><p>{t["car_p"]}</p>'
        f'<a class="hm-btn" href="{t["car_cta"][0]}">{t["car_cta"][1]}</a><a href="{t["car_more"][0]}">{t["car_more"][1]}</a></div></div></section>'
        f'<section id="contact-accueil" class="hm-band hm-dark" aria-labelledby="contact-accueil-title" data-et-reveal><div class="et-inner"><div>'
        f'<p class="hm-eyebrow">{t["ct_eyebrow"]}</p><h2 id="contact-accueil-title">{t["ct_h2"]}</h2><p class="hm-lead">{t["ct_lead"]}</p></div>'
        f'<nav class="hm-exits" aria-labelledby="contact-accueil-title">{exits}</nav></div></section>'
        '</main>')


for name, lang in (('index.html', 'fr'), ('index-en.html', 'en')):
    p = ROOT / name
    s = p.read_text()
    new = main_markup(T[lang])
    s2 = re.sub(r'<main\b.*?</main>', lambda m: new, s, count=1, flags=re.S)
    if s2 != s:
        p.write_text(s2)
    print(name, 'ok' if new in s2 else 'ÉCHEC')
