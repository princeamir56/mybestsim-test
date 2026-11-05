import { useState } from 'react';
import { motion } from 'framer-motion';
import { Infobulle, useGraphique, useInfobulle } from './outils.jsx';
import { eur, n } from '../../lib/format.js';

// Divergent : deux teintes et un milieu neutre, jamais d'arc-en-ciel. Couleurs
// par classes plutôt que continues, pour que deux cases se comparent sans
// plisser les yeux. Chaque paire fond/texte dépasse 4,5:1.
const CLASSES = [
  { max: -10, fond: '#1d5591', texte: '#ffffff', libelle: '−10 % et moins' },
  { max: -5, fond: '#5f9bd6', texte: '#0b2947', libelle: '−10 à −5 %' },
  { max: -1.5, fond: '#bcd5ee', texte: '#0b2947', libelle: '−5 à −1,5 %' },
  { max: 1.5, fond: '#ede8de', texte: '#0b2947', libelle: 'au prix du marché' },
  { max: 5, fond: '#f3cdb6', texte: '#0b2947', libelle: '+1,5 à +5 %' },
  { max: 10, fond: '#e89a6f', texte: '#0b2947', libelle: '+5 à +10 %' },
  { max: Infinity, fond: '#b9542a', texte: '#ffffff', libelle: '+10 % et plus' },
];

const classe = (v) => CLASSES.find((c) => v < c.max) ?? CLASSES[CLASSES.length - 1];
const signe = (v) => {
  const a = Math.round(v);
  if (a === 0) return '0';
  return a > 0 ? `+${a}` : `−${Math.abs(a)}`;
};

/**
 * Fournisseur × palier : où chacun est-il vraiment moins cher que le marché ?
 *
 * Le classement global gomme ce que ce tableau montre : le même fournisseur
 * peut être nettement sous le marché sur un palier et au-dessus sur le suivant.
 * Chaque case porte son écart en chiffres : la couleur n'est jamais seule.
 */
export default function Matrice({ colonnes, marche, lignes }) {
  const { ref, anime, vu } = useGraphique({ seuil: 0.08 });
  const { conteneur, bulle, montrer, cacher } = useInfobulle();
  const [survol, setSurvol] = useState(null);

  return (
    <div ref={ref}>
      <div
        ref={conteneur}
        className="relative"
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') {
            cacher();
            setSurvol(null);
          }
        }}
      >
        <div
          role="table"
          aria-label="Écart de prix de chaque fournisseur à la médiane du marché, par palier de volume, en pourcentage."
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `minmax(74px, 128px) repeat(${colonnes.length}, minmax(0, 1fr))` }}
        >
          <div role="row" className="contents">
            <span role="columnheader" className="sr-only">Fournisseur</span>
            <span aria-hidden="true" />
            {colonnes.map((c, j) => (
              <span
                key={c}
                role="columnheader"
                className={`pb-1.5 text-center text-[0.68rem] leading-tight transition-colors sm:text-[0.76rem] ${survol?.j === j ? 'font-semibold text-marine' : 'text-slate'}`}
              >
                {c}
              </span>
            ))}
          </div>

          {lignes.map((l, i) => (
            <div role="row" key={l.nom} className="contents">
              <span
                role="rowheader"
                className={`flex items-center truncate pr-1.5 text-[0.74rem] transition-colors sm:text-[0.84rem] ${survol?.i === i ? 'font-semibold text-marine' : 'text-slate'}`}
              >
                {l.nom}
              </span>
              {l.cases.map((c, j) => {
                if (!c) {
                  return (
                    <span role="cell" key={colonnes[j]} className="flex h-[30px] items-center justify-center rounded-[4px] bg-marine/[0.04] text-[0.7rem] text-marine/80 sm:h-[34px]">
                      —
                    </span>
                  );
                }
                const k = classe(c.ecart);
                const contenu = (
                  <>
                    <b className="block font-semibold">{l.nom} · {colonnes[j]}</b>
                    Prix médian {eur(c.prix)}, soit {signe(c.ecart)} % par rapport au marché ({eur(marche[j])}), sur {n(c.offres)} offres
                  </>
                );
                const actif = survol?.i === i && survol?.j === j;
                return (
                  <motion.span
                    role="cell"
                    key={colonnes[j]}
                    className={`flex h-[30px] cursor-default items-center justify-center rounded-[4px] text-[0.7rem] font-medium tabular sm:h-[34px] sm:text-[0.78rem] ${actif ? 'ring-2 ring-marine ring-offset-1 ring-offset-[#fbf9f5]' : ''}`}
                    style={{ background: k.fond, color: k.texte }}
                    initial={anime ? { opacity: 0, scale: 0.6 } : false}
                    animate={vu ? { opacity: 1, scale: 1 } : undefined}
                    transition={{ duration: 0.45, delay: anime ? (i + j) * 0.018 : 0 }}
                    onPointerEnter={(e) => {
                      setSurvol({ i, j });
                      const b = e.currentTarget.getBoundingClientRect();
                      const r = conteneur.current.getBoundingClientRect();
                      montrer(e, contenu, { x: b.left - r.left + b.width / 2, y: b.top - r.top });
                    }}
                    onClick={(e) => {
                      setSurvol({ i, j });
                      const b = e.currentTarget.getBoundingClientRect();
                      const r = conteneur.current.getBoundingClientRect();
                      montrer(e, contenu, { x: b.left - r.left + b.width / 2, y: b.top - r.top });
                    }}
                  >
                    {signe(c.ecart)}
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
        <Infobulle bulle={bulle} conteneur={conteneur} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.74rem] text-slate">
        {CLASSES.map((c) => (
          <span key={c.libelle} className="flex items-center gap-1.5">
            <i aria-hidden="true" className="h-[10px] w-[16px] rounded-[2px]" style={{ background: c.fond }} />
            {c.libelle}
          </span>
        ))}
      </div>
    </div>
  );
}
