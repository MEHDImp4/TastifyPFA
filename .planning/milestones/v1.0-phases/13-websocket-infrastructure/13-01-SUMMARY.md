---
phase: 13-websocket-infrastructure
plan: 01
subsystem: realtime-backend
tags: [backend, channels, websocket, auth, tests]
key-files:
  created:
    - backend/core/middleware.py
    - backend/core/consumers.py
    - backend/core/routing.py
    - backend/core/realtime.py
    - backend/core/tests/test_websocket_auth.py
    - backend/core/tests/test_staff_consumer.py
  modified:
    - backend/tastify_backend/asgi.py
    - backend/tastify_backend/settings/test.py
metrics:
  tests_added: 8
  focused_backend_tests: passed
---

# Plan 13-01 Summary: Backend Channels Infrastructure

## Completed

- Extended the ASGI application to route WebSockets through `AllowedHostsOriginValidator`, `JWTAuthMiddleware`, and `URLRouter`.
- Added query-string JWT authentication for the staff socket handshake using Simple JWT access tokens and async-safe user lookup.
- Added `StaffConsumer` with role-gated staff access, `staff_group` membership, and JSON event framing.
- Added `broadcast_staff_event` as the reusable backend helper for later KDS and salle push phases.
- Added focused communicator tests covering missing token rejection, invalid token rejection, role-based access, route acceptance, and helper-driven staff broadcasts.

## Verification

| Check | Result |
| --- | --- |
| `docker compose exec backend pytest core/tests/test_websocket_auth.py core/tests/test_staff_consumer.py -q` | Passed |

## Deviations

- Test runtime uses `ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']` in `tastify_backend.settings.test` so the Channels origin validator can run inside communicator tests instead of being bypassed.

## Self-Check

PASSED. The backend now exposes the authenticated staff WebSocket surface required by Phase 13 and proves helper-to-socket delivery with focused tests.
