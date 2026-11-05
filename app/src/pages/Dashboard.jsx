import { useState } from 'react';
import Hero from '../components/sections/Hero.jsx';
import Kpis from '../components/sections/Kpis.jsx';
import Decisions from '../components/sections/Decisions.jsx';
import Fournisseurs from '../components/sections/Fournisseurs.jsx';
import Valeur from '../components/sections/Valeur.jsx';
import Volumes from '../components/sections/Volumes.jsx';
import Cta from '../components/sections/Cta.jsx';

export default function Dashboard() {
  // L'état vit ici parce que deux sections le partagent : un repère D1…D4 posé
  // sur une tuile de KPI doit ouvrir la bonne décision plus bas dans la page.
  // `demande` compte ces clics : c'est lui, et lui seul, qui déclenche le
  // défilement jusqu'à la décision.
  const [decisionOuverte, setDecisionOuverte] = useState('D1');
  const [demande, setDemande] = useState(0);

  return (
    <>
      <Hero />
      <Kpis
        onOuvrirDecision={(id) => {
          setDecisionOuverte(id);
          setDemande((n) => n + 1);
        }}
      />
      <Decisions ouverte={decisionOuverte} setOuverte={setDecisionOuverte} demande={demande} />
      <Fournisseurs />
      <Valeur />
      <Volumes />
      <Cta />
    </>
  );
}
