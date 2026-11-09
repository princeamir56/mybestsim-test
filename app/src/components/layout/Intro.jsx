import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE, useIsDesktop, useReducedMotion } from '../../lib/motion.js';
import { INTRO_A_JOUER, LEVER, dureeScene, marquerVue } from '../../lib/intro.js';
import { obtenirLenis } from '../../lib/scroll.js';

const BASE = import.meta.env.BASE_URL;
const MOT = [...'MyBestSim'];
const EST_BEST = (i) => i >= 2 && i <= 5;

// Une épaule par aile, dans la toile commune des trois pièces du logo. C'est le
// point de rotation : sans lui, l'aile tournerait autour de son propre centre
// au lieu de battre.
const EPAULE_G = '36% 42%';
const EPAULE_D = '74% 42%';

/**
 * La scène d'ouverture : l'oiseau s'assemble et bat des ailes sur un rideau
 * sombre, le mot s'écrit lettre par lettre, puis le rideau se lève d'un bloc sur
 * le site déjà en place.
 *
 * Le corps et les ailes sont trois pièces découpées dans le logo lui-même. Le
 * rideau n'existe jamais au prérendu : sans JavaScript, la page est directement
 * lisible, et le robot d'indexation ne voit qu'elle.
 */
export default function Intro() {
  const [visible, setVisible] = useState(INTRO_A_JOUER);
  const [monte, setMonte] = useState(INTRO_A_JOUER);
  const reduced = useReducedMotion();
  const bureau = useIsDesktop();
  const anime = !reduced;
  // Moins de trajet au doigt : une pièce qui traverse un écran de 6" ne fait
  // que traîner.
  const trajet = bureau ? 1 : 0.6;

  useEffect(() => {
    if (!visible) return undefined;
    const racine = document.documentElement;
    racine.classList.add('intro-bloque');
    window.scrollTo(0, 0);

    const t = setTimeout(() => {
      marquerVue();
      setVisible(false);
      racine.classList.remove('intro-bloque');
      obtenirLenis()?.start();
    }, dureeScene() * 1000);

    return () => {
      clearTimeout(t);
      racine.classList.remove('intro-bloque');
    };
  }, [visible]);

  // Le rideau couvre tout le site : son retrait n'est jamais confié à la seule
  // fin d'animation. Une feuille invisible restée par-dessus avalerait tous les
  // clics, et le site paraîtrait figé.
  useEffect(() => {
    if (visible || !monte) return undefined;
    const t = setTimeout(() => setMonte(false), LEVER * 1000 + 300);
    return () => clearTimeout(t);
  }, [visible, monte]);

  if (!monte) return null;

  return (
    <div className={visible ? 'contents' : 'contents pointer-events-none'} aria-hidden={visible ? undefined : true}>
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-abysse"
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: LEVER, ease: [0.76, 0, 0.24, 1] }}
            role="status"
            aria-label="MyBestSim"
          >
            {anime && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute h-[70vmin] w-[70vmin] rounded-full border border-ciel/40"
                    initial={{ scale: 0.25, opacity: 0 }}
                    animate={{ scale: [0.25, 1.35], opacity: [0, 0.55, 0] }}
                    transition={{ duration: 1.7, delay: 0.25 + i * 0.32, ease: 'easeOut' }}
                  />
                ))}
              </div>
            )}

            <div className="relative h-[clamp(132px,34vw,184px)] w-[clamp(132px,34vw,184px)]">
              <motion.img
                src={`${BASE}marque/aile-g.webp`}
                alt=""
                decoding="sync"
                className="absolute inset-0 h-full w-full"
                style={{ transformOrigin: EPAULE_G }}
                initial={anime ? { rotate: 62, opacity: 0, x: 26 * trajet } : false}
                animate={anime ? { rotate: [62, 0, -24, 8, -16, 0], opacity: 1, x: 0 } : undefined}
                transition={{
                  rotate: { duration: 1.25, delay: 0.32, times: [0, 0.3, 0.48, 0.66, 0.84, 1], ease: 'easeInOut' },
                  x: { duration: 0.5, delay: 0.32, ease: EASE },
                  opacity: { duration: 0.2, delay: 0.32 },
                }}
              />
              <motion.img
                src={`${BASE}marque/aile-d.webp`}
                alt=""
                decoding="sync"
                className="absolute inset-0 h-full w-full"
                style={{ transformOrigin: EPAULE_D }}
                initial={anime ? { rotate: -62, opacity: 0, x: -26 * trajet } : false}
                animate={anime ? { rotate: [-62, 0, 24, -8, 16, 0], opacity: 1, x: 0 } : undefined}
                transition={{
                  rotate: { duration: 1.25, delay: 0.32, times: [0, 0.3, 0.48, 0.66, 0.84, 1], ease: 'easeInOut' },
                  x: { duration: 0.5, delay: 0.32, ease: EASE },
                  opacity: { duration: 0.2, delay: 0.32 },
                }}
              />
              <motion.img
                src={`${BASE}marque/corps.webp`}
                alt=""
                decoding="sync"
                className="absolute inset-0 h-full w-full"
                initial={anime ? { y: 150 * trajet, scale: 0.45, opacity: 0 } : false}
                animate={anime ? { y: [150 * trajet, -10, 4, -6, 0], scale: 1, opacity: 1 } : undefined}
                transition={{
                  y: { duration: 1.5, times: [0, 0.34, 0.56, 0.78, 1], ease: 'easeOut' },
                  scale: { duration: 0.6, ease: EASE },
                  opacity: { duration: 0.2 },
                }}
              />
            </div>

            <p aria-hidden="true" className="relative mt-5 flex font-display text-[clamp(2rem,6.5vw,3.1rem)] leading-none tracking-[-0.01em] text-porcelain">
              {MOT.map((lettre, i) => (
                <motion.span
                  key={`${lettre}-${i}`}
                  className={EST_BEST(i) ? 'text-signal-light' : ''}
                  initial={anime ? { y: (i % 2 ? 1 : -1) * 30 * trajet, opacity: 0, rotate: (i % 2 ? 1 : -1) * 12 } : false}
                  animate={anime ? { y: 0, opacity: 1, rotate: 0 } : undefined}
                  transition={{ duration: 0.75, delay: 0.72 + i * 0.055, ease: EASE }}
                >
                  {lettre}
                </motion.span>
              ))}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
