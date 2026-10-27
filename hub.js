"use strict";

const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const games = [
  { id: "quality-crush", title: "Quality Crush", description: "Associez les symboles et relevez le défi.", icon: "◆", href: "./Game/Quality Crush/index.html", available: true },
  { id: "quality-jump", title: "Quality Jump", description: "Sautez de plateforme en plateforme et visez plus haut.", icon: "↑", href: "./Game/Quality Jump/index.html", available: true },
  { id: "escape-game", title: "Escape game interactif", description: "Trouvez les indices et résolvez les énigmes.", icon: "⌕", href: "./Game/Escape game interactif/index.html", available: false },
  { id: "scenarios", title: "10 scénarios qualité", description: "Choisissez les bonnes réponses et les actions adaptées.", icon: "?", href: "./Game/10 scénarios qualité/index.html", available: false }
];

let currentUser = null;
let currentProfile = null;
let scoreMap = new Map();

const $ = (id) => document.getElementById(id);

function showMessage(message, type = "") {
  $("hub-message").textContent = message;
  $("hub-message").dataset.status = type;
}

async function requireSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error || !data.session?.user) {
    window.location.replace("./index.html");
    return false;
  }
  currentUser = data.session.user;
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
      throw new Error("Profil incomplet. Contactez l’organisateur pour réparer ce compte.");
    }
    const inserted = await supabaseClient.from("profiles").insert({ id: user.id, username, firstname, lastname });
    // Un autre onglet ou un déclencheur peut avoir créé le profil entre-temps.
    if (inserted.error && inserted.error.code !== "23505") throw inserted.error;
    const reread = await readProfile();
    if (reread.error) throw reread.error;
    if (!reread.data) throw new Error("Profil indisponible ou identifiant déjà utilisé. Contactez l’organisateur.");
    data = reread.data;
  }
  currentProfile = data;
  $("player-name").textContent = data.firstname;
  $("player-username").textContent = data.username;
}

async function loadScores() {
  const { data, error } = await supabaseClient
    .from("scores")
    .select("game_id, score")
    .eq("user_id", currentUser.id);
  if (error) throw error;
  scoreMap = new Map((data || []).map((row) => [row.game_id, Number(row.score)]));
  const total = [...scoreMap.values()].reduce((sum, score) => sum + score, 0);
  $("total-score").textContent = String(total);
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
    icon.className = "game-icon";
    icon.textContent = game.icon;
    icon.setAttribute("aria-hidden", "true");
    const badge = document.createElement("span");
    badge.className = game.available ? "badge available" : "badge";
    badge.textContent = game.available ? "Disponible" : "Bientôt disponible";
    top.append(icon, badge);

    const title = document.createElement("h3");
    title.textContent = game.title;
    const description = document.createElement("p");
    description.className = "game-description";
    description.textContent = game.description;
    const score = document.createElement("p");
    score.className = "game-duration";
    score.textContent = scoreMap.has(game.id) ? `Meilleur score : ${scoreMap.get(game.id)} points` : "Aucun score enregistré";

    const action = document.createElement(game.available ? "a" : "button");
    action.className = "button";
    action.textContent = game.available ? "Jouer →" : "Bientôt disponible";
    if (game.available) action.href = game.href;
    else { action.type = "button"; action.disabled = true; }

    article.append(top, title, description, score, action);
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
    points.textContent = `${row.total_score} pts`;
    item.append(name, points);
    list.append(item);
  });
  if (!data?.length) {
    const item = document.createElement("li");
    item.textContent = "Aucun score pour le moment.";
    list.append(item);
  }
}

async function logout() {
  const button = $("logout-btn");
  button.disabled = true;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.replace("./index.html");
  } catch (error) {
    console.error(error);
    showMessage("Déconnexion impossible. Réessayez.", "error");
    button.disabled = false;
  }
}
async function initialize() {
  try {
    if (!(await requireSession())) return;
    await loadProfile();
    renderGames();
    const results = await Promise.allSettled([loadScores(), loadLeaderboard()]);
    renderGames();
    const warnings = [];
    if (results[0].status === "rejected") {
      console.error(results[0].reason);
      $("total-score").textContent = "—";
      $("games-played").textContent = "—";
      warnings.push("Vos scores sont temporairement indisponibles.");
      for (const element of document.querySelectorAll(".game-duration")) element.textContent = "Score indisponible";
    }
    if (results[1].status === "rejected") {
      console.error(results[1].reason);
      $("leaderboard-list").textContent = "Classement temporairement indisponible.";
      warnings.push("Le classement n’a pas pu être chargé.");
    }
    if (warnings.length) showMessage(warnings.join(" "), "error");
  } catch (error) {
    console.error(error);
    showMessage("Impossible de charger votre profil. Réessayez de vous connecter ; si le problème persiste, contactez l’organisateur.", "error");
  }
}
$("logout-btn").addEventListener("click", logout);
initialize();
