"use strict";

const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const games = [
  { id: "quality-crush", title: "Quality Crush", description: "Associez les symboles et relevez le défi.", icon: "◆", href: "./Game/Quality Crush/index.html", available: false },
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
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, firstname, lastname")
    .eq("id", currentUser.id)
    .single();
  if (error) throw error;
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
    name.textContent = `${row.firstname} ${row.lastname}`;
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
  await supabaseClient.auth.signOut();
  window.location.replace("./index.html");
}

async function initialize() {
  try {
    if (!(await requireSession())) return;
    await Promise.all([loadProfile(), loadScores(), loadLeaderboard()]);
    renderGames();
  } catch (error) {
    console.error(error);
    showMessage("Impossible de charger le hub. Reconnectez-vous.", "error");
  }
}

$("logout-btn").addEventListener("click", logout);
initialize();

