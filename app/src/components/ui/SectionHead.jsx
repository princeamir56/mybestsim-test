import Reveal from './Reveal.jsx';
import { LineReveal } from './SplitText.jsx';

/** L'en-tête de section : repère, titre, chapeau. Un seul rythme partout. */
export default function SectionHead({ num, title, children, align = 'left' }) {
  return (
    <header className={`mb-10 lg:mb-12 ${align === 'center' ? 'text-center' : ''}`}>
      <Reveal>
        <span className="label-muted inline-flex items-center gap-3">
          <span aria-hidden="true" className="inline-block h-px w-8 bg-signal/60" />
          {num}
        </span>
      </Reveal>
      <h2 className="h-section mt-4 max-w-[24ch] text-marine">
        <LineReveal text={title} />
      </h2>
      {children ? (
        <Reveal delay={0.12}>
          <p className={`lede mt-4 max-w-[68ch] ${align === 'center' ? 'mx-auto' : ''}`}>{children}</p>
        </Reveal>
      ) : null}
    </header>
  );
}
