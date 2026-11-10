import { motion } from 'framer-motion';
import { COULEUR, useGraphique } from './outils.jsx';
import { EASE } from '../../lib/motion.js';
import { n1 } from '../../lib/format.js';

const R = 72;
const EPAISSEUR = 20;

/**
 * Un anneau à deux parts : la forme part-à-tout la plus lisible quand il n'y a
 * que deux parts. Chaque segment se trace à sa place, séparé de son voisin, et
 * chaque part porte son pourcentage dans la légende : la couleur n'est jamais
 * seule à porter l'information.
 */
export default function Anneau({ parts, centre, sousCentre, empile }) {
  const { ref, anime, vu } = useGraphique({ seuil: 0.4 });
  const total = parts.reduce((s, p) => s + p.value, 0);
  const couleurs = [COULEUR.azur, COULEUR.signal];
  const jour = 0.012; // l'espace entre deux segments, en fraction du tour
  let cumul = 0;

  return (
    <div ref={ref} className={`flex flex-col items-center gap-6 sm:flex-row sm:gap-8 ${empile ? 'lg:flex-col xl:flex-row' : ''}`}>
      <div className="relative h-[190px] w-[190px] shrink-0">
        <svg viewBox="0 0 190 190" className="h-full w-full -rotate-90" role="img" aria-label={parts.map((p) => `${p.label} : ${n1((p.value / total) * 100)} %`).join(', ')}>
          <circle cx="95" cy="95" r={R} fill="none" stroke="rgba(17,58,99,0.06)" strokeWidth={EPAISSEUR} />
          {parts.map((p, i) => {
            const part = p.value / total;
            const debut = cumul;
            cumul += part;
            return (
              <motion.circle
                key={p.label}
                cx="95"
                cy="95"
                r={R}
                fill="none"
                stroke={couleurs[i]}
                strokeWidth={EPAISSEUR}
                style={{ rotate: `${debut * 360}deg`, transformOrigin: '95px 95px' }}
                initial={anime ? { pathLength: 0 } : false}
                animate={vu ? { pathLength: Math.max(0.001, part - jour) } : undefined}
                pathLength={anime ? undefined : Math.max(0.001, part - jour)}
                transition={{ duration: 1.2, delay: anime ? i * 0.5 : 0, ease: EASE }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-[1.7rem] leading-none text-marine tabular">{centre}</span>
          <span className="mt-1 text-[0.74rem] text-slate">{sousCentre}</span>
        </div>
      </div>

      <ul className="grid w-full gap-3">
        {parts.map((p, i) => (
          <li key={p.label} className="flex items-start gap-2.5">
            <i aria-hidden="true" className="mt-[5px] h-[11px] w-[11px] shrink-0 rounded-[3px]" style={{ background: couleurs[i] }} />
            <span className="text-[0.88rem] leading-snug text-slate">
              <strong className="font-semibold text-marine">{p.label} · {n1((p.value / total) * 100)}&nbsp;%</strong>
              <span className="block text-[0.82rem]">{p.note}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
