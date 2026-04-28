---
status: complete
trigger: "[plugin:@tailwindcss/vite:generate:serve] Can't resolve '../../_shared/theme.css' in '/app/src'"
created: 2026-04-28
updated: 2026-04-28
symptoms:
  expected: theme.css should load correctly in the back-office SPA within Docker.
  actual: Build fails with resolution error for ../../_shared/theme.css.
  error: "[plugin:@tailwindcss/vite:generate:serve] Can't resolve '../../_shared/theme.css' in '/app/src'"
  timeline: Started after the last change (likely the implementation of Phase 05).
  reproduction: Occurs when running via Docker.
---

# Current Focus
- **hypothesis**: The relative path `../../_shared/theme.css` in `frontend/back-office/src/index.css` is incorrect when running inside the Docker container because it resolves to `/_shared/theme.css` but the volume is mapped to `/app/shared`.
- **test**: Verify volume mappings in `docker-compose.yml`.
- **expecting**: Mismatched paths or directory names.
- **next_action**: (Fixed)

# Evidence
- `docker-compose.yml` showed `backoffice` service mapping `./frontend/_shared:/app/shared`.
- `frontend/back-office/src/index.css` uses `@import "../../_shared/theme.css";`.
- Inside container, `/app/src/index.css`'s `../../_shared` resolves to `/_shared`.
- Discrepancy found: directory name (`_shared` vs `shared`) and location (`/` vs `/app`).

# Eliminated Hypotheses
- (None)

# Resolution
- **root_cause**: The Docker volume mapping for the shared CSS directory (`/app/shared`) did not match the relative path used in the source code (`../../_shared`), which resolves to `/_shared` inside the container where the app root is `/app`.
- **fix**: Updated `docker-compose.yml` to mount `./frontend/_shared` at `/_shared` for all frontend services, ensuring consistency with the relative paths in the source code.
- **verification**: The relative path `../../_shared/theme.css` from `/app/src/index.css` now correctly resolves to `/_shared/theme.css` inside the container.
- **files_changed**: ["docker-compose.yml"]
