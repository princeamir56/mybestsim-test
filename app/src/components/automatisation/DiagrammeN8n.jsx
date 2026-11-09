import { useRef } from 'react';
import { useParcours } from './parcours.js';
import { CANEVAS, COLONNE, NOEUDS_N8N, SCENARIOS_N8N } from '../../data/n8n.js';

// La grammaire visuelle d'un éditeur de workflows : toile sombre pointillée, nœuds
// carrés, liens en courbe. Les glyphes sont génériques, aucun logo n'est reproduit.
const VERT = '#2fb67c';
const ROUGE = '#ff6b5e';
const CORAIL = '#ff7a66';

const FAMILLES = {
  declencheur: 'text-[#ffb37a]',
  donnees: 'text-[#7cc4ff]',
  logique: 'text-[#8fe3b0]',
  depot: 'text-[#e6e8f0]',
  ia: 'text-[#c9a6ff]',
  notification: 'text-[#f7a8d0]',
};

const TRACES = {
  mail: <><rect x="1.5" y="3" width="13" height="10" rx="1.5" /><path d="M2 4l6 5 6-5" /></>,
  horloge: <><circle cx="8" cy="8" r="6.2" /><path d="M8 4.5V8l2.5 1.6" /></>,
  eclair: <path d="M9 1.5L3 9h4l-1 5.5L13 7H8.6z" />,
  serveur: <><rect x="2" y="2.5" width="12" height="4.5" rx="1" /><rect x="2" y="9" width="12" height="4.5" rx="1" /><path d="M4.5 4.7h.1M4.5 11.2h.1" /></>,
  fichier: <><path d="M4 1.5h5l3 3v10H4z" /><path d="M9 1.5v3h3M6 8.5h4M6 11h4" /></>,
  code: <path d="M6 3C4 3 4.5 7 3 8c1.5 1 1 5 3 5M10 3c2 0 1.5 4 3 5-1.5 1-1 5-3 5" />,
  branche: <><circle cx="3.5" cy="8" r="1.6" /><circle cx="12.5" cy="3.5" r="1.6" /><circle cx="12.5" cy="12.5" r="1.6" /><path d="M5 7.4c3-.6 2.6-3.4 6-3.8M5 8.6c3 .6 2.6 3.4 6 3.8" /></>,
  depot: <><circle cx="4.5" cy="3.5" r="1.6" /><circle cx="4.5" cy="12.5" r="1.6" /><circle cx="11.5" cy="8" r="1.6" /><path d="M4.5 5.1v5.8M10 8H7c-1.5 0-2.5-1-2.5-2.2" /></>,
  pause: <><circle cx="8" cy="8" r="6.2" /><path d="M6.5 5.5v5M9.5 5.5v5" /></>,
  globe: <><circle cx="8" cy="8" r="6.2" /><path d="M1.8 8h12.4M8 1.8c4 3.6 4 8.8 0 12.4M8 1.8c-4 3.6-4 8.8 0 12.4" /></>,
  etincelle: <path d="M8 1.5l1.6 4.9L14.5 8l-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z" />,
  message: <path d="M2 3h12v8.5H7L3.5 14v-2.5H2z" />,
  dossier: <path d="M1.8 4.2h4.4l1.5 1.7h6.5v7.6H1.8z" />,
  retour: <path d="M6 3L2.5 6.5 6 10M2.5 6.5H10a3.5 3.5 0 0 1 0 7H7" />,
  coche: <path d="M3 8.5l3.2 3.2L13 4.8" />,
  lecture: <path d="M5 3l8 5-8 5z" />,
  pauseBarres: <path d="M5.5 3v10M10.5 3v10" />,
  precedent: <path d="M10 3L5 8l5 5" />,
  suivant: <path d="M6 3l5 5-5 5" />,
};

function Glyphe({ nom, taille = 16 }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width={taille} height={taille} fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      {TRACES[nom]}
    </svg>
  );
}

/* ------------------------------------------------------------- les courbes --- */

function controles([x1, y1, x2, y2, sens]) {
  if (sens === 'v') {
    const d = Math.max(16, Math.abs(y2 - y1) * 0.5);
    return [x1, y1 + d, x2, y2 - d];
  }
  const d = Math.max(20, Math.abs(x2 - x1) * 0.5);
  return [x1 + d, y1, x2 - d, y2];
}

function trace(a) {
  const [c1x, c1y, c2x, c2y] = controles(a);
  return `M${a[0]} ${a[1]} C${c1x} ${c1y} ${c2x} ${c2y} ${a[2]} ${a[3]}`;
}

function echantillons(a, n = 24) {
  const [x1, y1, x2, y2] = a;
  const [c1x, c1y, c2x, c2y] = controles(a);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [
      u * u * u * x1 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x2,
      u * u * u * y1 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y2,
    ];
  });
}

/* ---------------------------------------------------------------- un nœud --- */

function Noeud({ id, cadre, plan, etat: etatBrut, selectionne, surChoisir, grand, enCours }) {
  const n = NOEUDS_N8N[id];
  // Le nœud en cours n'est « en exécution » que pendant la lecture : sinon il a réussi.
  const etat = etatBrut === 'actif' && !enCours ? 'fait' : etatBrut;
  const [x, y, l, h] = cadre;
  const pc = (v, t) => `${(v / t) * 100}%`;
  const bord = { repos: 'border-[#565868]', actif: 'border-[#ffb37a]', fait: 'border-[#2fb67c]', echec: 'border-[#ff6b5e]' }[etat];
  const fond = etat === 'repos' ? 'bg-[#35364a]' : 'bg-[#3d3f55]';
  const rond = n.declencheur ? 'rounded-l-[2rem] rounded-r-lg' : 'rounded-lg';

  const badge = etat === 'actif' && enCours
    ? <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-[#ffb37a] border-t-transparent bg-[#262733] motion-safe:animate-spin" />
    : etat === 'fait'
      ? <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white" style={{ background: VERT }}><Glyphe nom="coche" taille={10} /></span>
      : etat === 'echec'
        ? <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full font-mono text-[0.62rem] font-bold text-[#2a0f0b]" style={{ background: ROUGE }}>!</span>
        : null;

  const texte = (
    <>
      <span className="block text-[0.74rem] font-semibold leading-tight text-[#eceef5]">{n.type}</span>
      <span className="mt-0.5 block text-[0.67rem] leading-tight text-[#c3c6d4]">{n.sous}</span>
    </>
  );

  const style = { left: pc(x, plan.W), top: pc(y, plan.H), width: pc(l, plan.W), height: pc(h, plan.H) };
  const etiquette = `${n.type}, ${n.sous}. Ouvrir le nœud.`;
  const contour = selectionne ? 'outline outline-2 outline-offset-2 outline-white/70' : '';

  if (grand) {
    return (
      <button type="button" onClick={() => surChoisir(id)} aria-pressed={selectionne} aria-label={etiquette} style={style} className="absolute flex flex-col items-center text-center">
        <span className={`relative flex items-center justify-center border-2 transition-colors duration-200 ${rond} ${bord} ${fond} ${FAMILLES[n.famille]} ${contour}`} style={{ width: `${(plan.carre / 112) * 100}%`, aspectRatio: '1 / 1' }}>
          <Glyphe nom={n.icone} taille={26} />
          {badge}
        </span>
        <span className="mt-1.5 w-full">{texte}</span>
      </button>
    );
  }

  return (
    <button type="button" onClick={() => surChoisir(id)} aria-pressed={selectionne} aria-label={etiquette} style={style} className={`absolute flex items-center gap-2 border-2 px-2 text-left transition-colors duration-200 ${rond} ${bord} ${fond} ${n.declencheur ? 'flex-col justify-center gap-1 text-center' : ''} ${contour}`}>
      <span className={`shrink-0 ${FAMILLES[n.famille]}`}><Glyphe nom={n.icone} taille={18} /></span>
      <span className="min-w-0">{texte}</span>
      {badge}
    </button>
  );
}

/* --------------------------------------------------------------- la toile --- */

function Toile({ plan, grand, etats, aretes, selection, surChoisir, etapes, refScene, refPaquet, enCours, echecCourant, className, style }) {
  const pc = (v, t) => `${(v / t) * 100}%`;
  const items = Object.fromEntries(etapes.filter((e) => e.arete).map((e) => [e.arete, e.paquet]));
  return (
    <div ref={refScene} className={`relative ${className}`} style={style}>
      {plan.notes.map(([x, y, l, h, titre]) => (
        <div key={titre} className="absolute rounded-md border border-[#6b6238]/60 bg-[#46402a]/40" style={{ left: pc(x, plan.W), top: pc(y, plan.H), width: pc(l, plan.W), height: pc(h, plan.H) }}>
          <p className="p-2 text-[0.74rem] font-semibold text-[#f2e4a8]">{titre}</p>
        </div>
      ))}

      <svg aria-hidden="true" viewBox={`0 0 ${plan.W} ${plan.H}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {Object.entries(plan.aretes).map(([id, a]) => {
          const allumee = aretes[id] === 'allumee';
          const echec = allumee && (id.endsWith('>drive') || id.endsWith('>revert') || id.endsWith('>diag') || id.endsWith('>alerte') || id.endsWith('>alerte2'));
          const couleur = allumee ? (echec ? ROUGE : VERT) : '#7a7d90';
          return (
            <g key={id}>
              <path d={trace(a)} fill="none" stroke={couleur} strokeWidth={allumee ? 2.25 : 1.5} vectorEffect="non-scaling-stroke" style={{ transition: 'stroke 200ms ease' }} />
              {allumee ? <path d={trace(a)} fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" strokeDasharray="2 12" strokeLinecap="round" className="auto-flux" vectorEffect="non-scaling-stroke" /> : null}
            </g>
          );
        })}
      </svg>

      {Object.entries(plan.aretes).map(([id, a]) => {
        if (aretes[id] !== 'allumee' || !items[id]) return null;
        const [mx, my] = echantillons(a)[12];
        return (
          <span key={id} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-[#262733] px-1 font-mono text-[0.6rem] leading-tight text-[#8fe3b0]" style={{ left: pc(mx, plan.W), top: pc(my, plan.H) }}>
            {items[id]}
          </span>
        );
      })}

      {Object.entries(plan.noeuds).map(([id, c]) => (
        <Noeud key={id} id={id} cadre={c} plan={plan} etat={etats[id]} selectionne={selection === id} surChoisir={surChoisir} grand={grand} enCours={enCours} />
      ))}

      <span
        ref={refPaquet}
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 z-10 flex items-center justify-center rounded-full font-mono text-[0.6rem] font-semibold text-[#07241a] opacity-0 shadow-[0_0_14px_rgba(47,182,124,0.8)]"
        style={{ width: 56, height: 18, marginLeft: -28, marginTop: -9, background: echecCourant ? ROUGE : VERT }}
      />
    </div>
  );
}

function BoutonRond({ etiquette, icone, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={etiquette} title={etiquette} className="flex h-9 w-9 items-center justify-center rounded-md border border-[#565868] text-[#eceef5] transition-colors duration-150 hover:border-[#9a9db0] disabled:opacity-40">
      <Glyphe nom={icone} />
    </button>
  );
}

export default function DiagrammeN8n() {
  const sceneLarge = useRef(null);
  const sceneColonne = useRef(null);
  const paquetLarge = useRef(null);
  const paquetColonne = useRef(null);

  const {
    refVue, reduit, scenario, scenarioId, etapes, courante, etape, derniere, enLecture, arrive,
    lecture, setLecture, selection, etats, aretes, choisirScenario, aller, surChoisir, reprendre,
  } = useParcours({
    scenarios: SCENARIOS_N8N,
    noeuds: NOEUDS_N8N,
    scenes: [
      { scene: sceneLarge, paquet: paquetLarge, plan: CANEVAS },
      { scene: sceneColonne, paquet: paquetColonne, plan: COLONNE },
    ],
    pointsDe: (plan, id) => echantillons(plan.aretes[id]),
    trajet: 480,
    pause: 900,
  });

  const detail = NOEUDS_N8N[selection ?? courante.noeud];
  const joue = lecture && !reduit;
  const enCours = enLecture && !derniere;
  const proprietes = { etats, aretes, selection, surChoisir, enCours, etapes, echecCourant: !!courante.echec };

  return (
    <div ref={refVue} className="overflow-hidden rounded-2xl border border-[#46485a] bg-[#262733]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-[#46485a] bg-[#2e2f3e] px-4 py-3">
        <p className="min-w-0 flex-1 text-[0.9rem] font-semibold text-[#eceef5]">Import du catalogue eSIM</p>
        <span className="rounded-full border border-[#8a7b3c] bg-[#46402a] px-2.5 py-1 font-mono text-[0.62rem] uppercase tracking-[0.06em] text-[#f2e4a8]">Simulation · non déployé</span>
        <div className="flex items-center gap-2">
          <BoutonRond etiquette="Nœud précédent" icone="precedent" onClick={() => aller(etape - 1)} disabled={etape === 0} />
          <BoutonRond etiquette="Nœud suivant" icone="suivant" onClick={() => aller(etape + 1)} disabled={derniere} />
          <button
            type="button"
            onClick={() => (joue ? setLecture(false) : reprendre())}
            disabled={reduit}
            className="flex h-9 items-center gap-2 rounded-md px-3.5 text-[0.8rem] font-semibold text-[#2a0f0b] transition-[filter] duration-150 hover:brightness-110 disabled:opacity-40"
            style={{ background: CORAIL }}
          >
            <Glyphe nom={joue ? 'pauseBarres' : 'lecture'} taille={14} />
            {joue ? 'Pause' : 'Execute workflow'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#46485a] px-4 py-3" role="group" aria-label="Choisir une exécution">
        {SCENARIOS_N8N.map((s) => {
          const actif = s.id === scenarioId;
          return (
            <button key={s.id} type="button" aria-pressed={actif} onClick={() => choisirScenario(s.id)} className={`min-h-[36px] rounded-md px-3 py-1.5 text-[0.78rem] transition-colors duration-150 ${actif ? 'bg-[#4a4c63] font-semibold text-white' : 'text-[#c3c6d4] hover:bg-[#35364a]'}`}>
              {s.libelle}
            </button>
          );
        })}
        <p className="w-full text-[0.84rem] text-[#c3c6d4]">{scenario.resume}</p>
      </div>

      <div className="md:grid md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:block">
        <div className="p-4 [background-image:radial-gradient(#45475a_1px,transparent_1px)] [background-size:20px_20px] xl:p-5">
          <Toile plan={CANEVAS} grand {...proprietes} refScene={sceneLarge} refPaquet={paquetLarge} className="hidden xl:block" style={{ aspectRatio: `${CANEVAS.W} / ${CANEVAS.H}` }} />
          <Toile plan={COLONNE} {...proprietes} refScene={sceneColonne} refPaquet={paquetColonne} className="mx-auto max-w-[420px] xl:hidden" style={{ height: COLONNE.H }} />
        </div>

        <div className="grid gap-px border-t border-[#46485a] bg-[#46485a] md:h-fit md:border-l md:border-t-0 xl:grid-cols-2 xl:border-l-0 xl:border-t">
          <section aria-live={enLecture ? 'off' : 'polite'} className="min-h-[248px] bg-[#2e2f3e] p-5">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.08em] text-[#c3c6d4]">Paramètres du nœud</p>
            <h3 className="mt-2.5 flex items-center gap-2 text-[1.05rem] font-semibold text-white">
              <span className={FAMILLES[detail.famille]}><Glyphe nom={detail.icone} /></span>
              {detail.type}
            </h3>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-[#dfe1ea]">{selection || !arrive ? detail.role : courante.legende}</p>
            <dl className="mt-3.5 space-y-1.5 text-[0.76rem]">
              {detail.parametres.map(([k, v]) => (
                <div key={k} className="flex flex-wrap gap-x-2">
                  <dt className="text-[#c3c6d4]">{k}</dt>
                  <dd className="break-words font-mono text-[#8fe3b0]">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="bg-[#1e1f2b] p-5">
            <p className="font-mono text-[0.64rem] uppercase tracking-[0.08em] text-[#c3c6d4]">Output · exemple illustratif</p>
            <pre data-lenis-prevent tabIndex={0} aria-label="Sortie du nœud" className="mt-3 h-[188px] overflow-auto overscroll-contain font-mono text-[0.72rem] leading-[1.65] text-[#cfe8ff]">
              {JSON.stringify(detail.sortie, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
