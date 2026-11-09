/* ===========================================================================
   Vérification du site construit, sans navigateur.

   Le validateur de palette contrôle les couleurs, les captures contrôlent le
   rendu ; ce script contrôle ce qui est réellement SERVI : le HTML prérendu.

   Il a déjà attrapé de vrais défauts : des identifiants dupliqués qui
   envoyaient le contenu dans le mauvais élément, un plantage sur matchMedia,
   un jeton de gabarit laissé dans le JSON-LD, et une méta-description
   au-delà du point de troncature de Google.

   AUCUNE VALEUR ATTENDUE N'EST ÉCRITE ICI. Le script charge les JSON produits
   par Python et vérifie que le HTML servi dit bien ce que les données disent.
   La version précédente attendait les chaînes « 5 056 », « 14,49 Go »,
   « 29,30 € » : elle contrôlait donc « le site affiche-t-il les valeurs du
   4 novembre 2026 ? ». Un nouvel import l'aurait fait échouer alors que le
   site aurait eu raison. Le contrôle porte désormais sur la COHÉRENCE entre
   les données et la page, ce qui reste vrai quel que soit l'import — et c'est
   ce qui permet de le brancher en intégration continue.

       npm install        (jsdom, uniquement pour ce contrôle)
       npm run verifier

   Code de sortie non nul si quoi que ce soit échoue : utilisable en CI.
   =========================================================================== */

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '..', 'site');
const DONNEES = path.join(__dirname, '..', 'app', 'src', 'data');
const echecs = [];

// Les JSON qui ont produit la page : c'est à eux que le HTML est comparé.
const CAT = JSON.parse(fs.readFileSync(path.join(DONNEES, 'catalogue.json'), 'utf8'));
const ART = JSON.parse(fs.readFileSync(path.join(DONNEES, 'article.json'), 'utf8'));

// Le même formatage que l'interface (app/src/lib/format.js), sinon on
// comparerait « 5056 » à « 5 056 » et tout échouerait pour rien.
const nf = new Intl.NumberFormat('fr-FR');
const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nb = (v) => nf.format(v);
const eur = (v) => `${nf2.format(v)} €`;

function verifier(nom, ok, detail) {
  if (!ok) echecs.push(nom + (detail ? ' — ' + detail : ''));
  console.log(`  ${ok ? 'ok  ' : 'ÉCHEC'} ${nom}${!ok && detail ? ' — ' + detail : ''}`);
}

function titre(t) {
  console.log(`\n— ${t} —`);
}

// Intl sépare les milliers par une espace fine insécable (U+202F) ; sans
// normaliser, « 5 056 » et « 5 056 » paraissent différents.
const norm = (s) => s.replace(/[  \s]+/g, ' ').trim();

// Les textes des décisions portent du <em>/<strong> : on compare le texte nu.
const nu = (s) => norm(String(s).replace(/<[^>]+>/g, ''));

function charger(fichier) {
  const html = fs.readFileSync(path.join(SITE, fichier), 'utf8');
  const doc = new JSDOM(html, { url: 'https://exemple.test/' }).window.document;
  const ld = (doc.querySelector('script[type="application/ld+json"]') || {}).textContent || '';
  doc.querySelectorAll('script, style').forEach((e) => e.remove());
  return { html, doc, ld, texte: norm(doc.body.textContent) };
}

/* ====================== LE TABLEAU DE BORD ====================== */

console.log('\n########## TABLEAU DE BORD : index.html ##########');
const dash = charger('index.html');

titre('Prérendu (ce que lit un robot, et un visiteur sans JavaScript)');
verifier('la racine React n\'est pas vide', dash.html.indexOf('<div id="root"></div>') === -1);
verifier('le contenu est dans le HTML servi', dash.texte.length > 4000, `${dash.texte.length} caractères`);
verifier('aucun jeton de gabarit', !/__[A-Z_]+__/.test(dash.html));

titre('Structure');
const ids = {};
dash.doc.querySelectorAll('[id]').forEach((e) => (ids[e.id] = (ids[e.id] || 0) + 1));
const dups = Object.entries(ids).filter(([, c]) => c > 1).map(([i]) => i);
verifier('aucun identifiant dupliqué', dups.length === 0, dups.join(', '));
verifier('langue déclarée en français', dash.doc.documentElement.lang === 'fr');
verifier('balise viewport présente', !!dash.doc.querySelector('meta[name=viewport]'));
verifier('un seul H1', dash.doc.querySelectorAll('h1').length === 1);
verifier('outil interne marqué noindex',
  (dash.doc.querySelector('meta[name=robots]') || {}).content?.includes('noindex'));

titre('Les six statistiques du brief, relues dans catalogue.json');
const K = CAT.kpi;
[
  [nb(K.total), 'nombre total de produits'],
  [nb(K.plus_100), 'produits à plus de 100 €'],
  [eur(K.prix_min), 'prix minimum'],
  [eur(K.prix_max), 'prix maximum'],
  [`${nf2.format(K.go_moyen)} Go`, 'moyenne de data'],
  [eur(K.prix_moyen), 'prix moyen'],
].forEach(([v, nom]) => verifier(`${nom} = ${v}`, dash.texte.includes(norm(v))));

const fournisseurs = CAT.fournisseurs.map((f) => f.nom);
const absents = fournisseurs.filter((f) => !dash.texte.includes(f));
verifier(`les ${fournisseurs.length} fournisseurs du catalogue sont listés`,
  absents.length === 0, absents.join(', '));

// Cohérence temporelle : la page servie doit porter la date du JSON qui l'a
// produite. Sans ce contrôle, un site construit à partir d'un JSON périmé
// passerait tous les autres tests sans broncher.
const dateFr = new Date(CAT.meta.genere_le)
  .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
verifier('la page porte la date de génération du JSON',
  dash.texte.includes(dateFr), dateFr);

titre('Panneau « Décisions & qualité des données »');
const idsDecisions = CAT.decisions.map((d) => d.id);
verifier(`les ${idsDecisions.length} arbitrages sont présents`,
  idsDecisions.every((x) => dash.texte.includes(x)));
verifier('chaque arbitrage expose son contrefactuel',
  dash.doc.body.textContent.split("Si l'autre option avait été retenue").length - 1
    === CAT.decisions.length);

// Le coeur du contrôle : chaque phrase produite par Python doit se retrouver
// MOT POUR MOT dans le HTML servi. C'est ce qui garantit qu'un changement de
// données traverse bien toute la chaîne jusqu'à la page.
for (const champ of ['retenu', 'pourquoi', 'alternative']) {
  const manquants = CAT.decisions
    .filter((d) => !dash.texte.includes(nu(d[champ])))
    .map((d) => d.id);
  verifier(`le champ « ${champ} » de chaque arbitrage est dans le HTML servi`,
    manquants.length === 0, manquants.join(', '));
}

verifier('le plafond des forfaits limités est cité',
  dash.texte.includes(nf2.format(K.max_limite)), nf2.format(K.max_limite));

const piegesAbsents = CAT.pieges
  .filter((p) => !dash.texte.includes(nu(p.titre)) || !dash.texte.includes(nu(p.texte)))
  .map((p) => nu(p.titre));
verifier(`les ${CAT.pieges.length} pièges sont exposés en entier`,
  piegesAbsents.length === 0, piegesAbsents.join(' | '));
verifier('le piège des « NA » cite la cause technique', dash.texte.includes('keep_default_na'));

const limitesAbsentes = CAT.limites.filter((l) => !dash.texte.includes(nu(l)));
verifier(`les ${CAT.limites.length} limites du jeu de données sont dites`,
  limitesAbsentes.length === 0, `${limitesAbsentes.length} absente(s)`);

titre('Formatage français');
verifier(`nombres formatés (pas de « ${CAT.meta.lignes} » brut)`,
  !new RegExp(`\\b${CAT.meta.lignes}\\b`).test(dash.texte));
verifier('décimales en virgule (pas de « 29.30 »)', !/\b\d+\.\d{2}\s*€/.test(dash.texte));

/* ========================== L'ARTICLE ========================== */

console.log('\n\n########## ARTICLE : internet-en-croisiere/index.html ##########');
const art = charger('internet-en-croisiere/index.html');

titre('Prérendu');
verifier('la racine React n\'est pas vide', art.html.indexOf('<div id="root"></div>') === -1);
const motsArt = art.texte.split(/\s+/).filter((m) => /\w/.test(m)).length;
verifier('entre 2 400 et 3 300 mots dans le HTML servi',
  motsArt >= 2400 && motsArt <= 3300, `${motsArt} mots`);

titre('Base SEO');
verifier('titre entre 30 et 70 caractères',
  art.doc.title.length >= 30 && art.doc.title.length <= 70, `${art.doc.title.length} caractères`);
const desc = art.doc.querySelector('meta[name=description]');
verifier('méta-description entre 120 et 170 caractères',
  !!desc && desc.content.length >= 120 && desc.content.length <= 170,
  desc ? `${desc.content.length} caractères` : 'absente');
verifier('balise canonical présente', !!art.doc.querySelector('link[rel=canonical]'));
verifier('article indexable', (art.doc.querySelector('meta[name=robots]') || {}).content?.startsWith('index'));
verifier('un seul H1', art.doc.querySelectorAll('h1').length === 1);
verifier('au moins 8 H2', art.doc.querySelectorAll('h2').length >= 8, `${art.doc.querySelectorAll('h2').length}`);
verifier('balises Open Graph', art.doc.querySelectorAll('meta[property^="og:"]').length >= 5);

titre('Données structurées');
let schema = null;
try { schema = JSON.parse(art.ld); } catch (e) { /* signalé juste après */ }
verifier('JSON-LD valide', schema !== null);
if (schema) {
  const noeuds = schema['@graph'] || [];
  const faq = noeuds.find((x) => x['@type'] === 'FAQPage');
  verifier('un nœud Article', !!noeuds.find((x) => x['@type'] === 'Article'));
  verifier('un nœud FAQPage', !!faq);
  if (faq) {
    verifier('au moins 6 questions balisées', faq.mainEntity.length >= 6, `${faq.mainEntity.length}`);
    // Chaque question balisée doit exister dans la page : jamais de promesse
    // en l'air faite à Google.
    const manquantes = faq.mainEntity
      .filter((q) => !art.texte.includes(norm(q.name)))
      .map((q) => q.name);
    verifier('chaque question balisée est visible dans la page',
      manquantes.length === 0, manquantes.join(' | '));
    verifier('chaque réponse balisée est substantielle',
      faq.mainEntity.every((q) => q.acceptedAnswer.text.length >= 40));
  }
  verifier('aucun jeton de gabarit dans le JSON-LD', !/__[A-Z_]+__/.test(art.ld));
}

titre('Prix réellement injectés depuis le catalogue');
verifier('les 3 tableaux de prix sont dans le HTML',
  art.doc.querySelectorAll('table').length === 3, `${art.doc.querySelectorAll('table').length}`);
verifier('les tableaux sont remplis, pas des coquilles',
  art.doc.querySelectorAll('table td').length > 25);
// Les prix de l'article sortent de article.json : on vérifie que CE sont
// bien ces prix-là qui sont servis, pas des valeurs figées dans le JSX.
const profilEntree = ART.profils[0];
verifier(`le prix d'entrée ${profilEntree.go} Go / ${profilEntree.jours} j apparaît`,
  art.texte.includes(nf2.format(profilEntree.prix_min)),
  nf2.format(profilEntree.prix_min));

const zoneRef = ART.zones.find((z) => z['5go_7j']);
verifier(`le prix régional ${zoneRef ? zoneRef.nom : '?'} apparaît`,
  !!zoneRef && art.texte.includes(nf2.format(zoneRef['5go_7j'].prix_min)),
  zoneRef ? nf2.format(zoneRef['5go_7j'].prix_min) : 'aucune zone chiffrée');

titre('Exigences éditoriales');
verifier('les 3 sources institutionnelles sont citées',
  art.html.includes('europa.eu') && art.html.includes('arcep.fr') && art.html.includes('quechoisir.org'));
verifier("l'encadré méthodologie est présent", art.texte.includes('Méthodologie et limites'));
verifier('la limite « le plafond ne protège pas forcément » est écrite',
  art.texte.includes('ne pouvons donc pas vous garantir'));
verifier('les eSIM maritimes sont mentionnées', art.texte.includes('Cellular at Sea'));
verifier("suggestion d'image fournie", art.texte.includes("Suggestion d'image"));
verifier('liens externes en nofollow',
  [...art.doc.querySelectorAll('a[href^="http"]')].every((a) => a.rel.includes('nofollow')));

/* ======================= HÉBERGEMENT STATIQUE ======================= */

console.log('\n\n########## FICHIERS D\'HÉBERGEMENT ##########');
titre('Présence');
['index.html', 'internet-en-croisiere/index.html', '404.html', '.nojekyll', 'robots.txt', 'sitemap.xml']
  .forEach((f) => verifier(`${f} existe`, fs.existsSync(path.join(SITE, f))));
verifier('le sitemap ne liste que les pages indexables',
  !fs.readFileSync(path.join(SITE, 'sitemap.xml'), 'utf8').match(/<loc>[^<]*\/<\/loc>/));

titre('Aucune lecture des CSV par le navigateur');
const bundles = fs.readdirSync(path.join(SITE, 'assets')).filter((f) => f.endsWith('.js'));
const js = bundles.map((f) => fs.readFileSync(path.join(SITE, 'assets', f), 'utf8')).join('');
verifier('aucune référence à un fichier .csv dans le JavaScript servi', !/\.csv/.test(js));
verifier('aucun fetch vers les données brutes', !/fetch\(["'][^"']*donnees-test/.test(js));
verifier('les données sont empaquetées dans le bundle',
  js.includes(String(CAT.meta.lignes)) || js.includes('"lignes"'));

titre('Partage et identité');
const partage = art.doc.querySelector('meta[property="og:image"]');
verifier("l'article déclare une image de partage", !!partage);
verifier("l'image de partage existe", fs.existsSync(path.join(SITE, 'og-croisiere.png')));
verifier('le logo et les favicons existent',
  ['marque/oiseau-512.png', 'marque/corps.webp', 'marque/aile-g.webp', 'marque/aile-d.webp', 'favicon-32.png', 'apple-touch-icon.png']
    .every((f) => fs.existsSync(path.join(SITE, f))));
const fondHero = ['esim-1672', 'esim-1120', 'esim-mobile-1022', 'esim-mobile-640'].map((f) => `hero/${f}.webp`);
verifier("l'image de fond du hero existe et est servie, à chaque taille",
  fondHero.every((f) => fs.existsSync(path.join(SITE, f)) && dash.html.includes(f)));
verifier('la date de publication ne suit pas les données',
  /"datePublished":"\d{4}-\d{2}-\d{2}"/.test(art.ld));

titre('Scène d\'ouverture');
verifier("le rideau n'est jamais dans le HTML servi", !dash.html.includes('z-[100]') && !art.html.includes('z-[100]'));
verifier("l'article n'a pas de voile", !/classList\.add\('voile'\)/.test(art.doc.body.innerHTML));

titre('Page introuvable');
const nf404 = charger('404.html');
verifier('404.html est une vraie page, pas le tableau de bord', nf404.texte.includes("s'est envolée") && !nf404.texte.includes('Décisions & qualité'));
verifier('404.html est hors index', (nf404.doc.querySelector('meta[name=robots]') || {}).content?.includes('noindex'));

titre('Liens internes');
const routesValides = new Set(['/', '/internet-en-croisiere']);
const verifierLiens = (page, nom) => {
  const morts = [];
  page.doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:)/.test(h)) return;
    if (h.startsWith('#')) {
      if (!page.doc.getElementById(h.slice(1))) morts.push(h);
      return;
    }
    const [chemin, ancre] = h.split('#');
    const route = chemin.replace(/\/$/, '') || '/';
    if (!routesValides.has(route)) { morts.push(h); return; }
    if (ancre && route === '/' && !dash.doc.getElementById(ancre)) morts.push(h);
    if (ancre && route !== '/' && !art.doc.getElementById(ancre)) morts.push(h);
  });
  verifier(`aucun lien mort sur ${nom}`, morts.length === 0, morts.join(', '));
};
verifierLiens(dash, 'le tableau de bord');
verifierLiens(art, "l'article");
verifierLiens(nf404, 'la page introuvable');

/* ============================== BILAN ============================== */

console.log('\n' + '='.repeat(62));
if (echecs.length) {
  console.log(`${echecs.length} VÉRIFICATION(S) EN ÉCHEC :`);
  echecs.forEach((e) => console.log('  · ' + e));
  process.exit(1);
}
console.log('Toutes les vérifications passent.');
