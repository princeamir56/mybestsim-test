import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';

// Le balisage FAQPage et la page lisent la même FAQ. Elle passe par ce bundle
// parce que Vite y résout le JSON dont dépendent ses réponses.
export { FAQ } from './data/contenuArticle.js';

/**
 * Rendu serveur, utilisé uniquement au prérendu (scripts/prerender.mjs).
 *
 * Il n'y a pas de serveur en production : ce rendu sert à écrire, au build, un
 * fichier HTML complet par route. Ce que lit un robot d'indexation — et ce que
 * voit un visiteur dont le JavaScript échoue — est donc l'article entier, pas
 * une div vide.
 */
export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
