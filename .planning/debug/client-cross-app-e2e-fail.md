---
status: investigating
trigger: "Investigate and fix failures in app/frontend/client-app/tests/e2e/client.cross-app.spec.ts"
created: 2026-05-25T14:30:00Z
updated: 2026-05-25T14:30:00Z
---

## Current Focus

hypothesis: Missing tactical labels and insufficient test data setup cause E2E failures.
test: Apply labels and investigate payment data setup.
expecting: Labels allow selectors to find elements; payment test finds a session.
next_action: Apply sr-only tactical labels to ReservationWizard.tsx

## Symptoms

expected: E2E tests in client.cross-app.spec.ts pass.
actual: "creates a reservation" times out on labels; "settles a live table payment" fails due to no payable session.
errors: 
  - Timeout waiting for getByLabel('Temporal Window')
  - 'No payable table session was available in the seeded Docker dataset.'
reproduction: npm run test:e2e -- --project=chromium tests/e2e/client.cross-app.spec.ts in client-app.
started: 2026-05-25

## Eliminated

## Evidence

## Resolution

root_cause: 
fix: 
verification: 
files_changed: []
