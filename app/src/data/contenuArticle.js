// Le contenu éditorial de l'article qui n'est pas un chiffre.
//
// La FAQ vit ici parce qu'elle sert DEUX consommateurs : le bloc dépliant de
// la page, et le balisage FAQPage injecté dans le HTML au prérendu. Écrite une
// seule fois, elle ne peut pas promettre à Google une question absente de la
// page — l'erreur classique du balisage saisi à part.

const FAQ_BRUTE = [
  {
    question: 'Est-ce qu\'une eSIM fonctionne sur un bateau de croisière ?',
    reponse:
      "Oui à quai et en escale, non en pleine mer. Une eSIM de voyage se connecte aux " +
      "réseaux mobiles terrestres : dès que le navire s'éloigne suffisamment des côtes, " +
      "elle n'a plus de réseau à capter. Au large, seul le Wi-Fi du bord ou une offre " +
      'maritime dédiée permet de se connecter.',
  },
  {
    question: 'Est-ce qu\'on capte en pleine mer ?',
    reponse:
      "Votre téléphone affichera souvent du réseau : celui de l'antenne embarquée du " +
      "navire, pas une antenne terrestre. C'est précisément le risque. Cette connexion " +
      "passe par satellite et sort du cadre de l'itinérance européenne, ce qui en fait " +
      'la première cause de facture inattendue au retour.',
  },
  {
    question: 'Dois-je mettre mon téléphone en mode avion en croisière ?',
    reponse:
      "C'est la recommandation du portail officiel de l'Union européenne pour les " +
      'trajets en bateau. Si vous préférez rester joignable par Wi-Fi, une solution ' +
      "équivalente consiste à désactiver les données en itinérance ainsi que les appels " +
      'et SMS en itinérance, tout en gardant le Wi-Fi actif.',
  },
  {
    question: 'Combien de Go faut-il prévoir pour une croisière ?',
    reponse:
      "Pour une croisière d'une semaine avec escales quotidiennes, 5 Go couvrent très " +
      'largement un usage normal : navigation, messagerie, réseaux sociaux et photos. ' +
      "Vous n'êtes connecté que quelques heures par jour. Au-delà de dix jours, ou si " +
      'vous partagez votre connexion, visez 10 à 20 Go.',
  },
  {
    question: 'L\'eSIM remplace-t-elle le forfait Internet du bateau ?',
    reponse:
      'Non, et aucune ne le prétendra honnêtement. Les deux couvrent des moments ' +
      "différents : l'eSIM à terre, le forfait du bord en mer. Si vous pouvez vous " +
      "passer d'Internet pendant les journées de navigation, l'eSIM seule suffit et vous " +
      'économisez le forfait du bord. Si vous devez rester joignable en permanence, il ' +
      'vous faut les deux.',
  },
  {
    question: 'Mon forfait français fonctionne-t-il en croisière ?',
    reponse:
      "Dans les ports de l'Union européenne, oui : tant que votre téléphone est accroché " +
      "à un réseau terrestre, l'itinérance européenne s'applique aux conditions de votre " +
      'forfait. Dès que la connexion bascule sur le satellite du navire, la ' +
      "réglementation européenne cesse de s'appliquer et les tarifs ne sont plus plafonnés.",
  },
  {
    question: 'Faut-il une eSIM par pays ou une seule pour toute la croisière ?',
    reponse:
      'Cela dépend du nombre de pays touchés. Pour une ou deux destinations, des eSIM ' +
      'locales reviennent moins cher. À partir de trois pays, une eSIM régionale devient ' +
      "plus avantageuse, et vous n'avez qu'une installation à gérer avant le départ.",
  },
  {
    question: 'Quand faut-il acheter et activer son eSIM ?',
    reponse:
      "Achetez et installez-la chez vous avant le départ : l'installation demande une " +
      'connexion Internet. En revanche, activez-la seulement à la première escale, car ' +
      'la plupart des forfaits démarrent leur décompte à la première connexion au réseau ' +
      "et non au moment de l'achat.",
  },
];

export const ITINERAIRES_EDITO = [
  {
    emoji: '🇪🇸',
    nom: 'Méditerranée',
    verdict: 'Régionale',
    texte:
      "L'itinéraire le plus favorable à l'eSIM : escales quasi quotidiennes, navigation " +
      "de nuit, et des pays tous très bien couverts. C'est aussi celui qui multiplie le " +
      "plus les frontières, puisque l'Espagne, la France, l'Italie, la Grèce et parfois la Croatie ou la Turquie se succèdent " +
      "dans la même semaine. Une eSIM régionale Europe est presque toujours le bon choix, " +
      'sauf sur un circuit qui reste dans un seul pays.',
  },
  {
    emoji: '🏝️',
    nom: 'Caraïbes',
    verdict: 'Vérifier île par île',
    texte:
      'Escales nombreuses mais entrecoupées de navigation, et surtout : chaque île est un ' +
      'pays différent, avec ses propres opérateurs. Vérifiez que votre destination exacte ' +
      'est couverte, car les catalogues sont plus fournis sur les grandes îles. Attention ' +
      "aussi aux escales en outre-mer français, où votre forfait habituel peut déjà s'appliquer.",
  },
  {
    emoji: '🇺🇸',
    nom: 'Alaska et Amérique du Nord',
    verdict: 'Régionale + forfait du bord',
    texte:
      'Itinéraire à forte proportion de navigation : les journées de mer y sont nombreuses ' +
      "et les escales plus espacées. L'eSIM reste utile à Vancouver, Seattle ou Juneau, " +
      "mais elle couvrira une part plus faible de votre voyage, et c'est l'un des itinéraires " +
      'où le forfait du bord se justifie le mieux. Une eSIM couvrant toute l\'Amérique du ' +
      'Nord évite d\'en jongler deux entre États-Unis et Canada.',
  },
  {
    emoji: '🇳🇴',
    nom: 'Norvège et fjords',
    verdict: 'Mono-pays',
    texte:
      'Particularité utile : la navigation se fait en grande partie dans les fjords, donc ' +
      "près des côtes. Vous conserverez plus souvent du signal qu'en haute mer, mais sans " +
      'garantie, car cela dépend du relief et de l\'opérateur. Les escales restant dans un seul ' +
      'pays, une eSIM Norvège suffit, sauf si le circuit inclut le Danemark ou l\'Islande.',
  },
  {
    emoji: '🇸🇪',
    nom: 'Baltique et mer du Nord',
    verdict: 'Régionale',
    texte:
      "Comme en Méditerranée, les frontières s'enchaînent : Allemagne, Suède, Pologne, " +
      "Pays-Bas, pays baltes, parfois au rythme d'une par jour. L'eSIM régionale Europe " +
      "s'impose, à la fois pour le prix et pour éviter de changer de forfait à chaque escale.",
  },
];

// Le plan de l'article : le sommaire de la page, le sommaire latéral et le menu
// mobile lisent cette seule liste.
export const SOMMAIRE = [
  ['#pleine-mer', 'Non, votre eSIM ne captera pas en pleine mer'],
  ['#escales', 'Alors à quoi sert-elle ? Aux escales'],
  ['#piege', '⚠️ Le vrai piège : le réseau du bateau'],
  ['#prix', 'Combien coûte une eSIM de croisière ?'],
  ['#vs-wifi', 'eSIM ou Wi-Fi du bord ?'],
  ['#itineraires', 'Quelle eSIM selon votre itinéraire ?'],
  ['#installation', 'Installer votre eSIM avant de partir'],
  ['#faq', 'Questions fréquentes'],
].map(([h, l]) => [h, l.replace(' ?', '\u00a0?')]);

/** Espaces insécables : ni « ? », ni « : », ni « € » seuls en début de ligne. */
export const typo = (t) =>
  t.replace(/ ([?:;!»%€])/g, '\u00a0$1').replace(/« /g, '«\u00a0');

export const FAQ = FAQ_BRUTE.map((q) => ({ question: typo(q.question), reponse: typo(q.reponse) }));
