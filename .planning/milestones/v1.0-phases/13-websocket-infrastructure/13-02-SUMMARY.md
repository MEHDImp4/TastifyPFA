---
phase: 13-websocket-infrastructure
plan: 02
subsystem: realtime-frontend
tags: [frontend, websocket, zustand, tests]
key-files:
  created:
    - frontend/_shared/websocket/staffSocket.ts
    - frontend/_shared/websocket/useStaffSocketStore.ts
    - frontend/_shared/websocket/WebSocketProvider.tsx
    - frontend/back-office/src/websocket/WebSocketProvider.test.tsx
  modified:
    - frontend/back-office/src/App.tsx
metrics:
  tests_added: 8
  build: passed
---

# Plan 13-02 Summary: Staff WebSocket Provider

## Completed

- Added shared websocket utilities for URL construction, message parsing, and capped reconnect delay calculation.
- Added a shared Zustand websocket store to hold connection status and the last parsed staff event.
- Added `WebSocketProvider` to manage one authenticated staff socket for the staff SPA lifecycle.
- Wired the provider into the back-office app shell so authenticated staff routes share one connection.
- Added focused Vitest coverage for URL generation, message parsing, reconnect timing, session-scoped connection creation, event dispatch into Zustand, and reconnect cancellation after auth clear.

## Verification

| Check | Result |
| --- | --- |
| `npm run test -- src/websocket/WebSocketProvider.test.tsx --run` | Passed |
| `npm run build` | Passed |

## Deviations

- The provider prevents reconnect after auth clear by checking the latest auth store state inside the reconnect timer callback; this closes a real race between socket close and logout.

## Self-Check

PASSED. The staff frontend now owns a single session-wide websocket connection and dispatches socket events into shared Zustand state without leaking Phase 14-17 domain logic into Phase 13.
