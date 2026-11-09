import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { EASE, useReducedMotion } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';

/**
 * Le même geste, ligne par ligne et déclenché à l'arrivée dans le champ, pour
 * les titres de section — trop longs pour qu'une cascade par mot reste
 * élégante.
 */
export function LineReveal({ text, className = '', delay = 0, duration = 1 }) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });

  if (reduced || EST_SERVEUR) return <span className={className}>{String(text).replace(/\n/g, ' ')}</span>;

  const lignes = String(text).split('\n');

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{String(text).replace(/\n/g, ' ')}</span>
      {lignes.map((ligne, i) => (
        <span
          key={`${ligne}-${i}`}
          aria-hidden="true"
          className="block overflow-hidden py-[0.1em] -my-[0.1em]"
        >
          <motion.span
            className="block"
            initial={{ y: '112%' }}
            animate={inView ? { y: '0%' } : undefined}
            transition={{ delay: delay + i * 0.09, duration, ease: EASE }}
          >
            {ligne}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
