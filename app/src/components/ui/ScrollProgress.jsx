import { motion, useScroll, useSpring } from 'framer-motion';

/** Le fil de progression de lecture, en haut de la fenêtre. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const largeur = useSpring(scrollYProgress, { stiffness: 320, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: largeur }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-signal"
    />
  );
}
