import { Link } from 'react-router-dom';
import Diagramme from '../components/automatisation/Diagramme.jsx';
import PerspectiveN8n from '../components/automatisation/PerspectiveN8n.jsx';
import { CONTROLES, NOEUDS, SCENARIOS } from '../data/automatisation.js';
import { n, dateFr } from '../lib/format.js';
import data from '../data/catalogue.json';

const CHIFFRES = [
  ['4', 'façons de lancer le pipeline'],
  [String(CONTROLES.assertions), 'assertions sur les données'],
  [String(CONTROLES.verifier), 'contrôles du HTML servi'],
  [String(CONTROLES.prose), 'contrôles des phrases'],
];

const GARDE_FOUS = [
  {
    titre: 'Une donnée fausse arrête tout',
    texte: `Le chargeur refuse un prix négatif, un SKU en double ou une devise inconnue. Il protège aussi les ${n(data.faits.na_lignes)} lignes « Amérique du Nord », dont le code NA disparaîtrait à la lecture sans ce réglage.`,
    code: 'assert df["prix"].gt(0).all()',
  },
  {
    titre: 'Les phrases suivent les chiffres',
    texte: "Ce que le site affirme est recalculé à chaque build. Si un import dément une phrase, elle se reformule au lieu de devenir fausse. Un fournisseur fictif vérifie ce comportement à chaque passage.",
    code: '"chers_tous_illimites": bool(...)',
  },
  {
    titre: 'Le contrôle porte sur la page réelle',
    texte: "Le vérificateur ne connaît aucune valeur attendue. Il compare le HTML qui sera servi aux JSON qui l'ont produit : un nouvel import ne le fait pas échouer à tort, et un site périmé ne passe pas.",
    code: 'dash.texte.includes(nu(d.pourquoi))',
  },
];

const DEROULE = SCENARIOS[0].etapes.map((e) => e.noeud);

/** Comment le dépôt se met à jour tout seul : le schéma, puis ce qui le rend fiable. */
export default function Automatisation() {
  return (
    <article className="bg-[#001025] pb-24 text-porcelain">
      <header className="shell pb-10 pt-[120px] lg:pt-[140px]">
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-signal-light">L'automatisation du catalogue</p>
        <h1 className="h-display mt-5 max-w-[20ch] text-porcelain">Un fichier déposé suffit à mettre le site à jour</h1>
        <p className="mt-6 max-w-[64ch] text-[1.05rem] leading-[1.75] text-porcelain/80 md:text-[1.12rem]">
          Dès qu'un fournisseur arrive ou qu'un fichier change, le pipeline agrège les données, reconstruit
          le site, vérifie ce qui sera servi, puis publie. Si un seul contrôle échoue, rien ne part en
          ligne. Choisissez un scénario et suivez-le, ou touchez une brique pour voir ce qu'elle fait.
        </p>
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-porcelain/15 pt-8 lg:grid-cols-4">
          {CHIFFRES.map(([valeur, libelle]) => (
            <div key={libelle}>
              <dd className="font-display text-[2.2rem] leading-none text-porcelain tabular">{valeur}</dd>
              <dt className="mt-2 text-[0.84rem] text-porcelain/75">{libelle}</dt>
            </div>
          ))}
        </dl>
      </header>

      <section aria-label="Schéma interactif du pipeline" className="shell">
        <Diagramme />
      </section>

      <section className="shell mt-20">
        <h2 className="h-section max-w-[24ch] text-porcelain">Ce qui rend cette automatisation fiable</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {GARDE_FOUS.map((g) => (
            <div key={g.titre} className="flex flex-col rounded-2xl border border-ciel/20 bg-[#0a1c38] p-6">
              <h3 className="font-display text-[1.25rem] font-normal leading-snug text-porcelain">{g.titre}</h3>
              <p className="mt-3 flex-1 text-[0.92rem] leading-relaxed text-porcelain/80">{g.texte}</p>
              <code className="mt-5 block break-all rounded-lg bg-[#020a18] px-3 py-2.5 font-mono text-[0.72rem] text-ciel">{g.code}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="shell mt-20 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="h-section text-porcelain">Le déroulé, étape par étape</h2>
          <ol className="mt-8 space-y-5">
            {DEROULE.map((id, i) => (
              <li key={id} className="flex gap-4">
                <span className="mt-0.5 font-mono text-[0.76rem] text-ciel">{String(i + 1).padStart(2, '0')}</span>
                <p className="text-[0.95rem] leading-relaxed text-porcelain/80">
                  <strong className="font-semibold text-porcelain">{NOEUDS[id].titre}. </strong>
                  {NOEUDS[id].quoi}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <aside className="h-fit rounded-2xl border border-signal-light/40 bg-signal/[0.08] p-6 lg:mt-[76px]">
          <h2 className="font-display text-[1.25rem] font-normal text-porcelain">Ce qu'elle ne fait pas encore</h2>
          <p className="mt-3 text-[0.92rem] leading-relaxed text-porcelain/80">
            Les fichiers arrivent aujourd'hui par un commit dans le dépôt. Brancher une source réelle
            (mail, SFTP ou API d'un fournisseur) reviendrait à ajouter une étape en amont : tout ce qui
            suit fonctionne déjà. L'audit dans un vrai navigateur, lui, se lance à la main.
          </p>
          <p className="mt-4 font-mono text-[0.72rem] text-porcelain/75">
            Dernières données : {dateFr(data.meta.genere_le)} · {n(data.meta.lignes)} offres
          </p>
        </aside>
      </section>

      <PerspectiveN8n />

      <div className="shell mt-16 flex flex-wrap gap-3">
        <Link to="/dashboard" className="btn-primary">Voir le dashboard</Link>
        <a href="https://github.com/princeamir56/mybestsim-test/blob/main/.github/workflows/pipeline.yml" target="_blank" rel="noopener noreferrer" className="btn border border-porcelain/25 text-porcelain hover:border-porcelain/60 hover:bg-porcelain/10">
          Lire le workflow sur GitHub
        </a>
      </div>
    </article>
  );
}
