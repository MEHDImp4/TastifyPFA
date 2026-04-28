---
phase: 09-tables-map-frontend
plan: 02
subsystem: ui
tags: [react, vite, vitest, svg, salle, tables]
requires:
  - phase: 08-tables-model-api
    provides: Table API with `pos_x`, `pos_y`, `numero`, `capacite`, and `statut`
  - phase: 09-tables-map-frontend
    provides: Plan 01 SVG table map foundation
provides:
  - GERANT-only table map editor controls
  - SVG drag placement with 20px snapping and bounds clamping
  - Dynamic table geometry by capacity
  - Collision warning feedback
  - Batch PATCH persistence for dirty table positions
  - Salle Vitest component test harness
affects: [salle, tables, commandes-frontend, reservations-admin]
tech-stack:
  added: [vitest, jsdom, testing-library]
  patterns: [svg-coordinate-helpers, role-gated-editor-controls, dirty-state-batch-save]
key-files:
  created:
    - frontend/salle/vitest.config.ts
    - frontend/salle/src/test/setup.ts
    - frontend/salle/src/components/map/TableMap.test.tsx
    - frontend/salle/src/pages/Map/MapView.test.tsx
  modified:
    - frontend/salle/package.json
    - frontend/salle/package-lock.json
    - frontend/salle/vite.config.ts
    - frontend/salle/src/components/map/TableItem.tsx
    - frontend/salle/src/components/map/TableMap.tsx
    - frontend/salle/src/pages/Map/MapView.tsx
key-decisions:
  - "Pointer-driven SVG drag math is handled in TableMap so table geometry remains deterministic and testable."
  - "Collision feedback is advisory: overlapping tables glow red but saving is allowed."
  - "Salle Vite resolves shared code from ../_shared and dedupes React/Zustand to avoid duplicate React hook failures."
patterns-established:
  - "Export pure SVG geometry helpers from map components and cover them with component tests."
  - "Pause polling during local edit mode to protect unsaved layout changes."
requirements-completed: [D-09-01, D-09-02, D-09-03, D-09-04]
duration: 22 min
completed: 2026-04-28
---

# Phase 9 Plan 02: Map Editor Summary

**GERANT-only Salle map editor with SVG drag placement, 20px grid snapping, collision warnings, and tested batch position persistence**

## Performance

- **Duration:** 22 min
- **Started:** 2026-04-28T23:43:41Z
- **Completed:** 2026-04-28T23:58:00Z
- **Tasks:** 6
- **Files modified:** 10

## Accomplishments
- Added Salle Vitest/jsdom test coverage for map geometry, RBAC editor visibility, polling behavior, dirty save, cancel, and save failure handling.
- Implemented capacity-based table shapes, status colors, collision warning strokes/glow, and 20px snapped SVG placement.
- Added GERANT-only edit controls with locked/unlocked affordance, dirty state tracking, batch PATCH persistence, and refresh-after-save.
- Fixed Salle Vite shared alias and dependency dedupe so shared auth uses the Salle React instance.

## Task Commits

1. **Map editor implementation and tests** - `27352be` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `frontend/salle/vitest.config.ts` - Salle-specific Vitest configuration.
- `frontend/salle/src/test/setup.ts` - Jest DOM setup for component assertions.
- `frontend/salle/src/components/map/TableMap.test.tsx` - Geometry, snapping, color, fallback grid, and collision tests.
- `frontend/salle/src/pages/Map/MapView.test.tsx` - Editor RBAC, polling, save, cancel, and failure tests.
- `frontend/salle/src/components/map/TableItem.tsx` - Dynamic SVG table shapes and edit/overlap rendering.
- `frontend/salle/src/components/map/TableMap.tsx` - SVG coordinate helpers, drag handling, snap/clamp logic, and collision detection.
- `frontend/salle/src/pages/Map/MapView.tsx` - GERANT editor state, dirty tracking, save/cancel workflow, and polling guard.
- `frontend/salle/vite.config.ts` - Shared alias correction and React/Zustand dedupe.
- `frontend/salle/package.json` - Test script and test dependencies.
- `frontend/salle/package-lock.json` - Locked test dependencies.

## Decisions Made
- Used pointer events over Framer Motion drag constraints for reliable SVG coordinate conversion and deterministic tests.
- Stored unsaved positions locally and paused polling during edit mode so live status polling cannot overwrite layout work.
- Kept overlap warnings non-blocking because the context explicitly called for visual feedback without hard blocking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected Salle shared alias and dependency dedupe**
- **Found during:** Final verification
- **Issue:** Vitest could not resolve shared auth after using the correct shared source path, and then hit duplicate React instances through the shared `node_modules` junction.
- **Fix:** Updated `frontend/salle/vite.config.ts` to resolve `@shared` to `../_shared` and dedupe `react`, `react-dom`, and `zustand`.
- **Files modified:** `frontend/salle/vite.config.ts`
- **Verification:** `npm run test -- --run` and `npm run build`
- **Committed in:** `27352be`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for test/build correctness and consistent runtime module resolution. No scope expansion.

## Issues Encountered
- Sandboxed test/build runs failed with native Vite/Tailwind/esbuild `spawn EPERM`; both passed when rerun with approved escalation.
- Vitest emitted non-blocking Vite warnings about deprecated esbuild options from the React plugin.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 9 now provides an editable Salle table layout that Phase 12 order taking can build on.
- Table positions persist through the existing Phase 8 table API.
- No known blockers for Phase 10.

## Self-Check: PASSED

---
*Phase: 09-tables-map-frontend*
*Completed: 2026-04-28*
