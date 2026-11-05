import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { EASE, useReducedMotion } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';

/**
 * Révèle une ligne mot par mot, chacun sortant de sa propre fenêtre de coupe.
 *
 * Par mot et non par caractère : sur un titre français, un découpage à la
 * lettre casse les accents et les ligatures à l'œil, et la cascade devient
 * un crépitement. Le mot garde le rythme de lecture.
 *
 * La chaîne entière reste un seul libellé dans l'arbre d'accessibilité : un
 * lecteur d'écran lit la phrase, pas neuf fragments.
 */
export default function SplitText({
  text,
  className = '',
  delay = 0,
  stagger = 0.055,
  duration = 1,
  as: Tag = 'span',
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[Tag] || motion.span;

  if (reduced || EST_SERVEUR) return <Tag className={className}>{text}</Tag>;

  const mots = String(text).split(' ');

  return (
    <MotionTag className={className}>
      <span className="sr-only">{text}</span>
      {mots.map((mot, i) => (
        <span
          key={`${mot}-${i}`}
          aria-hidden="true"
          // Chaque mot a sa fenêtre de coupe, rembourrée sur les deux axes puis
          // retirée d'autant : une hampe haute et un jambage bas passent tous
          // deux la coupe sans que les glyphes perdent leurs métriques.
          className="inline-block overflow-hidden align-baseline px-[0.08em] py-[0.2em] -mx-[0.08em] -my-[0.2em]"
        >
          <motion.span
            className="inline-block"
            initial={{ y: '112%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ delay: delay + i * stagger, duration, ease: EASE }}
          >
            {mot}
            {i < mots.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

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
