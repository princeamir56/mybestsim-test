import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE, SPRING } from '../../lib/motion.js';
import { allerEnHaut, useSectionActive } from '../../lib/scroll.js';
import { SOMMAIRE } from '../../data/contenuArticle.js';

const BASE = import.meta.env.BASE_URL;

const LIENS = [
  { id: 'chiffres', label: 'Chiffres' },
  { id: 'decisions', label: 'Décisions' },
  { id: 'fournisseurs', label: 'Fournisseurs' },
  { id: 'valeur', label: 'Valeur' },
  { id: 'data', label: 'Volumes' },
];
const IDS = LIENS.map((l) => l.id);

// Les pages du site, présentes dans l'en-tête quelle que soit la page en cours.
const PAGES = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/automation', label: 'Automation' },
  { to: '/internet-en-croisiere', label: 'Guide croisière' },
];
const PAGES_MENU = [{ to: '/', label: 'Accueil' }, ...PAGES];

/**
 * En-tête fixe.
 *
 * Transparente sur le hero sombre, elle bascule en papier opaque dès que la page
 * a défilé ou que le menu s'ouvre : sinon le texte marine se poserait sur
 * l'abysse et deviendrait illisible. Le lien de la section en cours est marqué,
 * pour qu'on sache toujours où l'on est dans une page longue.
 */
export default function Navbar() {
  const [defile, setDefile] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const { pathname } = useLocation();
  const chemin = pathname.replace(/\/$/, '') || '/';
  const surAccueil = chemin === '/';
  const surArticle = chemin.startsWith('/internet-en-croisiere');
  const active = useSectionActive(surAccueil ? IDS : []);

  useEffect(() => {
    const onScroll = () => setDefile(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Un changement de page referme le menu : sinon il reste ouvert par-dessus la
  // nouvelle vue.
  useEffect(() => setOuvert(false), [pathname]);

  useEffect(() => {
    if (!ouvert) return undefined;
    const surTouche = (e) => e.key === 'Escape' && setOuvert(false);
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [ouvert]);

  // Les deux pages qui s'ouvrent sur un fond sombre gardent un en-tête transparent.
  const surFondSombre = surAccueil || chemin.startsWith('/automation');
  const clair = defile || !surFondSombre || ouvert;
  const fonce = !clair;

  const menuSections = surAccueil
    ? LIENS.map((l) => [`#${l.id}`, l.label])
    : surArticle
      ? SOMMAIRE
      : [];

  // Sur l'accueil, les ancres ne tiennent à côté des pages qu'à partir de `xl` :
  // entre `lg` et `xl`, elles restent accessibles par le menu.
  const masqueMenu = surAccueil ? 'xl:hidden' : 'lg:hidden';

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-soft ${
          ouvert ? 'border-b border-marine/10 bg-porcelain' : clair ? 'border-b border-marine/10 bg-porcelain/95 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <div className="shell flex h-[68px] items-center gap-5">
          <Link to="/" onClick={() => surAccueil && allerEnHaut()} className="group flex items-center gap-2.5" aria-label="MyBestSim, retour à l'accueil">
            <img
              src={`${BASE}marque/oiseau-96.webp`}
              alt=""
              width="40"
              height="40"
              className="h-10 w-10 transition-transform duration-500 ease-soft group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]"
            />
            <span
              className={`font-display text-[1.12rem] tracking-[-0.01em] transition-colors duration-500 ${
                fonce ? 'text-porcelain' : 'text-marine'
              }`}
            >
              My<span className={fonce ? 'text-signal-light' : 'text-signal-fonce'}>Best</span>Sim
            </span>
          </Link>

          <nav aria-label="Navigation principale" className="ml-auto hidden items-center gap-7 lg:flex">
            {surAccueil ? (
              <div className="hidden items-center gap-7 xl:flex">
                {LIENS.map((l) => {
                  const courant = active === l.id;
                  return (
                    <a
                      key={l.id}
                      href={`#${l.id}`}
                      aria-current={courant ? 'true' : undefined}
                      className={`relative py-2 font-mono text-[0.72rem] uppercase tracking-[0.12em] transition-colors duration-300 after:absolute after:bottom-0.5 after:left-0 after:h-px after:bg-signal after:transition-all after:duration-300 hover:after:w-full ${
                        courant ? 'after:w-full' : 'after:w-0'
                      } ${
                        fonce
                          ? 'text-porcelain/80 hover:text-porcelain'
                          : courant
                            ? 'text-marine'
                            : 'text-marine/80 hover:text-marine'
                      }`}
                    >
                      {l.label}
                    </a>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              {(surAccueil ? PAGES : PAGES_MENU).map((p) => {
                const courante = chemin === p.to;
                const teinte = courante
                  ? fonce
                    ? 'border-porcelain bg-porcelain text-marine'
                    : 'border-marine bg-marine text-porcelain'
                  : fonce
                    ? 'border-porcelain/30 text-porcelain hover:border-porcelain/70 hover:bg-porcelain/10'
                    : 'border-marine/25 text-marine hover:border-signal hover:text-signal-fonce';
                return (
                  <Link
                    key={p.to}
                    to={p.to}
                    aria-current={courante ? 'page' : undefined}
                    className={`whitespace-nowrap rounded-full border px-4 py-2.5 font-mono text-[0.7rem] uppercase tracking-[0.12em] transition-all duration-300 ${teinte}`}
                  >
                    {p.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <button
            type="button"
            onClick={() => setOuvert((v) => !v)}
            aria-label={ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={ouvert}
            aria-controls="menu-mobile"
            className={`ml-auto flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] rounded-full border transition-colors duration-300 lg:ml-0 ${masqueMenu} ${
              fonce ? 'border-porcelain/30' : 'border-marine/20'
            }`}
          >
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                animate={ouvert ? { rotate: i === 0 ? 45 : -45, y: i === 0 ? 3.25 : -3.25 } : { rotate: 0, y: 0 }}
                transition={SPRING.snappy}
                className={`block h-[1.5px] w-[18px] origin-center transition-colors duration-300 ${
                  fonce ? 'bg-porcelain' : 'bg-marine'
                }`}
              />
            ))}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {ouvert && (
          <>
            {/* Toucher en dehors referme : le menu ne doit jamais piéger. */}
            <motion.button
              type="button"
              aria-label="Fermer le menu"
              tabIndex={-1}
              onClick={() => setOuvert(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`fixed inset-0 top-[68px] z-30 bg-abysse/40 ${masqueMenu}`}
            />
            <motion.div
              id="menu-mobile"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={`fixed inset-x-0 top-[68px] z-40 max-h-[calc(100dvh-68px)] overflow-y-auto border-b border-marine/10 bg-porcelain ${masqueMenu}`}
              data-lenis-prevent
            >
              <nav aria-label="Navigation mobile" className="shell grid grid-cols-2 gap-2 pb-2 pt-4">
                {PAGES_MENU.map((p) => {
                  const courante = chemin === p.to;
                  return (
                    <Link
                      key={p.to}
                      to={p.to}
                      aria-current={courante ? 'page' : undefined}
                      onClick={() => setOuvert(false)}
                      className={`flex min-h-[48px] items-center justify-center rounded-full border px-3 text-center font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors duration-200 ${
                        courante ? 'border-marine bg-marine text-porcelain' : 'border-marine/25 text-marine'
                      }`}
                    >
                      {p.label}
                    </Link>
                  );
                })}
              </nav>
              {menuSections.length ? (
                <nav aria-label="Sections de la page" className="shell flex flex-col pb-3">
                  {menuSections.map(([href, label], i) => (
                    <motion.a
                      key={href}
                      href={href}
                      onClick={() => setOuvert(false)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i, duration: 0.3 }}
                      className="flex min-h-[48px] items-center border-b border-marine/[0.08] text-[0.95rem] text-marine last:border-b-0"
                    >
                      {label}
                    </motion.a>
                  ))}
                </nav>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
