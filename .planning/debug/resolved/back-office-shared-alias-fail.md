---
status: resolved
trigger: "[plugin:vite:import-analysis] Failed to resolve import \"@shared/auth/useAuthStore\" from \"src/App.tsx\""
created: 2026-04-28
updated: 2026-04-28
symptoms:
  expected: Imports using the @shared alias should resolve correctly to the /_shared directory.
  actual: Vite fails to resolve any @shared imports.
  error: "[plugin:vite:import-analysis] Failed to resolve import \"@shared/auth/useAuthStore\" from \"src/App.tsx\". Does the file exist?"
  timeline: After updating docker-compose.yml to mount /_shared.
  reproduction: Running the app via Docker.
---

# Current Focus
- **hypothesis**: Vite's dev server restricts access to files outside the project root (`/app`). Since `@shared` points to `/_shared` (which is outside `/app`), Vite refuses to serve or analyze those files unless they are explicitly allowed in `server.fs.allow`.
- **test**: Check Vite's default file system restriction behavior and verify if `/_shared` is within the allowed paths.
- **expecting**: Confirmation that adding `server.fs.allow` to `vite.config.ts` fixes the resolution.
- **next_action**: Plan the fix via /gsd-plan-phase.

# Evidence
- Error message clearly states failure to resolve import from `/app/src/App.tsx`.
- Previous fix mounted `./frontend/_shared` to `/_shared` (container), which is sibling to `/app` (container root).
- `vite.config.ts` in `back-office` and `salle` do not have `server.fs.allow` configured.

# Eliminated Hypotheses
(None yet)

# Resolution
- **root_cause**: Vite dev server's security feature restricts file system access to the project root (`/app`) by default. The `@shared` alias points to `/_shared`, which is outside this root, causing the import to fail.
- **fix**: Update `vite.config.ts` for all affected services (back-office, salle, kds, portail) to include `server.fs.allow: ['..', '/_shared']` in the `server` block.
- **verification**: Not applied (user opted to plan the fix).
- **files_changed**: []
