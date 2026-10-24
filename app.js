// Site Renaissance Roleplay (v2) : liens, navigation, apparitions, pluie et orage réalistes, son d'ambiance.

const LIENS = {
  discord: 'https://discord.gg/K6rYRdWQD',
  bd: 'https://tamalou70.github.io/heritage-38eme-parallele/',
};

const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;
// ?capture : page entière figée pour une capture d'écran (héros de 900 px, tout déjà affiché)
if (new URLSearchParams(location.search).has('capture')) document.documentElement.classList.add('capture');
const hasard = (a, b) => a + Math.random() * (b - a);

// ---------- Liens ----------
document.querySelectorAll('[data-lien]').forEach(a => {
  const url = LIENS[a.dataset.lien];
  if (!url) { a.classList.add('indisponible'); a.removeAttribute('href'); return; }
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
});
document.querySelectorAll('[data-detail]').forEach(el => {
  const url = LIENS[el.dataset.detail];
  if (url) el.textContent = url.replace(/^https?:\/\//, '');
});

// ---------- Navigation : fond plein dès qu'on quitte le haut ----------
const nav = document.getElementById('nav');
const majNav = () => nav.classList.toggle('pleine', scrollY > 40);
addEventListener('scroll', majNav, { passive: true });
majNav();

// ---------- Apparition au défilement ----------
const obs = new IntersectionObserver(entrees => {
  for (const e of entrees) if (e.isIntersecting) { e.target.classList.add('vu'); obs.unobserve(e.target); }
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.revele').forEach(el => obs.observe(el));

// ---------- Son : pluie continue et tonnerre (synthétisés, aucun fichier) ----------
const Son = (() => {
  let ctx = null, maitre = null, actif = false;
  const bouton = document.getElementById('son');

  function tampon(secondes, type) {
    const n = Math.floor(ctx.sampleRate * secondes), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      let brun = 0, b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < n; i++) {
        const blanc = Math.random() * 2 - 1;
        if (type === 'brun') { brun = (brun + 0.02 * blanc) / 1.02; d[i] = brun * 3.5; }
        else if (type === 'rose') {
          b0 = 0.99765 * b0 + blanc * 0.099; b1 = 0.963 * b1 + blanc * 0.2965; b2 = 0.57 * b2 + blanc * 1.0526;
          d[i] = (b0 + b1 + b2 + blanc * 0.1848) * 0.18;
        } else d[i] = blanc;
      }
    }
    return b;
  }

  function pluie() {
    // deux couches : le chuintement général et le crépitement plus aigu des gouttes proches
    for (const [type, bas, haut, vol] of [['rose', 300, 2500, 0.55], ['blanc', 3000, 9000, 0.05]]) {
      const s = ctx.createBufferSource(); s.buffer = tampon(6, type); s.loop = true;
      const f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = bas;
      const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = haut;
      const g = ctx.createGain(); g.gain.value = vol;
      s.connect(f1).connect(f2).connect(g).connect(maitre); s.start();
    }
  }

  // distance de 0 (proche) à 1 (lointain) : plus c'est loin, plus c'est sourd, faible et étalé
  function tonnerre(distance) {
    if (!ctx || !actif) return;
    const t = ctx.currentTime, force = 1 - distance * 0.6;
    if (distance < 0.45) {
      const c = ctx.createBufferSource(); c.buffer = tampon(0.6, 'blanc');
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * force, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      c.connect(f).connect(g).connect(maitre); c.start(t);
    }
    const r = ctx.createBufferSource(); r.buffer = tampon(9, 'brun');
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260 - distance * 160;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    let tt = t + 0.05 + distance * 0.3;
    g.gain.exponentialRampToValueAtTime(1.3 * force, tt);
    for (let i = 0; i < 5; i++) { // grondements successifs
      tt += hasard(0.4, 1.1);
      g.gain.exponentialRampToValueAtTime(hasard(0.25, 0.9) * force, tt);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, tt + 3);
    r.connect(f).connect(g).connect(maitre); r.start(t);
  }

  bouton.addEventListener('click', () => {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
      maitre = ctx.createGain(); maitre.gain.value = 0; maitre.connect(ctx.destination);
      pluie();
    }
    actif = !actif;
    bouton.setAttribute('aria-pressed', String(actif));
    maitre.gain.cancelScheduledValues(ctx.currentTime);
    maitre.gain.setTargetAtTime(actif ? 0.5 : 0, ctx.currentTime, 0.4);
    if (actif) ctx.resume();
  });
  document.addEventListener('visibilitychange', () => { if (ctx) document.hidden ? ctx.suspend() : actif && ctx.resume(); });
  return { tonnerre };
})();

// ---------- Ambiance du héros : pluie en profondeur et orage ----------
(() => {
  if (calme) return;
  const heros = document.querySelector('.heros');
  const cLoin = document.getElementById('pluie-loin'), cPres = document.getElementById('pluie-pres');
  const cEclair = document.getElementById('eclair');
  const eclairee = document.getElementById('eclairee'), lueur = document.getElementById('lueur');
  const gLoin = cLoin.getContext('2d'), gPres = cPres.getContext('2d'), gEclair = cEclair.getContext('2d');
  let w = 0, h = 0, ratio = 1, visible = true;
  let couches = [];
  let lumiere = 0; // intensité de l'éclair en cours (0 à 1), éclaire aussi la pluie

  // Trois profondeurs de pluie : loin (fine, lente, pâle), milieu, près (longue, rapide, floue)
  const PROFONDEURS = [
    { toile: 'loin', densite: 1 / 2600, vitesse: [9, 13], longueur: [7, 13], epaisseur: 0.6, alpha: 0.16 },
    { toile: 'loin', densite: 1 / 7000, vitesse: [16, 22], longueur: [16, 26], epaisseur: 0.9, alpha: 0.22 },
    { toile: 'pres', densite: 1 / 40000, vitesse: [30, 40], longueur: [45, 80], epaisseur: 1.6, alpha: 0.14 },
  ];

  function taille() {
    ratio = Math.min(devicePixelRatio || 1, 2);
    w = heros.clientWidth; h = heros.clientHeight;
    for (const c of [cLoin, cPres, cEclair]) { c.width = w * ratio; c.height = h * ratio; c.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0); }
    couches = PROFONDEURS.map(p => ({ ...p, gouttes: Array.from({ length: Math.round(w * h * p.densite) }, () => goutte(p, true)) }));
  }
  function goutte(p, partout) {
    return { x: hasard(-100, w + 100), y: partout ? hasard(-h, h) : hasard(-200, -20), v: hasard(...p.vitesse), l: hasard(...p.longueur) };
  }
  addEventListener('resize', taille);
  taille();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(heros);

  // vent : léger, avec des rafales lentes
  const vent = t => 0.1 + Math.sin(t / 5200) * 0.05 + Math.sin(t / 1700) * 0.02;

  function pluie(t) {
    gLoin.clearRect(0, 0, w, h); gPres.clearRect(0, 0, w, h);
    const v = vent(t), bonus = 1 + lumiere * 2.2;
    for (const c of couches) {
      const g = c.toile === 'loin' ? gLoin : gPres;
      g.lineWidth = c.epaisseur; g.lineCap = 'round';
      // queue pâle puis tête plus nette : deux passes par couche (rapide, une seule trace chacune)
      for (const [part, a] of [[1, 0.45], [0.45, 1]]) {
        g.strokeStyle = `rgba(214, 222, 240, ${Math.min(1, c.alpha * a * bonus)})`;
        g.beginPath();
        for (const d of c.gouttes) {
          const dx = d.l * v, x2 = d.x + dx, y2 = d.y + d.l;
          g.moveTo(x2 - dx * part, y2 - d.l * part); g.lineTo(x2, y2);
        }
        g.stroke();
      }
      for (const d of c.gouttes) {
        d.y += d.v; d.x += d.v * v;
        if (d.y > h) Object.assign(d, goutte(c, false));
      }
    }
  }

  // ----- Éclair : tracé fractal (déplacement du point milieu), ramifications, halo -----
  function segment(x1, y1, x2, y2, ecart, pts) {
    const lon = Math.hypot(x2 - x1, y2 - y1);
    if (lon < 5) { pts.push([x2, y2]); return; }
    const nx = -(y2 - y1) / lon, ny = (x2 - x1) / lon, d = (Math.random() - 0.5) * ecart;
    const mx = (x1 + x2) / 2 + nx * d, my = (y1 + y2) / 2 + ny * d;
    segment(x1, y1, mx, my, ecart / 2, pts);
    segment(mx, my, x2, y2, ecart / 2, pts);
  }
  function chemin(x1, y1, x2, y2, rugosite) {
    const pts = [[x1, y1]];
    segment(x1, y1, x2, y2, Math.hypot(x2 - x1, y2 - y1) * rugosite, pts);
    return pts;
  }
  function ramifier(pts, profondeur, sortie) {
    const n = Math.round(hasard(3, 7) / (profondeur + 1));
    for (let i = 0; i < n; i++) {
      const k = Math.floor(hasard(0.12, 0.8) * pts.length), [x, y] = pts[k];
      const [px, py] = pts[Math.max(0, k - 4)];
      const dir = Math.atan2(y - py, x - px) + (Math.random() < 0.5 ? -1 : 1) * hasard(0.35, 0.9);
      const lon = hasard(0.08, 0.28) * h * (1 - k / pts.length) / (profondeur + 1);
      const br = chemin(x, y, x + Math.cos(dir) * lon, y + Math.sin(dir) * lon, 0.45);
      sortie.push({ pts: br, largeur: 1.3 / (profondeur + 1.4), alpha: 0.55 / (profondeur + 1) });
      if (profondeur < 1 && Math.random() < 0.6) ramifier(br, profondeur + 1, sortie);
    }
  }
  function dessiner(g, branches) {
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const passe of [
      { mult: 9, flou: 40, couleur: 'rgba(140, 120, 255, A)', a: 0.10 },
      { mult: 3.5, flou: 14, couleur: 'rgba(190, 180, 255, A)', a: 0.35 },
      { mult: 1, flou: 4, couleur: 'rgba(255, 255, 255, A)', a: 1 },
    ]) {
      for (const b of branches) {
        g.shadowBlur = passe.flou; g.shadowColor = 'rgba(170, 150, 255, 0.9)';
        g.strokeStyle = passe.couleur.replace('A', String(passe.a * b.alpha));
        g.lineWidth = b.largeur * passe.mult;
        g.beginPath(); g.moveTo(...b.pts[0]);
        for (const p of b.pts) g.lineTo(...p);
        g.stroke();
      }
    }
    g.shadowBlur = 0; g.globalCompositeOperation = 'source-over';
  }

  // Courbe d'intensité d'un vrai coup de foudre : traceur faible, arc principal, puis réamorçages
  const COURBE_FOUDRE = [[0, 0], [30, 0.25], [55, 1], [95, 0.18], [140, 0.85], [185, 0.12], [240, 0.6], [300, 0.08], [520, 0]];
  const COURBE_NUAGE = [[0, 0], [60, 0.5], [120, 0.15], [200, 0.4], [320, 0.05], [600, 0]];
  const intensite = (courbe, t) => {
    for (let i = 1; i < courbe.length; i++) {
      const [t0, v0] = courbe[i - 1], [t1, v1] = courbe[i];
      if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
    }
    return 0;
  };

  // ?orage dans l'adresse : coups de foudre rapprochés, pour régler l'effet
  const TEST = new URLSearchParams(location.search).has('orage');
  const FIGE = new URLSearchParams(location.search).get('orage') === 'fige'; // image arrêtée au pic de l'éclair
  let orage = null; // { debut, courbe, toile, x }
  function declencher(t) {
    const foudre = TEST || Math.random() < 0.6;
    const x = (w > 760 ? hasard(0.46, 0.92) : hasard(0.15, 0.9)) * w; // grand écran : pas derrière le texte
    let toile = null;
    if (foudre) {
      const sol = hasard(0.42, 0.62) * h;
      const principal = chemin(x, -10, x + hasard(-0.12, 0.12) * w, sol, 0.32);
      const branches = [{ pts: principal, largeur: 2.2, alpha: 1 }];
      ramifier(principal, 0, branches);
      toile = document.createElement('canvas');
      toile.width = w * ratio; toile.height = h * ratio;
      const g = toile.getContext('2d'); g.setTransform(ratio, 0, 0, ratio, 0, 0);
      dessiner(g, branches);
      toile.sol = sol;
    }
    orage = { debut: t, courbe: foudre ? COURBE_FOUDRE : COURBE_NUAGE, toile, x, foudre };
    lueur.style.setProperty('--x', `${(x / w) * 100}%`);
    const distance = foudre ? hasard(0, 0.6) : hasard(0.5, 1);
    setTimeout(() => Son.tonnerre(distance), 250 + distance * 2800);
    prochain = t + (TEST ? 1800 : hasard(7000, 17000));
  }

  function eclairs(t) {
    gEclair.clearRect(0, 0, w, h);
    lumiere = 0;
    if (!orage) return;
    const dt = FIGE ? 140 : t - orage.debut, fin = orage.courbe[orage.courbe.length - 1][0];
    if (dt > fin) { orage = null; eclairee.style.opacity = 0; lueur.style.opacity = 0; return; }
    lumiere = intensite(orage.courbe, dt);
    if (orage.toile) {
      // le traceur descend d'abord, faiblement ; ensuite tout le canal s'allume d'un coup
      const descente = Math.min(1, dt / 55);
      gEclair.save();
      gEclair.globalAlpha = Math.min(1, lumiere * 1.15);
      gEclair.beginPath(); gEclair.rect(0, 0, w, h * descente); gEclair.clip();
      gEclair.drawImage(orage.toile, 0, 0, w, h);
      gEclair.restore();
    }
    eclairee.style.opacity = (lumiere * (orage.foudre ? 0.55 : 0.32)).toFixed(3);
    lueur.style.opacity = (lumiere * 0.9).toFixed(3);
  }

  let prochain = performance.now() + (FIGE ? 0 : 2500);
  (function boucle(t) {
    requestAnimationFrame(boucle);
    if (!visible || document.hidden) return;
    if (!orage && t > prochain) declencher(t);
    eclairs(t);
    pluie(t);
  })(performance.now());
})();
