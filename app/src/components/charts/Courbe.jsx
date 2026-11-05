import { motion } from 'framer-motion';
import { COULEUR, Infobulle, graduations, useGraphique, useInfobulle } from './outils.jsx';
import { EASE } from '../../lib/motion.js';

const HAUT = 24;
const BAS = 26;
const GAUCHE = 34;
const DROITE = 18;

/**
 * Une courbe qui se trace : le prix du gigaoctet à mesure que le volume monte.
 * Paliers à espacement égal (échelle ordinale), seuls le premier et le dernier
 * portent leur valeur ; les autres se lisent au survol.
 */
export default function Courbe({ points, format, hauteur = 250 }) {
  const { ref, largeur, anime, vu } = useGraphique({ largeurDefaut: 560, seuil: 0.3 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();
  const max = Math.max(...points.map((p) => p.value)) * 1.1;
  const pas = (largeur - GAUCHE - DROITE) / Math.max(1, points.length - 1);
  const X = (i) => GAUCHE + pas * i;
  const Y = (v) => HAUT + (1 - v / max) * (hauteur - HAUT - BAS);
  const ticks = graduations(0, max, 4);
  const trace = points.map((p, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(p.value)}`).join(' ');
  const aire = `${trace} L${X(points.length - 1)} ${hauteur - BAS} L${X(0)} ${hauteur - BAS} Z`;

  return (
    <div ref={ref}>
      <div ref={conteneur} className="relative">
        <svg
          width="100%"
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label="Courbe du prix médian du gigaoctet selon le palier de volume : il baisse fortement quand le volume augmente."
          onPointerLeave={(e) => e.pointerType === 'mouse' && cacher()}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={GAUCHE} x2={largeur - DROITE} y1={Y(t)} y2={Y(t)} stroke={t === 0 ? COULEUR.axe : COULEUR.grille} />
              <text x={GAUCHE - 8} y={Y(t) + 4} textAnchor="end" className="fill-slate text-[11px]">{t} €</text>
            </g>
          ))}
          <motion.path
            d={aire}
            fill={COULEUR.azur}
            initial={anime ? { opacity: 0 } : false}
            animate={vu ? { opacity: 0.09 } : undefined}
            style={anime ? undefined : { opacity: 0.09 }}
            transition={{ duration: 0.8, delay: anime ? 0.7 : 0 }}
          />
          <motion.path
            d={trace}
            fill="none"
            stroke={COULEUR.azur}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={anime ? { pathLength: 0 } : false}
            animate={vu ? { pathLength: 1 } : undefined}
            transition={{ duration: 1.3, ease: EASE }}
          />
          {points.map((p, i) => {
            const bord = i === 0 || i === points.length - 1;
            return (
              <g key={p.label}>
                <motion.circle
                  cx={X(i)}
                  cy={Y(p.value)}
                  r={bord ? 5.5 : 4.5}
                  fill={COULEUR.azur}
                  stroke="#fbf9f5"
                  strokeWidth="2"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  initial={anime ? { scale: 0 } : false}
                  animate={vu ? { scale: 1 } : undefined}
                  transition={{ type: 'spring', stiffness: 320, damping: 18, delay: anime ? 0.15 + i * 0.16 : 0 }}
                />
                {bord ? (
                  <text
                    x={X(i) + (i === 0 ? 10 : 0)}
                    y={Y(p.value) - 11}
                    textAnchor={i === 0 ? 'start' : 'end'}
                    className="fill-marine text-[12px] font-semibold"
                  >
                    {format(p.value)}
                  </text>
                ) : null}
                <text x={X(i)} y={hauteur - 8} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} className="fill-slate text-[11.5px]">{p.label}</text>
                <rect
                  x={X(i) - pas / 2}
                  y={0}
                  width={pas}
                  height={hauteur}
                  fill="transparent"
                  onPointerEnter={(e) => montrer(e, p.bulle, { x: X(i), y: Y(p.value) - 6 })}
                  onClick={(e) => montrer(e, p.bulle, { x: X(i), y: Y(p.value) - 6 })}
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
