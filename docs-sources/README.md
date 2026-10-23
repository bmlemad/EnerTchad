# Sources des documents PDF

Sources HTML paginees (A4) des documents publies a la racine du site.
Generation : Chromium headless -> PDF (printBackground, marges nulles).

- brochure_print.html -> /Brochure_EnerTchad.pdf (régénéré au lot 24, octobre 2026)
- brochure_print_en.html -> /Brochure_EnerTchad_EN.pdf (régénéré au lot 24, octobre 2026)
- fiche_ar.html -> /Fiche_EnerTchad_AR.pdf (régénéré au lot 24, octobre 2026)
- fiche_intermediaire.html -> /Fiche_Technique_Intermediaire_EnerTchad.pdf (régénéré au lot 25, octobre 2026 ; date de la fiche corrigée)
- fiche_investisseur.html -> /Fiche_Investisseur_EnerTchad.pdf (lot 18, octobre 2026)
- fiche_aval.html -> /Fiche_Technique_Aval_EnerTchad.pdf (lot 22, octobre 2026 ; contenu repris des pages /aval)
- fiche_amont_en.html -> /Fiche_Technique_Amont_EnerTchad_EN.pdf (lot 23, octobre 2026 ; contenu repris des pages Amont EN : /pole-amont-en, /amont/*-en ; régénéré au lot 25 : éthique, délai de réponse, source du taux d'eau)
- fiche_amont.html -> /Fiche_Technique_Amont_EnerTchad.pdf (régénéré au lot 25, octobre 2026 ; source du taux d'eau)
- point_etape_print.html -> /Point_Etape_EnerTchad_2026.pdf (régénéré au lot 19, octobre 2026)

# Gabarit masqué : biographies du conseil (gouvernance, lot 25)

gouvernance.html et gouvernance-en.html contiennent, après la section « Comités & documents », une section
<section id="biographies-conseil" hidden ...> : sept cartes (PCA, DG et les cinq autres mandats définis :
Finance & IFRS, Technique & opérations, HSE-Q, Conformité & juridique, Relations investisseurs) avec nom,
fonction, parcours en trois lignes, mandats, indépendance (oui / non) et comité(s). Aucun contenu biographique
n'y figure : chaque champ à remplir porte l'attribut data-a-completer et le texte « À compléter » / « To be completed ».
Tant que l'attribut hidden est présent, la section n'est ni affichée, ni lue par les lecteurs d'écran, ni
reprise dans les index de recherche du site (ftx_*.json, recherche-*.json, palette), le sitemap ou llms.txt.

Activation (FR et EN ensemble) :
1. Remplir chaque champ marqué data-a-completer avec des informations validées par l'intéressé, puis retirer
   l'attribut data-a-completer du champ rempli ; un mandat non pourvu se retire (supprimer sa carte).
   Contrôle : grep -c data-a-completer gouvernance.html gouvernance-en.html doit afficher 0.
2. Retirer le seul attribut hidden de la balise <section id="biographies-conseil"> dans les deux pages.
3. Mettre à jour la phrase « … sera publiée ici — noms, parcours, indépendance et présence en comité … »
   de la section « Comités & documents », l'index plein texte (assets/chrome/ftx_fr.json, ftx_en.json) et
   le lastmod des deux pages dans sitemap.xml.
4. Relancer les contrôles (npm run build, audits, axe clair/sombre sur /gouvernance et /gouvernance-en).
