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

### 4. Static Files (WhiteNoise)
- **Issue**: Django admin or media files return 404 in Docker because `DEBUG=False` or lack of a dedicated file server.
- **Fix**: Use `WhiteNoise` middleware and run `collectstatic --noinput` in the `entrypoint.sh`.

### 5. SQLite Locking (Concurrent Tests)
- **Issue**: Concurrent tests using SQLite occasionally hit "database is locked".
- **Fix**: Not applicable for MySQL, but if running local SQLite tests, ensure `ATOMIC_REQUESTS` is handled carefully or use a retry decorator.

## Infrastructure (Docker)

### 1. Container Boot Race Condition
- **Issue**: `backend` and `celery-worker` starting at the same time can cause migration conflicts (e.g., `Table 'django_migrations' already exists`).
- **Fix**: Implement a retry loop (e.g., 3 attempts, 3s delay) for `manage.py migrate` in the `entrypoint.sh`.
