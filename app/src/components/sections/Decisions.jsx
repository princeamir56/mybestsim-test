import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mot } from '../../lib/format.js';
import { AnimatePresence, motion } from 'framer-motion';
import Reveal from '../ui/Reveal.jsx';
import { LineReveal } from '../ui/SplitText.jsx';
import { EASE } from '../../lib/motion.js';
import { EST_SERVEUR } from '../../lib/ssr.js';
import { allerA } from '../../lib/scroll.js';
import data from '../../data/catalogue.json';

/**
 * Le panneau « Décisions & qualité des données ».
 *
 * C'est la pièce qui porte la candidature, donc elle est traitée comme une
 * section à part entière et non comme une note de bas de page : surface
 * inversée, pleine largeur, juste après les chiffres qu'elle explique.
 *
 * L'ouvert/fermé est piloté depuis le parent, parce que les repères D1…D4 des
 * tuiles de KPI doivent pouvoir ouvrir la bonne décision et y faire défiler.
 */
export default function Decisions({ ouverte, setOuverte, demande }) {
  const refs = useRef({});

  // Une tuile de KPI a demandé une décision : on l'amène à l'écran. Déclenché par
  // cette demande seulement, jamais au montage (D1 est ouverte par défaut : la
  // page s'auto-défilait dès le chargement) ni par un clic sur l'accordéon, qui
  // n'a pas à déplacer ce qu'on est en train de lire.
  useEffect(() => {
    if (!demande || !ouverte) return undefined;
    const el = refs.current[ouverte];
    const t = setTimeout(() => el && allerA(el, -110), 90);
    return () => clearTimeout(t);
  }, [demande]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ouvrir une décision ferme la précédente : si celle-ci était au-dessus, la
  // question cliquée remonte et peut sortir de l'écran. On la ramène alors.
  const basculer = (id) => {
    const suivante = ouverte === id ? null : id;
    setOuverte(suivante);
    if (!suivante) return;
    setTimeout(() => {
      const el = refs.current[id];
      if (el && el.getBoundingClientRect().top < 76) allerA(el, -96);
    }, 480);
  };

  return (
    <section id="decisions" className="relative scroll-mt-24 overflow-hidden bg-abysse py-20 text-porcelain lg:py-28">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[12%] top-[8%] h-[420px] w-[420px] rounded-full bg-azur/10 blur-[110px]"
      />

      <div className="shell relative">
        <header className="mb-12 max-w-[72ch]">
          <Reveal>
            <span className="inline-flex items-center gap-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-signal-light">
              <span className="inline-block h-px w-8 bg-signal/60" />
              02 · La partie qui compte
            </span>
          </Reveal>
          <h2 className="h-section mt-5 text-porcelain">
            <LineReveal text={'Décisions &\nqualité des données'} />
          </h2>
          <Reveal delay={0.12}>
            <p className="mt-6 text-[1.02rem] leading-[1.75] text-porcelain/60 md:text-[1.1rem]">
              {Mot(data.decisions.length)} ambiguïtés réelles existent dans ce catalogue. Aucune n'a
              de réponse
              objectivement juste : chacune est un choix, et chaque choix déplace les
              chiffres ci-dessus. Les voici, avec leur justification et surtout{' '}
              <span className="text-porcelain">
                ce que le chiffre aurait valu avec l'autre option
              </span>
              .
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <Link
              to="/automation"
              className="btn mt-7 border border-porcelain/25 text-porcelain hover:border-porcelain/60 hover:bg-porcelain/10"
            >
              Voir le workflow automatisé
              <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </header>

        <div className="divide-y divide-porcelain/12 border-y border-porcelain/12">
          {data.decisions.map((d, i) => (
            <Decision
              key={d.id}
              d={d}
              index={i}
              // Au prérendu, les quatre sont ouvertes : sinon le HTML servi ne
              // contiendrait qu'un seul des quatre contrefactuels, et le
              // panneau qui porte toute la démonstration serait amputé pour un
              // robot comme pour un visiteur sans JavaScript.
              ouvert={EST_SERVEUR || ouverte === d.id}
              onToggle={() => basculer(d.id)}
              innerRef={(el) => {
                refs.current[d.id] = el;
              }}
            />
          ))}
        </div>

        {/* Les pièges : le constat brut qui a précédé les décisions. */}
        <div className="mt-16">
          <Reveal>
            <h3 className="font-display text-[1.5rem] font-light text-porcelain">
              {Mot(data.pieges.length)} pièges tendus par ces données
            </h3>
            <p className="mt-3 max-w-[68ch] text-[0.95rem] text-porcelain/60">
              Constatés au profilage, avant tout calcul. Chacun fausse silencieusement un
              chiffre du brief si on ne l'a pas vu.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {data.pieges.map((p, i) => (
              <Reveal key={p.titre} delay={i * 0.07}>
                <article className="h-full rounded-[1.2rem] border border-porcelain/12 bg-porcelain/[0.04] p-6 transition-colors duration-500 hover:border-porcelain/25 hover:bg-porcelain/[0.07]">
                  <h4 className="flex items-start gap-2.5 font-display text-[1.05rem] font-normal leading-snug text-porcelain">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                    {p.titre}
                  </h4>
                  <p
                    className="mt-3 pl-[18px] text-[0.86rem] leading-relaxed text-porcelain/60 [&_code]:rounded [&_code]:bg-porcelain/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_strong]:text-porcelain"
                    dangerouslySetInnerHTML={{ __html: p.texte }}
                  />
                </article>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Les limites : ce que le jeu de données ne permet pas de dire. */}
        <Reveal delay={0.1}>
          <div className="mt-14 rounded-[1.2rem] border border-signal/25 bg-signal/[0.06] p-6 sm:p-8">
            <h3 className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-signal-light">
              Ce que ce tableau de bord ne peut pas dire
            </h3>
            <ul className="mt-5 space-y-3.5">
              {data.limites.map((l) => (
                <li
                  key={l.slice(0, 40)}
                  className="flex gap-3 text-[0.9rem] leading-relaxed text-porcelain/60 [&_strong]:text-porcelain"
                >
                  <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-signal/70" />
                  <span dangerouslySetInnerHTML={{ __html: l }} />
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Decision({ d, index, ouvert, onToggle, innerRef }) {
  return (
    <div ref={innerRef} className="scroll-mt-28">
      <Reveal delay={index * 0.05}>
        <h3>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={ouvert}
            className="group flex w-full items-start gap-4 py-6 text-left sm:gap-6"
          >
            <span
              className={`mt-0.5 shrink-0 rounded-md px-2 py-1 font-mono text-[0.68rem] font-semibold transition-colors duration-300 ${
                ouvert ? 'bg-signal-fonce text-white' : 'bg-porcelain/10 text-signal-light'
              }`}
            >
              {d.id}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-display text-[1.15rem] font-normal leading-snug text-porcelain transition-colors duration-300 group-hover:text-signal-light sm:text-[1.3rem]">
                {d.question}
              </span>
              <span className="mt-2 block text-[0.86rem] text-porcelain/60">
                Retenu : <b className="font-semibold text-porcelain/85">{d.retenu}</b>
              </span>
            </span>

            <motion.span
              aria-hidden="true"
              animate={{ rotate: ouvert ? 90 : 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-1 shrink-0 text-porcelain/60 transition-colors group-hover:text-signal-light"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </motion.span>
          </button>
        </h3>
      </Reveal>

      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 pb-9 sm:grid-cols-2 sm:pl-[68px]">
              <div>
                <p className="label-muted !text-porcelain/60">Pourquoi ce choix</p>
                <p
                  className="mt-3 text-[0.92rem] leading-relaxed text-porcelain/60 [&_em]:not-italic [&_em]:text-porcelain [&_strong]:text-porcelain"
                  dangerouslySetInnerHTML={{ __html: d.pourquoi }}
                />
              </div>
              <div className="rounded-xl border border-signal/35 bg-porcelain/[0.05] p-5">
                <p className="label-muted !text-signal-light">Si l'autre option avait été retenue</p>
                <p
                  className="mt-3 text-[0.92rem] leading-relaxed text-porcelain/60 [&_strong]:text-porcelain"
                  dangerouslySetInnerHTML={{ __html: d.alternative }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
