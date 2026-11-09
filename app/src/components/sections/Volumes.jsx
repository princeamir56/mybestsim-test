import SectionHead from '../ui/SectionHead.jsx';
import Panel from '../ui/Panel.jsx';
import DataTable from '../ui/DataTable.jsx';
import BarList from '../charts/BarList.jsx';
import Colonnes from '../charts/Colonnes.jsx';
import Courbe from '../charts/Courbe.jsx';
import Ecart from '../charts/Ecart.jsx';
import Anneau from '../charts/Anneau.jsx';
import { n, n1, n2, n3, eur, mot, Mot } from '../../lib/format.js';
import data from '../../data/catalogue.json';

const P = data.paliers;
const PR = data.prime;
const PO = data.portee;

export default function Volumes() {
  const limites = P.filter((p) => p.go != null);
  const pBas = limites[0];
  const pHaut = limites[limites.length - 1];
  const mono = PO.find((p) => p.nom === 'Mono-pays');
  const regio = PO.find((p) => p.nom !== 'Mono-pays');
  const totalOffres = PO.reduce((s, p) => s + p.offres, 0);

  return (
    <section id="data" className="shell scroll-mt-24 py-20 lg:py-28">
      <SectionHead num="05 — Volumes & couverture" title={'Une grille tarifaire,\npas une distribution'}>
        Le catalogue n'est pas un continuum de volumes : c'est une grille de{' '}
        {mot(data.faits.nb_paliers)} paliers, plus l'illimité. Et {mot(data.meta.zones)} des{' '}
        {data.meta.destinations} « destinations » sont en réalité des zones.
      </SectionHead>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          title="Combien d'offres à chaque palier"
          note={
            <>
              {Mot(data.faits.nb_paliers)} paliers de taille comparable, plus l'illimité : une
              grille tarifaire, pas une distribution naturelle.
            </>
          }
        >
          <Colonnes
            rows={P.map((p) => ({
              label: p.go == null ? 'Illim.' : p.label,
              value: p.offres,
              display: n(p.offres),
              tone: p.go == null ? 'signal' : undefined,
              bulle: (
                <>
                  <b className="block font-semibold">{p.label}</b>
                  {n(p.offres)} offres · médiane {eur(p.prix_median)}
                </>
              ),
            }))}
          />
          <DataTable
            headers={['Palier', 'Offres', 'Prix médian', '€/Go médian', 'Min', 'Max']}
            rows={P.map((p) => [
              p.label,
              n(p.offres),
              eur(p.prix_median),
              p.eur_go_median != null ? `${n3(p.eur_go_median)} €` : '—',
              eur(p.prix_min),
              eur(p.prix_max),
            ])}
          />
        </Panel>

        <Panel
          delay={0.06}
          title="Le prix du gigaoctet s'effondre avec le volume"
          note={
            <>
              <b>−{Math.round((1 - pHaut.eur_go_median / pBas.eur_go_median) * 100)}&nbsp;%</b> entre
              le palier {pBas.label} ({n2(pBas.eur_go_median)}&nbsp;€/Go) et le palier {pHaut.label} (
              {n2(pHaut.eur_go_median)}&nbsp;€/Go). Acheter petit se paie très cher au Go.
            </>
          }
        >
          <Courbe
            hauteur={306}
            format={(v) => `${n2(v)} €/Go`}
            points={limites.map((p) => ({
              label: p.label,
              value: p.eur_go_median,
              bulle: (
                <>
                  <b className="block font-semibold">{p.label}</b>
                  {n3(p.eur_go_median)}&nbsp;€/Go · médiane {eur(p.prix_median)}
                </>
              ),
            }))}
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          delay={0.06}
          title="La prime de l'illimité, selon la durée"
          note={
            <>
              Combien coûte le confort de ne pas compter ses gigaoctets ?{' '}
              <b>×{n1(PR[0].ratio)} sur {PR[0].jours}&nbsp;jours, ×{n1(PR[PR.length - 1].ratio)} sur{' '}
              {PR[PR.length - 1].jours}&nbsp;jours</b>. Sur un court séjour l'illimité se discute ; sur
              un mois il se paie très cher.
            </>
          }
        >
          <Ecart
            legende={['Forfait illimité', 'Forfait à volume limité']}
            points={PR.map((p) => ({ jours: p.jours, haut: p.illimite, bas: p.limite, ratio: p.ratio }))}
          />
          <DataTable
            headers={['Durée', 'Illimité (médian)', 'Volume limité (médian)', 'Prime', 'Offres illimitées']}
            rows={PR.map((p) => [
              `${p.jours} jours`,
              eur(p.illimite),
              eur(p.limite),
              `×${n2(p.ratio)}`,
              n(p.offres),
            ])}
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          delay={0.06}
          title="Offres mono-pays contre offres régionales"
          note={
            <>
              À volume de data quasi identique ({n1(regio.go_moyen)}&nbsp;Go contre{' '}
              {n1(mono.go_moyen)}&nbsp;Go), le régional coûte{' '}
              <b>+{Math.round((regio.prix_moyen / mono.prix_moyen - 1) * 100)}&nbsp;%</b>. Ce surcoût
              n'achète pas des gigaoctets, il achète de la couverture : c'est un produit différent,
              pas un produit plus cher.
            </>
          }
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <Anneau
              centre={n(totalOffres)}
              sousCentre="offres"
              parts={PO.map((p) => ({
                label: p.nom,
                value: p.offres,
                note: `${n(p.offres)} offres · ${eur(p.prix_moyen)} en moyenne`,
              }))}
            />
            <div>
              <p className="label-muted mb-3">Les {mot(data.zones.length)} zones, en détail</p>
              <BarList
                accent="aucun"
                labelWidth="w-[112px] sm:w-[148px]"
                valueWidth="w-[104px] sm:w-[124px]"
                rows={data.zones.map((z) => ({
                  label: z.nom,
                  value: z.offres,
                  display: n(z.offres),
                  sub: eur(z.prix_median),
                  tone: 'signal',
                  hint: `${n(z.offres)} offres · ${n1(z.part_illim)} % d'illimités`,
                }))}
              />
            </div>
          </div>

          <DataTable
            headers={['Portée', 'Offres', 'Part', 'Prix moyen', 'Prix médian', 'Go moyen', 'Illimités']}
            rows={[
              ...PO.map((p) => [
                p.nom,
                n(p.offres),
                `${n1(p.part)} %`,
                eur(p.prix_moyen),
                eur(p.prix_median),
                `${n1(p.go_moyen)} Go`,
                `${n1(p.part_illim)} %`,
              ]),
              ...data.zones.map((z) => [
                `↳ ${z.nom}`,
                n(z.offres),
                '—',
                '—',
                eur(z.prix_median),
                '—',
                `${n1(z.part_illim)} %`,
              ]),
            ]}
          />
        </Panel>
      </div>
    </section>
  );
}
