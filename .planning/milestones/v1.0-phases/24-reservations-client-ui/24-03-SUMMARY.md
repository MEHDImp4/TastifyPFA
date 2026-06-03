---
phase: 24-reservations-client-ui
plan: 03
status: completed
date: 2026-05-06
---

Completed the client reservation wizard in the portail app:
- Step 1 date/time form in [app/frontend/portail/src/pages/Reservations/StepDateTime.tsx](C:/Users/mehdi/Documents/GitHub/TastifyPFA/app/frontend/portail/src/pages/Reservations/StepDateTime.tsx)
- Step 2 availability map in [app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx](C:/Users/mehdi/Documents/GitHub/TastifyPFA/app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx)
- Step 3 confirmation flow in [app/frontend/portail/src/pages/Reservations/StepConfirm.tsx](C:/Users/mehdi/Documents/GitHub/TastifyPFA/app/frontend/portail/src/pages/Reservations/StepConfirm.tsx)
- Final route wiring in [app/frontend/portail/src/pages/Reservations/ReservationWizardShell.tsx](C:/Users/mehdi/Documents/GitHub/TastifyPFA/app/frontend/portail/src/pages/Reservations/ReservationWizardShell.tsx)

Delivered behavior:
- `/reservations/new` captures date, start/end time, and party size.
- Invalid ranges where end time is not after start time are blocked inline.
- `/reservations/table` fetches `available_tables` and renders selectable tables through the shared `TableMap`.
- Direct navigation without prior wizard state redirects back to the first step.
- `/reservations/confirm` submits the booking through `createReservation` without sending `statut`.

Verification:
- `npx vitest run src/pages/Reservations/ --reporter=verbose`
- `npx tsc -b`
- `npx vite build`
- Result: `4 test files passed`, `16 tests passed`, TypeScript build succeeded, production build succeeded

Notes:
- The broader backend reservations pytest run still reports one unrelated pre-existing SQLite locking failure in `TestConcurrentCreateConflict`.
