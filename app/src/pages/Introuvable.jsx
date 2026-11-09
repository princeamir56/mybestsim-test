import { Link } from 'react-router-dom';

/** Une adresse mal tapée mérite une vraie réponse, pas le tableau de bord en silence. */
export default function Introuvable() {
  return (
    <section className="shell flex min-h-[72vh] flex-col items-center justify-center pb-20 pt-32 text-center">
      <img src={`${import.meta.env.BASE_URL}marque/oiseau.webp`} alt="" width="132" height="132" className="h-[132px] w-[132px]" />
      <h1 className="h-section mt-6 text-marine">Cette page s'est envolée</h1>
      <p className="lede mt-4 max-w-[46ch]">
        L'adresse demandée n'existe pas, ou plus. Les pages principales du site sont juste ici.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Le tableau de bord</Link>
        <Link to="/internet-en-croisiere" className="btn-ghost">Le guide croisière</Link>
      </div>
    </section>
  );
}
