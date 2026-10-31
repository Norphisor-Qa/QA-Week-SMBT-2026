"use strict";
const SUPABASE_URL = "https://pglstqfawauvxvezyigc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const T = {
  fr: {
    pageTitle: "Quality Week 2026 | Connexion", skip: "Aller au contenu", eyebrow: "APPRENDRE. EXPLORER. JOUER.",
    title: "Bienvenue à la Quality Week 2026",
    intro: "Créez votre accès lors de votre première visite, puis utilisez simplement votre identifiant et votre mot de passe.",
    firstVisit: "Première connexion", firstname: "Prénom", lastname: "Nom", username: "Identifiant unique",
    usernameHelp: "3 à 30 caractères : lettres sans accent, chiffres, point, tiret ou underscore.",
    password: "Mot de passe", confirm: "Confirmer le mot de passe", create: "Créer mon compte", creating: "Création…",
    already: "Déjà inscrit ?", loginUser: "Identifiant", login: "Se connecter", loggingIn: "Connexion…",
    tagline: "La qualité se joue ensemble.",
    errName: "Indiquez un prénom et un nom de 1 à 80 caractères.",
    errUser: "Identifiant : 3 à 30 caractères, lettres sans accent, chiffres, point, tiret ou underscore.",
    errPwd: "Le mot de passe doit contenir 8 à 128 caractères.",
    errMatch: "Les deux mots de passe ne correspondent pas.",
    errNoSession: "Inscription sans session immédiate. Contactez l’organisateur pour vérifier la configuration : l’adresse technique utilisée ici ne permet pas de recevoir un e-mail de confirmation.",
    errRegister: "Inscription impossible. L’identifiant peut être déjà utilisé. Si le compte existe, essayez de vous connecter ; sinon contactez l’organisateur.",
    errCreds: "Identifiant ou mot de passe incorrect.",
    errLogin: "Connexion impossible. Vérifiez vos identifiants et votre connexion réseau.",
    errSession: "Impossible de vérifier la session. Vous pouvez essayer de vous connecter."
  },
  en: {
    pageTitle: "Quality Week 2026 | Sign in", skip: "Skip to content", eyebrow: "LEARN. EXPLORE. PLAY.",
    title: "Welcome to Quality Week 2026",
    intro: "Create your account on your first visit, then simply use your username and password.",
    firstVisit: "First visit", firstname: "First name", lastname: "Last name", username: "Unique username",
    usernameHelp: "3 to 30 characters: unaccented letters, digits, dot, hyphen or underscore.",
    password: "Password", confirm: "Confirm password", create: "Create my account", creating: "Creating…",
    already: "Already registered?", loginUser: "Username", login: "Sign in", loggingIn: "Signing in…",
    tagline: "Quality is a team game.",
    errName: "Enter a first name and a last name of 1 to 80 characters.",
    errUser: "Username: 3 to 30 characters, unaccented letters, digits, dot, hyphen or underscore.",
    errPwd: "The password must contain 8 to 128 characters.",
    errMatch: "The two passwords do not match.",
    errNoSession: "Account created without an immediate session. Ask the organizer to check the configuration: the technical address used here cannot receive a confirmation email.",
    errRegister: "Unable to register. The username may already be taken. If the account exists, try signing in; otherwise contact the organizer.",
    errCreds: "Incorrect username or password.",
    errLogin: "Unable to sign in. Check your credentials and your network connection.",
    errSession: "Unable to check the session. You can try signing in."
  }
};
const t = (k) => window.QWI18N.t(T, k);
window.QWI18N.apply(T);
window.QWI18N.mount(document.getElementById("lang-slot"));

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
  if (!firstname || !lastname || firstname.length > 80 || lastname.length > 80) { showMessage(t("errName"), "error"); return; }
  if (!validUsername(username)) { showMessage(t("errUser"), "error"); return; }
  if (password.length < 8 || password.length > 128) { showMessage(t("errPwd"), "error"); return; }
  if (password !== $("register-password-confirm").value) { showMessage(t("errMatch"), "error"); return; }
  setBusy(true);
  $("register-btn").textContent = t("creating");
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: technicalEmail(username), password,
      options: { data: { username, firstname, lastname } }
    });
    if (error) throw error;
    if (!data?.session) { showMessage(t("errNoSession"), "error"); return; }
    // Le hub crée le profil manquant depuis les métadonnées du compte.
    window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage(t("errRegister"), "error");
  } finally {
    setBusy(false); $("register-btn").textContent = t("create");
  }
}

async function login(event) {
  event.preventDefault();
  if (busy) return;
  showMessage("");
  const username = normalizeUsername($("login-username").value);
  const password = $("login-password").value;
  if (!validUsername(username) || !password) { showMessage(t("errCreds"), "error"); return; }
  setBusy(true); $("login-btn").textContent = t("loggingIn");
  try {
    const { error } = await supabaseClient.auth.signInWithPassword({ email: technicalEmail(username), password });
    if (error) throw error;
    window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage(t("errLogin"), "error");
  } finally {
    setBusy(false); $("login-btn").textContent = t("login");
  }
}

async function redirectExistingSession() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    if (data?.session) window.location.replace("./hub.html");
  } catch (error) {
    console.error(error);
    showMessage(t("errSession"), "error");
  }
}

$("register-form").addEventListener("submit", register);
$("login-form").addEventListener("submit", login);
redirectExistingSession();
