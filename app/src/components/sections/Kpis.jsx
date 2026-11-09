import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import SectionHead from '../ui/SectionHead.jsx';
import CountUp from '../ui/CountUp.jsx';
import Panel from '../ui/Panel.jsx';
import Histogramme from '../charts/Histogramme.jsx';
import { EASE, useReducedMotion } from '../../lib/motion.js';
import { n, n1, n2, eur } from '../../lib/format.js';
import data from '../../data/catalogue.json';

const k = data.kpi;
const PAR_VOLUME = [...data.fournisseurs].sort((a, b) => b.produits - a.produits);

/**
 * Les six statistiques imposées par le brief.
 *
 * Chaque tuile dont le chiffre dépend d'un arbitrage porte son repère (D1…D4),
 * cliquable, qui ouvre la décision correspondante. C'est ce qui distingue un
 * chiffre d'un chiffre *assumé* : le lecteur peut remonter à la raison en un
 * clic, sans quitter la page.
 */
const TUILES = [
  {
    cle: 'Nombre total de cartes eSIM',
    valeur: k.total,
    format: n,
    drapeau: 'D1',
    note: (
      <>
        Réparties sur <b>{k.fournisseurs} fournisseurs</b>. Un produit = un SKU, et les{' '}
        {n(k.total)} SKU sont uniques.
      </>
    ),
    large: true,
  },
  {
    cle: 'Produits à plus de 100 €',
    valeur: k.plus_100,
    format: n,
    drapeau: 'D3',
    note: (
      <>
        {k.plus_100_tous_illimites ? (
          <>
            <b>Tous sont des forfaits illimités</b>
            {k.plus_100_30j === k.plus_100 ? ', tous en 30\u00a0jours' : ''}
            {k.plus_100_zone === k.plus_100 ? ', tous régionaux' : ''}.
          </>
        ) : (
          <>
            <b>{n(k.plus_100_illimites)} sur {n(k.plus_100)} sont des illimités</b>,{' '}
            {n(k.plus_100_30j)} en 30 jours, {n(k.plus_100_zone)} régionaux.
          </>
        )}{' '}
        Le forfait à volume limité le plus cher s'arrête à {eur(k.max_limite)}.
      </>
    ),
  },
  {
    cle: 'Fourchette de prix',
    valeur: k.prix_max,
    format: eur,
    prefixe: `${n2(k.prix_min)} € →`,
    note: (
      <>
        Amplitude <b>×{n1(k.amplitude)}</b>.
        <br />
        Le moins cher : {k.produit_min}.
        <br />
        Le plus cher : {k.produit_max}.
      </>
    ),
  },
  {
    cle: 'Moyenne de data par carte',
    valeur: k.go_moyen,
    format: (v) => `${n2(v)} Go`,
    drapeau: 'D2',
    note: (
      <>
        Sur les <b>{n(k.go_base)} forfaits à volume limité</b>. Médiane {k.go_median} Go.
        Les {n(k.illimites)} illimités ({n1(k.part_illimites)}&nbsp;% du catalogue) sont
        exclus : leur volume n'est pas zéro, il est indéfini.
      </>
    ),
  },
  {
    cle: 'Prix moyen global',
    valeur: k.prix_moyen,
    format: eur,
    note: (
      <>
        Médiane <b>{eur(k.prix_median)}</b> : la distribution est tirée vers le haut par
        les illimités ({eur(k.prix_moyen_illimite)} contre {eur(k.prix_moyen_limite)}).
      </>
    ),
  },
  { cle: 'Répartition par fournisseur', repartition: true },
];

export default function Kpis({ onOuvrirDecision }) {
  return (
    <section id="chiffres" className="shell scroll-mt-24 py-20 lg:py-28">
      <SectionHead num="01 · Les chiffres clés" title={'Les six statistiques\ndemandées'}>
        Calculées une seule fois, en Python, au moment du build. Les repères{' '}
        <span className="rounded bg-azur/12 px-1.5 py-0.5 font-mono text-[0.72em] text-marine">
          D1
        </span>{' '}
        renvoient à l'arbitrage dont le chiffre dépend : cliquez dessus pour le lire.
      </SectionHead>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TUILES.map((t, i) => (
          <Tuile key={t.cle} tuile={t} index={i} onOuvrir={onOuvrirDecision} />
        ))}
      </div>

      <Panel
        className="mt-5"
        title="La forme du catalogue : où se situent les prix"
        note={
          <>
            La moyenne ({eur(k.prix_moyen)}) dépasse la médiane ({eur(k.prix_median)}) parce qu'une
            longue queue d'offres chères tire tout vers le haut.{' '}
            {k.plus_100_tous_illimites ? (
              <b>Au-delà de 100&nbsp;€, il ne reste que des forfaits illimités.</b>
            ) : (
              <b>Au-delà de 100&nbsp;€, {n(k.plus_100_illimites)} offres sur {n(k.plus_100)} sont des forfaits illimités.</b>
            )}
          </>
        }
      >
        <Histogramme
          classes={data.distribution.classes}
          reperes={[
            { libelle: `Médiane ${eur(k.prix_median)}`, valeur: k.prix_median },
            { libelle: `Moyenne ${eur(k.prix_moyen)}`, valeur: k.prix_moyen },
            { libelle: `100\u00a0€ : ${n(k.plus_100)} offres au-delà`, court: ['100 €', `${n(k.plus_100)} au-delà`], valeur: 100, plein: true },
          ]}
        />
      </Panel>
    </section>
  );
}

/** La sixième statistique : le nombre de cartes de chaque fournisseur, sans exception. */
function Repartition() {
  return (
    <>
      <ol
        className="mt-5 grid grid-flow-col gap-x-5 gap-y-1 text-[0.8rem] leading-snug"
        style={{ gridTemplateRows: `repeat(${Math.ceil(PAR_VOLUME.length / 2)}, auto)` }}
      >
        {PAR_VOLUME.map((f) => (
          <li key={f.nom} className="flex items-baseline justify-between gap-2">
            <span className="truncate text-slate">{f.nom}</span>
            <span className="font-mono font-semibold text-marine">{n(f.produits)}</span>
          </li>
        ))}
      </ol>
      <a
        href="#fournisseurs"
        className="mt-3 inline-block self-start py-1 text-[0.8rem] font-medium text-marine underline underline-offset-4 transition-colors hover:text-signal-fonce"
      >
        Parts et prix par fournisseur
      </a>
    </>
  );
}

function Tuile({ tuile, index, onOuvrir }) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={inView || reduced ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.25, delay: Math.min(index, 6) * 0.025, ease: EASE }}
      className={tuile.large ? 'sm:col-span-2 lg:col-span-1' : ''}
    >
        <div className="card-surface group relative flex h-full flex-col overflow-hidden rounded-[1.4rem] p-6 shadow-halo transition-shadow duration-500 ease-soft hover:shadow-halo-lg sm:p-7">
          {/* Le filet d'accent qui se trace au survol : la carte réagit sans
              bouger, donc sans décaler la lecture du chiffre. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px w-0 bg-gradient-to-r from-signal to-transparent transition-all duration-700 ease-soft group-hover:w-full"
          />

          <div className="flex items-start justify-between gap-3">
            <span className="label-muted leading-relaxed">{tuile.cle}</span>
            {tuile.drapeau ? (
              <button
                type="button"
                onClick={() => onOuvrir?.(tuile.drapeau)}
                title={`Ce chiffre dépend de l'arbitrage ${tuile.drapeau} : cliquer pour le lire`}
                aria-label={`Lire l'arbitrage ${tuile.drapeau}`}
                className="relative shrink-0 rounded-md bg-azur/12 px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold text-marine transition-colors duration-300 after:absolute after:-inset-3 after:content-[''] hover:bg-signal/15"
              >
                {tuile.drapeau}
              </button>
            ) : null}
          </div>

          {tuile.repartition ? (
            <Repartition />
          ) : (
            <>
              <p className="figure mt-5">
                {tuile.prefixe ? (
                  <span className="mr-1 text-[0.62em] text-marine/80">{tuile.prefixe}</span>
                ) : null}
                <CountUp value={tuile.valeur} format={tuile.format} />
              </p>

              <p className="mt-4 text-[0.84rem] leading-relaxed text-slate">{tuile.note}</p>
            </>
          )}
        </div>
    </motion.div>
  );
}
