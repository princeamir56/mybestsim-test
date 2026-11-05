// Le formatage français, au même endroit pour tout le site. Intl sépare les
// milliers par une espace fine insécable (U+202F) : c'est voulu, et c'est ce
// qui distingue « 5 056 » d'un nombre composé à la main.
const nf = new Intl.NumberFormat('fr-FR');
const nf1 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf3 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export const n = (v) => nf.format(v);
export const n1 = (v) => nf1.format(v);
export const n2 = (v) => nf2.format(v);
export const n3 = (v) => nf3.format(v);
export const eur = (v) => `${nf2.format(v)}\u00a0€`;
export const eur0 = (v) => `${nf.format(Math.round(v))}\u00a0€`;
export const pct = (v) => `${nf1.format(v)}\u00a0%`;

export const dateFr = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Les petits nombres s'écrivent en toutes lettres dans une phrase, en chiffres
// dans un tableau. Ce helper existe parce que les comptes du site sont
// désormais DÉRIVÉS des données : sans lui, « quatre ambiguïtés » deviendrait
// « 4 ambiguïtés » et la page perdrait son registre éditorial pour une raison
// purement technique.
const MOTS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq',
              'six', 'sept', 'huit', 'neuf', 'dix'];

export const mot = (v) => (Number.isInteger(v) && v >= 0 && v <= 10 ? MOTS[v] : nf.format(v));
export const Mot = (v) => {
  const m = mot(v);
  return m.charAt(0).toUpperCase() + m.slice(1);
};
