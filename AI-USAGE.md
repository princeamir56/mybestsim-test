# Comment j'ai utilisé l'IA sur ce test

Amir Kerkeni — test de recrutement MyBestSim, Stagiaire Développeur IA & Automatisation.

Le brief encourage explicitement l'agent IA. Je ne le cache donc pas : je le documente,
y compris ses erreurs et les miennes.

> **Ce fichier a été corrigé après coup.** Rédigé par l'agent au fil du travail, il m'attribuait
> plusieurs corrections que je n'ai pas faites : l'agent s'était repris seul, et le texte disait
> « je l'ai arrêté ». Elles ont été rétablies en le comparant au journal complet des sessions. Les
> faits techniques n'ont pas changé.

**Outil :** Claude Code (Opus) en terminal, dans le dossier du projet.
**Rôle réel :** je pose le cadre, les règles et les priorités, et je valide à chaque étape.
L'agent propose, décide de l'essentiel du technique, exécute, et se contrôle lui-même.

**Lire les tableaux :** « tranché par moi » veut dire que j'ai validé la fin d'étape en lui disant
de continuer, pas que j'ai arbitré chaque ligne.

---

## La boucle de travail

Je travaille en **6 étapes**, et l'agent s'arrête à chaque fin d'étape pour que je relise
avant de continuer. J'ai commité étape par étape, puis regroupé l'historique en un seul
commit à la publication du dépôt : ce fichier en garde le déroulé. Trois règles que j'ai posées dès le
premier message :

1. **Git est à moi.** L'agent n'a le droit de lancer ni `git add`, ni `commit`, ni
   `push`. Il me rend une liste de fichiers et un message de commit, je commite
   moi-même. Je garde la main sur ce qui entre dans l'historique.
2. **Les chiffres avant le style.** Interdiction de styler quoi que ce soit avant que
   j'aie validé les statistiques en texte brut. Un dashboard magnifique avec des
   chiffres faux est le seul échec irrécupérable de ce test.
3. **Rien de publié sans mon accord** : déploiement, création de compte, envoi de mail.

À l'étape 1, j'ai profilé les données de mon côté, **puis** j'ai demandé à l'agent de refaire le
travail indépendamment. L'écart qui en est sorti était une erreur de ma part (voir ci-dessous).

---

## Étape 1 — Profilage des données

### Ce que j'ai apporté

J'avais profilé les CSV avant de lancer l'agent et je lui ai soumis **trois pièges** à
vérifier de façon indépendante, en lui interdisant de me croire sur parole :
`country_code = "NA"` qui signifie Amérique du Nord et non une valeur nulle ; les 653
`data_gb` vides qui valent « Illimité » ; les 618 noms de produits portant plusieurs
prix. J'ai aussi fixé l'exigence qui structure tout le livrable : **un panneau
« Décisions & qualité des données » visible dans le dashboard**, pas une note de bas de
page — parce que le brief note l'autonomie et la méthodologie, pas seulement le
résultat.

### Ce que l'agent a confirmé

Mes trois pièges, et à la décimale près sur le piège 2 (14,4915 / 12,6199 / 60,81 /
29,3013). Le contre-test sur le piège 1 est sa bonne idée : relire les fichiers **sans**
`keep_default_na=False` pour montrer que la casse produit exactement 192 `NaN`. Prouver
le piège plutôt que l'affirmer.

### Là où je me suis trompé et où il m'a corrigé

**J'avais annoncé « 618 lignes multi-prix, plus 2 doublons exacts ». Les 2 doublons
exacts n'existent pas.** L'agent a testé la duplication sur toutes les colonnes, puis
sur toutes les colonnes **en ignorant le SKU** — zéro ligne dans les deux cas. Ce que
j'avais pris pour des doublons, ce sont deux couples (fournisseur, nom) au même prix qui
**diffèrent sur `network` et `top_up`**. J'avais regardé nom + prix et conclu trop vite.
Correction acceptée, et elle change la décision : si rien n'est dupliqué, l'argument
« il faut nettoyer » perd sa base.

### Là où l'agent s'est trompé et s'est corrigé seul

**Il a d'abord diagnostiqué un problème d'encodage des CSV.** Son premier script
affichait `Am?rique du Nord` et il s'apprêtait à traiter les fichiers comme mal encodés.
En vérifiant lui-même les **octets bruts**, il a trouvé
`Am\xc3\xa9rique`, de l'UTF-8 parfaitement valide, et les 18 fichiers se décodent sans
erreur. Le charabia venait de la console Windows en cp1252, pas des données. Un
« nettoyage » d'encodage aurait corrompu les 54 noms de pays pour réparer un problème
inexistant. C'est consigné dans le rapport d'étape 1, section F.

Le risque que je retiens : **un agent peut conclure à partir de ce qu'il voit affiché, pas de ce qui
est réellement dans le fichier.** Ici il s'en est rendu compte seul, avant de toucher aux données.

### Ce qu'il a trouvé que ni lui ni moi n'avions demandé

En croisant les deux questions au lieu de les traiter séparément : **les 56 produits à
plus de 100 € sont tous, sans exception, des forfaits illimités** — donc exactement la
population du piège 2. Un candidat qui « nettoie » en supprimant les lignes sans
`data_gb` répond **0** à une question imposée du brief, sans jamais voir le lien. Ni lui
ni moi n'avions anticipé que les deux pièges n'en formaient qu'un.

Il a aussi relevé que `data_gb` est un **palier à 6 valeurs** (moyenne 14,49 Go mais
médiane 5 Go), que 4 des 54 « pays » sont des zones (778 lignes), et que `data_display`
et `product_name` sont intégralement dérivables des colonnes typées — donc aucun parsing
de texte libre n'est nécessaire, mais il fallait le prouver avant de s'appuyer dessus.

### Restructuration du dépôt (fin d'étape 1)

Avant le premier commit, j'ai demandé à l'agent de réorganiser le dossier pour qu'il soit
présentable sur GitHub, en lui laissant le choix. Il a retenu `data/fournisseurs/`, `docs/`,
`scripts/`, `site/`, et renommé le PDF du brief sans accents ni espaces.

Deux choses en sont sorties qui valent mieux qu'un simple rangement :

- Ses trois scripts de profilage jetables ont été fondus en **un seul point d'entrée**
  (`scripts/profilage.py`) adossé à un **chargeur canonique unique**
  (`scripts/mbs_catalogue.py`). Tout le projet lira les CSV par ce module. Deux chiffres
  du livrable ne peuvent donc pas diverger : ils viennent de la même lecture.
- Il a transformé les pièges en **assertions qui cassent le build** plutôt qu'en
  commentaires. Si un futur import fait sauter les 192 « NA », le script refuse
  de tourner au lieu de produire un dashboard faux en silence.

Au passage, un incident instructif : son module s'appelait `catalogue.py` et il était
**masqué par un paquet `catalogue` déjà installé** dans Python. L'import échouait en
désignant `site-packages`. Renommé en `mbs_catalogue.py`. Rien d'intellectuel là-dedans,
mais c'est le genre de détail qui fait perdre une heure si on ne lit pas le chemin
complet dans le message d'erreur.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Panneau « Décisions » visible dans le dashboard | moi | moi |
| Git entièrement manuel, un commit par étape | moi | moi |
| Chiffres validés avant tout travail de style | moi | moi |
| Contre-test `keep_default_na` pour prouver le piège 1 | l'agent | moi |
| Abandon de l'hypothèse « doublons exacts » | l'agent | moi |
| Abandon de la piste encodage | l'agent | l'agent |
| Reporter les 4 arbitrages à l'étape 2 | l'agent | moi |
| Restructurer le dépôt avant le 1er commit | moi | moi |
| Chargeur unique + pièges transformés en assertions | l'agent | moi |

---

## Étape 2 — Les chiffres

### La règle que j'ai posée

**Aucune mise en forme avant validation des chiffres.** Tout l'étape 2 sort en texte
brut, sans une ligne de CSS. C'est la seule protection contre le mode d'échec qui ne se
rattrape pas : un dashboard magnifique affichant des valeurs fausses, où le soin apporté
au design devient l'argument qui empêche de douter des nombres.

### Les quatre arbitrages

Mon brief posait les pièges et qualifiait déjà la moyenne de Go d'*indéfinie* sur les illimités.
L'agent en a tiré les quatre arbitrages et a tranché chacun, argumentaire compris.

L'argument décisif de D2 est de lui : **la valeur n'est pas manquante, elle est indéfinie**, et
compter un forfait illimité pour 0 Go fait *baisser* la moyenne alors que l'offre est *supérieure*.
C'est cette inversion qui rend l'alternative indéfendable.

### Là où l'agent a dérapé, et s'est repris seul

**Il a écrit une statistique inventée.** En commentaire du palier de prix, il avait
conclu : *« Les petits forfaits sont structurellement le mauvais calcul — mais ce sont
les plus vendus. »*

Il n'y a **aucune donnée de ventes** dans ce jeu : c'est un catalogue, il contient des
offres, pas des transactions. La phrase était plausible, bien tournée, et entièrement
fabriquée. Il l'a repérée à la relecture de sa propre sortie et supprimée avant de me montrer les
chiffres. Il a ajouté une section « Ce qui n'a pas été calculé, et pourquoi »
qui verrouille le périmètre : pas de ventes, pas de popularité, pas de marge, pas de
comparaison avec les prix réels du marché.

C'est le même réflexe que l'erreur d'encodage à l'étape 1, sous une autre forme :
**l'agent complète vers ce qui sonne juste.** Sur de l'analyse de données, ça produit une
fausse statistique ; sur l'article SEO de la partie 2, ça produirait un faux chiffre
publié sous la marque MyBestSim. C'est pour ce risque que mon brief interdisait dès le départ tout
chiffre non vérifiable dans l'article.

Incident mineur au passage : deux de ses correctifs de script ne se sont **pas
appliqués** à cause d'un problème d'échappement, et il a conclu « patché » sur la foi
d'une assertion trop permissive. Il l'a vu en vérifiant la sortie réelle, et a refait les deux
correctifs.

### Ce qu'il a apporté que je n'avais pas demandé

Deux statistiques bonus qui ont changé la façon dont je vais construire le dashboard :

- **B5, le taux de victoire par fournisseur** — pour chaque combinaison (destination ×
  volume × durée), qui est le moins cher ? Et surtout la colonne qui corrige l'effet de
  taille : Airalo gagne le plus souvent en absolu **parce qu'il est partout**, alors que
  c'est Yatelo qui gagne le plus souvent quand il est présent (37,6 % contre 31,6 %).
  C'est la mécanique d'un comparateur, pas une statistique descriptive.
- **La conclusion transversale de B3 et B8** : ni la 5G (30–39 % selon les fournisseurs)
  ni l'étendue de catalogue (14 fournisseurs sur 18 couvrent 50+ destinations sur 54) ne
  départagent qui que ce soit. **Le seul axe discriminant est le prix.** Un résultat
  négatif, donc, mais il dicte la hiérarchie visuelle du dashboard : le prix au centre,
  la couverture en contexte.

J'avais suggéré « €/Go médian, part 5G, régional vs mono-pays, prime de l'illimité ». Les
quatre sont là (B1, B3, B4, B2), mais ce sont B5 et B6 qui portent la valeur.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Chiffres en texte brut avant tout style | moi | moi |
| D1 · 5 056 produits (un par SKU) | l'agent | moi |
| D2 · Exclure les illimités de la moyenne de Go | l'agent | moi |
| D2 · Argument « l'illimité n'est pas zéro » | l'agent | moi |
| D3 · Ne pas dédupliquer les 618 | l'agent | moi |
| D4 · Séparer les zones des pays | l'agent | moi |
| Suppression de la statistique de ventes inventée | l'agent | l'agent |
| Section « Ce qui n'a pas été calculé » | l'agent | moi |
| B5 · Taux de victoire par fournisseur | l'agent | moi |
| B3+B8 · « Seul le prix discrimine » | l'agent | moi |

---

## Étape 3 — Le dashboard

### Les couleurs ont été validées avant d'être écrites

Au lieu de choisir une palette à l'œil, l'agent a fait tourner un validateur
(contraste, bande de luminosité, séparation des teintes pour les daltonismes protan
et tritan) sur les deux couleurs catégorielles avant d'écrire la moindre ligne de CSS,
en mode clair **et** en mode sombre. Tout passe. Ce n'est pas du zèle : « est-ce que ces
deux couleurs se distinguent pour un daltonien » est une question calculable, donc il
n'y a aucune raison de la deviner.

Choix de forme qui en découle : **presque tous les graphiques sont en une seule teinte.**
Le catégoriel n'est employé que là où deux séries sont réellement le sujet (illimité
contre volume limité). Pour un classement, c'est le rang qui porte l'information, pas
l'identité — et une teinte par fournisseur sur 18 fournisseurs aurait été illisible.

### Trois vrais bugs attrapés en rendant la page

L'extension navigateur n'était pas connectée, donc impossible de regarder la page.
Plutôt que de livrer sans vérifier, l'agent a installé `jsdom` et exécuté la page dans
un DOM sans navigateur. Trois bugs réels sont tombés :

1. **Deux collisions d'identifiants** (`pieges`, `limites`) : une `<section id="x">` et
   un `<div id="x">` portaient le même nom, donc `getElementById` renvoyait la section
   et **le contenu partait dans le mauvais élément**. Les quatre pièges et les trois
   limites ne s'affichaient tout simplement pas. Invisible à la relecture du code,
   évident dès qu'on exécute.
2. **Plantage sur `matchMedia` absent**, qui tuait tout le script avant le premier
   graphique.
3. **Un faux négatif instructif** : son contrôle comparait « 5 056 » affiché à « 5 056 »
   attendu et échouait. Les deux chaînes sont différentes : `Intl.NumberFormat` en
   français sépare les milliers avec une **espace fine insécable** (U+202F), pas une
   espace ordinaire.

Le script de contrôle est resté dans le dépôt (`scripts/verifier_site.js`, `npm run
verifier`) : 38 vérifications, code de sortie non nul en cas d'échec. Il contrôle aussi
que **le code ne contient aucun `fetch` ni aucune référence à un `.csv`** — la
contrainte d'architecture est ainsi testée, pas seulement affirmée.

### Trois choix de l'agent à cette étape

- **Le JSON est inliné dans la page**, pas chargé par `fetch('data.json')`. Son premier
  jet partait sur un fetch, qu'il a écarté : en ouvrant le fichier en local (`file://`), la
  politique d'origine bloque la requête, donc la prévisualisation n'aurait pas été
  identique au site déployé. *(Le passage à React a remplacé ce mécanisme ensuite.)* Inliné, la
  page est autonome et testable partout. `data.json` est quand même écrit à côté, parce
  que l'article de la partie 2 va le consommer.
- **Un équivalent tableau sous chaque graphique.** Pas pour l'accessibilité en général,
  mais parce qu'un recruteur qui veut vérifier un chiffre doit pouvoir le lire, pas
  l'estimer sur une barre.
- **Le panneau « Décisions » est dépliable, avec D1 ouvert par défaut.** Replié
  entièrement, il devient la note de bas de page que je voulais éviter ; tout déplié, il
  noie les chiffres. Le premier ouvert montre la mécanique sans imposer les quatre.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Valider la palette avant d'écrire le CSS | l'agent | moi |
| Une seule teinte pour les classements | l'agent | moi |
| JSON inliné plutôt que `fetch` | l'agent | moi |
| Vérification headless faute de navigateur | l'agent | moi |
| Garder le script de vérification dans le dépôt | l'agent | moi |
| Tester l'absence de `fetch`/`.csv` dans le code | l'agent | moi |
| Tableau de données sous chaque graphique | l'agent | moi |
| Panneau Décisions dépliable, D1 ouvert | l'agent | moi |

---

## Étape 4 — Recherche concurrentielle et plan de l'article

### La règle posée avant toute recherche

C'est du contenu de marque destiné à la publication. **Aucune statistique, aucun prix,
aucun nom d'opérateur, aucun témoignage inventé.** Toute affirmation sur la couverture
maritime doit être sourcée, et ce qui n'est pas vérifiable ne sort pas. Après la fausse
statistique de ventes attrapée à l'étape 2, cette règle n'est pas théorique.

### L'agent a challengé mon angle, et il avait raison sur deux points

Mon angle de départ : *l'eSIM ne marche pas en pleine mer, les concurrents esquivent le
sujet, menons avec ça.*

**Erreur 1 — « les concurrents esquivent » est faux.** L'article Holafly, qui domine la
requête, dit explicitement que l'eSIM ne fonctionne pas en mer et porte une ligne
« Fonctionne en pleine mer : Non » dans son tableau. Si j'avais écrit « ce qu'on ne
vous dit pas », n'importe qui le vérifiait en un clic et l'article perdait sa crédibilité
dès le premier paragraphe.

Mais l'agent a trouvé mieux que mon angle en creusant *pourquoi* leur article reste
trompeur : **après l'avoir reconnu, ils comparent un Wi-Fi de bord « à partir de
10 €/jour » à une eSIM « à partir de 3,79 €/jour »** — deux services qui ne couvrent pas
les mêmes moments. Le lecteur repart convaincu que l'eSIM remplace le Wi-Fi pour trois
fois moins cher. L'angle devient donc : *voici la réponse honnête, et voici pourquoi la
comparaison de prix qu'on vous montre ailleurs n'a aucun sens.* C'est plus solide que
mon angle initial, et c'est vrai.

**Erreur 2 — « une eSIM ne sert qu'à quai » est trop absolu.** Des eSIM maritimes
existent (GigSky *Cellular at Sea*, Telenor Maritime). Les taire serait exactement le
procédé que je reproche aux autres. Elles auront leur paragraphe, sans prix, faute de
source tarifaire fiable.

### Ce que ma règle a produit : les sources primaires

Mon brief exigeait que chaque affirmation sur la couverture maritime soit vérifiable et sourcée.
L'agent est donc allé jusqu'aux sources institutionnelles, plutôt que de s'en tenir aux blogs de
vendeurs d'eSIM. C'est ce qui a fait émerger **le véritable angle différenciant**, et
il est réglementaire : la page officielle de la Commission européenne établit que dès
que la connexion passe par un satellite, **la réglementation européenne ne s'applique
plus et des services sans plafonnement de prix peuvent être facturés**. Aucun concurrent
ne traite ça correctement. C'est le seul risque financier réel du sujet, et c'est
vérifiable sur europa.eu.

### Une incertitude assumée plutôt qu'une fausse certitude

Plusieurs articles rassurent le lecteur en invoquant la coupure automatique des données. L'agent
ne l'a pas repris tel quel : le garde-fou existe bien (plafond par défaut de 60 € TTC selon l'ARCEP, alerte
à 80 %, puis blocage) — **mais c'est une protection du régime d'itinérance, celui-là
même dont la page européenne dit qu'il ne s'applique plus en satellite.** Et la fiche
ARCEP consultée ne traite ni du maritime ni du satellite.

L'article n'affirmera donc **ni** que le plafond protège en mer, **ni** qu'il ne protège
pas. Il dira que la protection n'est pas garantie dans ce cas et qu'il ne faut pas
compter dessus. Une fausse certitude rassurante dans un article de marque, sur un sujet
de facturation, c'est le pire scénario possible.

Détail du même ordre : l'article UFC-Que Choisir qui documente le mécanisme a une
douzaine d'années. On en reprend **le mécanisme, jamais les tarifs**.

### Trois choses retirées du plan faute de pouvoir les sourcer

- **La qualité de signal par itinéraire** (« on capte bien en Méditerranée, mal en
  Alaska »). Invérifiable. Remplacée par un critère réellement décisif et que le lecteur
  peut contrôler sur son propre programme : **le nombre de jours d'escale contre le
  nombre de jours en mer**.
- **Les tarifs de Wi-Fi des compagnies.** Les sources se contredisent : de 12 € à
  39,99 €/jour pour les mêmes compagnies. L'article expliquera comment lire une grille
  tarifaire plutôt que d'en inventer une.
- **La distance en milles nautiques** au-delà de laquelle on perd le réseau. Le chiffre
  « 12 milles » circule, mais uniquement sur des pages commerciales.

### L'insight que les données ont donné

En croisant le catalogue avec les itinéraires : pour un **5 Go / 7 jours**, une eSIM
mono-pays démarre à **11 €**, contre **15,82 €** en régional Europe — **+40 % pour la
couverture multi-pays**. C'est exactement l'arbitrage d'un croisiériste en Méditerranée
qui touche l'Espagne, l'Italie et la Grèce dans la même semaine : une eSIM régionale, ou
trois mono-pays ? Le seuil de bascule se calcule, et **aucun concurrent n'a la donnée
pour poser la question dans ces termes.**

C'est la jonction entre les deux parties du test : l'article consomme le dataset de la
partie 1.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Interdiction de tout chiffre non sourcé | moi | moi |
| Abandon de l'angle « les concurrents esquivent » | l'agent | moi |
| Angle « leur comparaison de prix est faussée » | l'agent | moi |
| Mentionner les eSIM maritimes | l'agent | moi |
| Exiger des sources institutionnelles | l'agent, d'après ma règle de sources | moi |
| Angle réglementaire UE comme différenciant | l'agent | moi |
| Ne pas promettre la protection du plafond en mer | l'agent | moi |
| Retrait du signal par itinéraire / tarifs Wi-Fi / milles nautiques | l'agent, d'après ma règle de sources | moi |
| Longueur 2 300–2 800 mots | l'agent | moi |
| Tableau de prix issu des 5 056 lignes | moi | moi |

---

## Étape 5 — Rédaction de l'article

### Une décision d'architecture qui est une décision SEO

**Les tableaux de prix sont rendus en HTML au moment du build, pas par JavaScript.**
C'est l'inverse du dashboard, et c'est délibéré : le contenu d'une page destinée à être
indexée doit se trouver dans le code source. Un tableau injecté côté client dépend du
bon vouloir du moteur de rendu de Google. Le dashboard, lui, n'a pas à être indexé — il
porte d'ailleurs un `noindex`.

Conséquence : aucun prix n'est écrit en dur dans le gabarit. *(Mécanisme d'alors, remplacé
ensuite par le prérendu React.)* Le texte contenait des jetons (`__PRIX_MIN_5GO__`…) remplacés au build depuis le catalogue, et **le build
échoue s'il reste un seul jeton non remplacé**.

### Le bug que ce garde-fou a attrapé

Le balisage `FAQPage` est généré **à partir de la FAQ réellement écrite dans la page**,
par lecture du HTML — pour qu'il soit impossible de promettre à Google une question qui
n'existe pas dans l'article.

Sauf que l'agent l'extrayait **avant** la substitution des prix. Résultat : la page affichait
bien « 15,82 € », mais le JSON-LD envoyé à Google contenait la chaîne
`__PRIX_MIN_EUROPE__`. Une page impeccable à l'écran, des données structurées
corrompues. Le contrôle « aucun jeton non remplacé » a fait échouer le build, et l'ordre
a été corrigé : substitution d'abord, extraction ensuite.

C'est exactement le genre d'erreur qu'une relecture visuelle ne voit jamais.

### Là où l'agent s'est trompé sur ses propres chiffres

Il avait annoncé 2 300–2 800 mots à l'étape 4. Le contrôle automatique a renvoyé
**3 731 mots** — bien au-dessus. Il a d'abord taillé dans l'article, puis constaté que
**le compteur lui-même était faux** : il mesurait `body.textContent`, qui inclut le bloc
JSON-LD présent dans le `<body>`. Environ 480 mots de données structurées comptés comme
du texte rédactionnel.

Mesure corrigée, sur le corps rédactionnel seul : **2 704 mots de prose + 450 mots de
FAQ**. La prose est dans la cible annoncée. Il a gardé les 750 caractères de coupe, qui
resserraient réellement le texte.

Deux leçons, et la seconde est la vraie : un chiffre produit par un outil maison n'est pas plus
fiable que l'outil. **Avant de corriger le travail sur la foi
d'une mesure, il faut vérifier la mesure.**

### Ce que l'article refuse d'écrire

Le passage le plus tentant était l'encadré sur le blocage automatique des données. Il
aurait été facile — et rassurant — d'écrire « de toute façon, vous êtes protégé à 50 € ».
L'encadré dit l'inverse : le garde-fou existe, mais il est attaché au régime
d'itinérance, celui-là même qui ne s'applique plus en satellite, et **« nous ne pouvons
donc pas vous garantir que ce plafond vous protège en mer »**.

Admettre une incertitude dans un article de marque est contre-intuitif. Sur un sujet de
facturation, c'est la seule position défendable — et c'est ce qui distingue un
comparateur d'un vendeur.

### Les contrôles ajoutés

Le vérificateur est passé de 38 à **70 contrôles**, dont, pour l'article : longueur du
titre et de la méta-description, unicité du H1, validité du JSON-LD, **correspondance
entre chaque question balisée et une question visible dans la page**, présence des trois
sources institutionnelles, présence de l'encadré de méthodologie, et vérification que
les prix du catalogue apparaissent bien dans le HTML servi.

La méta-description faisait 177 caractères — au-delà du point de troncature de Google.
Détectée, corrigée.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Tableaux rendus au build, pas en JS | l'agent | moi |
| Build en échec si un jeton n'est pas remplacé | l'agent | moi |
| Balisage FAQ dérivé de la FAQ écrite | l'agent | moi |
| Correction de l'ordre substitution/extraction | l'agent | moi |
| Admettre l'incertitude sur le plafond de 50 € | l'agent | moi |
| Encadré de méthodologie sur les prix | l'agent | moi |
| Coupe de 750 caractères | l'agent | moi |
| Correction du compteur de mots | l'agent | moi |

---

## Refonte visuelle — passage en React

### Le point de départ : mes propres projets, pas un thème

Le premier design ne me plaisait pas, et c'est ma vraie correction de cette partie. J'ai donné à
l'agent trois de mes projets (Nostra, HB Travel, Huilerie Zouyout Alchifa) comme inspiration, en lui
demandant du React ou équivalent, des animations, et un rendu responsive.

Ce qu'il en a tiré, et que j'ai validé en continuant : même pile (Vite, React, Tailwind, Framer
Motion, Lenis), et surtout la même grammaire — papier chaud, une famille de couleur
profonde, **un seul accent réservé aux appels à l'action**, serif d'affichage contre
sans-serif de texte, et du mono pour « tout ce que le produit mesure plutôt qu'il ne le
dit ». Sur un comparateur, cette dernière règle tombe particulièrement juste : les prix
et les volumes sont précisément ce qu'on mesure.

### Les couleurs ont été calculées, pas choisies

Avant la première ligne de CSS, l'agent a fait tourner un validateur sur la palette :
bande de luminosité, plancher de chroma, séparation protan et tritan, contraste — en
mode clair **et** sur la surface sombre.

Et ça a servi : **sa première proposition à trois séries a échoué**. Le vert et l'orange
sortaient à ΔE 6,5 en protan, sous le plancher. Plutôt que de tricher sur le seuil, on a
supprimé la troisième série — ce qui rejoint la règle « un seul accent » de mes autres
projets. La rampe séquentielle a demandé trois itérations pour que les écarts de
luminosité entre paliers restent perceptibles sur fond sombre.

Conséquence de forme, décidée à partir de là : **presque tous les graphiques sont en une
seule teinte**. Sur un classement, l'information est le rang, pas l'identité — et aucune
palette ne tient dix-huit teintes distinguables, daltonisme compris.

### Quatre bugs que seules des captures ont révélés

L'extension navigateur n'étant toujours pas connectée, l'agent a installé
`puppeteer-core`, pointé vers mon vrai Chrome — la même approche que mon script
`shots.mjs` sur Huilerie Zouyout. Le script capture en 1440 px et en 390 px, collecte
les erreurs de console, **et mesure le débordement horizontal élément par élément**.

Ce que ça a attrapé :

1. **La page s'auto-défilait jusqu'au panneau des décisions au chargement.** D1 est
   ouverte par défaut, et l'effet qui amène une décision à l'écran se déclenchait aussi
   au montage. Le hero n'était jamais vu. Invisible en lisant le code.
2. **Les tableaux de l'article étaient coupés à droite** sur desktop, sans aucun indice
   qu'il fallait faire défiler. La cause n'était pas les données mais les en-têtes : en
   mono capitales avec 0,22em d'interlettrage, « MOINS CHER CHEZ » est plus large que la
   colonne qu'il titre. La première correction de l'agent — déborder la colonne de
   lecture avec des marges négatives — était pire : il est revenu de lui-même à la vraie
   cause.
3. **Les nombres générés en Python n'étaient pas francisés** : « 5056 produits »,
   « −14.5 % », « 42.51 € » au milieu d'une page par ailleurs entièrement en français.
   Le contrôle automatique les a tous retrouvés.
4. Une **fausse alerte instructive** : la capture pleine page du téléphone semblait
   montrer l'article répété trois fois. Avant de corriger, l'agent a compté les `h1` et
   les sections dans le DOM réel — un seul `h1`, cinq sections uniques. C'était
   l'assemblage par bandes de Chrome sur une page de 14 000 px. **Vérifier la mesure
   avant de corriger le travail**, la même leçon qu'à l'étape 5.

### Ce que le passage en React a imposé de repenser

Une application React rend côté client ; **l'article est un livrable SEO**. Son contenu
ne peut pas dépendre du moteur de rendu de Google. D'où un **prérendu** : un fichier
HTML complet par route, écrit au build avec `renderToString`.

Deux conséquences que l'agent a d'abord ratées, et que les contrôles ont rattrapées :

- Les composants de révélation écrivaient leur état **initial** dans le HTML statique,
  donc `opacity: 0` sur chaque bloc. Le texte était bien là pour un robot, mais invisible
  pour un visiteur sans JavaScript. Ils détectent désormais le rendu serveur et écrivent
  leur état final.
- **Seule la décision ouverte figurait dans le HTML servi.** Le panneau qui porte toute
  la démonstration était amputé de trois de ses quatre contrefactuels. Idem pour la FAQ,
  dont le balisage promettait à Google des réponses absentes de la page. Les deux
  accordéons sont maintenant entièrement dépliés au prérendu.

Le vérificateur est passé à **59 contrôles** portant sur le HTML réellement servi, dont
celui-ci, qui teste la contrainte d'architecture plutôt que de l'affirmer : *aucune
référence à un fichier `.csv` dans le JavaScript livré*.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Extraire le système de mes projets plutôt que décrire un style | l'agent, à partir de mes projets | moi |
| Reprendre la pile Vite / React / Tailwind / Framer / Lenis | l'agent | moi |
| Valider la palette avant d'écrire le CSS | l'agent | moi |
| Abandonner la 3ᵉ série (échec daltonisme) | l'agent | moi |
| Une seule teinte pour les classements | l'agent | moi |
| Prérendu SSR pour l'article | l'agent | moi |
| État final écrit dans le HTML statique | l'agent | moi |
| Accordéons dépliés au prérendu | l'agent | moi |
| Captures Chrome + mesure du débordement | l'agent | moi |
| Retour à la vraie cause du débordement des tableaux | l'agent | l'agent |
| Vérifier le DOM avant de croire une capture | l'agent | l'agent |

---

## Industrialisation — rendre le dépôt rejouable

### Ce que j'ai demandé

Deux demandes, c'est tout : *« est-ce un workflow, est-il automatisé, sinon comment le rendre
automatisé à chaque ajout de CSV ? »*, puis *« fais ce qu'il faut, commence par l'étape 1, ne
casse rien, garde la documentation à jour »*. J'ai validé la suite en commitant et en disant
de continuer. **Le diagnostic, le plan et l'exécution de cette étape sont de l'agent.**

### Ce que l'agent a trouvé

Le chargeur était déjà agnostique et les chiffres déjà calculés. Ce qui bloquait, c'était la
prose : « les 56 produits à plus de 100 € sont tous des illimités » est une observation datée,
écrite en dur. Un nouveau fournisseur aurait changé les graphiques sans changer le texte.

Il a donc créé `faits()`, source unique de ce que les phrases affirment, avec pour chaque
affirmation forte une version de repli chiffrée.

### Ce qui a été corrigé en route (par l'agent, sur ses propres tests)

Sa première passe rendait les nombres dynamiques. En testant lui-même avec un 19ᵉ fournisseur
fictif construit pour tout démentir, il a vu quatre phrases restées fausses sur le fond : D1
concluait « chaque ligne est distincte » après avoir retiré 2 lignes, « l'intervalle vide »
restait affirmé après son comblement, le titre « Aucun doublon » survivait, D3 ignorait les
doublons détectés. Les argumentaires sont devenus conditionnels.

Le recalcul a aussi révélé une erreur déjà publiée à l'étape 2 : le 5ᵉ écart de prix est un
Monde 50 Go, pas un illimité.

Le vérificateur attendait des valeurs figées (`'5 056'`) : il aurait fait échouer un site qui
avait raison. Il compare désormais le HTML aux JSON. En déposant réellement le 19ᵉ CSV, l'agent
a trouvé une tuile React que ses tests ne couvraient pas : `npm run test-import` ne teste que la
prose produite par Python.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Rendre le pipeline automatisable | moi | moi |
| Dé-figer la prose avant de brancher le déclencheur | l'agent | l'agent, validé en commitant |
| `faits()`, repli chiffré, argumentaires conditionnels | l'agent | l'agent, validé en commitant |
| Test du 19ᵉ fournisseur, vérificateur relatif, CI, `vercel.json` | l'agent | l'agent, validé en commitant |

---

## Polissage UI/UX

### Ce que j'ai demandé

Vérifier le site en local avant Vercel, corriger les bugs, optimiser le SEO et l'UX sur mobile
et bureau, animer les graphiques et en varier les formes avec des graphiques natifs, utiliser
mon logo (`app/public/`) avec une animation d'ouverture inspirée de mon projet HB Travel, et
rendre la navigation simple, sans lien cassé ni élément mal placé.

### Comment l'agent a travaillé

L'extension Chrome ne voyait aucun navigateur connecté : il a utilisé le vrai Chrome en
`puppeteer-core`, déjà dans le dépôt. Il a capturé l'état initial, listé les défauts, puis écrit
`app/scripts/audit.mjs`, qui emprunte les parcours et mesure à 5 largeurs.

### Défauts trouvés et corrigés

- **Bug** : menu mobile ouvert sur le hero, croix marine sur fond sombre, donc invisible.
- **Liens** : `#decisions` et `#chiffres` morts depuis l'article ; toute URL inconnue affichait le
  dashboard en silence (il y a maintenant une vraie page 404).
- **Chiffre faux à l'écran** : à 320 px, deux compteurs du hero restaient à « 0 » et « 0,00 Go ».
  L'audit était vert : c'est en regardant la capture qu'il a été vu. Le compteur affiche
  maintenant la vraie valeur par défaut, et l'audit contrôle ce cas.
- **Mise en page** : un `col-span` posé sur le mauvais élément laissait les panneaux pleine
  largeur en demi-colonne ; les points des haltères étaient décalés car l'animation écrasait le
  centrage CSS.
- **Contraste** : texte blanc sur orange à 3,61:1 (jeton plus foncé à 5,6:1), petits libellés
  sous 4,5:1, mesurés et non estimés.
- **Typographie** : « € », « % » et « ? » seuls en début de ligne. L'espace insécable avait
  d'abord été mal écrit dans le script Python (regex cassée par un échappement) ; repéré au rendu.
- **Données** : « 1 039 combinaisons par au moins deux fournisseurs » était inexact (1 033).
- **SEO** : `og:image` absente malgré une carte `summary_large_image`, chiffres en dur dans le
  `<title>`, `datePublished` qui changeait à chaque build, pas de fil d'Ariane balisé.
- **CI** : la date changeait à chaque passage, donc un commit par jour même sans nouvelles
  données. Elle ne change plus que si les données changent.

### Le push rejeté : un défaut introduit par l'agent

Mon push a été rejeté, et le `git pull` a laissé un conflit sur trois fichiers générés. La
cause venait du workflow ajouté par l'agent à l'étape précédente : il reconstruit le site et
pousse un commit dès que le résultat diffère, or deux sorties dépendaient de la machine. Les
dates étaient formatées dans le fuseau local (« 3 novembre » chez moi en UTC−11, « 4 novembre »
sur la CI), et le rapport de profilage écrivait l'encodage de la console. Le bot committait donc
à chaque push, et mon commit suivant divergeait. L'agent avait annoncé que le bot ne committait
que si quelque chose avait réellement changé : c'était vrai, mais il n'avait pas vérifié que deux
machines produisaient le même résultat.

Les deux sorties sont maintenant stables, ce que l'agent a vérifié avec un build en fins de ligne
LF, comme sur la CI, comparé à la version commitée.

**Exception à ma règle « Git est à moi »** : pour ce correctif, je lui ai explicitement demandé de
résoudre le conflit et de pousser. La fusion et le push sont donc de lui, sans `--force`. Depuis, je commite et je pousse de
nouveau moi-même, et les commits automatiques du workflow sont à mon nom.

### Ce que Lighthouse a mesuré (local, brotli, téléphone simulé)

Article : performance 79, TBT 0, CLS 0, SEO 100, bonnes pratiques 100. Le LCP simulé reste à
3,7 s : le bundle fait 119 Ko compressés, framer-motion compris. **Non résolu** ; à remesurer sur
Vercel. Le dashboard affiche SEO 69 uniquement à cause de son `noindex`, voulu.

### Décisions : qui a tranché quoi

| Sujet | Proposé par | Tranché par |
|---|---|---|
| Logo, animation d'ouverture, graphiques natifs variés | moi | moi |
| Pas de scène d'ouverture sur l'article (raison SEO) | l'agent | gardé par moi |
| Dix formes de graphiques, une par question | l'agent | gardé par moi |
| Matrice fournisseur × palier et histogramme des prix (nouvelles statistiques) | l'agent | gardé par moi |
| Article sans animation d'entrée | l'agent | gardé par moi |
| Audit Chrome permanent (`npm run audit`) | l'agent | gardé par moi |

---

## Étape 6 — Mise en ligne

J'ai importé le dépôt dans Vercel moi-même, avec `app` pour Root Directory. L'agent a ensuite
contrôlé l'adresse en ligne : pages, statuts, balises SEO, sitemap, puis son audit Chrome à 5
largeurs (114 contrôles réussis).

Lighthouse sur le site en ligne a relevé ce que les mesures locales n'avaient pas montré :

- un **décalage de mise en page de 0,15 sur l'article**, intermittent : quand les polices arrivent
  après le premier affichage, le chapeau passe de 179 à 209 px sur téléphone, et tout ce qui suit
  descend. Corrigé par des polices de repli calées sur les largeurs mesurées (209 px dans les deux
  cas, mesuré sur Chrome Windows ; à remesurer en ligne) ;
- un contraste de 4,35:1 sur l'accent foncé, corrigé à 5,1:1 ;
- aucun cache long sur les fichiers JS : les en-têtes étaient dans un `vercel.json` racine, que le
  projet n'utilisait pas. Déplacés dans `app/vercel.json`, et le fichier inutile a été supprimé.

Mesures en ligne avant ces correctifs, sur téléphone simulé : article performance 79, SEO 100 ;
tableau de bord performance 64, SEO 69 à cause de son `noindex`, voulu.

Après ces correctifs, sur l'article et en deux passages : performance 81 et 85, accessibilité 100,
bonnes pratiques 100, SEO 100, CLS 0 et 0,061 (sous le seuil de 0,1 de Google), LCP 3,1 et 2,9 s.
Le tableau de bord n'a pas été remesuré.

