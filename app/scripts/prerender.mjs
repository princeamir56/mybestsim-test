/**
 * Prérendu : un fichier HTML complet par route.
 *
 * Pourquoi, alors que le reste du site est une application React ?
 *
 *   - L'article de la partie 2 est un livrable SEO. Son contenu doit être dans
 *     le code source servi, pas injecté après coup par du JavaScript. Un
 *     tableau de prix rendu côté client dépend du bon vouloir du moteur de
 *     rendu de Google ; un tableau prérendu ne dépend de rien.
 *   - Un hébergement statique (GitHub Pages, Netlify) ne connaît pas les
 *     routes du client : sans fichier à /internet-en-croisiere/, l'URL renvoie
 *     un 404 avant que React ne démarre.
 *   - Sans JavaScript, la page reste entièrement lisible.
 *
 * Chaque route reçoit son propre <title>, sa description, son canonique, ses
 * balises Open Graph et son JSON-LD. Le balisage FAQPage est construit à
 * partir du MÊME tableau que celui qu'affiche la page, jamais saisi deux fois.
 *
 *     node scripts/prerender.mjs        (lancé par `npm run build`)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
// Memes regles que vite.config.js : ../site par defaut, SORTIE_SITE pour un
// hebergeur dont la racine du projet est app/ (Vercel).
const SORTIE = path.resolve(RACINE, process.env.SORTIE_SITE || '../site');

const BASE = (process.env.BASE_URL || '/').replace(/\/+$/, '/') || '/';
// L'origine publique alimente les balises canoniques, robots.txt et le
// sitemap. Ordre de priorite :
//   1. SITE_ORIGIN, pose explicitement (CI, build local de controle) ;
//   2. le domaine de production que Vercel expose au build — evite d'avoir a
//      configurer quoi que ce soit pour un deploiement nominal ;
//   3. un repli, uniquement pour que le build local ne casse pas.
// Sans la 2e ligne, un deploiement sans variable d'environnement publierait
// un sitemap pointant vers un domaine qui n'est pas le sien.
const DOMAINE_VERCEL = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const ORIGINE = (
  process.env.SITE_ORIGIN
  || (DOMAINE_VERCEL ? `https://${DOMAINE_VERCEL}` : null)
  || 'https://mybestsim-test.vercel.app'
).replace(/\/$/, '');

// Sous Windows, un chemin absolu « C:\… » n'est pas une URL ESM valide : le
// chargeur exige file://. pathToFileURL est la conversion correcte, et elle
// est sans effet sur les autres systèmes.
const importer = (rel) => import(pathToFileURL(path.join(RACINE, rel)).href);

const { render } = await importer('.ssr/entry-server.js');
const { FAQ } = await importer('src/data/contenuArticle.js');
const catalogue = JSON.parse(
  fs.readFileSync(path.join(RACINE, 'src/data/catalogue.json'), 'utf8')
);

const aujourdhui = catalogue.meta.genere_le;

// La date de première publication est un fait, elle ne suit pas les données :
// seule `dateModified` avance quand le catalogue change.
const DATE_PUBLICATION = '2026-11-04';

const IMAGE_PARTAGE = `${ORIGINE}${BASE}og-croisiere.png`;
const LOGO = `${ORIGINE}${BASE}marque/oiseau-512.png`;
const EDITEUR = {
  '@type': 'Organization',
  name: 'MyBestSim',
  url: 'https://www.mybestsim.com',
  logo: { '@type': 'ImageObject', url: LOGO },
};
const lignesFr = new Intl.NumberFormat('fr-FR').format(catalogue.meta.lignes);

const ROUTES = [
  {
    url: '/',
    fichier: 'index.html',
    title: `Catalogue eSIM : ${lignesFr} offres de ${catalogue.meta.fichiers} fournisseurs comparées`,
    description:
      `Analyse de ${lignesFr} produits eSIM chez ${catalogue.meta.fichiers} fournisseurs : prix, ` +
      `volumes de data, couverture, et les ${catalogue.decisions.length} arbitrages de traitement assumés.`,
    precharger: ['marque/corps.webp', 'marque/aile-g.webp', 'marque/aile-d.webp'],
    robots: 'noindex, follow', // outil interne : il n'a pas vocation à ranker
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Catalogue eSIM MyBestSim',
      description: `Catalogue agrégé de ${catalogue.meta.lignes} offres eSIM provenant de ${catalogue.meta.fichiers} fournisseurs.`,
      inLanguage: 'fr-FR',
      dateModified: aujourdhui,
      creator: { '@type': 'Organization', name: 'MyBestSim' },
    },
  },
  {
    url: '/internet-en-croisiere',
    fichier: 'internet-en-croisiere/index.html',
    title: 'Internet en croisière : quelle eSIM choisir ? Le guide honnête 2026',
    description:
      "Une eSIM ne capte pas en pleine mer. Ce qu'elle apporte en escale, ses prix réels " +
      'par itinéraire, et comment éviter la facture du bateau.',
    robots: 'index, follow, max-snippet:-1, max-image-preview:large',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: 'Internet en croisière : quelle eSIM choisir ?',
          description:
            "Une eSIM ne capte pas en pleine mer. Ce qu'elle apporte en escale, ses prix " +
            'réels et comment éviter la facture du réseau du bateau.',
          inLanguage: 'fr-FR',
          datePublished: DATE_PUBLICATION,
          dateModified: aujourdhui,
          image: IMAGE_PARTAGE,
          author: EDITEUR,
          publisher: EDITEUR,
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${ORIGINE}${BASE}internet-en-croisiere`,
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Tableau de bord', item: `${ORIGINE}${BASE}` },
            { '@type': 'ListItem', position: 2, name: 'Guide croisière', item: `${ORIGINE}${BASE}internet-en-croisiere` },
          ],
        },
        {
          '@type': 'FAQPage',
          // Construit depuis le tableau qu'affiche la page : il est impossible
          // de promettre à Google une question absente de l'article.
          mainEntity: FAQ.map((q) => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: { '@type': 'Answer', text: q.reponse },
          })),
        },
      ],
    },
  },
  {
    // Une adresse inconnue reçoit une vraie page d'erreur, avec un statut 404
    // servi par l'hébergeur à partir de ce fichier.
    url: '/404',
    fichier: '404.html',
    title: 'Page introuvable — MyBestSim',
    description: "Cette adresse n'existe pas. Retrouvez le tableau de bord et le guide croisière.",
    robots: 'noindex, follow',
    schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'Page introuvable' },
  },
];

const gabarit = fs.readFileSync(path.join(SORTIE, 'index.html'), 'utf8');

const echappe = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const route of ROUTES) {
  const canonique = `${ORIGINE}${BASE}${route.url.replace(/^\//, '')}`;

  const tete = [
    `<title>${echappe(route.title)}</title>`,
    `<meta name="description" content="${echappe(route.description)}" />`,
    `<meta name="robots" content="${route.robots}" />`,
    `<link rel="canonical" href="${canonique}" />`,
    `<meta property="og:type" content="${route.url === '/' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="MyBestSim" />`,
    `<meta property="og:title" content="${echappe(route.title)}" />`,
    `<meta property="og:description" content="${echappe(route.description)}" />`,
    `<meta property="og:url" content="${canonique}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:image" content="${IMAGE_PARTAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Internet en croisière : quelle eSIM choisir ? Le guide MyBestSim" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${echappe(route.title)}" />`,
    `<meta name="twitter:description" content="${echappe(route.description)}" />`,
    `<meta name="twitter:image" content="${IMAGE_PARTAGE}" />`,
    ...(route.precharger || []).map((f) => `<link rel="preload" as="image" href="${BASE}${f}" type="image/webp" />`),
    `<script type="application/ld+json">${JSON.stringify(route.schema)}</script>`,
  ].join('\n    ');

  let page = gabarit.replace(
    /<!-- SEO:HEAD[\s\S]*?<!-- \/SEO:HEAD -->/,
    `<!-- Généré par scripts/prerender.mjs -->\n    ${tete}`
  );

  const html = render(route.url);
  page = page.replace('<div id="root"><!--SSR--></div>', `<div id="root">${html}</div>`);

  const cible = path.join(SORTIE, route.fichier);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, page, 'utf8');

  const mots = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter((m) => /\w/.test(m)).length;
  console.log(`[ok] ${route.fichier.padEnd(34)} ${(page.length / 1024).toFixed(0)} Ko · ${mots} mots dans le HTML`);
}

// Un fichier vide, mais il compte : sans lui, GitHub Pages fait passer le
// dossier /assets/ par Jekyll, qui ignore tout ce qui commence par un
// underscore et casse silencieusement des fichiers produits par Vite.
fs.writeFileSync(path.join(SORTIE, '.nojekyll'), '');

fs.writeFileSync(
  path.join(SORTIE, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${ORIGINE}${BASE}sitemap.xml\n`
);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.filter((r) => r.robots.startsWith('index'))
  .map(
    (r) => `  <url>
    <loc>${ORIGINE}${BASE}${r.url.replace(/^\//, '')}</loc>
    <lastmod>${aujourdhui}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(SORTIE, 'sitemap.xml'), sitemap);

console.log('[ok] 404.html · .nojekyll · robots.txt · sitemap.xml');
