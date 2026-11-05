import { motion } from 'framer-motion';
import { COULEUR, graduations, useGraphique } from './outils.jsx';
import { EASE } from '../../lib/motion.js';
import { eur } from '../../lib/format.js';

/**
 * Le moins cher et le plus cher pour un même produit, sur une échelle commune.
 *
 * La longueur du trait EST l'économie réalisée en comparant : le trait se tend
 * du premier point vers le second pour le montrer. L'échelle partagée permet de
 * comparer les lignes entre elles, ce que des pastilles isolées ne permettaient
 * pas. Rendu en HTML : les positions en % suivent la largeur sans recalcul.
 */
export default function Haltere({ rows }) {
  const { ref, anime, vu } = useGraphique({ seuil: 0.2 });
  const minV = Math.min(...rows.map((r) => r.min));
  const maxV = Math.max(...rows.map((r) => r.max));
  // De la marge de chaque côté : les prix s'écrivent à l'extérieur des points.
  const bas = Math.floor((minV * 0.76) / 10) * 10;
  const haut = Math.ceil((maxV * 1.2) / 10) * 10;
  const pc = (v) => ((v - bas) / (haut - bas)) * 100;
  const ticks = graduations(bas, haut, 4);

  return (
    <div ref={ref}>
      <div className="relative mb-2 h-5 lg:ml-[266px] lg:mr-[98px]">
        {ticks.map((t) => (
          <span key={t} className="absolute -translate-x-1/2 whitespace-nowrap text-[0.72rem] text-slate tabular" style={{ left: `${pc(t)}%` }}>
            {t} €
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-1">
        {rows.map((r, i) => {
          const delai = anime ? i * 0.09 : 0;
          return (
            <li key={r.libelle} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-lg px-0 py-2 transition-colors hover:bg-marine/[0.03] lg:grid-cols-[250px_1fr_82px]">
              <span className="text-[0.86rem] font-medium leading-snug text-marine">{r.libelle}</span>
              <div className="relative order-3 col-span-2 h-[30px] lg:order-none lg:col-span-1">
                {ticks.map((t) => (
                  <span key={t} aria-hidden="true" className="absolute bottom-0 top-0 w-px" style={{ left: `${pc(t)}%`, background: COULEUR.grille }} />
                ))}
                <span className="absolute top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap pr-3.5 text-[0.76rem] text-slate tabular" style={{ left: `${pc(r.min)}%` }}>
                  {eur(r.min)}
                </span>
                <span className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-3.5 text-[0.76rem] text-slate tabular" style={{ left: `${pc(r.max)}%` }}>
                  {eur(r.max)}
                </span>
                <motion.span
                  aria-hidden="true"
                  className="absolute top-1/2 -mt-[1.5px] h-[3px] origin-left rounded-full"
                  style={{ left: `${pc(r.min)}%`, width: `${pc(r.max) - pc(r.min)}%`, background: COULEUR.signal, opacity: 0.55 }}
                  initial={anime ? { scaleX: 0 } : false}
                  animate={vu ? { scaleX: 1 } : undefined}
                  transition={{ duration: 1, delay: delai + 0.2, ease: EASE }}
                />
                <motion.span
                  className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#fbf9f5]"
                  style={{ left: `${pc(r.min)}%`, background: COULEUR.azur, x: '-50%', y: '-50%' }}
                  title={`Le moins cher : ${eur(r.min)}`}
                  initial={anime ? { scale: 0 } : false}
                  animate={vu ? { scale: 1 } : undefined}
                  transition={{ type: 'spring', stiffness: 320, damping: 20, delay: delai }}
                />
                <motion.span
                  className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-[#fbf9f5]"
                  style={{ left: `${pc(r.max)}%`, background: COULEUR.signal, x: '-50%', y: '-50%' }}
                  title={`Le plus cher : ${eur(r.max)}`}
                  initial={anime ? { scale: 0 } : false}
                  animate={vu ? { scale: 1 } : undefined}
                  transition={{ type: 'spring', stiffness: 320, damping: 20, delay: delai + 0.95 }}
                />
              </div>
              <span className="text-right text-[0.86rem] font-semibold text-marine tabular">+{eur(r.eur)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
