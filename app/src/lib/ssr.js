// Vrai pendant le rendu serveur du prérendu.
//
// Les composants de révélation s'en servent pour écrire leur état FINAL dans
// le HTML statique plutôt que leur état initial. Sans ça, le fichier prérendu
// contiendrait `style="opacity:0"` sur chaque bloc : le texte serait bien dans
// le DOM pour un robot, mais invisible pour un visiteur sans JavaScript.
export const EST_SERVEUR = typeof window === 'undefined';
