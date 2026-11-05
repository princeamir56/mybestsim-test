import { motion } from 'framer-motion';
import { COULEUR, Infobulle, useGraphique, useInfobulle } from './outils.jsx';
import { EASE } from '../../lib/motion.js';

const HAUT = 24;
const BAS = 26;

/** Colonnes verticales : des catégories ordonnées, qu'on lit comme une grille. */
export default function Colonnes({ rows, hauteur = 250 }) {
  const { ref, largeur, anime, vu } = useGraphique({ largeurDefaut: 560, seuil: 0.3 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();
  const max = Math.max(...rows.map((r) => r.value));
  const pas = largeur / rows.length;
  const lg = Math.min(46, pas - 8);
  const utile = hauteur - HAUT - BAS;

  return (
    <div ref={ref}>
      <div ref={conteneur} className="relative">
        <svg
          width="100%"
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label="Nombre d'offres par palier de volume. Détail dans la table de données."
          onPointerLeave={(e) => e.pointerType === 'mouse' && cacher()}
        >
          <line x1={0} x2={largeur} y1={hauteur - BAS} y2={hauteur - BAS} stroke={COULEUR.axe} />
          {rows.map((r, i) => {
            const cx = pas * i + pas / 2;
            const h = (r.value / max) * utile;
            const y = hauteur - BAS - h;
            const ancre = { x: cx, y };
            return (
              <g key={r.label}>
                <motion.rect
                  x={cx - lg / 2}
                  y={y}
                  width={lg}
                  height={h}
                  rx={4}
                  fill={r.tone === 'signal' ? COULEUR.signal : '#5f9bd6'}
                  style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                  initial={anime ? { scaleY: 0 } : false}
                  animate={vu ? { scaleY: 1 } : undefined}
                  transition={{ duration: 0.9, delay: anime ? i * 0.07 : 0, ease: EASE }}
                />
                <motion.text
                  x={cx}
                  y={y - 7}
                  textAnchor="middle"
                  className="fill-marine text-[11.5px] font-semibold"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  initial={anime ? { opacity: 0 } : false}
                  animate={vu ? { opacity: 1 } : undefined}
                  transition={{ duration: 0.4, delay: anime ? 0.5 + i * 0.07 : 0 }}
                >
                  {r.display}
                </motion.text>
                <text x={cx} y={hauteur - 8} textAnchor="middle" className="fill-slate text-[11.5px]">{r.label}</text>
                <rect
                  x={pas * i}
                  y={0}
                  width={pas}
                  height={hauteur}
                  fill="transparent"
                  onPointerEnter={(e) => montrer(e, r.bulle, ancre)}
                  onClick={(e) => montrer(e, r.bulle, ancre)}
                />
              </g>
            );
          })}
        </svg>
        <Infobulle bulle={bulle} conteneur={conteneur} />
      </div>
    </div>
  );
}
