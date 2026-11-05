/**
 * Pilote un vrai Chrome contre le site construit, collecte les erreurs de
 * console et écrit des captures.
 *
 * Un site qui est essentiellement du mouvement ne se vérifie pas en lisant le
 * source : il faut le regarder. Même approche que sur mes autres projets.
 *
 *   node scripts/shots.mjs [baseUrl]
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = process.env.SHOT_DIR ?? 'C:/Users/amirk/AppData/Local/Temp/mbs-shots';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  phone: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const SHOTS = [
  { name: 'hero', path: '/', wait: 2600, full: false },
  { name: 'dashboard', path: '/', wait: 5200, full: true },
  { name: 'article', path: '/internet-en-croisiere', wait: 3200, full: true },
];

mkdirSync(OUT, { recursive: true });

const navigateur = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

const erreurs = [];
let debordements = [];

for (const [nomVp, vp] of Object.entries(VIEWPORTS)) {
  for (const shot of SHOTS) {
    const page = await navigateur.newPage();
    await page.setViewport(vp);

    page.on('console', (m) => {
      if (m.type() === 'error') erreurs.push(`[${nomVp}/${shot.name}] ${m.text()}`);
    });
    page.on('pageerror', (e) => erreurs.push(`[${nomVp}/${shot.name}] ${e.message}`));

    await page.goto(BASE + shot.path, { waitUntil: 'networkidle0', timeout: 45000 });

    if (shot.full) {
      // Un défilement complet déclenche toutes les révélations : sans ça, une
      // capture pleine page photographie des sections encore invisibles.
      await page.evaluate(async () => {
        const pas = Math.floor(window.innerHeight * 0.75);
        for (let y = 0; y < document.body.scrollHeight; y += pas) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 220));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 450));
      });
    }

    await new Promise((r) => setTimeout(r, shot.wait));

    // Un débordement horizontal est le défaut responsive le plus courant, et
    // il ne se voit pas sur une capture pleine page — on le mesure.
    const debord = await page.evaluate(() => {
      const largeur = document.documentElement.clientWidth;
      const coupables = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > largeur + 1.5 || r.left < -1.5)) {
          const s = getComputedStyle(el);
          if (s.position === 'fixed' || s.overflow === 'hidden' || s.overflowX === 'clip') continue;
          coupables.push(
            `${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')} (${Math.round(r.left)}→${Math.round(r.right)} / ${largeur})`
          );
        }
      }
      return {
        scrollable: document.documentElement.scrollWidth > largeur + 1,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: largeur,
        coupables: [...new Set(coupables)].slice(0, 6),
      };
    });
    if (debord.scrollable) {
      debordements.push(`[${nomVp}/${shot.name}] ${debord.scrollWidth}px > ${debord.clientWidth}px :: ${debord.coupables.join(' | ')}`);
    }

    const fichier = `${OUT}/${nomVp}-${shot.name}.png`;
    await page.screenshot({ path: fichier, fullPage: shot.full });
    console.log(`[capture] ${fichier}`);
    await page.close();
  }
}

await navigateur.close();

console.log('\n=== ERREURS CONSOLE ===');
console.log(erreurs.length ? erreurs.join('\n') : 'aucune');
console.log('\n=== DEBORDEMENT HORIZONTAL ===');
console.log(debordements.length ? debordements.join('\n') : 'aucun');
if (erreurs.length || debordements.length) process.exitCode = 1;
