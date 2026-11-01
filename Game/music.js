/*
 * Quality Week 2026 — barre « confort » partagée : musique + accessibilité.
 *
 * MUSIQUE LIBRE DE DROITS : chaque morceau est composé dans ce fichier (accords, mélodie,
 * tempo) et joué par le navigateur (Web Audio). Aucun fichier audio, aucune œuvre existante :
 * pas de droits d'auteur. Un morceau différent par page :
 *   hub · crush · run · scenarios · daily
 *
 * Chargement :
 *   hub  : <script src="./Game/music.js" data-track="hub" defer></script>
 *   jeux : <script src="../music.js" data-track="crush" defer></script>
 * Les boutons s'insèrent dans #qw-music-slot s'il existe, sinon en bas à gauche.
 *
 * ACCESSIBILITÉ (préférences mémorisées et partagées entre toutes les pages) :
 *   « A+ » : texte et boutons agrandis (éléments portant la classe .qw-z)
 *   « Animations » : coupe les animations (mouvements, clignotements)
 * API : QWMusic.play(), QWMusic.stop(), QWMusic.toggle(), QWMusic.isOn()
 */
(() => {
  "use strict";
  const script = document.currentScript;
  const TRACK = (script && script.dataset.track) || "hub";
  const lang = (window.QWI18N && window.QWI18N.lang) || "fr";
  const TXT = lang === "en"
    ? { on: "♪ Music: on", off: "♪ Music: off", big: "A+ Larger text", calm: "Animations: off", anim: "Animations: on", bar: "Comfort settings" }
    : { on: "♪ Musique : oui", off: "♪ Musique : non", big: "A+ Texte agrandi", calm: "Animations : non", anim: "Animations : oui", bar: "Réglages de confort" };

  /* ---------- Préférences ---------- */
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === "1"; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v ? "1" : "0"); } catch { /* rien */ } };
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let on = get("qw-music", false), big = get("qw-big", false), calm = get("qw-calm", prefersReduced);

  const style = document.createElement("style");
  style.textContent = `
    html.qw-large .qw-z{zoom:1.18}
    html.qw-calm *,html.qw-calm *::before,html.qw-calm *::after{animation-duration:.01s!important;animation-iteration-count:1!important;transition-duration:.01s!important;scroll-behavior:auto!important}
    .qw-bar{display:inline-flex;gap:6px;flex-wrap:wrap;align-items:center}
    .qw-bar.qw-float{position:fixed;left:10px;bottom:10px;z-index:9000}
    .qw-bar button{min-height:44px;padding:8px 14px;border:2px solid #000;border-radius:999px;background:#fff;color:#000;font:800 13px/1.1 Arial,Helvetica,sans-serif;cursor:pointer;box-shadow:0 2px 8px #0003}
    .qw-bar button[aria-pressed="true"]{background:#FFB500}
    .qw-bar button:focus-visible{outline:3px solid #FFB500;outline-offset:2px}`;
  document.head.appendChild(style);
  const applyPrefs = () => {
    document.documentElement.classList.toggle("qw-large", big);
    document.documentElement.classList.toggle("qw-calm", calm);
  };
  applyPrefs();

  /* ---------- Morceaux ---------- */
  // Notes MIDI (60 = do central). null = silence. Une mesure = 8 croches.
  const SONGS = {
    hub: { // accueil : calme et lumineux, do majeur
      bpm: 92, lead: "triangle", pad: "sine", arp: true,
      chords: [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [55, 59, 62]]],
      melody: [[72, null, 74, null, 76, null, 79, null], [76, null, 72, null, 69, null, null, null],
               [69, null, 72, null, 77, null, 76, 74], [74, null, null, null, 71, null, 67, null]]
    },
    crush: { // Quality Crush : sautillant, fa majeur
      bpm: 128, lead: "square", pad: "triangle", arp: true,
      chords: [[41, [57, 60, 65]], [38, [57, 62, 65]], [46, [58, 62, 65]], [48, [60, 64, 67]]],
      melody: [[77, 77, 81, null, 79, 77, 76, null], [74, null, 77, null, 81, 79, 77, null],
               [74, 77, 82, null, 81, null, 79, 77], [76, null, 79, null, 84, null, null, null]]
    },
    run: { // Quality Run : rythmé, la mineur
      bpm: 150, lead: "sawtooth", pad: "square", arp: false, pulse: true,
      chords: [[45, [57, 60, 64]], [41, [53, 57, 60]], [43, [55, 59, 62]], [40, [52, 56, 59]]],
      melody: [[69, null, 72, 69, 76, null, 74, 72], [72, null, 69, null, 65, null, 69, null],
               [71, null, 74, 71, 79, null, 77, 74], [76, null, 75, null, 76, null, null, null]]
    },
    scenarios: { // Scénarios : enquête, ré mineur, feutré
      bpm: 84, lead: "sine", pad: "sine", arp: true, sparse: true,
      chords: [[38, [50, 53, 57]], [34, [50, 53, 58]], [43, [50, 55, 58]], [33, [49, 52, 57]]],
      melody: [[74, null, null, 77, null, null, 76, null], [74, null, null, null, 70, null, null, null],
               [67, null, 70, null, 74, null, 72, null], [73, null, null, null, 69, null, null, null]]
    },
    daily: { // Défi du jour : jeu-questionnaire léger, sol majeur
      bpm: 110, lead: "triangle", pad: "sine", arp: true,
      chords: [[43, [55, 59, 62]], [40, [55, 59, 64]], [36, [55, 60, 64]], [38, [54, 57, 62]]],
      melody: [[79, null, 83, 81, 79, null, 74, null], [76, 79, null, 76, 74, null, 71, null],
               [72, null, 76, 79, 81, null, 79, 76], [78, null, 74, null, 81, null, null, null]]
    }
  };
  const SONG = SONGS[TRACK] || SONGS.hub;
  const STEP = 60 / SONG.bpm / 2, BEAT = STEP * 2;
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);

  let ctx = null, master = null, timer = 0, nextTime = 0, step = 0;
  function note(freq, start, dur, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(master); o.start(start); o.stop(start + dur + 0.05);
  }
  function schedule() {
    while (nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % SONG.chords.length, pos = step % 8;
      const [bass, chord] = SONG.chords[bar];
      if (SONG.pulse) { if (pos % 2 === 0) note(hz(bass), nextTime, STEP * 1.6, "triangle", 0.2); }
      else if (pos === 0 || pos === 4) note(hz(bass), nextTime, BEAT * 1.8, "triangle", 0.2);
      if (pos === 0) chord.forEach(n => note(hz(n), nextTime, BEAT * 3.6, SONG.pad, SONG.pad === "square" ? 0.012 : 0.045));
      if (SONG.arp && (!SONG.sparse || pos % 2 === 0)) note(hz(chord[pos % 3] + 12), nextTime, STEP * 0.9, "triangle", 0.03);
      if (SONG.pulse && (pos === 2 || pos === 6)) note(2000, nextTime, 0.03, "square", 0.012); // charleston
      const m = SONG.melody[bar][pos];
      if (m) note(hz(m), nextTime, STEP * 1.7, SONG.lead, SONG.lead === "sine" || SONG.lead === "triangle" ? 0.06 : 0.02);
      nextTime += STEP; step++;
    }
  }
  function play() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.7;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400;
      master.connect(lp); lp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    clearInterval(timer); nextTime = ctx.currentTime + 0.08; timer = setInterval(schedule, 60);
  }
  function stop() { clearInterval(timer); timer = 0; if (ctx && ctx.state === "running") ctx.suspend(); }
  function setOn(v) { on = v; set("qw-music", on); if (on) play(); else stop(); render(); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (timer) stop(); } else if (on && ctx) play(); });

  /* ---------- Barre de boutons ---------- */
  let bMusic, bBig, bCalm;
  function render() {
    if (!bMusic) return;
    bMusic.textContent = on ? TXT.on : TXT.off; bMusic.setAttribute("aria-pressed", String(on));
    bBig.textContent = TXT.big; bBig.setAttribute("aria-pressed", String(big));
    bCalm.textContent = calm ? TXT.calm : TXT.anim; bCalm.setAttribute("aria-pressed", String(calm));
  }
  function mk(fn) { const b = document.createElement("button"); b.type = "button"; b.addEventListener("click", fn); return b; }
  function mount() {
    const slot = document.getElementById("qw-music-slot");
    const bar = document.createElement("div");
    bar.className = "qw-bar" + (slot ? "" : " qw-float");
    bar.setAttribute("role", "group"); bar.setAttribute("aria-label", TXT.bar);
    bMusic = mk(() => setOn(!on));
    bBig = mk(() => { big = !big; set("qw-big", big); applyPrefs(); render(); });
    bCalm = mk(() => { calm = !calm; set("qw-calm", calm); applyPrefs(); render(); });
    bar.append(bMusic, bBig, bCalm);
    (slot || document.body).appendChild(bar);
    render();
    // Le son ne peut démarrer qu'après une action du joueur.
    if (on) {
      const resume = () => { if (on && !timer) play(); };
      document.addEventListener("pointerdown", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();

  window.QWMusic = Object.freeze({ play: () => setOn(true), stop: () => setOn(false), toggle: () => setOn(!on), isOn: () => on, isCalm: () => calm });
})();
