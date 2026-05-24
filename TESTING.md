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
npm run test:e2e:matrix
npm run test:preview
npm run test:load
npm run test:e2e:ui
npm run test:coverage
npm run test
```

Notes:

- `npm run test:integration` démarre `db`, `redis`, `backend`, exécute `manage.py check`, `makemigrations --check --dry-run`, puis la suite backend `pytest` complète en forçant `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test` dans le conteneur backend.
- `npm run test:e2e` lance successivement les suites Playwright backoffice puis client avec la stack Docker nécessaire, attend les URLs exposées, puis imprime `docker compose ps` et les logs des services concernés si une suite échoue.
- `npm run test:e2e:matrix` lance un smoke élargi multi-browser et mobile réel via Firefox, WebKit et Chromium mobile, en s'appuyant sur une petite sélection de specs stables plutôt que sur toute la suite métier.
- `npm run test:preview` démarre une stack Compose de preview avec `vite preview` pour les deux frontends et valide que backend, backoffice et client répondent bien comme en environnement pré-prod.
- `npm run test:load` lance un smoke Locust Dockerisé contre l'API backend. Les variables `LOCUST_USERS`, `LOCUST_SPAWN_RATE` et `LOCUST_RUN_TIME` permettent de régler la campagne.
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
docker compose exec -T -e DJANGO_SETTINGS_MODULE=tastify_backend.settings.test backend python -m pytest -q
docker compose down --remove-orphans
```

## Base de données de test

- Le backend de test tourne dans Docker contre MySQL du `docker-compose.yml`.
- `pytest.ini` utilise `tastify_backend.settings.test`.
- Le conteneur backend démarre normalement sur les settings de dev; les commandes de test Docker qui doivent rester isolées du runtime MySQL forcent donc explicitement `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test`.
- La commande backend supportée en CI et en local passe désormais par `tastify_backend.settings.test`, ce qui isole `pytest-django` du runtime MySQL de développement tout en gardant l’exécution Dockerisée.
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

## CI/CD GitHub Actions

- Le workflow principal est [C:\Users\mehdi\Documents\GitHub\TastifyPFA\.github\workflows\backoffice-ci.yml](/C:/Users/mehdi/Documents/GitHub/TastifyPFA/.github/workflows/backoffice-ci.yml).
- Les pushes qui ne touchent que `.planning/`, `docs/brain/` ou `dashboard.html` ne déclenchent plus la pipeline GitHub.
- Un job `Detect impacted surfaces` calcule ensuite quelles surfaces sont réellement touchées:
  - frontend global
  - backend
  - client
  - backoffice
  - tooling CI
- Les jobs lourds ne tournent que si leur surface a changé, avec cette logique:
  - `Frontend quality` pour changements frontend ou CI
  - `Backend pytest` pour changements backend ou CI
  - `Client Playwright E2E` pour changements client, backend ou CI
  - `Backoffice Playwright E2E` pour changements backoffice, backend ou CI
- `workflow_dispatch` expose l’option `full_run` pour forcer une exécution complète même si l’analyse des chemins aurait sauté certains jobs.
- Les jobs Playwright GitHub réutilisent maintenant le runner racine `node scripts/testing/run-suite.mjs e2e:client` et `node scripts/testing/run-suite.mjs e2e:backoffice`, ce qui aligne la CI avec les mêmes probes de readiness Docker qu’en local.
- `Dependency review` bloque les pull requests qui introduisent une dépendance GitHub signalée en gravité `high`.
- `Dependency security audits` exécute `npm audit --omit=dev --audit-level=high` sur les deux frontends et publie aussi un rapport `pip-audit` backend en artefact.
- `Expanded browser smoke` valide la matrice Firefox + WebKit + mobile Chromium côté client, ainsi qu’un smoke Firefox + mobile staff côté backoffice.
- `Preview smoke` reconstruit les deux SPAs en mode preview et vérifie leurs endpoints publics.
- `Load tests` s’exécute en manuel, en nightly, ou lors d’un `full_run` forcé, puis archive les rapports Locust sous `artifacts/load-tests`.

## Validation effectuée pour cette mise en place

- `npm run test:integration` a passe depuis la racine
- `npm run test:e2e` a passe depuis la racine
- `npm run test:e2e:matrix` a passe depuis la racine
- `npm run test:preview` a passe depuis la racine
- `LOCUST_USERS=8 LOCUST_SPAWN_RATE=2 LOCUST_RUN_TIME=20s npm run test:load` a passe depuis la racine
- `npm run build` a passe dans `app/frontend/client-app`
- `npm run build` a passe dans `app/frontend/backoffice-app`

## Workflows restant à couvrir ou à renforcer

- Reset password: non implémenté côté produit actuellement
- Emails / notifications: aucune chaîne transactionnelle exploitable détectée
- Dashboard analytics: quelques tests backend existent, mais il manque encore un smoke E2E dédié aux KPI
- Responsive avancé des écrans staff denses: seulement un smoke ciblé par rôle pour l’instant, pas une campagne complète sur tous les parcours
- `pip-audit` backend remonte encore des vulnérabilités upstream dans certaines dépendances Python, donc le rapport est actuellement publié en artefact CI au lieu de bloquer tout le workflow
- Warnings DRF historiques (`min_value should be a Decimal instance`) encore présents dans plusieurs domaines backend; ils n’empêchent plus `pytest`, mais méritent un nettoyage ciblé
