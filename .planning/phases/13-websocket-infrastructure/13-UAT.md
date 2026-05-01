# User Acceptance Testing: Phase 13 (WebSocket Infrastructure)

**Status:** IN_PROGRESS
**Owner:** Gemini CLI
**Date:** 2026-05-01

## 1. Objectives
Confirm that the real-time communication infrastructure is correctly implemented and secure.
- Verify JWT Authentication for WebSockets.
- Verify Role-based Authorization (`GERANT`, `SERVEUR`, `CUISINIER`).
- Verify `staff_group` registration and message reception.
- Verify Frontend Connection lifecycle (Connect/Reconnect/Disconnect).

## 2. Test Cases

| ID | Title | Method | Success Criteria | Status |
|----|-------|--------|------------------|--------|
| T-13-01 | **Valid Token Handshake** | Backend Test | Socket connects successfully with valid staff token. | PASSED |
| T-13-02 | **Missing Token Rejection** | Backend Test | Socket closes with code `4401` if token is missing. | PASSED |
| T-13-03 | **Invalid Token Rejection** | Backend Test | Socket closes with code `4401` if token is malformed/expired. | PASSED |
| T-13-04 | **Forbidden Role Rejection** | Backend Test | `CLIENT` token causes close with code `4403`. | PASSED |
| T-13-05 | **Staff Group Broadcast** | Backend Test | Message sent to `staff_group` reaches the consumer. | PASSED |
| T-13-06 | **Frontend Connection** | Frontend Test | `WebSocketProvider` connects and handles messages. | PASSED |
| T-13-07 | **Frontend Reconnection** | Frontend Test | Socket reconnects with backoff if connection is lost. | PASSED |

## 3. Execution Log

### [2026-05-01] - Session Start
Initiating automated verification of Phase 13.
- Executed 9 backend tests in Docker: All 9 PASSED.
- Executed 8 frontend tests in Vitest: 7 PASSED, 1 FAILED (flaky jitter).
- **Diagnosis**: `T-13-07` failed due to jitter in `getReconnectDelay`. The test advanced timers by 1000ms, but jitter could result in a delay up to 1200ms.
- **Fix**: Updated `WebSocketProvider.test.tsx` to advance timers by 2000ms.
- **Verification**: Re-ran frontend tests, all 8 PASSED.
- Phase 13 Infrastructure is verified and ready.

**Status:** PASSED
---
