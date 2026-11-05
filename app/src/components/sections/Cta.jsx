import { Link } from 'react-router-dom';
import Reveal from '../ui/Reveal.jsx';
import Magnetic from '../ui/Magnetic.jsx';
import { n } from '../../lib/format.js';
import data from '../../data/catalogue.json';

export default function Cta() {
  return (
    <section className="shell pb-24 lg:pb-32">
      <Reveal>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-marine/10 bg-gradient-to-br from-white/80 to-shell/60 px-7 py-14 text-center shadow-halo sm:px-12">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-signal/10 blur-[90px]"
          />
          <div className="relative">
            <p className="label-muted">Les deux moitiés du test</p>
            <h2 className="h-section mx-auto mt-5 max-w-[20ch] text-marine">
              Le même jeu de données, raconté
            </h2>
            <p className="lede mx-auto mt-5 max-w-[58ch]">
              L'article SEO de la partie 2 ne reprend pas des prix inventés : son tableau
              comparatif est généré à partir de ces mêmes {n(data.meta.lignes)} offres.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Magnetic>
                <Link to="/internet-en-croisiere" className="btn-primary">
                  Lire l'article
                </Link>
              </Magnetic>
              <Magnetic>
                <a href="#chiffres" className="btn-ghost">
                  Revoir les chiffres
                </a>
              </Magnetic>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
