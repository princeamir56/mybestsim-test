# Étape 1 — Lecture du brief et profilage des données

Projet : test de recrutement MyBestSim — Stagiaire Développeur IA & Automatisation.
Auteur : Amir Kerkeni. Date : 4 novembre 2026.

Ce document est le constat brut. **Aucune décision n'est prise ici** : les arbitrages
sont tranchés à l'étape 2 et affichés dans le dashboard (panneau « Décisions & qualité
des données »).

Reproductible en une commande : `python scripts/profilage.py --ecrire`.
La sortie complète est versionnée dans [`profilage-sortie.txt`](profilage-sortie.txt),
de sorte que chaque chiffre cité ici soit vérifiable sans relancer quoi que ce soit.

---

## 1. Ce que demande le brief

**Partie 1 — Dashboard.** 6 statistiques imposées + bonus libre. Livrable : **en ligne,
ouvrable dans un navigateur sans rien installer**. Lien GitHub optionnel.

**Partie 2 — Article SEO** « Internet en croisière : quelle eSIM choisir ? » pour la
marque MyBestSim. **Pas de nombre de mots imposé — volontairement** : analyser la
concurrence et justifier la longueur fait partie de la note. Livrable : page web
hébergée. Un fichier joint est explicitement refusé.

**Évaluation** : résultat final / autonomie / méthodologie, dont l'usage de l'IA.
Le brief *encourage* l'agent IA. D'où `AI-USAGE.md`, tenu au fil de l'eau.

Phrase clé du brief : *« Si tu as un doute sur une consigne, fais un choix assumé et
explique-nous pourquoi. »* → c'est la justification directe du panneau « Décisions ».

---

## 2. Structure du jeu de données

| Constat | Valeur |
|---|---|
| Fichiers | 18 CSV, un par fournisseur |
| Lignes totales | **5 056** |
| Schéma | **1 seul schéma**, 12 colonnes, identique sur les 18 fichiers |
| Encodage | **UTF-8 propre** sur les 18 fichiers, sans BOM |
| Devise | `EUR` sur 100 % des lignes — aucune conversion nécessaire |
| SKU | **5 056 / 5 056 uniques**, préfixe toujours cohérent avec le fournisseur |
| `provider` | 1 seule valeur par fichier, jamais de mélange |
| Valeurs manquantes | **une seule colonne concernée : `data_gb`** (653 vides) |

Colonnes : `sku, provider, product_name, country_code, country_name, data_gb,
data_display, validity_days, price, currency, network, top_up`.

Volumes par fournisseur : Airalo 722, Ubigi 562, eSIMX 432, Saily 382, GigSky 342,
Nomad 312, Instabridge 282, aloSIM 262, Holafly 242, Yesim 222, Jetpac 212,
Truphone 202, JamboSIM 182, Yatelo 162, Maya Mobile 152, Roamic 122, 4S eSIM 92.

Domaines fermés constatés : `validity_days` ∈ {7, 15, 30} · `data_gb` ∈ {1, 3, 5, 10,
20, 50} ou vide · `network` ∈ {4G, 5G} · `top_up` ∈ {oui, non} · 54 `country_code`.

---

## 3. Verdict sur tes trois pièges

### Piège 1 — `country_code` « NA » : **CONFIRMÉ, tel que décrit**

- 192 lignes portent `country_code == "NA"`, et leur `country_name` est **« Amérique du
  Nord » sur les 192 sans exception**. Ce n'est donc pas une valeur manquante.
- Contre-test exécuté : `pd.read_csv()` **sans** `keep_default_na=False` produit
  **exactement 192 NaN** sur cette colonne. Le piège est réel et se déclenche par défaut.
- Ampleur réelle : « NA » est le 3ᵉ code le plus fréquent du catalogue. Le perdre
  supprimerait 3,8 % des lignes d'une répartition géographique.
- Décision technique appliquée partout : `keep_default_na=False` + lecture en `str`.

### Piège 2 — 653 `data_gb` vides = « Illimité » : **CONFIRMÉ, tes chiffres sont exacts**

J'ai retrouvé tes quatre nombres à la décimale près :

| | Ton chiffre | Recalculé |
|---|---|---|
| Lignes concernées | 653 (12,9 %) | **653 — 12,92 %** |
| Moyenne Go en excluant | 14,49 | **14,4915** |
| Moyenne Go en comptant 0 | 12,62 | **12,6199** |
| Prix moyen des illimités | 60,81 € | **60,81 €** |
| Prix moyen global | 29,30 € | **29,3013 €** |

Trois précisions que l'analyse ajoute :

- `data_display` vaut **« Illimité » sur les 653 lignes, sans aucune exception** : la
  valeur vide est systématiquement explicable, ce n'est jamais un trou de données.
- Les 653 sont réparties sur **les 18 fournisseurs**. Aucun fournisseur n'est épargné,
  donc exclure les illimités déforme *tous* les fournisseurs, pas seulement certains.
- Le prix médian est encore plus parlant que la moyenne : **51,28 € contre 17,57 €**
  pour les forfaits limités.

### Piège 3 — doublons : **CONFIRMÉ sur les 618, mais ta mention de « 2 doublons exacts » est fausse**

- Les **618 couples (fournisseur, nom de produit) portant plusieurs prix** : confirmés.
  Ils représentent **1 347 lignes**.
- En revanche : **il n'existe aucun doublon exact dans ce jeu de données.** J'ai testé
  deux fois — sur toutes les colonnes, puis **sur toutes les colonnes en ignorant le
  SKU**. Résultat : **0 ligne** dans les deux cas.
- Ce que tu as probablement vu : **2 couples (fournisseur, nom) répétés avec le *même*
  prix** — `Airalo / eSIM Pologne 10 Go 30 jours` à 24,77 € et `Yatelo / eSIM
  États-Unis 3 Go 15 jours` à 9,77 €. Ce ne sont pas des doublons : dans les deux cas
  les lignes **diffèrent sur `network` et `top_up`** (4G/oui vs 5G/non). Ce sont des
  variantes qui se trouvent être au même tarif.

J'ai creusé plus loin, parce que « variante ou saleté ? » ne se tranche pas au niveau du
nom. Sur les 618 groupes multi-prix, en regardant si `country_code`, `data_gb`,
`validity_days`, `network` ou `top_up` varient à l'intérieur du groupe :

| | Groupes | Lignes |
|---|---|---|
| Au moins un attribut distingue les lignes → **variante défendable** | **457** | 1 011 |
| **Aucun attribut ne varie, seul le prix change** → inexplicable par le schéma | **161** | **336** |

Exemple du second cas : `4S eSIM / eSIM Autriche 3 Go 30 jours`, deux SKU, 3 Go, 30
jours, 4G, top-up non — et pourtant 11,98 € et 11,39 €.

Mesure de l'écart intra-groupe (max−min, en % du min) : **médiane 6,8 %**, moyenne
8,1 %, maximum 56,1 %. Seuls 8 groupes dépassent 30 %.

**Lecture :** un écart médian de 6,8 % n'est pas une erreur de saisie, c'est une
amplitude de pricing normale (dates d'import différentes, promo, canal de vente). La
conclusion que je défendrai à l'étape 2 : **ce sont des offres réelles, pas de la
saleté — on ne déduplique pas.** Mais le panneau du dashboard affichera le chiffre
alternatif, parce que la question est légitime.

---

## 4. Pièges que tu n'avais pas listés

### A. Les 56 produits à plus de 100 € sont **tous** des forfaits illimités

100 % des 56. Ils sont aussi **tous** en validité 30 jours et **tous** régionaux ou
mondiaux (Europe 16, Asie 16, Amérique du Nord 13, Monde 11). Aucun forfait à volume
limité n'atteint 100 € dans tout le catalogue.

**Pourquoi ça compte :** le KPI n°2 du brief et ton piège n°2 portent sur la **même
population**. Un candidat qui « nettoie » en excluant les lignes sans `data_gb` obtient
mécaniquement **« 0 produit à plus de 100 € »** — une réponse fausse à une question
imposée, sans jamais voir le lien. C'est le piège le plus coûteux du jeu de données, et
il est invisible si on traite les deux questions séparément.

Le chiffre qui rend la chose spectaculaire : **le forfait à volume limité le plus cher
de tout le catalogue coûte 99,39 €**. La frontière des 100 € tombe pile dans
l'intervalle vide qui sépare les forfaits limités des illimités. Ce n'est pas un
hasard de données, c'est la structure du marché — et c'est ce qui rend l'erreur
silencieuse.

Confirmation de ton point : **aucun produit ne coûte exactement 100,00 €** (vérifié),
donc « plus de » et « au moins » donnent le même 56.

### B. « Nombre total de produits » n'a pas une réponse, il en a quatre

Le brief demande « le nombre total de cartes eSIM (produits) ». Selon la définition :

| Définition | Valeur |
|---|---|
| Lignes / SKU uniques | **5 056** |
| Combinaisons d'attributs distinctes (hors SKU) | **5 056** |
| Offres distinctes (fournisseur + nom + prix) | 5 054 |
| Références commerciales (fournisseur + nom) | **4 325** |

L'écart 5 056 → 4 325 est exactement le piège n°3. Le fait que « toutes colonnes hors
SKU » redonne 5 056 est la preuve mathématique qu'aucune ligne n'est redondante.

### C. La moyenne de Go est trompeuse même une fois les illimités tranchés

`data_gb` n'est pas une grandeur continue : c'est un **palier à 6 valeurs** (1, 3, 5,
10, 20, 50). **Moyenne 14,49 Go mais médiane 5 Go** — l'écart vient du palier 50 Go qui
tire tout vers le haut. Publier la seule moyenne donne une image fausse du catalogue
réel. Le dashboard affichera moyenne **et** médiane **et** la distribution des paliers.

### D. 4 des 54 « pays » sont en réalité des zones

`EU` (Europe, 206), `AS` (Asie, 194), `NA` (Amérique du Nord, 192), `WW` (Monde, 186) —
**778 lignes, 15,4 % du catalogue**. Les 50 autres codes sont de vrais pays ISO-2. Une
« répartition par pays » qui mélange les deux compare des choses non comparables. Et
l'écart de prix est net : **42,51 € en moyenne pour le régional contre 26,90 € pour le
mono-pays**.

### E. `data_display` et `product_name` n'apportent aucune information

Vérifié ligne à ligne : `data_display` est **toujours** exactement `"{data_gb} Go"` ou
`"Illimité"` (0 exception sur 5 056), et `product_name` reflète **toujours** le pays, le
volume et la validité (0 exception sur 5 056). Conséquence pratique : **aucun parsing de
texte libre n'est nécessaire** — tout est déjà dans les colonnes typées. C'est une bonne
nouvelle, mais il fallait le prouver avant de s'appuyer dessus.

### F. Fausse piste que j'ai levée : l'encodage

Mon premier passage affichait `Am?rique du Nord` et j'ai cru à un problème d'encodage
des fichiers. **C'était faux.** Les octets bruts sont `Am\xc3\xa9rique`, soit de l'UTF-8
valide, et les 18 fichiers se décodent en UTF-8 sans la moindre erreur. Le charabia
venait de la **console Windows en cp1252**, pas des données. Consigné dans [`../AI-USAGE.md`](../AI-USAGE.md)
parce que c'est exactement le genre de conclusion qu'il ne faut pas tirer trop vite.

---

## 5. Statistiques de cadrage (chiffres à valider formellement à l'étape 2)

- Prix : min **5,36 €** (`aloSIM / eSIM Irlande 1 Go 7 jours`) → max **154,63 €**
  (`aloSIM / eSIM Europe Illimité 30 jours`). Moyenne 29,30 €, médiane 20,70 €.
- 4G 3 302 (65,3 %) / 5G 1 754 (34,7 %). Rechargeable : oui 2 738 (54,2 %).
- **Prime de l'illimité, par durée** (prix médians) : 7 j ×2,12 · 15 j ×2,80 · 30 j
  ×3,66. Plus la durée est longue, plus l'illimité se paie cher.
- **€/Go médian par fournisseur** (hors illimité) — classement de valeur, le plus
  intéressant commercialement : JamboSIM 2,34 (meilleur) → 4S eSIM 2,93 (le plus cher).
  Resserré, mais c'est un écart de 25 % entre les extrêmes.

---

## 6. Ce qui est tranché à l'étape 2

1. Définition retenue de « nombre total de produits » (5 056 vs 4 325).
2. Traitement des 653 illimités dans la moyenne de Go.
3. Déduplication ou non des 618 groupes multi-prix.
4. Séparation ou non du régional et du mono-pays dans la vue géographique.

Chacun de ces quatre points ira dans le panneau « Décisions & qualité des données »,
avec le chiffre retenu **et** le chiffre alternatif.
