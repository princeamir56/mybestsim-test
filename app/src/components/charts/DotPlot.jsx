import { motion } from 'framer-motion';
import { COULEUR, Infobulle, graduations, useGraphique, useInfobulle } from './outils.jsx';
import { EASE } from '../../lib/motion.js';

const LIGNE = 27;
const HAUT = 30;
const BAS = 8;

/**
 * Points classés autour de la médiane du marché.
 *
 * Un point peut se lire sur un axe qui ne part pas de zéro, pas une barre, dont
 * la longueur mentirait. C'est la bonne forme pour un marché resserré : les
 * écarts sont faibles en valeur absolue, mais ce sont eux la question. Chaque
 * point part de la médiane et rejoint sa place, ce qui montre le sens de l'écart.
 */
export default function DotPlot({ rows, mediane, libelleMediane, format }) {
  const { ref, largeur, anime, vu } = useGraphique({ largeurDefaut: 620, seuil: 0.15 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();

  const gauche = largeur < 420 ? 84 : 100;
  const droite = 56;
  const hauteur = HAUT + rows.length * LIGNE + BAS;
  const vals = rows.map((r) => r.value);
  const marge = (Math.max(...vals) - Math.min(...vals)) * 0.08;
  const min = Math.min(...vals) - marge;
  const max = Math.max(...vals) + marge;
  const x = (v) => gauche + ((v - min) / (max - min)) * (largeur - gauche - droite);
  const ticks = graduations(min, max, largeur < 420 ? 3 : 5);

  return (
    <div ref={ref}>
      <div ref={conteneur} className="relative">
        <svg
          width="100%"
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label={`Classement des fournisseurs autour de ${libelleMediane}. Détail dans la table de données.`}
          onPointerLeave={(e) => e.pointerType === 'mouse' && cacher()}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={HAUT - 6} y2={hauteur - BAS} stroke={COULEUR.grille} />
              <text x={x(t)} y={12} textAnchor="middle" className="fill-slate text-[11px]">{format(t, true)}</text>
            </g>
          ))}
          <line x1={x(mediane)} x2={x(mediane)} y1={HAUT - 6} y2={hauteur - BAS} stroke={COULEUR.encre} strokeWidth="1.25" strokeDasharray="3 3" />

          {rows.map((r, i) => {
            const cy = HAUT + i * LIGNE + LIGNE / 2;
            const px = x(r.value);
            const pm = x(mediane);
            const couleur = r.vedette === 'mieux' ? COULEUR.azur : r.vedette === 'pire' ? COULEUR.signal : '#7fb0de';
            const delai = anime ? Math.min(i, 17) * 0.035 : 0;
            return (
              <g key={r.label}>
                <rect
                  x={0}
                  y={cy - LIGNE / 2}
                  width={largeur}
                  height={LIGNE}
                  fill="transparent"
                  onPointerEnter={(e) => montrer(e, r.bulle, { x: px, y: cy - 8 })}
                  onClick={(e) => montrer(e, r.bulle, { x: px, y: cy - 8 })}
                />
                <text x={0} y={cy + 4} className={`pointer-events-none text-[12.5px] ${r.vedette ? 'fill-marine font-semibold' : 'fill-slate'}`}>{r.label}</text>
                <motion.line
                  className="pointer-events-none"
                  y1={cy}
                  y2={cy}
                  x1={pm}
                  stroke={couleur}
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={anime ? { x2: pm } : false}
                  animate={vu ? { x2: px } : undefined}
                  x2={anime ? undefined : px}
                  transition={{ duration: 0.9, delay: delai, ease: EASE }}
                />
                <motion.circle
                  className="pointer-events-none"
                  cy={cy}
                  r={r.vedette ? 6 : 4.5}
                  fill={couleur}
                  stroke="#fbf9f5"
                  strokeWidth="2"
                  initial={anime ? { cx: pm } : false}
                  animate={vu ? { cx: px } : undefined}
                  cx={anime ? undefined : px}
                  transition={{ duration: 0.9, delay: delai, ease: EASE }}
                />
                <text x={largeur} y={cy + 4} textAnchor="end" className={`pointer-events-none text-[12px] ${r.vedette ? 'fill-marine font-semibold' : 'fill-slate'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {format(r.value)}
                </text>
              </g>
            );
          })}
        </svg>
        <Infobulle bulle={bulle} conteneur={conteneur} />
      </div>
      <p className="mt-2 text-[0.76rem] text-marine/80">
        Trait pointillé : {libelleMediane}. L'axe ne part pas de zéro, pour rendre lisibles des écarts faibles.
      </p>
    </div>
  );
}
