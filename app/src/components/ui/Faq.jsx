import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';

/**
 * La FAQ de l'article.
 *
 * Les questions sont aussi la source du balisage FAQPage : le JSON-LD est
 * construit depuis CE tableau (voir pages/Article.jsx), jamais saisi deux
 * fois. Impossible donc de promettre à Google une question absente de la page.
 */
export default function Faq({ items }) {
  const [ouvert, setOuvert] = useState(0);

  return (
    <div className="divide-y divide-marine/10 border-y border-marine/10">
      {items.map((q, i) => (
        <div key={q.question}>
          <h3>
            <button
              type="button"
              onClick={() => setOuvert(ouvert === i ? null : i)}
              aria-expanded={ouvert === i}
              className="group flex w-full items-start justify-between gap-5 py-5 text-left"
            >
              <span className="font-display text-[1.08rem] font-normal leading-snug text-marine transition-colors duration-300 group-hover:text-azur">
                {q.question}
              </span>
              <motion.span
                aria-hidden="true"
                animate={{ rotate: ouvert === i ? 45 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-1 shrink-0 text-marine/80 transition-colors group-hover:text-signal-fonce"
              >
                <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M7 1.5v11M1.5 7h11" />
                </svg>
              </motion.span>
            </button>
          </h3>
          {/* Au prérendu, toutes les réponses sont écrites : le balisage
              FAQPage promet à Google des réponses qui doivent exister dans la
              page servie, pas seulement après hydratation. */}
          <AnimatePresence initial={false}>
            {(EST_SERVEUR || ouvert === i) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="pb-6 pr-10 text-[0.98rem] leading-[1.75] text-slate">
                  {q.reponse}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
