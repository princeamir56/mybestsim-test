// Le workflow n8n PROPOSÉ pour faire évoluer le projet. Rien de tout cela n'est déployé :
// la section le dit, et le vérificateur contrôle qu'elle le dit.
//
// Le principe : n8n orchestre ce qui se passe avant et après le dépôt. GitHub Actions
// reste le seul à produire les chiffres, et l'IA ne rédige que des textes.
import catalogue from './catalogue.json';

const fournisseur = catalogue.fournisseurs[catalogue.fournisseurs.length - 1];
const offres = fournisseur.produits;
const items = `${offres} items`;
const fichier = fournisseur.nom.toLowerCase().replace(/\s+/g, '');
const SITE = 'https://mybestsim-test.vercel.app';

export const NOEUDS_N8N = {
  gmail: {
    type: 'Gmail Trigger', sous: 'nouveau mail', icone: 'mail', famille: 'declencheur', declencheur: true,
    role: "Se déclenche dès qu'un fournisseur envoie ses tarifs en pièce jointe.",
    parametres: [['Filtre', 'has:attachment label:tarifs'], ['Pièces jointes', 'téléchargées']],
    sortie: { from: 'tarifs@fournisseur.example', subject: 'Tarifs eSIM', attachment: `${fichier} (CSV)` },
  },
  schedule: {
    type: 'Schedule Trigger', sous: 'chaque matin', icone: 'horloge', famille: 'declencheur', declencheur: true,
    role: 'Lance la collecte auprès des fournisseurs qui déposent leurs fichiers sur un serveur.',
    parametres: [['Intervalle', 'tous les jours'], ['Heure', '4 h UTC, avant le contrôle de 5 h']],
    sortie: { timestamp: 'exécution planifiée' },
  },
  webhook: {
    type: 'Webhook', sous: 'POST /catalogue', icone: 'eclair', famille: 'declencheur', declencheur: true,
    role: "Reçoit les fichiers envoyés par l'API d'un fournisseur ou par un formulaire interne.",
    parametres: [['Méthode', 'POST'], ['Authentification', 'en-tête secret']],
    sortie: { fournisseur: fournisseur.nom, binary: 'fichier reçu' },
  },
  ftp: {
    type: 'FTP', sous: 'download', icone: 'serveur', famille: 'donnees',
    role: 'Récupère le fichier du jour sur le serveur SFTP du fournisseur.',
    parametres: [['Protocole', 'SFTP'], ['Opération', 'Download']],
    sortie: { fichier: `${fichier} (CSV)`, statut: 'téléchargé' },
  },
  extract: {
    type: 'Extract from File', sous: 'CSV vers items', icone: 'fichier', famille: 'donnees',
    role: 'Transforme le fichier en lignes. Chaque colonne reste du texte, pour que le code NA ne soit jamais pris pour une valeur vide.',
    parametres: [['Format', 'CSV'], ['Encodage', 'UTF-8']],
    sortie: { sku: '4sesim-104965', provider: '4S eSIM', country_code: 'BR', data_gb: '3', validity_days: '7', price: '9.82', currency: 'EUR' },
  },
  valider: {
    type: 'Code', sous: 'mêmes règles', icone: 'code', famille: 'logique',
    role: 'Applique avant le commit les règles du chargeur : colonnes, devise, prix positifs, SKU uniques.',
    parametres: [['Langage', 'Python'], ['Mode', 'une fois pour tous les items']],
    sortie: { valide: true, lignes: offres, anomalies: [] },
  },
  if1: {
    type: 'If', sous: 'fichier valide ?', icone: 'branche', famille: 'logique', sorties: true,
    role: 'Sépare les fichiers conformes de ceux qui ne doivent pas entrer dans le dépôt.',
    parametres: [['Condition', '{{ $json.valide }} est vrai']],
    sortie: { branche: 'true', valide: true },
  },
  commit: {
    type: 'GitHub', sous: 'edit file', icone: 'depot', famille: 'depot',
    role: 'Dépose le fichier validé dans le dépôt. Ce commit déclenche le pipeline GitHub Actions actuel, sans le modifier.',
    parametres: [['Dépôt', 'princeamir56/mybestsim-test'], ['Dossier', 'data/fournisseurs/'], ['Branche', 'main']],
    sortie: { commit: 'import automatique', fournisseur: fournisseur.nom, branche: 'main' },
  },
  wait: {
    type: 'Wait', sous: 'résultat du pipeline', icone: 'pause', famille: 'logique',
    role: 'Le workflow se met en veille, puis reprend quand GitHub Actions appelle son adresse de reprise.',
    parametres: [['Reprise', 'appel webhook'], ['Délai maximum', '30 minutes']],
    sortie: { pipeline: 'success', etapes: ['agréger', 'construire', 'vérifier', 'tester'] },
  },
  if2: {
    type: 'If', sous: 'pipeline vert ?', icone: 'branche', famille: 'logique', sorties: true,
    role: 'Décide si la mise à jour peut être confirmée, ou si le dépôt doit revenir en arrière.',
    parametres: [['Condition', "{{ $json.pipeline }} vaut 'success'"]],
    sortie: { branche: 'true', pipeline: 'success' },
  },
  site: {
    type: 'HTTP Request', sous: 'site en ligne', icone: 'globe', famille: 'donnees',
    role: 'Vérifie que la page publiée répond bien, et porte la date du nouveau catalogue.',
    parametres: [['Méthode', 'GET'], ['Adresse', SITE]],
    sortie: { statusCode: 200, catalogue: 'à jour' },
  },
  resume: {
    type: 'AI Agent', sous: 'résume les écarts', icone: 'etincelle', famille: 'ia',
    role: "Rédige en français ce qui a changé : nouvelles offres, plus fortes variations. Il écrit un message, jamais une donnée.",
    parametres: [['Entrée', 'écarts calculés par le workflow'], ['Sortie', 'texte du message']],
    sortie: { resume: `${fournisseur.nom} : ${offres} offres importées et contrôlées.` },
  },
  slack: {
    type: 'Slack', sous: 'mise à jour publiée', icone: 'message', famille: 'notification',
    role: "Prévient l'équipe que le catalogue est en ligne, avec le résumé.",
    parametres: [['Canal', '#catalogue'], ['Opération', 'Send message']],
    sortie: { ok: true, canal: '#catalogue' },
  },
  drive: {
    type: 'Google Drive', sous: 'quarantaine', icone: 'dossier', famille: 'donnees',
    role: "Conserve le fichier refusé pour analyse. Il n'atteint jamais le dépôt.",
    parametres: [['Dossier', 'Quarantaine'], ['Opération', 'Upload']],
    sortie: { fichier: `${fichier} (CSV)`, dossier: 'Quarantaine' },
  },
  diag: {
    type: 'AI Agent', sous: 'explique le refus', icone: 'etincelle', famille: 'ia',
    role: "Traduit l'anomalie en une explication claire, prête à renvoyer au fournisseur.",
    parametres: [['Entrée', 'anomalies détectées par le code'], ['Sortie', 'texte du message']],
    sortie: { diagnostic: 'Une ligne contient un prix négatif : le fichier doit être corrigé.' },
  },
  alerte: {
    type: 'Slack', sous: 'fichier refusé', icone: 'message', famille: 'notification',
    role: "Alerte l'équipe avec le diagnostic. Le site en ligne n'a pas bougé.",
    parametres: [['Canal', '#catalogue-alertes'], ['Opération', 'Send message']],
    sortie: { ok: true, canal: '#catalogue-alertes' },
  },
  revert: {
    type: 'GitHub', sous: 'annule le commit', icone: 'retour', famille: 'depot',
    role: "Retire le fichier du dépôt, pour qu'il ne bloque pas les imports suivants.",
    parametres: [['Dépôt', 'princeamir56/mybestsim-test'], ['Opération', 'revert']],
    sortie: { commit: 'annulation de l\'import', branche: 'main' },
  },
  alerte2: {
    type: 'Slack', sous: 'pipeline en échec', icone: 'message', famille: 'notification',
    role: "Signale l'échec et l'annulation. Le site garde sa dernière version valide.",
    parametres: [['Canal', '#catalogue-alertes'], ['Opération', 'Send message']],
    sortie: { ok: true, canal: '#catalogue-alertes' },
  },
};

const pas = (noeud, arete, paquet, legende, extra = {}) => ({ noeud, arete, paquet, legende, ...extra });

const controle = [
  pas('valider', 'extract>valider', items, 'Les règles du chargeur sont appliquées avant tout commit.'),
];
const depot = [
  pas('commit', 'if1>commit', 'true', 'Le fichier conforme est déposé dans le dépôt.'),
  pas('wait', 'commit>wait', 'commit', "Le pipeline actuel s'exécute. n8n attend son verdict."),
];

export const SCENARIOS_N8N = [
  {
    id: 'mail',
    libelle: 'Tarifs reçus par mail',
    resume: 'Un fournisseur envoie un fichier : il est publié et annoncé sans intervention.',
    etapes: [
      pas('gmail', null, null, 'Le mail du fournisseur déclenche le workflow.'),
      pas('extract', 'gmail>extract', '1 item', 'La pièce jointe devient des lignes de données.'),
      ...controle,
      pas('if1', 'valider>if1', items, 'Aucune anomalie : le fichier passe.'),
      ...depot,
      pas('if2', 'wait>if2', 'success', 'GitHub Actions signale que tous les contrôles sont passés.'),
      pas('site', 'if2>site', 'true', 'La page en ligne est vérifiée.'),
      pas('resume', 'site>resume', '1 item', "L'IA rédige le résumé des changements."),
      pas('slack', 'resume>slack', '1 item', "L'équipe est prévenue : le catalogue est à jour."),
    ],
  },
  {
    id: 'invalide',
    libelle: 'Fichier invalide',
    resume: "Un fichier est refusé avant d'atteindre le dépôt, et l'équipe sait pourquoi.",
    etapes: [
      pas('webhook', null, null, "L'API d'un fournisseur envoie un fichier."),
      pas('extract', 'webhook>extract', '1 item', 'Le fichier devient des lignes de données.'),
      ...controle,
      pas('if1', 'valider>if1', items, 'Une ligne contient un prix négatif : le fichier est refusé.'),
      pas('drive', 'if1>drive', 'false', "Le fichier est mis de côté. Il n'atteindra jamais le dépôt.", { echec: true }),
      pas('diag', 'drive>diag', '1 item', "L'IA explique l'anomalie en clair.", { echec: true }),
      pas('alerte', 'diag>alerte', '1 item', "L'équipe reçoit le diagnostic. Le site n'a pas bougé.", { echec: true }),
    ],
  },
  {
    id: 'pipeline',
    libelle: 'Pipeline en échec',
    resume: 'Le fichier semblait bon, mais GitHub Actions refuse : le dépôt revient en arrière.',
    etapes: [
      pas('schedule', null, null, 'Chaque matin, le workflow part chercher les fichiers.'),
      pas('ftp', 'schedule>ftp', '1 item', 'Le fichier du jour est téléchargé.'),
      pas('extract', 'ftp>extract', '1 item', 'Le fichier devient des lignes de données.'),
      ...controle,
      pas('if1', 'valider>if1', items, 'Les premières règles passent.'),
      ...depot,
      pas('if2', 'wait>if2', 'failure', 'Un contrôle du pipeline a échoué : rien ne sera publié.'),
      pas('revert', 'if2>revert', 'false', 'Le commit est annulé pour ne pas bloquer les imports suivants.', { echec: true }),
      pas('alerte2', 'revert>alerte2', '1 item', "L'équipe est alertée. Le site garde sa dernière version valide.", { echec: true }),
    ],
  },
];

// ------------------------------------------------------------------ la géométrie
// Grand écran : nœuds carrés, nom dessous. La case [x, y, l, h] englobe le nom.

const COL = (i) => 28 + i * 116;
const CARRE = 64; // assez d'espace entre deux nœuds pour écrire le nombre d'items
const noeud = (i, y) => [COL(i) - (112 - CARRE) / 2, y, 112, 122];
const LIGNES = { haut: 40, milieu: 190, bas: 340 };
const cy = (y) => y + CARRE / 2;

export const CANEVAS = {
  W: 1300,
  H: 470,
  carre: CARRE,
  notes: [
    [0, 8, 348, 454, '1. Collecter'],
    [352, 8, 228, 454, '2. Contrôler'],
    [584, 8, 344, 454, '3. Publier'],
    [932, 8, 364, 454, '4. Confirmer'],
  ],
  noeuds: {
    gmail: noeud(0, LIGNES.haut), schedule: noeud(0, LIGNES.milieu), webhook: noeud(0, LIGNES.bas),
    ftp: noeud(1, LIGNES.milieu), extract: noeud(2, LIGNES.milieu), valider: noeud(3, LIGNES.milieu), if1: noeud(4, LIGNES.milieu),
    commit: noeud(5, LIGNES.milieu), wait: noeud(6, LIGNES.milieu), if2: noeud(7, LIGNES.milieu),
    site: noeud(8, LIGNES.milieu), resume: noeud(9, LIGNES.milieu), slack: noeud(10, LIGNES.milieu),
    drive: noeud(5, LIGNES.bas), diag: noeud(6, LIGNES.bas), alerte: noeud(7, LIGNES.bas),
    revert: noeud(8, LIGNES.bas), alerte2: noeud(9, LIGNES.bas),
  },
};

const droite = (i) => COL(i) + CARRE;
const M = cy(LIGNES.milieu);
const B = cy(LIGNES.bas);
const H_ = cy(LIGNES.haut);
const lien = (a, b) => [droite(a), M, COL(b), M, 'h'];

CANEVAS.aretes = {
  'gmail>extract': [droite(0), H_, COL(2), M, 'h'],
  'schedule>ftp': lien(0, 1),
  'webhook>extract': [droite(0), B, COL(2), M, 'h'],
  'ftp>extract': lien(1, 2),
  'extract>valider': lien(2, 3),
  'valider>if1': lien(3, 4),
  'if1>commit': [droite(4), M - 14, COL(5), M, 'h'],
  'if1>drive': [droite(4), M + 14, COL(5), B, 'h'],
  'commit>wait': lien(5, 6),
  'wait>if2': lien(6, 7),
  'if2>site': [droite(7), M - 14, COL(8), M, 'h'],
  'if2>revert': [droite(7), M + 14, COL(8), B, 'h'],
  'site>resume': lien(8, 9),
  'resume>slack': lien(9, 10),
  'drive>diag': [droite(5), B, COL(6), B, 'h'],
  'diag>alerte': [droite(6), B, COL(7), B, 'h'],
  'revert>alerte2': [droite(8), B, COL(9), B, 'h'],
};

// Téléphone et tablette : une colonne, qui se dédouble aux deux bifurcations.
const G = [10, 146];
const D = [164, 146];
const C = [60, 200];
const LIGNE = (r) => 110 + r * 84;
const HN = 58;
const carte = ([x, l], r) => [x, LIGNE(r), l, HN];
const v = (x1, y1, x2, y2) => [x1, y1, x2, y2, 'v'];
const bas = (r) => LIGNE(r) + HN;
const CG = 83;
const CD = 237;

export const COLONNE = {
  W: 320,
  H: 930,
  notes: [],
  noeuds: {
    gmail: [8, 0, 96, 86], schedule: [112, 0, 96, 86], webhook: [216, 0, 96, 86],
    ftp: [100, 110, 120, 58],
    extract: carte(C, 1), valider: carte(C, 2), if1: carte(C, 3),
    commit: carte(G, 4), wait: carte(G, 5), if2: carte(G, 6), site: carte(G, 7), resume: carte(G, 8), slack: carte(G, 9),
    drive: carte(D, 4), diag: carte(D, 5), alerte: carte(D, 6), revert: carte(D, 7), alerte2: carte(D, 8),
  },
  aretes: {
    'gmail>extract': v(56, 86, 96, LIGNE(1)),
    'schedule>ftp': v(160, 86, 160, 110),
    'webhook>extract': v(264, 86, 224, LIGNE(1)),
    'ftp>extract': v(160, 168, 160, LIGNE(1)),
    'extract>valider': v(160, bas(1), 160, LIGNE(2)),
    'valider>if1': v(160, bas(2), 160, LIGNE(3)),
    'if1>commit': v(120, bas(3), CG, LIGNE(4)),
    'if1>drive': v(200, bas(3), CD, LIGNE(4)),
    'commit>wait': v(CG, bas(4), CG, LIGNE(5)),
    'wait>if2': v(CG, bas(5), CG, LIGNE(6)),
    'if2>site': v(CG, bas(6), CG, LIGNE(7)),
    'if2>revert': v(130, bas(6), CD, LIGNE(7)),
    'site>resume': v(CG, bas(7), CG, LIGNE(8)),
    'resume>slack': v(CG, bas(8), CG, LIGNE(9)),
    'drive>diag': v(CD, bas(4), CD, LIGNE(5)),
    'diag>alerte': v(CD, bas(5), CD, LIGNE(6)),
    'revert>alerte2': v(CD, bas(7), CD, LIGNE(8)),
  },
};
