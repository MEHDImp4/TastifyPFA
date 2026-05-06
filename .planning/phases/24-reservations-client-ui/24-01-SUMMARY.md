---
phase: 24-reservations-client-ui
plan: 01
status: completed
date: 2026-05-06
---

Implemented `available_tables` on `ReservationViewSet` in [app/backend/apps/reservations/views.py](C:/Users/mehdi/Documents/GitHub/TastifyPFA/app/backend/apps/reservations/views.py) and added targeted coverage in [app/backend/apps/reservations/tests/test_available_tables.py](C:/Users/mehdi/Documents/GitHub/TastifyPFA/app/backend/apps/reservations/tests/test_available_tables.py).

Delivered behavior:
- Authenticated clients can call `GET /api/reservations/available_tables/`.
- Missing or malformed date/time params return `400`.
- Capacity filtering excludes undersized tables.
- Active conflicting reservations exclude occupied tables.
- Anonymous requests return `401`.

Verification:
- `python -m pytest apps/reservations/tests/test_available_tables.py -q`
- Result: `4 passed`

Notes:
- `python manage.py test apps.reservations.tests.test_available_tables -v2` did not discover this pytest-style module in this environment.
- Broader reservations pytest run still shows one pre-existing SQLite concurrency failure in `TestConcurrentCreateConflict`; this is unrelated to the new `available_tables` action.
