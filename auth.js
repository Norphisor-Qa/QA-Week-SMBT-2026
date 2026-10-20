"use strict";

const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "REMPLACEZ_PAR_VOTRE_CLE_SB_PUBLISHABLE";
const TECHNICAL_EMAIL_DOMAIN = "qualityweek.internal";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const $ = (id) => document.getElementById(id);

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function validUsername(value) {
  return /^[a-z0-9._-]{3,30}$/.test(value);
}

function technicalEmail(username) {
  return `${username}@${TECHNICAL_EMAIL_DOMAIN}`;
}

function showMessage(message, type = "") {
  const zone = $("auth-message");
  zone.textContent = message;
  zone.dataset.status = type;
}

function setBusy(button, busy, normalText, busyText) {
  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
}

async function redirectExistingSession() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.error(error);
  if (data?.session) window.location.replace("./hub.html");
}

async function register(event) {
  event.preventDefault();
  showMessage("");

  const button = $("register-btn");
  const firstname = $("register-firstname").value.trim();
  const lastname = $("register-lastname").value.trim();
  const username = normalizeUsername($("register-username").value);
  const password = $("register-password").value;
  const confirmation = $("register-password-confirm").value;

  if (!firstname || !lastname || !username || !password) {
    showMessage("Merci de remplir tous les champs.", "error");
    return;
  }
  if (!validUsername(username)) {
    showMessage("L’identifiant doit contenir 3 à 30 caractères autorisés.", "error");
    return;
  }
  if (password.length < 8) {
    showMessage("Le mot de passe doit contenir au moins 8 caractères.", "error");
    return;
  }
  if (password !== confirmation) {
    showMessage("Les deux mots de passe ne correspondent pas.", "error");
    return;
  }

  setBusy(button, true, "Créer mon compte", "Création…");
  try {
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: technicalEmail(username),
      password,
      options: { data: { username, firstname, lastname } }
    });
    if (authError) throw authError;
    if (!authData.user || !authData.session) {
      throw new Error("Compte créé sans session. Vérifiez que « Confirm email » est désactivé.");
    }

    const { error: profileError } = await supabaseClient.from("profiles").insert({
      id: authData.user.id,
      username,
      firstname,
      lastname
    });
    if (profileError) {
      await supabaseClient.auth.signOut();
      if (profileError.code === "23505") throw new Error("Cet identifiant est déjà utilisé.");
      throw profileError;
    }

    window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    const duplicate = /already|exists|registered|duplicate/i.test(error.message || "");
    showMessage(duplicate ? "Cet identifiant est déjà utilisé." : (error.message || "Inscription impossible."), "error");
  } finally {
    setBusy(button, false, "Créer mon compte", "Création…");
  }
}

async function login(event) {
  event.preventDefault();
  showMessage("");

  const button = $("login-btn");
  const username = normalizeUsername($("login-username").value);
  const password = $("login-password").value;

  if (!validUsername(username) || !password) {
    showMessage("Identifiant ou mot de passe incorrect.", "error");
    return;
  }

  setBusy(button, true, "Se connecter", "Connexion…");
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: technicalEmail(username),
      password
    });
    if (error) throw error;
    window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage("Identifiant ou mot de passe incorrect.", "error");
  } finally {
    setBusy(button, false, "Se connecter", "Connexion…");
  }
}

$("register-form").addEventListener("submit", register);
$("login-form").addEventListener("submit", login);
redirectExistingSession();
