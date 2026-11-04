/*
 * Quality Week 2026 — module Supabase partagé par TOUS les mini-jeux.
 * Emplacement : Game/supabase-score.js
 * Chargement dans un jeu (Game/<Nom du jeu>/index.html), dans cet ordre :
 *   <script src="../../i18n.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
 *   <script src="../../qw-session.js" defer></script>
 *   <script src="../supabase-score.js" defer></script>
 * Utilisation :
 *   const ready = await window.QWScores.boot("quality-crush", { progress: true }); // null si non connecté / indisponible
 *   ready.best                               -> points hub déjà enregistrés
 *   ready.progress                           -> progression du joueur enregistrée dans Supabase (objet) ou null
 *   await ready.scores.saveBestScore(1234)   -> points hub après enregistrement (le serveur garde le maximum)
 *   ready.scores.saveProgress(obj)           -> enregistre la progression dans Supabase (table game_progress)
 *
 * IMPORTANT : la progression (niveaux, étoiles, partie du jour en cours…) est rattachée au COMPTE dans Supabase,
 * jamais au navigateur. Rien ne passe d'un joueur à l'autre sur un PC ou un téléphone partagé.
 *
 * BARÈME COMMUN (points envoyés au hub, environ 5 000 points maximum par jeu sur la semaine) :
 *   Défi du jour          1 000 / jour (200 énigme + 300 pendu + 500 mots croisés)
 *   Quality Crush         40 / 70 / 100 points par niveau réussi (1, 2, 3 étoiles), 50 niveaux
 *   Scénarios qualité     jusqu'à environ 166 points par dossier, 30 dossiers
 *   Quality Run           distance (courbe logarithmique, 5 000 à 100 000 m) + 10 par bonne réponse
 *                         + 1 par 10 ✔, plafonné à 5 000 (meilleure course)
 *
 * LANCEMENT : tant que window.QW_GAMES_OPEN est faux (qw-session.js), boot() affiche « Bientôt disponible ».
 * MODE TEST (window.QW_TEST, activé par ?test=1) : AUCUN appel à Supabase. Scores, progression et Défi du jour
 * sont simulés dans ce navigateur (clés « qw-test:… »). Le testeur n'apparaît donc nulle part en ligne.
 */
(() => {
  "use strict";
  const MAX_SCORE = 2147483647;
  const PROGRESS_TABLE = "game_progress";
  const T = {
    fr: {
      authTitle: "Connexion requise",
      authMsg: "Votre session est absente ou expirée. Connectez-vous pour jouer et enregistrer votre score.",
      authBtn: "Se connecter",
      changedTitle: "Le compte a changé",
      changedMsg: "Un autre compte a été connecté ou la session a été fermée sur cet appareil. Rechargez la page pour afficher les bons résultats.",
      reload: "Recharger",
      errTitle: "Chargement impossible",
      errMsg: "Le service de scores est indisponible. Vérifiez votre connexion puis réessayez.",
      retry: "Réessayer",
      hub: "Retour au hub",
      invalid: "Score invalide.",
      expired: "Session absente ou expirée.",
      soonTitle: "Bientôt disponible",
      soonMsg: "Les jeux ne sont pas encore ouverts. Votre compte est bien créé : revenez le jour du lancement.",
      noProgress: "Progression non enregistrée sur le serveur (table « game_progress » absente). Vos points sont bien enregistrés, mais la progression sera perdue en quittant la page. Prévenez l’organisateur."
    },
    en: {
      authTitle: "Sign-in required",
      authMsg: "Your session is missing or has expired. Sign in to play and save your score.",
      authBtn: "Sign in",
      changedTitle: "The account has changed",
      changedMsg: "Another account was signed in or the session was closed on this device. Reload the page to show the right results.",
      reload: "Reload",
      errTitle: "Unable to load",
      errMsg: "The score service is unavailable. Check your connection and try again.",
      retry: "Try again",
      hub: "Back to hub",
      invalid: "Invalid score.",
      expired: "Session missing or expired.",
      soonTitle: "Coming soon",
      soonMsg: "The games are not open yet. Your account is ready: come back on launch day.",
      noProgress: "Progress is not saved on the server (“game_progress” table missing). Your points are saved, but progress will be lost when you leave the page. Please tell the organizer."
    }
  };
  const tr = (k) => (window.QWI18N ? window.QWI18N.t(T, k) : T.fr[k]);

  const scriptSrc = (document.currentScript && document.currentScript.src) || window.location.href;
  const HUB_URL = new URL("../hub.html", scriptSrc).href;
  const LOGIN_URL = new URL("../index.html", scriptSrc).href;

  const TEST = window.QW_TEST === true;

  /* ---------- Mode test : stockage local uniquement (rien n'est envoyé à Supabase) ---------- */
  const TKEY = k => "qw-test:" + k;
  const tGet = (k, d) => { try { const v = localStorage.getItem(TKEY(k)); return v === null ? d : JSON.parse(v); } catch { return d; } };
  const tSet = (k, v) => { try { localStorage.setItem(TKEY(k), JSON.stringify(v)); } catch { /* stockage indisponible */ } };
  const parisDay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const DAILY_MAX = { 1: 200, 2: 300, 3: 500 };
  // Réplique locale des fonctions serveur utilisées par les jeux (Défi du jour + meilleur score).
  async function testRpc(name, args = {}) {
    const D = tGet("daily", { plays: [] }), day = parisDay();
    const today = D.plays.filter(p => p.day === day);
    const total = () => D.plays.filter(p => p.finished).reduce((a, p) => a + (Number(p.score) || 0), 0);
    const store = () => { tSet("daily", D); tSet("best:daily", total()); };
    if (name === "get_daily_state") {
      const counts = {};
      for (const lv of [1, 2, 3]) { const c = new Array(15).fill(0); D.plays.filter(p => p.level === lv).forEach(p => { if (p.item >= 0 && p.item < 15) c[p.item]++; }); counts[lv] = c; }
      return { date: day, total: total(), counts, today: today.map(p => ({ level: p.level, item: p.item, score: p.score, finished: p.finished })) };
    }
    if (name === "start_daily_level") {
      const lv = Number(args.p_level);
      if (lv > 1 && !today.some(p => p.level === lv - 1 && p.finished)) throw new Error("LEVEL_LOCKED");
      let p = today.find(x => x.level === lv);
      if (!p) { p = { day, level: lv, item: Number(args.p_item) || 0, score: 0, finished: false }; D.plays.push(p); store(); }
      return { item: p.item, score: p.score, finished: p.finished };
    }
    if (name === "finish_daily_level") {
      const lv = Number(args.p_level), p = today.find(x => x.level === lv);
      if (!p) throw new Error("LEVEL_LOCKED");
      if (!p.finished) { p.score = Math.max(0, Math.min(DAILY_MAX[lv] || 0, Math.round(Number(args.p_score) || 0))); p.finished = true; store(); }
      return { total: total(), score: p.score };
    }
    if (name === "save_best_score") return testGame(args.p_game_id).saveBestScore(args.p_score);
    throw new Error("Fonction non simulée en mode test : " + name);
  }
  function testGame(gameId) {
    return Object.freeze({
      gameId,
      requireSession: async () => null,
      loadBestScore: async () => Number(tGet("best:" + gameId, 0)) || 0,
      saveBestScore: async score => {
        const n = Number(score);
        if (!Number.isInteger(n) || n < 0) throw new Error(tr("invalid"));
        const best = Math.max(n, Number(tGet("best:" + gameId, 0)) || 0);
        tSet("best:" + gameId, best);
        return best;
      },
      loadProgress: async () => { const d = tGet("progress:" + gameId, null); return d && typeof d === "object" && !Array.isArray(d) ? d : null; },
      saveProgress: obj => { try { tSet("progress:" + gameId, JSON.parse(JSON.stringify(obj))); } catch { /* rien */ } },
      flushProgress: () => Promise.resolve()
    });
  }

  if (!window.QWSession && !TEST) {
    console.error("qw-session.js (ou supabase-js) n'est pas chargé avant supabase-score.js.");
    window.QWScores = null;
    return;
  }
  const client = window.QWSession ? window.QWSession.client : null;

  /* Compte verrouillé au chargement de la page : tout enregistrement est refusé si la session
     appartient ensuite à un autre joueur (évite d'écrire les résultats de A sur le compte de B). */
  let lockedUserId = null;

  function checkScore(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > MAX_SCORE) throw new Error(tr("invalid"));
    return n;
  }
  async function requireSession() {
    const user = await window.QWSession.getUser();
    if (!user) {
      const authError = new Error(tr("expired"));
      authError.code = "AUTH_REQUIRED";
      throw authError;
    }
    if (lockedUserId && user.id !== lockedUserId) {
      const changed = new Error("Compte modifié.");
      changed.code = "AUTH_CHANGED";
      onAccountChanged();
      throw changed;
    }
    return user;
  }
  async function rpc(name, args = {}) {
    if (TEST) return testRpc(name, args);
    await requireSession();
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  }

  // Score non confirmé (coupure réseau…) : gardé pour CE compte uniquement et renvoyé au prochain chargement.
  // Ces clés sont effacées à la déconnexion (QWSession.signOut).
  const pendingKey = (userId, gameId) => `qw-pending:${userId}:${gameId}`;
  function readPending(key) {
    try { const v = Number(localStorage.getItem(key)); return Number.isInteger(v) && v > 0 ? v : 0; } catch { return 0; }
  }
  function writePending(key, value) {
    try { localStorage.setItem(key, String(Math.max(readPending(key), value))); } catch { /* stockage indisponible */ }
  }
  function clearPending(key) {
    try { localStorage.removeItem(key); } catch { /* stockage indisponible */ }
  }

  let progressAvailable = true;
  const syncing = new Set();
  const instances = new Map();
  function forGame(gameId) {
    if (!/^[a-z0-9-]{2,40}$/.test(gameId)) throw new Error("Identifiant de jeu invalide.");
    if (instances.has(gameId)) return instances.get(gameId);
    if (TEST) { const api = testGame(gameId); instances.set(gameId, api); return api; }
    let queue = Promise.resolve();
    async function rpcSave(score) {
      const { data, error } = await client.rpc("save_best_score", { p_game_id: gameId, p_score: score });
      if (error) throw error;
      return checkScore(data);
    }
    async function loadBestScore() {
      const user = await requireSession();
      const key = pendingKey(user.id, gameId);
      const pending = readPending(key);
      if (pending) {
        try { await rpcSave(pending); clearPending(key); } catch (e) { console.warn("Score en attente non renvoyé :", e); }
      }
      const { data, error } = await client.from("scores")
        .select("score").eq("user_id", user.id).eq("game_id", gameId).maybeSingle();
      if (error) throw error;
      return data ? checkScore(data.score) : 0;
    }
    function saveBestScore(score) {
      const value = checkScore(score);
      const run = async () => {
        const user = await requireSession();
        const key = pendingKey(user.id, gameId);
        try {
          const saved = await rpcSave(value);
          clearPending(key);
          return saved;
        } catch (error) {
          writePending(key, value);
          throw error;
        }
      };
      const result = queue.then(run, run);
      queue = result.catch(() => {});
      return result;
    }

    /* ---------- Progression rattachée au compte (table game_progress) ---------- */
    async function loadProgress() {
      const user = await requireSession();
      const { data, error } = await client.from(PROGRESS_TABLE)
        .select("data").eq("user_id", user.id).eq("game_id", gameId).maybeSingle();
      if (error) throw error;
      const d = data && data.data;
      return d && typeof d === "object" && !Array.isArray(d) ? d : null;
    }
    // Enregistrement groupé : la dernière version gagne, une seule requête à la fois.
    let latest = null, chain = Promise.resolve(), timer = 0;
    function flushProgress() {
      clearTimeout(timer); timer = 0;
      if (!progressAvailable || latest === null) return chain;
      chain = chain.then(async () => {
        if (latest === null) return;
        const body = latest; latest = null;
        try {
          const user = await requireSession();
          const { error } = await client.from(PROGRESS_TABLE)
            .upsert({ user_id: user.id, game_id: gameId, data: body, updated_at: new Date().toISOString() }, { onConflict: "user_id,game_id" });
          if (error) throw error;
        } catch (e) {
          if (e && e.code === "AUTH_CHANGED") return;
          console.error("Progression non enregistrée :", e);
          if (latest === null) latest = body;            // réessai au prochain enregistrement
        } finally {
          if (latest === null) syncing.delete(gameId);
        }
      });
      return chain;
    }
    function saveProgress(obj) {
      if (!progressAvailable) return;
      try { latest = JSON.parse(JSON.stringify(obj)); } catch { return; }
      syncing.add(gameId);
      clearTimeout(timer);
      timer = setTimeout(flushProgress, 400);
    }

    const api = Object.freeze({ gameId, requireSession, loadBestScore, saveBestScore, loadProgress, saveProgress, flushProgress });
    instances.set(gameId, api);
    return api;
  }

  // Envoi immédiat des progressions en attente quand la page est masquée ou quittée.
  const flushAll = () => instances.forEach(api => api.flushProgress());
  document.addEventListener("visibilitychange", () => { if (document.hidden) flushAll(); });
  window.addEventListener("pagehide", flushAll);

  function showBlocking({ title, message, buttonLabel, onClick, secondaryLabel, onSecondary }) {
    let box = document.getElementById("qw-blocking");
    if (!box) {
      box = document.createElement("div");
      box.id = "qw-blocking";
      box.setAttribute("role", "alertdialog");
      box.setAttribute("aria-modal", "true");
      box.setAttribute("aria-labelledby", "qw-blocking-title");
      box.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.82);font-family:Arial,Helvetica,sans-serif";
      document.body.appendChild(box);
    }
    box.innerHTML = "";
    const card = document.createElement("div");
    card.style.cssText = "max-width:440px;width:100%;background:#fff;color:#000;border-radius:16px;padding:26px;text-align:center;border-top:6px solid #FFB500";
    const h = document.createElement("h2"); h.id = "qw-blocking-title"; h.textContent = title; h.style.margin = "0 0 10px";
    const p = document.createElement("p"); p.textContent = message; p.style.cssText = "margin:0 0 18px;line-height:1.5";
    const btnCss = "min-height:48px;margin:4px;padding:10px 20px;border:2px solid #000;border-radius:10px;font:700 16px Arial,sans-serif;cursor:pointer;";
    const b = document.createElement("button"); b.type = "button"; b.textContent = buttonLabel; b.style.cssText = btnCss + "background:#FFB500;color:#000";
    b.addEventListener("click", onClick);
    card.append(h, p, b);
    if (secondaryLabel) {
      const b2 = document.createElement("button"); b2.type = "button"; b2.textContent = secondaryLabel; b2.style.cssText = btnCss + "background:#fff;color:#000";
      b2.addEventListener("click", onSecondary);
      card.append(b2);
    }
    box.append(card);
    b.focus();
  }
  function hideBlocking() {
    const box = document.getElementById("qw-blocking");
    if (box) box.remove();
  }
  function showNotice(message) {
    const n = document.createElement("div");
    n.setAttribute("role", "status");
    n.style.cssText = "position:fixed;left:10px;right:10px;bottom:10px;z-index:9500;max-width:640px;margin:auto;padding:12px 40px 12px 14px;background:#fff6dd;color:#000;border:2px solid #000;border-left:8px solid #FFB500;border-radius:10px;font:600 14px/1.4 Arial,sans-serif;box-shadow:0 6px 20px #0005";
    n.textContent = message;
    const x = document.createElement("button");
    x.type = "button"; x.textContent = "✕"; x.setAttribute("aria-label", "OK");
    x.style.cssText = "position:absolute;top:6px;right:6px;min-width:32px;min-height:32px;border:0;background:transparent;font:800 16px Arial;cursor:pointer";
    x.addEventListener("click", () => n.remove());
    n.append(x);
    document.body.append(n);
  }
  let changedShown = false;
  function onAccountChanged() {
    if (changedShown) return;
    changedShown = true;
    if (window.QWI18N) window.QWI18N.setGuard(null);
    showBlocking({ title: tr("changedTitle"), message: tr("changedMsg"), buttonLabel: tr("reload"), onClick: () => window.location.reload() });
  }
  function showLoadError(error, customMessage) {
    console.error(error);
    if (error && error.code === "AUTH_CHANGED") return;
    if (error && error.code === "AUTH_REQUIRED") {
      showBlocking({ title: tr("authTitle"), message: tr("authMsg"), buttonLabel: tr("authBtn"), onClick: () => window.location.replace(LOGIN_URL) });
    } else {
      showBlocking({
        title: tr("errTitle"), message: customMessage || tr("errMsg"),
        buttonLabel: tr("retry"), onClick: () => window.location.reload(),
        secondaryLabel: tr("hub"), onSecondary: () => window.location.assign(HUB_URL)
      });
    }
  }

  async function boot(gameId, options = {}) {
    const scores = forGame(gameId);
    if (TEST) {
      const best = await scores.loadBestScore();
      const progress = options.progress ? await scores.loadProgress() : null;
      hideBlocking();
      return { scores, best, user: null, progress, progressAvailable: true, test: true };
    }
    if (!window.QW_GAMES_OPEN) {
      showBlocking({ title: tr("soonTitle"), message: tr("soonMsg"), buttonLabel: tr("hub"), onClick: () => window.location.assign(HUB_URL) });
      return null;
    }
    try {
      const user = await scores.requireSession();
      lockedUserId = user.id;
      window.QWSession.watch(user.id, onAccountChanged);
      const best = await scores.loadBestScore();
      let progress = null;
      if (options.progress) {
        try { progress = await scores.loadProgress(); }
        catch (e) {
          // Table absente (supabase-progress.sql non exécuté) : le jeu reste jouable, sans sauvegarde de progression.
          console.error("Progression indisponible :", e);
          progressAvailable = false;
          showNotice(tr("noProgress"));
        }
      }
      hideBlocking();
      return { scores, best, user, progress, progressAvailable };
    } catch (error) {
      showLoadError(error);
      return null;
    }
  }

  window.QWScores = Object.freeze({
    forGame, boot, rpc, requireSession: TEST ? async () => null : requireSession, isTest: () => TEST, showBlocking, hideBlocking, showLoadError, HUB_URL, LOGIN_URL,
    isSyncing: () => syncing.size > 0
  });
})();
