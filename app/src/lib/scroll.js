// Le défilement programmé passe par une seule porte. Lenis interpole le
// défilement : un `scrollIntoView` natif en parallèle se bat avec lui et la page
// tremble. En mouvement réduit, Lenis n'existe pas et le saut natif prend le
// relais.
import { useEffect, useState } from 'react';

let instance = null;

export const definirLenis = (lenis) => {
  instance = lenis;
};
export const obtenirLenis = () => instance;

export function allerA(cible, decalage = -90) {
  const el = typeof cible === 'string' ? document.getElementById(cible) : cible;
  if (!el) return false;
  if (instance) instance.scrollTo(el, { offset: decalage, force: true });
  else window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + decalage);
  return true;
}

export function allerEnHaut() {
  if (instance) instance.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

/** La section en cours de lecture, pour le menu et le sommaire. */
export function useSectionActive(ids) {
  const [active, setActive] = useState(null);
  const cle = ids.join('|');

  useEffect(() => {
    if (!ids.length) return undefined;
    // Une bande fine au tiers de l'écran : la section « active » est celle qu'on
    // est en train de lire, pas celle dont le bas dépasse encore en haut.
    const obs = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
          else setActive((a) => (a === e.target.id ? null : a));
        });
      },
      { rootMargin: '-35% 0px -60% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [cle]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}
