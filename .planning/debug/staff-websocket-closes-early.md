---
status: completed
trigger: "WebSocketProvider.tsx:43 WebSocket connection to 'ws://localhost:3000/ws/staff/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc3NjY0MzMxLCJpYXQiOjE3Nzc2NjI1MjMsImp0aSI6ImI4OTZmYWQxMGNlMTQ2NTI4YmMwM2M5YzQxMmRmOGQ4IiwidXNlcl9pZCI6MSwidXNlcm5hbWUiOiJnZXJhbnRfdGVzdCIsInJvbGUiOiJHRVJBTlQifQ.FdQs7TPT9yCs5wZrxfaTav4e-JAA_HjibB8kZmrXcEo' failed: WebSocket is closed before the connection is established."
created: 2026-05-01
updated: 2026-05-01
---

# Debug Session: staff-websocket-closes-early

## Symptoms
- **Expected:** The staff WebSocket connection should establish successfully from the frontend and stay open for realtime updates.
- **Actual:** The browser logs `WebSocketProvider.tsx:43` and closes the socket before the connection is established.
- **Error Messages:** `WebSocket connection to 'ws://localhost:3000/ws/staff/?token=…' failed: WebSocket is closed before the connection is established.`
- **Timeline:** Reported on 2026-05-01. Previous working state is unknown.
- **Reproduction:** Open the frontend against `localhost:3000`, authenticate as staff, and let `WebSocketProvider.tsx` attempt to connect to `/ws/staff/`.

## Current Focus
- **hypothesis:** The Vite dev server is not proxying `/ws/`, so the browser opens `ws://localhost:3000/ws/staff/` against the frontend dev server instead of the Django ASGI backend.
- **test:** Compare the runtime websocket URL, Vite proxy config, and backend websocket routing/auth handling.
- **expecting:** To find the handshake failing before backend auth or consumer code executes.
- **next_action:** "completed"

## Evidence
- timestamp: 2026-05-01 20:40:00
  finding: `frontend/_shared/websocket/staffSocket.ts` builds the websocket URL from `window.location.host`, which resolves to `localhost:3000` in back-office development.
- timestamp: 2026-05-01 20:41:00
  finding: `frontend/back-office/vite.config.ts` proxied `/api` and `/media` but had no `/ws` proxy entry, so websocket upgrades never reached `backend:8000`.
- timestamp: 2026-05-01 20:42:00
  finding: `backend/tastify_backend/asgi.py`, `backend/core/routing.py`, and `backend/core/middleware.py` already matched the expected `/ws/staff/` route and JWT handshake path.
- timestamp: 2026-05-01 20:44:20
  finding: Added a `/ws` Vite proxy targeting `ws://backend:8000` with `ws: true`, plus a regression test covering the config entry.
- timestamp: 2026-05-01 20:44:20
  finding: Verification passed with `npm run test -- src/viteConfig.test.ts --run` and `npm run test -- src/websocket/WebSocketProvider.test.tsx --run`.

## Eliminated
- Backend websocket route mismatch.
- Backend JWT middleware rejection during the initial handshake.

## Resolution
- **root_cause:** The back-office dev server did not proxy `/ws`, so the frontend attempted the staff websocket handshake against `localhost:3000` instead of the Django ASGI backend.
- **fix:** Added a Vite `/ws` proxy to `ws://backend:8000` with websocket upgrades enabled and added a regression test for that proxy entry.
- **validation:** `npm run test -- src/viteConfig.test.ts --run`; `npm run test -- src/websocket/WebSocketProvider.test.tsx --run`
- **fix_commit:** `0327c1a`
