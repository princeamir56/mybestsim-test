import Treemap from '../components/charts/Treemap.jsx';
import Histogramme from '../components/charts/Histogramme.jsx';
import DotPlot from '../components/charts/DotPlot.jsx';
import Nuage from '../components/charts/Nuage.jsx';
import Matrice from '../components/charts/Matrice.jsx';
import Haltere from '../components/charts/Haltere.jsx';
import Colonnes from '../components/charts/Colonnes.jsx';
import Courbe from '../components/charts/Courbe.jsx';
import Ecart from '../components/charts/Ecart.jsx';
import Anneau from '../components/charts/Anneau.jsx';
import BarList from '../components/charts/BarList.jsx';
import { eur, n, n1, n2, n3 } from '../lib/format.js';
import data from '../data/catalogue.json';

const K = data.kpi;
const F = data.fournisseurs;
const E = data.ecarts;
const M = data.matrice;
const P = data.paliers;
const PR = data.prime;
const PO = data.portee;

const PAR_VOLUME = [...F].sort((a, b) => b.produits - a.produits);
const PAR_GO = F.filter((f) => f.eur_go_median != null).sort((a, b) => a.eur_go_median - b.eur_go_median);
const PAR_VICTOIRE = [...F].sort((a, b) => b.taux_victoire - a.taux_victoire);
const ROI_ABSOLU = [...F].sort((a, b) => b.victoires - a.victoires)[0];
const LIMITES = P.filter((p) => p.go != null);
const TOTAL_OFFRES = PO.reduce((s, p) => s + p.offres, 0);
const VEDETTES = new Set([PAR_VICTOIRE[0].nom, ROI_ABSOLU.nom, PAR_VICTOIRE[PAR_VICTOIRE.length - 1].nom]);
const TAUX_MOYEN = F.reduce((s, f) => s + f.taux_victoire, 0) / F.length;

const mediane = (vals) => {
  const t = [...vals].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
};
const MEDIANE_GO = mediane(PAR_GO.map((f) => f.eur_go_median));

// Le catalogue écrit « Fournisseur · Produit » : la tuile ne garde que le fournisseur.
const fournisseurDe = (produit) => produit.split(' · ')[0];

const KPIS = [
  { label: 'Cartes eSIM', valeur: n(K.total), detail: `${n(K.fournisseurs)} fournisseurs` },
  { label: 'À plus de 100 €', valeur: n(K.plus_100), detail: K.plus_100_tous_illimites ? 'tous illimités' : `dont ${n(K.plus_100_illimites)} illimités` },
  { label: 'Prix minimum', valeur: eur(K.prix_min), detail: fournisseurDe(K.produit_min) },
  { label: 'Prix maximum', valeur: eur(K.prix_max), detail: fournisseurDe(K.produit_max) },
  { label: 'Prix moyen', valeur: eur(K.prix_moyen), detail: `médiane ${eur(K.prix_median)}` },
  { label: 'Data moyenne', valeur: `${n2(K.go_moyen)} Go`, detail: `médiane ${K.go_median} Go` },
  { label: 'Catalogue n° 1', valeur: n(PAR_VOLUME[0].produits), detail: PAR_VOLUME[0].nom },
  { label: 'Illimités', valeur: `${n1(K.part_illimites)} %`, detail: `${n(K.illimites)} offres` },
];

function Bloc({ titre, classe = '', children }) {
  return (
    <section className={`card-surface min-w-0 rounded-2xl p-4 shadow-halo sm:p-6 ${classe}`}>
      <h2 className="mb-4 font-display text-[1.12rem] font-normal leading-tight text-marine sm:text-[1.2rem]">{titre}</h2>
      {children}
    </section>
  );
}

/** Les indicateurs et les graphiques du catalogue, sans commentaire. */
export default function Dashboard() {
  return (
    <div className="shell pb-14 pt-[92px] sm:pt-[100px]">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h1 className="font-display text-[1.9rem] font-light leading-none tracking-[-0.02em] text-marine sm:text-[2.25rem]">
          Dashboard
        </h1>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-porcelain/[0.14] shadow-halo sm:grid-cols-4 xl:grid-cols-8" style={{ backgroundColor: '#2b3845' }}>
        {KPIS.map((k) => (
          <div key={k.label} className="flex min-w-0 flex-col bg-abysse px-4 py-4 sm:px-5 sm:py-5">
            <dt className="font-mono text-[0.64rem] uppercase leading-tight tracking-[0.08em] text-porcelain/75">{k.label}</dt>
            <dd className="mt-2.5 whitespace-nowrap font-display text-[1.45rem] leading-none tracking-[-0.02em] text-porcelain tabular min-[390px]:text-[1.6rem] xl:text-[1.5rem] 2xl:text-[1.7rem]">
              {k.valeur}
            </dd>
            <dd className="mt-2 truncate text-[0.76rem] leading-tight text-porcelain/70">{k.detail}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Bloc titre="Répartition par fournisseur" classe="lg:col-span-7">
          <Treemap
            hauteurPour={(l) => (l < 440 ? 700 : 556)}
            items={PAR_VOLUME.map((f) => ({
              nom: f.nom,
              valeur: f.produits,
              affiche: n(f.produits),
              part: `${n1(f.part)} %`,
              bulle: (
                <>
                  <b className="block font-semibold">{f.nom}</b>
                  {n(f.produits)} produits ({n1(f.part)}&nbsp;%) · médiane {eur(f.prix_median)}
                </>
              ),
            }))}
          />
        </Bloc>

        <Bloc titre="Prix médian du Go" classe="lg:col-span-5">
          <DotPlot
            sansNote
            mediane={MEDIANE_GO}
            libelleMediane={`Médiane ${n3(MEDIANE_GO)} €`}
            format={(v, axe) => (axe ? `${n1(v)} €` : `${n3(v)} €`)}
            rows={PAR_GO.map((f, i) => ({
              label: f.nom,
              value: f.eur_go_median,
              vedette: i === 0 ? 'mieux' : i === PAR_GO.length - 1 ? 'pire' : f.nom === PAR_VOLUME[0].nom ? 'mieux' : null,
              bulle: (
                <>
                  <b className="block font-semibold">{f.nom}</b>
                  {n3(f.eur_go_median)}&nbsp;€/Go sur {n(f.produits - f.illimites)} offres
                </>
              ),
            }))}
          />
        </Bloc>

        <Bloc titre="Distribution des prix" classe="lg:col-span-7">
          <Histogramme
            hauteurGrande={372}
            classes={data.distribution.classes}
            reperes={[
              { libelle: `Médiane ${eur(K.prix_median)}`, valeur: K.prix_median },
              { libelle: `Moyenne ${eur(K.prix_moyen)}`, valeur: K.prix_moyen },
              { libelle: `100 € : ${n(K.plus_100)} offres au-delà`, court: ['100 €', `${n(K.plus_100)} au-delà`], valeur: 100, plein: true },
            ]}
          />
        </Bloc>

        <Bloc titre="Taux de victoire et couverture" classe="lg:col-span-5">
          <Nuage
            hauteurGrande={412}
            libelleX="Combinaisons couvertes"
            libelleY="Taux de victoire"
            formatY={(v) => `${Math.round(v)} %`}
            moyenne={{ valeur: TAUX_MOYEN, libelle: `moyenne ${n1(TAUX_MOYEN)} %` }}
            points={F.map((f) => ({
              label: f.nom,
              x: f.presence,
              y: f.taux_victoire,
              vedette: VEDETTES.has(f.nom),
              bulle: (
                <>
                  <b className="block font-semibold">{f.nom} · {n1(f.taux_victoire)}&nbsp;%</b>
                  Le moins cher sur {f.victoires} des {f.presence} combinaisons
                </>
              ),
            }))}
          />
        </Bloc>

        <Bloc titre="Écart au marché par palier, en %" classe="lg:col-span-7">
          <Matrice colonnes={M.colonnes} marche={M.marche} lignes={M.lignes} />
        </Bloc>

        <div className="grid min-w-0 grid-cols-1 gap-4 lg:col-span-5">
          <Bloc titre="Offres par palier">
            <Colonnes
              hauteur={312}
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
          </Bloc>
          <Bloc titre="Prix du Go par palier">
            <Courbe
              hauteur={312}
              format={(v) => `${n2(v)} €/Go`}
              points={LIMITES.map((p) => ({
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
          </Bloc>
        </div>

        <Bloc titre="Prime de l'illimité par durée" classe="lg:col-span-7">
          <Ecart
            legende={['Forfait illimité', 'Forfait à volume limité']}
            points={PR.map((p) => ({ jours: p.jours, haut: p.illimite, bas: p.limite, ratio: p.ratio }))}
          />
        </Bloc>

        <Bloc titre="Mono-pays et régional" classe="lg:col-span-5">
          <Anneau
            empile
            centre={n(TOTAL_OFFRES)}
            sousCentre="offres"
            parts={PO.map((p) => ({
              label: p.nom,
              value: p.offres,
              note: `${n(p.offres)} offres · ${eur(p.prix_moyen)} en moyenne`,
            }))}
          />
          <div className="mt-5 border-t border-marine/10 pt-3">
            <BarList
              accent="aucun"
              labelWidth="w-[112px] sm:w-[132px]"
              valueWidth="w-[104px]"
              rows={data.zones.map((z) => ({
                label: z.nom,
                value: z.offres,
                display: n(z.offres),
                sub: eur(z.prix_median),
                tone: 'signal',
                hint: `${n(z.offres)} offres · ${n1(z.part_illim)} % d'illimités`,
              }))}
            />
          </div>
        </Bloc>

        <Bloc titre={`Plus grands écarts de prix, sur ${n(E.combinaisons)} combinaisons`} classe="lg:col-span-12">
          <Haltere rows={E.top} />
        </Bloc>
      </div>
    </div>
  );
}
