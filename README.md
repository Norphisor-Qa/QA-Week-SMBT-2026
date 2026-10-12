# Quality Week : hub des mini-jeux

Page statique en français, sans framework, backend, suivi utilisateur ni collecte de données. Les quatre jeux sont des exemples de cartes : les mini-jeux eux-mêmes ne sont pas inclus. Tous les boutons sont initialement désactivés.

## Fichiers

- `index.html` : structure et textes de la page.
- `style.css` : palette, mise en page responsive et accessibilité.
- `script.js` : configuration, jeux et création des cartes.
- `README.md` : ce guide.

## Essayer la page

Placez les trois fichiers de code dans le même dossier, puis ouvrez `index.html` dans un navigateur. Aucun outil de compilation n'est requis. Gardez les noms de fichiers inchangés.

## Configurer les jeux

Dans `script.js`, modifiez le tableau `jeux`. Chaque objet contient `id`, `titre`, `description`, `icone`, `duree`, `lien` et `disponible`.

Exemple pour un jeu local que vous aurez ajouté au dépôt :

```js
{
  id: "quiz",
  titre: "Quiz qualité",
  description: "Explorez les bons réflexes qualité.",
  icone: "?",
  duree: "", // Facultatif : renseigner une durée réelle si connue.
  lien: "./jeux/quiz/index.html",
  disponible: true
}
```

Le chemin ci-dessus est un exemple : le fichier du jeu n'est pas fourni. Pour activer un bouton, renseignez un lien valide et passez `disponible` à `true`. Un lien vide conserve l'état « Bientôt disponible ». Les liens s'ouvrent dans le même onglet. Les liens HTTP(S) sont acceptés, mais leur existence n'est pas vérifiée automatiquement.

Pour passer à trois jeux, supprimez un objet du tableau. La grille s'adapte sans modifier le HTML. Utilisez des identifiants distincts. Laissez `duree` vide pour ne pas afficher de durée.

## Ajouter le logo et le contact

Aucun logo officiel n'est inclus. Ajoutez uniquement un fichier dont l'utilisation et la publication ont été autorisées. Exemple de configuration :

```js
const configuration = {
  logo: "./assets/logo-stryker.png",
  contact: ""
};
```

Créez alors le dossier `assets` et ajoutez le fichier correspondant. Le logo reste masqué si le chemin est vide ou si le chargement échoue. Pour afficher le lien de contact, renseignez une adresse e-mail autorisée dans `contact`. Elle sera visible dans le code publié.

## Palette

Les variables CSS sont regroupées dans `:root` : or `#FFB500`, blanc `#FFFFFF`, noir `#000000`, gris `#B2B4AE`. Le fond reste blanc, les textes noirs et les boutons principaux or. Cette page est une proposition de design, pas une certification de conformité à la charte de marque. Faites valider le rendu et l'utilisation du logo avant diffusion.

## Publication sur GitHub Pages

### Avant de publier

Vérifiez que votre organisation autorise l'hébergement choisi et la diffusion du contenu. Ne publiez pas de données internes, documents confidentiels, informations patients, mots de passe ou secrets. Un dépôt privé ne garantit pas que le site Pages est privé : la documentation GitHub avertit que les sites peuvent être accessibles publiquement, même lorsque le dépôt est privé. Ce hub ne comporte aucune authentification.

### Source de publication

Préparation recommandée pour ce projet : placez les quatre fichiers à la racine d'un dépôt autorisé, sur une branche existante, par exemple `main`. Ajoutez aussi les ressources et les jeux locaux si nécessaire.

La procédure suivante correspond à la publication depuis une branche décrite par GitHub :

1. Ouvrez le dépôt dans GitHub.
2. Ouvrez **Settings** (Paramètres).
3. Dans la barre latérale, ouvrez **Pages**.
4. Sous **Build and deployment**, dans **Source**, choisissez **Deploy from a branch**.
5. Sélectionnez la branche contenant les fichiers, par exemple `main`.
6. Sélectionnez le dossier racine **/ (root)**.
7. Cliquez sur **Save**.

GitHub indique que les modifications envoyées sur la branche et dans le dossier source seront publiées. La configuration de la source nécessite des droits administrateur ou mainteneur. La disponibilité de Pages dépend du plan et de la visibilité du dépôt ; si l'option manque, consultez l'administrateur du dépôt.

Source officielle : [Configurer une source de publication GitHub Pages](https://docs.github.com/fr/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Vérifications avant diffusion

- Contrôlez la page sur mobile et ordinateur.
- Parcourez les liens au clavier avec Tab et activez-les avec Entrée.
- Testez chaque jeu disponible et ses ressources.
- Respectez la casse des noms de fichiers et conservez les chemins relatifs `./` pour les fichiers locaux.
- Vérifiez le rendu avec trois puis quatre jeux.
- Si une page est introuvable, contrôlez le chemin, la présence du fichier et la source de publication.
- Faites valider le contenu, la marque et la visibilité avant de partager le lien.
