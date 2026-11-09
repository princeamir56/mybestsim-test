import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useReducedMotion } from '../../lib/motion.js';
import { BUREAU, NOEUDS, SCENARIOS, TELEPHONE } from '../../data/automatisation.js';

const TRAJET = 520; // le paquet sur une flèche
const PAUSE = 1000; // le temps de lire l'étape
const PAUSE_FIN = 2600; // avant que le scénario ne reparte

const EPAISSEUR_PAQUET = { largeur: 48, hauteur: 20 };

/* ------------------------------------------------------------- géométrie --- */

function tracer(points, rayon = 9) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const l1 = Math.hypot(x - px, y - py);
    const l2 = Math.hypot(nx - x, ny - y);
    const r = Math.min(rayon, l1 / 2, l2 / 2);
    d += ` L${x - ((x - px) / l1) * r} ${y - ((y - py) / l1) * r}`;
    d += ` Q${x} ${y} ${x + ((nx - x) / l2) * r} ${y + ((ny - y) / l2) * r}`;
  }
  const [fx, fy] = points[points.length - 1];
  return `${d} L${fx} ${fy}`;
}

function pointe(points, taille = 7) {
  const [ax, ay] = points[points.length - 2];
  const [bx, by] = points[points.length - 1];
  const l = Math.hypot(bx - ax, by - ay) || 1;
  const [ux, uy] = [(bx - ax) / l, (by - ay) / l];
  const base = [bx - ux * taille, by - uy * taille];
  return `${bx},${by} ${base[0] - uy * 4.5},${base[1] + ux * 4.5} ${base[0] + uy * 4.5},${base[1] - ux * 4.5}`;
}

function jalons(points) {
  const longueurs = [0];
  for (let i = 1; i < points.length; i += 1) {
    longueurs.push(longueurs[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = longueurs[longueurs.length - 1] || 1;
  return longueurs.map((l) => l / total);
}

/* ---------------------------------------------------------------- icônes --- */

const TRACES = {
  horloge: <><circle cx="8" cy="8" r="6.2" /><path d="M8 4.5V8l2.5 1.6" /></>,
  fichier: <><path d="M4 1.5h5l3 3v10H4z" /><path d="M9 1.5v3h3M6 8.5h4M6 11h4" /></>,
  lecture: <path d="M5 3l8 5-8 5z" />,
  branche: <><circle cx="4" cy="3.5" r="1.6" /><circle cx="4" cy="12.5" r="1.6" /><circle cx="12" cy="5" r="1.6" /><path d="M4 5.1v5.8M12 6.6c0 3-4.6 2.6-8 4.3" /></>,
  entonnoir: <path d="M2 3h12L9.5 8.5V13l-3 1V8.5z" />,
  cube: <><path d="M8 1.5l6 3.2v6.6l-6 3.2-6-3.2V4.7z" /><path d="M2 4.7L8 8l6-3.3M8 8v6.5" /></>,
  bouclier: <><path d="M8 1.5l5.5 2v4.2c0 3.4-2.3 5.6-5.5 6.8-3.2-1.2-5.5-3.4-5.5-6.8V3.5z" /><path d="M5.7 8l1.7 1.7 3-3.2" /></>,
  texte: <path d="M2.5 4h11M2.5 8h11M2.5 12h6.5" />,
  losange: <><path d="M8 1.5L14.5 8 8 14.5 1.5 8z" /><path d="M8 5.2v3.6M8 11v.1" /></>,
  commit: <><circle cx="8" cy="8" r="2.6" /><path d="M1 8h4.4M10.6 8H15" /></>,
  triangle: <path d="M8 2.5l6.5 11h-13z" />,
  ecran: <><rect x="1.5" y="2.5" width="13" height="9" rx="1.5" /><path d="M5.5 14.5h5M8 11.5v3" /></>,
  croix: <><circle cx="8" cy="8" r="6.2" /><path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" /></>,
  coche: <path d="M3 8.5l3.2 3.2L13 4.8" />,
  pause: <path d="M5.5 3v10M10.5 3v10" />,
  precedent: <path d="M10 3L5 8l5 5" />,
  suivant: <path d="M6 3l5 5-5 5" />,
  rejouer: <><path d="M3 8a5 5 0 1 0 1.6-3.7" /><path d="M2.8 2.5v2.6h2.6" /></>,
};

function Icone({ nom, taille = 16 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width={taille} height={taille} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {TRACES[nom]}
    </svg>
  );
}

/* ---------------------------------------------------------------- flèches --- */

function Fleche({ points, etat, erreur, boucle }) {
  const allumee = etat === 'allumee';
  const couleur = erreur
    ? allumee ? 'text-signal-light' : 'text-signal-light/25'
    : allumee ? 'text-ciel' : 'text-ciel/30';
  const d = tracer(points);
  return (
    <g className={`transition-colors duration-200 ${couleur}`}>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={allumee ? 2 : 1.25}
        strokeDasharray={boucle || (erreur && !allumee) ? '5 7' : undefined}
        className={boucle ? 'auto-boucle' : undefined}
        vectorEffect="non-scaling-stroke"
      />
      {allumee ? (
        <path d={d} fill="none" stroke="#f7f3ec" strokeOpacity="0.8" strokeWidth="2" strokeDasharray="2 12" strokeLinecap="round" className="auto-flux" vectorEffect="non-scaling-stroke" />
      ) : null}
      <polygon points={pointe(points)} fill="currentColor" />
    </g>
  );
}

/* ----------------------------------------------------------------- nœuds --- */

function Noeud({ id, cadre, W, H, etat, selectionne, surChoisir, compact }) {
  const n = NOEUDS[id];
  const [x, y, l, h] = cadre;
  const surface = {
    repos: 'border-ciel/20 bg-[#0a1c38]',
    actif: 'border-ciel bg-[#10305a] shadow-[0_0_0_3px_rgba(107,168,224,0.22),0_0_34px_rgba(31,111,178,0.55)]',
    fait: 'border-ciel/60 bg-[#0d2545]',
    echec: 'border-signal-light bg-[#3a2018] shadow-[0_0_0_3px_rgba(232,154,111,0.2),0_0_30px_rgba(210,105,58,0.4)]',
  }[etat];
  const accent = etat === 'echec' ? 'text-signal-light' : etat === 'repos' ? 'text-ciel/80' : 'text-ciel';
  return (
    <button
      type="button"
      onClick={() => surChoisir(id)}
      aria-pressed={selectionne}
      aria-label={`${n.titre} : ${n.sousCourt ?? n.sous}. Afficher le détail.`}
      style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, width: `${(l / W) * 100}%`, height: `${(h / H) * 100}%` }}
      className={`absolute flex flex-col justify-center rounded-xl border px-3 py-2 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:border-ciel/70 ${surface} ${selectionne ? 'outline outline-2 outline-offset-2 outline-porcelain/70' : ''}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-2 ${accent}`}>
          <Icone nom={n.icone} />
          {n.enLigne ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ciel/15 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ciel">
              <span className="h-1.5 w-1.5 rounded-full bg-ciel motion-safe:animate-pulse" />
              En ligne
            </span>
          ) : null}
        </span>
        {etat === 'fait' ? <span className="text-ciel"><Icone nom="coche" taille={13} /></span> : null}
      </span>
      <span className="mt-1.5 block text-[0.86rem] font-semibold leading-tight text-porcelain">{n.titre}</span>
      <span className="mt-1 block text-[0.71rem] leading-snug text-porcelain/75">{compact ? n.sousCourt ?? n.sous : n.sous}</span>
    </button>
  );
}

/* ----------------------------------------------------------------- scène --- */

function Scene({ plan, etats, aretes, selection, surChoisir, refScene, refPaquet, compact, style, className }) {
  const { W, H, noeuds, cadre, puces, etiquettes } = plan;
  const pc = (v, t) => `${(v / t) * 100}%`;
  return (
    <div ref={refScene} className={`relative ${className}`} style={style}>
      <div
        className="absolute rounded-[1.1rem] border border-dashed border-ciel/25 bg-ciel/[0.035]"
        style={{ left: pc(cadre[0], W), top: pc(cadre[1], H), width: pc(cadre[2], W), height: pc(cadre[3], H) }}
      >
        <p className="absolute left-3 top-2.5 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ciel">
          GitHub Actions{compact ? '' : ' · runner ubuntu-latest'}
        </p>
      </div>

      <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {Object.entries(plan.aretes).map(([id, points]) => (
          <Fleche key={id} points={points} etat={aretes[id] ?? 'repos'} erreur={id.endsWith('>stop')} boucle={id === 'boucle'} />
        ))}
      </svg>

      {Object.entries(puces).map(([id, [x, y, l]]) => (
        <p
          key={id}
          className={`absolute rounded-md border px-1 py-1.5 text-center font-mono text-[0.62rem] leading-none transition-colors duration-200 ${
            etats[id] === 'repos' ? 'border-ciel/15 text-porcelain/75' : 'border-ciel/50 text-ciel'
          }`}
          style={{ left: pc(x, W), top: pc(y, H), width: pc(l, W) }}
        >
          {NOEUDS[id].puce}
        </p>
      ))}

      {etiquettes.map(([x, y, texte]) => (
        <span key={texte} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#001025] px-2 py-0.5 font-mono text-[0.62rem] text-ciel" style={{ left: pc(x, W), top: pc(y, H) }}>
          {texte}
        </span>
      ))}

      {Object.entries(noeuds).map(([id, c]) => (
        <Noeud key={id} id={id} cadre={c} W={W} H={H} etat={etats[id]} selectionne={selection === id} surChoisir={surChoisir} compact={compact} />
      ))}

      <span
        ref={refPaquet}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 flex items-center justify-center rounded-full bg-porcelain font-mono text-[0.62rem] font-semibold text-marine-deep opacity-0 shadow-[0_0_16px_rgba(247,243,236,0.75)]"
        style={{ width: EPAISSEUR_PAQUET.largeur, height: EPAISSEUR_PAQUET.hauteur, marginLeft: -EPAISSEUR_PAQUET.largeur / 2, marginTop: -EPAISSEUR_PAQUET.hauteur / 2 }}
      />
    </div>
  );
}

/* ------------------------------------------------------------ le diagramme --- */

function Bouton({ etiquette, icone, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={etiquette}
      title={etiquette}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-ciel/30 text-porcelain transition-colors duration-150 hover:border-ciel hover:bg-ciel/10 disabled:opacity-40"
    >
      <Icone nom={icone} />
    </button>
  );
}

export default function Diagramme() {
  const reduit = useReducedMotion();
  const { ref: refVue, inView } = useInView({ threshold: 0.12 });

  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [etape, setEtape] = useState(0);
  const [lecture, setLecture] = useState(true);
  const [selection, setSelection] = useState(null);
  const [arrivee, setArrivee] = useState(null);

  const sceneBureau = useRef(null);
  const sceneTel = useRef(null);
  const paquetBureau = useRef(null);
  const paquetTel = useRef(null);
  const journal = useRef(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  const etapes = scenario.etapes;
  const courante = etapes[etape];
  const derniere = etape === etapes.length - 1;
  const enLecture = lecture && !reduit && inView;
  const cle = `${scenarioId}:${etape}`;
  const arrive = !enLecture || arrivee === cle || !courante.arete;

  useEffect(() => {
    if (!enLecture) return undefined;
    const trajet = courante.arete ? TRAJET : 0;
    const animations = [];

    if (courante.arete) {
      const bureauVisible = sceneBureau.current?.offsetWidth > 0;
      const [scene, paquet, plan] = bureauVisible
        ? [sceneBureau.current, paquetBureau.current, BUREAU]
        : [sceneTel.current, paquetTel.current, TELEPHONE];
      const points = plan.aretes[courante.arete];
      if (scene && paquet && points) {
        const { width, height } = scene.getBoundingClientRect();
        const offsets = jalons(points);
        paquet.textContent = courante.paquet;
        animations.push(
          paquet.animate(
            points.map(([x, y], i) => ({ transform: `translate(${(x / plan.W) * width}px, ${(y / plan.H) * height}px)`, offset: offsets[i] })),
            { duration: TRAJET, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' }
          ),
          paquet.animate({ opacity: [0, 1, 1, 0], offset: [0, 0.12, 0.88, 1] }, { duration: TRAJET, fill: 'forwards' })
        );
      }
    }

    const t1 = setTimeout(() => setArrivee(cle), trajet);
    const t2 = setTimeout(() => setEtape(derniere ? 0 : etape + 1), trajet + (derniere ? PAUSE_FIN : PAUSE));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      animations.forEach((a) => a.cancel());
    };
  }, [enLecture, cle]); // eslint-disable-line react-hooks/exhaustive-deps

  // Le journal défile dans son propre cadre : jamais la page.
  useEffect(() => {
    if (journal.current) journal.current.scrollTop = journal.current.scrollHeight;
  }, [cle]);

  /* -------------------------- ce qui est allumé à l'étape en cours -------- */
  const etats = Object.fromEntries(Object.keys(NOEUDS).map((id) => [id, 'repos']));
  const aretes = {};
  etapes.slice(0, etape + 1).forEach((e, i) => {
    const passee = i < etape;
    if (passee || arrive) etats[e.noeud] = e.echec ? 'echec' : passee ? 'fait' : 'actif';
    if (e.arete) aretes[e.arete] = 'allumee';
  });

  const lignesJournal = etapes.slice(0, etape + 1).filter((e, i) => i < etape || arrive).flatMap((e) => e.log);

  const choisirScenario = (id) => {
    setScenarioId(id);
    setEtape(0);
    setSelection(null);
    setLecture(true);
  };
  const aller = (i) => {
    setLecture(false);
    setSelection(null);
    setEtape(Math.max(0, Math.min(etapes.length - 1, i)));
  };
  const surChoisir = (id) => {
    setLecture(false);
    setSelection(id);
    const i = etapes.findIndex((e) => e.noeud === id);
    if (i >= 0) setEtape(i);
  };

  const detail = NOEUDS[selection ?? courante.noeud];
  const proprietes = { etats, aretes, selection, surChoisir };

  return (
    <div ref={refVue}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap" role="group" aria-label="Choisir un scénario">
          {SCENARIOS.map((s) => {
            const actif = s.id === scenarioId;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={actif}
                onClick={() => choisirScenario(s.id)}
                className={`min-h-[42px] rounded-full border px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.08em] transition-colors duration-150 ${
                  actif ? 'border-transparent bg-signal-fonce text-white' : 'border-ciel/30 text-porcelain hover:border-ciel'
                }`}
              >
                {s.libelle}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <Bouton etiquette="Étape précédente" icone="precedent" onClick={() => aller(etape - 1)} disabled={etape === 0} />
          <Bouton
            etiquette={lecture && !reduit ? 'Mettre en pause' : 'Lire'}
            icone={lecture && !reduit ? 'pause' : 'lecture'}
            onClick={() => setLecture((v) => !v)}
            disabled={reduit}
          />
          <Bouton etiquette="Étape suivante" icone="suivant" onClick={() => aller(etape + 1)} disabled={derniere} />
          <Bouton etiquette="Reprendre au début" icone="rejouer" onClick={() => { setEtape(0); setSelection(null); setLecture(true); }} />
        </div>
      </div>
      <p className="mt-4 text-[0.95rem] text-porcelain/75">{scenario.resume}</p>

      <div className="mt-7 md:grid md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:gap-8 xl:block">
        <div>
          <Scene plan={BUREAU} {...proprietes} refScene={sceneBureau} refPaquet={paquetBureau} className="hidden xl:block" style={{ aspectRatio: `${BUREAU.W} / ${BUREAU.H}` }} />
          <Scene plan={TELEPHONE} {...proprietes} refScene={sceneTel} refPaquet={paquetTel} compact className="mx-auto max-w-[420px] xl:hidden" style={{ height: TELEPHONE.H }} />
        </div>

        <div className="mt-6 grid gap-4 md:sticky md:top-[88px] md:mt-0 md:h-fit xl:static xl:mt-8 xl:grid-cols-2 xl:gap-5">
          <section aria-live={enLecture ? 'off' : 'polite'} className="min-h-[276px] rounded-2xl border border-ciel/20 bg-[#0a1c38] p-6">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-ciel">
              {selection ? 'Détail de cette brique' : `Étape ${etape + 1} sur ${etapes.length}`}
            </p>
            <h3 className="mt-3 font-display text-[1.45rem] font-normal leading-tight text-porcelain">{detail.titre}</h3>
            <p className="mt-2.5 text-[0.93rem] leading-relaxed text-porcelain/80">{selection ? detail.quoi : courante.legende}</p>
            <p className="mt-3 text-[0.86rem] leading-relaxed text-porcelain/75"><span className="text-ciel">Pourquoi : </span>{detail.pourquoi}</p>
            <dl className="mt-4 space-y-1 font-mono text-[0.72rem] text-porcelain/75">
              <div className="flex flex-wrap gap-x-2"><dt className="text-ciel">fichier</dt><dd className="break-all">{detail.fichier}</dd></div>
              <div className="flex flex-wrap gap-x-2"><dt className="text-ciel">commande</dt><dd className="break-all">{detail.commande}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-ciel/20 bg-[#020a18] p-5">
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.1em] text-ciel">Journal d'exécution</p>
            <div ref={journal} data-lenis-prevent tabIndex={0} aria-label="Journal d'exécution du scénario" className="mt-3 h-[212px] overflow-y-auto overscroll-contain font-mono text-[0.74rem] leading-[1.7]">
              {lignesJournal.map((l, i) => {
                const type = l.slice(0, 2);
                const couleur = type === 'xx' ? 'text-signal-light' : type === 'ok' ? 'text-ciel' : type === '$ ' ? 'text-porcelain' : 'text-porcelain/75';
                return <p key={`${i}-${l}`} className={`break-words ${couleur}`}>{l.replace(/^xx {2}/, '✕ ').replace(/^ok {2}/, '✓ ')}</p>;
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Sur téléphone, la scène dépasse l'écran : l'étape en cours reste lisible. */}
      <div className="sticky bottom-3 z-30 mt-5 flex items-center gap-3 rounded-full border border-ciel/30 bg-[#0a1c38]/95 py-2 pl-4 pr-2 backdrop-blur md:hidden">
        <span className="min-w-0 flex-1 truncate text-[0.82rem] text-porcelain">
          <span className="font-mono text-[0.7rem] text-ciel">{etape + 1}/{etapes.length}</span> {NOEUDS[courante.noeud].titre}
        </span>
        <Bouton etiquette={lecture && !reduit ? 'Mettre en pause' : 'Lire'} icone={lecture && !reduit ? 'pause' : 'lecture'} onClick={() => setLecture((v) => !v)} disabled={reduit} />
      </div>
    </div>
  );
}
