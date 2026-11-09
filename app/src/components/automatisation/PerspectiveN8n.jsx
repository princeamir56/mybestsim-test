import DiagrammeN8n from './DiagrammeN8n.jsx';

const COMPARAISON = [
  ['Arrivée des fichiers', 'Un commit dans le dépôt', 'Mail, serveur SFTP ou webhook, sans intervention'],
  ['Fichier invalide', 'Le build échoue dans GitHub Actions', "Refusé avant le commit, mis de côté, et l'équipe sait pourquoi"],
  ['Échec du pipeline', "À lire dans l'onglet Actions", 'Commit annulé et alerte envoyée dans Slack'],
  ['Après publication', 'Aucune confirmation', "Page en ligne contrôlée, résumé envoyé à l'équipe"],
];

/** La suite logique du projet : ce qui manque aujourd'hui, et le workflow qui le comble. */
export default function PerspectiveN8n() {
  return (
    <section className="shell mt-24" aria-label="Perspective : le workflow n8n">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-signal-light">Perspective · évolution proposée</p>
      <h2 className="h-section mt-4 max-w-[26ch] text-porcelain">Demain : le même pipeline, alimenté par n8n</h2>
      <p className="mt-5 max-w-[68ch] text-[1.02rem] leading-[1.75] text-porcelain/80">
        Le pipeline actuel commence au moment où un fichier entre dans le dépôt. n8n prendrait en charge
        ce qui se passe avant et après : aller chercher les fichiers, écarter les mauvais, puis confirmer
        que tout s'est bien passé. Ce workflow est une proposition : il n'est pas déployé, et l'exécution
        ci-dessous est simulée.
      </p>

      <div className="mt-9">
        <DiagrammeN8n />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <h3 className="font-display text-[1.35rem] font-normal text-porcelain">Ce que cela changerait</h3>
          <div className="mt-5 divide-y divide-porcelain/15 border-y border-porcelain/15">
            {COMPARAISON.map(([sujet, avant, apres]) => (
              <div key={sujet} className="grid gap-1 py-3.5 sm:grid-cols-[1fr_1.2fr_1.5fr] sm:gap-4">
                <p className="text-[0.9rem] font-semibold text-porcelain">{sujet}</p>
                <p className="text-[0.88rem] text-porcelain/75"><span className="sm:hidden">Aujourd'hui : </span>{avant}</p>
                <p className="text-[0.88rem] text-ciel"><span className="sm:hidden">Avec n8n : </span>{apres}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="h-fit rounded-2xl border border-ciel/20 bg-[#0a1c38] p-6">
          <h3 className="font-display text-[1.2rem] font-normal text-porcelain">Ce qui ne changerait pas</h3>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-porcelain/80">
            GitHub Actions resterait le seul à produire les chiffres, avec les mêmes contrôles. L'IA n'écrirait
            que des messages : elle ne toucherait jamais aux données.
          </p>
          <h3 className="mt-5 font-display text-[1.2rem] font-normal text-porcelain">Ce qu'il faudrait</h3>
          <p className="mt-3 text-[0.9rem] leading-relaxed text-porcelain/80">
            Une instance n8n, les accès Gmail, SFTP, GitHub et Slack, et une étape dans le workflow GitHub pour
            signaler à n8n la fin de chaque exécution.
          </p>
        </aside>
      </div>
    </section>
  );
}
