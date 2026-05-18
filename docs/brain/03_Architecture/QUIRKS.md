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

## Backend (Django / Docker)

### 1. CRLF vs LF (entrypoint.sh)
- **Issue**: Windows (CRLF) line endings in `entrypoint.sh` cause `sh` to fail with "Illegal option -" or "not found" in Linux containers.
- **Fix**: Ensure all `.sh` files are saved with **LF** (Unix) line endings.

### 2. Transaction/Signal Race (Celery)
- **Issue**: `post_save` signals trigger Celery tasks that might run *before* the database transaction commits, causing the task to fail with `DoesNotExist`.
- **Fix**: Use `transaction.on_commit()` to enqueue Celery tasks or broadcast WebSocket events.

### 3. Pytest Database Creation (1044)
- **Issue**: Pytest fails to create `test_tastify` database due to `Access denied for user 'tastify'@'%'`.
- **Fix**: Run `GRANT ALL PRIVILEGES ON test_% TO 'tastify'@'%';` on the MySQL instance.
- **Workaround**: Until the container grant is corrected, Docker validation can be run with `MYSQL_USER=root` and `MYSQL_PASSWORD=$MYSQL_ROOT_PASSWORD` injected into the one-off `manage.py test` command.

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
- **Fix**: In Playwright `globalSetup`, poll both `/login` and `/api/users/login/` before starting auth bootstrap or role-based browser projects.

### 7. DRF Multipart Omits Boolean Defaults on Category/Plat Forms
- **Issue**: Category and plat creation forms submit `multipart/form-data`. If the frontend omits boolean flags like `est_active` or `est_disponible`, Django REST Framework persists them as `false`, so newly created records vanish immediately from UI lists filtered on active records.
- **Fix**: Explicitly append boolean fields into `FormData` during create/update flows, even when the UI does not expose a visible toggle.
