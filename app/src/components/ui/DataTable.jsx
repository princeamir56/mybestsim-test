import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '../../lib/motion.js';

/**
 * L'équivalent textuel de chaque graphique, replié par défaut.
 *
 * Il n'est pas là pour l'accessibilité au sens strict — il est là parce qu'un
 * recruteur qui veut vérifier un chiffre doit pouvoir le LIRE, pas l'estimer
 * sur une barre.
 */
export default function DataTable({ headers, rows, foot, sansMarge }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className={sansMarge ? '' : 'mt-6'}>
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-marine/20 px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-marine/80 transition-colors duration-300 hover:border-marine/35 hover:text-marine"
      >
        <motion.svg aria-hidden="true" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" animate={{ rotate: ouvert ? 45 : 0 }} transition={{ duration: 0.25 }}>
          <path d="M6 1.5v9M1.5 6h9" />
        </motion.svg>
        {ouvert ? 'Masquer les données' : 'Voir les données'}
      </button>

      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.42, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-5 -mx-2 overflow-x-auto px-2" data-lenis-prevent>
              <table className="w-full min-w-[520px] text-[0.82rem]">
                <thead>
                  <tr>
                    {headers.map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`sticky top-0 border-b border-marine/20 bg-porcelain/95 pb-2.5 pt-1 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-marine/80 ${
                          i === 0 ? 'text-left' : 'text-right'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={String(r[0])} className="transition-colors hover:bg-marine/[0.035]">
                      {r.map((c, i) => (
                        <td
                          key={i}
                          className={`whitespace-nowrap border-b border-marine/[0.07] py-2.5 ${
                            i === 0 ? 'pr-4 font-medium text-marine' : 'pl-4 text-right text-slate'
                          }`}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {foot ? (
                  <tfoot>
                    <tr>
                      {foot.map((c, i) => (
                        <td
                          key={i}
                          className={`whitespace-nowrap border-t border-marine/25 py-2.5 font-semibold text-marine ${
                            i === 0 ? 'pr-4' : 'pl-4 text-right'
                          }`}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
