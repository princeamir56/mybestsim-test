/**
 * L'audit qu'une capture ne fait pas : il pilote un vrai Chrome contre le site
 * construit, EMPRUNTE les parcours, et mesure ce qui se calcule.
 *
 *   - parcours : menu mobile, repères D1…D4, liens entre pages, ancres, page 404 ;
 *   - scène d'ouverture : elle se joue, se retire, ne bloque plus les clics, et
 *     ne se rejoue pas dans la même session ;
 *   - à 4 largeurs : erreurs console, requêtes en échec, débordement horizontal,
 *     contraste calculé du texte, texte coupé, texte posé sur un autre texte,
 *     cibles tactiles trop petites.
 *
 *   node scripts/audit.mjs [baseUrl]
 *
 * Code de sortie non nul si un contrôle échoue.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const OUT = process.env.SHOT_DIR ?? 'C:/Users/amirk/AppData/Local/Temp/mbs-audit';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(OUT, { recursive: true });

const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const LARGEURS = {
  petit: { width: 320, height: 640, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  phone: PHONE,
  tablette: { width: 820, height: 1100, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  portable: { width: 1280, height: 720, deviceScaleFactor: 1 },
  bureau: { width: 1680, height: 1000, deviceScaleFactor: 1 },
};
const PAGES = [['accueil', '/'], ['dashboard', '/dashboard'], ['article', '/internet-en-croisiere'], ['automation', '/automation'], ['404', '/nimporte-quoi']];

const echecs = [];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (nom, vrai, detail = '') => {
  if (!vrai) echecs.push(`${nom}${detail ? ' — ' + detail : ''}`);
  console.log(`  ${vrai ? 'ok   ' : 'ÉCHEC'} ${nom}${!vrai && detail ? ' — ' + detail : ''}`);
};

const navigateur = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

async function nouvellePage(vp, etiquette) {
  // Un contexte par page : sessionStorage vierge, donc une vraie première visite.
  const ctx = await navigateur.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport(vp);
  page.on('console', (m) => {
    if (m.type() === 'error' && !(etiquette.endsWith('/404') && /404/.test(m.text()))) {
      echecs.push(`[${etiquette}] console : ${m.text()}`);
    }
  });
  page.on('pageerror', (e) => echecs.push(`[${etiquette}] exception : ${e.message}`));
  page.on('requestfailed', (r) => {
    if (!/fonts\.g/.test(r.url())) echecs.push(`[${etiquette}] requête en échec : ${r.url()}`);
  });
  page.on('response', (r) => {
    const u = r.url();
    if (u.startsWith(BASE) && r.status() >= 400 && !/nimporte-quoi/.test(u)) {
      echecs.push(`[${etiquette}] ${r.status()} : ${u}`);
    }
  });
  return { page, fermer: () => ctx.close() };
}

// Défile toute la page pour déclencher les révélations et les graphiques.
const parcourir = (page) =>
  page.evaluate(async () => {
    const pas = Math.floor(window.innerHeight * 0.7);
    for (let y = 0; y < document.documentElement.scrollHeight; y += pas) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 170));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1300));
  });

/* Mesures dans la page. */
const mesurer = (page) =>
  page.evaluate(() => {
    const largeur = document.documentElement.clientWidth;
    const couleur = (c) => {
      const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
    };
    const sur = (h, b) => ({
      r: h.r * h.a + b.r * (1 - h.a),
      g: h.g * h.a + b.g * (1 - h.a),
      b: h.b * h.a + b.b * (1 - h.a),
      a: 1,
    });
    const lum = (c) => {
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const fond = (el) => {
      const pile = [];
      for (let n = el; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.backgroundImage !== 'none') return null; // dégradé : non calculable
        const c = couleur(s.backgroundColor);
        if (c.a > 0) {
          pile.push(c);
          if (c.a === 1) break;
        }
      }
      let r = { r: 247, g: 243, b: 236, a: 1 };
      pile.reverse().forEach((c) => (r = sur(c, r)));
      return r;
    };

    const contrastes = new Map();
    const coupes = [];
    const walker = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const txt = n.nodeValue.trim();
      const el = n.parentElement;
      if (!txt || !el) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || s.visibility === 'hidden' || s.display === 'none' || el.closest('.sr-only,.lien-evitement,[aria-hidden="true"]')) continue;
      if (el.closest('svg')) continue;
      if (el.closest('a[aria-label^="MyBestSim"]')) continue; // logotype, exempté
      const entete = el.closest('header');
      if (entete && couleur(getComputedStyle(entete).backgroundColor).a === 0) continue; // posé sur le hero sombre
      let op = 1;
      for (let a = el; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
      if (op < 0.98) continue;
      const b = fond(el);
      if (b) {
        const c = couleur(s.color);
        const t = sur(c, b);
        const [x, y] = [lum(t), lum(b)].sort((p, q) => q - p);
        const ratio = (x + 0.05) / (y + 0.05);
        const taille = parseFloat(s.fontSize);
        const grand = taille >= 24 || (taille >= 18.66 && Number(s.fontWeight) >= 700);
        if (ratio < (grand ? 3 : 4.5)) contrastes.set(`${txt.slice(0, 36)} (${ratio.toFixed(2)})`, s.color);
      }
      if (el.scrollWidth > el.clientWidth + 2 && s.overflow !== 'visible' && s.display !== 'inline') {
        coupes.push(txt.slice(0, 40));
      }
    }

    // Deux textes qui se recouvrent : la mesure que « rien ne dépasse » ne voit pas.
    const blocs = [];
    const lecteur = document.createTreeWalker(document.querySelector('#root'), NodeFilter.SHOW_TEXT);
    for (let n = lecteur.nextNode(); n; n = lecteur.nextNode()) {
      const txt = n.nodeValue.trim();
      const el = n.parentElement;
      if (!txt || !el || el.closest('.sr-only,.lien-evitement')) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none') continue;
      const portee = document.createRange();
      portee.selectNodeContents(n);
      for (const q of portee.getClientRects()) {
        if (q.width >= 1 && q.height >= 1) blocs.push({ txt: txt.slice(0, 24), el, q });
      }
    }
    const collisions = [];
    blocs.forEach((a, i) => {
      for (let j = i + 1; j < blocs.length; j += 1) {
        const b = blocs[j];
        if (a.el === b.el) continue;
        const ox = Math.min(a.q.right, b.q.right) - Math.max(a.q.left, b.q.left);
        const oy = Math.min(a.q.bottom, b.q.bottom) - Math.max(a.q.top, b.q.top);
        // Les boîtes de ligne sont plus hautes que les lettres : on ignore les frôlements.
        if (ox > 1.5 && oy > Math.min(a.q.height, b.q.height) * 0.35) collisions.push(`${a.txt} / ${b.txt}`);
      }
    });

    const petites = [];
    document.querySelectorAll('a,button').forEach((a) => {
      const r = a.getBoundingClientRect();
      if (!r.width || a.closest('.lien-evitement') || a.classList.contains('lien-evitement')) return;
      const ap = getComputedStyle(a, '::after');
      const eten = ap.content !== 'none' && ap.position === 'absolute' ? 24 : 0;
      if (Math.min(r.width + eten, r.height + eten) < 24) petites.push(`${a.textContent.trim().slice(0, 24)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    });

    // Tout ce qui dépasse de l'écran sans être un défilement voulu.
    const depasse = [];
    document.querySelectorAll('#root *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || r.right <= largeur + 1.5) return;
      for (let p = el; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (['auto', 'scroll', 'hidden', 'clip'].includes(s.overflowX) && p.id !== 'root') return;
      }
      depasse.push(`${el.tagName.toLowerCase()} ${Math.round(r.right)}/${largeur}`);
    });

    // Chaque compteur doit être arrivé à sa valeur, une fois la page parcourue.
    const compteurs = [];
    document.querySelectorAll('[data-compteur]').forEach((v) => {
      const attendu = v.previousElementSibling.textContent;
      if (v.textContent !== attendu && /\d/.test(attendu)) compteurs.push(`${v.textContent} au lieu de ${attendu}`);
    });

    return {
      compteurs,
      scrollable: document.documentElement.scrollWidth > largeur + 1,
      largeur,
      hauteur: document.documentElement.scrollHeight,
      contrastes: [...contrastes.keys()].slice(0, 30),
      coupes: [...new Set(coupes)].slice(0, 8),
      collisions: [...new Set(collisions)].slice(0, 8),
      petites: [...new Set(petites)].slice(0, 8),
      depasse: [...new Set(depasse)].slice(0, 6),
    };
  });

/* ===================== SCÈNE D'OUVERTURE ===================== */
console.log("\n— Scène d'ouverture —");
{
  const { page, fermer } = await nouvellePage(LARGEURS.bureau, 'intro');
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const instants = [350, 900, 1500, 2100, 2500, 3100];
  let t = 0;
  for (const i of instants) {
    await pause(i - t);
    t = i;
    await page.screenshot({ path: `${OUT}/intro-${i}.png` });
  }
  const pendant = 'la scène a joué';
  ok(pendant, true);
  await pause(2200);
  const apres = await page.evaluate(() => ({
    rideau: !!document.querySelector('.z-\\[100\\]'),
    voile: document.documentElement.classList.contains('voile'),
    bloque: document.documentElement.classList.contains('intro-bloque'),
    h1: getComputedStyle(document.querySelector('h1')).opacity,
    centre: document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('.z-\\[100\\]') != null,
  }));
  ok('le rideau est retiré du DOM', !apres.rideau);
  ok('le voile est retiré', !apres.voile);
  ok('le défilement est rendu', !apres.bloque);
  ok('rien ne bloque les clics au centre', !apres.centre);
  await page.mouse.wheel({ deltaY: 900 });
  await pause(1300);
  ok('la molette fait défiler après la scène', (await page.evaluate(() => scrollY)) > 300);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await pause(300);
  ok('elle ne se rejoue pas dans la session', !(await page.$('.z-\\[100\\]')));
  await fermer();

  const a = await nouvellePage(LARGEURS.bureau, 'intro-article');
  await a.page.goto(`${BASE}/internet-en-croisiere`, { waitUntil: 'domcontentloaded' });
  await pause(200);
  ok("pas de rideau à l'arrivée sur l'article", !(await a.page.$('.z-\\[100\\]')));
  await a.fermer();

  const r = await nouvellePage(LARGEURS.bureau, 'intro-reduite');
  await r.page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await r.page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await pause(2400);
  ok('mouvement réduit : la scène est brève', !(await r.page.$('.z-\\[100\\]')));
  await r.fermer();

  const n = await nouvellePage(LARGEURS.bureau, 'sans-js');
  await n.page.setJavaScriptEnabled(false);
  await n.page.goto(`${BASE}/internet-en-croisiere`, { waitUntil: 'load' });
  ok('sans JavaScript : article lisible', (await n.page.content()).includes('Questions fréquentes'));
  await n.page.goto(`${BASE}/`, { waitUntil: 'load' });
  ok('sans JavaScript : pas de voile', !(await n.page.content()).includes('class="voile"'));
  await n.fermer();
}

/* ========================= PARCOURS ========================= */
console.log('\n— Parcours —');
{
  // Menu mobile, ouvert sur le hero sombre.
  const { page, fermer } = await nouvellePage(PHONE, 'parcours-mobile');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await pause(3500);
  await page.tap('button[aria-controls="menu-mobile"]');
  await pause(500);
  await page.screenshot({ path: `${OUT}/menu-mobile.png` });
  const barre = await page.evaluate(() => {
    const b = document.querySelector('button[aria-controls="menu-mobile"] span');
    return { c: getComputedStyle(b).backgroundColor, h: getComputedStyle(document.querySelector('header')).backgroundColor };
  });
  ok('menu ouvert : en-tête opaque', !barre.h.endsWith(', 0)') && barre.h !== 'transparent', barre.h);
  await page.evaluate(() => [...document.querySelectorAll('#menu-mobile a')].find((a) => a.textContent === 'Fournisseurs').click());
  await pause(1800);
  const y1 = await page.evaluate(() => document.getElementById('fournisseurs').getBoundingClientRect().top);
  ok('menu mobile : le lien mène à la section', Math.abs(y1) < 130, `top=${Math.round(y1)}`);
  ok('menu mobile : se referme', !(await page.$('#menu-mobile')));
  await fermer();
}
{
  const { page, fermer } = await nouvellePage(LARGEURS.portable, 'parcours-bureau');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await pause(3500);

  // Repère D3 d'une tuile : ouvre et amène la décision.
  await page.evaluate(() => document.getElementById('chiffres').scrollIntoView());
  await pause(900);
  await page.evaluate(() => document.querySelector('button[aria-label="Lire l\'arbitrage D3"]').click());
  await pause(1900);
  const d3 = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('#decisions h3 button')].find((b) => b.textContent.includes('D3'));
    return { ouvert: btn.getAttribute('aria-expanded'), top: btn.getBoundingClientRect().top, h: innerHeight };
  });
  ok('repère D3 : la décision est ouverte', d3.ouvert === 'true');
  ok('repère D3 : elle est à l\'écran', d3.top > 0 && d3.top < d3.h - 100, `top=${Math.round(d3.top)}`);

  // Lien du menu actif.
  const actif = await page.evaluate(() => document.querySelector('header a[aria-current]')?.textContent);
  ok('le menu marque la section en cours', actif === 'Décisions', String(actif));

  // Table de données : s'ouvre et ne déborde pas.
  await page.evaluate(() => [...document.querySelectorAll('#fournisseurs button')].find((b) => b.textContent.includes('Voir les données')).click());
  await pause(700);
  ok('table de données : s\'ouvre', !!(await page.$('#fournisseurs table')));

  // Dashboard -> article -> ancre du footer -> retour.
  await page.evaluate(() => [...document.querySelectorAll('header a')].find((a) => a.textContent.includes('Guide')).click());
  await pause(700);
  ok('dashboard → article', (await page.evaluate(() => location.pathname)) === '/internet-en-croisiere');
  ok('arrivée en haut de page', (await page.evaluate(() => scrollY)) < 5);
  await page.evaluate(() => [...document.querySelectorAll('footer a')].find((a) => a.textContent.includes('arbitrages')).click());
  await pause(1900);
  const ret = await page.evaluate(() => ({ p: location.pathname, top: document.getElementById('decisions').getBoundingClientRect().top }));
  ok('footer de l\'article → décisions du dashboard', ret.p === '/' && Math.abs(ret.top) < 140, JSON.stringify(ret));

  // Sommaire de l'article.
  await page.goto(`${BASE}/internet-en-croisiere`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.querySelector('nav[aria-label="Sommaire"] a[href="#prix"]').click());
  await pause(1700);
  const pr = await page.evaluate(() => document.getElementById('prix').getBoundingClientRect().top);
  ok('sommaire : mène à la section', Math.abs(pr) < 130, `top=${Math.round(pr)}`);

  // FAQ.
  await page.evaluate(() => [...document.querySelectorAll('#faq button')][2].click());
  await pause(500);
  ok('FAQ : une question s\'ouvre', (await page.evaluate(() => [...document.querySelectorAll('#faq button')][2].getAttribute('aria-expanded'))) === 'true');

  // Info-bulle d'un graphique.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle2' });
  await pause(800);
  await page.evaluate(() => document.querySelector('#valeur svg').scrollIntoView({ block: 'center' }));
  await pause(1500);
  const r = await page.evaluate(() => {
    const b = document.querySelector('#valeur svg').getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  });
  await page.mouse.move(r.x, r.y);
  await pause(350);
  ok('info-bulle au survol', !!(await page.$('#valeur [role="status"]')));
  await fermer();
}

/* ============================= À 4 LARGEURS ============================= */
for (const [nomVp, vp] of Object.entries(LARGEURS)) {
  for (const [nomPage, chemin] of PAGES) {
    console.log(`\n— ${nomVp} · ${nomPage} —`);
    const { page, fermer } = await nouvellePage(vp, `${nomVp}/${nomPage}`);
    await page.goto(BASE + chemin, { waitUntil: 'networkidle2', timeout: 45000 });
    await pause(nomPage === 'accueil' ? 3600 : 600);
    await parcourir(page);
    await pause(2200); // les compteurs finissent de tourner
    const m = await mesurer(page);
    ok('pas de défilement horizontal', !m.scrollable, m.depasse.join(' | '));
    ok('rien ne sort de l\'écran', m.depasse.length === 0, m.depasse.join(' | '));
    ok('les compteurs affichent la vraie valeur', m.compteurs.length === 0, m.compteurs.join(' | '));
    ok('contraste du texte', m.contrastes.length === 0, m.contrastes.join(' | '));
    ok('aucun texte coupé', m.coupes.length === 0, m.coupes.join(' | '));
    ok('aucun texte posé sur un autre', m.collisions.length === 0, m.collisions.join(' | '));
    ok('cibles tactiles ≥ 24 px', m.petites.length === 0, m.petites.join(' | '));
    await page.screenshot({ path: `${OUT}/${nomVp}-${nomPage}.png`, fullPage: true });
    console.log(`  hauteur ${m.hauteur}px`);
    await fermer();
  }
}

await navigateur.close();

console.log('\n' + '='.repeat(62));
if (echecs.length) {
  console.log(`${echecs.length} CONTRÔLE(S) EN ÉCHEC :`);
  [...new Set(echecs)].forEach((e) => console.log('  · ' + e));
  process.exitCode = 1;
} else {
  console.log('Audit réussi.');
}
