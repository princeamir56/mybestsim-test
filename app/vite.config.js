import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';

// Dossier de sortie. Par defaut ../site (le dossier publie du depot) ; sur un
// hebergeur dont la racine du projet est app/ (Vercel), rien ne doit sortir de
// app/ : SORTIE_SITE=dist redirige la sortie vers app/dist.
const RACINE_APP = fileURLToPath(new URL('.', import.meta.url));
const SORTIE_SITE = path.resolve(RACINE_APP, process.env.SORTIE_SITE || '../site');

// Le site est servi depuis une sous-arborescence sur GitHub Pages ; `base` est
// surchargeable au build (BASE_URL=/mon-depot/ npm run build) sans toucher au code.
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // La sortie alimente directement le dossier publié.
    outDir: SORTIE_SITE,
    emptyOutDir: true,
    assetsDir: 'assets',
  },
});
