import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useReducedMotion } from '../../lib/motion.js';

/**
 * Un nombre qui compte jusqu'à sa valeur quand il arrive à l'écran.
 *
 * Deux précautions qui comptent sur un tableau de bord :
 *
 *   - La valeur finale est écrite dans le DOM dès le départ dans un texte réservé aux lecteurs d'écran,
 *     et les chiffres qui défilent sont masqués aux lecteurs d'écran. Sinon un
 *     lecteur annonce « 1 304 » parce qu'il a lu en cours de route.
 *   - En mouvement réduit, le nombre est posé directement. Un chiffre qui
 *     défile n'est pas décoratif : c'est de l'information, et elle doit être
 *     lisible immédiatement.
 */
export default function CountUp({
  value,
  duration = 400,
  delai = 0,
  format = (v) => String(Math.round(v)),
  className = '',
}) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0 });
  // La vraie valeur est affichée tant que l'animation ne tourne pas. Partir de 0
  // laissait « 0 Go » à l'écran quand le déclenchement n'avait pas lieu : un
  // compteur décoratif ne doit jamais pouvoir afficher un chiffre faux.
  const [affiche, setAffiche] = useState(value);
  const frameRef = useRef(null);

  useEffect(() => {
    if (reduced) {
      setAffiche(value);
      return undefined;
    }
    if (!inView) return undefined;

    const depart = performance.now() + delai * 1000;
    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - depart) / duration));
      // Sortie exponentielle : la valeur file puis se pose, elle ne freine
      // jamais linéairement — c'est ce qui la fait paraître « calculée ».
      const eased = t === 0 ? 0 : 1 - 2 ** (-10 * t);
      const v = value * (t === 1 ? 1 : eased);
      setAffiche(Number.isInteger(value) ? Math.round(v) : v);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [inView, value, duration, delai, reduced]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{format(value)}</span>
      <span aria-hidden="true" data-compteur="">{format(affiche)}</span>
    </span>
  );
}
