# Refonte de la cascade par étapes — outillage (lot 105, 2 novembre 2026)

Retirer les `!important` et les chaînes `:not(#id)` qui ne décident jamais d'un style, sans changement visible.
Décision du DG après le cadrage du 2 novembre (registre n° 1288–1289) ; critère durci sur avis de l'advisor
(registre n° 1290) : un différentiel pixel nul ne suffit pas, il faut un veto par sur-approximation et une
vérification par styles calculés.

## Chaîne d'outils (à la racine du dépôt, après `npm run build` et un serveur local sur l'export)

1. `node scripts/css/cascade_candidates.mjs pole-premium.css,premium-chrome.css,bundle_core_a1.css > scripts/css/cascade/work/cands.json`
   — règles des feuilles cibles, dans l'ordre, avec leurs déclarations.
2. `EXPORT_DIR=out CASCADE_DIR=scripts/css/cascade/work python3 scripts/css/cascade/veto.py run http://localhost:8802/`
   — pour chaque page × thème (clair 1440, sombre 1440, clair 412), `veto_page.js` cherche dans la page un concurrent
   qui l'emporterait après retrait : toutes feuilles et blocs, media queries ignorées, états transitoires ignorés
   (`state_tokens.json` : classes et attributs posés par script ; pseudo-classes de survol, focus, activation…),
   styles en ligne, `all:`, abrégées contenant `var()` (valeur inconnue = concurrent), déclarations d'un même
   bloc qui se recouvrent (traitées ensemble par `prune_by_decisions.mjs`).
3. `python3 scripts/css/cascade/veto.py merge` → `work/decisions.json` ; règles dures (`hard_rules.json`) : jamais
   une propriété animée par un `@keyframes` du site ; les règles écartées par le navigateur restent intactes.
4. `node scripts/css/prune_by_decisions.mjs scripts/css/cascade/work/decisions.json --apply`
   — feuilles et copies critiques (`scripts/critical/*.json`, empreintes `?v=` recalculées).
5. Vérification : `python3 scripts/css/cascade/cs_verify.py <base avant> <base après> <dossier>` puis
   `… report <dossier>` — styles calculés de chaque élément et pseudo-élément, 260 pages × (clair 1440, sombre 412),
   12 pages × 11 états (1024, menu ouvert, survol et focus forcés, volet mobile, défilé), relevés A et B
   alternés, trois tentatives puis relevé détaillé ; le site a quelques états transitoires (couleur du pied de
   page selon l'ordre d'exécution des scripts différés) qui apparaissent dans les deux sens et se vérifient
   un par un. Puis `m76/pixdiff2.py` (116 captures) et la boucle CI.

`cascade_audit.py` (audit dynamique par CSS.getMatchedStylesForNode, première approche) reste dans m76 à titre
d'archive : il ne suffisait pas (contextes non échantillonnés).

## Étape 2 (8 novembre 2026, base bd731649e) : résultats et deux pièges corrigés

Neuf feuilles traitées (`nav_a`, `bundle_head_b2`, `plight_extrait`, `x_cd256286824c`, `clients-modern`, `x_917896c622c8`,
`fond647`, `hub-nav-lisible-a`, `hub-nav-lisible-b`) : 1 002 `!important` et 615 chaînes `:not(#…)` retirés, 5 435 copies
critiques mises à jour, 265 laissées intactes parce qu'ambiguës. Décisions : `work2/decisions.json` (candidats :
`work2/cands.json`). Les budgets de `qa/css-debt-budget.spec.js` ont été remesurés à la baisse.

Deux pièges relevés pendant l'étape 2, corrigés dans `veto.py` et `veto_page.js` :

- Propriétés logiques et physiques : `margin-left`, `margin-inline-start`, `inset-inline-end`, `width`/`inline-size`…
  forment des familles dont les membres se départagent par l'ordre d'apparition, pas par la spécificité. Un concurrent
  de la famille compte donc comme concurrent (`FAM` dans `veto_page.js`). Les sélecteurs relatifs (`:has(> a)`) gardent
  leur combinateur de tête.
- Règles non retrouvées dans le CSSOM d'une page qui charge pourtant la feuille (sérialisation différente, comme
  `:nth-child(even)` → `2n`, ou règle écartée par le navigateur) : non évaluables, donc laissées intactes. `merge()`
  les compte et les affiche (« règles non évaluables, laissées intactes »).

Vérification : 652 chargements comparés (260 pages), 94 écarts apparents ; rejoués un par un sans charge, 88
disparaissent et les 6 restants sont de la gigue de mesure (largeurs à 0,03–0,17 px, transitions figées à des instants
différents). Ne pas lancer `cs_verify.py` en plusieurs processus sur une machine à deux cœurs sans rejouer les écarts
en série : la charge fait apparaître des écarts de transition dans les deux sens. Un test qui épingle une chaîne
littérale d'une feuille traitée doit être mis à jour (cas de `qa/site.spec.js`, règle `.fil552 ~ .pole-subnav`).
