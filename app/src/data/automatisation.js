// Le contenu du schéma de /automation : ce que fait réellement le dépôt.
//
// Tout ce qui est écrit ici décrit .github/workflows/pipeline.yml et les scripts
// qu'il appelle. Les totaux de contrôles sont recoupés par verifier_site.js : ils
// ne peuvent pas diverger du code sans faire échouer le build.
import catalogue from './catalogue.json';
import { n } from '../lib/format.js';

export const CONTROLES = { verifier: 80, prose: 14, assertions: 7 };

const lignes = n(catalogue.meta.lignes);
const fichiers = catalogue.meta.fichiers;
const WORKFLOW = '.github/workflows/pipeline.yml';

export const NOEUDS = {
  cron: {
    titre: 'Chaque matin',
    sous: '5 h UTC',
    icone: 'horloge',
    quoi: "GitHub relance tout le pipeline chaque matin, même si personne n'a touché au dépôt.",
    fichier: WORKFLOW,
    commande: "schedule: cron '0 5 * * *'",
    pourquoi: "Une dérive se détecte avant qu'un visiteur ne la voie.",
  },
  csv: {
    titre: 'Fichier déposé',
    sous: 'push sur main',
    icone: 'fichier',
    quoi: "Déposer un fichier fournisseur dans le dépôt suffit. Une modification du code déclenche la même chaîne.",
    fichier: 'data/fournisseurs/',
    commande: 'git push origin main',
    pourquoi: "Le brief décrit un import quotidien : ajouter un fournisseur ne doit demander aucune retouche du code.",
  },
  manuel: {
    titre: 'À la demande',
    sous: 'workflow_dispatch',
    icone: 'lecture',
    quoi: "Un bouton dans l'onglet Actions de GitHub relance la même chaîne, sans aucun commit.",
    fichier: WORKFLOW,
    commande: 'workflow_dispatch',
    pourquoi: 'Pour rejouer le pipeline sans attendre le lendemain matin.',
  },
  pr: {
    titre: 'Pull request',
    sous: 'contrôles seuls',
    icone: 'branche',
    quoi: "Une proposition de changement passe par tous les contrôles, mais l'étape de publication est ignorée.",
    fichier: WORKFLOW,
    commande: "if: github.event_name != 'pull_request'",
    pourquoi: "On sait si un changement casse quelque chose avant de l'accepter.",
  },
  agr: {
    titre: 'Agréger',
    sous: `Python · ${CONTROLES.assertions} assertions`,
    puce: 'catalogue.json',
    icone: 'entonnoir',
    quoi: `Un seul chargeur lit les ${fichiers} fichiers fournisseurs et produit les JSON du site. Les phrases sont recalculées avec les chiffres.`,
    fichier: 'scripts/mbs_catalogue.py',
    commande: 'npm run donnees',
    pourquoi: `Ses ${CONTROLES.assertions} assertions arrêtent tout plutôt que de laisser passer un chiffre faux.`,
  },
  bld: {
    titre: 'Construire',
    sous: 'Vite + React, prérendu',
    puce: 'un HTML par route',
    icone: 'cube',
    quoi: "Vite empaquette les JSON dans l'application, puis un fichier HTML complet est écrit pour chaque page.",
    fichier: 'app/scripts/prerender.mjs',
    commande: 'npm --prefix app run build',
    pourquoi: 'Pas de serveur ni de base de données, et un article lisible par Google sans JavaScript.',
  },
  ver: {
    titre: 'Vérifier',
    sous: `${CONTROLES.verifier} contrôles`,
    puce: 'HTML comparé au JSON',
    icone: 'bouclier',
    quoi: "Le HTML qui sera servi est comparé aux données qui l'ont produit : chiffres, phrases, SEO, liens internes.",
    fichier: 'scripts/verifier_site.js',
    commande: 'npm run verifier',
    pourquoi: "Aucune valeur attendue n'y est écrite en dur : un nouvel import ne le fait pas échouer à tort.",
  },
  tst: {
    titre: 'Tester la prose',
    sous: `${CONTROLES.prose} contrôles`,
    puce: 'fournisseur fictif',
    icone: 'texte',
    quoi: 'Un fournisseur fictif, construit pour démentir chaque affirmation, vérifie que les phrases changent de conclusion.',
    fichier: 'scripts/test_nouveau_fournisseur.py',
    commande: 'npm run test-import',
    pourquoi: "Une phrase qui ne suit plus les chiffres est l'erreur que personne ne recalcule.",
  },
  gate: {
    titre: 'Changement ?',
    sous: 'git diff',
    puce: 'docs régénérées',
    icone: 'losange',
    quoi: "Les rapports sont régénérés, puis le workflow compare le résultat à ce qui est déjà dans le dépôt.",
    fichier: WORKFLOW,
    commande: 'git diff --cached --quiet',
    pourquoi: "Sans ce test, le passage de 5 h créerait un commit chaque jour pour rien.",
  },
  fin: {
    titre: 'Rien à publier',
    sous: 'aucun commit',
    icone: 'coche',
    quoi: "Le catalogue est identique au dernier build, ou il s'agit d'une pull request : le workflow s'arrête proprement.",
    fichier: WORKFLOW,
    commande: 'exit 0',
    pourquoi: "L'historique du dépôt ne contient que de vrais changements.",
  },
  stop: {
    titre: 'Arrêt immédiat',
    sous: "Rien n'est commité : le site garde sa dernière version valide.",
    sousCourt: 'site inchangé',
    icone: 'croix',
    quoi: "Une assertion ou un contrôle échoue : le job s'arrête, rien n'est commité, et le site en ligne ne bouge pas.",
    fichier: WORKFLOW,
    commande: 'exit code 1',
    pourquoi: 'Mieux vaut un site en retard d\'un jour qu\'un site qui affiche un chiffre faux.',
  },
  commit: {
    titre: 'Commit automatique',
    sous: 'JSON, site/ et docs',
    icone: 'commit',
    quoi: "Les JSON, le site et les rapports régénérés sont commités au nom du propriétaire du dépôt, puis poussés.",
    fichier: WORKFLOW,
    commande: 'git commit && git push',
    pourquoi: "Chaque mise à jour du catalogue laisse une trace datée dans l'historique.",
  },
  vercel: {
    titre: 'Vercel',
    sous: 'build depuis app/',
    icone: 'triangle',
    quoi: 'Le nouveau commit déclenche le déploiement. Vercel reconstruit le site à partir des JSON versionnés, sans Python.',
    fichier: 'app/vercel.json',
    commande: 'SORTIE_SITE=dist npm run build',
    pourquoi: 'Le calcul a déjà été fait et vérifié : le déploiement ne peut pas produire d\'autres chiffres.',
  },
  site: {
    titre: 'Site en ligne',
    sous: `${lignes} offres, ${fichiers} fournisseurs`,
    icone: 'ecran',
    enLigne: true,
    quoi: 'Le tableau de bord et l\'article affichent les nouvelles données, phrases comprises. Personne n\'a touché au code.',
    fichier: 'mybestsim-test.vercel.app',
    commande: 'https://mybestsim-test.vercel.app',
    pourquoi: 'Un lien suffit : rien à télécharger ni à installer, comme le demande le brief.',
  },
};

// ------------------------------------------------------------- les scénarios

const pas = (noeud, arete, paquet, legende, log, extra = {}) => ({ noeud, arete, paquet, legende, log, ...extra });

const LOG_AGREGER = ['$ npm run donnees', `ok  ${lignes} lignes agrégées · ${fichiers} fournisseurs`];
const LOG_BUILD = ['$ npm --prefix app run build', 'ok  un fichier HTML écrit par route'];
const LOG_VERIF = ['$ npm run verifier', `ok  ${CONTROLES.verifier} contrôles · Toutes les vérifications passent.`];
const LOG_PROSE = ['$ npm run test-import', 'ok  Le livrable suit les données : prose comprise.'];

const controles = (debut, paquet) => [
  pas('agr', `${debut}>agr`, paquet, "Le chargeur lit les fichiers, applique ses garde-fous et produit les JSON.", LOG_AGREGER),
  pas('bld', 'agr>bld', 'JSON', "Les JSON entrent dans l'application, et chaque page devient un fichier HTML complet.", LOG_BUILD),
  pas('ver', 'bld>ver', 'HTML', 'Le HTML servi est comparé, mot pour mot, aux données qui l\'ont produit.', LOG_VERIF),
  pas('tst', 'ver>tst', 'HTML', 'Un fournisseur fictif vérifie que les phrases changent de conclusion.', LOG_PROSE),
];

export const SCENARIOS = [
  {
    id: 'depot',
    libelle: 'Nouveau fichier',
    resume: "Un fournisseur est ajouté : le site se met à jour tout seul.",
    etapes: [
      pas('csv', null, null, 'Un fichier arrive dans data/fournisseurs/ : le push réveille le workflow.', ['$ git push origin main', 'on: push · data/fournisseurs/**', 'ubuntu-latest · Python 3.12 · Node 20']),
      ...controles('csv', 'CSV'),
      pas('gate', 'tst>gate', 'OK', 'Les rapports sont régénérés. Le résultat diffère du dépôt : il faut publier.', ['$ npm run profilage && npm run statistiques', '$ git add app/src/data site docs', 'ok  des fichiers ont changé']),
      pas('commit', 'gate>commit', 'diff', 'Le workflow commite le résultat et le pousse sur main.', ['$ git commit -m "chore(data): rebuild automatique"', '$ git pull --rebase && git push']),
      pas('vercel', 'commit>vercel', 'push', 'Le nouveau commit déclenche le déploiement sur Vercel.', ['$ SORTIE_SITE=dist npm run build', 'ok  déploiement construit depuis app/']),
      pas('site', 'vercel>site', 'site', 'Le site affiche les nouvelles données, sans intervention sur le code.', [`ok  en ligne · ${lignes} offres`]),
    ],
  },
  {
    id: 'matin',
    libelle: 'Contrôle de 5 h',
    resume: "Rien n'a changé : tout est contrôlé, et aucun commit n'est créé.",
    etapes: [
      pas('cron', null, null, "5 h UTC : GitHub relance le pipeline, sans qu'aucun commit ne soit nécessaire.", ["schedule: cron '0 5 * * *'", 'ubuntu-latest · Python 3.12 · Node 20']),
      ...controles('cron', 'cron'),
      pas('gate', 'tst>gate', 'OK', 'Le résultat est identique à ce qui est déjà dans le dépôt.', ['$ npm run profilage && npm run statistiques', '$ git diff --cached --quiet']),
      pas('fin', 'gate>fin', '=', "Aucun changement : pas de commit, pas de déploiement. Tout a quand même été vérifié.", ['ok  Aucun changement : le catalogue est identique au dernier build.']),
    ],
  },
  {
    id: 'erreur',
    libelle: 'Fichier corrompu',
    resume: 'Une donnée est fausse : le pipeline refuse de publier.',
    etapes: [
      pas('csv', null, null, 'Un fichier contenant un prix négatif est déposé dans le dépôt.', ['$ git push origin main', 'on: push · data/fournisseurs/**']),
      pas('agr', 'csv>agr', 'CSV', "Une assertion du chargeur détecte l'anomalie.", ['$ npm run donnees', 'xx  AssertionError: prix nul ou négatif détecté'], { echec: true }),
      pas('stop', 'agr>stop', 'stop', "Le job s'arrête. Rien n'est commité, et le site en ligne garde sa dernière version valide.", ['xx  Process completed with exit code 1', 'ok  site en ligne inchangé'], { echec: true }),
    ],
  },
  {
    id: 'proposition',
    libelle: 'Pull request',
    resume: 'Un changement est proposé : il est contrôlé, jamais publié.',
    etapes: [
      pas('pr', null, null, 'Une pull request touche aux données, au code ou aux scripts.', ['on: pull_request', 'ubuntu-latest · Python 3.12 · Node 20']),
      ...controles('pr', 'PR'),
      pas('gate', 'tst>gate', 'OK', "Tous les contrôles passent, et le résultat s'affiche sur la pull request.", ['$ npm run profilage && npm run statistiques']),
      pas('fin', 'gate>fin', '=', "L'étape de publication est ignorée : seule la fusion pourra mettre le site à jour.", ["if: github.event_name != 'pull_request'", 'ok  étape « Publier le résultat » ignorée']),
    ],
  },
];

// ------------------------------------------------------------------ la géométrie
// [x, y, largeur, hauteur] dans le repère de chaque disposition.

const NOEUDS_BUREAU = {
  cron: [0, 70, 156, 76], csv: [0, 166, 156, 76], manuel: [0, 262, 156, 76], pr: [0, 358, 156, 76],
  agr: [206, 190, 140, 112], bld: [372, 190, 140, 112], ver: [538, 190, 140, 112], tst: [704, 190, 140, 112], gate: [870, 190, 140, 112],
  stop: [206, 378, 638, 84], fin: [870, 378, 140, 84],
  commit: [1070, 70, 218, 84], vercel: [1070, 212, 218, 88], site: [1070, 356, 218, 128],
};

const entree = (y) => [[156, y], [176, y], [176, 246], [206, 246]];
const descente = (x) => [[x, 302], [x, 378]];

export const BUREAU = {
  W: 1300,
  H: 508,
  noeuds: NOEUDS_BUREAU,
  cadre: [190, 52, 846, 440],
  aretes: {
    'cron>agr': entree(108), 'csv>agr': entree(204), 'manuel>agr': entree(300), 'pr>agr': entree(396),
    'agr>bld': [[346, 246], [372, 246]], 'bld>ver': [[512, 246], [538, 246]], 'ver>tst': [[678, 246], [704, 246]], 'tst>gate': [[844, 246], [870, 246]],
    'agr>stop': descente(276), 'bld>stop': descente(442), 'ver>stop': descente(608), 'tst>stop': descente(774),
    'gate>fin': [[940, 302], [940, 378]],
    'gate>commit': [[1010, 246], [1052, 246], [1052, 112], [1070, 112]],
    'commit>vercel': [[1179, 154], [1179, 212]],
    'vercel>site': [[1179, 300], [1179, 356]],
    boucle: [[1288, 420], [1296, 420], [1296, 18], [78, 18], [78, 70]],
  },
  puces: { agr: [206, 132, 140], bld: [372, 132, 140], ver: [538, 132, 140], tst: [704, 132, 140], gate: [870, 132, 140] },
  etiquettes: [[1046, 228, 'oui'], [956, 340, 'non'], [292, 340, 'échec'], [640, 18, 'Le lendemain, 5 h UTC : tout recommence']],
};

const TELEPHONE_W = 320;
const gauche = (y) => [[30, y], [16, y], [16, 783], [30, 783]];
const bus = (x, y) => [[x, y], [160, y], [160, 216]];

export const TELEPHONE = {
  W: TELEPHONE_W,
  H: 1160,
  noeuds: {
    cron: [12, 0, 142, 68], csv: [166, 0, 142, 68], manuel: [12, 78, 142, 68], pr: [166, 78, 142, 68],
    agr: [30, 216, 260, 72], bld: [30, 320, 260, 72], ver: [30, 424, 260, 72], tst: [30, 528, 260, 72], gate: [30, 632, 260, 72],
    stop: [30, 744, 124, 78], fin: [166, 744, 124, 78],
    commit: [30, 860, 260, 70], vercel: [30, 964, 260, 70], site: [30, 1068, 260, 86],
  },
  cadre: [6, 172, 308, 664],
  aretes: {
    'cron>agr': bus(154, 34), 'csv>agr': bus(166, 34), 'manuel>agr': bus(154, 112), 'pr>agr': bus(166, 112),
    'agr>bld': [[160, 288], [160, 320]], 'bld>ver': [[160, 392], [160, 424]], 'ver>tst': [[160, 496], [160, 528]], 'tst>gate': [[160, 600], [160, 632]],
    'agr>stop': gauche(252), 'bld>stop': gauche(356), 'ver>stop': gauche(460), 'tst>stop': gauche(564),
    'gate>fin': [[290, 668], [304, 668], [304, 783], [290, 783]],
    'gate>commit': [[160, 704], [160, 860]],
    'commit>vercel': [[160, 930], [160, 964]],
    'vercel>site': [[160, 1034], [160, 1068]],
  },
  puces: {},
  etiquettes: [[176, 722, 'oui'], [296, 722, 'non']],
};
