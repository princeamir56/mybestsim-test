import SectionHead from '../ui/SectionHead.jsx';
import Panel from '../ui/Panel.jsx';
import DataTable from '../ui/DataTable.jsx';
import DotPlot from '../charts/DotPlot.jsx';
import Nuage from '../charts/Nuage.jsx';
import Haltere from '../charts/Haltere.jsx';
import Matrice from '../charts/Matrice.jsx';
import { n, n1, n3, eur } from '../../lib/format.js';
import data from '../../data/catalogue.json';

const F = data.fournisseurs;
const E = data.ecarts;
const M = data.matrice;

const mediane = (vals) => {
  const t = [...vals].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
};

/**
 * Quatre lectures de la valeur, et elles ne donnent pas le même classement.
 *
 * C'est le cœur analytique du tableau de bord : la section précédente dit qui
 * est gros, celle-ci dit qui est intéressant.
 */
export default function Valeur() {
  const parGo = [...F].filter((f) => f.eur_go_median != null)
    .sort((a, b) => a.eur_go_median - b.eur_go_median);
  const meilleur = parGo[0];
  const pire = parGo[parGo.length - 1];

  const parVolume = [...F].sort((a, b) => b.produits - a.produits);
  const gros = parVolume[0];
  const rangGros = parGo.findIndex((f) => f.nom === gros.nom) + 1;

  const parVictoire = [...F].sort((a, b) => b.taux_victoire - a.taux_victoire);
  const roiAbsolu = [...F].sort((a, b) => b.victoires - a.victoires)[0];
  const lanterne = parVictoire[parVictoire.length - 1];
  const vedettes = new Set([parVictoire[0].nom, roiAbsolu.nom, lanterne.nom]);
  const tauxMoyen = F.reduce((s, f) => s + f.taux_victoire, 0) / F.length;

  const medGo = mediane(parGo.map((f) => f.eur_go_median));

  // L'écart le plus marqué de toute la matrice, pour que la note parle des
  // données du jour et non d'un cas figé.
  const cases = M.lignes.flatMap((l) =>
    l.cases.map((c, j) => (c ? { nom: l.nom, palier: M.colonnes[j], ...c } : null)).filter(Boolean)
  );
  const plusBas = cases.reduce((a, b) => (b.ecart < a.ecart ? b : a));
  const plusHaut = cases.reduce((a, b) => (b.ecart > a.ecart ? b : a));

  return (
    <section id="valeur" className="relative scroll-mt-24 bg-shell/60 py-20 lg:py-28">
      <div className="shell">
        <SectionHead num="04 — Bonus" title={'Qui offre réellement\nle plus de valeur ?'}>
          La répartition dit qui est gros. Ces quatre lectures disent qui est intéressant —
          et elles ne donnent pas le même gagnant.
        </SectionHead>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Panel
            title="Prix du gigaoctet, par fournisseur"
            note={
              <>
                Prix médian du Go, forfaits illimités exclus (la division est impossible).
                L'écart entre le meilleur et le moins bon est de{' '}
                <b>{Math.round((pire.eur_go_median / meilleur.eur_go_median - 1) * 100)}&nbsp;%</b>.{' '}
                <b>{gros.nom}, le plus gros catalogue, arrive {rangGros}<sup>e</sup> sur {parGo.length}</b>.
              </>
            }
          >
            <DotPlot
              mediane={medGo}
              libelleMediane={`médiane des fournisseurs (${n3(medGo)} €)`}
              format={(v, axe) => (axe ? `${n1(v)} €` : `${n3(v)} €`)}
              rows={parGo.map((f, i) => ({
                label: f.nom,
                value: f.eur_go_median,
                vedette: i === 0 ? 'mieux' : i === parGo.length - 1 ? 'pire' : f.nom === gros.nom ? 'mieux' : null,
                bulle: (
                  <>
                    <b className="block font-semibold">{f.nom}</b>
                    {n3(f.eur_go_median)}&nbsp;€/Go sur {n(f.produits - f.illimites)} offres
                  </>
                ),
              }))}
            />
            <DataTable
              headers={['Fournisseur', '€/Go médian', 'Écart au meilleur', 'Offres mesurées', 'Part 5G']}
              rows={parGo.map((f) => [
                f.nom,
                `${n3(f.eur_go_median)} €`,
                `+${n1((f.eur_go_median / meilleur.eur_go_median - 1) * 100)} %`,
                n(f.produits - f.illimites),
                `${n1(f.part_5g)} %`,
              ])}
            />
          </Panel>

          <Panel
            delay={0.06}
            title="Taille du catalogue ou vrai bon prix ?"
            note={
              <>
                Pour chacune des <b>{n(E.total_combinaisons)} combinaisons</b> (destination ×
                volume × durée), qui affiche le prix le plus bas ?{' '}
                <b>{roiAbsolu.nom} gagne le plus souvent en valeur absolue ({roiAbsolu.victoires} fois)
                parce qu'il est partout ; c'est {parVictoire[0].nom} qui gagne le plus souvent quand il
                est présent.</b>
              </>
            }
          >
            <Nuage
              libelleX="Combinaisons couvertes"
              libelleY="Taux de victoire"
              formatY={(v) => `${Math.round(v)} %`}
              moyenne={{ valeur: tauxMoyen, libelle: `moyenne ${n1(tauxMoyen)} %` }}
              points={F.map((f) => ({
                label: f.nom,
                x: f.presence,
                y: f.taux_victoire,
                vedette: vedettes.has(f.nom),
                bulle: (
                  <>
                    <b className="block font-semibold">{f.nom} · {n1(f.taux_victoire)}&nbsp;%</b>
                    Le moins cher sur {f.victoires} des {f.presence} combinaisons couvertes
                  </>
                ),
              }))}
            />
            <DataTable
              headers={['Fournisseur', 'Victoires', 'Combinaisons couvertes', 'Taux de victoire', '€/Go médian']}
              rows={parVictoire.map((f) => [
                f.nom,
                n(f.victoires),
                n(f.presence),
                `${n1(f.taux_victoire)} %`,
                f.eur_go_median != null ? `${n3(f.eur_go_median)} €` : '—',
              ])}
            />
          </Panel>

          <Panel
            className="lg:col-span-2"
            delay={0.06}
            title="Le fournisseur le moins cher dépend du palier"
            note={
              <>
                Chaque case compare le prix médian du fournisseur à la médiane du marché pour ce
                palier, en pourcentage. Du plus avantageux au moins avantageux en moyenne.
                L'amplitude va de <b>{plusBas.nom} sur {plusBas.palier} ({n1(plusBas.ecart)}&nbsp;%)</b> à{' '}
                <b>{plusHaut.nom} sur {plusHaut.palier} (+{n1(plusHaut.ecart)}&nbsp;%)</b>.
              </>
            }
          >
            <Matrice colonnes={M.colonnes} marche={M.marche} lignes={M.lignes} />
          </Panel>

          <Panel
            className="lg:col-span-2"
            delay={0.06}
            title="Ce que comparer rapporte"
            note={
              <>
                Sur les <b>{n(E.combinaisons)} combinaisons proposées plusieurs fois au catalogue</b>,
                l'écart médian entre le moins cher et le plus cher est de{' '}
                <b>{n1(E.median_pct)}&nbsp;%</b> ({eur(E.median_eur)}), et atteint{' '}
                {n1(E.max_pct)}&nbsp;% au maximum. {E.top_resume}
              </>
            }
          >
            <Haltere rows={E.top} />
          </Panel>
        </div>
      </div>
    </section>
  );
}
