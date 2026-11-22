#!/usr/bin/env python3
"""QA Engagements du 22 novembre 2026, appliquée aux pages FR et EN (idempotent).

- Double matérialité : le corridor d'export Doba–Kribi est remplacé par l'approvisionnement du marché
  national (doctrine #240 : EnerTchad n'emprunterait pas le pipeline d'export).
- TCFD (dissoute en 2023, reprise dans IFRS S2) remplacée par IFRS S2 · ISSB ; idem sur la page Rapports.
- Tableau des indicateurs : base « 0 % » renouvelables → « Néant — aucun site » ; étiquettes data-label pour la lecture en cartes sur mobile.
- Nouvelle section « Plan environnemental » (étude d'impact, consultation, PGES, suivi), au conditionnel.
- Structure : la grille « Parcourir cette page » double la barre de navigation et part ; numérotation 01 à 10 ;
  la section « Preuve » passe avant l'appel final.
- Petits textes : aucun texte de lecture sous 12 px (seules les étiquettes en capitales le sont, comme ailleurs) ; rien à changer.
"""
import re, sys

def one(s, old, new, f):
    n = s.count(old)
    if n == 0 and (new in s or 'id="et-engagements-qa"' in s or 'IFRS S2 (ISSB)' in s):
        return s
    assert n == 1, (f, old[:80], n)
    return s.replace(old, new)

PLAN = {
'fr': '''<section id="plan-environnemental" class="pp-mist" aria-labelledby="plan-env-t"><div class="pp-wrap"><div class="pp-head" data-vi><p class="pp-k">06 · Plan environnemental</p><h2 id="plan-env-t">Avant chaque chantier, une étude d’impact. Pendant, un plan de gestion.</h2></div><div class="pp-prose pp-prose-w"><p>Aucun ouvrage n’est engagé à ce jour. Pour chacun, EnerTchad suivrait la même séquence : celle que fixe le droit tchadien et qu’attendent les bailleurs. C’est une méthode visée, pas un dispositif en place.</p><div class="pp-grid" data-vi>
<div class="pp-cell"><div>1 · Étudier</div><div>Une étude d’impact environnemental et social par ouvrage, menée selon le décret n° 630/<wbr>PR/<wbr>PM/<wbr>MEERH/<wbr>2010, avant toute décision de construire : état initial de l’eau, de l’air, des sols, de la biodiversité et des usages locaux.</div></div>
<div class="pp-cell"><div>2 · Consulter</div><div>Une consultation publique des populations concernées, dans le cadre de la loi n° 14/PR/98 et de l’arrêté n° 041/<wbr>MERH/<wbr>SG/<wbr>CACETALDE/<wbr>2013, avec une réponse écrite aux observations reçues.</div></div>
<div class="pp-cell"><div>3 · Gérer</div><div>Un plan de gestion environnementale et sociale (PGES) par ouvrage : mesures pour éviter, réduire puis compenser, responsable nommé, budget et calendrier. Il deviendrait le cahier des charges des entreprises intervenantes.</div></div>
<div class="pp-cell"><div>4 · Suivre &amp; publier</div><div>Des indicateurs suivis sur site, une revue annuelle par la direction et des résultats publiés dans le rapport de durabilité, écarts expliqués.</div></div>
</div><div class="pp-k">Ce que le plan couvrirait</div><div class="pp-grid" data-vi>
<div class="pp-cell"><div>Eau</div><div>Prélèvements comptés, eau de production réinjectée ou valorisée, zéro rejet non conforme visé.</div></div>
<div class="pp-cell"><div>Air &amp; climat</div><div>Fin du torchage de routine visée, méthane mesuré, énergie solaire de site.</div></div>
<div class="pp-cell"><div>Sols &amp; déchets</div><div>Hydrocarbures confinés, déchets triés et tracés jusqu’à leur élimination.</div></div>
<div class="pp-cell"><div>Biodiversité</div><div>Zones humides, aires protégées et terres agricoles évitées dès le choix des tracés et des sites.</div></div>
<div class="pp-cell"><div>Urgence</div><div>Plan d’intervention en cas de déversement, moyens prépositionnés et exercices.</div></div>
<div class="pp-cell"><div>Fin de vie</div><div>Plan de réhabilitation établi dès la conception, provision constituée pendant l’exploitation (visé).</div></div>
</div><div>Référentiels visés : <b>décret n° 630/<wbr>PR/<wbr>PM/<wbr>MEERH/<wbr>2010</b> · <b>ISO 14001</b> · <b>Normes de performance de la SFI</b>. Société en constitution : aucune étude d’impact n’a encore été menée.</div></div></div></section>

''',
'en': '''<section id="plan-environnemental" class="pp-mist" aria-labelledby="plan-env-t"><div class="pp-wrap"><div class="pp-head" data-vi><p class="pp-k">06 · Environmental plan</p><h2 id="plan-env-t">Before each project, an impact study. During it, a management plan.</h2></div><div class="pp-prose pp-prose-w"><p>No project has been committed to date. For each one, EnerTchad would follow the same sequence: the one set by Chadian law and expected by lenders. It is a targeted method, not a system in place.</p><div class="pp-grid" data-vi>
<div class="pp-cell"><div>1 · Study</div><div>An environmental and social impact study for each project, carried out under Decree No. 630/<wbr>PR/<wbr>PM/<wbr>MEERH/<wbr>2010, before any decision to build: baseline of water, air, soils, biodiversity and local uses.</div></div>
<div class="pp-cell"><div>2 · Consult</div><div>A public consultation of the people concerned, under Law No. 14/PR/98 and Order No. 041/<wbr>MERH/<wbr>SG/<wbr>CACETALDE/<wbr>2013, with a written answer to the comments received.</div></div>
<div class="pp-cell"><div>3 · Manage</div><div>An environmental and social management plan (ESMP) for each project: measures to avoid, reduce, then offset, a named owner, a budget and a schedule. It would become the specification for the contractors on site.</div></div>
<div class="pp-cell"><div>4 · Monitor &amp; publish</div><div>Indicators tracked on site, an annual management review and results published in the sustainability report, with gaps explained.</div></div>
</div><div class="pp-k">What the plan would cover</div><div class="pp-grid" data-vi>
<div class="pp-cell"><div>Water</div><div>Metered withdrawals, produced water reinjected or reused, zero non-compliant discharge targeted.</div></div>
<div class="pp-cell"><div>Air &amp; climate</div><div>End of routine flaring targeted, methane measured, on-site solar power.</div></div>
<div class="pp-cell"><div>Soils &amp; waste</div><div>Hydrocarbons contained, waste sorted and tracked until disposal.</div></div>
<div class="pp-cell"><div>Biodiversity</div><div>Wetlands, protected areas and farmland avoided from the choice of routes and sites.</div></div>
<div class="pp-cell"><div>Emergencies</div><div>Spill response plan, pre-positioned equipment and drills.</div></div>
<div class="pp-cell"><div>End of life</div><div>Rehabilitation plan drawn up at design stage, provision built up during operation (targeted).</div></div>
</div><div>Standards targeted: <b>Decree No. 630/<wbr>PR/<wbr>PM/<wbr>MEERH/<wbr>2010</b> · <b>ISO 14001</b> · <b>IFC Performance Standards</b>. Company in formation: no impact study has been carried out yet.</div></div></div></section>

'''}

REF = {
'fr': ('<div class="pp-cell"><b>TCFD</b><span>Information financière liée au climat. <strong>Cadre de la note climat.</strong></span></div>',
       '<div class="pp-cell"><b>IFRS S2 · ISSB</b><span>Information financière liée au climat ; reprend les recommandations de l’ancienne TCFD, dissoute en 2023. <strong>Cadre de la note climat.</strong></span></div>\n'
       '<div class="pp-cell"><b>Décret n° 630/2010</b><span>Études d’impact sur l’environnement au Tchad. <strong>Appliqué à chaque ouvrage.</strong></span></div>\n'
       '<div class="pp-cell"><b>Normes de performance SFI</b><span>Cadre environnemental et social attendu des bailleurs. <strong>Visé.</strong></span></div>'),
'en': ('<div class="pp-cell"><b>TCFD</b><span>Climate-related financial disclosure. <strong>Framework of the climate note.</strong></span></div>',
       '<div class="pp-cell"><b>IFRS S2 · ISSB</b><span>Climate-related financial disclosure; takes over the recommendations of the former TCFD, disbanded in 2023. <strong>Framework of the climate note.</strong></span></div>\n'
       '<div class="pp-cell"><b>Decree No. 630/2010</b><span>Environmental impact studies in Chad. <strong>Applied to each project.</strong></span></div>\n'
       '<div class="pp-cell"><b>IFC Performance Standards</b><span>The environmental and social framework lenders expect. <strong>Targeted.</strong></span></div>'),
}

def fix(f, lang):
    s = open(f, encoding='utf-8').read()
    fr = lang == 'fr'
    # 1. corridor
    s = one(s, ('continuité du corridor Doba\u00a0↔\u00a0Kribi' if fr else 'continuity of the Doba ↔ Kribi corridor'),
            'approvisionnement fiable du marché national' if fr else 'reliable supply of the national market', f)
    # 2. TCFD
    s = one(s, *REF[lang], f)
    s = one(s, ('Cadre visé : <b>TCFD</b>' if fr else 'Framework targeted: <b>TCFD</b>'),
            ('Cadre visé : <b>IFRS S2 (ISSB)</b>' if fr else 'Framework targeted: <b>IFRS S2 (ISSB)</b>'), f)
    # 3. table bases
    # base « 100 % (équipe fondatrice) » confirmée par le DG le 22 novembre 2026 : gardée.
    s = one(s, ('<td>Part de renouvelables · énergie de site</td><td>0 %</td>' if fr else '<td>Renewables share · site energy</td><td>0%</td>'),
            ('<td>Part de renouvelables · énergie de site</td><td>Néant — aucun site</td>' if fr else '<td>Renewables share · site energy</td><td>None — no site</td>'), f)
    # data-label on cells
    a = s.find('<section id="indicateurs"'); b = s.find('</table>', a)
    tab = s[a:b]
    heads = re.findall(r'<th>(.*?)</th>', tab)
    assert len(heads) == 6, heads
    def lab(m):
        cells = re.findall(r'<td(?: data-label="[^"]*")?>(.*?)</td>', m.group(1))
        return '<tr>' + ''.join(f'<td data-label="{heads[i]}">{c}</td>' for i, c in enumerate(cells)) + '</tr>'
    tab = re.sub(r'<tr>((?:<td[^>]*>.*?</td>)+)</tr>', lab, tab)
    s = s[:a] + tab + s[b:]
    # 4. drop the duplicate "browse" grid
    s, n = re.subn(r'<section class="pp-mist pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w"><p class="pp-k">(?:Parcourir cette page · 6 thématiques|Browse this page · 6 themes)</p>.*?</section>\n*', '', s, flags=re.S)
    assert n in (0, 1)
    # 5. nav: add environmental plan and indicators
    s = one(s, ('<a href="#esg">Arc E-S-G</a><a href="#rapport">' if fr else '<a href="#esg">The E-S-G arc</a><a href="#rapport">'),
            ('<a href="#esg">Arc E-S-G</a><a href="#plan-environnemental">Plan environnemental</a><a href="#indicateurs">Indicateurs</a><a href="#rapport">' if fr else
             '<a href="#esg">The E-S-G arc</a><a href="#plan-environnemental">Environmental plan</a><a href="#indicateurs">Indicators</a><a href="#rapport">'), f)
    # 6. environmental plan section before the indicator table
    if 'id="plan-environnemental"' not in s:
        s = one(s, '<section id="indicateurs"', PLAN[lang] + '<section id="indicateurs"', f)
    # 7. numbering
    ren = ([('05b · Tableau des indicateurs', '07 · Tableau des indicateurs'), ('05c · Nos référentiels', '08 · Nos référentiels'),
            ('06 · Publications de durabilité', '09 · Publications de durabilité'), ('<p class="pp-k">Gouvernance · Preuve</p>', '<p class="pp-k">10 · Gouvernance · preuve</p>')] if fr else
           [('05b · Indicator table', '07 · Indicator table'), ('05c · Our standards', '08 · Our standards'),
            ('06 · Sustainability publications', '09 · Sustainability publications'), ('<p class="pp-k">Governance · Proof</p>', '<p class="pp-k">10 · Governance · proof</p>')])
    for o, n_ in ren:
        s = one(s, o, n_, f)
    # 8. proof section before the closing call
    aid = 'assurance-esg' if fr else 'esg-assurance'
    m = re.search(r'<section id="%s".*?</section>' % aid, s, re.S)
    proof = m.group(0)
    cta = re.search(r'<section class="pp-mist pp-compact"><div class="pp-wrap"><div class="pp-prose pp-prose-w"><div class="pp-grid" data-vi>\n<div class="pp-cell"><strong>', s)
    if cta.start() < m.start():
        s = s[:m.start()] + s[m.end():]
        s = s[:cta.start()] + proof + '\n\n' + s[cta.start():]
    # 9. page-local style: indicator table as cards on mobile
    css = ('<style id="et-engagements-qa">'
           '@media(max-width:640px){#indicateurs table,#indicateurs tbody,#indicateurs tr,#indicateurs td{display:block;width:auto}'
           '#indicateurs thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}'
           '#indicateurs tr{border:1px solid var(--et-hair-ink,rgba(26,35,48,.16));border-radius:12px;padding:12px 14px;margin:0 0 12px}'
           '#indicateurs td{border:0;padding:4px 0}#indicateurs td:first-child{font-weight:700;padding-bottom:8px}'
           '#indicateurs td:not(:first-child)::before{content:attr(data-label);display:block;font-size:.75rem;letter-spacing:.04em;text-transform:uppercase;opacity:.72}}</style>')
    if 'id="et-engagements-qa"' not in s:
        s = one(s, '</head>', css + '</head>', f)
    open(f, 'w', encoding='utf-8').write(s)
    print(f, 'ok')

def rapports(f, fr):
    s = open(f, encoding='utf-8').read()
    s = one(s, ('cadre visé : TCFD.' if fr else 'framework targeted: TCFD.'), ('cadre visé : IFRS S2 (ISSB).' if fr else 'framework targeted: IFRS S2 (ISSB).'), f)
    open(f, 'w', encoding='utf-8').write(s); print(f, 'ok')

fix('engagements.html', 'fr'); fix('engagements-en.html', 'en')
rapports('rapports.html', True); rapports('rapports-en.html', False)
