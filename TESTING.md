# Testing

## Objectif
La stratégie privilégie les workflows qui cassent le plus cher:

- auth client et staff
- permissions par rôle
- configuration/branding backoffice
- paiements QR / split bill
- builds frontend
- smoke E2E des parcours publics et des écrans staff critiques

Le dépôt contient déjà beaucoup de tests backend métier et des E2E Playwright. Cette couche ajoute un point d’entrée unique, stabilise les suites vraiment utiles en CI, et documente ce qui reste hors scope.

## Stack de test retenue

- Backend: `pytest` + `pytest-django` via Docker Compose
- Frontend React/Vite: `Vitest` + Testing Library
- E2E: `Playwright`
- Accessibilité basique: `@axe-core/playwright`

## Commandes racine

Depuis la racine du repo:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:e2e:ui
npm run test:coverage
npm run test
```

Notes:

- `npm run test:integration` démarre `db`, `redis`, `backend`, exécute `manage.py check`, `makemigrations --check --dry-run`, puis le sous-ensemble `pytest` critique en forçant `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test` dans le conteneur backend.
- `npm run test:e2e` lance successivement les suites Playwright backoffice puis client avec la stack Docker nécessaire, attend les URLs exposées, puis imprime `docker compose ps` et les logs des services concernés si une suite échoue.
- `npm run test:e2e:ui` ouvre Playwright UI pour le backoffice par défaut. Pour le portail client: `PLAYWRIGHT_APP=client npm run test:e2e:ui`.
- `npm run build`, `npm run test:integration`, `npm run test:e2e` et `npm run test` exigent Docker Desktop démarré, car le backend et la DB de test sont conteneurisés.

## Commandes par application

### Backoffice

```bash
cd app/frontend/backoffice-app
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
npm run test:coverage
```

### Client

```bash
cd app/frontend/client-app
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
npm run test:coverage
```

### Backend

```bash
docker compose up -d --build db redis backend
docker compose exec -T backend python manage.py check
docker compose exec -T backend python manage.py makemigrations --check --dry-run
docker compose exec -T -e DJANGO_SETTINGS_MODULE=tastify_backend.settings.test backend python -m pytest apps/users/tests/test_auth.py apps/users/tests/test_register.py apps/configuration/tests/test_settings_api.py apps/paiements/tests/test_api.py
docker compose down --remove-orphans
```

## Base de données de test

- Le backend de test tourne dans Docker contre MySQL du `docker-compose.yml`.
- `pytest.ini` utilise `tastify_backend.settings.test`.
- Le conteneur backend démarre normalement sur les settings de dev; les commandes de test Docker qui doivent rester isolées du runtime MySQL forcent donc explicitement `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test`.
- Les tests backend retenus pour la CI réutilisent la DB de test (`--reuse-db`) afin d’éviter des temps morts inutiles.
- Si vous modifiez un modèle Django, exécutez aussi:

```bash
docker compose exec -T backend python manage.py makemigrations --check --dry-run
```

## Comment écrire un nouveau test

### Backend

- Placez les tests au plus près du domaine: `app/backend/apps/<domaine>/tests/`.
- Ciblez la logique métier, les permissions et les contrats API.
- Préférez des fixtures simples et des payloads réalistes.
- Si le scénario traverse plusieurs apps, classez-le en intégration/API et gardez-le focalisé sur un seul workflow.

### Frontend

- Tests unitaires dans `src/**/*.test.ts(x)`.
- Testez les comportements critiques: validation, sérialisation, appels API, état auth.
- Mockez les dépendances réseau au niveau du module API plutôt que de mocker toute l’application.

### Playwright

- Placez les specs dans `tests/e2e/`.
- Réservez les E2E aux workflows bout en bout ou aux risques de régression UI/navigation.
- Pour l’accessibilité basique, filtrez au minimum les violations `critical` et `serious`.

## Workflows couverts

- Inscription client: validation front + création backend forcée en rôle `CLIENT`
- Connexion client/staff: backend JWT/cookies + E2E portails
- Logout / refresh cookies séparés par portail
- Rôles/permissions: auth backend existante + settings manager-only
- Configuration / admin branding: lecture publique + patch manager + upload logo
- Paiement QR / payable session / split / paiement manuel: backend API
- Responsive basique: pages publiques login/home en viewport mobile
- Accessibilité basique: login client et staff sans violations `critical`/`serious`
- Build frontend: backoffice + client
- Build backend: `docker compose build backend`

## Validation effectuée pour cette mise en place

- `npm run test:integration` a passe depuis la racine
- `npm run test:e2e` a passe depuis la racine
- `npm run build` a passe dans `app/frontend/client-app`
- `npm run build` a passe dans `app/frontend/backoffice-app`

## Workflows restant à couvrir ou à renforcer

- Reset password: non implémenté côté produit actuellement
- Emails / notifications: aucune chaîne transactionnelle exploitable détectée
- Dashboard analytics: quelques tests backend existent, mais il manque encore un smoke E2E dédié aux KPI
- Responsive avancé des écrans staff denses: seulement un smoke ciblé par rôle pour l’instant
- Régression complète de tout `pytest`: le monorepo contient encore des modules legacy cassés hors périmètre de cette stratégie
