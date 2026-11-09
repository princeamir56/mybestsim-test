import { Link, useLocation } from 'react-router-dom';
import Reveal from '../ui/Reveal.jsx';
import { n, dateFr, mot } from '../../lib/format.js';
import data from '../../data/catalogue.json';

/** Une ancre du tableau de bord, valide depuis n'importe quelle page du site. */
function LienSection({ id, children }) {
  const { pathname } = useLocation();
  const classes = 'inline-block py-1 text-porcelain/70 transition-colors hover:text-signal-light';
  return pathname === '/' ? (
    <a href={`#${id}`} className={classes}>{children}</a>
  ) : (
    <Link to={`/#${id}`} className={classes}>{children}</Link>
  );
}

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-abysse pb-14 pt-20 text-porcelain">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[10%] -top-[30%] h-[460px] w-[460px] rounded-full bg-azur/10 blur-[120px]"
      />
      <div className="shell relative">
        <Reveal>
          <div className="grid gap-10 border-b border-porcelain/12 pb-12 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <img src={`${import.meta.env.BASE_URL}marque/oiseau-96.webp`} alt="" width="48" height="48" loading="lazy" className="mb-4 h-12 w-12" />
              <p className="font-display text-[1.6rem] font-light leading-snug text-porcelain">
                Comment ce tableau de bord est construit
              </p>
              <p className="mt-5 max-w-[56ch] text-[0.92rem] leading-relaxed text-porcelain/60">
                Les {data.meta.fichiers} fichiers CSV sont agrégés en Python au moment
                du build, puis le résultat est empaqueté dans la page. Le navigateur ne
                lit jamais les CSV : il n'y a ni serveur, ni base de données, ni appel
                réseau. Sept assertions font échouer le build plutôt que de laisser
                passer un chiffre faux, notamment si les {n(data.faits.na_lignes)} lignes
                « Amérique du Nord » venaient à disparaître silencieusement.
              </p>
            </div>

            <div>
              <p className="label-muted !text-porcelain/60">Le jeu de données</p>
              <dl className="mt-5 space-y-2.5 text-[0.88rem]">
                {[
                  ['Lignes', n(data.meta.lignes)],
                  ['Fournisseurs', data.meta.fichiers],
                  ['Destinations', `${data.meta.pays} pays + ${data.meta.zones} zones`],
                  ['Devise', data.meta.devise],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-porcelain/8 pb-2">
                    <dt className="text-porcelain/60">{k}</dt>
                    <dd className="font-mono tabular text-porcelain/80">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="label-muted !text-porcelain/60">Aller plus loin</p>
              <ul className="mt-5 space-y-3 text-[0.9rem]">
                <li>
                  <Link
                    to="/internet-en-croisiere"
                    className="group inline-flex items-center gap-2 py-1 text-porcelain/70 transition-colors hover:text-signal-light"
                  >
                    Internet en croisière : quelle eSIM ?
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                </li>
                <li>
                  <LienSection id="decisions">Les {mot(data.decisions.length)} arbitrages</LienSection>
                </li>
                <li>
                  <LienSection id="chiffres">Les six statistiques du brief</LienSection>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-porcelain/60">
          <span>Test de recrutement MyBestSim · Amir Kerkeni</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-75 motion-safe:animate-pulse-ring" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
            </span>
            Généré le {dateFr(data.meta.genere_le)}
          </span>
        </div>
      </div>
    </footer>
  );
}
