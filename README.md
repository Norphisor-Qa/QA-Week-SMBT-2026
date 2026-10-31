# Quality Week 2026 : hub des mini-jeux

Site statique bilingue (français / anglais), sans framework, hébergé sur GitHub Pages. La connexion et les scores sont gérés par **Supabase**.

## Structure

```
/
├── index.html / auth.js    Connexion / inscription
├── hub.html / hub.js       Hub : jeux, score total, barème, classement
├── i18n.js                 Choix de la langue (FR | EN)
├── style.css
├── logo-stryker.png        Logo affiché sur toutes les pages
├── supabase-daily.sql      Script SQL du Défi du jour (à exécuter une fois)
├── CHECKLIST.md            Checklist de déploiement et de tests
└── Game/
    ├── supabase-score.js               Module Supabase partagé
    ├── Défi du jour/index.html         game_id : daily
    ├── Quality Crush/index.html        game_id : quality-crush
    ├── Quality Run/index.html          game_id : quality-run
    └── 10 scénarios qualité/index.html game_id : scenarios
```

## Barème (points hub)

| Jeu | Points envoyés au hub | Maximum |
|---|---|---|
| Défi du jour | 200 + 300 + 500 par jour | 1 000 / jour |
| Quality Crush | 40 / 70 / 100 par niveau réussi (1 / 2 / 3 étoiles) | 5 000 |
| Quality Run | Meilleure course ÷ 3 | 5 000 |
| 10 scénarios qualité | Jusqu’à 500 par dossier | 5 000 |

## Mise en place

Suivez `CHECKLIST.md`. Points essentiels : exécuter `supabase-daily.sql`, autoriser les `game_id`, vider `daily_plays` et `scores` juste avant l’ouverture.

La clé Supabase du code est une clé **publishable**, prévue pour être publique. Ne publiez jamais la clé `service_role`.
