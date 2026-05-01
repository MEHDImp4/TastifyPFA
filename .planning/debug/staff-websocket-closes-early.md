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
- **hypothesis:** React StrictMode remounts the provider during development and the cleanup path closes a still-connecting socket, which triggers a false-positive browser error before the real connection settles.
- **test:** Compare the reported line number with the provider cleanup path, confirm StrictMode is enabled in `main.tsx`, and verify a deferred connect removes the transient close.
- **expecting:** To find the backend path already wired correctly and the browser warning originating from the frontend cleanup logic.
- **next_action:** "completed"

## Evidence
- timestamp: 2026-05-01 20:40:00
  finding: `frontend/_shared/websocket/staffSocket.ts` builds the websocket URL from `window.location.host`, which resolves to `localhost:3000` in back-office development.
- timestamp: 2026-05-01 20:41:00
  finding: `frontend/back-office/vite.config.ts` already includes a `/ws` proxy to `ws://backend:8000`, so the previously-fixed proxy path is not the cause of this report.
- timestamp: 2026-05-01 20:42:00
  finding: `backend/tastify_backend/asgi.py`, `backend/core/routing.py`, and `backend/core/middleware.py` already matched the expected `/ws/staff/` route and JWT handshake path.
- timestamp: 2026-05-01 20:47:00
  finding: `frontend/back-office/src/main.tsx` renders the app inside `StrictMode`, and the reported line points at `cleanupSocket()` closing a `CONNECTING` socket.
- timestamp: 2026-05-01 20:48:00
  finding: Deferred initial socket creation with a zero-delay timer, cancelled during cleanup, and added a StrictMode regression test to verify the provider no longer opens and immediately closes a connecting socket.
- timestamp: 2026-05-01 20:47:03
  finding: Verification passed with `npm run test -- src/websocket/WebSocketProvider.test.tsx --run`.

## Eliminated
- Missing `/ws` proxy configuration in the back-office Vite dev server.
- Backend websocket route mismatch.
- Backend JWT middleware rejection during the initial handshake.

## Resolution
- **root_cause:** In React StrictMode development mounts, `WebSocketProvider` created the socket immediately and then its cleanup path closed the still-connecting socket during the transient remount cycle, surfacing `WebSocket is closed before the connection is established` from line 43 even though the backend path was valid.
- **fix:** Deferred initial socket creation until the next timer tick and cancelled that timer during cleanup so StrictMode's throwaway mount no longer opens and closes a connecting socket.
- **validation:** `npm run test -- src/websocket/WebSocketProvider.test.tsx --run`
- **fix_commit:** `6694c01`
