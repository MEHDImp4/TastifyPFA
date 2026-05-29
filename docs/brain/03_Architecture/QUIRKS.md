# Project Quirks & Technical Gotchas

This document tracks non-obvious technical behaviors, edge cases, and "quirks" discovered during development to prevent regressions.

## Frontend (Vite / React)

### 1. react-router-dom Resolution Failure
- **Issue**: Vite sometimes fails to resolve `react-router-dom` during development or build, leading to "failed to resolve import" errors.
- **Quirk**: Vite's dependency optimizer needs an explicit nudge for certain v6+ versions.
- **Fix**: Add `react-router-dom` to `optimizeDeps.include` in `vite.config.ts`.
- **Status**: Active mandate for all new frontend services.

### 2. @shared Alias Resolution
- **Issue**: IDEs and Vitest often fail to resolve the `@shared` alias if not configured with absolute paths.
- **Fix**: Use `path.resolve(__dirname, '../_shared')` in `vite.config.ts` and ensure `fs.allow` includes the shared directory.

### 3. Native Select Background (Windows)
- **Issue**: Native browser `<select>` elements render with a white background in dark mode on some Windows environments, making them unreadable.
- **Fix**: Use the premium custom `Select` component (`components/ui/Select.tsx`) instead of native elements.

### 4. WebSocket URL Handling
- **Issue**: `location.hostname` excludes the port, which breaks WebSocket connections in Docker or custom port environments (e.g., dev on port 3000).
- **Fix**: Always use `location.host` in `staffSocket.ts` to include the port number.

### 5. Vite Proxy for WebSockets
- **Issue**: Standard proxying often fails for HMR or live sockets.
- **Fix**: Use `ws: true` and `changeOrigin: true` with an `http` target in the Vite proxy config.

### 6. Client Checkout Cart Hydrates Reliably Only Through SPA Navigation
- **Issue**: Seeding `tastify-client-cart` in localStorage and hard-loading `/checkout` can still render the empty-cart state even when the stored items are present.
- **Quirk**: The checkout page currently reflects cart contents reliably when items are added through the menu flow and the user reaches `/checkout` through the in-app link, not a cold route load.
- **Fix**: Keep E2E coverage deterministic by building cart state through `/menu` interactions and then navigating to `/checkout` with the existing SPA control.

### 7. Invalid Client Payment Tokens Collapse the Portal
- **Issue**: When `/api/paiements/session/resolve/:token` returns a failing response, `PaymentPortal` currently falls through to a blank body instead of rendering a recovery panel or toast.
- **Quirk**: The shipped UI has no stable invalid-link screen yet, so browser coverage must assert the current crash-like state rather than invent a fallback.
- **Fix**: Preserve this as an explicit test assertion until the product gets a dedicated error state, then update both the UI and the tests together.

## Backend (Django / Docker)

### 1. CRLF vs LF (entrypoint.sh)
- **Issue**: Windows (CRLF) line endings in `entrypoint.sh` cause `sh` to fail with "Illegal option -" or "not found" in Linux containers.
- **Fix**: Ensure all `.sh` files are saved with **LF** (Unix) line endings.

### 2. Transaction/Signal Race (Celery)
- **Issue**: `post_save` signals trigger Celery tasks that might run *before* the database transaction commits, causing the task to fail with `DoesNotExist`.
- **Fix**: Use `transaction.on_commit()` to enqueue Celery tasks or broadcast WebSocket events.

### 3. Docker Pytest Must Force Test Settings
- **Issue**: Running backend `pytest` inside the dev backend container without overriding settings can fall back to the live MySQL runtime configuration, which reintroduces legacy test-database privilege problems and makes local/CI behavior diverge.
- **Fix**: Always execute Dockerized backend `pytest` with `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test`, as wired in `scripts/testing/run-suite.mjs` and `.github/workflows/backoffice-ci.yml`.

### 4. Static Files (WhiteNoise)
- **Issue**: Django admin or media files return 404 in Docker because `DEBUG=False` or lack of a dedicated file server.
- **Fix**: Use `WhiteNoise` middleware and run `collectstatic --noinput` in the `entrypoint.sh`.

### 5. SQLite Locking (Concurrent Tests)
- **Issue**: Concurrent tests using SQLite occasionally hit "database is locked".
- **Fix**: Not applicable for MySQL, but if running local SQLite tests, ensure `ATOMIC_REQUESTS` is handled carefully or use a retry decorator.

### 6. Backend Route Hot Reload in Docker Dev
- **Issue**: The backend container previously started with Daphne directly, so new Django routes or view imports added after container startup could stay invisible until a manual backend restart. This surfaced as route-specific `404` responses even when the source file on disk already registered the endpoint.
- **Fix**: In Docker Compose development, run the backend through `python manage.py runserver 0.0.0.0:8000` so Django autoreload picks up route/module changes immediately while still serving the ASGI app via Channels.

### 7. Takeaway Orders Are Tableless
- **Issue**: Portail `CLIENT` takeaway orders intentionally persist with `Commande.table = None`, but legacy staff/table logic assumed every order belonged to a table. That caused crashes or invalid filtering when signals or scoped queries touched takeaway orders.
- **Fix**: Keep anonymous users out of checkout on the frontend, and make backend command serializers, query scopes, and table-sync signals explicitly tolerate `EMPORTER` orders without a table.

## Infrastructure (Docker)

### 1. Container Boot Race Condition
- **Issue**: `backend` and `celery-worker` starting at the same time can cause migration conflicts (e.g., `Table 'django_migrations' already exists`).
- **Fix**: Implement a retry loop (e.g., 3 attempts, 3s delay) for `manage.py migrate` in the `entrypoint.sh`.

### 2. Celery collectstatic startup trap
- **Issue**: Reusing the backend entrypoint for `celery-worker` and `celery-beat` can make both containers fail before boot if `collectstatic` touches bind-mounted Django admin assets.
- **Fix**: Gate `collectstatic` behind `COLLECTSTATIC_ON_STARTUP=1` and set that variable only on the web `backend` service.

### 3. Beat schedule registration on no-op migrate
- **Issue**: Relying only on a `post_migrate` hook to create `django-celery-beat` rows can miss the live database when `migrate` has nothing to apply.
- **Fix**: Seed required `PeriodicTask` rows with a dedicated data migration, then keep signal-based registration only as a secondary safety net.

### 4. Empty Docker DB Breaks Demo Auth
- **Issue**: A fresh MySQL volume can come up fully migrated but still contain zero `Utilisateur` rows, which makes every documented demo login return `401 Unauthorized` even when the frontend request is correct.
- **Fix**: In Docker development, enable `SEED_ON_STARTUP=1` on the `backend` service so `entrypoint.sh` runs `python manage.py seed_all` exactly when the user table is empty.

### 5. Shared Backend Image Prevents Celery Drift
- **Issue**: If `backend`, `celery-worker`, and `celery-beat` each keep separate Docker images, rebuilding only the web service can leave Celery containers on stale Python dependencies. The visible symptom is that worker/beat crash on startup with import errors like `ModuleNotFoundError: No module named 'drf_spectacular'` while the backend still works.
- **Fix**: Make all three services share the same named backend image in `docker-compose.yml` so one rebuild refreshes Daphne, Celery worker, and Celery beat together.

### 6. Playwright Can Reach `/login` Before Auth API Is Warm
- **Issue**: Right after `docker compose up -d --build backend backoffice-app`, the Vite front can already serve `/login` while the proxied backend auth endpoint is still warming up. Browser tests then fail with `ERREUR_SYSTEME` even though credentials and selectors are correct.
- **Fix**: Both Playwright `globalSetup` and the root runner `scripts/testing/run-suite.mjs` must poll `/login` and `/api/users/login/` before starting auth bootstrap or role-based browser projects. Waiting only on the HTML shell is not sufficient in Docker.

### 7. DRF Multipart Omits Boolean Defaults on Category/Plat Forms
- **Issue**: Category and plat creation forms submit `multipart/form-data`. If the frontend omits boolean flags like `est_active` or `est_disponible`, Django REST Framework persists them as `false`, so newly created records vanish immediately from UI lists filtered on active records.
- **Fix**: Explicitly append boolean fields into `FormData` during create/update flows, even when the UI does not expose a visible toggle.

### 8. Vite-in-Docker Can Miss Host File Changes on Windows
- **Issue**: The `backoffice-app` service runs `npm run dev` inside Docker with the project bind-mounted from Windows. In practice, Vite sometimes keeps serving a stale bundle even after local source edits land on disk, which makes Playwright exercise outdated DOM and accessibility attributes.
- **Fix**: When the rendered UI does not reflect recent frontend changes during Docker-based validation, restart the affected frontend container with `docker compose restart backoffice-app` before re-running Playwright.

### 9. Backend `pip-audit` Uses a Temporary Allowlist
- **Issue**: The backend Python dependency graph can still inherit upstream CVEs that are not immediately remediable without a larger dependency move.
- **Fix**: CI now runs `pip-audit` as a blocking gate through `scripts/testing/check-pip-audit.mjs`, but only findings listed in `scripts/testing/pip-audit-allowlist.json` are tolerated temporarily. Any new advisory outside that allowlist must fail the workflow.

### 10. KDS Browser Tests Must Avoid `networkidle`
- **Issue**: The staff KDS view keeps live websocket and poll-style activity going, so Playwright's `page.waitForLoadState('networkidle')` can hang even when the screen is already ready for assertions.
- **Fix**: Prefer semantic readiness checks on stable headings, controls, or data cards for KDS flows instead of `networkidle`.

### 11. Cross-App Realism Runs Outside the Default Client Suite
- **Issue**: The low-mock cross-app scenarios rely on both SPAs and the live backend being available together. If they run inside the default client Playwright suite, they either slow the main gate unnecessarily or fail when the backoffice stack is intentionally absent.
- **Fix**: Keep `client.cross-app.spec.ts` excluded from the default client Playwright config unless `PLAYWRIGHT_INCLUDE_CROSS_APP=true`, and run it through the dedicated `e2e:cross-app` root target instead.

### 13. Docker E2E Must Override Email Delivery for Transactional Flows
- **Issue**: Password-reset requests and transactional notifications now execute in browser and integration tests. Pointing those flows at a real SMTP backend during Docker validation causes avoidable 500s or outbound-network drift.
- **Fix**: The root QA runner injects a temporary Compose override that forces a local email backend (`console`/`locmem`) for E2E and integration contexts, so reset-password, reservation-confirmation, and payment-confirmation coverage stays deterministic without external mail infrastructure.

### 14. `node_modules` Volume Drift (Shared Persistence)
- **Issue**: Adding a new frontend dependency on the host (e.g., `npm install react-zoom-pan-pinch`) updates `package.json`, but the running Docker container often uses a persistent `node_modules` volume that remains stale. This leads to `[plugin:vite:import-analysis] Failed to resolve import` errors in the browser.
- **Fix**: Run `docker compose exec <service> npm install` immediately after adding a dependency on the host to synchronize the container's volume. Alternatively, rebuild the image without cache if the volume is managed at build-time.

## GitHub Actions CI Scope
- The supported backend CI gate now runs the full Dockerized repo `pytest` suite under `tastify_backend.settings.test`, alongside `manage.py check` and `makemigrations --check --dry-run`.
- If a future backend test starts failing only in CI, check first that the workflow command and local Docker command still both force the same Django test settings.

### 15. Relaxed Order Ownership for Staff (Collaborative Service)
- **Issue**: Previously, only the `serveur` assigned to a `Commande` (or a `GERANT`) could update its status or add items. This caused `403 Forbidden` errors when staff members helped each other or when a different server processed a payment.
- **Quirk**: In the "Tactical Command" architecture, operational fluidity takes precedence over strict individual ownership.
- **Fix**: The `CommandeViewSet` now allows any authenticated user with the `SERVEUR` or `GERANT` role to modify any active order. `CUISINIER` is restricted to only marking orders as `PRETE`. `CLIENT` remains restricted to their own orders only.
