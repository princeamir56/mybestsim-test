# Étape 4 — Analyse concurrentielle et plan de l'article

Sujet imposé : **« Internet en croisière : quelle eSIM choisir ? »**
Aucun nombre de mots donné — volontairement. Le raisonnement sur la longueur fait
partie de la note.

---

## 1. Ce qui ranke aujourd'hui

La requête est dominée par **des éditeurs qui vendent des eSIM**. Holafly, Yesim,
GoMoWorld, Simology, GigSky publient tous leur propre guide « Internet en croisière ».
Le reste du top est occupé par des blogs voyage monétisés à l'affiliation.

**Conséquence stratégique : il n'y a pas d'autorité neutre sur cette requête.**
Personne n'occupe la position de l'arbitre. C'est la place à prendre, et c'est
exactement la position d'un comparateur.

### Le concurrent de référence

[Holafly FR — « Comment avoir Internet sur un bateau de croisière en 2026 ? »](https://esim.holafly.com/fr/internet-mobile/internet-sur-bateau-de-croisiere/)
— environ **1 800 à 2 000 mots**, 9 H2, deux tableaux comparatifs, un bloc FAQ de
4 questions. C'est le format à battre.

Structure observée : possibilité d'Internet en mer → comparatif des solutions →
forfaits Wi-Fi des compagnies (MSC, Costa, Royal Caribbean) → l'eSIM → comparaison
eSIM vs forfait du bord → installation → alternatives → astuces d'économie → FAQ.

---

## 2. Où je ne suis pas d'accord avec ton angle

Ton angle de départ : *« l'eSIM ne fonctionne pas en pleine mer, la plupart des
articles concurrents esquivent le sujet, il faut mener avec ça. »*

**Le fond est juste. Deux détails sont faux, et l'un des deux compte.**

### a) Les concurrents n'esquivent pas le sujet — ils le désamorcent

L'article Holafly dit explicitement que l'eSIM ne fonctionne pas en mer, et son
tableau porte une ligne « Fonctionne en pleine mer : Non ». Ce n'est pas un oubli.

Leur vraie faiblesse est ailleurs, et elle est plus intéressante : **après l'avoir
reconnu, ils comparent un Wi-Fi de bord « à partir de 10 €/jour » à une eSIM « à
partir de 3,79 €/jour »** — deux services qui ne couvrent pas les mêmes moments. Le
lecteur repart avec l'idée que l'eSIM remplace le Wi-Fi du bord pour trois fois moins
cher. C'est faux, et c'est le point sur lequel on peut être meilleur.

**Donc : on ne mène pas avec « ils vous le cachent » (ce serait inexact et ça se
vérifie en un clic), on mène avec « voici la réponse honnête, et voici pourquoi la
comparaison de prix qu'on vous montre ailleurs n'a pas de sens ».**

### b) Des eSIM maritimes existent

« Une eSIM ne sert qu'à quai » est trop absolu. **GigSky** commercialise une offre
couvrant le réseau du bord (*Cellular at Sea*), et **Telenor Maritime** alimente des
offres maritimes revendues sous d'autres marques. Ce sont des produits différents des
eSIM de voyage classiques, et nettement plus chers au gigaoctet.

Les passer sous silence serait le même procédé que celui qu'on reproche aux autres.
Ils auront leur paragraphe — court, factuel, sans prix, parce que je n'ai pas de
source tarifaire fiable et vérifiable pour eux.

> Note : **GigSky est présent dans notre jeu de données**, mais le catalogue importé
> ne distingue pas les offres maritimes. Aucun chiffre de notre dataset ne sera
> présenté comme un prix d'offre maritime.

---

## 3. Le vrai angle différenciant, et il est réglementaire

Aucun concurrent ne traite correctement le point suivant, qui est pourtant **le seul
risque financier réel** du sujet.

La page officielle de l'Union européenne
([Your Europe — Itinérance](https://europa.eu/youreurope/citizens/consumers/internet-telecoms/mobile-roaming-costs/index_fr.htm))
indique, pour le bateau et l'avion :

- tant que le téléphone est accroché à **un réseau mobile terrestre** (dans un port,
  par exemple), l'itinérance européenne s'applique : pas de frais supplémentaires ;
- dès que la connexion passe par **un système par satellite**, « la réglementation de
  l'UE ne s'applique plus », et des services **sans plafonnement des prix** peuvent
  être facturés ;
- la recommandation de la page est explicite : **désactiver l'itinérance ou passer en
  mode avion**.

C'est la différence entre un article de vendeur et un article de comparateur. Et c'est
vérifiable sur une source institutionnelle, pas sur un blog.

### La nuance que tout le monde rate

Plusieurs articles rassurent le lecteur en invoquant la coupure automatique des
données. Ce garde-fou existe bien : l'ARCEP fixe un **plafond par défaut de 60 € TTC**
(50 € HT au niveau européen), avec alerte à 80 % puis blocage
([ARCEP](https://www.arcep.fr/mes-demarches-et-services/consommateurs/fiches-pratiques/itinerance-international-hors-union-europeenne.html)).

**Mais c'est une protection du régime d'itinérance — celui dont la page européenne dit
précisément qu'il ne s'applique plus en satellite.** La fiche ARCEP consultée ne traite
ni du maritime ni du satellite. Je n'affirmerai donc **ni** que le plafond protège en
mer, **ni** qu'il ne protège pas : l'article dira que la protection n'est pas garantie
dans ce cas et qu'il ne faut pas compter dessus. C'est l'information honnête, et c'est
plus utile qu'une fausse certitude dans les deux sens.

Le mécanisme de la mauvaise surprise, lui, est documenté : le téléphone **quitte seul
l'antenne terrestre pour s'accrocher au réseau du navire**, sans action de
l'utilisateur ([UFC-Que Choisir](https://www.quechoisir.org/actualite-telephoner-en-zone-maritime-avis-de-tempete-sur-les-factures-n10537/)).
⚠️ Cet article a une douzaine d'années : **je reprends le mécanisme, jamais ses
tarifs**, et je n'inventerai aucun témoignage.

---

## 4. Ce que je refuse d'écrire

Tu as demandé que chaque affirmation sur la couverture maritime soit vérifiable. Trois
choses sautent, et il faut que tu le saches avant de lire le plan.

**Pas de qualité de signal par itinéraire.** « On capte bien en Méditerranée, mal en
Alaska » est invérifiable : ça dépend du navire, de la distance à la côte, de l'heure
et de l'opérateur. Aucune source sérieuse ne publie ça. **Je remplace par un critère
réellement décisif et vérifiable sur n'importe quel programme de croisière : le nombre
de jours d'escale contre le nombre de jours en mer.** C'est ce qui détermine ce que
vaut une eSIM, et le lecteur peut le vérifier lui-même sur son itinéraire.

**Pas de tarif de Wi-Fi de bord.** Les sources consultées se contredisent (de 12 € à
39,99 €/jour selon les articles, pour les mêmes compagnies) et ces prix changent selon
le navire, la durée et le moment d'achat. Donner une fourchette inventée dans un
article de marque est exactement le risque que tu veux éviter. L'article expliquera
**comment lire une grille tarifaire de compagnie** et renverra le lecteur au site de
la sienne.

**Pas de distance en milles nautiques.** Le chiffre « 12 milles » circule, mais je ne
l'ai trouvé que sur des pages commerciales, sans source réglementaire.

---

## 5. Longueur et structure retenues

### Longueur : **2 300 à 2 800 mots**

Le raisonnement, puisqu'il est noté :

- Le concurrent de référence est à **1 800–2 000 mots**. En dessous, l'intention de
  recherche n'est pas couverte ; Google traite ce sujet comme une question à facettes
  (fonctionnement en mer, prix, escales, alternatives, risques).
- Au-delà de ~3 000 mots, on dilue. Les articles longs du top sont longs **parce
  qu'ils listent les grilles tarifaires de cinq compagnies** — du contenu que je ne
  peux pas sourcer honnêtement, donc du volume que je ne chercherai pas à égaler.
- Je compense le volume non écrit par **deux blocs que personne n'a** : le tableau de
  prix issu de 5 056 offres réelles, et le point réglementaire sourcé.

**Dépasser le concurrent de 20 à 40 % avec de la matière unique, plutôt que de 100 %
avec du remplissage.**

### Décisions SEO

| Décision | Pourquoi |
|---|---|
| **Réponse directe dans les 100 premiers mots** | La requête est une question. La position zéro se gagne par un paragraphe de réponse immédiat, avant tout préambule. |
| **FAQ en balisage `FAQPage`** | Les « autres questions posées » sont riches sur ce sujet ; le balisage les vise explicitement. |
| **Un tableau comparatif chiffré** | Format très repris en extrait enrichi, et c'est notre avantage unique. |
| **Segmentation par itinéraire** | Reprend la logique « par profil de voyageur » de la page Thaïlande de MyBestSim, et capte la longue traîne (« eSIM croisière Méditerranée », « …Caraïbes »). |
| **Vouvoiement, emoji dans les titres, gras sur les chiffres** | Aligné sur le ton réel de MyBestSim, constaté sur leur page Thaïlande. |
| **Maillage interne** | Vers le dashboard et vers les pages destinations. Leur page Thaïlande maille très densément. |

---

## 6. Le plan

**H1 — Internet en croisière : quelle eSIM choisir ? 🚢**

> **Encadré de réponse directe** (~70 mots, avant tout le reste) : une eSIM de voyage
> classique ne capte pas en pleine mer ; elle est faite pour les escales, où elle est
> imbattable ; en mer, il n'y a que le Wi-Fi du bord ; et le vrai danger, c'est le
> réseau du navire qui s'active tout seul.

**H2 — La réponse honnête : non, votre eSIM ne captera pas en pleine mer**
Comment une eSIM se connecte (réseaux terrestres), pourquoi ça s'arrête au large, ce
qui prend le relais à bord. Mention factuelle des **eSIM maritimes** et de leur
positionnement différent.

**H2 — Alors à quoi sert une eSIM en croisière ? Aux escales — et ça change tout**
Le calcul jours d'escale / jours en mer. Pourquoi c'est la seule variable qui décide.
Comment vérifier sur son propre programme.

**H2 — ⚠️ Le vrai piège : le réseau du bateau qui s'allume tout seul**
Le mécanisme. Le point réglementaire UE sourcé. Pourquoi le plafond de coupure n'est
pas une garantie ici. **Encadré « à faire avant d'embarquer »** en 4 gestes.
*(Section la plus différenciante — elle vient tôt.)*

**H2 — Combien coûte une eSIM pour une croisière ? Les prix réels du marché**
**Le tableau issu des 5 056 offres.** Prix par itinéraire pour un forfait type, puis
par profil d'usage. Avec l'avertissement de méthode.

**H2 — eSIM ou forfait Wi-Fi du bord ? La comparaison qu'on ne vous fait pas**
Le cœur de la différenciation : les deux ne couvrent pas les mêmes moments, donc
comparer leurs prix au jour n'a aucun sens. Comment les combiner. Comment lire la
grille de sa compagnie.

**H2 — Quelle eSIM selon votre itinéraire ?**
H3 par zone : Méditerranée 🇪🇸🇮🇹🇬🇷 · Caraïbes 🏝️ · Alaska & Amérique du Nord 🇺🇸 ·
Norvège & fjords 🇳🇴 · Baltique & mer du Nord 🇸🇪. Mono-pays ou régional selon le
nombre de pays touchés, avec les prix réels.

**H2 — Comment installer votre eSIM avant de partir**
Court, 4 étapes, insistance sur **« avant d'embarquer »** — point pratique réel :
l'activation demande une connexion.

**H2 — Questions fréquentes** *(balisage FAQPage)*
8 questions tirées des « autres questions posées ».

**H2 — En résumé** + appel à l'action vers le comparateur.

---

## 7. L'insight que les données ont donné

Un chiffre sorti du catalogue pendant la préparation, que personne d'autre ne peut
publier :

> Pour un **5 Go / 7 jours**, une eSIM **mono-pays** démarre autour de **11 €**, là où
> la même capacité en **eSIM régionale Europe** démarre à **15,82 €**. Soit **environ
> 40 % de plus** pour la couverture multi-pays.

C'est précisément l'arbitrage d'un croisiériste en Méditerranée, dont le navire touche
l'Espagne, l'Italie et la Grèce dans la même semaine. **Une seule eSIM régionale, ou
trois eSIM mono-pays ?** L'article peut répondre avec des prix réels, et le seuil de
bascule se calcule : au-delà de deux pays visités, le régional devient gagnant.

Aucun concurrent ne dispose de la donnée pour poser la question dans ces termes.

Chiffres produits par `scripts/donnees_article.py` → `site/donnees-article.json`.

---

## Sources

- [Your Europe (Commission européenne) — Itinérance : bateau, avion et satellite](https://europa.eu/youreurope/citizens/consumers/internet-telecoms/mobile-roaming-costs/index_fr.htm)
- [ARCEP — Itinérance internationale hors UE : plafond, alerte et blocage](https://www.arcep.fr/mes-demarches-et-services/consommateurs/fiches-pratiques/itinerance-international-hors-union-europeenne.html)
- [UFC-Que Choisir — Téléphoner en zone maritime](https://www.quechoisir.org/actualite-telephoner-en-zone-maritime-avis-de-tempete-sur-les-factures-n10537/) *(ancien — mécanisme uniquement, jamais les tarifs)*
- [Holafly FR — Internet sur un bateau de croisière](https://esim.holafly.com/fr/internet-mobile/internet-sur-bateau-de-croisiere/) *(concurrent de référence)*
- [GigSky — Cellular at Sea](https://www.gigsky.com/blog/msc-cruise-internet-tips-save-money-stay-online) *(existence d'une offre maritime)*
- [MyBestSim — page Thaïlande](https://www.mybestsim.com/esim-thailande) *(ton et structure de la marque)*
