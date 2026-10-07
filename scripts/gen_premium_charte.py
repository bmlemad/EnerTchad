# -*- coding: utf-8 -*-
"""Refonte premium (phase 14) : charte graphique reecrite (charte, charte-en).

L ancienne charte decrivait le langage visuel d avant la refonte (fond sombre « petrole »,
accents par pole, titres en 800, boutons arrondis). La nouvelle documente le gabarit premium
tel qu il est en ligne : les valeurs viennent des feuilles du site (scripts/pole-premium.src.css,
feuille arabe) et chaque composant est montre avec les classes reelles du site, dans les deux
themes. Les accents par pole sont retires (le premium n emploie que l or). La section
« Gabarit de page » est reprise a l identique (texte controle a la generation).
Mecanique : la page est d abord convertie par le generateur des pages institutionnelles
(en-tete, heros sobre, pied, index « Dans cette page »), puis le contenu est remplace par les
sections ci-dessous.
Idempotent : une page deja migree (class="ppl") est ignoree.
Usage : python3 scripts/gen_premium_charte.py
"""
import os
import re
import sys
from html import escape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_premium_institution as G  # noqa: E402

PAGES = [('charte.html', 'fr'), ('charte-en.html', 'en')]


def ratio(a, b):
    """Rapport de contraste WCAG entre deux couleurs hexadecimales."""
    def lum(h):
        h = h.lstrip('#')
        c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


def tokens():
    """Valeurs des variables premium, lues dans la source de la feuille."""
    src = open('scripts/pole-premium.src.css', encoding='utf-8').read()
    light = dict(re.findall(r'--(pp-[a-z0-9-]+):(#[0-9A-Fa-f]{6})', src[src.find('@M{'):src.find('}', src.find('@M{'))]))
    dark = dict(re.findall(r'--(pp-[a-z0-9-]+):(#[0-9A-Fa-f]{6})', src[src.find('@MD{'):src.find('}', src.find('@MD{'))]))
    wrap = re.search(r'--pp-wrap:(\d+px)', src).group(1)
    return light, dark, wrap


def fmt(x, lang):
    s = f'{x:.1f}'
    return s.replace('.', ',') if lang == 'fr' else s


T = {
    'fr': {
        'crumb': 'Charte graphique', 'home': 'Accueil',
        'kick': 'Identité visuelle', 'h1': 'Charte graphique',
        'lead': 'Les règles visuelles du site EnerTchad, telles qu’elles sont en ligne : couleurs, typographies, mise en page et composants. Chaque exemple de cette page est rendu avec le code du site, dans le thème clair comme dans le thème sombre.',
        'nav': ['Principes', 'Couleurs', 'Typographies', 'Mise en page', 'Composants', 'Accessibilité', 'Arabe', 'Gabarit'],
    },
    'en': {
        'crumb': 'Brand guidelines', 'home': 'Home',
        'kick': 'Visual identity', 'h1': 'Brand guidelines',
        'lead': 'The visual rules of the EnerTchad website, as they are live: colours, typefaces, layout and components. Every example on this page is rendered with the site’s own code, in the light theme as in the dark theme.',
        'nav': ['Principles', 'Colours', 'Typefaces', 'Layout', 'Components', 'Accessibility', 'Arabic', 'Template'],
    },
}


def head(n, hid, k, title, lead=''):
    return (f'<div class="pp-head"><p class="pp-k">{n} · {k}</p><h2 id="{hid}">{title}</h2>'
            + (f'<p class="pp-lead">{lead}</p>' if lead else '') + '</div>')


def block(k, title, body, extra=''):
    return (f'<div class="pp-block"><div class="pp-bh"><p class="pp-k">{k}</p><h3>{title}</h3></div>'
            f'<div class="pp-spec"><div class="pp-prose">{body}</div>{extra}</div></div>')


def swatches(items):
    return '<ul class="pp-swatches">' + ''.join(
        f'<li><i style="background:{hx}"></i><b>{nm}</b><span>{hx}{(" · --" + var) if var else ""}</span><span>{use}</span></li>'
        for nm, hx, var, use in items) + '</ul>'


def dl(items):
    return '<ul class="pp-dl">' + ''.join(f'<li><b>{a}</b>{b}</li>' for a, b in items) + '</ul>'


def sections(lang, gab):
    L, D, wrap = tokens()
    wn = int(wrap[:-2])
    wrap_fr = f'{wn:,} px'.replace(',', ' ')
    wrap_en = f'{wn:,} px'
    fr = lang == 'fr'
    r = {k: fmt(ratio(*v), lang) for k, v in {
        'ink': (L['pp-ink'], L['pp-paper']), 'ink2': (L['pp-ink2'], L['pp-paper']),
        'ink2m': (L['pp-ink2'], L['pp-mist']), 'gold_ink': (L['pp-gold-ink'], L['pp-paper']),
        'gold': (L['pp-gold'], L['pp-paper']), 'd_ink': (D['pp-ink'], D['pp-paper']),
        'd_ink2': (D['pp-ink2'], D['pp-paper']), 'd_gold': (D['pp-gold'], D['pp-paper']),
        'night': (L['pp-night-ink'], '#07111F'), 'night2': (L['pp-night-2'], '#07111F')}.items()}
    out = []

    # 1. Principes
    if fr:
        cells = [('Une édition, pas une vitrine', 'Grand serif sur fond clair, texte aéré, une idée par bloc. La page se lit comme un rapport annuel, pas comme une publicité.'),
                 ('La photographie ouvre', 'Chaque page de pôle et de métier s’ouvre sur une photographie pleine largeur ; les pages de référence et d’aide, sur un héros sobre, sans image.'),
                 ('Des filets, pas des boîtes', 'Les sections sont à plat, séparées par des filets fins et par l’alternance blanc / brume. Ni ombre portée, ni coins arrondis, ni dégradé décoratif.'),
                 ('L’or est rare', 'L’or sert aux filets, aux sur-titres et aux chiffres. Il ne colore jamais un aplat de texte courant ; les pôles se distinguent par l’image et le titre, pas par la couleur.')]
        lead = 'Quatre règles tiennent l’ensemble. Elles valent pour toutes les pages, en français, en anglais et en arabe.'
        title = 'Une société en constitution qui écrit comme une major.'
    else:
        cells = [('An edition, not a showcase', 'Large serif on a light ground, airy text, one idea per block. The page reads like an annual report, not like an advertisement.'),
                 ('Photography opens', 'Every pole and business page opens on a full-width photograph; reference and help pages open on a plain hero, without an image.'),
                 ('Hairlines, not boxes', 'Sections are flat, separated by thin hairlines and by the white / mist alternation. No drop shadow, no rounded corners, no decorative gradient.'),
                 ('Gold is rare', 'Gold is used for hairlines, eyebrows and figures. It never colours running text; the poles are told apart by image and title, not by colour.')]
        lead = 'Four rules hold the whole together. They apply to every page, in French, English and Arabic.'
        title = 'A company in formation that writes like a major.'
    grid = '<div class="pp-grid">' + ''.join(f'<div class="pp-cell"><b>{escape(a)}</b><p>{escape(b)}</p></div>' for a, b in cells) + '</div>'
    out.append(('principes', head('01', 'ch-h1', T[lang]['nav'][0], title, lead) + f'<div class="pp-prose pp-prose-w">{grid}</div>'))

    # 2. Couleurs
    if fr:
        lt = [('Papier', L['pp-paper'], 'pp-paper', 'fond des sections'), ('Brume', L['pp-mist'], 'pp-mist', 'une section sur deux, encadrés'),
              ('Encre', L['pp-ink'], 'pp-ink', 'titres et texte'), ('Encre seconde', L['pp-ink2'], 'pp-ink2', 'chapeaux, descriptions'),
              ('Filet', L['pp-line'], 'pp-line', 'séparations'), ('Or', L['pp-gold'], 'pp-gold', 'filets et puces, jamais du texte'),
              ('Or encre', L['pp-gold-ink'], 'pp-gold-ink', 'sur-titres, chiffres, liens au survol')]
        dk = [('Papier', D['pp-paper'], 'pp-paper', 'fond'), ('Brume', D['pp-mist'], 'pp-mist', 'alternance'), ('Encre', D['pp-ink'], 'pp-ink', 'titres et texte'),
              ('Encre seconde', D['pp-ink2'], 'pp-ink2', 'texte secondaire'), ('Filet', D['pp-line'], 'pp-line', 'séparations'), ('Or', D['pp-gold'], 'pp-gold', 'filets, sur-titres, chiffres')]
        nt = [('Nuit', '#07111F', '', 'héros et appel à l’action'), ('Encre de nuit', L['pp-night-ink'], 'pp-night-ink', 'texte sur la nuit'),
              ('Encre de nuit seconde', L['pp-night-2'], 'pp-night-2', 'texte secondaire'), ('Or de nuit', L['pp-gold-night'], 'pp-gold-night', 'boutons et filets sur la nuit')]
        out.append(('couleurs', head('02', 'ch-h2', T[lang]['nav'][1], 'Encre, brume, or.',
                                     'Une palette courte, définie par des variables : le thème sombre ne change que leurs valeurs. Les huit accents par pôle des versions précédentes ne sont plus utilisés.')
                    + '<div class="pp-blocks">'
                    + block('Thème clair', 'Le thème par défaut.', '<p>Texte en encre sur papier ; l’or encre porte les sur-titres et les chiffres.</p>' + swatches(lt))
                    + block('Thème sombre', 'Mêmes rôles, autres valeurs.', '<p>Suit le réglage du système ou le bouton de thème ; l’or s’éclaircit pour rester lisible.</p>' + swatches(dk))
                    + block('Nuit', 'Le héros et l’appel à l’action.', '<p>Le seul fond foncé du thème clair : sous la photographie des héros, dans le héros sobre et dans le chapitre final.</p>' + swatches(nt))
                    + '</div>'))
    else:
        lt = [('Paper', L['pp-paper'], 'pp-paper', 'section ground'), ('Mist', L['pp-mist'], 'pp-mist', 'every other section, boxes'),
              ('Ink', L['pp-ink'], 'pp-ink', 'headings and text'), ('Second ink', L['pp-ink2'], 'pp-ink2', 'leads, descriptions'),
              ('Hairline', L['pp-line'], 'pp-line', 'separators'), ('Gold', L['pp-gold'], 'pp-gold', 'hairlines and bullets, never text'),
              ('Gold ink', L['pp-gold-ink'], 'pp-gold-ink', 'eyebrows, figures, links on hover')]
        dk = [('Paper', D['pp-paper'], 'pp-paper', 'ground'), ('Mist', D['pp-mist'], 'pp-mist', 'alternation'), ('Ink', D['pp-ink'], 'pp-ink', 'headings and text'),
              ('Second ink', D['pp-ink2'], 'pp-ink2', 'secondary text'), ('Hairline', D['pp-line'], 'pp-line', 'separators'), ('Gold', D['pp-gold'], 'pp-gold', 'hairlines, eyebrows, figures')]
        nt = [('Night', '#07111F', '', 'heroes and call to action'), ('Night ink', L['pp-night-ink'], 'pp-night-ink', 'text on night'),
              ('Second night ink', L['pp-night-2'], 'pp-night-2', 'secondary text'), ('Night gold', L['pp-gold-night'], 'pp-gold-night', 'buttons and hairlines on night')]
        out.append(('couleurs', head('02', 'ch-h2', T[lang]['nav'][1], 'Ink, mist, gold.',
                                     'A short palette, defined by variables: the dark theme only changes their values. The eight per-pole accents of earlier versions are no longer used.')
                    + '<div class="pp-blocks">'
                    + block('Light theme', 'The default theme.', '<p>Ink text on paper; gold ink carries eyebrows and figures.</p>' + swatches(lt))
                    + block('Dark theme', 'Same roles, other values.', '<p>Follows the system setting or the theme button; gold lightens to stay legible.</p>' + swatches(dk))
                    + block('Night', 'The hero and the call to action.', '<p>The only dark ground of the light theme: under hero photographs, in the plain hero and in the closing chapter.</p>' + swatches(nt))
                    + '</div>'))

    # 3. Typographies
    sp_t = 'De la roche-mère à la pompe' if fr else 'From source rock to the pump'
    sp_2 = 'Une société, trois pôles de cœur' if fr else 'One company, three core poles'
    sp_3 = 'Souveraineté énergétique' if fr else 'Energy sovereignty'
    sp_l = ('Une compagnie pétrolière intégrée à capitaux tchadiens, en constitution.' if fr
            else 'An integrated, Chadian-owned oil company, in formation.')
    sp_b = ('Le texte courant est en Inter, 17 px, interligne 1,6, sur une largeur de lecture d’environ 70 signes.' if fr
            else 'Running text is set in Inter, 17 px, line height 1.6, over a reading width of about 70 characters.')
    spec = (f'<div class="pp-type"><div><span class="pp-ts pp-ts-1">{sp_t}</span><span>{"Titre de page · Instrument Serif 400 · 2,9 à 5,6 rem · interligne 0,98" if fr else "Page title · Instrument Serif 400 · 2.9 to 5.6 rem · line height 0.98"}</span></div>'
            f'<div><span class="pp-ts pp-ts-2">{sp_2}</span><span>{"Titre de section · 2,2 à 3,8 rem · interligne 1,04" if fr else "Section title · 2.2 to 3.8 rem · line height 1.04"}</span></div>'
            f'<div><span class="pp-ts pp-ts-3">{sp_3}</span><span>{"Titre de bloc · 1,55 rem · interligne 1,15" if fr else "Block title · 1.55 rem · line height 1.15"}</span></div>'
            f'<div><span class="pp-ts pp-ts-k">{"Accès aux énergies" if fr else "Access to energy"}</span><span>{"Sur-titre · Inter 600 · 0,72 rem · capitales, interlettrage 0,22 em · or encre" if fr else "Eyebrow · Inter 600 · 0.72 rem · capitals, letter spacing 0.22 em · gold ink"}</span></div>'
            f'<div><span class="pp-ts pp-ts-l">{sp_l}</span><span>{"Chapeau · Inter 400 · 1,15 rem · encre seconde" if fr else "Lead · Inter 400 · 1.15 rem · second ink"}</span></div>'
            f'<div><span class="pp-ts pp-ts-b">{sp_b}</span><span>{"Texte · Inter 400 · 17 px" if fr else "Body · Inter 400 · 17 px"}</span></div>'
            f'<div><span class="pp-ts pp-ts-f">100 M → 1 Md → 10 Md FCFA</span><span>{"Chiffre · Instrument Serif · chiffres tabulaires" if fr else "Figure · Instrument Serif · tabular figures"}</span></div></div>')
    if fr:
        out.append(('typographies', head('03', 'ch-h3', T[lang]['nav'][2], 'Un serif pour la voix, un linéale pour le texte.',
                                         'Deux familles seulement. Instrument Serif, en graisse normale, porte les titres et les chiffres ; Inter porte le texte, les sur-titres et l’interface. Les titres ne sont jamais en gras.')
                    + f'<div class="pp-prose pp-prose-w">{spec}'
                    + dl([('Instrument Serif', 'titres et chiffres ; repli Iowan Old Style, puis Georgia. Fichier latin préchargé, affichage « swap ».'),
                          ('Inter', 'texte et interface en 400, 500 et 600 ; repli sur la police système.'),
                          ('Tailles fluides', 'les titres de page et de section varient avec la largeur de l’écran (fonction clamp) ; le texte reste à 17 px.')]) + '</div>'))
    else:
        out.append(('typographies', head('03', 'ch-h3', T[lang]['nav'][2], 'A serif for the voice, a sans for the text.',
                                         'Two families only. Instrument Serif, in regular weight, carries headings and figures; Inter carries text, eyebrows and the interface. Headings are never bold.')
                    + f'<div class="pp-prose pp-prose-w">{spec}'
                    + dl([('Instrument Serif', 'headings and figures; falls back to Iowan Old Style, then Georgia. Latin file preloaded, “swap” display.'),
                          ('Inter', 'text and interface in 400, 500 and 600; falls back to the system font.'),
                          ('Fluid sizes', 'page and section titles scale with the screen width (clamp function); body text stays at 17 px.')]) + '</div>'))

    # 4. Mise en page et heros
    if fr:
        lay = dl([('Largeur', f'contenu borné à {wrap_fr}, centré ; marges latérales de 16 à 40 px selon l’écran.'),
                  ('Rythme', 'sections espacées de 72 à 128 px ; en-tête de section limité à 780 px de large, texte à environ 72 signes.'),
                  ('Alternance', 'une section sur deux sur fond brume ; les sections sont séparées par le changement de fond, sans filet supplémentaire.'),
                  ('Blocs', 'à l’intérieur d’une section, un bloc place le titre à gauche (un tiers) et le texte à droite ; sur mobile, le titre passe au-dessus.'),
                  ('Ruptures', 'deux largeurs de rupture : 1 000 px (grilles à deux colonnes) et 760 px (une colonne).')])
        heroes = ('<div class="pp-grid"><div class="pp-cell"><b>Héros photographique</b><p>Photographie pleine largeur assombrie à gauche et en bas, fil d’Ariane, sur-titre, titre de page, chapeau, un bouton blanc et un lien, puis jusqu’à trois chiffres. Pour les pôles, les métiers et les pages commerciales.</p><p><a href="/aval/">Exemple : Raffinage &amp; distribution</a></p></div>'
                  '<div class="pp-cell"><b>Héros sobre</b><p>Même composition sur fond nuit, sans photographie, souligné d’un filet or ; plus compact. Pour l’aide, les références, la gouvernance et les pages légales.</p><p><a href="/mentions-legales">Exemple : mentions légales</a></p></div></div>')
        out.append(('mise-en-page', head('04', 'ch-h4', T[lang]['nav'][3], 'Une grille large, un rythme lent.',
                                         'La page avance par sections à plat ; l’espace blanc fait la hiérarchie avant la couleur.')
                    + f'<div class="pp-prose pp-prose-w">{lay}<div class="pp-minih">Deux héros</div>{heroes}</div>'))
    else:
        lay = dl([('Width', f'content capped at {wrap_en}, centred; side margins from 16 to 40 px depending on the screen.'),
                  ('Rhythm', 'sections spaced 72 to 128 px apart; section heading limited to 780 px wide, text to about 72 characters.'),
                  ('Alternation', 'every other section on a mist ground; sections are separated by the change of ground, with no extra hairline.'),
                  ('Blocks', 'inside a section, a block puts the title on the left (one third) and the text on the right; on mobile, the title moves above.'),
                  ('Breakpoints', 'two breakpoints: 1,000 px (two-column grids) and 760 px (one column).')])
        heroes = ('<div class="pp-grid"><div class="pp-cell"><b>Photographic hero</b><p>Full-width photograph darkened on the left and at the bottom, breadcrumb, eyebrow, page title, lead, one white button and one link, then up to three figures. For poles, businesses and commercial pages.</p><p><a href="/pole-aval-en">Example: Refining &amp; Distribution</a></p></div>'
                  '<div class="pp-cell"><b>Plain hero</b><p>Same composition on a night ground, without a photograph, underlined by a gold hairline; more compact. For help, reference, governance and legal pages.</p><p><a href="/mentions-legales-en">Example: legal notice</a></p></div></div>')
        out.append(('mise-en-page', head('04', 'ch-h4', T[lang]['nav'][3], 'A wide grid, a slow rhythm.',
                                         'The page moves forward in flat sections; white space sets the hierarchy before colour does.')
                    + f'<div class="pp-prose pp-prose-w">{lay}<div class="pp-minih">Two heroes</div>{heroes}</div>'))

    # 5. Composants (exemples rendus avec les classes du site)
    if fr:
        c = [
            ('Actions', 'Boutons et liens', '<p>Un bouton plein par écran au plus ; les autres actions sont des liens soulignés d’or, la flèche est dessinée par la feuille.</p>',
             '<div class="pp-actions"><a class="pp-btn pp-btn-ink" href="/contact">Nous écrire</a><a class="pp-link" href="/nos-activites">Voir nos activités</a></div>'),
            ('Grille', 'Cartes', '<p>Éléments comparables : titre court, deux lignes de texte, filet supérieur. Trois ou quatre par rangée.</p><div class="pp-grid"><div class="pp-cell"><b>Exploration &amp; Production</b><p>Récupération assistée à intrants locaux.</p></div><div class="pp-cell"><b>Transport &amp; stockage</b><p>Corridor, dépôts, intégrité des conduites.</p></div><div class="pp-cell"><b>Raffinage &amp; distribution</b><p>Mini-raffineries, stations, prix réglementé.</p></div></div>', ''),
            ('Chiffres', 'Compteurs', '<p>Chiffre en serif, libellé dessous ; toujours daté et qualifié (cible, secteur, en constitution).</p><div class="pp-stats"><span><b>100 M</b>FCFA · capital fondateur</span><span><b>3</b>pôles de cœur</span><span><b>0</b>actif en exploitation</span><span class="pp-cap">Société en constitution · objectifs datés</span></div>', ''),
            ('Encadré', 'Note', '<div class="pp-box"><b>Société en constitution.</b> Les projets, débits et indicateurs présentés sont des ambitions datées, non des résultats acquis.</div><p>Filet or à gauche, fond brume : avertissements, précisions de méthode.</p>', ''),
            ('Étiquettes', 'Pastilles et mentions', '<p>Pastilles pour les mots-clés, mentions séparées par un point médian pour les dates et les rubriques.</p><div class="pp-tags"><span>EN 590</span><span>NF EN 228</span><span>Prix ARSAT</span><span>Mobile Stations™</span></div><div class="pp-meta"><span>2 juin 2026</span><span>Communiqué</span></div>', ''),
            ('Liste', 'Libellé et valeur', '<ul class="pp-dl"><li><b>Forme juridique</b>Société anonyme de droit OHADA, en constitution.</li><li><b>Siège</b>N’Djamena, Tchad.</li></ul>', ''),
            ('Séquence', 'Étapes', '<div class="pp-flow"><div class="pp-step"><div>Étape 1</div><b>Extraire</b><span>reprise de puits, récupération assistée</span></div><div aria-hidden="true">→</div><div class="pp-step"><div>Étape 2</div><b>Transporter</b><span>camions, dépôts relais</span></div><div aria-hidden="true">→</div><div class="pp-step"><div>Étape 3</div><b>Raffiner</b><span>mini-raffinerie modulaire</span></div></div>', ''),
            ('Navigation', 'Cartes de navigation', '<nav class="pp-navcards" aria-label="Exemple de cartes de navigation"><a href="/amont/"><b>Exploration &amp; Production</b><span>Le pôle amont</span></a><a href="/intermediaire/"><b>Transport &amp; stockage</b><span>Le pôle intermédiaire</span></a><a href="/aval/"><b>Raffinage &amp; distribution</b><span>Le pôle aval</span></a></nav>', ''),
            ('Questions', 'Question repliable', '<details><summary><span>01</span> Qu’est-ce qu’EnerTchad S.A. ?</summary><div><p>Une société anonyme de droit OHADA, à capitaux tchadiens, en constitution.</p></div></details><details><summary><span>02</span> EnerTchad produit-elle déjà du pétrole ?</summary><div><p>Non : aucun actif n’est en exploitation à ce jour.</p></div></details>', ''),
            ('Données', 'Tableau', '<div role="region" tabindex="0" aria-label="Exemple de tableau, défilement horizontal"><table><caption>Prix homologués ARSAT, exemple</caption><thead><tr><th scope="col">Produit</th><th scope="col">Norme</th><th scope="col">Prix</th></tr></thead><tbody><tr><th scope="row">Gazole</th><td>EN 590</td><td>800 FCFA/L</td></tr><tr><th scope="row">Essence</th><td>NF EN 228</td><td>700 FCFA/L</td></tr></tbody></table></div><p>Sur mobile, le tableau défile seul, sans élargir la page.</p>', ''),
        ]
        lead5 = 'Les exemples ci-dessous sont rendus avec les classes du site : ce que montre la charte est ce que voit le visiteur. Les outils interactifs (calculateurs, formulaires, boutique) gardent leur propre habillage et sont insérés tels quels.'
        title5 = 'Des pièces simples, réutilisées partout.'
    else:
        c = [
            ('Actions', 'Buttons and links', '<p>At most one solid button per screen; other actions are gold-underlined links, the arrow is drawn by the stylesheet.</p>',
             '<div class="pp-actions"><a class="pp-btn pp-btn-ink" href="/contact-en">Write to us</a><a class="pp-link" href="/nos-activites-en">See our activities</a></div>'),
            ('Grid', 'Cards', '<p>Comparable items: short title, two lines of text, top hairline. Three or four per row.</p><div class="pp-grid"><div class="pp-cell"><b>Exploration &amp; Production</b><p>Enhanced recovery with local inputs.</p></div><div class="pp-cell"><b>Transport &amp; Storage</b><p>Corridor, depots, pipeline integrity.</p></div><div class="pp-cell"><b>Refining &amp; Distribution</b><p>Mini-refineries, stations, regulated price.</p></div></div>', ''),
            ('Figures', 'Counters', '<p>Figure in serif, label below; always dated and qualified (target, sector, in formation).</p><div class="pp-stats"><span><b>100 M</b>FCFA · founding capital</span><span><b>3</b>core poles</span><span><b>0</b>asset in operation</span><span class="pp-cap">Company in formation · dated targets</span></div>', ''),
            ('Box', 'Note', '<div class="pp-box"><b>Company in formation.</b> The projects, flow rates and indicators shown are dated ambitions, not achieved results.</div><p>Gold hairline on the left, mist ground: warnings, notes on method.</p>', ''),
            ('Labels', 'Tags and mentions', '<p>Tags for keywords, mentions separated by a middle dot for dates and categories.</p><div class="pp-tags"><span>EN 590</span><span>NF EN 228</span><span>ARSAT price</span><span>Mobile Stations™</span></div><div class="pp-meta"><span>2 June 2026</span><span>Press release</span></div>', ''),
            ('List', 'Label and value', '<ul class="pp-dl"><li><b>Legal form</b>Public limited company under OHADA law, in formation.</li><li><b>Registered office</b>N’Djamena, Chad.</li></ul>', ''),
            ('Sequence', 'Steps', '<div class="pp-flow"><div class="pp-step"><div>Step 1</div><b>Extract</b><span>well takeovers, enhanced recovery</span></div><div aria-hidden="true">→</div><div class="pp-step"><div>Step 2</div><b>Transport</b><span>trucks, relay depots</span></div><div aria-hidden="true">→</div><div class="pp-step"><div>Step 3</div><b>Refine</b><span>modular mini-refinery</span></div></div>', ''),
            ('Navigation', 'Navigation cards', '<nav class="pp-navcards" aria-label="Example of navigation cards"><a href="/pole-amont-en"><b>Exploration &amp; Production</b><span>The upstream pole</span></a><a href="/pole-intermediaire-en"><b>Transport &amp; Storage</b><span>The midstream pole</span></a><a href="/pole-aval-en"><b>Refining &amp; Distribution</b><span>The downstream pole</span></a></nav>', ''),
            ('Questions', 'Collapsible question', '<details><summary><span>01</span> What is EnerTchad S.A.?</summary><div><p>A public limited company under OHADA law, Chadian-owned, in formation.</p></div></details><details><summary><span>02</span> Does EnerTchad already produce oil?</summary><div><p>No: no asset is in operation to date.</p></div></details>', ''),
            ('Data', 'Table', '<div role="region" tabindex="0" aria-label="Example table, horizontal scrolling"><table><caption>ARSAT approved prices, example</caption><thead><tr><th scope="col">Product</th><th scope="col">Standard</th><th scope="col">Price</th></tr></thead><tbody><tr><th scope="row">Diesel</th><td>EN 590</td><td>800 FCFA/L</td></tr><tr><th scope="row">Petrol</th><td>NF EN 228</td><td>700 FCFA/L</td></tr></tbody></table></div><p>On mobile, the table scrolls on its own without widening the page.</p>', ''),
        ]
        lead5 = 'The examples below are rendered with the site’s classes: what the guidelines show is what the visitor sees. Interactive tools (calculators, forms, shop) keep their own styling and are inserted as they are.'
        title5 = 'Simple pieces, reused everywhere.'
    comp = '<div class="pp-blocks">' + ''.join(block(k, t, b, x) for k, t, b, x in c) + '</div>'
    out.append(('composants', head('05', 'ch-h5', T[lang]['nav'][4], title5, lead5) + comp))

    # 6. Accessibilite et themes
    if fr:
        acc = dl([('Contraste, thème clair', f'encre sur papier {r["ink"]} : 1 ; encre seconde {r["ink2"]} : 1 (sur brume {r["ink2m"]} : 1) ; or encre {r["gold_ink"]} : 1. L’or ({r["gold"]} : 1) ne sert qu’aux filets.'),
                  ('Contraste, thème sombre', f'encre {r["d_ink"]} : 1 ; encre seconde {r["d_ink2"]} : 1 ; or {r["d_gold"]} : 1.'),
                  ('Contraste, nuit', f'encre de nuit {r["night"]} : 1 ; encre de nuit seconde {r["night2"]} : 1. Toutes les paires de texte dépassent le niveau AA (4,5 : 1).'),
                  ('Clavier', 'tout élément actif reçoit un contour or de 2 px au focus ; un lien d’évitement mène au contenu principal.'),
                  ('Cibles', 'liens, boutons et pastilles mesurent au moins 44 px de haut.'),
                  ('Mouvement', 'les animations sont coupées quand le système demande de réduire les mouvements.'),
                  ('Images', 'chaque photographie porte un texte de remplacement descriptif ; les images décoratives sont masquées aux lecteurs d’écran.'),
                  ('Thèmes', 'clair par défaut ; le sombre suit le réglage du système ou le bouton de thème, et le choix est mémorisé.')])
        out.append(('accessibilite', head('06', 'ch-h6', T[lang]['nav'][5], 'Lisible par tous, dans les deux thèmes.',
                                          'Chaque publication est vérifiée automatiquement sur toutes les pages premium, en thème clair sur grand écran et en thème sombre sur mobile.')
                    + f'<div class="pp-prose pp-prose-w">{acc}</div>'))
    else:
        acc = dl([('Contrast, light theme', f'ink on paper {r["ink"]}:1; second ink {r["ink2"]}:1 (on mist {r["ink2m"]}:1); gold ink {r["gold_ink"]}:1. Gold ({r["gold"]}:1) is used for hairlines only.'),
                  ('Contrast, dark theme', f'ink {r["d_ink"]}:1; second ink {r["d_ink2"]}:1; gold {r["d_gold"]}:1.'),
                  ('Contrast, night', f'night ink {r["night"]}:1; second night ink {r["night2"]}:1. Every text pair exceeds level AA (4.5:1).'),
                  ('Keyboard', 'every active element gets a 2 px gold outline on focus; a skip link leads to the main content.'),
                  ('Targets', 'links, buttons and tags are at least 44 px tall.'),
                  ('Motion', 'animations are switched off when the system asks for reduced motion.'),
                  ('Images', 'every photograph carries descriptive alternative text; decorative images are hidden from screen readers.'),
                  ('Themes', 'light by default; dark follows the system setting or the theme button, and the choice is remembered.')])
        out.append(('accessibilite', head('06', 'ch-h6', T[lang]['nav'][5], 'Legible for all, in both themes.',
                                          'Every release is checked automatically on all premium pages, in the light theme on a large screen and in the dark theme on mobile.')
                    + f'<div class="pp-prose pp-prose-w">{acc}</div>'))

    # 7. Arabe
    if fr:
        ar = dl([('Sens de lecture', 'les pages arabes sont écrites de droite à gauche (attribut dir="rtl") ; grilles, filets et flèches suivent ce sens.'),
                 ('Polices', 'Noto Naskh Arabic (graisse 500) pour les titres et les chiffres, Noto Sans Arabic pour le texte, à 17 px avec un interligne de 1,85.'),
                 ('Chargement', 'fichiers arabes préchargés et affichés sans substitution tardive (« optional ») ; le serif de repli est Georgia, pour éviter tout décalage de mise en page.'),
                 ('Photographies', 'les photographies des héros sont retournées horizontalement, pour que la zone sombre accueille le texte à droite.'),
                 ('Feuille propre', 'le mini-site a sa feuille (home-inline-ar-premium.css), qui reprend les variables et les composants de cette charte.')])
        out.append(('arabe', head('07', 'ch-h7', T[lang]['nav'][6], 'Le mini-site arabe, de droite à gauche.',
                                  'Mêmes couleurs et mêmes composants ; seules la direction, les polices et le cadrage des images changent.')
                    + f'<div class="pp-prose pp-prose-w">{ar}<p><a href="/ar" lang="ar" dir="rtl" hreflang="ar">إنيرتشاد بالعربية</a></p></div>'))
    else:
        ar = dl([('Reading direction', 'Arabic pages are written right to left (dir="rtl" attribute); grids, hairlines and arrows follow that direction.'),
                 ('Typefaces', 'Noto Naskh Arabic (weight 500) for headings and figures, Noto Sans Arabic for text, at 17 px with a 1.85 line height.'),
                 ('Loading', 'Arabic files are preloaded and displayed without late substitution (“optional”); the fallback serif is Georgia, to avoid any layout shift.'),
                 ('Photographs', 'hero photographs are flipped horizontally, so the dark area holds the text on the right.'),
                 ('Own stylesheet', 'the mini-site has its own stylesheet (home-inline-ar-premium.css), which reuses the variables and components of these guidelines.')])
        out.append(('arabe', head('07', 'ch-h7', T[lang]['nav'][6], 'The Arabic mini-site, right to left.',
                                  'Same colours and same components; only direction, typefaces and image framing change.')
                    + f'<div class="pp-prose pp-prose-w">{ar}<p><a href="/ar" lang="ar" dir="rtl" hreflang="ar">إنيرتشاد بالعربية</a></p></div>'))

    # 8. Gabarit de page (texte repris a l identique)
    out.append(('gabarit', gab))
    return out


def gabarit(old, lang):
    """Section « Gabarit de page » : texte d origine, mise en forme premium."""
    m = re.search(r'<section[^>]*id="gabarit"[\s\S]*?</section>', old)
    if m is None:
        raise SystemExit('section gabarit introuvable')
    s = m.group(0)
    kick = re.search(r'<span class="kick">([^<]+)</span>', s).group(1)
    h2 = re.search(r'<h2>([^<]+)</h2>', s).group(1)
    ps = re.findall(r'<p[^>]*>([\s\S]*?)</p>', s)
    figs = re.findall(r'<div><b>([^<]+)</b><span>([^<]+)</span></div>', s)
    assert len(ps) == 3 and len(figs) == 4, 'gabarit : structure inattendue'
    html = (f'<div class="pp-head"><p class="pp-k">08 · {kick}</p><h2 id="ch-h8">{h2}</h2><p class="pp-lead">{ps[0]}</p></div>'
            '<div class="pp-prose pp-prose-w"><div class="pp-stats">'
            + ''.join(f'<span><b>{a}</b>{b}</span>' for a, b in figs) + '</div>'
            f'<p>{ps[1]}</p><p class="pp-note">{ps[2]}</p></div>')
    return html, s


def words(h):
    from html import unescape
    return ' '.join(unescape(re.sub(r'<[^>]+>', ' ', h)).split())


def rebuild(path, lang):
    h = open(path, encoding='utf-8').read()
    if 'class="ppl"' in h:
        return 'deja migre'
    gab_html, gab_old = gabarit(h, lang)
    t = T[lang]
    secs = sections(lang, gab_html)
    i = h.find('<main')
    i = h.find('>', i) + 1
    j = h.find('</main>')
    stub = (f'<div class="hero"><div class="wrap"><nav><a href="{"/" if lang == "fr" else "/index-en"}">{t["home"]}</a>'
            f'<span aria-current="page">{t["crumb"]}</span></nav><span class="kick">{t["kick"]}</span><h1>{t["h1"]}</h1>'
            f'<p class="lead">{t["lead"]}</p></div></div>'
            + ''.join(f'<section id="{sid}"><h2>{lab}</h2><p>.</p></section>' for (sid, _), lab in zip(secs, t['nav'])))
    open(path, 'w', encoding='utf-8').write(h[:i] + stub + h[j:])
    vt = G.visible_text
    G.visible_text = lambda s: 'x'  # contenu entierement reecrit : controle propre ci-dessous
    try:
        G.rebuild(path, lang, 'lac-tchad-espace')
    finally:
        G.visible_text = vt
    h = open(path, encoding='utf-8').read()
    # heros sobre (sans photographie)
    h = re.sub(r'<img class="pp-hero-img"[^>]*>', '', h, count=1)
    h = re.sub(r'<link rel="preload" as="image" href="/assets/img/p/[^"]*"[^>]*>\n?', '', h, count=1)
    h = h.replace('<header class="pp-hero pp-hero-s"', '<header class="pp-hero pp-hero-s pp-hero-plain"', 1)
    a = h.find('</nav>', h.find('<nav class="pp-sub"')) + len('</nav>')
    b = h.find('<script id="pp-sub-js">')
    assert a > len('</nav>') and b > a, path
    body = []
    for k, (sid, html) in enumerate(secs):
        cls = ' class="pp-mist"' if k % 2 else ''
        hid = re.search(r'<h2 id="([^"]+)"', html).group(1)
        body.append(f'<section id="{sid}"{cls} aria-labelledby="{hid}"><div class="pp-wrap">{html}</div></section>')
    h = h[:a] + '\n' + '\n\n'.join(body) + '\n' + h[b:]
    h = re.sub(r'[ \t]+\n', '\n', h)
    # controle : la section « Gabarit de page » garde son texte mot pour mot (hors numero 08)
    if words(gab_old) != words(gab_html).replace('08 · ', '', 1):
        raise SystemExit(f'{path} : texte du gabarit modifie')
    open(path, 'w', encoding='utf-8').write(h)
    return f'{len(h)} octets, {len(secs)} sections'


if __name__ == '__main__':
    for p, lang in PAGES:
        print(p, rebuild(p, lang))
