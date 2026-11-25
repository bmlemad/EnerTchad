# Sources des documents PDF

Sources HTML paginees (A4) des documents publies a la racine du site.
Generation : Chromium headless -> PDF (printBackground, marges nulles).

- brochure_print.html -> /Brochure_EnerTchad.pdf (régénéré au lot 24, octobre 2026)
  - 18 novembre 2026 : les deux brochures (FR et EN) passent de « 3 + 4 · trois pôles de cœur » à « 4 + 4 · quatre segments industriels », comme la fiche investisseur, le point d’étape et le site ; régénérées avec la police DejaVu Sans imposée au rendu (témoin : les sources d’avant modification redonnent un texte identique aux PDF publiés)
- brochure_print_en.html -> /Brochure_EnerTchad_EN.pdf (régénéré au lot 24, octobre 2026)
- fiche_ar.html -> /Fiche_EnerTchad_AR.pdf (régénéré au lot 24, octobre 2026)
- fiche_intermediaire.html -> /Fiche_Technique_Intermediaire_EnerTchad.pdf (régénéré au lot 25, octobre 2026 ; date de la fiche corrigée)
- fiche_investisseur.html -> /Fiche_Investisseur_EnerTchad.pdf (lot 18 ; régénéré au lot 98, novembre 2026 : 4 + 4, millésime ; 21 novembre 2026 : phrase Monnaies)
- fiche_aval.html -> /Fiche_Technique_Aval_EnerTchad.pdf (lot 22, octobre 2026 ; contenu repris des pages /aval)
- fiche_amont_en.html -> /Fiche_Technique_Amont_EnerTchad_EN.pdf (lot 23, octobre 2026 ; contenu repris des pages Amont EN : /pole-amont-en, /amont/*-en ; régénéré au lot 25 : éthique, délai de réponse, source du taux d'eau)
- fiche_aval_en.html -> /Fiche_Technique_Aval_EnerTchad_EN.pdf (17 novembre 2026 ; traduction de fiche_aval.html, même contenu, page 2 légèrement resserrée ; police DejaVu Sans imposée au rendu comme pour les fiches publiées)
- fiche_intermediaire_en.html -> /Fiche_Technique_Intermediaire_EnerTchad_EN.pdf (17 novembre 2026 ; traduction de fiche_intermediaire.html, même contenu)
- fiche_amont_en.html : régénéré le 17 novembre 2026 pour corriger « EnerChad » en « EnerTchad » dans le pied de la page 1
- fiche_amont.html -> /Fiche_Technique_Amont_EnerTchad.pdf (régénéré au lot 25, octobre 2026 ; source du taux d'eau)
- point_etape_print.html -> /Point_Etape_EnerTchad_2026.pdf (régénéré au lot 98, novembre 2026 : titulaires nommés, 33 carnets)
  - 25 novembre 2026 (suite) : fiches Intermédiaire FR et EN régénérées — « Trois fonctions techniques et l’ingénierie, au service du pôle » ; même impression, pages par ailleurs identiques au pixel près.
  - 25 novembre 2026 (formule validée par le DG : cinq segments et trois fonctions techniques ; positionnement « groupe énergétique intégré en construction » du 24 novembre) : brochures FR et EN, fiche investisseur et point d’étape régénérés ; brochure : chaîne en cinq blocs, page 3 en cinq segments (EnerConseils devient « Ingénierie & Services »). Impression Google Chrome for Testing 153 (Chromium headless, fonds imprimés, marges nulles), Segoe UI et Consolas rendus en DejaVu Sans et DejaVu Sans Mono par des @font-face injectés au rendu. Témoin : la fiche investisseur d’avant modification redonne des pages identiques au pixel près au PDF publié ; les six fiches techniques, non modifiées, sont identiques à leurs sources et ne sont pas régénérées. Le kit presse reprend les deux brochures, la phrase-type officielle FR et EN, la fiche de presse et la bannière à jour. La fiche AR et les fiches techniques (« fonctions techniques au service du pôle ») restent à reprendre.
  - 24 novembre 2026 (vocabulaire « fonctions techniques », PR #278) : brochures FR et EN, fiche investisseur, fiches Intermédiaire FR et EN et point d’étape régénérés ; impression Google Chrome for Testing 153 (Chromium headless, fonds imprimés, marges nulles) avec Segoe UI et Consolas rendus en DejaVu Sans et DejaVu Sans Mono. Témoin : les six sources d’avant modification redonnent des pages identiques au pixel près aux PDF publiés (le Chromium 140 de Playwright, lui, diffère sur le tramage d’un dégradé). Le kit presse reprend les deux brochures, la fiche presse à jour et la phrase-type officielle de /communiques#presse (l’ancienne datait d’avant le redécoupage du 22 novembre). La fiche AR garde « قدرات مدمجة » en attendant la relecture arabe native. Le Data Book investisseur (classeur sans source dans ce dossier, retouché cellule par cellule) suit le même jour : fonctions techniques, segments du 22 novembre, intitulés de l’allocation cible repris de /investisseurs (parts inchangées), première mini-raffinerie à Moussoro, oléoduc Doba–Kribi exploité par des tiers et sans brut d’EnerTchad ; hauteurs de lignes ajustées pour que les textes ne soient plus tronqués.
  - 22 novembre 2026 (redécoupage des segments : Raffinage & pétrochimie, Distribution) : brochures FR et EN, fiches techniques « Produits raffinés » (ex-Raffinage & distribution) FR et EN et point d’étape régénérés ; impression Chromium headless avec Segoe UI et Consolas rendus en DejaVu Sans et DejaVu Sans Mono (contrôle : la fiche EN inchangée réimprimée ainsi est identique au pixel près à la version publiée).
  - 21 novembre 2026 (doctrine du DG : priorité au marché national, aucun export tant que le Tchad importe ses carburants) : fiche investisseur, fiches Intermédiaire FR et EN et brochures FR et EN régénérées ; le corridor Doba–Kribi y est décrit comme exploité par des tiers et comme option pour un éventuel surplus. Témoin : les cinq sources d’avant modification redonnent des pages identiques au pixel près aux PDF publiés. Le kit presse reprend les deux brochures.
  - 20 novembre 2026 : la fiche investisseur et le point d’étape précisent que la société est unique aujourd’hui et que le groupe intégré est une ambition à terme, comme la page Société ; régénérés avec DejaVu Sans et DejaVu Sans Mono imposées au rendu (témoin : les sources d’avant modification redonnent des pages identiques au pixel près aux PDF publiés). Le kit presse reprend la fiche de presse mise à jour et les brochures publiées le 18 novembre.

# Gabarit des biographies du conseil : hors du site publié (revue du 12 novembre 2026)

Le gabarit ne figure plus dans gouvernance.html ni gouvernance-en.html : même masqué, son texte
« À compléter » restait lisible dans le code de la page et par les moteurs de recherche. Il est conservé dans
docs-sources/gabarit_biographies_conseil.html et docs-sources/gabarit_biographies_conseil_en.html (dossier non publié).
Pour publier : remplir les champs comme décrit ci-dessous dans ces deux fichiers, retirer l'attribut hidden,
puis coller la section dans chaque page juste avant <script id="pp-sub-js">.
Le mode d'emploi d'origine suit, à lire avec cet emplacement.

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
- 22 novembre 2026 : brochures FR et EN et fiches Intermédiaire FR et EN régénérées ; le corridor Doba–Kribi n’est plus une option pour un surplus : aucun brut d’EnerTchad n’y transiterait, un éventuel surplus partirait en produits finis.
- 22 novembre 2026 : fiches Intermédiaire FR et EN régénérées ; corridor Douala–N’Djamena à 1 842 km (Banque mondiale) au lieu de 1 700 km.
- 22 novembre 2026 : point d’étape régénéré ; premier site de mini-raffinerie : Moussoro (Barh El Gazel), au lieu de « axe N’Djamena–Djermaya ».
