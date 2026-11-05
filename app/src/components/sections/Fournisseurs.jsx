import SectionHead from '../ui/SectionHead.jsx';
import Panel from '../ui/Panel.jsx';
import DataTable from '../ui/DataTable.jsx';
import Treemap from '../charts/Treemap.jsx';
import { n, n1, eur } from '../../lib/format.js';
import data from '../../data/catalogue.json';

const F = data.fournisseurs;
const k = data.kpi;

export default function Fournisseurs() {
  const parVolume = [...F].sort((a, b) => b.produits - a.produits);
  const tete = parVolume[0];
  const queue = parVolume[parVolume.length - 1];

  return (
    <section id="fournisseurs" className="shell scroll-mt-24 py-20 lg:py-28">
      <SectionHead num="03 — Répartition" title={'Qui propose quoi,\net à quel prix'}>
        La sixième statistique du brief, et le point de départ de tout le reste.
      </SectionHead>

      <Panel
        title="Nombre de produits par fournisseur"
        note={
          <>
            La surface de chaque case est proportionnelle à son catalogue. <b>{tete.nom}</b> pèse
            à lui seul {n1(tete.part)}&nbsp;% de l'ensemble, soit {n1(tete.produits / queue.produits)}{' '}
            fois {queue.nom}, le plus petit.
          </>
        }
      >
        <Treemap
          items={parVolume.map((f) => ({
            nom: f.nom,
            valeur: f.produits,
            affiche: n(f.produits),
            part: `${n1(f.part)} %`,
            bulle: (
              <>
                <b className="block font-semibold">{f.nom}</b>
                {n(f.produits)} produits ({n1(f.part)}&nbsp;%) · médiane {eur(f.prix_median)}
              </>
            ),
          }))}
        />

        <DataTable
          headers={['Fournisseur', 'Produits', 'Part', 'Prix moyen', 'Médian', 'Min', 'Max', 'Illimités']}
          rows={parVolume.map((f) => [
            f.nom,
            n(f.produits),
            `${n1(f.part)} %`,
            eur(f.prix_moyen),
            eur(f.prix_median),
            eur(f.prix_min),
            eur(f.prix_max),
            n(f.illimites),
          ])}
          foot={[
            'Total',
            n(k.total),
            '100,0 %',
            eur(k.prix_moyen),
            eur(k.prix_median),
            eur(k.prix_min),
            eur(k.prix_max),
            n(k.illimites),
          ]}
        />
      </Panel>
    </section>
  );
}
