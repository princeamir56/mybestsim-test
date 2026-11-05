import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { EASE_SOFT, useReducedMotion } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';

// Révélation au défilement : fond et glisse ses enfants une fois visibles,
// une seule fois. <Reveal delay={0.12}><h2>…</h2></Reveal>
export default function Reveal({
  children,
  delay = 0,
  y = 24,
  x = 0,
  duration = 0.8,
  threshold = 0.06,
  className = '',
  as: Tag = 'div',
  ...rest
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold, rootMargin: '0px 0px -6% 0px' });
  const MotionTag = motion[Tag] || motion.div;

  // Au prérendu comme en mouvement réduit : on écrit directement l'état final.
  if (reduced || EST_SERVEUR) {
    const Plain = Tag;
    return (
      <Plain className={className} {...rest}>
        {children}
      </Plain>
    );
  }

  return (
    <MotionTag
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : undefined}
      transition={{ duration, delay, ease: EASE_SOFT }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
