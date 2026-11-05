import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useReducedMotion } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';

const useIsoLayoutEffect = EST_SERVEUR ? useEffect : useLayoutEffect;

// Les couleurs de séries, validées (scripts du skill dataviz) sur le papier.
export const COULEUR = {
  azur: '#1f6fb2',
  signal: '#d2693a',
  grille: 'rgba(17,58,99,0.10)',
  axe: 'rgba(17,58,99,0.28)',
  encre: '#113a63',
};

/**
 * Le socle commun des graphiques.
 *
 *  - `largeur` : les SVG sont dessinés au pixel réel plutôt qu'étirés par un
 *    viewBox. Un graphique étiré réduit aussi son texte : à 340 px de large, une
 *    étiquette de 12 px tomberait à 5 px.
 *  - `vu` : l'animation part à l'arrivée à l'écran, une seule fois.
 *  - `anime` : faux au prérendu et en mouvement réduit, où l'état final est
 *    écrit directement. Le HTML servi porte donc toujours le graphique complet.
 */
export function useGraphique({ largeurDefaut = 900, seuil = 0.2 } = {}) {
  const reduced = useReducedMotion();
  const anime = !reduced && !EST_SERVEUR;
  const { ref: refVue, inView } = useInView({ triggerOnce: true, threshold: seuil });
  const noeud = useRef(null);
  const [largeur, setLargeur] = useState(largeurDefaut);

  useIsoLayoutEffect(() => {
    if (!noeud.current) return undefined;
    const mesure = () => {
      const l = noeud.current?.getBoundingClientRect().width;
      if (l) setLargeur(Math.round(l));
    };
    mesure();
    const ro = new ResizeObserver(mesure);
    ro.observe(noeud.current);
    return () => ro.disconnect();
  }, []);

  const ref = useCallback(
    (el) => {
      noeud.current = el;
      refVue(el);
    },
    [refVue]
  );

  return { ref, largeur, anime, vu: inView || !anime };
}

/**
 * L'info-bulle partagée.
 *
 * Positionnée dans le graphique et bornée à ses bords : elle ne peut ni sortir
 * de l'écran sur un téléphone, ni être coupée par le panneau. Au doigt, un tap
 * sur une marque l'ouvre et un tap ailleurs la referme.
 */
export function useInfobulle() {
  const conteneur = useRef(null);
  const [bulle, setBulle] = useState(null);

  const montrer = useCallback((evenement, contenu, ancre) => {
    const r = conteneur.current?.getBoundingClientRect();
    if (!r) return;
    setBulle({
      x: ancre ? ancre.x : evenement.clientX - r.left,
      y: ancre ? ancre.y : evenement.clientY - r.top,
      contenu,
    });
  }, []);
  const cacher = useCallback(() => setBulle(null), []);

  useEffect(() => {
    if (!bulle) return undefined;
    const dehors = (e) => {
      if (!conteneur.current?.contains(e.target)) setBulle(null);
    };
    document.addEventListener('pointerdown', dehors);
    return () => document.removeEventListener('pointerdown', dehors);
  }, [bulle]);

  return { conteneur, bulle, montrer, cacher };
}

export function Infobulle({ bulle, conteneur }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  useIsoLayoutEffect(() => {
    if (!bulle || !ref.current || !conteneur.current) return;
    const b = ref.current.getBoundingClientRect();
    const c = conteneur.current.getBoundingClientRect();
    const x = Math.max(4, Math.min(c.width - b.width - 4, bulle.x - b.width / 2));
    const dessus = bulle.y - b.height - 12;
    setPos({ x, y: dessus < 2 ? bulle.y + 16 : dessus });
  }, [bulle, conteneur]);

  if (!bulle) return null;
  return (
    <div
      ref={ref}
      role="status"
      style={{
        left: pos?.x ?? 0,
        top: pos?.y ?? 0,
        opacity: pos ? 1 : 0,
      }}
      className="pointer-events-none absolute z-20 max-w-[260px] rounded-lg bg-abysse px-3 py-2 text-[0.76rem] leading-snug text-porcelain shadow-halo-lg transition-opacity duration-150"
    >
      {bulle.contenu}
    </div>
  );
}

/** Légende : toujours présente dès deux séries, jamais la couleur seule. */
export function Legende({ items, droite }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.8rem] text-slate">
      {items.map(([libelle, couleur]) => (
        <span key={libelle} className="flex items-center gap-2">
          <i aria-hidden="true" className="h-[10px] w-[10px] rounded-[3px]" style={{ background: couleur }} />
          {libelle}
        </span>
      ))}
      {droite ? <span className="ml-auto text-[0.76rem] text-marine/80">{droite}</span> : null}
    </div>
  );
}

/** Graduations « rondes » entre deux bornes. */
export function graduations(min, max, voulu = 5) {
  const brut = (max - min) / voulu;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10].map((m) => m * puissance).find((p) => p >= brut) ?? brut;
  const out = [];
  for (let v = Math.ceil(min / pas) * pas; v <= max + 1e-9; v += pas) out.push(Number(v.toFixed(6)));
  return out;
}
