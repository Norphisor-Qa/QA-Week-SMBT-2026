# Quality Week 2026 : hub des mini-jeux

Site statique en français (HTML/CSS/JS, sans framework) hébergé sur GitHub Pages, avec authentification et scores gérés par **Supabase**.

## Structure

```
/
├── index.html            Connexion / inscription (auth.js)
├── auth.js               Inscription et connexion Supabase
├── hub.html / hub.js     Hub des jeux, score total, classement général
├── style.css             Styles du hub et de la connexion
├── README.md
└── Game/
    ├── supabase-score.js         Module de scores PARTAGÉ par tous les jeux
    ├── Quality Crush/index.html          game_id : quality-crush
    ├── Quality Jump/index.html           game_id : quality-jump
    ├── Quality Run/index.html            game_id : quality-run
    ├── 10 scénarios qualité/index.html   game_id : scenarios
    └── Escape game interactif/index.html game_id : escape-game (à intégrer)
```

Respectez exactement la casse : `index.html` en minuscules à la racine (GitHub Pages distingue majuscules et minuscules).

## Fonctionnement des scores

- Chaque joueur se connecte sur `index.html`, puis arrive sur `hub.html`.
- Chaque jeu charge `Game/supabase-score.js`, vérifie la session et lit le meilleur score du joueur.
- En fin de partie, le jeu appelle la fonction SQL `save_best_score(p_game_id, p_score)` : **seul le meilleur score est conservé** par jeu.
- Le hub additionne les meilleurs scores et affiche le classement (`get_leaderboard`).
- Si l'enregistrement échoue (réseau), le score est gardé dans le navigateur et renvoyé automatiquement à la prochaine ouverture du jeu.

Les `game_id` du hub (`hub.js`, tableau `games`) doivent être identiques à ceux utilisés dans les jeux. Si votre table `scores` ou la fonction `save_best_score` limite les valeurs de `game_id`, ajoutez-y les cinq identifiants ci-dessus.

## Brancher un nouveau jeu (ex. l'escape game)

1. Dans le `<head>` du jeu :
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" defer></script>
   <script src="../supabase-score.js" defer></script>
   ```
2. Au chargement :
   ```js
   let scores = null;
   window.addEventListener("DOMContentLoaded", async () => {
     const ready = await window.QWScores.boot("escape-game"); // écran "Connexion requise" automatique
     if (!ready) return;
     scores = ready.scores;            // ready.best = meilleur score actuel
   });
   ```
3. En fin de partie (score entier ≥ 0) :
   ```js
   const best = await scores.saveBestScore(score);
   ```
4. Ajouter un lien `<a href="../../hub.html">Retour au hub</a>`.
5. Dans `hub.js`, passer `available: true` sur la carte du jeu.

## Publication sur GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

La clé Supabase présente dans le code est une clé **publishable** : elle est faite pour être publique. La sécurité repose sur les règles RLS de Supabase et sur les fonctions SQL. Ne publiez jamais la clé `service_role`.

## Vérifications avant diffusion

- Tester inscription, connexion, déconnexion.
- Jouer une partie de chaque jeu et vérifier la mise à jour du score sur le hub.
- Tester sur mobile et ordinateur.
- Faire valider le contenu, la marque (logo) et la visibilité du site avant de partager le lien.
