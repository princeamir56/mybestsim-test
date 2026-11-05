# Étape 2 — Les chiffres, et les quatre décisions qui les produisent

Les valeurs ci-dessous sont **définitives**. Elles alimenteront le dashboard sans être
recalculées : `scripts/statistiques.py` est la seule source.

Sortie brute complète : [`etape-2-chiffres.txt`](etape-2-chiffres.txt)
(`python scripts/statistiques.py --ecrire`).

---

## Les six statistiques demandées

| # | Statistique | Valeur |
|---|---|---|
| 1 | Nombre total de cartes eSIM | **5 056** produits, 18 fournisseurs |
| 2 | Produits à plus de 100 € | **56** |
| 3 | Fourchette de prix globale | **5,36 € → 154,63 €** (×28,8) |
| 4 | Moyenne de data par carte | **14,49 Go** *(sur les 4 403 forfaits à volume limité)* |
| 5 | Prix moyen global | **29,30 €** *(médiane 20,70 €)* |
| 6 | Répartition par fournisseur | Airalo 722 → 4S eSIM 92 *(tableau complet dans la sortie brute)* |

Trois précisions qui ne tiennent pas dans un tableau :

- **Les 56 produits à plus de 100 € sont tous des forfaits illimités**, tous en validité
  30 jours, tous régionaux. Le forfait à volume limité le plus cher du catalogue
  s'arrête à **99,39 €** — la barre des 100 € tombe exactement dans l'intervalle vide
  entre les deux familles de produits.
- **Le prix moyen (29,30 €) dépasse la médiane (20,70 €) de 42 %.** La distribution est
  tirée vers le haut par les illimités : 24,63 € de moyenne pour les forfaits limités
  contre 60,81 € pour les illimités.
- **La moyenne de 14,49 Go cache une médiane de 5 Go.** `data_gb` n'est pas continu,
  c'est un palier à six valeurs, et le palier 50 Go tire tout vers le haut.

---

## Les quatre décisions

Chacune est reprise telle quelle dans le panneau « Décisions & qualité des données » du
dashboard, avec son contrefactuel.

### D1 · Qu'est-ce qu'« un produit » ? → **5 056, un par SKU**

Les 5 056 SKU sont uniques, et surtout : dédupliquer sur **toutes les colonnes en
ignorant le SKU** ne retire **aucune ligne**. Chaque ligne est donc bien une référence
vendable distincte. C'est aussi la seule lecture qui corresponde à ce que le fournisseur
importe réellement.

> **Sinon :** 4 325 références commerciales (fournisseur + nom), soit 731 de moins
> (−14,5 %).

### D2 · Les 653 illimités dans la moyenne de Go → **exclus, et c'est dit**

**Compter un forfait illimité pour 0 Go est factuellement faux** : l'illimité, c'est
*plus* de data, pas moins. Les compter pour zéro ferait *baisser* la moyenne alors que
l'offre est supérieure. Il n'existe aucune valeur honnête à leur attribuer — la moyenne
de Go n'est pas *inconnue* sur cette population, elle est *indéfinie*.

La moyenne est donc calculée sur les 4 403 forfaits à volume limité, et **le dashboard
l'affiche libellée comme telle**, pas comme une « moyenne globale ».

> **Sinon :** 12,62 Go en les comptant pour zéro — 12,9 % d'écart créé de toutes pièces.

### D3 · Les 618 produits à plusieurs prix → **aucune déduplication**

Trois arguments convergents :

1. Il n'existe **aucun doublon exact**, même en ignorant le SKU.
2. Sur les 618 couples concernés, **457 se distinguent par un attribut réel** (4G/5G,
   rechargeable ou non).
3. L'écart de prix intra-couple est de **6,8 % en médiane**. C'est une amplitude de
   pricing — date d'import, promotion, canal de vente — pas une faute de saisie, qui se
   chiffrerait en ordres de grandeur.

Et un argument de fond : sur un comparateur, **le fait qu'un même produit existe à
plusieurs prix *est* l'information**. La supprimer, c'est détruire la valeur du produit.

> **Sinon,** en ne gardant que le prix le plus bas par référence : 4 325 produits ·
> prix moyen 29,16 € · **39 produits à plus de 100 € au lieu de 56** · moyenne 14,65 Go.

### D4 · Les zones géographiques → **séparées des pays**

Quatre codes sur 54 sont des zones de couverture (Europe, Asie, Amérique du Nord,
Monde). Une eSIM « Europe » et une eSIM « Espagne » ne sont pas deux lignes comparables
d'un même classement — et comme ce sont mécaniquement les 4 plus gros volumes (778
lignes, 15,4 %), les mélanger place quatre fausses « destinations » en tête de toute
répartition géographique.

L'écart de prix confirme qu'il s'agit d'un autre marché : **42,51 € en moyenne contre
26,90 €** en mono-pays, pour un volume de data quasi identique.

> **Sinon :** « 54 destinations », avec Europe, Asie, Amérique du Nord et Monde aux
> quatre premières places.

---

## Les statistiques bonus

Choisies pour ce qu'elles disent au client d'un comparateur, pas pour leur élégance
statistique.

### B1 · Classement de valeur : €/Go médian par fournisseur

La question qu'un visiteur se pose vraiment : *chez qui le Go coûte-t-il le moins cher ?*

| # | Fournisseur | €/Go médian | vs meilleur |
|---|---|---|---|
| 1 | JamboSIM | 2,338 € | — |
| 2 | Yesim | 2,353 € | +0,7 % |
| 3 | aloSIM | 2,368 € | +1,3 % |
| … | … | … | … |
| 17 | Airalo | 2,764 € | +18,2 % |
| 18 | 4S eSIM | 2,928 € | **+25,2 %** |

Le marché est resserré, mais le classement est stable. À noter : **Airalo, le plus gros
catalogue, est 17ᵉ sur 18 en valeur.**

### B2 · La prime de l'illimité monte avec la durée

| Durée | Illimité | Limité | Prime |
|---|---|---|---|
| 7 jours | 34,48 € | 16,28 € | ×2,12 |
| 15 jours | 50,05 € | 17,86 € | ×2,80 |
| 30 jours | 80,91 € | 22,10 € | **×3,66** |

Sur un court séjour l'illimité se discute ; sur un mois il se paie très cher.

### B3 · La 5G n'est pas un critère de choix

34,7 % des offres sont 5G. L'écart entre fournisseurs va de 30,2 % (Airalo) à 39,3 %
(aloSIM) — **trop faible pour départager qui que ce soit**. C'est un résultat en soi :
inutile de construire un argument marketing là-dessus.

### B4 · Régional contre mono-pays : on achète de la couverture, pas des Go

| Portée | Offres | Prix moyen | Go moyen |
|---|---|---|---|
| Mono-pays | 4 278 (84,6 %) | 26,90 € | 14,3 Go |
| Régional / Monde | 778 (15,4 %) | **42,51 €** | 15,4 Go |

**+58 % de prix pour un volume quasi identique.** Ce surcoût n'achète pas des Go, il
achète de la couverture — c'est un produit différent, pas un produit plus cher.

### B5 · Qui est le moins cher, destination par destination ?

Sur les **1 113 combinaisons** (destination × volume × durée), quel fournisseur affiche
le prix le plus bas ? C'est la mécanique même d'un comparateur.

| Fournisseur | Victoires | Présent sur | **Taux de victoire** |
|---|---|---|---|
| Airalo | 166 | 525 | 31,6 % |
| Yatelo | 56 | 149 | **37,6 %** |
| Flexiroam | 49 | 159 | 30,8 % |
| … | … | … | … |
| Truphone | 26 | 189 | **13,8 %** |

La colonne qui compte est la dernière : elle corrige l'effet de taille du catalogue.
**Airalo gagne le plus souvent en valeur absolue parce qu'il est partout ; c'est Yatelo
qui gagne le plus souvent quand il est présent.**

### B6 · Ce que comparer rapporte

Sur les 1 039 combinaisons proposées plusieurs fois au catalogue (1 033 par au moins deux
fournisseurs, 6 par un seul à plusieurs prix), l'écart médian
entre le moins cher et le plus cher est de **13,4 % (2,25 €)**, et atteint **64 %
(60,37 €)** au maximum.

Les cinq cas où comparer rapporte le plus sont tous des **offres régionales de 30 jours** :
quatre illimités (Europe de 94,26 € à 154,63 €, Asie de 93,26 € à 153,22 €, Monde de 96,06 € à
152,96 €, Amérique du Nord) et un forfait Monde 50 Go.

> *Corrigé après coup : ce document affirmait « tous des illimités » et « par au moins deux
> fournisseurs ». Les deux formulations étaient inexactes ; le recalcul les a fait apparaître.*

### B7 · L'échelle des prix par palier

| Palier | Prix médian | €/Go médian |
|---|---|---|
| 1 Go | 6,71 € | **6,715 €** |
| 5 Go | 14,23 € | 2,846 € |
| 20 Go | 32,73 € | 1,636 € |
| 50 Go | 58,75 € | **1,175 €** |
| Illimité | 51,28 € | — |

Le €/Go s'effondre de **83 %** entre le palier 1 Go et le palier 50 Go.

### B8 · L'étendue de catalogue ne départage personne non plus

14 des 18 fournisseurs couvrent au moins 50 des 54 destinations, et les 4 zones sont
proposées par les 18. Comme pour la 5G, c'est un non-critère.

> **Conclusion transversale de B3 et B8 : sur ce catalogue, le seul axe qui discrimine
> réellement les fournisseurs est le prix.** C'est ce qui justifie de donner B1, B5 et B6
> la place centrale dans le dashboard, et de reléguer 5G et couverture au rang de
> contexte.

---

## Ce qui n'a pas été calculé, et pourquoi

- **Aucune statistique de ventes, de popularité ou de marge.** Le jeu de données est un
  catalogue : il contient des offres, pas des transactions. Tout classement « des plus
  vendus » serait inventé.
- **Aucune comparaison avec des prix réels du marché.** Les prix de ce catalogue ne sont
  pas vérifiables contre les sites des fournisseurs, et le périmètre exact de chaque
  offre (opérateur hôte, politique de fair use) n'est pas dans les données.

Ces deux limites seront rappelées dans le dashboard : un comparateur qui ne dit pas ce
qu'il ignore n'est pas crédible.
