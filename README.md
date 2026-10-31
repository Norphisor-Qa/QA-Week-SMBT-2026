# Quality Week 2026 : hub des mini-jeux

Site statique bilingue (français / anglais) hébergé sur GitHub Pages ; connexion et scores gérés par Supabase.

## Structure
```
/
├── index.html / auth.js     Connexion
├── hub.html / hub.js        Hub, barème, classement
├── i18n.js                  Langue FR | EN
├── style.css                Styles du hub et de la connexion
├── logo-stryker.png
└── Game/
    ├── supabase-score.js    Scores (partagé)
    ├── music.js             Musiques libres de droits + réglages de confort (partagé)
    ├── qw-common.css        Barre du haut commune aux jeux
    ├── Défi du jour/        game_id : daily
    ├── Quality Crush/       game_id : quality-crush
    ├── Quality Run/         game_id : quality-run
    └── 10 scénarios qualité/ game_id : scenarios
```

## Musique
Chaque page choisit son morceau : `<script src="../music.js" data-track="crush" defer></script>`
(morceaux disponibles : hub, crush, run, scenarios, daily). Les morceaux sont écrits dans `Game/music.js`
(accords, mélodie, tempo) : ils peuvent être modifiés librement.

## Déblocage
- Quality Crush : niveaux 1 à 3 ouverts, puis +1 niveau par niveau terminé avec 3 étoiles.
- Scénarios : dossiers 1 à 3 ouverts, puis +1 dossier par dossier terminé avec 3 étoiles.
Valeur modifiable : constante `START_UNLOCKED` dans chaque jeu.

## Barème (points hub)
Défi du jour 1 000 / jour · Quality Crush 40/70/100 par niveau · Quality Run meilleure course ÷ 3 (max 5 000) · Scénarios 500 par dossier (10 meilleurs).
