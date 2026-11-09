import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import Magnetic from '../ui/Magnetic.jsx';
import { useReducedMotion } from '../../lib/motion.js';
import { n, eur, mot } from '../../lib/format.js';
import data from '../../data/catalogue.json';

const BASE = import.meta.env.BASE_URL;
// Le ciel en haut de l'image : le fond de la section le prolonge sans raccord.
const CIEL = '#001025';

/**
 * Le hero, sur la seule surface inversée du site avec le pied de page.
 *
 * Tout est en place dès l'ouverture : aucun délai, aucune entrée animée. L'image
 * de fond est décorative, et le texte ne dépend jamais d'elle pour rester lisible
 * (voile à gauche sur grand écran, bandeau opaque et flouté sous les chiffres).
 */
export default function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Parallaxe très légère : le contenu monte un peu moins vite que la page. Pas
  // de fondu d'opacité ici : il couperait le flou du bandeau de chiffres.
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '16%']);

  const k = data.kpi;

  return (
    <section ref={ref} className="relative overflow-hidden bg-abysse text-porcelain" style={{ backgroundColor: CIEL }}>
      <FondHero />

      {/* Sous `lg`, le bas du hero reste libre : la scène de l'image s'y affiche
          sans passer derrière le texte. */}
      <motion.div style={{ y }} className="shell relative z-10 pb-[60vw] pt-[116px] sm:pb-[34vw] lg:pb-20 lg:pt-[150px]">
        {/* Aucune entrée animée : le visiteur vient lire ces chiffres, ils sont là
            dès l'ouverture de la page. */}
        <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-signal">
          Catalogue eSIM · {data.meta.fichiers} fournisseurs
        </p>

        <h1 className="h-display mt-6 max-w-[17ch] text-porcelain">
          <span>Ce que contiennent</span>
          <span className="block">
            <span>vraiment</span>{' '}
            <span className="relative inline-block">
              <span className="text-signal">{`${n(k.total)} offres`}</span>
              <span aria-hidden="true" className="absolute -bottom-1 left-0 h-px w-full bg-signal/40" />
            </span>
          </span>
        </h1>

        <p
          className="mt-8 max-w-[62ch] text-[1.05rem] leading-[1.75] text-porcelain/75 md:text-[1.12rem] lg:max-w-[50ch]"
        >
          {data.meta.fichiers} fichiers importés chaque jour, un par fournisseur. Ce
          tableau de bord en sort les statistiques clés et, parce que les données
          posent {mot(data.decisions.length)} questions sans réponse unique, il affiche
          aussi{' '}
          <span className="text-porcelain">les arbitrages retenus</span> et ce que les
          chiffres auraient valu autrement.
        </p>

        <div
          className="mt-10 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:gap-4"
        >
          <Magnetic>
            <a href="#chiffres" className="btn-primary w-full sm:w-auto">
              Voir les chiffres
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#decisions"
              className="btn w-full border border-porcelain/25 text-porcelain hover:border-porcelain/60 hover:bg-porcelain/10 sm:w-auto"
            >
              Les {data.decisions.length} arbitrages
            </a>
          </Magnetic>
        </div>

        {/* La bande de chiffres : la promesse du tableau de bord, tenue avant
            même d'avoir défilé. */}
        <dl
          className="mt-12 grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-porcelain/15 bg-[#001025]/70 p-5 backdrop-blur-md sm:gap-x-6 sm:p-7 lg:mt-14 lg:grid-cols-4"
        >
          {[
            { k: 'Produits', v: k.total, f: n, s: `${k.fournisseurs} fournisseurs` },
            { k: 'Prix moyen', v: k.prix_moyen, f: eur, s: `médiane ${eur(k.prix_median)}` },
            {
              k: 'À plus de 100 €',
              v: k.plus_100,
              f: n,
              // « tous illimités » est une OBSERVATION du catalogue importé, pas
              // une loi : si un import la dément, la tuile affiche le décompte.
              s: k.plus_100_tous_illimites
                ? 'tous illimités'
                : `dont ${n(k.plus_100_illimites)} illimités`,
            },
            { k: 'Data moyenne', v: k.go_moyen, f: (x) => `${x.toFixed(2).replace('.', ',')} Go`, s: `médiane ${k.go_median} Go` },
          ].map((item) => (
            <div key={item.k}>
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-porcelain/75">
                {item.k}
              </dt>
              <dd className="mt-2.5 font-display text-[1.55rem] leading-none tracking-[-0.02em] text-porcelain tabular min-[360px]:text-[1.75rem] sm:text-[1.95rem] lg:text-[2.3rem]">
                {item.f(item.v)}
              </dd>
              <dd className="mt-2 text-[0.78rem] text-porcelain/75">{item.s}</dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  );
}

/**
 * L'image de fond, ancrée en bas et jamais déformée.
 *
 * Elle occupe toute la largeur : au-dessus d'elle, le fond de la section prend le
 * relais. Sur téléphone, un recadrage garde la scène entière (monuments, téléphone,
 * statue) au lieu d'un gros plan sur quelques pixels.
 */
function FondHero() {
  return (
    // Au-delà de 1680 px, l'image garde sa taille et ses bords se fondent dans le
    // ciel : agrandie, elle serait floue et passerait derrière le texte.
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-1/2 w-full max-w-[1680px] -translate-x-1/2 min-[1681px]:[mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]"
    >
      <picture>
        <source
          media="(min-width: 640px)"
          type="image/webp"
          width="1672"
          height="941"
          sizes="100vw"
          srcSet={`${BASE}hero/esim-1120.webp 1120w, ${BASE}hero/esim-1672.webp 1672w`}
        />
        <img
          src={`${BASE}hero/esim-mobile-1022.webp`}
          srcSet={`${BASE}hero/esim-mobile-640.webp 640w, ${BASE}hero/esim-mobile-1022.webp 1022w`}
          sizes="100vw"
          width="1022"
          height="941"
          alt=""
          decoding="async"
          fetchpriority="high"
          className="absolute bottom-0 right-0 h-auto w-full [mask-image:linear-gradient(to_bottom,transparent,black_24%)]"
        />
      </picture>
      {/* Sur grand écran, le texte est à gauche de l'image : ce voile le protège. */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{ background: 'linear-gradient(90deg, rgba(0,16,37,0.94) 0%, rgba(0,16,37,0.74) 30%, rgba(0,16,37,0) 56%)' }}
      />
    </div>
  );
}
