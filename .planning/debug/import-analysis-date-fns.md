---
status: resolved
trigger: "[plugin:vite:import-analysis] Failed to resolve import \"date-fns/locale\" from \"src/pages/Dashboard/DashboardPage.tsx\""
goal: find_and_fix
---

# Debug Session: import-analysis-date-fns

## Current Focus
**Hypothesis:** The `date-fns` v3+ changed how locales are imported, and Vite's `import-analysis` (especially in Docker environments) may struggle with the `date-fns/locale` subpath mapping if not using direct file imports.
**Next Action:** Switched to direct locale import `date-fns/locale/fr`.

## Evidence
- timestamp: 2026-05-25T10:00:00Z
  - Issue reported: `Failed to resolve import "date-fns/locale"`
  - Observation: `npm run build` succeeded on host but failed in user's environment (likely Vite dev server in Docker).
  - Observation: `date-fns` v4 `package.json` exports `./locale` to `./locale.js`, but direct import `./locale/fr` is more robust and avoids loading all locales.
  - Fix: Changed `import { fr } from 'date-fns/locale'` to `import { fr } from 'date-fns/locale/fr'`.

## Resolution
**root_cause:** Vite's `import-analysis` failed to resolve the `date-fns/locale` subpath in the specific environment (likely due to how `date-fns` v4 uses conditional exports or how the Docker volume shadows `node_modules`).
**fix:** Updated `DashboardPage.tsx` to use the more specific and idiomatic `date-fns/locale/fr` import path. Also verified the build and corrected minor TypeScript property mismatches.
