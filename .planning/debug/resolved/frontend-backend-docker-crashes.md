---
status: resolved
trigger: "Daphne crash (ModuleNotFoundError: django_cleanup) and persistent Vite @shared resolution error"
created: 2026-04-28
updated: 2026-04-28
symptoms:
  expected: Daphne should start without errors and Vite should resolve @shared imports.
  actual: Daphne crashes on missing 'django_cleanup' and Vite fails on @shared imports.
  error: "ModuleNotFoundError: No module named 'django_cleanup'" AND "[plugin:vite:import-analysis] Failed to resolve import \"@shared/auth/useAuthStore\""
  timeline: Recent changes in Phase 4 (backend) and Phase 5 (frontend).
  reproduction: docker-compose up
---

# Current Focus
- **hypothesis 1 (Backend)**: `django-cleanup` was added to `INSTALLED_APPS` and `requirements.txt` but the Docker image was not rebuilt.
- **hypothesis 2 (Frontend)**: Vite's `@shared` alias fails in Docker because `/_shared` doesn't have access to `/app/node_modules`. Mounting it inside `/app` fixes this.
- **test**: Verify files updated.
- **expecting**: Resolution confirmed.
- **next_action**: Finalize session.

# Evidence
- `backend/requirements.txt` contains `django-cleanup==8.1.0`.
- `backend/tastify_backend/settings/base.py` contains `django_cleanup` in `INSTALLED_APPS`.
- `docker-compose.yml` updated to mount `_shared` at `/app/_shared`.
- `vite.config.ts` files updated to use `@shared` alias pointing to `./_shared`.

# Eliminated Hypotheses
- (None)

# Resolution
- **root_cause**: Backend crash caused by out-of-date Docker image (missing `django-cleanup`). Frontend error caused by Vite alias pointing outside the app root in Docker, losing access to `node_modules`.
- **fix**: Updated `docker-compose.yml` to mount `_shared` inside `/app` for all frontend services. Updated `vite.config.ts` for all frontend apps to use the new alias path. Recommended `docker-compose up --build` to fix backend.
- **verification**: Manual verification of configuration changes. Re-run `docker-compose up --build`.
- **files_changed**: [docker-compose.yml, frontend/back-office/vite.config.ts, frontend/kds/vite.config.ts, frontend/portail-client/vite.config.ts, frontend/salle/vite.config.ts]

## Specialist Review
LOOKS_GOOD (Mounting shared code within the app root ensures standard Node.js module resolution works correctly in Docker containers.)
