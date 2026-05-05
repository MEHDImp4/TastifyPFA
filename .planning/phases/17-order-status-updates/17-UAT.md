---
status: complete
phase: 17-order-status-updates
source: [17-01-PLAN.md, 17-CONTEXT.md, 17-VALIDATION.md]
started: 2026-05-05T12:00:00Z
updated: 2026-05-05T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CUISINIER Can Mark a Line as Prêt
expected: In the KDS view, logged in as CUISINIER, click the "Prêt" button on an individual dish line in an active ticket. The button/label changes to show "Prêt" (green indicator). The PATCH request to /api/commandelignes/{id}/ returns 200 and the line statut becomes PRET.
result: pass

### 2. Terminer le Ticket Marks Entire Order as PRETE
expected: In the KDS, click "Terminer le Ticket" on an active order. The button changes to "Ticket Prêt" and becomes disabled. The order's statut becomes PRETE on the backend.
result: pass

### 3. Salle Receives Real-Time Status Update via WebSocket
expected: While the Salle (OrderingPage or TableMap) is open in another browser tab, mark a line as Prêt in the KDS. The Salle UI updates without a page refresh — showing a visual cue (blue pulse or status badge) on the affected order within ~1 second.
result: pass

### 4. Audio Notification Plays in Salle When Order Becomes PRETE
expected: When "Terminer le Ticket" is clicked in KDS, the Salle UI plays an audio notification (kitchen bell / ding sound) to alert the serving staff that the order is ready for pickup.
result: issue
reported: "no audio"
severity: major

### 5. Table Map Reflects Order Status Change Instantly
expected: With the Table Map open in Salle, complete an order in KDS ("Terminer le Ticket"). The table's visual state on the map updates in real-time (e.g., colour or badge changes to reflect PRETE status) without a page refresh.
result: pass

### 6. Non-CUISINIER Cannot Mark Line as Prêt via API
expected: Send PATCH /api/commandelignes/{id}/ with statut=PRET using a SERVEUR token (not CUISINIER/GERANT). Response is 403 Forbidden. The line status does not change.
result: pass

## Summary

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Salle UI plays an audio notification when an order becomes PRETE"
  status: fixed
  reason: "User reported: no audio"
  severity: major
  test: 4
  root_cause: "order-ready.mp3 missing from public/sounds/ — StaffNotificationManager loads this file for PRETE events, Audio.play() fails silently"
  artifacts:
    - path: "app/frontend/backoffice/src/components/layout/../../../shared/websocket/StaffNotificationManager.tsx"
      issue: "readyAudioRef loaded from /sounds/order-ready.mp3 which did not exist"
  missing:
    - "app/frontend/backoffice/public/sounds/order-ready.mp3"
  fix: "Copied kitchen-bell.mp3 as order-ready.mp3 in public/sounds/"
