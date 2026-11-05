import { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { EASE, useReducedMotion } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';

/**
 * Barres horizontales classées, une seule teinte.
 *
 * Choisi plutôt qu'un camembert, et plutôt qu'une teinte par fournisseur :
 *
 *   - Des barres posées sur une même ligne de base se comparent exactement ;
 *     des segments mis bout à bout, non.
 *   - Sur un classement, l'information est le RANG, pas l'identité. Dix-huit
 *     couleurs pour dix-huit fournisseurs n'ajouteraient rien et coûteraient
 *     la lisibilité — aucune palette ne tient dix-huit teintes distinguables,
 *     daltonisme compris.
 *
 * L'accentuation (`accent`) remplace la couleur catégorielle : une barre
 * ressort, les autres reculent. C'est la forme honnête quand une seule ligne
 * est le propos.
 */
export default function BarList({
  rows,
  // Mise en avant : 'premier' | 'extremes' | 'aucun'
  accent = 'premier',
  // Largeur de la colonne d'étiquettes, en classes Tailwind.
  labelWidth = 'w-[92px] sm:w-[124px]',
  valueWidth = 'w-[92px] sm:w-[118px]',
  barHeight = 'h-[13px]',
}) {
  const reduced = useReducedMotion() || EST_SERVEUR;
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.12 });
  const [actif, setActif] = useState(null);

  const max = Math.max(...rows.map((r) => r.value));

  const estAccent = (i) =>
    accent === 'premier' ? i === 0
      : accent === 'extremes' ? i === 0 || i === rows.length - 1
      : false;

  return (
    <div ref={ref} className="flex flex-col gap-[3px]">
      {rows.map((r, i) => {
        const vedette = estAccent(i) || r.accent;
        const survole = actif === i;
        return (
          <div
            key={r.label}
            onMouseEnter={() => setActif(i)}
            onMouseLeave={() => setActif(null)}
            className={`group relative grid items-center gap-2.5 rounded-lg px-2 py-[5px] transition-colors duration-200 sm:gap-3.5 ${
              survole ? 'bg-marine/[0.045]' : ''
            }`}
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
          >
            <span
              className={`${labelWidth} truncate text-[0.78rem] transition-colors duration-200 sm:text-[0.84rem] ${
                vedette ? 'font-semibold text-marine' : 'text-slate'
              }`}
            >
              {r.label}
            </span>

            <span className="relative flex h-[19px] items-center">
              {/* Le rail : il donne l'échelle, donc une barre courte reste
                  lisible comme « courte » et pas comme « absente ». */}
              <span className="absolute inset-y-[3px] left-0 right-0 rounded-r-[4px] bg-marine/[0.055]" />
              <motion.span
                className={`relative rounded-r-[4px] ${barHeight} ${
                  r.tone === 'signal'
                    ? 'bg-signal'
                    : vedette
                      ? 'bg-azur'
                      : 'bg-azur/40'
                }`}
                initial={reduced ? false : { width: 0 }}
                animate={inView || reduced ? { width: `${Math.max(1.2, (r.value / max) * 100)}%` } : undefined}
                transition={{
                  duration: 0.95,
                  delay: reduced ? 0 : Math.min(i, 14) * 0.035,
                  ease: EASE,
                }}
              />
            </span>

            <span
              className={`${valueWidth} text-right text-[0.78rem] tabular transition-colors duration-200 sm:text-[0.83rem] ${
                vedette ? 'font-semibold text-marine' : 'text-slate'
              }`}
            >
              {r.display}
              {r.sub ? (
                <span className="ml-1.5 text-[0.72rem] text-marine/80">{r.sub}</span>
              ) : null}
            </span>

            {/* L'info-bulle au survol. Elle ne porte jamais une information
                absente de la ligne : elle la complète. */}
            {r.hint && survole ? (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none absolute -top-1 right-2 z-20 hidden -translate-y-full rounded-lg bg-abysse px-3 py-1.5 font-mono text-[0.66rem] text-porcelain shadow-halo-lg lg:block"
              >
                {r.hint}
              </motion.span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
