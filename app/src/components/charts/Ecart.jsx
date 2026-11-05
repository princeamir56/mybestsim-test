import { motion } from 'framer-motion';
import { COULEUR, Legende, graduations, useGraphique } from './outils.jsx';
import { EASE } from '../../lib/motion.js';
import { eur, n2 } from '../../lib/format.js';

const HAUT = 28;
const BAS = 30;
const GAUCHE = 40;
const DROITE = 34;

/**
 * Deux courbes et la bande qui les sépare : c'est la bande, la prime.
 *
 * L'axe horizontal respecte les durées réelles (7, 15, 30 jours) : c'est ce qui
 * rend l'écartement honnête. Le coefficient est écrit dans la bande à chaque
 * durée, et chaque point porte sa valeur.
 */
export default function Ecart({ points, legende }) {
  const { ref, largeur, anime, vu } = useGraphique({ largeurDefaut: 1000, seuil: 0.3 });
  const hauteur = largeur < 520 ? 320 : 340;
  const minJ = points[0].jours;
  const maxJ = points[points.length - 1].jours;
  const max = Math.max(...points.map((p) => p.haut)) * 1.14;
  const X = (j) => GAUCHE + ((j - minJ) / (maxJ - minJ)) * (largeur - GAUCHE - DROITE);
  const Y = (v) => HAUT + (1 - v / max) * (hauteur - HAUT - BAS);
  const ticks = graduations(0, max, 4);
  const ligne = (cle) => points.map((p, i) => `${i ? 'L' : 'M'}${X(p.jours)} ${Y(p[cle])}`).join(' ');
  const bande = `${ligne('haut')} ${[...points].reverse().map((p) => `L${X(p.jours)} ${Y(p.bas)}`).join(' ')} Z`;

  return (
    <div ref={ref}>
      <Legende items={[[legende[0], COULEUR.signal], [legende[1], COULEUR.azur]]} droite="Prix médians" />
      <svg
        width="100%"
        height={hauteur}
        viewBox={`0 0 ${largeur} ${hauteur}`}
        role="img"
        aria-label="La prime de l'illimité selon la durée : l'écart de prix avec le forfait à volume limité s'élargit à mesure que la durée augmente."
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={GAUCHE} x2={largeur - DROITE} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? COULEUR.axe : COULEUR.grille} />
            <text x={GAUCHE - 8} y={Y(t) + 4} textAnchor="end" className="fill-slate text-[11px]">{t} €</text>
          </g>
        ))}
        <motion.path
          d={bande}
          fill={COULEUR.signal}
          initial={anime ? { opacity: 0 } : false}
          animate={vu ? { opacity: 0.1 } : undefined}
          style={anime ? undefined : { opacity: 0.1 }}
          transition={{ duration: 0.9, delay: anime ? 0.9 : 0 }}
        />
        {[['haut', COULEUR.signal], ['bas', COULEUR.azur]].map(([cle, couleur]) => (
          <motion.path
            key={cle}
            d={ligne(cle)}
            fill="none"
            stroke={couleur}
            strokeWidth="2.25"
            strokeLinecap="round"
            initial={anime ? { pathLength: 0 } : false}
            animate={vu ? { pathLength: 1 } : undefined}
            transition={{ duration: 1.25, ease: EASE }}
          />
        ))}
        {points.map((p, i) => {
          const ancre = i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle';
          const delai = anime ? 0.5 + i * 0.25 : 0;
          return (
            <motion.g
              key={p.jours}
              initial={anime ? { opacity: 0 } : false}
              animate={vu ? { opacity: 1 } : undefined}
              transition={{ duration: 0.5, delay: delai }}
            >
              <circle cx={X(p.jours)} cy={Y(p.haut)} r="5" fill={COULEUR.signal} stroke="#fbf9f5" strokeWidth="2" />
              <circle cx={X(p.jours)} cy={Y(p.bas)} r="5" fill={COULEUR.azur} stroke="#fbf9f5" strokeWidth="2" />
              <text x={X(p.jours)} y={Y(p.haut) - 12} textAnchor={ancre} className="fill-marine text-[12px] font-semibold">{eur(p.haut)}</text>
              <text x={X(p.jours)} y={Y(p.bas) + 21} textAnchor={ancre} className="fill-marine text-[12px] font-semibold">{eur(p.bas)}</text>
              {Y(p.bas) - Y(p.haut) > 40 ? (
                <text x={X(p.jours) + (i === 0 ? 10 : i === points.length - 1 ? -10 : 0)} y={(Y(p.haut) + Y(p.bas)) / 2 + 6} textAnchor={ancre} className="fill-marine font-display text-[17px]">
                  ×{n2(p.ratio)}
                </text>
              ) : null}
              <text x={X(p.jours)} y={hauteur - 8} textAnchor={ancre} className="fill-slate text-[11.5px]">{p.jours} jours</text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
