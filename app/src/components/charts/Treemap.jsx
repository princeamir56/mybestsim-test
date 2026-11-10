import { motion } from 'framer-motion';
import { Infobulle, useGraphique, useInfobulle } from './outils.jsx';
import { EASE } from '../../lib/motion.js';

// Une seule teinte, du foncé au clair selon le rang : l'information est la
// taille, pas l'identité. Chaque paire fond/texte dépasse 4,5:1.
const TONS = [
  ['#143f6b', '#ffffff'],
  ['#1d5591', '#ffffff'],
  ['#2a6fb8', '#ffffff'],
  ['#5f9bd6', '#0b2947'],
  ['#7fb0de', '#0b2947'],
];

/** Algorithme « squarified » : des rectangles aussi proches du carré que possible. */
function squarifier(items, x0, y0, w0, h0) {
  const total = items.reduce((s, i) => s + i.valeur, 0);
  const echelle = (w0 * h0) / total;
  const restant = items.map((i) => ({ ...i, aire: i.valeur * echelle }));
  const sortie = [];
  let [x, y, w, h] = [x0, y0, w0, h0];

  const pire = (ligne, cote) => {
    const s = ligne.reduce((a, i) => a + i.aire, 0);
    const mx = Math.max(...ligne.map((i) => i.aire));
    const mn = Math.min(...ligne.map((i) => i.aire));
    return Math.max((cote * cote * mx) / (s * s), (s * s) / (cote * cote * mn));
  };

  while (restant.length) {
    const cote = Math.min(w, h);
    const ligne = [restant.shift()];
    while (restant.length && pire([...ligne, restant[0]], cote) <= pire(ligne, cote)) {
      ligne.push(restant.shift());
    }
    const s = ligne.reduce((a, i) => a + i.aire, 0);
    if (w >= h) {
      const lg = s / h;
      let cy = y;
      ligne.forEach((i) => {
        const ih = i.aire / lg;
        sortie.push({ ...i, x, y: cy, w: lg, h: ih });
        cy += ih;
      });
      x += lg;
      w -= lg;
    } else {
      const ht = s / w;
      let cx = x;
      ligne.forEach((i) => {
        const iw = i.aire / ht;
        sortie.push({ ...i, x: cx, y, w: iw, h: ht });
        cx += iw;
      });
      y += ht;
      h -= ht;
    }
  }
  return sortie;
}

/**
 * Part de chaque fournisseur dans le catalogue. Chaque case porte son nom et
 * son compte en toutes lettres : aucune lecture n'exige le survol, et le
 * classement exact reste disponible dans la table de données juste en dessous.
 */
export default function Treemap({ items, hauteurPour }) {
  const { ref, largeur, anime, vu } = useGraphique({ largeurDefaut: 1100, seuil: 0.2 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();
  const hauteur = hauteurPour ? hauteurPour(largeur) : largeur < 520 ? 700 : largeur < 800 ? 520 : 470;

  const cases = squarifier(items, 0, 0, largeur, hauteur);

  return (
    <div ref={ref}>
      <div ref={conteneur} className="relative" style={{ height: hauteur }} onPointerLeave={(e) => e.pointerType === 'mouse' && cacher()}>
        {cases.map((c, i) => {
          const rang = Math.min(TONS.length - 1, Math.floor((i / items.length) * TONS.length));
          const [fond, texte] = TONS[rang];
          const grand = c.w > 104 && c.h > 100;
          // Les plus petites cases resserrent leur marge : le compte reste entier.
          const serre = !grand && (c.w < 76 || c.h < 66);
          return (
            <motion.div
              key={c.nom}
              className={`absolute overflow-hidden rounded-[7px] ${c.w < 60 ? 'p-1' : serre ? 'p-1.5' : 'p-2 sm:p-2.5'}`}
              style={{
                left: c.x + 1,
                top: c.y + 1,
                width: Math.max(0, c.w - 2),
                height: Math.max(0, c.h - 2),
                background: fond,
                color: texte,
                transformOrigin: 'top left',
              }}
              initial={anime ? { opacity: 0, scale: 0.86 } : false}
              animate={vu ? { opacity: 1, scale: 1 } : undefined}
              transition={{ duration: 0.7, delay: anime ? Math.min(i, 17) * 0.04 : 0, ease: EASE }}
              whileHover={anime ? { filter: 'brightness(1.1)' } : undefined}
              onPointerEnter={(e) => montrer(e, c.bulle, { x: c.x + c.w / 2, y: c.y + 10 })}
              onClick={(e) => montrer(e, c.bulle, { x: c.x + c.w / 2, y: c.y + 10 })}
            >
              <p className={`font-semibold leading-tight ${grand ? 'text-[0.95rem]' : serre ? 'text-[0.7rem]' : 'text-[0.76rem]'}`}>{c.nom}</p>
              <p className={`tabular leading-tight ${grand ? 'mt-1 text-[1.5rem] font-display' : serre ? 'text-[0.7rem]' : 'mt-0.5 text-[0.76rem]'}`}>{c.affiche}</p>
              {grand ? <p className="mt-0.5 text-[0.76rem] opacity-90">{c.part}</p> : null}
            </motion.div>
          );
        })}
        <Infobulle bulle={bulle} conteneur={conteneur} />
      </div>
    </div>
  );
}
