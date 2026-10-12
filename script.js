"use strict";

// PERSONNALISATION : renseigner un fichier de logo autorise et un contact.
// Laisser vide pour masquer ces elements. Aucun logo officiel n'est fourni.
const configuration = {
  logo: "", // Exemple : "./assets/logo-stryker.png"
  contact: "" // Adresse e-mail de l'organisation, facultative.
};

// Ajouter ou supprimer un objet pour changer le nombre de jeux.
// Pour activer un jeu : renseigner son lien ET passer disponible a true.
// duree est un texte facultatif : laisser vide si elle n'est pas connue.
const jeux = [
  { id: "quiz", titre: "Quiz qualit\u00e9", description: "Explorez les bons r\u00e9flexes qualit\u00e9 avec un quiz interactif.", icone: "?", duree: "5 min", lien: "./jeux/quiz/index.html", disponible: true },
  { id: "anomalie", titre: "Cherche l'anomalie", description: "Observez les d\u00e9tails et rep\u00e9rez ce qui sort de l'ordinaire.", icone: "\u2315", duree: "", lien: "", disponible: false },
  { id: "tracabilite", titre: "D\u00e9fi tra\u00e7abilit\u00e9", description: "Suivez les indices et reconstituez le parcours d'un produit.", icone: "\u21c4", duree: "", lien: "", disponible: false },
  { id: "amelioration", titre: "Mission am\u00e9lioration continue", description: "Identifiez des pistes pour rendre le quotidien plus simple et plus fiable.", icone: "\u2197", duree: "", lien: "", disponible: false }
];

// Autorise uniquement les liens relatifs et les adresses HTTP(S).
// Les protocoles executables, les ancres seules et les liens vides sont refuses.
function lienValide(valeur) {
  if (typeof valeur !== "string" || !valeur.trim() || valeur.trim().startsWith("#")) return null;
  try {
    const brut = valeur.trim();
    const url = new URL(brut, window.location.href);
    if (["http:", "https:"].includes(url.protocol)) return brut;
    // Permet l'ouverture locale des fichiers HTML pour les essais.
    if (window.location.protocol === "file:" && url.protocol === "file:" && !/^[a-z][a-z0-9+.-]*:/i.test(brut)) return brut;
  } catch { return null; }
  return null;
}

function element(balise, classe, texte) {
  const node = document.createElement(balise);
  if (classe) node.className = classe;
  if (texte !== undefined) node.textContent = texte;
  return node;
}

function afficherJeux() {
  const grille = document.getElementById("games-grid");
  grille.replaceChildren();
  const fragment = document.createDocumentFragment();
  jeux.forEach((jeu, index) => {
    const lien = lienValide(jeu.lien);
    const actif = jeu.disponible === true && lien !== null;
    const carte = element("article", "game-card");
    const titre = element("h3", "", jeu.titre);
    titre.id = `jeu-titre-${index}`;
    carte.dataset.gameId = jeu.id;
    carte.setAttribute("aria-labelledby", titre.id);
    const haut = element("div", "card-top");
    const icone = element("span", "game-icon", jeu.icone);
    icone.setAttribute("aria-hidden", "true");
    haut.append(icone, element("span", actif ? "badge available" : "badge", actif ? "Disponible" : "Bient\u00f4t disponible"));
    carte.append(haut, titre, element("p", "game-description", jeu.description));
    if (typeof jeu.duree === "string" && jeu.duree.trim()) {
      carte.append(element("p", "game-duration", `Dur\u00e9e indicative : ${jeu.duree}`));
    }
    const bouton = element(actif ? "a" : "button", "button", actif ? "Jouer \u2192" : "Bient\u00f4t disponible");
    if (actif) {
      bouton.href = lien;
      bouton.setAttribute("aria-label", `Jouer : ${jeu.titre}`);
    } else {
      bouton.type = "button";
      bouton.disabled = true;
    }
    carte.append(bouton);
    fragment.append(carte);
  });
  grille.append(fragment);
  document.getElementById("games-empty").hidden = jeux.length > 0;
}

function personnaliser() {
  const logo = document.getElementById("brand-logo");
  const chemin = lienValide(configuration.logo);
  if (chemin) {
    logo.addEventListener("load", () => {
      logo.hidden = false;
      document.getElementById("brand-placeholder").hidden = true;
    });
    logo.addEventListener("error", () => {
      logo.hidden = true;
      document.getElementById("brand-placeholder").hidden = false;
    });
    logo.src = chemin;
  }
  const email = configuration.contact.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[?&#]/.test(email)) {
    const contact = document.getElementById("organizer-contact");
    contact.href = `mailto:${email}`;
    contact.hidden = false;
  }
}

afficherJeux();
personnaliser();
