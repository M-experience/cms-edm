# Cms-Edm

Gestion multi-sites de l'École du Design des Mutations : édition directe sur la page, rôles (rédacteur, validateur, administrateur), historique des versions, génération statique et dépôt sur l'hébergement Hostinger.

- `index.html`, `app.js`, `admin.css` : application d'administration (GitHub Pages)
- `render/` : moteur de rendu commun (éditeur et génération), styles et script des sites publics
- `themes/edm/` : contenu par défaut et images du thème EDM
- `build/build.js` : génération statique et dépôt FTP (GitHub Actions, `.github/workflows/build.yml`)
- `supabase/functions/deploy` : déclenchement de la génération après une publication

Base Supabase : projet `cms-edm` (organisation EDM).

## Secrets à configurer

GitHub (Settings > Secrets and variables > Actions) : `SUPABASE_SERVICE_KEY`, `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`.
Supabase (Edge Functions > Secrets), facultatif : `GITHUB_TOKEN` (jeton limité au dépôt, pour une génération immédiate ; sinon la tâche planifiée passe toutes les quinze minutes).
