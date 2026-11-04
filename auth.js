"use strict";
// Client Supabase unique : voir qw-session.js
const supabaseClient = window.QWSession && window.QWSession.client;

const T = {
  fr: {
    pageTitle: "Quality Week 2026 | Connexion", skip: "Aller au contenu", eyebrow: "APPRENDRE. EXPLORER. JOUER.",
    title: "Bienvenue à la Quality Week 2026",
    intro: "Créez votre accès lors de votre première visite, puis utilisez simplement votre identifiant et votre mot de passe.",
    firstVisit: "Première connexion", firstname: "Prénom", lastname: "Nom", username: "Identifiant unique",
    usernameHelp: "3 à 30 caractères : lettres sans accent, chiffres, point, tiret ou underscore.", pwdHelp: "8 caractères minimum.",
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
    errSession: "Impossible de vérifier la session. Vous pouvez essayer de vous connecter.",
    errService: "Service de connexion indisponible. Rechargez la page ; si le problème persiste, contactez l’organisateur.",
    sessionTitle: "Vous êtes déjà connecté",
    sessionAs: "Compte ouvert : {u}",
    sessionHelp: "Continuez avec ce compte, ou changez de compte si cet appareil est partagé.",
    continueAs: "Continuer en tant que {u}",
    switchAccount: "Changer de compte",
    switched: "Vous êtes déconnecté. Connectez-vous avec votre compte."
  },
  en: {
    pageTitle: "Quality Week 2026 | Sign in", skip: "Skip to content", eyebrow: "LEARN. EXPLORE. PLAY.",
    title: "Welcome to Quality Week 2026",
    intro: "Create your account on your first visit, then simply use your username and password.",
    firstVisit: "First visit", firstname: "First name", lastname: "Last name", username: "Unique username",
    usernameHelp: "3 to 30 characters: unaccented letters, digits, dot, hyphen or underscore.", pwdHelp: "At least 8 characters.",
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
    errSession: "Unable to check the session. You can try signing in.",
    errService: "Sign-in service unavailable. Reload the page; if the problem persists, contact the organizer.",
    sessionTitle: "You are already signed in",
    sessionAs: "Signed in as: {u}",
    sessionHelp: "Continue with this account, or switch account if this device is shared.",
    continueAs: "Continue as {u}",
    switchAccount: "Switch account",
    switched: "You are signed out. Sign in with your own account."
  }
};
const t = (k, v) => window.QWI18N.t(T, k, v);
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
    await closeExistingSession();
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
    await closeExistingSession();
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

/* Une connexion ou une inscription ferme d'abord toute session existante sur l'appareil
   et efface les résultats de jeu de la personne précédente. */
async function closeExistingSession() {
  const user = await window.QWSession.getUser().catch(() => null);
  if (user) await window.QWSession.signOut();
  else window.QWSession.purgeGameData();
}
function accountName(user) {
  const meta = user.user_metadata || {};
  return String(meta.username || (user.email || "").split("@")[0] || "").trim();
}
/* Appareil partagé : on ne redirige plus automatiquement vers le hub.
   Le joueur voit qui est connecté et choisit « Continuer » ou « Changer de compte ». */
async function showExistingSession() {
  try {
    const user = await window.QWSession.getUser();
    if (!user) return;
    const name = accountName(user);
    $("session-title").textContent = t("sessionTitle");
    $("session-as").textContent = t("sessionAs", { u: name });
    $("session-help").textContent = t("sessionHelp");
    $("continue-btn").textContent = t("continueAs", { u: name });
    $("switch-btn").textContent = t("switchAccount");
    $("session-box").hidden = false;
    $("continue-btn").focus();
  } catch (error) {
    console.error(error);
    showMessage(t("errSession"), "error");
  }
}
async function switchAccount() {
  $("switch-btn").disabled = true;
  await window.QWSession.signOut();
  $("session-box").hidden = true;
  $("switch-btn").disabled = false;
  $("register-form").reset(); $("login-form").reset();
  showMessage(t("switched"), "success");
  $("login-username").focus();
}
if (!supabaseClient) {
  showMessage(t("errService"), "error");
  setBusy(true);
} else {
  $("register-form").addEventListener("submit", register);
  $("login-form").addEventListener("submit", login);
  $("continue-btn").addEventListener("click", () => window.location.replace("./hub.html"));
  $("switch-btn").addEventListener("click", switchAccount);
  showExistingSession();
  // Retour arrière vers cette page (cache) : réafficher l'état réel de la session.
  window.addEventListener("pageshow", e => { if (e.persisted) { $("session-box").hidden = true; showExistingSession(); } });
}
