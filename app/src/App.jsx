import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Intro from './components/layout/Intro.jsx';
import SmoothScroll from './components/ui/SmoothScroll.jsx';
import ScrollProgress from './components/ui/ScrollProgress.jsx';
import Accueil from './pages/Accueil.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Article from './pages/Article.jsx';
import Automatisation from './pages/Automatisation.jsx';
import Introuvable from './pages/Introuvable.jsx';
import { allerA, allerEnHaut } from './lib/scroll.js';

/**
 * Un changement de route repart du haut, ou de la section demandée : un lien
 * `/#decisions` suivi depuis l'article doit arriver sur les décisions. On attend
 * un instant, le temps que la nouvelle page soit dans le DOM.
 */
function PositionDePage() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      allerEnHaut();
      return undefined;
    }
    const t = setTimeout(() => allerA(hash.slice(1)), 80);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  // React a pris la main : le voile posé en tête de page n'a plus de raison
  // d'être. Le rideau de la scène, s'il y en a un, est déjà en place dessous.
  useEffect(() => {
    document.documentElement.classList.remove('voile');
  }, []);

  return (
    <>
      <a href="#contenu" className="lien-evitement">Aller au contenu</a>
      <Intro />
      <SmoothScroll />
      <ScrollProgress />
      <PositionDePage />
      <Navbar />
      <main id="contenu">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/internet-en-croisiere" element={<Article />} />
          <Route path="/automation" element={<Automatisation />} />
          <Route path="*" element={<Introuvable />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
