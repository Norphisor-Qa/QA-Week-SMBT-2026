"use strict";

/*
 * ============================================================
 * CONFIGURATION SUPABASE
 * ============================================================
 *
 * La Publishable Key est destinée au navigateur.
 * Ne jamais mettre une clé sb_secret_ dans ce fichier.
 */

const SUPABASE_URL =
  "https://pglstqfawauvxvezyigc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "REMPLACEZ_PAR_VOTRE_CLE_SB_PUBLISHABLE";

const USERNAME_EMAIL_DOMAIN =
  "qualityweek.invalid";

let supabaseClient = null;
let utilisateurCourant = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
} else {
  console.error(
    "La bibliothèque Supabase n'a pas été chargée."
  );
}

/*
 * ============================================================
 * CONFIGURATION DU HUB
 * ============================================================
 */

const configuration = {
  logo: "",
  contact: ""
};

const jeux = [
  {
    id: "match3",
    gameId: "quality-crush",
    titre: "Quality Crush",
    description:
      "Un jeu de type Candy Crush : associez les symboles et relevez le défi !",
    icone: "◆",
    duree: "",
    lien: "",
    disponible: false
  },
  {
    id: "jump",
    gameId: "quality-jump",
    titre: "Quality Jump",
    description:
      "Un jeu de type Doodle Jump : sautez de plateforme en plateforme et visez toujours plus haut !",
    icone: "↑",
    duree: "",
    lien: "./Game/Quality Jump/index.html",
    disponible: true
  },
  {
    id: "escape",
    gameId: "escape-game",
    titre: "Escape game interactif",
    description:
      "Explorez, trouvez les indices et résolvez les énigmes pour accomplir votre mission.",
    icone: "⌕",
    duree: "",
    lien: "",
    disponible: false
  },
  {
    id: "scenarios",
    gameId: "scenarios",
    titre: "10 scénarios qualité",
    description:
      "Face à 10 situations, choisissez les bonnes réponses et les actions adaptées.",
    icone: "?",
    duree: "",
    lien: "",
    disponible: false
  }
];

/*
 * ============================================================
 * OUTILS
 * ============================================================
 */

function element(balise, classe, texte) {
  const node = document.createElement(balise);

  if (classe) {
    node.className = classe;
  }

  if (texte !== undefined) {
    node.textContent = texte;
  }

  return node;
}

function normaliserIdentifiant(valeur) {
  return String(valeur || "")
    .trim()
    .toLowerCase();
}

function identifiantValide(username) {
  return /^[a-z0-9._-]{3,30}$/.test(username);
}

function construireEmailTechnique(username) {
  return `${username}@${USERNAME_EMAIL_DOMAIN}`;
}

function lienValide(valeur) {
  if (
    typeof valeur !== "string" ||
    !valeur.trim() ||
    valeur.trim().startsWith("#")
  ) {
    return null;
  }

  try {
    const brut = valeur.trim();
    const url = new URL(brut, window.location.href);

    if (
      url.protocol === "http:" ||
      url.protocol === "https:"
    ) {
      return brut;
    }

    if (
      window.location.protocol === "file:" &&
      url.protocol === "file:" &&
      !/^[a-z][a-z0-9+.-]*:/i.test(brut)
    ) {
      return brut;
    }
  } catch (error) {
    console.error(
      "Lien incorrect :",
      valeur,
      error
    );
  }

  return null;
}

function echapperErreur(error) {
  if (!error || typeof error.message !== "string") {
    return "Une erreur inattendue est survenue.";
  }

  return error.message;
}

function afficherMessageAuth(message, type = "") {
  const zone =
    document.getElementById("auth-message");

  if (!zone) {
    return;
  }

  zone.textContent = message;
  zone.dataset.status = type;
}

function afficherEtatSupabase(message, type = "") {
  const zone =
    document.getElementById("supabase-status");

  if (!zone) {
    return;
  }

  zone.textContent = message;
  zone.dataset.status = type;
}

function definirChargement(
  bouton,
  chargement,
  texteNormal,
  texteChargement
) {
  if (!bouton) {
    return;
  }

  bouton.disabled = chargement;
  bouton.textContent =
    chargement ? texteChargement : texteNormal;
}

/*
 * ============================================================
 * AFFICHAGE DES JEUX
 * ============================================================
 */

function afficherJeux() {
  const grille =
    document.getElementById("games-grid");

  const messageVide =
    document.getElementById("games-empty");

  if (!grille || !messageVide) {
    return;
  }

  grille.replaceChildren();

  const fragment =
    document.createDocumentFragment();

  jeux.forEach((jeu, index) => {
    const lien = lienValide(jeu.lien);

    const jeuConfigure =
      jeu.disponible === true &&
      lien !== null;

    const jeuAccessible =
      jeuConfigure &&
      utilisateurCourant !== null;

    const carte =
      element("article", "game-card");

    carte.dataset.gameId = jeu.gameId;

    const titre =
      element("h3", "", jeu.titre);

    titre.id = `jeu-titre-${index}`;

    carte.setAttribute(
      "aria-labelledby",
      titre.id
    );

    const haut =
      element("div", "card-top");

    const icone =
      element(
        "span",
        "game-icon",
        jeu.icone
      );

    icone.setAttribute(
      "aria-hidden",
      "true"
    );

    let texteBadge =
      "Bientôt disponible";

    let classeBadge =
      "badge";

    if (jeuConfigure && !utilisateurCourant) {
      texteBadge = "Connexion requise";
    }

    if (jeuConfigure && utilisateurCourant) {
      texteBadge = "Disponible";
      classeBadge = "badge available";
    }

    const badge =
      element(
        "span",
        classeBadge,
        texteBadge
      );

    haut.append(icone, badge);

    carte.append(
      haut,
      titre,
      element(
        "p",
        "game-description",
        jeu.description
      )
    );

    if (
      typeof jeu.duree === "string" &&
      jeu.duree.trim()
    ) {
      carte.append(
        element(
          "p",
          "game-duration",
          `Durée indicative : ${jeu.duree}`
        )
      );
    }

    const bouton =
      element(
        jeuAccessible ? "a" : "button",
        "button",
        jeuAccessible
          ? "Jouer →"
          : jeuConfigure
            ? "Se connecter pour jouer"
            : "Bientôt disponible"
      );

    if (jeuAccessible) {
      bouton.href = lien;
      bouton.dataset.gameId = jeu.gameId;

      bouton.setAttribute(
        "aria-label",
        `Jouer : ${jeu.titre}`
      );
    } else {
      bouton.type = "button";

      if (jeuConfigure && !utilisateurCourant) {
        bouton.addEventListener(
          "click",
          () => {
            document
              .getElementById("connexion")
              ?.scrollIntoView({
                behavior: "smooth",
                block: "start"
              });

            afficherMessageAuth(
              "Connectez-vous pour lancer ce jeu.",
              "info"
            );
          }
        );
      } else {
        bouton.disabled = true;
      }
    }

    carte.append(bouton);
    fragment.append(carte);
  });

  grille.append(fragment);
  messageVide.hidden = jeux.length > 0;

  const avertissement =
    document.getElementById(
      "games-auth-notice"
    );

  if (avertissement) {
    avertissement.hidden =
      utilisateurCourant !== null;
  }
}

/*
 * ============================================================
 * PERSONNALISATION
 * ============================================================
 */

function personnaliser() {
  const logo =
    document.getElementById("brand-logo");

  const placeholder =
    document.getElementById(
      "brand-placeholder"
    );

  const chemin =
    lienValide(configuration.logo);

  if (logo && placeholder && chemin) {
    logo.addEventListener("load", () => {
      logo.hidden = false;
      placeholder.hidden = true;
    });

    logo.addEventListener("error", () => {
      logo.hidden = true;
      placeholder.hidden = false;
    });

    logo.src = chemin;
  }

  const email =
    typeof configuration.contact === "string"
      ? configuration.contact.trim()
      : "";

  if (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    !/[?&#]/.test(email)
  ) {
    const contact =
      document.getElementById(
        "organizer-contact"
      );

    if (contact) {
      contact.href = `mailto:${email}`;
      contact.hidden = false;
    }
  }
}

/*
 * ============================================================
 * PROFIL ET SESSION
 * ============================================================
 */

async function chargerProfil(userId) {
  const { data, error } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, firstname, lastname, created_at"
      )
      .eq("id", userId)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

function afficherUtilisateurConnecte(profil) {
  utilisateurCourant = profil;

  const nonConnecte =
    document.getElementById("not-connected");

  const connecte =
    document.getElementById("connected");

  const nom =
    document.getElementById(
      "current-user-name"
    );

  const username =
    document.getElementById(
      "current-username"
    );

  if (nonConnecte) {
    nonConnecte.hidden = true;
  }

  if (connecte) {
    connecte.hidden = false;
  }

  if (nom) {
    nom.textContent =
      `${profil.firstname} ${profil.lastname}`;
  }

  if (username) {
    username.textContent = profil.username;
  }

  afficherJeux();
}

function afficherUtilisateurDeconnecte() {
  utilisateurCourant = null;

  const nonConnecte =
    document.getElementById("not-connected");

  const connecte =
    document.getElementById("connected");

  if (nonConnecte) {
    nonConnecte.hidden = false;
  }

  if (connecte) {
    connecte.hidden = true;
  }

  afficherJeux();
}

async function synchroniserSession() {
  if (!supabaseClient) {
    afficherUtilisateurDeconnecte();
    return;
  }

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(
      "Erreur de lecture de session :",
      error
    );

    afficherUtilisateurDeconnecte();
    return;
  }

  if (!session?.user) {
    afficherUtilisateurDeconnecte();
    return;
  }

  try {
    const profil =
      await chargerProfil(session.user.id);

    afficherUtilisateurConnecte(profil);
  } catch (profilError) {
    console.error(
      "Profil introuvable :",
      profilError
    );

    await supabaseClient.auth.signOut();
    afficherUtilisateurDeconnecte();

    afficherMessageAuth(
      "Votre session existe, mais votre profil est introuvable.",
      "error"
    );
  }
}

/*
 * ============================================================
 * INSCRIPTION SÉCURISÉE
 * ============================================================
 */

async function creerCompte(event) {
  event.preventDefault();

  afficherMessageAuth("");

  const bouton =
    document.getElementById("register-btn");

  const firstname =
    document
      .getElementById("register-firstname")
      ?.value.trim();

  const lastname =
    document
      .getElementById("register-lastname")
      ?.value.trim();

  const username =
    normaliserIdentifiant(
      document
        .getElementById("register-username")
        ?.value
    );

  const password =
    document
      .getElementById("register-password")
      ?.value || "";

  if (
    !firstname ||
    !lastname ||
    !username ||
    !password
  ) {
    afficherMessageAuth(
      "Merci de remplir tous les champs.",
      "error"
    );

    return;
  }

  if (!identifiantValide(username)) {
    afficherMessageAuth(
      "L'identifiant doit contenir de 3 à 30 caractères : lettres sans accent, chiffres, point, tiret ou underscore.",
      "error"
    );

    return;
  }

  if (password.length < 8) {
    afficherMessageAuth(
      "Le mot de passe doit contenir au moins 8 caractères.",
      "error"
    );

    return;
  }

  definirChargement(
    bouton,
    true,
    "Créer mon compte",
    "Création…"
  );

  const emailTechnique =
    construireEmailTechnique(username);

  try {
    const {
      data: authData,
      error: authError
    } = await supabaseClient.auth.signUp({
      email: emailTechnique,
      password,
      options: {
        data: {
          username,
          firstname,
          lastname
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error(
        "Le compte n'a pas pu être créé."
      );
    }

    /*
     * Avec « Confirm email » désactivé,
     * signUp doit retourner une session.
     */

    if (!authData.session) {
      throw new Error(
        "Le compte a été créé, mais aucune session n'a été ouverte. Vérifiez que la confirmation d'adresse est désactivée dans Supabase."
      );
    }

    const {
      data: profil,
      error: profilError
    } = await supabaseClient
      .from("profiles")
      .insert({
        id: authData.user.id,
        username,
        firstname,
        lastname
      })
      .select(
        "id, username, firstname, lastname, created_at"
      )
      .single();

    if (profilError) {
      await supabaseClient.auth.signOut();

      if (
        profilError.code === "23505"
      ) {
        throw new Error(
          "Cet identifiant est déjà utilisé."
        );
      }

      throw profilError;
    }

    document
      .getElementById("register-form")
      ?.reset();

    afficherUtilisateurConnecte(profil);

    afficherMessageAuth(
      "Compte créé. Vous êtes maintenant connecté.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erreur d'inscription :",
      error
    );

    let message =
      echapperErreur(error);

    if (
      /already registered|already exists|duplicate/i.test(
        message
      )
    ) {
      message =
        "Cet identifiant est déjà utilisé.";
    }

    afficherMessageAuth(
      message,
      "error"
    );
  } finally {
    definirChargement(
      bouton,
      false,
      "Créer mon compte",
      "Création…"
    );
  }
}

/*
 * ============================================================
 * CONNEXION
 * ============================================================
 */

async function connecter(event) {
  event.preventDefault();

  afficherMessageAuth("");

  const bouton =
    document.getElementById("login-btn");

  const username =
    normaliserIdentifiant(
      document
        .getElementById("login-username")
        ?.value
    );

  const password =
    document
      .getElementById("login-password")
      ?.value || "";

  if (!username || !password) {
    afficherMessageAuth(
      "Saisissez votre identifiant et votre mot de passe.",
      "error"
    );

    return;
  }

  if (!identifiantValide(username)) {
    afficherMessageAuth(
      "Identifiant ou mot de passe incorrect.",
      "error"
    );

    return;
  }

  definirChargement(
    bouton,
    true,
    "Se connecter",
    "Connexion…"
  );

  try {
    const emailTechnique =
      construireEmailTechnique(username);

    const {
      data,
      error
    } =
      await supabaseClient.auth
        .signInWithPassword({
          email: emailTechnique,
          password
        });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error(
        "Identifiant ou mot de passe incorrect."
      );
    }

    const profil =
      await chargerProfil(data.user.id);

    document
      .getElementById("login-form")
      ?.reset();

    afficherUtilisateurConnecte(profil);

    afficherMessageAuth(
      "Connexion réussie.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erreur de connexion :",
      error
    );

    afficherMessageAuth(
      "Identifiant ou mot de passe incorrect.",
      "error"
    );
  } finally {
    definirChargement(
      bouton,
      false,
      "Se connecter",
      "Connexion…"
    );
  }
}

/*
 * ============================================================
 * DÉCONNEXION
 * ============================================================
 */

async function deconnecter() {
  const bouton =
    document.getElementById("logout-btn");

  definirChargement(
    bouton,
    true,
    "Déconnexion",
    "Déconnexion…"
  );

  try {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      throw error;
    }

    afficherUtilisateurDeconnecte();

    afficherMessageAuth(
      "Vous êtes déconnecté.",
      "success"
    );
  } catch (error) {
    console.error(
      "Erreur de déconnexion :",
      error
    );

    afficherMessageAuth(
      "La déconnexion n'a pas pu être terminée.",
      "error"
    );
  } finally {
    definirChargement(
      bouton,
      false,
      "Déconnexion",
      "Déconnexion…"
    );
  }
}

/*
 * ============================================================
 * TEST DE CONNEXION SUPABASE
 * ============================================================
 */

async function testerConnexionSupabase() {
  if (!supabaseClient) {
    afficherEtatSupabase(
      "Connexion aux services indisponible.",
      "error"
    );

    return false;
  }

  if (
    SUPABASE_PUBLISHABLE_KEY ===
    "REMPLACEZ_PAR_VOTRE_CLE_SB_PUBLISHABLE"
  ) {
    afficherEtatSupabase(
      "Configuration Supabase incomplète.",
      "error"
    );

    console.error(
      "Ajoutez la Publishable Key dans script.js."
    );

    return false;
  }

  afficherEtatSupabase(
    "Vérification de la connexion…",
    "loading"
  );

  try {
    const { data, error } =
      await supabaseClient
        .from("games")
        .select("id, name")
        .order("name", {
          ascending: true
        });

    if (error) {
      throw error;
    }

    console.log(
      "Connexion Supabase réussie. Jeux reçus :",
      data
    );

    afficherEtatSupabase(
      "Connexion aux services validée.",
      "success"
    );

    return true;
  } catch (error) {
    console.error(
      "Erreur de connexion Supabase :",
      error
    );

    afficherEtatSupabase(
      "Impossible de joindre le service des jeux.",
      "error"
    );

    return false;
  }
}

/*
 * ============================================================
 * ÉVÉNEMENTS D'AUTHENTIFICATION
 * ============================================================
 */

function installerEvenements() {
  document
    .getElementById("register-form")
    ?.addEventListener(
      "submit",
      creerCompte
    );

  document
    .getElementById("login-form")
    ?.addEventListener(
      "submit",
      connecter
    );

  document
    .getElementById("logout-btn")
    ?.addEventListener(
      "click",
      deconnecter
    );

  supabaseClient?.auth.onAuthStateChange(
    async (event, session) => {
      if (event === "SIGNED_OUT") {
        afficherUtilisateurDeconnecte();
        return;
      }

      if (
        event === "SIGNED_IN" &&
        session?.user
      ) {
        try {
          const profil =
            await chargerProfil(
              session.user.id
            );

          afficherUtilisateurConnecte(
            profil
          );
        } catch (error) {
          /*
           * Lors de l'inscription, le profil peut être créé
           * juste après l'événement SIGNED_IN.
           * L'erreur est donc seulement journalisée ici.
           */
          console.debug(
            "Profil en cours de création :",
            error
          );
        }
      }
    }
  );
}

/*
 * ============================================================
 * INITIALISATION
 * ============================================================
 */

async function initialiserHub() {
  afficherJeux();
  personnaliser();
  installerEvenements();

  const connexionDisponible =
    await testerConnexionSupabase();

  if (connexionDisponible) {
    await synchroniserSession();
  } else {
    afficherUtilisateurDeconnecte();
  }
}

initialiserHub();
