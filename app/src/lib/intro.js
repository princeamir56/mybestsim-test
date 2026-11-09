// La scène d'ouverture se joue une fois par session, et uniquement à l'arrivée
// sur le tableau de bord.
//
// Pas sur l'article : c'est une page d'atterrissage SEO. Un visiteur venu de
// Google veut sa réponse tout de suite, et un rideau plein écran retarderait le
// plus grand affichage de la page, que Google mesure.
const CLE = 'mbs-intro-vue';

export const SCENE = 1.05; // l'oiseau, puis le mot
export const LEVER = 0.45; // le rideau qui se lève
const SCENE_REDUITE = 0.7;

const mouvementReduit = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const dejaVue = () => {
  // Safari en navigation privée peut lever une exception : le visiteur revoit
  // alors simplement la scène, ce qui est le bon côté de la panne.
  try {
    return sessionStorage.getItem(CLE) === '1';
  } catch {
    return false;
  }
};

export const marquerVue = () => {
  try {
    sessionStorage.setItem(CLE, '1');
  } catch {
    /* voir ci-dessus */
  }
};

const surLeTableauDeBord = () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const chemin = window.location.pathname.replace(/\/$/, '');
  return chemin === base && !window.location.hash;
};

// Capturé au chargement du module, AVANT que la scène n'écrive son drapeau : il
// décrit la façon dont CE chargement a commencé.
export const INTRO_A_JOUER =
  typeof window !== 'undefined' && surLeTableauDeBord() && !dejaVue();

export const dureeScene = () => (mouvementReduit() ? SCENE_REDUITE : SCENE);
