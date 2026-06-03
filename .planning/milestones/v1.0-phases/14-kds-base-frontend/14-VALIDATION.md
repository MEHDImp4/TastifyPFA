# Phase 14 Validation: KDS Base Frontend

## 1. Automated Tests

### 1.1. Backend Permissions (Plan 01)
- [x] `backend/apps/commandes/tests/test_kds_permissions.py`
  - CUISINIER can fetch EN_CUISINE orders.
  - CUISINIER sees orders from other servers.
  - SERVEUR cannot see orders from other servers.
  - Anonymous/Client role blocked.

### 1.2. KDS Store (Plan 02)
- [x] `frontend/back-office/src/pages/Kds/store/useKdsStore.test.ts`
  - Initial fetch populates state.
  - `addOrUpdateOrder` handles new orders (LIFO).
  - `addOrUpdateOrder` handles updates to existing orders.
  - `removeOrder` handles deletions.
  - WebSocket event dispatcher correctly maps frames to store actions.

### 1.3. UI Smoke Tests (Plan 03)
- [x] `frontend/back-office/src/pages/Kds/KdsPage.test.tsx`
  - Page renders without crashing.
  - Horizontal scroll container exists.
  - Renders the correct number of `TicketCard` items from mock store.

## 2. Manual Verification (UAT)

### 2.1. Real-Time Integration (Staff Flow)
- [x] **H-14-01: Order Flow to KDS**
  1. Login as `CUISINIER` on port 3000.
  2. Navigate to `/kds`.
  3. Open a second window/device, login as `SERVEUR`.
  4. Place an order in a table.
  5. **Verify**: Order instantly appears on the KDS left-most position without reload.

### 2.2. Interactive UI (Kitchen Flow)
- [x] **H-14-02: KDS Visuals**
  1. Verify horizontal scroll works (Shift + Scroll or mouse drag/wheel).
  2. Verify Ticket Cards use ECO-FRESH colors.
  3. Wait 10 minutes and verify timer turns Orange.
  4. Wait 20 minutes and verify timer turns Red + Pulses.

## 3. Performance Check
- [x] Ticket list doesn't lag when scrolling with 20+ items.
- [x] Timer updates don't cause frame drops on low-end kitchen tablets.
