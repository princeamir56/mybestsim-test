import { motion } from 'framer-motion';
import { COULEUR, Infobulle, Legende, graduations, useGraphique, useInfobulle } from './outils.jsx';
import { EASE } from '../../lib/motion.js';
import { n } from '../../lib/format.js';

const HAUT = 54; // Réservé aux repères, pour qu'ils ne se posent jamais sur une barre.
const BAS = 30;
const GAUCHE = 40;
const DROITE = 10;

/**
 * La forme du catalogue en un coup d'œil : combien d'offres à chaque niveau de
 * prix, avec trois repères (médiane, moyenne, 100 €).
 *
 * C'est le seul graphique qui rend visible le piège le plus coûteux du jeu de
 * données : à droite de 100 €, il ne reste que la couleur des illimités.
 */
export default function Histogramme({ classes, reperes }) {
  const { ref, largeur, anime, vu } = useGraphique({ seuil: 0.3 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();

  const hauteur = largeur < 520 ? 270 : 320;
  const utileX = largeur - GAUCHE - DROITE;
  const utileY = hauteur - HAUT - BAS;
  const min = classes[0].de;
  const max = classes[classes.length - 1].a;
  const x = (v) => GAUCHE + ((v - min) / (max - min)) * utileX;
  const total = (c) => c.limites + c.illimites;
  const plafond = Math.max(...classes.map(total));
  const y = (v) => utileY * (v / plafond);
  const pasX = largeur < 520 ? 50 : 25;
  const ticksX = [];
  for (let t = Math.ceil(min / pasX) * pasX; t <= max; t += pasX) ticksX.push(t);
  const ticksY = graduations(0, plafond, 4);
  const bandes = utileX / classes.length;

  return (
    <div ref={ref}>
      <Legende items={[['Forfait à volume limité', COULEUR.azur], ['Forfait illimité', COULEUR.signal]]} droite="Nombre d'offres, par tranche de 5 €" />
      <div ref={conteneur} className="relative">
        <svg
          width="100%"
          height={hauteur}
          viewBox={`0 0 ${largeur} ${hauteur}`}
          role="img"
          aria-label="Histogramme des prix : la grande majorité des offres coûte moins de 30 euros, et au-delà de 100 euros il ne reste que des forfaits illimités."
          onPointerLeave={(e) => e.pointerType === 'mouse' && cacher()}
        >
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={GAUCHE} x2={largeur - DROITE} y1={HAUT + utileY - y(t)} y2={HAUT + utileY - y(t)} stroke={t === 0 ? COULEUR.axe : COULEUR.grille} />
              <text x={GAUCHE - 8} y={HAUT + utileY - y(t) + 4} textAnchor="end" className="fill-slate text-[11px]">{n(t)}</text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} x={x(t)} y={hauteur - 9} textAnchor="middle" className="fill-slate text-[11px]">{t} €</text>
          ))}

          {classes.map((c, i) => {
            const bx = x(c.de) + 1;
            const bl = Math.max(1, bandes - 2);
            const hL = y(c.limites);
            const hI = y(c.illimites);
            const delai = anime ? i * 0.022 : 0;
            const contenu = (
              <>
                <b className="block font-semibold">{c.de} à {c.a} €</b>
                {n(c.limites)} limités · {n(c.illimites)} illimités
              </>
            );
            return (
              <g key={c.de}>
                {c.limites > 0 && (
                  <motion.rect
                    x={bx}
                    width={bl}
                    y={HAUT + utileY - hL}
                    height={hL}
                    rx={Math.min(2, bl / 3)}
                    fill={COULEUR.azur}
                    style={{ transformBox: 'fill-box', transformOrigin: 'bottom' }}
                    initial={anime ? { scaleY: 0 } : false}
                    animate={vu ? { scaleY: 1 } : undefined}
                    transition={{ duration: 0.8, delay: delai, ease: EASE }}
                  />
                )}
                {c.illimites > 0 && (
                  <motion.rect
                    x={bx}
                    width={bl}
                    y={HAUT + utileY - hL - hI - (c.limites > 0 ? 1.5 : 0)}
                    height={hI}
                    rx={Math.min(2, bl / 3)}
                    fill={COULEUR.signal}
                    initial={anime ? { opacity: 0 } : false}
                    animate={vu ? { opacity: 1 } : undefined}
                    transition={{ duration: 0.5, delay: delai + 0.45 }}
                  />
                )}
                <rect
                  x={x(c.de)}
                  y={HAUT}
                  width={bandes}
                  height={utileY}
                  fill="transparent"
                  onPointerEnter={(e) => montrer(e, contenu, { x: x(c.de) + bandes / 2, y: HAUT + utileY - hL - hI })}
                  onClick={(e) => montrer(e, contenu, { x: x(c.de) + bandes / 2, y: HAUT + utileY - hL - hI })}
                />
              </g>
            );
          })}

          {reperes.map((r, i) => (
            <motion.g
              key={r.libelle}
              className="pointer-events-none"
              initial={anime ? { opacity: 0 } : false}
              animate={vu ? { opacity: 1 } : undefined}
              transition={{ duration: 0.5, delay: anime ? 0.8 + i * 0.12 : 0 }}
            >
              <line x1={x(r.valeur)} x2={x(r.valeur)} y1={r.ligne * 18 + 8} y2={HAUT + utileY} stroke={COULEUR.encre} strokeWidth="1.25" strokeDasharray={r.plein ? undefined : '3 3'} />
              <text
                x={x(r.valeur) + (x(r.valeur) > largeur * 0.62 && largeur < 700 ? -6 : 6)}
                y={r.ligne * 18 + 17}
                textAnchor={x(r.valeur) > largeur * 0.62 && largeur < 700 ? 'end' : 'start'}
                className="fill-marine text-[11.5px] font-semibold"
              >
                {r.libelle}
              </text>
            </motion.g>
          ))}
        </svg>
        <Infobulle bulle={bulle} conteneur={conteneur} />
      </div>
    </div>
  );
}
