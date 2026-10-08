# -*- coding: utf-8 -*-
"""Atlas du secteur (enerconseils/atlas.html, atlas-en.html) : lisibilite et coherence des
trois cartes.

Carte A (cadastre interactif) : bassins atteignables au clavier, textes decoratifs
« S A H A R A » caches aux lecteurs d ecran, statut de Sedigui aligne (« en developpement »),
legende de Bongor alignee sur l etiquette, cadrage resserre et textes agrandis sur mobile
(la legende passe alors sous la carte, en HTML).
Carte B (oleoduc Doba-Kribi) : redessinee sur le trace existant ; etiquettes hors du trace,
station de reduction de pression de Kribi et FSO a 12 km au large ajoutes (source : COTCO),
fiche technique et legende sorties du dessin en HTML ; sur mobile, la carte garde une largeur
lisible et defile horizontalement.
Carte C (cadastre 2025) : agrandie, liste des blocs et concessions accessible au clavier et
au toucher (surlignage du bloc), info-bulle aussi au toucher, legende des pipelines,
« en cours de changement » en violet pour le distinguer des blocs attribues, filtre
« Concessions 13 » (13 contours traces) au lieu de « Production 32 », 2 parcelles libres sans
nom signalees, Sedigui « en developpement ».
Tableaux et textes de la page : Sedigui « en developpement » partout (source : SHT et Etat,
premiere phase visee 2 000 b/j et 300 000 m3/j de gaz, pipeline Sedigui-Djermaya de 331 km
construit, pas encore en service).
Idempotent (marqueur id="atl-maps-fix").
Usage : python3 scripts/fix_atlas_maps.py
"""
import html as H
import re

FILES = {'enerconseils/atlas.html': 'fr', 'enerconseils/atlas-en.html': 'en'}
MARK = 'id="atl-maps-fix"'

T = {
    'fr': {
        'zones': {'doba': 'Bassin de Doba', 'bongor': 'Bassin de Bongor', 'lac': 'Bassin du Lac Tchad'},
        'subst': [
            # carte A : etiquettes et legende
            ('y="275">Exploration</text>', 'y="275">En développement</text>', 1),
            ('<text class="atc-lgs" x="301" y="170">Production · léger</text>', '<text class="atc-lgs" x="301" y="170">Production</text>', 1),
            ('<text class="atc-lgs" x="301" y="202">Exploration</text>', '<text class="atc-lgs" x="301" y="202">En développement</text>', 1),
            ('"d": "Domaine d’exploration ancien (champ de Sédigui). Potentiel restant à confirmer (information sectorielle).", "st": "Exploration"}',
             '"d": "Bassin d’exploration ancien. Le champ de Sédigui y est en développement : première phase visée de 2 000 b/j de brut et 300 000 m³/j de gaz ; pipeline Sédigui–Djermaya (331 km) construit, pas encore en service (information sectorielle).", "st": "En développement", "c": "Dev"}', 1),
            ('"d": "Champ pétrolier (exploration) du bassin du Lac Tchad. Repère sectoriel public.", "st": "Exploration"}',
             '"d": "Champ découvert du bassin du Lac Tchad, en développement par la SHT (brut et gaz) ; travaux en retard selon l’État en 2020. Repère sectoriel public.", "st": "En développement", "c": "Dev"}', 1),
            ('id="atc-pt">3 bassins sédimentaires', 'id="atc-pt">3 bassins mis en valeur', 1),
            ('Doba (cœur de production), Bongor (brut léger) et le Lac Tchad (exploration). Sélectionnez un repère sur la carte.',
             'Doba (cœur de production), Bongor (brut léger) et le Lac Tchad (champ de Sédigui, en développement). D’autres bassins restent à explorer. Sélectionnez un repère sur la carte.', 1),
            ('<b>3</b><span>bassins sédimentaires (Doba · Bongor · Lac Tchad)</span>',
             '<b>3</b><span>bassins mis en valeur (Doba · Bongor · Lac Tchad) ; d’autres restent à explorer</span>', 1),
            # tableaux et textes
            ('<span style="color:var(--gold-l);font-weight:600">Découvert</span></td><td class="qx3_9">Sédigui ~150 Mb — inexploité</td>',
             '<span style="color:var(--gold-l);font-weight:600">En développement</span></td><td class="qx3_9">Sédigui ~150 Mb — mise en production en cours ; pipeline vers Djermaya pas encore en service</td>', 1),
            ('Doba produit ; Sédigui (~150 Mb) attend ;', 'Doba produit ; Sédigui (~150 Mb) est en développement ;', 1),
            ('<td><strong>Sédigui</strong></td><td>zone du Lac Tchad</td><td>Gaz (projet)</td>',
             '<td><strong>Sédigui</strong></td><td>zone du Lac Tchad</td><td>En développement (brut et gaz)</td>', 1),
            # carte C
            ('<title>Champs Sédigui · concession active · en production</title>', '<title>Champ Sédigui · concession active · en développement</title>', 1),
            ('<i aria-hidden="true"></i>Production <b>32</b></button>', '<i aria-hidden="true"></i>Concessions <b>13</b></button>', 1),
            ('<b>38</b> libres · ouverts</span>', '<b>38</b> libres · ouverts (+ 2 parcelles sans nom)</span>', 1),
            ('<b>32</b> champs en concession active</span>', '<b>13</b> concessions actives · 32 champs</span>', 1),
            ('et 32 champs en concession active (Bongor, Doba, Sédigui)', 'et 13 concessions actives regroupant 32 champs (Bongor, Doba, Lac Tchad)', 1),
        ],
        'legend_a': [('doba', 'Doba', 'Production · 2003'), ('bongor', 'Bongor', 'Production'),
                     ('lac', 'Lac Tchad', 'En développement'), ('cap', 'N’Djamena', 'capitale'),
                     ('field', 'Champ pétrolier', '')],
        'legend_a_label': 'Légende de la carte',
        'pipes': [('l-exp', 'Oléoduc d’export Komé → Kribi'), ('l-op', 'Pipeline en exploitation · Bongor → Djermaya'),
                  ('l-idle', 'Pipeline construit, pas en service · Sédigui → Djermaya'), ('l-proj', 'Pipeline en projet'),
                  ('sq', 'Raffinerie de Djermaya')],
        'list_sum': 'Liste des blocs et concessions',
        'list_hint': 'Sélectionnez un nom pour le repérer sur la carte.',
        'groups': [('b-att', 'Attribués · sous licence'), ('b-lib', 'Libres · ouverts à l’attribution'),
                   ('b-chg', 'En cours de changement'), ('b-con', 'Concessions actives')],
        'noname_lib': 'Parcelle libre sans nom', 'noname_con': 'Concession sans nom',
        'fields_prefix': 'Champs ', 'field_prefix': 'Champ ',
        # carte B
        'b': {
            'aria': 'Carte de l’oléoduc d’export Doba–Kribi (TOTCO–COTCO), 1 070 km : champs de Doba, stations de pompage de Komé, Dompta et Belabo, station de réduction de pression de Kribi et terminal flottant au large',
            'tchad': 'TCHAD', 'cameroun': 'CAMEROUN', 'border': 'Frontière',
            'kmT': '~170 km au Tchad', 'kmC': '~900 km au Cameroun',
            'doba': 'Doba · Komé', 'doba_s': 'Champs & collecte', 'ps': 'Station de pompage',
            'kribi': 'Kribi', 'kribi_s1': 'Station de réduction de pression', 'kribi_s2': 'FSO Komé–Kribi 1 · 12 km au large',
            'spec_title': 'Doba → Kribi',
            'spec': [('Longueur', '1 070 km'), ('Tronçon Tchad', '~170 km'), ('Diamètre', '30" (762 mm)'),
                     ('Capacité', '~225 kb/j'), ('Mise en service', '2003'), ('Exploitants', 'TOTCO · COTCO')],
            'key': [('Tchad', 'dot-t'), ('Cameroun', 'dot-c'), ('Oléoduc', 'line'), ('Station', 'node')],
            'region': 'Carte de l’oléoduc, défilement horizontal',
            'hint': 'Faites glisser la carte horizontalement pour suivre tout le tracé, de Doba à Kribi.',
            'src': 'Stations et terminal : COTCO, système de transport camerounais.',
            'cap_fix': None,
        },
    },
    'en': {
        'zones': {'doba': 'Doba basin', 'bongor': 'Bongor basin', 'lac': 'Lake Chad basin'},
        'subst': [
            ('y="275">Exploration</text>', 'y="275">In development</text>', 1),
            ('<text class="atc-lgs" x="301" y="170">Production · light</text>', '<text class="atc-lgs" x="301" y="170">Production</text>', 1),
            ('<text class="atc-lgs" x="301" y="202">Exploration</text>', '<text class="atc-lgs" x="301" y="202">In development</text>', 1),
            ('"d": "Long-standing exploration area (Sédigui field). Remaining potential to be confirmed (sector information).", "st": "Exploration"}',
             '"d": "Long-standing exploration basin. The Sédigui field is in development there: a first phase targeting 2,000 b/d of crude and 300,000 m³/d of gas; the 331 km Sédigui–Djermaya pipeline is built but not yet in service (sector information).", "st": "In development", "c": "Dev"}', 1),
            ('"d": "Oil field (exploration) in the Lake Chad basin. Public sector landmark.", "st": "Exploration"}',
             '"d": "Discovered field in the Lake Chad basin, being developed by SHT (crude and gas); works behind schedule according to the State in 2020. Public sector landmark.", "st": "In development", "c": "Dev"}', 1),
            ('id="atc-pt">3 sedimentary basins', 'id="atc-pt">3 basins in use', 1),
            ('Doba (production heartland), Bongor (light crude) and Lake Chad (exploration). Select a landmark on the map.',
             'Doba (production heartland), Bongor (light crude) and Lake Chad (Sédigui field, in development). Other basins remain to be explored. Select a landmark on the map.', 1),
            ('<b>3</b><span>sedimentary basins (Doba · Bongor · Lake Chad)</span>',
             '<b>3</b><span>basins in use (Doba · Bongor · Lake Chad); others remain to be explored</span>', 1),
            ('<span style="color:var(--gold-l);font-weight:600">Discovered</span></td><td class="qx3_9">Sédigui ~150 Mb — undeveloped</td>',
             '<span style="color:var(--gold-l);font-weight:600">In development</span></td><td class="qx3_9">Sédigui ~150 Mb — being brought on stream; pipeline to Djermaya not yet in service</td>', 1),
            ('Doba produces; Sédigui (~150 Mb) waits;', 'Doba produces; Sédigui (~150 Mb) is in development;', 1),
            ('<td><strong>Sédigui</strong></td><td>Lake Chad area</td><td>Gas (project)</td>',
             '<td><strong>Sédigui</strong></td><td>Lake Chad area</td><td>In development (crude and gas)</td>', 1),
            ('<title>Fields Sédigui · active concession · in production</title>', '<title>Sédigui field · active concession · in development</title>', 1),
            ('<i aria-hidden="true"></i>Production <b>32</b></button>', '<i aria-hidden="true"></i>Concessions <b>13</b></button>', 1),
            ('<b>38</b> open · available</span>', '<b>38</b> open · available (+ 2 unnamed parcels)</span>', 1),
            ('<b>32</b> fields under active concession</span>', '<b>13</b> active concessions · 32 fields</span>', 1),
            ('and 32 fields under active concession (Bongor, Doba, Sédigui)', 'and 13 active concessions covering 32 fields (Bongor, Doba, Lake Chad)', 1),
            ('<span style="color:#fff;font-weight:600">Oléoduc Doba–Kribi</span>', '<span style="color:#fff;font-weight:600">Doba–Kribi pipeline</span>', 1),
        ],
        'legend_a': [('doba', 'Doba', 'Production · 2003'), ('bongor', 'Bongor', 'Production'),
                     ('lac', 'Lake Chad', 'In development'), ('cap', 'N’Djamena', 'capital'),
                     ('field', 'Oil field', '')],
        'legend_a_label': 'Map key',
        'pipes': [('l-exp', 'Komé → Kribi export pipeline'), ('l-op', 'Operating pipeline · Bongor → Djermaya'),
                  ('l-idle', 'Built, not in service · Sédigui → Djermaya'), ('l-proj', 'Planned pipeline'),
                  ('sq', 'Djermaya refinery')],
        'list_sum': 'List of blocks and concessions',
        'list_hint': 'Select a name to locate it on the map.',
        'groups': [('b-att', 'Awarded · under licence'), ('b-lib', 'Open · available for award'),
                   ('b-chg', 'Operator change under way'), ('b-con', 'Active concessions')],
        'noname_lib': 'Unnamed open parcel', 'noname_con': 'Unnamed concession',
        'fields_prefix': 'Fields ', 'field_prefix': '',
        'b': {
            'aria': 'Map of the Doba–Kribi export pipeline (TOTCO–COTCO), 1,070 km: Doba fields, Komé, Dompta and Belabo pumping stations, Kribi pressure-reduction station and offshore floating terminal',
            'tchad': 'CHAD', 'cameroun': 'CAMEROON', 'border': 'Border',
            'kmT': '~170 km in Chad', 'kmC': '~900 km in Cameroon',
            'doba': 'Doba · Komé', 'doba_s': 'Fields & gathering', 'ps': 'Pumping station',
            'kribi': 'Kribi', 'kribi_s1': 'Pressure-reduction station', 'kribi_s2': 'Komé–Kribi 1 FSO · 12 km offshore',
            'spec_title': 'Doba → Kribi',
            'spec': [('Length', '1,070 km'), ('Chad section', '~170 km'), ('Diameter', '30" (762 mm)'),
                     ('Capacity', '~225 kb/d'), ('Commissioned', '2003'), ('Operators', 'TOTCO · COTCO')],
            'key': [('Chad', 'dot-t'), ('Cameroon', 'dot-c'), ('Pipeline', 'line'), ('Station', 'node')],
            'region': 'Pipeline map, horizontal scrolling',
            'hint': 'Swipe the map sideways to follow the whole route, from Doba to Kribi.',
            'src': 'Stations and terminal: COTCO, Cameroon transportation system.',
        },
    },
}

ROUTE = 'M850,150 C785,180 750,208 700,238 C638,278 598,322 528,350 C452,380 398,410 328,432 C258,452 208,462 138,470'
TXT = 'fill="rgba(245,247,250,.86)" font-family="var(--fm)" paint-order="stroke" stroke="rgba(6,11,20,.85)" stroke-linejoin="round" stroke-width="3.4"'


def node(x, y, col, big):
    r1, r2, r3 = (22, 10, 5.5) if big else (15, 8, 4)
    s = (f'<circle cx="{x}" cy="{y}" fill="{col}" filter="url(#ppNode)" opacity=".18" r="{r1}"></circle>'
         f'<circle cx="{x}" cy="{y}" fill="none" opacity=".55" r="{r2}" stroke="{col}" stroke-width="2"></circle>'
         f'<circle cx="{x}" cy="{y}" fill="{col}" r="{r3}"></circle>')
    if big:
        s += f'<circle cx="{x}" cy="{y}" fill="#fff" r="2"></circle>'
    return s


def name(x, y, t, col, size, anchor='start'):
    return (f'<text fill="{col}" font-family="var(--fd)" font-size="{size}" font-weight="800" paint-order="stroke" '
            f'stroke="rgba(6,11,20,.85)" stroke-linejoin="round" stroke-width="3.4" text-anchor="{anchor}" x="{x}" y="{y}">{H.escape(t, False)}</text>')


def sub(x, y, t, anchor='start', size=14):
    return f'<text {TXT} font-size="{size}" text-anchor="{anchor}" x="{x}" y="{y}">{H.escape(t, False)}</text>'


def map_b(L):
    b = T[L]['b']
    B, G = '#5AA7F0', '#34D399'
    svg = (f'<svg aria-label="{H.escape(b["aria"])}" class="ppmap-svg" role="img" viewBox="78 70 872 490">'
           '<defs><linearGradient id="ppGrad" x1="1" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5AA7F0"></stop><stop offset="1" stop-color="#34D399"></stop></linearGradient>'
           '<filter height="180%" id="ppGlow" width="180%" x="-40%" y="-40%"><feGaussianBlur result="b" stdDeviation="5"></feGaussianBlur><feMerge><feMergeNode in="b"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>'
           '<filter height="340%" id="ppNode" width="340%" x="-120%" y="-120%"><feGaussianBlur stdDeviation="6"></feGaussianBlur></filter></defs>'
           '<g aria-hidden="true">'
           '<path d="M880,95 L530,80 L440,170 L460,300 L640,430 L850,400 L920,250 Z" fill="rgba(90,167,240,.05)" stroke="rgba(90,167,240,.16)" stroke-dasharray="5 7" stroke-width="1.2"></path>'
           '<path d="M570,330 L360,300 L180,360 L160,470 L300,545 L530,540 L600,440 Z" fill="rgba(52,211,153,.045)" stroke="rgba(52,211,153,.16)" stroke-dasharray="5 7" stroke-width="1.2"></path>'
           f'<text fill="rgba(90,167,240,.22)" font-family="var(--fd)" font-size="30" font-weight="800" letter-spacing="6" text-anchor="middle" x="790" y="400">{b["tchad"]}</text>'
           f'<text fill="rgba(52,211,153,.22)" font-family="var(--fd)" font-size="30" font-weight="800" letter-spacing="6" text-anchor="middle" x="480" y="540">{b["cameroun"]}</text>'
           '<line stroke="rgba(255,255,255,.18)" stroke-dasharray="4 6" stroke-width="1" x1="608" x2="570" y1="250" y2="430"></line>'
           f'<text fill="rgba(255,255,255,.5)" font-family="var(--fm)" font-size="13" text-anchor="middle" x="566" y="450">{b["border"]}</text>'
           '</g>'
           f'<path d="{ROUTE}" fill="none" filter="url(#ppGlow)" opacity=".25" stroke="url(#ppGrad)" stroke-linecap="round" stroke-width="9"></path>'
           f'<path d="{ROUTE}" fill="none" stroke="url(#ppGrad)" stroke-linecap="round" stroke-width="3.4"></path>'
           f'<path class="ppflow" d="{ROUTE}" fill="none" opacity=".9" stroke="#dff1ff" stroke-dasharray="2 26" stroke-linecap="round" stroke-width="2"></path>'
           # terminal en mer : 12 km au large de Kribi
           '<path d="M138,470 L104,486" fill="none" stroke="#34D399" stroke-dasharray="3 4" stroke-width="2"></path>'
           '<rect fill="#34D399" height="9" rx="1.5" stroke="rgba(6,11,20,.85)" stroke-width="1" width="9" x="96" y="481"></rect>'
           + node(850, 150, B, True) + node(700, 238, B, False) + node(528, 350, G, False) + node(328, 432, G, False) + node(138, 470, G, True)
           + name(850, 120, b['doba'], B, 19, 'middle') + sub(850, 138, b['doba_s'], 'middle')
           + name(716, 264, 'Komé PS1', B, 16) + sub(716, 282, b['ps'])
           + name(544, 376, 'Dompta PS2', G, 16) + sub(544, 394, b['ps'])
           + name(344, 458, 'Belabo PS3', G, 16) + sub(344, 476, b['ps'])
           + name(140, 446, b['kribi'], G, 19, 'middle') + sub(112, 503, b['kribi_s1'], size=13) + sub(112, 520, b['kribi_s2'], size=13)
           + sub(612, 232, b['kmT'], 'middle', 14) + sub(400, 356, b['kmC'], 'middle', 14)
           + '</svg>')
    spec = ''.join(f'<div><dt>{H.escape(k, False)}</dt><dd>{H.escape(v, False)}</dd></div>' for k, v in b['spec'])
    key = ''.join(f'<li><i class="k-{c}" aria-hidden="true"></i>{H.escape(t, False)}</li>' for t, c in b['key'])
    return (f'<div class="ppmap-scroll" role="region" tabindex="0" aria-label="{H.escape(b["region"])}">{svg}</div>'
            f'<p class="ppmap-hint">{H.escape(b["hint"], False)}</p>'
            f'<div class="ppmap-spec"><p class="ppmap-st">{H.escape(b["spec_title"], False)}</p><dl>{spec}</dl>'
            f'<ul class="ppmap-key">{key}</ul><p class="ppmap-src">{H.escape(b["src"], False)}</p></div>')


def legend_a(L):
    items = []
    for k, t, s in T[L]['legend_a']:
        items.append(f'<li><i class="ak-{k}" aria-hidden="true"></i><b>{H.escape(t, False)}</b>'
                     + (f' <span>{H.escape(s, False)}</span>' if s else '') + '</li>')
    return f'<ul class="atc-legend" aria-label="{H.escape(T[L]["legend_a_label"])}">' + ''.join(items) + '</ul>'


def block_list(L, body):
    t = T[L]
    blk = re.compile(r'<path class="cdm-blk (b-\w+)"([^>]*)>(?:<title>([^<]*)</title>)?</path>')
    groups = {g: [] for g, _ in t['groups']}
    out, i = [], 0
    pos = 0
    for m in blk.finditer(body):
        k, attrs, title = m.group(1), m.group(2), m.group(3) or ''
        out.append(body[pos:m.start()])
        out.append(f'<path class="cdm-blk {k}" data-i="{i}"{attrs}>' + (f'<title>{title}</title>' if title else '') + '</path>')
        pos = m.end()
        nm = H.unescape(title.split(' · ')[0]).strip()
        if k == 'b-con':
            if 'concession' in nm.lower():
                nm = t['noname_con']
            for p in (t['fields_prefix'], 'Champ ', 'Champs '):
                if p and nm.startswith(p):
                    nm = nm[len(p):]
        if k == 'b-lib' and ('sans nom' in nm or 'nnamed' in nm.lower()):
            nm = t['noname_lib']
        groups[k].append((nm, i))
        i += 1
    out.append(body[pos:])
    body = ''.join(out)
    secs = []
    for g, label in t['groups']:
        items = sorted(groups[g], key=lambda x: x[0].lower())
        lis = ''.join(f'<li><button type="button" data-i="{n}">{H.escape(nm, False)}</button></li>' for nm, n in items)
        secs.append(f'<div class="cdm-g cdm-g-{g[2:]}"><p class="cdm-gh"><i aria-hidden="true"></i>{H.escape(label, False)} <b>{len(items)}</b></p><ul>{lis}</ul></div>')
    lst = (f'<details class="cdm-list"><summary>{H.escape(t["list_sum"], False)} <b>{i}</b></summary>'
           f'<p class="cdm-lh">{H.escape(t["list_hint"], False)}</p><div class="cdm-groups">' + ''.join(secs)
           + '</div><p class="cdm-out" aria-live="polite"></p></details>')
    return body, lst


CSS = r'''
/* Carte A : bassins au clavier, badge « en developpement », mobile lisible */
.atc-zone:focus{outline:none}
.atc-zone:focus-visible{opacity:1;stroke-width:2.6;filter:drop-shadow(0 0 7px var(--zc))}html.et-plight .atc-zone:focus-visible,html.et-jlight .atc-zone:focus-visible{opacity:1;stroke-width:3;stroke:#1a2330}html.et-plight .atc-field:focus-visible .atc-fp,html.et-jlight .atc-field:focus-visible .atc-fp{stroke:#1a2330}
.atc-badge.Dev{color:var(--blue-l,#5AA7F0);border-color:rgba(90,167,240,.45);background:rgba(90,167,240,.08)}
html.et-plight .atc-badge.Production,html.et-jlight .atc-badge.Production{color:#0B6B49;border-color:rgba(11,107,73,.4);background:rgba(11,107,73,.06)}
html.et-plight .atc-badge.Dev,html.et-jlight .atc-badge.Dev{color:#1C63B4;border-color:rgba(28,99,180,.4);background:rgba(28,99,180,.06)}
html.et-plight .atc-badge.Exploration,html.et-jlight .atc-badge.Exploration{color:#7A5A12;border-color:rgba(122,90,18,.4);background:rgba(122,90,18,.06)}
.atc-legend{display:none;list-style:none;margin:12px 4px 2px;padding:0;gap:8px 16px;flex-wrap:wrap;font-family:var(--fm);font-size:.78rem;line-height:1.35}
.atc-legend li{display:inline-flex;align-items:center;gap:7px}
.atc-legend b{font-weight:700}
.atc-legend span{opacity:.72}
.atc-legend i{width:10px;height:10px;border-radius:50%;flex:none}
.atc-legend .ak-doba{background:var(--gold-l,#E8C36A)}.atc-legend .ak-bongor{background:var(--blue-l,#5AA7F0)}.atc-legend .ak-lac{background:#34D399}
.atc-legend .ak-cap{background:currentColor;border-radius:1px;transform:rotate(45deg);width:8px;height:8px}
.atc-legend .ak-field{width:7px;height:7px;background:currentColor;opacity:.8}
html.et-plight .atc-legend .ak-doba,html.et-jlight .atc-legend .ak-doba{background:#8A6412}
html.et-plight .atc-legend .ak-bongor,html.et-jlight .atc-legend .ak-bongor{background:#1C63B4}
html.et-plight .atc-legend .ak-lac,html.et-jlight .atc-legend .ak-lac{background:#0B6B49}
@media (max-width:700px){
.atc-map .atc-key{display:none}
.atc-legend{display:flex}
.atc-zlab{font-size:11px}
.atc-zsub{font-size:8.6px}
.atc-flab{font-size:9.6px}
.atc-caplab,.atc-corrlab{font-size:9.6px}
}
/* Carte B : fiche technique et legende en HTML, defilement sur mobile */
.ppmap:not(#_):not(#__):not(#___) .ppmap-scroll{overflow-x:auto !important;overflow-y:hidden !important;-webkit-overflow-scrolling:touch !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-scroll:focus-visible{outline:2px solid #E8C36A !important;outline-offset:-2px !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-hint{display:none !important;margin:0 !important;padding:8px 16px 0 !important;font-family:var(--fm) !important;font-size:.75rem !important;color:rgba(232,238,246,.78) !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-spec{display:grid !important;grid-template-columns:auto 1fr !important;gap:12px 22px !important;align-items:start !important;padding:14px 16px 16px !important;border-top:1px solid rgba(255,255,255,.1) !important;color:rgba(232,238,246,.86) !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-st{grid-column:1/-1 !important;margin:0 !important;font-family:var(--fd) !important;font-weight:800 !important;font-size:1rem !important;letter-spacing:.04em !important;color:#5AA7F0 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-spec dl{grid-column:1/-1 !important;display:grid !important;grid-template-columns:repeat(auto-fit,minmax(140px,1fr)) !important;gap:10px 18px !important;margin:0 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-spec dt{font-family:var(--fm) !important;font-size:.72rem !important;letter-spacing:.04em !important;color:rgba(232,238,246,.74) !important;margin:0 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-spec dd{font-family:var(--fm) !important;font-size:.9rem !important;font-weight:700 !important;color:#fff !important;margin:2px 0 0 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key{grid-column:1/-1 !important;display:flex !important;flex-wrap:wrap !important;gap:8px 18px !important;list-style:none !important;margin:0 !important;padding:0 !important;font-family:var(--fm) !important;font-size:.78rem !important;color:rgba(232,238,246,.86) !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key li{color:rgba(232,238,246,.88) !important;display:inline-flex !important;align-items:center !important;gap:8px !important;margin:0 !important;padding:0 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key li::before{content:none !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key i{display:inline-block !important;flex:none !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key .k-dot-t,.ppmap:not(#_):not(#__):not(#___) .ppmap-key .k-dot-c{width:11px !important;height:11px !important;border-radius:50% !important;background:#5AA7F0 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key .k-dot-c{background:#34D399 !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key .k-line{width:22px !important;height:3px !important;border-radius:2px !important;background:linear-gradient(90deg,#5AA7F0,#34D399) !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-key .k-node{width:9px !important;height:9px !important;border-radius:50% !important;background:#fff !important;box-shadow:0 0 0 3px rgba(90,167,240,.45) !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-src{grid-column:1/-1 !important;margin:0 !important;font-family:var(--fm) !important;font-size:.72rem !important;color:rgba(232,238,246,.7) !important}
@media (max-width:700px){
.ppmap:not(#_):not(#__):not(#___) .ppmap-svg{min-width:700px !important}
.ppmap:not(#_):not(#__):not(#___) .ppmap-hint{display:block !important}
}
/* Carte C : plus grande, liste des blocs, legende des pipelines */
.cdm-wrap:not(#_){max-width:100%}
#cadmap:not(#_){max-width:720px}
#cadmap .cdm-blk.hl{stroke:#fff;stroke-width:2.4;filter:drop-shadow(0 0 6px rgba(255,255,255,.75))}
html.et-plight #cadmap .cdm-blk.hl,html.et-jlight #cadmap .cdm-blk.hl{stroke:#10161F}
.cdm-legend .cdm-ln{width:20px;height:0;border-top:2px solid rgba(245,247,250,.55);flex:none}
.cdm-legend .cdm-ln.l-exp{border-top:3px solid #2E86DE}
.cdm-legend .cdm-ln.l-idle{border-top-color:rgba(245,247,250,.3)}
.cdm-legend .cdm-ln.l-proj{border-top:2px dashed rgba(245,247,250,.55)}
.cdm-legend .cdm-sq{width:9px;height:9px;background:#E8C36A;border:1px solid rgba(7,12,21,.8);flex:none}
html.et-plight .cdm-legend .cdm-ln,html.et-jlight .cdm-legend .cdm-ln{border-top-color:rgba(16,24,36,.55)}
html.et-plight .cdm-legend .cdm-ln.l-exp,html.et-jlight .cdm-legend .cdm-ln.l-exp{border-top-color:#2E86DE}
html.et-plight .cdm-legend .cdm-ln.l-idle,html.et-jlight .cdm-legend .cdm-ln.l-idle{border-top-color:rgba(16,24,36,.32)}
.cdm-list{margin:4px 0 22px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:14px;padding:0 16px}
.cdm-list summary{cursor:pointer;padding:13px 0;font-family:var(--fm);font-size:.82rem;font-weight:700}
.cdm-list summary b{opacity:.7}
.cdm-lh{margin:0 0 10px;font-size:.84rem;opacity:.8}
.cdm-groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px 22px;padding-bottom:6px}
.cdm-gh{display:flex;align-items:center;gap:8px;margin:0 0 8px;font-family:var(--fm);font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;font-weight:700}
.cdm-gh i{width:12px;height:10px;border-radius:3px;flex:none}
.cdm-g-att .cdm-gh i{background:rgba(232,195,106,.5);border:1px solid #E8C36A}
.cdm-g-lib .cdm-gh i{background:rgba(90,167,240,.14);border:1px dashed rgba(90,167,240,.7)}
.cdm-g-chg .cdm-gh i{background:rgba(180,140,242,.4);border:1px solid #B48CF2}
.cdm-g-con .cdm-gh i{background:rgba(52,211,153,.5);border:1px solid #34D399}
.cdm-g ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.cdm-g li{margin:0;padding:0}
.cdm-g li::before{content:none}
.cdm-g button{appearance:none;font:inherit;font-family:var(--fm);font-size:.74rem;line-height:1.3;text-align:left;color:inherit;background:transparent;border:1px solid color-mix(in srgb,currentColor 24%,transparent);border-radius:8px;padding:6px 9px;min-height:32px;cursor:pointer}
.cdm-g button:hover{border-color:color-mix(in srgb,currentColor 55%,transparent)}
.cdm-g button[aria-pressed="true"]{border-color:currentColor;background:color-mix(in srgb,currentColor 10%,transparent)}
.cdm-g button:focus-visible{outline:2px solid #D9A84F;outline-offset:2px}
.cdm-out{margin:6px 0 14px;font-family:var(--fm);font-size:.8rem;min-height:1.2em}
@media (max-width:700px){#cadmap .cdm-bl,#cadmap .cdm-foot{display:none}#cadmap .cdm-bs{font-size:13px}#cadmap .cdm-nlab{font-size:12px}.cdm-legend .cdm-lg{white-space:normal}}
'''

JS = r'''(function(){
var sv=document.querySelector('#atc-map .atc-svg');
if(sv&&window.matchMedia){var mq=matchMedia('(max-width:700px)');var vb=function(){sv.setAttribute('viewBox',mq.matches?'0 14 288 440':'0 0 400 460')};vb();if(mq.addEventListener)mq.addEventListener('change',vb);else if(mq.addListener)mq.addListener(vb)}
requestAnimationFrame(function(){var ps=document.querySelector('.ppmap-scroll');if(ps&&ps.scrollWidth>ps.clientWidth)ps.scrollLeft=ps.scrollWidth});
var f=document.querySelector('.cdm-frame'),cm=document.getElementById('cadmap');if(!f||!cm)return;
var tip=f.querySelector('.cdm-tip');
function show(t,x,y){var ti=t.querySelector('title');if(!tip||!ti)return;var p=ti.textContent.split(' · ');tip.querySelector('b').textContent=p.shift();tip.querySelector('span').textContent=p.join(' · ');
var r=f.getBoundingClientRect();x=x-r.left+14;y=y-r.top+10;if(x>r.width-190)x=x-204;if(y>r.height-70)y=y-74;tip.style.left=Math.max(6,x)+'px';tip.style.top=Math.max(6,y)+'px';tip.classList.add('on')}
cm.addEventListener('click',function(e){var t=e.target.closest('.cdm-blk');if(t)show(t,e.clientX,e.clientY)});
var lst=document.querySelector('.cdm-list'),out=lst&&lst.querySelector('.cdm-out');
if(lst)lst.addEventListener('click',function(e){var b=e.target.closest('button[data-i]');if(!b)return;var i=b.getAttribute('data-i');
lst.querySelectorAll('button[aria-pressed]').forEach(function(x){x.removeAttribute('aria-pressed')});
cm.querySelectorAll('.cdm-blk.hl').forEach(function(x){x.classList.remove('hl')});
var t=cm.querySelector('.cdm-blk[data-i="'+i+'"]');if(!t)return;b.setAttribute('aria-pressed','true');t.classList.add('hl');
if(t.parentNode)t.parentNode.appendChild(t);
var bar=f.querySelector('.cdm-chip[data-f="all"]');if(bar&&cm.getAttribute('data-f'))bar.click();
var ti=t.querySelector('title');if(out&&ti)out.textContent=ti.textContent;
var r=t.getBoundingClientRect();show(t,r.left+r.width/2,r.top+r.height/2);
var fr=f.getBoundingClientRect();if(fr.top<0||fr.bottom>innerHeight)f.scrollIntoView({block:'center',behavior:'smooth'})});
})();'''


def fix(h, L):
    if MARK in h:
        return h, 0
    t = T[L]
    n = 0
    for a, b, k in t['subst']:
        c = h.count(a)
        if c == 0 and L == 'fr':
            # espaces insecables avant ; : ? ! dans le texte francais
            nb = lambda x: re.sub(r' ([;:?!])', '\u00a0\\1', x)
            a2, b2 = nb(a), nb(b)
            if h.count(a2):
                a, b, c = a2, b2, h.count(a2)
        assert c == k, (L, a[:70], c)
        if L == 'fr':
            b = re.sub(r' ([;:?!])', '\u00a0\\1', b)
        h = h.replace(a, b)
        n += c
    # carte A : bassins au clavier, textes decoratifs caches
    for k, lab in t['zones'].items():
        a = f'data-k="{k}" rx='
        assert h.count(a) == 1, (L, k)
        h = re.sub(r'(<ellipse class="atc-zone"[^>]*data-k="' + k + r'")', r'\1 tabindex="0" role="button" aria-label="' + lab + '"', h, count=1)
        n += 1
    h, k2 = re.subn(r'<text class="atc-whisper" ', '<text aria-hidden="true" class="atc-whisper" ', h)
    assert k2 == 2
    a = 'bd.className="atc-badge "+d.st;'
    assert h.count(a) == 1
    h = h.replace(a, 'bd.className="atc-badge "+(d.c||d.st);')
    # legende HTML de la carte A (mobile)
    a = '</svg></div><div aria-label="'
    i = h.find('id="atc-map"')
    j = h.find(a, i)
    assert j > 0
    h = h[:j] + '</svg>' + legend_a(L) + '</div><div aria-label="' + h[j + len(a):]
    # carte B : nouveau dessin
    i = h.find('<figure class="ppmap')
    s = h.find('<svg', i)
    e = h.find('</svg>', s) + 6
    assert 0 < s < e
    h = h[:s] + map_b(L) + h[e:]
    # carte C : couleurs, etiquettes, legende des pipelines, liste
    for a, b in (('#F59E0B', '#B48CF2'), ('rgba(245,158,11,.08)', 'rgba(180,140,242,.08)'), ('rgba(245,158,11,.26)', 'rgba(180,140,242,.3)'),
                 ('rgba(245,158,11,.34)', 'rgba(180,140,242,.36)'), ('rgba(245,158,11,.4)', 'rgba(180,140,242,.42)'),
                 ('linear-gradient(135deg,#B48CF2,#A25B06)', 'linear-gradient(135deg,#8B5CF6,#6D3FC0)'),
                 ('#A25B06', '#6D3FC0'), ('rgba(162,91,6,.3)', 'rgba(109,63,192,.3)')):
        h = h.replace(a, b)
    i = h.find('id="cadmap"')
    j = h.find('</svg>', i)
    seg = h[i:j]
    seg = seg.replace('font-size="4.6"', 'font-size="5.2"').replace('font-size="5.4"', 'font-size="5.8"')
    seg, lst = block_list(L, seg)
    h = h[:i] + seg + h[j:]
    i = h.find('class="cdm-legend"')
    j = h.find('</div>', i)
    pipes = ''.join(f'<span class="cdm-lg"><i class="{"cdm-sq" if c == "sq" else "cdm-ln " + c}" aria-hidden="true"></i>{H.escape(tx, False)}</span>' for c, tx in t['pipes'])
    h = h[:j] + pipes + h[j:]
    i = h.find('<figure class="cdm-wrap')
    j = h.find('</figure>', i) + len('</figure>')
    h = h[:j] + lst + h[j:]
    # styles et script
    k = h.rfind('</main>')
    assert k > 0
    h = h[:k] + f'<style {MARK}>' + CSS + '</style><script>' + JS + '</script>' + h[k:]
    return h, n


if __name__ == '__main__':
    for f, L in FILES.items():
        h = open(f, encoding='utf-8').read()
        h2, n = fix(h, L)
        if h2 != h:
            open(f, 'w', encoding='utf-8').write(h2)
        print(f, n, 'remplacement(s) de texte, cartes A, B et C revues' if h2 != h else 'deja traite')
