/*
 * Quality Week 2026 — session Supabase PARTAGÉE par toutes les pages (connexion, hub, jeux).
 * Emplacement : racine du dépôt.
 * Chargement (après supabase-js, avant auth.js / hub.js / Game/supabase-score.js) :
 *   racine : <script src="./qw-session.js" defer></script>
 *   jeux   : <script src="../../qw-session.js" defer></script>
 *
 * Rôle :
 *   - un seul client Supabase (une seule configuration) pour tout le site ;
 *   - AUCUN résultat de jeu n'est conservé dans le navigateur après une déconnexion ;
 *   - si le compte connecté change (autre onglet, retour arrière, appareil partagé), la page est rechargée
 *     pour ne jamais afficher ni enregistrer les résultats d'un joueur sur le compte d'un autre.
 *
 * API : QWSession.client, QWSession.getUser(), QWSession.signOut(redirectUrl),
 *       QWSession.purgeGameData(), QWSession.watch(userId, onChange)
 *
 * LANCEMENT ET MODE TEST (voir README) :
 *   window.QW_GAMES_OPEN : true quand les jeux sont ouverts au public (constante GAMES_OPEN ci-dessous).
 *   window.QW_TEST       : true en mode test. Activation sur cet appareil : ajouter ?test=1 à l'adresse
 *                          d'une page ; ?test=reset efface les données de test ; ?test=0 quitte le mode test.
 *   En mode test, rien n'est envoyé à Supabase (ni score, ni progression, ni Défi du jour) :
 *   tout reste dans ce navigateur, sous les clés « qw-test:… ». Aucune connexion n'est nécessaire.
 */
(() => {
  "use strict";
  /* Passer à true le jour du lancement : les jeux deviennent accessibles à tous. */
  const GAMES_OPEN = false;

  /* ---------- Mode test ---------- */
  const TEST_FLAG = "qw-test", TEST_PREFIX = "qw-test:";
  let testMode = false;
  try {
    const v = new URLSearchParams(location.search).get("test");
    if (v === "1") localStorage.setItem(TEST_FLAG, "1");
    if (v === "0" || v === "reset") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(TEST_PREFIX)) keys.push(k); }
      keys.forEach(k => localStorage.removeItem(k));
      if (v === "0") localStorage.removeItem(TEST_FLAG);
    }
    testMode = localStorage.getItem(TEST_FLAG) === "1";
  } catch { /* stockage indisponible : pas de mode test */ }
  window.QW_GAMES_OPEN = GAMES_OPEN;
  window.QW_TEST = testMode;
  if (testMode) {
    const showBadge = () => {
      if (document.getElementById("qw-test-badge")) return;
      const en = window.QWI18N && window.QWI18N.lang === "en";
      const b = document.createElement("div");
      b.id = "qw-test-badge";
      b.setAttribute("role", "status");
      b.textContent = en ? "🧪 TEST MODE – nothing is saved online (leave: ?test=0)" : "🧪 MODE TEST – rien n’est enregistré en ligne (quitter : ?test=0)";
      b.style.cssText = "position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:99999;pointer-events:none;background:#e8590c;color:#fff;font:800 12px/1.3 Arial,sans-serif;padding:3px 10px;border-radius:0 0 8px 8px;box-shadow:0 2px 8px #0006;white-space:nowrap";
      document.body.appendChild(b);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showBadge, { once: true }); else showBadge();
  }

  const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";

  /* Version des données locales. La changer (ex. après une remise à zéro de Supabase) efface
     automatiquement, sur chaque navigateur, toutes les données de jeu laissées par les versions précédentes. */
  const DATA_EPOCH = "2026-11-reset-1";
  const EPOCH_KEY = "qw-data-epoch";

  /* Clés de JEU (résultats, progression, parties en cours) : effacées à la déconnexion.
     Les PRÉFÉRENCES (langue, musique, texte agrandi, animations, vitesse, effets sonores) sont conservées. */
  const GAME_PREFIXES = ["qw-pending:", "qw-daily:", "quality-crush-v5", "shoulder-qa-pnc-v2", "qw-progress:"];

  function removeKeys(storage, test) {
    try {
      const keys = [];
      for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && test(k)) keys.push(k); }
      keys.forEach(k => storage.removeItem(k));
    } catch { /* stockage indisponible */ }
  }
  function purgeGameData() {
    removeKeys(localStorage, k => GAME_PREFIXES.some(p => k.startsWith(p)));
    try { sessionStorage.clear(); } catch { /* stockage indisponible */ }
  }
  // Jeton de session Supabase (« sb-<projet>-auth-token » et variantes).
  const isAuthKey = k => /^sb-.*-auth-token/.test(k);
  function purgeAuth() { removeKeys(localStorage, isAuthKey); }

  // Nouvelle version des données : on repart de zéro sur ce navigateur.
  try {
    if (localStorage.getItem(EPOCH_KEY) !== DATA_EPOCH) {
      purgeGameData();
      localStorage.setItem(EPOCH_KEY, DATA_EPOCH);
    }
  } catch { /* stockage indisponible */ }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("supabase-js n'est pas chargé avant qw-session.js.");
    window.QWSession = null;
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  async function getUser() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data?.session?.user || null;
  }

  /* Déconnexion de CET appareil uniquement (scope "local" : le joueur reste connecté sur son téléphone),
     puis effacement de toutes les données de jeu du navigateur. Fonctionne même hors connexion. */
  async function signOut(redirectUrl) {
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) console.warn("Déconnexion serveur non confirmée :", error);
    } catch (e) { console.warn(e); }
    purgeAuth();
    purgeGameData();
    if (redirectUrl) window.location.replace(redirectUrl);
  }

  /* Surveille le compte : si la session disparaît ou appartient à un autre joueur, onChange() est appelé.
     Couvre : déconnexion / connexion dans un autre onglet, retour arrière depuis le cache, appareil partagé. */
  function watch(userId, onChange) {
    let fired = false;
    const fire = () => { if (!fired) { fired = true; onChange(); } };
    const check = async () => {
      try { const u = await getUser(); if (!u || u.id !== userId) fire(); } catch { /* réseau : on ne conclut pas */ }
    };
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (session?.user && session.user.id !== userId)) fire();
    });
    window.addEventListener("storage", e => { if (e.key === null || isAuthKey(e.key)) check(); });
    window.addEventListener("pageshow", e => { if (e.persisted) check(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
    return check;
  }

  window.QWSession = Object.freeze({ client, getUser, signOut, purgeGameData, watch });
})();
