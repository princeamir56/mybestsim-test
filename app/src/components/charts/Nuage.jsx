import { useState } from 'react';
import { motion } from 'framer-motion';
import { COULEUR, Infobulle, graduations, useGraphique, useInfobulle } from './outils.jsx';
import { n } from '../../lib/format.js';

const HAUT = 14;
const BAS = 44;
const GAUCHE = 42;
const DROITE = 14;

/**
 * Taille contre efficacité : chaque fournisseur est un point.
 *
 * Le classement seul ne dit pas POURQUOI un fournisseur gagne souvent. Ici, la
 * position horizontale donne la présence et la hauteur le taux de victoire : un
 * point à droite gagne parce qu'il est partout, un point en haut gagne parce
 * qu'il est bon marché. Seuls les extrêmes sont étiquetés ; les autres se lisent
 * au survol ou au tap, sur le point le plus proche.
 */
export default function Nuage({ points, libelleX, libelleY, formatY, moyenne, hauteurGrande = 540 }) {
  const { ref, largeur, anime, vu } = useGraphique({ largeurDefaut: 620, seuil: 0.25 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();
  const [actif, setActif] = useState(null);

  const hauteur = largeur < 420 ? 340 : hauteurGrande;
  const maxX = Math.max(...points.map((p) => p.x)) * 1.06;
  const minX = Math.min(...points.map((p) => p.x)) * 0.7;
  const maxY = Math.max(...points.map((p) => p.y)) * 1.1;
  const minY = Math.min(...points.map((p) => p.y)) * 0.75;
  const X = (v) => GAUCHE + ((v - minX) / (maxX - minX)) * (largeur - GAUCHE - DROITE);
  const Y = (v) => HAUT + (1 - (v - minY) / (maxY - minY)) * (hauteur - HAUT - BAS);
  const ticksX = graduations(minX, maxX, largeur < 420 ? 4 : 6);
  const ticksY = graduations(minY, maxY, 5);

  const surMouvement = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let meilleur = null;
    let d = 1600;
    points.forEach((p) => {
      const dd = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2;
      if (dd < d) {
        d = dd;
        meilleur = p;
      }
    });
    setActif(meilleur?.label ?? null);
    if (meilleur) montrer(e, meilleur.bulle, { x: X(meilleur.x), y: Y(meilleur.y) - 6 });
    else cacher();
  };

  return (
    <div ref={ref}>
      <div ref={conteneur} className="relative">
        <svg
          width="100%"
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label={`Nuage de points : ${libelleY} selon ${libelleX}, pour chaque fournisseur. Détail dans la table de données.`}
          onPointerMove={surMouvement}
          onClick={surMouvement}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') {
              setActif(null);
              cacher();
            }
          }}
        >
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={GAUCHE} x2={largeur - DROITE} y1={Y(t)} y2={Y(t)} stroke={COULEUR.grille} />
              <text x={GAUCHE - 8} y={Y(t) + 4} textAnchor="end" className="fill-slate text-[11px]">{formatY(t)}</text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} x={X(t)} y={hauteur - BAS + 18} textAnchor="middle" className="fill-slate text-[11px]">{n(t)}</text>
          ))}
          <line x1={GAUCHE} x2={largeur - DROITE} y1={hauteur - BAS} y2={hauteur - BAS} stroke={COULEUR.axe} />
          <text x={largeur - DROITE} y={hauteur - 6} textAnchor="end" className="fill-slate text-[11.5px]">{libelleX} →</text>

          <motion.g initial={anime ? { opacity: 0 } : false} animate={vu ? { opacity: 1 } : undefined} transition={{ duration: 0.6, delay: anime ? 0.5 : 0 }}>
            <line x1={GAUCHE} x2={largeur - DROITE} y1={Y(moyenne.valeur)} y2={Y(moyenne.valeur)} stroke={COULEUR.encre} strokeWidth="1.25" strokeDasharray="3 3" />
            <text x={largeur - DROITE} y={Y(moyenne.valeur) - 6} textAnchor="end" className="etiquette fill-marine text-[11.5px]">{moyenne.libelle}</text>
          </motion.g>

          {actif && (() => {
            const p = points.find((q) => q.label === actif);
            return (
              <g className="pointer-events-none">
                <line x1={X(p.x)} x2={X(p.x)} y1={Y(p.y)} y2={hauteur - BAS} stroke={COULEUR.axe} strokeDasharray="2 3" />
                <line x1={GAUCHE} x2={X(p.x)} y1={Y(p.y)} y2={Y(p.y)} stroke={COULEUR.axe} strokeDasharray="2 3" />
              </g>
            );
          })()}

          {points.map((p, i) => {
            const couleur = p.vedette ? COULEUR.azur : '#7fb0de';
            return (
              <motion.g
                key={p.label}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                initial={anime ? { opacity: 0, scale: 0 } : false}
                animate={vu ? { opacity: 1, scale: 1 } : undefined}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: anime ? i * 0.035 : 0 }}
              >
                <circle cx={X(p.x)} cy={Y(p.y)} r={actif === p.label ? 8 : p.vedette ? 7 : 5.5} fill={couleur} stroke="#fbf9f5" strokeWidth="2" style={{ transition: 'r 150ms' }} />
              </motion.g>
            );
          })}

          {points.filter((p) => p.vedette).map((p) => {
            const aDroite = X(p.x) < largeur - 90;
            return (
              <motion.text
                key={`${p.label}-t`}
                x={X(p.x) + (aDroite ? 11 : -11)}
                y={Y(p.y) + 4}
                textAnchor={aDroite ? 'start' : 'end'}
                className="pointer-events-none fill-marine text-[12.5px] font-semibold"
                style={{ paintOrder: 'stroke', stroke: '#fbf9f5', strokeWidth: 3 }}
                initial={anime ? { opacity: 0 } : false}
                animate={vu ? { opacity: 1 } : undefined}
                transition={{ duration: 0.5, delay: anime ? 0.8 : 0 }}
              >
                {p.label}
              </motion.text>
            );
          })}

          <text x={GAUCHE} y={HAUT - 3} className="fill-slate text-[11.5px]">↑ {libelleY}</text>
        </svg>
        <Infobulle bulle={bulle} conteneur={conteneur} />
      </div>
    </div>
  );
}
