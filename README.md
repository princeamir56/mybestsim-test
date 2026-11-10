# MyBestSim — Test de recrutement (Stagiaire Développeur IA & Automatisation)

**Amir Kerkeni** — étudiant ingénieur dernière année, Business Intelligence & Génie
Logiciel. Novembre 2026.

Deux livrables : un tableau de bord du catalogue eSIM, et un article SEO. Ce dépôt
contient les deux, et surtout **la trace de comment ils ont été construits**.

| Livrable | Lien |
|---|---|
| Dashboard eSIM (indicateurs et graphiques) | https://mybestsim-test.vercel.app/dashboard |
| Accueil (analyse, arbitrages et limites) | https://mybestsim-test.vercel.app |
| Article « Internet en croisière : quelle eSIM choisir ? » | https://mybestsim-test.vercel.app/internet-en-croisiere |
| Schéma interactif de l'automatisation | https://mybestsim-test.vercel.app/automation |

---

## Les trois choses à lire en premier

| Fichier | Ce qu'il contient |
|---|---|
| **[docs/etape-1-profilage.md](docs/etape-1-profilage.md)** | Ce que les 5 056 lignes contiennent vraiment, et les **six pièges** qu'elles tendent |
| **[docs/etape-2-decisions.md](docs/etape-2-decisions.md)** | Les chiffres définitifs, et les **quatre arbitrages** qui les produisent |
| **[AI-USAGE.md](AI-USAGE.md)** | Comment j'ai travaillé avec l'agent IA : qui a décidé quoi, ses erreurs et les miennes |

Et, si vous ne devez regarder qu'une commande :
**`npm run test-import`** ajoute un 19ᵉ fournisseur fictif et vérifie que le
livrable *change d'avis* au lieu de répéter ses conclusions de la veille.

Et, pour vérifier : [docs/profilage-sortie.txt](docs/profilage-sortie.txt),
[docs/etape-2-chiffres.txt](docs/etape-2-chiffres.txt),
[docs/etape-4-recherche-seo.md](docs/etape-4-recherche-seo.md).

---

## Démarrage

```bash
pip install -r requirements.txt      # pandas
npm install && npm --prefix app install

npm run build                        # CSV → JSON → site statique dans site/
npm run verifier                     # 101 contrôles sur le HTML réellement servi
npm run test-import                  # simule un 19ᵉ fournisseur et contrôle la prose
npm run preview                      # http://localhost:4173
```

Et en continu : [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml)
rejoue tout cela à chaque CSV déposé, chaque matin à 5 h, ou à la demande.

| Commande | Effet |
|---|---|
| `npm run donnees` | Rejoue uniquement l'agrégation Python |
| `npm run build` | Chaîne complète : agrégation, bundle Vite, prérendu |
| `npm run verifier` | Contrôle que le HTML servi est cohérent avec les données, sans navigateur |
| `npm run test-import` | Ajoute un 19ᵉ fournisseur hostile et vérifie que les **phrases** suivent |
| `npm run audit` | Pilote un vrai Chrome à 5 largeurs : parcours, contraste, débordements, textes superposés, compteurs (site servi sur le port 4173) |
| `npm run captures` | Pilote un vrai Chrome : captures + détection de débordement |
| `npm run profilage` · `npm run statistiques` | Les chiffres en texte brut |

---

## Architecture

Le brief impose un livrable **en ligne, ouvrable dans un navigateur sans rien
installer**. J'en tire une contrainte que tout le reste respecte :

> **Les CSV ne sont jamais lus par le navigateur.** Python les agrège **au moment du
> build** en un JSON, que Vite empaquette dans le bundle. Pas de backend, pas de base,
> aucun appel réseau vers les données.

```
data/fournisseurs/*.csv           18 fichiers fournisseurs
        │
        ├── scripts/mbs_catalogue.py      chargeur canonique + 5 garde-fous
        ├── scripts/build_site.py      ──▶ app/src/data/catalogue.json
        └── scripts/donnees_article.py ──▶ app/src/data/article.json
                                              │
                                        app/ (Vite · React · Tailwind)
                                              │
                                   vite build + prérendu SSR
                                              │
                                            site/   ← ce qui est publié
```

### Voir le pipeline tourner : `/automation`

La page [`/automation`](app/src/pages/Automatisation.jsx) rejoue le workflow réel sur un schéma
interactif : quatre scénarios (nouveau fichier, contrôle de 5 h, fichier corrompu, pull request),
un paquet qui change de nature à chaque étape, un journal d'exécution, et le détail de chaque
brique au clic. Le contenu décrit [`pipeline.yml`](.github/workflows/pipeline.yml) tel qu'il est
([`automatisation.js`](app/src/data/automatisation.js)) : le vérificateur recoupe les totaux
annoncés avec le code. Un bouton du panneau « Décisions » et le pied de page y mènent. Elle reste en
`noindex`, comme l'accueil et le dashboard : seul l'article a vocation à ranker.

La même page présente la **suite possible du projet** : un workflow n8n simulé, avec une toile de
nœuds, trois exécutions (tarifs reçus par mail, fichier invalide, pipeline en échec), et les
paramètres et la sortie de chaque nœud. Il prendrait en charge ce que le pipeline ne fait pas encore
(aller chercher les fichiers, écarter les mauvais, confirmer la publication). **Il n'est pas déployé** :
GitHub Actions resterait le seul à produire les chiffres, et la section le dit explicitement.

### `/dashboard` : les chiffres, sans commentaire

[`/dashboard`](app/src/pages/Dashboard.jsx) réunit huit indicateurs et dix graphiques, sans aucun
paragraphe. Il réutilise les composants de graphiques de l'accueil et lit le même `catalogue.json` :
les deux pages ne peuvent pas diverger. Le vérificateur contrôle qu'aucun paragraphe explicatif ne
s'y glisse. L'accueil reste à `/`, avec l'analyse, les arbitrages et les limites.

### Un seul point d'entrée pour les données

[`scripts/mbs_catalogue.py`](scripts/mbs_catalogue.py) est le **unique** chargeur :
profilage, statistiques, JSON du tableau de bord et tableau de prix de l'article
l'utilisent tous. Deux chiffres du livrable ne peuvent donc pas diverger.

Il embarque sept assertions qui **font échouer le build** plutôt que de laisser passer
un chiffre faux — dont celle qui garde le piège le plus coûteux du jeu de données :

```python
assert (df["country_code"] == "NA").any(), \
    "aucun country_code 'NA' : pandas les a convertis en NaN (keep_default_na)"
```

### Aucun chiffre en dur — pas même dans les phrases

Le brief décrit un import **quotidien**. Un dépôt qui ne tient que sur l'instantané
du jour n'est donc pas une réponse au brief, c'est une maquette.

Les chiffres étaient déjà calculés. Le danger était ailleurs : **la phrase qui
commente le chiffre, parce que personne ne la recalcule.**

> « Les 56 produits à plus de 100 € sont **tous** des illimités » était vrai le
> 4 novembre 2026, sur 18 fichiers. Ce n'est pas une loi du marché : c'est une
> observation datée.

Écrite en dur, cette phrase rendait le projet **inautomatisable** : un 19ᵉ fournisseur
aurait changé les graphiques sans changer le texte, et le livrable se serait mis à
mentir tout seul — silencieusement, ce qui est le pire des cas.

Toute la prose du dashboard est donc produite par
[`faits()`](scripts/mbs_catalogue.py), qui calcule ce que les phrases *affirment* :

```python
"chers_tous_illimites": bool(len(chers) and chers["illimite"].all()),
```

Et chaque affirmation forte a une version de repli chiffrée. Si un import la dément,
elle **se dégrade au lieu de devenir fausse** :

| Aujourd'hui | Si un forfait limité passait les 100 € |
|---|---|
| « Les 56 produits à plus de 100 € sont tous des illimités » | « 56 des 57 produits à plus de 100 € sont des illimités » |
| « La barre des 100 € tombe pile dans l'intervalle vide » | « La barre des 100 € ne sépare plus les deux familles » |

**Ce n'est pas seulement le nombre qui bascule, c'est l'argument.** Si une
déduplication venait à retirer des lignes, D1 ne conclurait plus « chaque ligne est
donc une référence vendable distincte » : il dirait que sa prémisse est tombée.

`npm run test-import` vérifie exactement cela, sur un 19ᵉ fournisseur construit pour
démentir chaque affirmation du dashboard. 14 contrôles, code de sortie non nul en cas
d'échec.

La même règle vaut pour les conseils de l'article. À partir de combien de pays une eSIM régionale
bat-elle les eSIM locales ? `multi_pays()`, dans
[`donnees_article.py`](scripts/donnees_article.py), le calcule depuis les prix, et chaque phrase
lit ce résultat. Il était auparavant écrit à la main, et il était faux.

### Le vérificateur ne connaît aucune valeur attendue

Même raisonnement un cran plus loin. [`verifier_site.js`](scripts/verifier_site.js)
attendait les chaînes `'5 056'`, `'14,49 Go'`, `'29,30 €'` : il contrôlait donc *« le
site affiche-t-il les valeurs du 4 novembre 2026 ? »*. Un nouvel import l'aurait fait
échouer **alors que le site aurait eu raison**.

Il charge désormais `catalogue.json` et `article.json`, et contrôle la **cohérence**
entre les données et la page — un invariant qui reste vrai quel que soit l'import :

- les six statistiques du brief, lues dans le JSON et cherchées dans le HTML ;
- **chaque champ de chaque arbitrage** (`retenu`, `pourquoi`, `alternative`) retrouvé
  mot pour mot dans le HTML servi : c'est ce qui prouve qu'un changement de données
  traverse toute la chaîne jusqu'à la page ;
- les pièges, les limites, les prix de l'article, le nom de chaque fournisseur ;
- les conseils de l'article : le seuil local / régional calculé est repris partout, et aucune
  phrase n'en annonce un autre ;
- la **date de génération** du JSON, présente dans le pied de page — sans quoi un site
  construit depuis un JSON périmé passerait tous les autres tests sans broncher.

101 contrôles, aucune valeur attendue écrite en dur.

### La preuve de bout en bout

```bash
cp /chemin/vers/un-19e-fournisseur.csv data/fournisseurs/
npm run build && npm run verifier     # doit passer : rien n'est figé
rm data/fournisseurs/un-19e-fournisseur.csv && npm run build
```

C'est cette procédure — pas le test unitaire — qui a trouvé le dernier défaut : une
tuile de KPI affirmait encore que les illimités portaient « à elle seule » *tous* les
produits à plus de 100 €.

### Pourquoi un prérendu, puisque c'est une application React ?

[`app/scripts/prerender.mjs`](app/scripts/prerender.mjs) écrit un fichier HTML complet
par route, via `renderToString`. Trois raisons :

1. **L'article est un livrable SEO.** Son contenu doit être dans le code source servi,
   pas injecté après coup. Un tableau de prix rendu côté client dépend du moteur de
   rendu de Google ; un tableau prérendu ne dépend de rien.
2. **Un hébergement statique ne connaît pas les routes du client** : sans fichier à
   `/internet-en-croisiere/`, l'URL renvoie un 404 avant que React ne démarre.
3. **Sans JavaScript, les deux pages restent entièrement lisibles.**

Les composants de révélation détectent le rendu serveur
([`app/src/lib/ssr.js`](app/src/lib/ssr.js)) et écrivent leur état **final** dans le
HTML statique. Les accordéons des décisions et de la FAQ sont **tous ouverts au
prérendu** : sans ça, le HTML servi ne contiendrait qu'un seul des quatre
contrefactuels.

---

## Conception visuelle

Le système reprend celui de mes autres projets (Nostra, HB Travel, Huilerie Zouyout
Alchifa) : papier chaud, une famille de bleus, **un seul accent** réservé aux appels à
l'action, serif d'affichage contre sans-serif de texte, et du mono pour *tout ce que le
catalogue mesure plutôt qu'il ne le dit*.

**Les couleurs des graphiques ont été validées avant d'écrire la moindre ligne de CSS** :
bande de luminosité, plancher de chroma, séparation protan/tritan et contraste, en mode
clair comme sur la surface sombre. « Est-ce que ces deux couleurs se distinguent pour un
daltonien » est une question calculable — il n'y a aucune raison de la deviner.

Conséquence de forme : **jamais dix-huit couleurs pour dix-huit fournisseurs.** Une
seule teinte quand l'information est la taille ou le rang, deux quand deux séries sont
réellement le sujet, une échelle divergente quand le signe de l'écart est la question.

### Une forme de graphique par question

Aucune librairie : chaque graphique est écrit pour ce projet, en SVG dessiné au pixel réel
(un SVG étiré réduit aussi son texte), avec son info-bulle au survol et au tap, et son état
final écrit dans le HTML prérendu.

| Question | Forme | Pourquoi celle-là |
|---|---|---|
| Où se situent les prix ? | Histogramme empilé + repères | Seule forme qui montre qu'au-delà de 100 € il ne reste que des illimités |
| Qui pèse combien ? | Treemap | La part de chacun, nom et compte écrits dans chaque case |
| Chez qui le Go coûte le moins ? | Points autour de la médiane | Marché resserré : un point peut se lire sur un axe tronqué, pas une barre |
| Taille ou vrai bon prix ? | Nuage de points | Sépare « gagne parce qu'il est partout » de « gagne parce qu'il est moins cher » |
| Qui est moins cher, et sur quoi ? | Matrice divergente | Fournisseur × palier : ce que tout classement global écrase |
| Que rapporte la comparaison ? | Haltères | La longueur du trait est l'économie, sur une échelle commune |
| Combien d'offres par palier ? | Colonnes | Catégories ordonnées, valeur directe |
| Comment évolue le prix du Go ? | Courbe | Tendance sur des paliers ordonnés |
| Que coûte l'illimité ? | Deux courbes et leur écart | La bande EST la prime ; durées à l'échelle réelle |
| Mono-pays ou régional ? | Anneau + barres | Deux parts d'un tout, puis le détail des zones |

Mouvement : une seule courbe pour tout le site, `prefers-reduced-motion` respecté
partout (y compris le défilement lissé, coupé net), et l'effet magnétique désactivé au
doigt.

**La scène d'ouverture** : le corps et les ailes de l'oiseau sont trois pièces découpées
dans le logo ; il s'assemble, bat des ailes, le mot s'écrit, et le rideau se lève. Une fois
par session, uniquement à l'arrivée sur le tableau de bord. **Pas sur l'article**, page
d'atterrissage SEO où un rideau retarderait le plus grand affichage que Google mesure. Elle
n'existe jamais dans le HTML servi : sans JavaScript, la page est directement lisible.

**La page de lecture ne rejoue aucune entrée** : le texte de l'article est là tout de suite,
sans saut quand React prend la main.

**Le haut du tableau de bord non plus.** Titre, texte, boutons et chiffres sont en place dès
l'ouverture, sans compteur ni délai. Une fois la scène d'ouverture vue, le voile sombre n'est
plus posé : le hero s'affiche dès l'arrivée du HTML. La scène elle-même dure environ 3 s,
lever du rideau compris, et le hero est déjà complet quand le rideau se lève.

**L'image de fond du hero** est ancrée en bas de la section, jamais déformée, et le fond de la
section reprend la couleur de son ciel (`#001025`), de sorte qu'aucun raccord ne se voit.

| Largeur | Fichier | Placement |
|---|---|---|
| Moins de 640 px | Recadrage `esim-mobile-*` (la scène entière) | Sous le texte et les chiffres |
| 640 à 1023 px | Image entière `esim-*` | Sous le texte et les chiffres |
| 1024 à 1680 px | Image entière `esim-*` | Sur toute la section, voile sombre à gauche derrière le texte |
| Au-delà de 1680 px | Image entière, plafonnée à 1680 px | Centrée, bords fondus dans le ciel |

Le texte ne dépend jamais de l'image pour rester lisible : les chiffres sont posés sur un
bandeau opaque à 70 % et flouté. L'image est décorative (`alt` vide), précharge par largeur
d'écran, et pèse de 50 à 108 Ko selon la taille servie.

Sous 1024 px, la parallaxe du hero est coupée : elle faisait glisser les chiffres sur le téléphone de
l'image pendant le défilement.

**Le schéma de couverture de l'article est une animation en boucle de 5 s** : un navire quitte
le port, perd le réseau terrestre, puis passe sur le satellite du bord. Elle est écrite en SVG et
en CSS, pas en fichier vidéo : le schéma reste dans le HTML servi, net à toute taille, sans son,
sans lecteur et sans téléchargement supplémentaire. En mouvement réduit, il redevient le schéma
fixe à trois navires.

---

## Mise en ligne

**Vercel** — le projet a `app` pour Root Directory, et [`app/vercel.json`](app/vercel.json)
s'applique : Vite et le prérendu construisent vers `app/dist`. Python n'est **pas** nécessaire
sur Vercel : les JSON agrégés sont versionnés.

**Quand un CSV est ajouté** : GitHub Actions rejoue l'agrégation et les contrôles. Si tout passe,
il commite les JSON et `site/` régénérés, et ce commit déclenche le redéploiement. Si un contrôle
échoue, rien n'est commité : le site en ligne garde les dernières données valides.

L'URL publique alimente les balises canoniques, `robots.txt` et le sitemap. Elle est
résolue dans cet ordre :

1. `SITE_ORIGIN`, si la variable est posée ;
2. `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel expose au build — **rien à configurer
   pour un déploiement nominal** ;
3. un repli, pour que le build local ne casse pas.

> L'accueil et le dashboard sont volontairement en `noindex` : ce sont des outils internes,
> pas des pages à faire ranker. Le sitemap ne liste donc que l'article. Le contrôle « le sitemap ne
> liste que les pages indexables » verrouille ce choix.

## Organisation du dépôt

```
data/fournisseurs/      les 18 CSV fournis, non modifiés
docs/                   brief, profilage, décisions, recherche SEO, sorties brutes
scripts/
  mbs_catalogue.py      chargeur canonique + garde-fous
  profilage.py          étape 1 : constate, ne décide rien
  statistiques.py       étape 2 : applique les décisions, produit les chiffres
  build_site.py         agrège le catalogue vers app/src/data/
  donnees_article.py    prix de l'article, extraits du même catalogue
  verifier_site.js      101 contrôles : cohérence données ↔ HTML, liens internes, SEO
  test_nouveau_fournisseur.py  simule un 19e fournisseur : la prose suit-elle ?
app/
  src/components/       ui/ · charts/ (10 formes en SVG natif) · sections/ · layout/ · automatisation/
  src/lib/              motion.js · format.js · ssr.js
  src/data/             JSON produits par Python (versionnés)
  scripts/prerender.mjs un HTML complet par route
  scripts/shots.mjs     pilote Chrome : captures + débordement horizontal
  scripts/audit.mjs     pilote Chrome : parcours réels et mesures à 5 largeurs
  public/marque/        le logo détouré, et ses pièces pour l'animation d'ouverture
  public/hero/          l'image de fond du hero, en WebP : deux tailles et un recadrage téléphone
site/                   la sortie publiée
AI-USAGE.md             méthode de travail avec l'agent IA
```

Les CSV et le PDF du brief sont **volontairement versionnés** : sans eux, le dépôt n'est
pas reproductible.

---

## Méthode

Six étapes, chacune relue avant la suivante. L'historique détaillé a été regroupé en un
seul commit à la publication du dépôt ; le déroulé est consigné dans
[AI-USAGE.md](AI-USAGE.md).

| | Étape | État |
|---|---|---|
| 1 | Lecture du brief et profilage des données | ✅ |
| 2 | Calcul et validation de toutes les statistiques en texte brut | ✅ |
| 3 | Construction du tableau de bord | ✅ |
| 4 | Analyse concurrentielle et plan de l'article | ✅ |
| 5 | Rédaction de l'article | ✅ |
| — | Refonte visuelle en React | ✅ |
| — | Prose dérivée des données : le dépôt devient un pipeline rejouable | ✅ |
| — | Vérificateur relatif aux données + déclencheur GitHub Actions | ✅ |
| — | Polissage UI/UX, graphiques natifs, logo animé, SEO technique | ✅ |
| 6 | Mise en ligne des deux livrables | ✅ |
| — | Retouches après test manuel : mobile, ouverture immédiate, image de fond du hero | ✅ |
| — | Schéma interactif de l'automatisation (`/automation`) | ✅ |
| — | Relecture critique avant l'envoi : quatre défauts corrigés et documentés | ✅ |
| — | Article renforcé : offres nommées par itinéraire, liens MyBestSim, suggestions d'images | ✅ |
| — | Corrections d'interface sur téléphone, et contrôle permanent des textes superposés | ✅ |
| — | Page `/dashboard` (indicateurs et graphiques seuls), navigation par pages | ✅ |

L'ordre n'est pas décoratif : **aucun travail de mise en forme n'a été engagé avant que
les chiffres soient validés.** Un tableau de bord soigné construit sur des chiffres faux
est la seule erreur qu'on ne rattrape pas.
