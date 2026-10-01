# Tastify

Tastify is a restaurant operations platform with separate customer and back-office web applications. It brings menu, table, order, payment, staff, stock, and analytics workflows together with a Django backend.

## Features

- Customer-facing ordering and restaurant experience
- Back-office tools for menu, tables, staff, stock, and payments
- Analytics and role-based user workflows
- Real-time communication through Django Channels
- Background jobs with Celery and Redis
- MySQL persistence and Docker Compose development setup

## Architecture

- **Backend:** Django, Django REST Framework, Django Channels, Celery
- **Back office:** React, TypeScript, Vite
- **Customer app:** React, TypeScript, Vite
- **Data and jobs:** MySQL, Redis
- **Local orchestration:** Docker Compose

## Run locally with Docker

Requirements: Docker and Docker Compose.

1. Create a local environment file from the example:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Replace the placeholder secrets and review the development settings in `.env`.
3. Build and start the services:

   ```sh
   docker compose up --build
   ```

When the services are ready, the Compose configuration exposes the back office at [http://localhost:3000](http://localhost:3000), the customer app at [http://localhost:3003](http://localhost:3003), and the API at [http://localhost:8000](http://localhost:8000).

The default Compose stack enables development data seeding. Use the separate production or preview configuration only after reviewing its environment requirements; do not reuse example credentials in a public deployment.

## Run the project checks

The repository root provides scripts for its test suites, linting, type checking, and builds:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

The frontend applications live under `app/frontend/`; the Django project is under `app/backend/`. See `docs/` for user, testing, and demonstration material.
