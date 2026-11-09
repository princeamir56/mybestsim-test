import Reveal from './Reveal.jsx';

/** Le panneau de contenu : la surface sur laquelle vit chaque graphique. */
export default function Panel({ title, note, action, children, delay = 0, className = '' }) {
  return (
    // min-w-0 : dans une grille, un panneau ne doit jamais s'élargir à la mesure
    // de ce qu'il contient (table dépliée, par exemple).
    <Reveal delay={delay} className={`min-w-0 ${className}`}>
      <section
        className="card-surface h-full rounded-[1.5rem] p-5 shadow-halo transition-shadow duration-500 ease-soft hover:shadow-halo-lg sm:p-8"
      >
        {(title || action) && (
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              {title ? <h3 className="h-card text-marine">{title}</h3> : null}
              {note ? (
                <p className="mt-2.5 max-w-[72ch] text-[0.88rem] leading-relaxed text-slate">{note}</p>
              ) : null}
            </div>
            {action}
          </div>
        )}
        {children}
      </section>
    </Reveal>
  );
}
