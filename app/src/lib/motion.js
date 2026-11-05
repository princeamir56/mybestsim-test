// Constantes de mouvement partagées, et les quelques hooks sur lesquels tout
// le site s'anime. Une seule courbe pour l'ensemble, pour que rien ne paraisse
// emprunté ailleurs.
import { useEffect, useState } from 'react';

export const EASE = [0.16, 1, 0.3, 1];
// La cousine plus douce, pour ce qui parcourt une longue distance.
export const EASE_SOFT = [0.22, 1, 0.36, 1];

// Durées par intention, pour qu'un survol et une entrée de section
// n'empruntent jamais le minutage l'un de l'autre.
export const DURATION = {
  micro: 0.16, // pressions, bascules, retour de survol
  fast: 0.28, // puces, info-bulles, petites révélations
  base: 0.45, // cartes qui entrent, changements d'état
  slow: 0.8, // titres de section, barres qui se remplissent
};

export const SPRING = {
  // Indicateurs et pastilles : ils doivent se poser sans rebond.
  snappy: { type: 'spring', stiffness: 420, damping: 34 },
  // Panneaux : un peu de poids, aucun rebond.
  sheet: { type: 'spring', stiffness: 300, damping: 34, mass: 0.9 },
};

// Entrée en cascade, plafonnée pour qu'une longue liste ne prenne jamais
// plusieurs secondes.
export const stagger = (i, step = 0.05, max = 10) => Math.min(i, max) * step;

// Suit la préférence « mouvement réduit », et continue de la suivre si elle
// change pendant la visite.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

// Vrai uniquement sur un appareil à pointeur fin. Les effets magnétiques et
// l'inclinaison sont inutiles — et nuisibles — au doigt.
export function useFinePointer() {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = (e) => setFine(e.matches);
    setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return fine;
}

// Vrai tant qu'une media query correspond, suivie en direct (rotation, resize).
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
