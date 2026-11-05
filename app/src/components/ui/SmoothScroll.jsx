import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { useReducedMotion } from '../../lib/motion.js';
import { allerA, definirLenis } from '../../lib/scroll.js';

/**
 * Défilement lissé sur toute la page.
 *
 * Coupé net si le visiteur demande un mouvement réduit : le défilement lissé
 * est précisément le genre d'effet qui provoque des nausées chez les personnes
 * sensibles au mouvement, et c'est le seul qu'on ne peut pas « atténuer ».
 */
export default function SmoothScroll() {
  const reduced = useReducedMotion();

  useEffect(() => {
    let lenis = null;
    let frame;

    if (!reduced) {
      lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        // Au doigt, le défilement natif est déjà parfait et bien plus réactif :
        // on ne s'interpose que sur la molette.
        smoothTouch: false,
      });
      definirLenis(lenis);
      if (document.documentElement.classList.contains('intro-bloque')) lenis.stop();

      const raf = (time) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    }

    // Les ancres de la page passent par une seule porte, sinon le saut natif se
    // bat contre l'interpolation et la page tremble.
    const onClick = (e) => {
      const a = e.target.closest?.('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      allerA(id);
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(frame);
      definirLenis(null);
      lenis?.destroy();
    };
  }, [reduced]);

  return null;
}
