"use strict";

// Facultatif : chemin du logo autorise et adresse e-mail de l'organisation.
const configuration = { logo: "", contact: "" };

// Pour activer un jeu, renseignez lien et passez disponible a true.
// Laissez duree vide si elle n'est pas connue. Les jeux ne sont pas inclus.
const jeux = [
  { id: "match3", titre: "Quality Crush", description: "Un jeu de type Candy Crush : associez les symboles et relevez le d\u00e9fi !", icone: "\u25c6", duree: "", lien: "", disponible: false },
  { id: "jump", titre: "Quality Jump", description: "Un jeu de type Doodle Jump : sautez de plateforme en plateforme et visez toujours plus haut !", icone: "\u2191", duree: "", lien: "./Game/Quality Jump/index.html", disponible: true },
  { id: "escape", titre: "Escape game interactif", description: "Explorez, trouvez les indices et r\u00e9solvez les \u00e9nigmes pour accomplir votre mission.", icone: "\u2315", duree: "", lien: "", disponible: false },
  { id: "scenarios", titre: "10 sc\u00e9narios qualit\u00e9", description: "Face \u00e0 10 situations, choisissez les bonnes r\u00e9ponses et les actions adapt\u00e9es.", icone: "?", duree: "", lien: "", disponible: false }
];

function lienValide(valeur) {
  if (typeof valeur !== "string" || !valeur.trim() || valeur.trim().startsWith("#")) return null;
  try {
    const brut = valeur.trim();
    const url = new URL(brut, window.location.href);
    if (["http:", "https:"].includes(url.protocol)) return brut;
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
