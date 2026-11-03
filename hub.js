"use strict";
// Client Supabase unique : voir qw-session.js
const supabaseClient = window.QWSession && window.QWSession.client;

const T = {
  fr: {
    pageTitle: "Quality Week 2026 | Les mini-jeux", skip: "Aller au contenu", navLabel: "Navigation principale",
    navGames: "Les jeux", navBoard: "Classement", logout: "Déconnexion", eyebrow: "APPRENDRE. EXPLORER. JOUER.",
    hello: "Bonjour", totalLabel: "Votre score total :", points: "points",
    intro: "Choisissez un défi. Chaque jeu rapporte jusqu’à environ 5 000 points sur la semaine.", comfort: "Confort :",
    summary: "Résumé du joueur", gamesScored: "jeu(x) avec un score", yourTurn: "À VOUS DE JOUER",
    chooseTitle: "Choisissez votre défi", chooseSub: "Aucune connaissance technique n’est nécessaire : chaque jeu explique ses règles et corrige vos réponses.",
    scaleTitle: "Comment sont calculés les points ?", gDaily: "Défi du jour", gScen: "Scénarios qualité",
    sDaily: "Jusqu’à 1 000 points par jour (énigme 200, pendu 300, mots croisés 500)",
    sCrush: "40, 70 ou 100 points par niveau réussi (1, 2 ou 3 étoiles), 50 niveaux",
    sRun: "Score de votre meilleure course ÷ 3, plafonné à 5 000 points",
    sScen: "Jusqu’à 166 points par dossier, vos 30 meilleurs dossiers",
    boardEyebrow: "CLASSEMENT GÉNÉRAL", boardTitle: "Les meilleurs scores cumulés",
    tagline: "La qualité se joue ensemble.", top: "Retour en haut ↑",
    available: "Disponible", soon: "Bientôt disponible", play: "Jouer →",
    best: "Vos points : {n}", noScore: "Aucun score enregistré", scoreNA: "Score indisponible",
    noBoard: "Aucun score pour le moment.",
    errScores: "Vos scores sont temporairement indisponibles.", errBoardList: "Classement temporairement indisponible.",
    errBoard: "Le classement n’a pas pu être chargé.", errLogout: "Déconnexion impossible. Réessayez.",
    errProfile: "Impossible de charger votre profil. Réessayez de vous connecter ; si le problème persiste, contactez l’organisateur.",
    dDaily: "Énigme, pendu et mots croisés : 3 niveaux, une fois par jour.",
    dCrush: "Alignez les implants, déclenchez les bonus et nettoyez la contamination.",
    dRun: "Courez, évitez les problèmes qualité et passez la bonne porte.",
    dScen: "Fouillez le poste de travail, trouvez les écarts et décidez.",
    mDaily: "⏱ 5 à 10 min · clavier ou écran tactile · sans limite de temps",
    mCrush: "⏱ 2 à 4 min par niveau · souris, doigt ou clavier",
    mRun: "⏱ 2 à 5 min · réflexes : flèches ou glisser le doigt",
    mScen: "⏱ 5 min par dossier "
  },
  en: {
    pageTitle: "Quality Week 2026 | Mini-games", skip: "Skip to content", navLabel: "Main navigation",
    navGames: "Games", navBoard: "Leaderboard", logout: "Sign out", eyebrow: "LEARN. EXPLORE. PLAY.",
    hello: "Hello", totalLabel: "Your total score:", points: "points",
    intro: "Pick a challenge. Each game is worth up to about 5,000 points over the week.", comfort: "Comfort:",
    summary: "Player summary", gamesScored: "game(s) with a score", yourTurn: "YOUR TURN",
    chooseTitle: "Choose your challenge", chooseSub: "No technical knowledge needed: every game explains its rules and corrects your answers.",
    scaleTitle: "How are points calculated?", gDaily: "Daily challenge", gScen: "Quality scenarios",
    sDaily: "Up to 1,000 points per day (riddle 200, hangman 300, crossword 500)",
    sCrush: "40, 70 or 100 points per level cleared (1, 2 or 3 stars), 50 levels",
    sRun: "Your best run score ÷ 3, capped at 5,000 points",
    sScen: "Up to 166 points per case, your 30 best cases",
    boardEyebrow: "OVERALL LEADERBOARD", boardTitle: "Top cumulative scores",
    tagline: "Quality is a team game.", top: "Back to top ↑",
    available: "Available", soon: "Coming soon", play: "Play →",
    best: "Your points: {n}", noScore: "No score yet", scoreNA: "Score unavailable",
    noBoard: "No scores yet.",
    errScores: "Your scores are temporarily unavailable.", errBoardList: "Leaderboard temporarily unavailable.",
    errBoard: "The leaderboard could not be loaded.", errLogout: "Unable to sign out. Please try again.",
    errProfile: "Unable to load your profile. Try signing in again; if the problem persists, contact the organizer.",
    dDaily: "Riddle, hangman and crossword: 3 levels, once a day.",
    dCrush: "Match the implants, trigger boosters and clean up contamination.",
    dRun: "Run, dodge quality issues and go through the right door.",
    dScen: "Search the workstation, spot the deviations and decide.",
    mDaily: "⏱ 5 to 10 min · keyboard or touch screen · no time limit",
    mCrush: "⏱ 2 to 4 min per level · mouse, finger or keyboard",
    mRun: "⏱ 2 to 5 min · reflexes: arrow keys or swipe",
    mScen: "⏱ 5 min per case"
  }
};
const I = window.QWI18N;
const t = (k, v) => I.t(T, k, v);
const fmt = n => Number(n).toLocaleString(I.lang === "en" ? "en-GB" : "fr-FR");
I.apply(T);
I.mount(document.getElementById("lang-slot"));

const games = [
  { id: "daily", title: { fr: "Défi du jour", en: "Daily challenge" }, desc: "dDaily", meta: "mDaily", icon: "☀", href: "./Game/Défi du jour/index.html", available: false },
  { id: "quality-crush", title: { fr: "Quality Crush", en: "Quality Crush" }, desc: "dCrush", meta: "mCrush", icon: "◆", href: "./Game/Quality Crush/index.html", available: false },
  { id: "quality-run", title: { fr: "Quality Run", en: "Quality Run" }, desc: "dRun", meta: "mRun", icon: "→", href: "./Game/Quality Run/index.html", available: false },
  { id: "scenarios", title: { fr: "Scénarios qualité", en: "Quality scenarios" }, desc: "dScen", meta: "mScen", icon: "⌕", href: "./Game/10 scénarios qualité/index.html", available: false }
];
let currentUser = null;
let scoreMap = new Map();
const $ = (id) => document.getElementById(id);

function showMessage(message, type = "") {
  $("hub-message").textContent = message;
  $("hub-message").dataset.status = type;
}
async function requireSession() {
  const user = await window.QWSession.getUser().catch(() => null);
  if (!user) { window.location.replace("./index.html"); return false; }
  currentUser = user;
  // Compte changé ou déconnecté ailleurs (autre onglet, retour arrière…) : on recharge
  // pour ne jamais afficher les résultats d'un autre joueur.
  window.QWSession.watch(user.id, () => window.location.reload());
  return true;
}
async function loadProfile() {
  const readProfile = () => supabaseClient.from("profiles")
    .select("id, username, firstname, lastname").eq("id", currentUser.id).maybeSingle();
  let { data, error } = await readProfile();
  if (error) throw error;
  if (!data) {
    // Valider le compte auprès du service avant de réparer un profil manquant.
    const result = await supabaseClient.auth.getUser();
    if (result.error) throw result.error;
    const user = result.data?.user;
    if (!user || user.id !== currentUser.id) throw new Error("Session invalide.");
    const meta = user.user_metadata || {};
    const username = String(meta.username || "").trim().toLowerCase();
    const firstname = String(meta.firstname || "").trim();
    const lastname = String(meta.lastname || "").trim();
    if (!/^[a-z0-9._-]{3,30}$/.test(username) || !firstname || !lastname || firstname.length > 80 || lastname.length > 80) {
      throw new Error("Profil incomplet.");
    }
    const inserted = await supabaseClient.from("profiles").insert({ id: user.id, username, firstname, lastname });
    // Un autre onglet ou un déclencheur peut avoir créé le profil entre-temps.
    if (inserted.error && inserted.error.code !== "23505") throw inserted.error;
    const reread = await readProfile();
    if (reread.error) throw reread.error;
    if (!reread.data) throw new Error("Profil indisponible.");
    data = reread.data;
  }
  $("player-name").textContent = data.firstname;
  $("player-username").textContent = data.username;
}
async function loadScores() {
  const { data, error } = await supabaseClient.from("scores").select("game_id, score").eq("user_id", currentUser.id);
  if (error) throw error;
  // Seuls les jeux actifs sont comptés (d'anciens game_id peuvent subsister en base).
  const active = new Set(games.map(g => g.id));
  scoreMap = new Map((data || []).filter(r => active.has(r.game_id)).map((row) => [row.game_id, Number(row.score)]));
  const total = [...scoreMap.values()].reduce((sum, score) => sum + score, 0);
  $("total-score").textContent = fmt(total);
  $("games-played").textContent = String(scoreMap.size);
}
function renderGames() {
  const grid = $("games-grid");
  grid.replaceChildren();
  for (const game of games) {
    const article = document.createElement("article");
    article.className = "game-card";
    const top = document.createElement("div");
    top.className = "card-top";
    const icon = document.createElement("span");
    icon.className = "game-icon"; icon.textContent = game.icon; icon.setAttribute("aria-hidden", "true");
    const badge = document.createElement("span");
    badge.className = game.available ? "badge available" : "badge";
    badge.textContent = game.available ? t("available") : t("soon");
    top.append(icon, badge);
    const title = document.createElement("h3");
    title.textContent = game.title[I.lang] || game.title.fr;
    const description = document.createElement("p");
    description.className = "game-description"; description.textContent = t(game.desc);
    const meta = document.createElement("p");
    meta.className = "game-meta"; meta.textContent = t(game.meta);
    const score = document.createElement("p");
    score.className = "game-duration";
    score.textContent = scoreMap.has(game.id) ? t("best", { n: fmt(scoreMap.get(game.id)) }) : t("noScore");
    const action = document.createElement(game.available ? "a" : "button");
    action.className = "button";
    action.textContent = game.available ? t("play") : t("soon");
    if (game.available) { action.href = game.href; action.setAttribute("aria-label", `${t("play").replace(" →", "")} : ${title.textContent}`); }
    else { action.type = "button"; action.disabled = true; }
    article.append(top, title, description, meta, score, action);
    grid.append(article);
  }
}
async function loadLeaderboard() {
  const { data, error } = await supabaseClient.rpc("get_leaderboard", { p_limit: 20 });
  if (error) throw error;
  const list = $("leaderboard-list");
  list.replaceChildren();
  (data || []).forEach((row) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${row.rank}. ${row.username}`;
    const points = document.createElement("strong");
    points.textContent = `${fmt(row.total_score)} pts`;
    item.append(name, points);
    list.append(item);
  });
  if (!data?.length) {
    const item = document.createElement("li");
    item.textContent = t("noBoard");
    list.append(item);
  }
}
async function logout() {
  const button = $("logout-btn");
  button.disabled = true;
  // Déconnexion de cet appareil + effacement de toutes les données de jeu du navigateur.
  await window.QWSession.signOut("./index.html");
}
async function refreshAll() {
  const results = await Promise.allSettled([loadScores(), loadLeaderboard()]);
  renderGames();
  const warnings = [];
  if (results[0].status === "rejected") {
    console.error(results[0].reason);
    $("total-score").textContent = "—"; $("games-played").textContent = "—";
    warnings.push(t("errScores"));
    for (const element of document.querySelectorAll(".game-duration")) element.textContent = t("scoreNA");
  }
  if (results[1].status === "rejected") {
    console.error(results[1].reason);
    $("leaderboard-list").textContent = t("errBoardList");
    warnings.push(t("errBoard"));
  }
  showMessage(warnings.join(" "), warnings.length ? "error" : "");
}
async function initialize() {
  try {
    if (!(await requireSession())) return;
    await loadProfile();
    renderGames();
    await refreshAll();
  } catch (error) {
    console.error(error);
    showMessage(t("errProfile"), "error");
  }
}
$("logout-btn").addEventListener("click", logout);
initialize();

// Retour depuis un jeu avec « Précédent » (page en cache) : recharger scores et classement.
window.addEventListener("pageshow", (event) => {
  if (event.persisted && currentUser) refreshAll();
});
