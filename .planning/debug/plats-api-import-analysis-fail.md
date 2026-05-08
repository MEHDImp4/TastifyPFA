---
status: diagnosed
trigger: "Investigate UAT gap. Truth: Navigate to the Menu page. See a list of available dishes (Plats). Actual: User reported: [plugin:vite:import-analysis] Failed to resolve import '../../../shared/auth/axiosInstance' from 'src/api/menu.ts'. Does the file exist?"
created: 2024-05-24T00:00:00Z
updated: 2024-05-24T00:00:00Z
---

## Current Focus
diagnosed

hypothesis: The relative import fails in docker because the folder structure differs from local.
test: Checked docker-compose.yml volume mounts and vite.config.ts.
expecting: shared is mounted at /app/shared while portail is at /app.
next_action: Return diagnosis to caller.

## Symptoms
expected: Navigate to the Menu page. See a list of available dishes (Plats).
actual: User reported: [plugin:vite:import-analysis] Failed to resolve import '../../../shared/auth/axiosInstance' from 'src/api/menu.ts'. Does the file exist?
errors: [plugin:vite:import-analysis] Failed to resolve import '../../../shared/auth/axiosInstance' from 'src/api/menu.ts'. Does the file exist?
reproduction: Navigate to the Menu page
started: unknown

## Eliminated

## Evidence
- timestamp: 2024-05-24T00:00:00Z
  checked: app/frontend/portail/src/api/menu.ts
  found: Uses hardcoded relative import `import axiosInstance from '../../../shared/auth/axiosInstance';`
  implication: Will resolve differently depending on root path structure.
- timestamp: 2024-05-24T00:00:00Z
  checked: docker-compose.yml
  found: `portail` is mounted to `/app`, `shared` is mounted to `/app/shared`.
  implication: The sibling relationship `../../../` breaks inside the Docker container.
- timestamp: 2024-05-24T00:00:00Z
  checked: app/frontend/portail/vite.config.ts
  found: Has `@shared` alias to specifically handle this environment path discrepancy.
  implication: The alias should be used instead of relative paths.

## Resolution
root_cause: Hardcoded relative import path breaks in Docker environment due to different volume mount points.
fix: 
verification: 
files_changed: []
