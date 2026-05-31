---
status: investigating
trigger: "Fixing E2E tests in 'app/frontend/backoffice-app/tests/e2e/backoffice.serveur.spec.ts'. Table clicks not navigating and existing order tests failing due to unmocked fetchData calls."
created: 2026-05-27T16:00:00Z
updated: 2026-05-27T16:00:00Z
---

## Current Focus

hypothesis: "Tests fail because mocks are too restrictive and table clicks are unreliable in Playwright."
test: "Improve mocks with regex and update SallePage table click mechanism."
expecting: "Tests should pass reliably."
next_action: "Examine backoffice.serveur.spec.ts and SallePage.tsx."

## Symptoms

expected: "Table clicks navigate to order page, and all API calls after submission are mocked."
actual: "Table clicks fail to navigate in one test, and fetchData calls hit unmocked URLs."
errors: "Timeout waiting for navigation, 404/500 on unmocked API calls."
reproduction: "Run npx playwright test tests/e2e/backoffice.serveur.spec.ts"
started: "Recently during E2E test refinement."

## Eliminated

## Evidence

## Resolution

root_cause: 
fix: 
verification: 
files_changed: []
