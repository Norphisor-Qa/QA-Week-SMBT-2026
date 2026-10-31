/*
 * Quality Week 2026 — module de scores partagé par TOUS les mini-jeux.
 * Emplacement : Game/supabase-score.js
 * Chargement dans un jeu (Game/<Nom du jeu>/index.html) :
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
 *   <script src="../supabase-score.js" defer></script>
 * Utilisation :
 *   const scores = window.QWScores.forGame("quality-crush");
 *   await scores.requireSession();          // erreur code "AUTH_REQUIRED" si non connecté
 *   const best = await scores.loadBestScore();
 *   const saved = await scores.saveBestScore(1234); // renvoie le meilleur score enregistré
 */
(() => {
  "use strict";

  const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";
  const MAX_SCORE = 2147483647;

  // Liens calculés à partir de l'emplacement de ce fichier : fonctionne quel que soit le dossier du jeu.
  const scriptSrc = (document.currentScript && document.currentScript.src) || window.location.href;
  const HUB_URL = new URL("../hub.html", scriptSrc).href;
  const LOGIN_URL = new URL("../index.html", scriptSrc).href;

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("supabase-js n'est pas chargé avant supabase-score.js.");
    window.QWScores = null;
    window.qualityJumpScores = null;
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  function checkScore(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > MAX_SCORE) throw new Error("Score invalide.");
    return n;
  }

  async function requireSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data?.session?.user) {
      const authError = new Error("Session absente ou expirée.");
      authError.code = "AUTH_REQUIRED";
      throw authError;
    }
    return data.session.user;
  }

  // Score non confirmé (coupure réseau…) : conservé localement puis renvoyé au prochain chargement.
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

  const instances = new Map();

  function forGame(gameId) {
    if (!/^[a-z0-9-]{2,40}$/.test(gameId)) throw new Error("Identifiant de jeu invalide.");
    if (instances.has(gameId)) return instances.get(gameId);

    let queue = Promise.resolve(); // sérialise les enregistrements (pas de requêtes concurrentes)

    async function rpcSave(score) {
      const { data, error } = await client.rpc("save_best_score", { p_game_id: gameId, p_score: score });
      if (error) throw error;
      return checkScore(data); // la fonction SQL retourne directement un entier
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

    const api = Object.freeze({ gameId, requireSession, loadBestScore, saveBestScore });
    instances.set(gameId, api);
    return api;
  }

  // Écran bloquant commun (connexion requise / service indisponible).
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
    box.hidden = false;
    b.focus();
  }

  function hideBlocking() {
    const box = document.getElementById("qw-blocking");
    if (box) box.remove();
  }

  /*
   * Démarrage standard d'un jeu : vérifie la session, charge le meilleur score,
   * affiche un écran bloquant en cas de problème. Retourne { scores, best } ou null.
   */
  async function boot(gameId) {
    const scores = forGame(gameId);
    try {
      await scores.requireSession();
      const best = await scores.loadBestScore();
      hideBlocking();
      return { scores, best };
    } catch (error) {
      console.error(error);
      if (error.code === "AUTH_REQUIRED") {
        showBlocking({
          title: "Connexion requise",
          message: "Votre session est absente ou expirée. Connectez-vous pour jouer et enregistrer votre score.",
          buttonLabel: "Se connecter",
          onClick: () => window.location.replace(LOGIN_URL)
        });
      } else {
        showBlocking({
          title: "Chargement impossible",
          message: "Le service de scores est indisponible. Vérifiez votre connexion puis réessayez.",
          buttonLabel: "Réessayer",
          onClick: () => window.location.reload(),
          secondaryLabel: "Retour au hub",
          onSecondary: () => window.location.assign(HUB_URL)
        });
      }
      return null;
    }
  }

  window.QWScores = Object.freeze({ forGame, boot, showBlocking, hideBlocking, HUB_URL, LOGIN_URL });
  // Compatibilité avec le code existant de Quality Jump.
  window.qualityJumpScores = forGame("quality-jump");
})();
