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
 *   Scénarios qualité     jusqu'à 500 points par dossier, 10 meilleurs dossiers
 *   Quality Run           score de la meilleure course ÷ 3, plafonné à 5 000
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
      noProgress: "Progress is not saved on the server (“game_progress” table missing). Your points are saved, but progress will be lost when you leave the page. Please tell the organizer."
    }
  };
  const tr = (k) => (window.QWI18N ? window.QWI18N.t(T, k) : T.fr[k]);

  const scriptSrc = (document.currentScript && document.currentScript.src) || window.location.href;
  const HUB_URL = new URL("../hub.html", scriptSrc).href;
  const LOGIN_URL = new URL("../index.html", scriptSrc).href;

  if (!window.QWSession) {
    console.error("qw-session.js (ou supabase-js) n'est pas chargé avant supabase-score.js.");
    window.QWScores = null;
    return;
  }
  const client = window.QWSession.client;

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
    forGame, boot, rpc, requireSession, showBlocking, hideBlocking, showLoadError, HUB_URL, LOGIN_URL,
    isSyncing: () => syncing.size > 0
  });
})();
