import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import SplitText from '../ui/SplitText.jsx';
import CountUp from '../ui/CountUp.jsx';
import Magnetic from '../ui/Magnetic.jsx';
import { EASE, useReducedMotion } from '../../lib/motion.js';
import { n, eur, mot } from '../../lib/format.js';
import { d } from '../../lib/intro.js';
import data from '../../data/catalogue.json';

/**
 * Le hero, sur la seule surface inversée du site avec le pied de page.
 *
 * Le fond est un champ de signal : des arcs concentriques qui partent du coin
 * bas-droit, comme une antenne vue de dessus. Dessiné en SVG plutôt qu'en
 * image — il se redimensionne sans perte, pèse deux kilo-octets, et ses
 * couleurs suivent les jetons du thème.
 */
export default function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // Parallaxe très légère : le contenu monte un peu moins vite que la page.
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '16%']);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, reduced ? 1 : 0.15]);

  const k = data.kpi;

  return (
    <section ref={ref} className="relative overflow-hidden bg-abysse text-porcelain">
      <ChampDeSignal />

      <motion.div style={{ y, opacity }} className="shell relative z-10 pb-20 pt-[132px] lg:pb-28 lg:pt-[168px]">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: d(0.15) }}
          className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-signal"
        >
          Catalogue eSIM · {data.meta.fichiers} fournisseurs
        </motion.p>

        <h1 className="h-display mt-6 max-w-[17ch] text-porcelain">
          <SplitText text="Ce que contiennent" delay={d(0.3)} />
          <span className="block">
            <SplitText text="vraiment" delay={d(0.48)} />{' '}
            <span className="relative inline-block">
              <SplitText text={`${n(k.total)} offres`} delay={d(0.58)} className="text-signal" />
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: EASE, delay: d(1.05) }}
                className="absolute -bottom-1 left-0 h-px w-full origin-left bg-signal/40"
              />
            </span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: d(0.85) }}
          className="mt-8 max-w-[62ch] text-[1.05rem] leading-[1.75] text-porcelain/65 md:text-[1.12rem]"
        >
          {data.meta.fichiers} fichiers importés chaque jour, un par fournisseur. Ce
          tableau de bord en sort les statistiques clés — et, parce que les données
          posent {mot(data.decisions.length)} questions sans réponse unique, il affiche
          aussi{' '}
          <span className="text-porcelain">les arbitrages retenus</span> et ce que les
          chiffres auraient valu autrement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: d(1) }}
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
        </motion.div>

        {/* La bande de chiffres : la promesse du tableau de bord, tenue avant
            même d'avoir défilé. */}
        <motion.dl
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: d(1.2) }}
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-porcelain/12 pt-10 lg:grid-cols-4"
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
              <dt className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-porcelain/60">
                {item.k}
              </dt>
              <dd className="mt-2.5 font-display text-[1.95rem] leading-none tracking-[-0.02em] text-porcelain tabular lg:text-[2.3rem]">
                <CountUp value={item.v} format={item.f} delai={d(1.2)} />
              </dd>
              <dd className="mt-2 text-[0.78rem] text-porcelain/60">{item.s}</dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}

/** Les arcs d'émission, ancrés en bas à droite. */
function ChampDeSignal() {
  const reduced = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent_8%,black_62%)] max-lg:[mask-image:linear-gradient(to_bottom,transparent_38%,black_78%)]"
    >
      <svg
        className="absolute -bottom-[26%] -right-[34%] h-[120%] w-[150%] md:-right-[8%] md:bottom-[-14%] md:h-[118%] md:w-[80%]"
        viewBox="0 0 600 600"
        fill="none"
        overflow="visible"
      >
        <defs>
          <radialGradient id="lueur" gradientUnits="userSpaceOnUse" cx="468" cy="468" r="400">
            <stop offset="0%" stopColor="#1F6FB2" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#0E1A26" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="-800" y="-800" width="2400" height="2400" fill="url(#lueur)" />
        {[70, 130, 195, 265, 340, 420, 505].map((r, i) => (
          <motion.circle
            key={r}
            cx="468"
            cy="468"
            r={r}
            stroke="#6BA8E0"
            strokeWidth="1"
            strokeOpacity={0.3 - i * 0.03}
            initial={reduced ? false : { scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, delay: d(0.1) + i * 0.09, ease: EASE }}
            style={{ transformOrigin: '468px 468px' }}
          />
        ))}
        {/* Le point d'émission, qui respire. */}
        <circle cx="468" cy="468" r="5.5" fill="#D2693A" />
        {!reduced && (
          <circle
            cx="468"
            cy="468"
            r="5.5"
            fill="none"
            stroke="#D2693A"
            strokeWidth="1.5"
            style={{ animation: 'pulse-ring 2.8s cubic-bezier(0.16,1,0.3,1) infinite', transformOrigin: '468px 468px' }}
          />
        )}
      </svg>
    </div>
  );
}
