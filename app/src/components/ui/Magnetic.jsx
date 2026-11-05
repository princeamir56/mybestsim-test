import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { SPRING, useFinePointer } from '../../lib/motion.js';

/**
 * L'enfant suit légèrement le curseur puis revient à sa place.
 *
 * Désactivé au doigt : sans pointeur, l'effet ne peut pas se déclencher, et le
 * ressort laisserait l'élément décalé après un tap.
 */
export default function Magnetic({ children, strength = 0.28, className = '' }) {
  const fine = useFinePointer();
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), SPRING.snappy);
  const y = useSpring(useMotionValue(0), SPRING.snappy);

  if (!fine) return <div className={className}>{children}</div>;

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
