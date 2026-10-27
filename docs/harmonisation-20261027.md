# Harmonisation de l'apparence — 27 octobre 2026

Demande du DG : « harmoniser le site », précisée en « même apparence partout ».
Référence retenue : l'en-tête commun (146 px) et le pied de page sombre `pft`, partagés par 10 gabarits sur 14.

## Lot 58 — pied de page (46 pages)

- 37 pages : le bloc en ligne `rootland-css` donnait `margin-right:16px` à tous les liens du pied ; les icônes
  sociales s'écartaient et le bouton de partage passait seul à la ligne. Règle ajoutée :
  `footer .foot-social>a{margin-right:0}`.
- 9 pages : `.foot-legal` en police mono (`var(--fm)`) → police du texte (`var(--fb)`).

## Lot 59 — Newsletter (FR/EN), Demande reçue (FR/EN), 404

- Gabarit propre (`svc-top` / `svc-foot`) remplacé par le gabarit commun, à partir de `mentions-legales(.html|-en.html)` :
  métadonnées propres conservées (title, description, robots, canonical, alternate), contenu reconstruit avec
  les composants standard (`pp-hero pp-hero-plain`, `pp-k`, `pp-sublead`, `pp-actions`, `pp-btn`, `pp-link`, `pp-prose`),
  lien de langue vers l'autre version de la page. Script : `/root/work/l31/lot59.py` (originaux conservés).

### Hausse du budget de performance, acceptée par le DG

Ces 5 pages prennent le poids des autres pages du site (mesure du budget statique) :

| Mesure (par page) | Avant | Après |
| --- | --- | --- |
| HTML (gzip) | 3,1-3,2 Ko | 19,2-19,6 Ko |
| CSS (gzip) | 3,4 Ko | 114,1 Ko |
| JS (gzip) | 0 Ko | 36,0-50,5 Ko |
| Feuilles bloquantes | 2 | 5 |

Décision du DG du 27 octobre 2026 : hausse acceptée (cohérence visuelle prioritaire ; pages utilitaires en `noindex`).
Ce commit porte `[budget]` ; l'export OVH compare chaque commit à son parent et reprend donc le lot 59 avec ce commit.

## Non traité à ce stade

- Essentiel et Investor Center : contenu riche au style propre ; le passage au gabarit commun demande une refonte.
- Pages arabes (en-tête) et héros de l'Atlas : lots suivants.
