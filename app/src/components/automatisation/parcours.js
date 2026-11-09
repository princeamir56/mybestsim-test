// Le moteur commun aux schémas de /automation : un scénario est une suite d'étapes,
// un paquet parcourt la flèche de chaque étape, puis le nœud d'arrivée s'allume.
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useReducedMotion } from '../../lib/motion.js';

export function jalons(points) {
  const longueurs = [0];
  for (let i = 1; i < points.length; i += 1) {
    longueurs.push(longueurs[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }
  const total = longueurs[longueurs.length - 1] || 1;
  return longueurs.map((l) => l / total);
}

export function useParcours({ scenarios, noeuds, scenes, pointsDe, trajet = 520, pause = 1000, pauseFin = 2600 }) {
  const reduit = useReducedMotion();
  const { ref: refVue, inView } = useInView({ threshold: 0.12 });

  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [etape, setEtape] = useState(0);
  const [lecture, setLecture] = useState(true);
  const [selection, setSelection] = useState(null);
  const [arrivee, setArrivee] = useState(null);

  const scenario = scenarios.find((s) => s.id === scenarioId);
  const etapes = scenario.etapes;
  const courante = etapes[etape];
  const derniere = etape === etapes.length - 1;
  const enLecture = lecture && !reduit && inView;
  const cle = `${scenarioId}:${etape}`;
  const arrive = !enLecture || arrivee === cle || !courante.arete;

  useEffect(() => {
    if (!enLecture) return undefined;
    const duree = courante.arete ? trajet : 0;
    const animations = [];

    if (courante.arete) {
      const visible = scenes.find((s) => s.scene.current?.offsetWidth > 0);
      const points = visible && pointsDe(visible.plan, courante.arete);
      if (points && visible.paquet.current) {
        const { width, height } = visible.scene.current.getBoundingClientRect();
        const paquet = visible.paquet.current;
        const offsets = jalons(points);
        paquet.textContent = courante.paquet;
        animations.push(
          paquet.animate(
            points.map(([x, y], i) => ({ transform: `translate(${(x / visible.plan.W) * width}px, ${(y / visible.plan.H) * height}px)`, offset: offsets[i] })),
            { duration: trajet, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'forwards' }
          ),
          paquet.animate({ opacity: [0, 1, 1, 0], offset: [0, 0.12, 0.88, 1] }, { duration: trajet, fill: 'forwards' })
        );
      }
    }

    const t1 = setTimeout(() => setArrivee(cle), duree);
    const t2 = setTimeout(() => setEtape(derniere ? 0 : etape + 1), duree + (derniere ? pauseFin : pause));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      animations.forEach((a) => a.cancel());
    };
  }, [enLecture, cle]); // eslint-disable-line react-hooks/exhaustive-deps

  const etats = Object.fromEntries(Object.keys(noeuds).map((id) => [id, 'repos']));
  const aretes = {};
  etapes.slice(0, etape + 1).forEach((e, i) => {
    const passee = i < etape;
    if (passee || arrive) etats[e.noeud] = e.echec ? 'echec' : passee ? 'fait' : 'actif';
    if (e.arete) aretes[e.arete] = 'allumee';
  });

  const choisirScenario = (id) => {
    setScenarioId(id);
    setEtape(0);
    setSelection(null);
    setLecture(true);
  };
  const aller = (i) => {
    setLecture(false);
    setSelection(null);
    setEtape(Math.max(0, Math.min(etapes.length - 1, i)));
  };
  const surChoisir = (id) => {
    setLecture(false);
    setSelection(id);
    const i = etapes.findIndex((e) => e.noeud === id);
    if (i >= 0) setEtape(i);
  };
  const reprendre = () => {
    setEtape(0);
    setSelection(null);
    setLecture(true);
  };

  return {
    refVue, reduit, scenario, scenarioId, etapes, courante, etape, derniere, enLecture, arrive, cle,
    lecture, setLecture, selection, etats, aretes,
    etapesVues: etapes.slice(0, etape + 1).filter((e, i) => i < etape || arrive),
    choisirScenario, aller, surChoisir, reprendre,
  };
}
