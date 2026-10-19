"use strict";

/*
 * ============================================================
 * CONFIGURATION SUPABASE
 * ============================================================
 *
 * La Project URL peut être visible publiquement.
 * La Publishable Key peut aussi être utilisée dans le navigateur.
 *
 * Ne mettez jamais ici une clé commençant par :
 * sb_secret_
 */

const SUPABASE_URL =
  "https://pglstqfawauvxvezyigc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_YaLtd-n5jALpGOUYSJriQA_h_9X_OLY";

/*
 * On utilise le nom supabaseClient afin d’éviter le conflit :
 * "Identifier 'supabase' has already been declared".
 */

let supabaseClient = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === "function"
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  console.error(
    "La bibliothèque Supabase n’a pas été chargée."
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

/*
 * Pour activer un jeu :
 * 1. renseignez son lien ;
 * 2. passez disponible à true.
 *
 * Les identifiants Supabase sont indiqués avec gameId.
 */

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
 * OUTILS GÉNÉRAUX
 * ============================================================
 */

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
    console.error("Lien de jeu incorrect :", valeur, error);
    return null;
  }

  return null;
}

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

/*
 * ============================================================
 * AFFICHAGE DES JEUX
 * ============================================================
 */

function afficherJeux() {
  const grille = document.getElementById("games-grid");
  const messageVide = document.getElementById("games-empty");

  if (!grille || !messageVide) {
    console.error(
      "Les éléments games-grid ou games-empty sont absents du HTML."
    );
    return;
  }

  grille.replaceChildren();

  const fragment = document.createDocumentFragment();

  jeux.forEach((jeu, index) => {
    const lien = lienValide(jeu.lien);
    const actif =
      jeu.disponible === true &&
      lien !== null;

    const carte = element("article", "game-card");
    carte.dataset.gameId = jeu.gameId;

    const titre = element("h3", "", jeu.titre);
    titre.id = `jeu-titre-${index}`;

    carte.setAttribute(
      "aria-labelledby",
      titre.id
    );

    const haut = element("div", "card-top");

    const icone = element(
      "span",
      "game-icon",
      jeu.icone
    );

    icone.setAttribute("aria-hidden", "true");

    const badge = element(
      "span",
      actif ? "badge available" : "badge",
      actif ? "Disponible" : "Bientôt disponible"
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

    const bouton = element(
      actif ? "a" : "button",
      "button",
      actif ? "Jouer →" : "Bientôt disponible"
    );

    if (actif) {
      bouton.href = lien;

      bouton.setAttribute(
        "aria-label",
        `Jouer : ${jeu.titre}`
      );

      bouton.dataset.gameId = jeu.gameId;
    } else {
      bouton.type = "button";
      bouton.disabled = true;
    }

    carte.append(bouton);
    fragment.append(carte);
  });

  grille.append(fragment);
  messageVide.hidden = jeux.length > 0;
}

/*
 * ============================================================
 * PERSONNALISATION DU HUB
 * ============================================================
 */

function personnaliser() {
  const logo = document.getElementById("brand-logo");
  const placeholder =
    document.getElementById("brand-placeholder");

  const chemin = lienValide(configuration.logo);

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
      document.getElementById("organizer-contact");

    if (contact) {
      contact.href = `mailto:${email}`;
      contact.hidden = false;
    }
  }
}

/*
 * ============================================================
 * TEST DE CONNEXION DU VRAI HUB À SUPABASE
 * ============================================================
 */

function afficherEtatSupabase(message, type) {
  const statut =
    document.getElementById("supabase-status");

  if (!statut) {
    return;
  }

  statut.textContent = message;
  statut.dataset.status = type;
}

async function testerConnexionSupabase() {
  if (!supabaseClient) {
    afficherEtatSupabase(
      "Connexion aux services indisponible.",
      "error"
    );

    return;
  }

  if (
    SUPABASE_PUBLISHABLE_KEY ===
    "REMPLACEZ_ICI_PAR_VOTRE_CLE_SB_PUBLISHABLE"
  ) {
    afficherEtatSupabase(
      "Configuration Supabase incomplète : ajoutez la Publishable Key dans script.js.",
      "error"
    );

    console.error(
      "La Publishable Key Supabase n’a pas encore été renseignée."
    );

    return;
  }

  afficherEtatSupabase(
    "Vérification de la connexion…",
    "loading"
  );

  try {
    const { data, error } = await supabaseClient
      .from("games")
      .select("id, name")
      .order("name", { ascending: true });

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
  } catch (error) {
    console.error(
      "Erreur de connexion Supabase :",
      error
    );

    afficherEtatSupabase(
      "Impossible de joindre le service des jeux.",
      "error"
    );
  }
}

/*
 * ============================================================
 * INITIALISATION
 * ============================================================
 */

async function initialiserHub() {
  afficherJeux();
  personnaliser();
  await testerConnexionSupabase();
}

initialiserHub();
