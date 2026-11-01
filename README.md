# Quality Week 2026 : hub des mini-jeux

Site statique bilingue (français / anglais) hébergé sur GitHub Pages ; connexion, scores **et progression** gérés par Supabase.

## Structure

```
/
├── index.html / auth.js      Connexion (affiche le compte déjà connecté : « Continuer » ou « Changer de compte »)
├── hub.html / hub.js         Hub, barème, classement
├── qw-session.js             Client Supabase unique + déconnexion + nettoyage du navigateur (partagé)
├── i18n.js                   Langue FR | EN
├── style.css                 Styles du hub et de la connexion
├── supabase-progress.sql     Table « game_progress » (à exécuter une fois dans Supabase)
├── logo-stryker.png
└── Game/
    ├── supabase-score.js     Scores + progression (partagé)
    ├── music.js              Musiques libres de droits + réglages de confort (partagé)
    ├── qw-common.css         Barre du haut commune aux jeux
    ├── Défi du jour/         game_id : daily
    ├── Quality Crush/        game_id : quality-crush
    ├── Quality Run/          game_id : quality-run
    └── 10 scénarios qualité/ game_id : scenarios
```

## Installation Supabase (une seule fois)

Exécuter `supabase-progress.sql` dans Supabase (SQL Editor > New query > Run).
Cette table enregistre la progression de Quality Crush, des Scénarios et la partie du jour en cours du Défi du jour.
Sans elle, les jeux fonctionnent et les points sont enregistrés, mais la progression n'est pas sauvegardée (un message l'indique).

## Appareils partagés (PC, téléphone)

- Les résultats et la progression sont rattachés au **compte** dans Supabase, jamais au navigateur.
- « Déconnexion » ferme la session sur cet appareil uniquement et efface toutes les données de jeu du navigateur.
  Seules les préférences restent (langue, musique, texte agrandi, animations, vitesse, effets sonores).
- La page de connexion ne redirige plus automatiquement : elle affiche le compte ouvert et propose « Changer de compte ».
- Si le compte change pendant une partie (autre onglet, retour arrière), le jeu se bloque et demande un rechargement :
  aucun score ne peut être enregistré sur le mauvais compte.

## Remise à zéro complète

1. Dans Supabase : `truncate table public.scores; truncate table public.game_progress;` (+ tables du Défi du jour).
2. Dans `qw-session.js`, changer la valeur de `DATA_EPOCH`, puis publier : chaque navigateur efface ses anciennes données de jeu au prochain chargement.

## Musique

Chaque page choisit son morceau : `<script src="…/music.js" data-track="crush" defer></script>`
(morceaux disponibles : hub, crush, run, scenarios, daily). Les morceaux sont écrits dans `Game/music.js` (accords, mélodie, tempo) : ils peuvent être modifiés librement.

## Déblocage

- Quality Crush : niveaux 1 à 3 ouverts, puis le niveau N demande N − 1 étoiles au total.
- Scénarios : dossiers 1 à 3 ouverts, puis le dossier N demande N − 1 étoiles au total.

Valeur modifiable : constante `START_UNLOCKED` dans chaque jeu.

## Barème (points hub)

Défi du jour 1 000 / jour · Quality Crush 40/70/100 par niveau · Quality Run meilleure course ÷ 3 (max 5 000) · Scénarios 500 par dossier (10 meilleurs).
