# Correctifs QA — 19 juillet 2026 · ✅ PUBLIÉS

**Statut : publiés sur GitHub (commits 52da6d5, a8b0c55, 4b0fde8, 496f56a) et vérifiés en production le 19/07/2026.**
Correctif supplémentaire découvert à la publication : `/assets/*` est servi `immutable, max-age=1 an` (vercel.json), donc un asset modifié en place ne se propageait pas — le service worker revalide désormais les assets (`cache:'no-cache'`, version `et-202607190003`). Ce dossier est conservé comme archive de référence.

Ces 9 fichiers sont basés sur la **dernière version en ligne** (GitHub `bmlemad/EnerTchad`, commit `5a8644d`) + les correctifs QA. 
⚠️ Votre dossier local `EnerTchad-site` est resté à une version plus ancienne (commit local du 2-3 juillet, historique divergent de GitHub) — ne mélangez pas : c'est GitHub qui fait foi pour le site déployé.

## Fichiers corrigés (à uploader sur GitHub en conservant les chemins)

| Fichier | Correctif |
|---|---|
| `assets/chrome/s_2ffe40dff9.js` | La pastille du sommaire latéral n'embarque plus les compteurs dynamiques → « Ma commande » au lieu de « Ma commande 0 article » figé (boutique FR & EN) |
| `en.html` | KPI « 8 integrated poles » → **7** (aligné sur la référence FR) |
| `ar.html` | KPI « 8 أقطاب » → **7** + carte المنبع enrichie (mention géosciences/labo, champ numérique, packs par phase, en arabe) |
| `plan-du-site.html` | Suppression du doublon « Configurateur de service v2 (bêta) » |
| `sw.js` | Revalidation des assets (`cache:'no-cache'`) + version `et-202607190003` — indispensable car `/assets/*` est immutable 1 an |
| `index.html` | Héros de l'accueil : ajout du CTA B2B « Devenir client → » (vers /clients) à côté d'« Investir » |
| `clients.html` | Offre Opérateur E&P : e-mail unifié `amont@` → `contact@` + nouveau CTA « Packs par phase de champ → » vers /amont/services-ep#packs-phase |
| `amont/services-ep.html` | **Enrichissement offre E&P** : 4 nouvelles sections — Géosciences & laboratoire (carottage, PVT, modélisation, FDP), Interventions avancées (sand control, well testing, NDT, diagnostics fond), Le champ numérique (surveillance 24/7, SCADA, jumeau, reporting), et 5 packs par phase de champ avec liens vers le configurateur pré-réglé. Grille « Parcourir cette page » passée de 2 à 6 thématiques. |
| `amont/services-ep.html` (v2) | **Réorganisation E&P** : routeur « Par où commencer ? » (3 entrées + configurateur), packs par phase remontés en tête, thématiques renumérotées, CTA héros « Par où commencer ↓ » |
| `assets/chrome/c_abd9013c3955.js`, `c_df4f446df566.js`, `s_c07e811055.js` | Recherche Ctrl+K : indexation des 5 entrées E&P (orientation, packs, géosciences & labo, interventions avancées, champ numérique) |
| `services-ep-en.html` | Parité anglaise : section « Beyond the eight services — geoscience, digital and field-life packs » (version condensée des 4 axes) insérée avant « Go deeper », dans le pattern de la page EN. |

## Comment publier
Sur github.com/bmlemad/EnerTchad : « Add file → Upload files », en déposant les fichiers **avec la même arborescence** (`s_2ffe40dff9.js` doit aller dans `assets/chrome/`). Vercel redéploiera automatiquement.

## Glitch de scroll du Configurateur v2 : retiré
Enquête complémentaire : le « rendu vide transitoire au scroll » observé était très probablement un artefact de l'environnement de test (fenêtre Chrome masquée → animations suspendues), pas un bug du site. Aucun correctif nécessaire.

## Note CI
Le script `scripts/check_integrity.py` signale déjà (avant ces correctifs) 144 liens `/_vercel/insights/script.js` : ce fichier n'existe qu'à l'exécution chez Vercel — faux positif à exclure dans le script si souhaité.

---

# Ajout — 20 juillet 2026 : systèmes design & mode clair · ✅ PUBLIÉS

**~35 commits (HEAD ~840), SW `et-202607200015`.** Séance : critique design, QA mobile, SEO, parcours expert, feuille d'impression, mode clair en 4 cercles, validation axe AA.

## Les systèmes ajoutés (à connaître pour maintenir)

### 1 · Mode clair — deux mécanismes, un fichier de gouvernance chacun
- **Carnets (46 pages)** : classe `html.et-jlight`, bouton ☀ injecté dans `.jtop`. JS et thème dans `assets/chrome/u_cd226c00eb4b.js` + `x_cd256286824c.css`. Fonctionne par **redéfinition des variables** `--bg/--ink/--gold…` du `:root` des journaux.
- **89 autres pages** : classe `html.et-plight`, bouton fixe en bas à gauche. **La liste blanche des chemins vit dans `u_cd226c00eb4b.js`** (`var PAGES=[…]`) — pour ajouter une page au mode clair : ajouter son chemin (sans `.html`, sans `/index`) ET vérifier le rendu + axe avant.
- **Préférence unifiée** : les deux clés localStorage (`et-jlight` / `et-plight`) sont écrites ensemble à chaque bascule et lues l'une comme repli de l'autre — le choix suit le visiteur entre carnets et pages classiques.
- **Auto-thème** : sans choix stocké, `prefers-color-scheme: light` applique le clair automatiquement ; le bouton ☀ reste prioritaire dans les deux sens.

### 2 · Les règles d'or du thème clair (durement apprises)
- **Spécificité** : les thèmes de page utilisent `!important` ; les règles claires les battent avec `:not(#_)` (niveau ID) et, pour surclasser une règle claire antérieure, `:not(#_):not(#__)` (2 niveaux).
- **`-webkit-text-fill-color`** : si une exception force le fill (héros), tout correctif couleur ultérieur doit AUSSI écraser le fill — sinon le texte est peint d'une couleur que `getComputedStyle().color` ne montre pas. Seul axe voit la vérité.
- **Sections hors `<main>`** : certaines pages (cibles-2030) posent leurs sections sous `<body>` — les règles existent en double (`main …` et `body>section …`).
- **Fonds semi-transparents sombres** (pieds de page, bandes CTA) deviennent gris illisibles sur body crème → forcés en sombre plein sous thème clair.
- **Restent sombres par choix** : nav, héros photo (`.pghero` avec exceptions de texte clair), pieds de page, pastilles de sommaire — repères de marque.
- **Hors périmètre (11 pages)** : accueils FR/EN/AR, boutique FR/EN, outils React, explorateur, 404. L'accueil échoue structurellement (carrousel en `background-image`, effets de titre).

### 3 · Feuille d'impression
Bloc `@media print` en fin de `x_917896c622c8.css` (143 pages) : fond blanc, chrome masqué, `.reveal` forcés visibles, URLs des liens externes imprimées. Mêmes astuces de spécificité.

### 4 · Recherche Ctrl+K
Index de base dans `c_abd9013c3955.js` (FR) / `c_df4f446df566.js` (EN) + **extension `cmdk_extra.js`** (`window.CMDK_EXTRA`, 120 entrées dont 5 ancres profondes ESG/alerte/anti-fraude/avertissements/arabe). Pour ajouter une entrée : objet `{c,id,t,k,url}` dans le JSON de `cmdk_extra.js`.

### 5 · SEO
`robots.txt` créé (pointe sitemap). Les deux accueils EN : `/index-en` est le canonique, `/en` (hub) canonise vers lui et est hors sitemap. Ne pas réintroduire `/en` dans le sitemap.

### 6 · Rappels de publication
- Tout changement sous `/assets/*` ⇒ **bump de `const V='…'` dans `sw.js`** (immutable 1 an).
- Intégrité CI : la base est passée de 144 à **145** faux positifs (`impact.html` ajouté au dépôt, même motif `/_vercel/insights`). Tout autre chiffre = régression.
- Validation du thème clair : axe-core AA **classe claire activée** — le détecteur « texte clair sur clair » ne suffit pas.
