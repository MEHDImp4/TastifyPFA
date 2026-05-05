---
phase: 18-ingredients-stock-model
plan: "18-03"
subsystem: backend/stock
tags: [django, signals, websocket, testing, pytest, unittest.mock]

requires:
  - phase: 18-01
    provides: "Ingredient model, signals.py, apps.py with ready() hook"

provides:
  - "7 pytest tests for low-stock threshold-crossing signal behavior"
  - "Verified: broadcast fires on first threshold cross, not on subsequent saves when already low"
  - "Verified: new ingredient created below threshold triggers alert"
  - "Verified: payload shape — ingredient_id, nom, stock_actuel, seuil_alerte, unite_mesure"

affects:
  - "18-04 (stock API phase may extend signals or test coverage)"

tech-stack:
  added: []
  patterns:
    - "Patch core.realtime.broadcast_staff_event (not apps.stock.signals.*) because handler uses lazy import"
    - "pre_save caches _old_stock on instance; post_save reads it to determine crossing direction"

key-files:
  created:
    - "app/backend/apps/stock/tests/test_signals.py"
  modified: []

key-decisions:
  - "Mock path is core.realtime.broadcast_staff_event — lazy import in handler means the signal module has no top-level reference to patch"
  - "signals.py and apps.py were pre-built in plan 18-01 as Rule 2 deviation — Task 1 verified in place, no re-implementation needed"

patterns-established:
  - "Lazy import pattern for broadcast_staff_event in signal handlers requires patching at source module (core.realtime), not at import site"

requirements-completed: ["REQ-04"]

duration: 25min
completed: 2026-05-05
---

# Phase 18 Plan 03: Stock Signals Tests Summary

**7 pytest tests verifying low-stock WebSocket alert fires only on threshold-crossing transition, using `unittest.mock.patch` on `core.realtime.broadcast_staff_event`.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-05T04:02:00Z
- **Completed:** 2026-05-05T04:27:00Z
- **Tasks:** 2 (Task 1 pre-existing from 18-01 deviation, Task 2 completed)
- **Files modified:** 1 created

## Accomplishments

- Created `test_signals.py` with 7 tests covering all threshold-crossing scenarios
- Identified and fixed mock path: lazy import requires patching `core.realtime.broadcast_staff_event`
- All 7 tests pass: `7 passed in 1.91s`
- `manage.py check` passes: 0 issues (system check clean)

## Task Commits

1. **Task 1: Real-Time Alerts via Signals** — Pre-built in plan 18-01 (Rule 2 deviation). Verified `manage.py check` passes. No new commit needed.
2. **Task 2: Tests for Signals** — `e0f7442` (feat(18-03): add signal tests for low-stock threshold-crossing alerts)

## Files Created/Modified

- `app/backend/apps/stock/tests/test_signals.py` — 7 signal tests: threshold-crossing (fire once), spam prevention (already low → silent), create-below-threshold (fire), create-above-threshold (silent), exact-at-threshold (fire), rising-above-threshold (silent), payload shape verification

## Deviations from Plan

### Pre-existing work from 18-01

**[Rule 2 — Missing Critical Functionality — carried forward from 18-01]**
- **Found during:** Plan initialization
- **Issue:** `signals.py` and `apps.py` with `ready()` hook were built during plan 18-01 as a deviation. They were already committed and merged into the worktree.
- **Fix:** Task 1 verification confirmed `manage.py check` passes with 0 errors. No re-implementation required.
- **Files:** `app/backend/apps/stock/signals.py`, `app/backend/apps/stock/apps.py`

### Auto-fixed: Wrong mock path (Rule 1 — Bug)

- **Found during:** Task 2 first test run
- **Issue:** Initial `BROADCAST_PATH = 'apps.stock.signals.broadcast_staff_event'` failed with `AttributeError` because the signal handler imports `broadcast_staff_event` lazily inside the function body, so the module has no top-level attribute by that name.
- **Fix:** Changed to `BROADCAST_PATH = 'core.realtime.broadcast_staff_event'` — patch at the source module where the function is defined.
- **Files modified:** `app/backend/apps/stock/tests/test_signals.py`

## Known Stubs

None — signal implementation is fully wired. Tests mock the WebSocket layer only.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check

- [x] `app/backend/apps/stock/tests/test_signals.py` — FOUND
- [x] `app/backend/apps/stock/signals.py` — FOUND (pre-existing from 18-01)
- [x] `app/backend/apps/stock/apps.py` — FOUND (pre-existing from 18-01, ready() imports signals)
- [x] commit e0f7442 — FOUND (feat(18-03): add signal tests)
- [x] `manage.py check` — 0 issues
- [x] pytest `test_signals.py` — 7 passed

## Self-Check: PASSED
