/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  future: {
    // Sans ça, chaque `hover:` se déclenche aussi au doigt : un tap laisse la
    // carte touchée bloquée en état survolé jusqu'au tap suivant ailleurs.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      // L'échelle d'opacité de Tailwind avance de cinq en cinq, donc les
      // modificateurs sur lesquels la maquette s'appuie (bg-porcelain/97,
      // border-marine/12 …) ne généraient aucune règle.
      opacity: { 8: '0.08', 12: '0.12', 14: '0.14', 18: '0.18', 92: '0.92', 97: '0.97' },
      colors: {
        // Papier chaud. Tout le site repose sur `porcelain` ; `shell` et `dune`
        // sont les deux crans en dessous, pour les panneaux et les filets.
        porcelain: '#F7F3EC',
        shell: '#EFE9DE',
        dune: '#DFD5C2',

        // La famille bleue : celle du signal, des cartes marines et des
        // réseaux. `abysse` est la surface inversée (hero, pied de page).
        marine: '#113A63',
        'marine-deep': '#0B2947',
        azur: '#1F6FB2',
        ciel: '#6BA8E0',
        abysse: '#0E1A26',

        // L'unique accent. Il ne sert qu'à deux choses : les appels à
        // l'action, et la seconde série des graphiques. Jamais en décoration,
        // pour qu'il veuille toujours dire « c'est ici que ça se passe ».
        signal: '#D2693A',
        'signal-fonce': '#B9542A',
        'signal-light': '#E89A6F',

        // Encre.
        ink: '#171C24',
        slate: '#4C5768',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        // Étiquettes, prix, volumes — tout ce que le catalogue *mesure*
        // plutôt qu'il ne le *dit*. Le serif contre le mono, c'est ce qui
        // donne le ton d'un comparateur et pas d'un blog.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: { label: '0.22em', wider2: '0.32em' },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      boxShadow: {
        halo: '0 0 0 1px rgba(17,58,99,0.10), 0 18px 48px -20px rgba(11,41,71,0.42)',
        'halo-lg': '0 0 0 1px rgba(17,58,99,0.16), 0 34px 90px -30px rgba(11,41,71,0.58)',
        signal: '0 0 0 1px rgba(210,105,58,0.35), 0 20px 60px -24px rgba(210,105,58,0.48)',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'spin-slow': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(14px,-10px,0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        // L'anneau qui respire derrière la pastille « données à jour ».
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.55' },
          '70%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        // L'onde d'une antenne : trois arcs qui partent du même point.
        'signal-wave': {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '30%': { opacity: '0.7' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
      },
      animation: {
        marquee: 'marquee 42s linear infinite',
        float: 'float 7s ease-in-out infinite',
        'spin-slow': 'spin-slow 38s linear infinite',
        drift: 'drift 11s ease-in-out infinite',
        shimmer: 'shimmer 2.4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.6s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [],
};
