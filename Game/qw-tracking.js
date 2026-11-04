/* =====================================================================
 * qw-tracking.js : journal des connexions et temps de jeu
 * À charger APRÈS qw-session.js, avec l'identifiant du jeu :
 *   <script src="../qw-tracking.js" data-game="quality-run" defer></script>
 * Le temps n'est compté que si l'onglet est visible ET que le joueur a agi
 * (clavier, souris, doigt) depuis moins de 2 minutes.
 * Rien n'est envoyé en mode test (?test=1) ni sans compte connecté.
 * ===================================================================== */
(function () {
  "use strict";
  const me = document.currentScript;
  const GAME = me && me.dataset.game;
  const PING_EVERY = 30;      // secondes entre deux envois
  const IDLE_AFTER = 120;     // inactivité au-delà de laquelle on arrête de compter

  if (!GAME || !/^[a-z0-9-]{2,40}$/.test(GAME)) { console.warn("qw-tracking : data-game manquant ou invalide."); return; }

  let sessionId = null, pending = 0, lastInput = Date.now(), sending = false;
  const markActive = () => { lastInput = Date.now(); };
  ["pointerdown", "keydown", "touchstart", "wheel", "mousemove"].forEach(ev =>
    addEventListener(ev, markActive, { passive: true, capture: true }));

  async function send() {
    if (!sessionId || sending || pending <= 0) return;
    const sec = Math.min(60, Math.round(pending));
    sending = true;
    try {
      const { error } = await window.QWSession.client.rpc("ping_game_session", { p_id: sessionId, p_seconds: sec });
      if (!error) pending -= sec;
    } catch { /* réseau : on réessaiera au prochain envoi */ }
    finally { sending = false; }
  }

  async function start() {
    if (window.QW_TEST === true || !window.QWSession) return;      // mode test : aucun suivi
    const user = await window.QWSession.getUser().catch(() => null);
    if (!user) return;
    const device = matchMedia("(pointer:coarse)").matches ? "mobile" : "ordinateur";
    const { data, error } = await window.QWSession.client.rpc("start_game_session", { p_game_id: GAME, p_device: device });
    if (error) { console.warn("qw-tracking :", error.message); return; }
    sessionId = data;

    let last = Date.now(), sinceSend = 0;
    setInterval(() => {
      const now = Date.now(), dt = Math.min(5, (now - last) / 1000); last = now;
      if (document.visibilityState === "visible" && now - lastInput < IDLE_AFTER * 1000) { pending += dt; sinceSend += dt; }
      if (sinceSend >= PING_EVERY) { sinceSend = 0; send(); }
    }, 1000);
    // Envoi immédiat quand l'onglet est masqué ou fermé (perte maximale : quelques secondes)
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") send(); });
    addEventListener("pagehide", send);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
