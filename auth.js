"use strict";
const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const $ = id => document.getElementById(id);
const normalizeUsername = value => String(value || "").trim().toLowerCase();
const validUsername = value => /^[a-z0-9._-]{3,30}$/.test(value);
const technicalEmail = username => `${username}@qualityweek.internal`;
let busy = false;
function showMessage(message, type = "") {
  $("auth-message").textContent = message;
  $("auth-message").dataset.status = type;
}
function setBusy(value) {
  busy = value;
  $("register-btn").disabled = value;
  $("login-btn").disabled = value;
}
async function register(event) {
  event.preventDefault();
  if (busy) return;
  showMessage("");
  const firstname = $("register-firstname").value.trim();
  const lastname = $("register-lastname").value.trim();
  const username = normalizeUsername($("register-username").value);
  const password = $("register-password").value;
  if (!firstname || !lastname || firstname.length > 80 || lastname.length > 80) {
    showMessage("Indiquez un prénom et un nom de 1 à 80 caractères.", "error"); return;
  }
  if (!validUsername(username)) {
    showMessage("Identifiant : 3 à 30 caractères, lettres sans accent, chiffres, point, tiret ou underscore.", "error"); return;
  }
  if (password.length < 8 || password.length > 128) {
    showMessage("Le mot de passe doit contenir 8 à 128 caractères.", "error"); return;
  }
  if (password !== $("register-password-confirm").value) {
    showMessage("Les deux mots de passe ne correspondent pas.", "error"); return;
  }
  setBusy(true);
  $("register-btn").textContent = "Création…";
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: technicalEmail(username), password,
      options: { data: { username, firstname, lastname } }
    });
    if (error) throw error;
    if (!data?.session) {
      showMessage("Inscription sans session immédiate. Contactez l’organisateur pour vérifier la configuration : l’adresse technique utilisée ici ne permet pas de recevoir un e-mail de confirmation.", "error");
      return;
    }
    // Le hub crée le profil manquant depuis les métadonnées du compte.
    // Une erreur de profil n'impose donc pas de recréer le compte.
    window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage("Inscription impossible. L’identifiant peut être déjà utilisé. Si le compte existe, essayez de vous connecter ; sinon contactez l’organisateur.", "error");
  } finally {
    setBusy(false); $("register-btn").textContent = "Créer mon compte";
  }
}
async function login(event) {
  event.preventDefault();
  if (busy) return;
  showMessage("");
  const username = normalizeUsername($("login-username").value);
  const password = $("login-password").value;
  if (!validUsername(username) || !password) {
    showMessage("Identifiant ou mot de passe incorrect.", "error"); return;
  }
  setBusy(true); $("login-btn").textContent = "Connexion…";
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email: technicalEmail(username), password });
    if (error) throw error;
    window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage("Connexion impossible. Vérifiez vos identifiants et votre connexion réseau.", "error");
  } finally {
    setBusy(false); $("login-btn").textContent = "Se connecter";
  }
}
async function redirectExistingSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data?.session) window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage("Impossible de vérifier la session. Vous pouvez essayer de vous connecter.", "error");
  }
}
$("register-form").addEventListener("submit", register);
$("login-form").addEventListener("submit", login);
redirectExistingSession();
