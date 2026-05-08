---
status: diagnosed
phase: 29-ai-recommender-system
source: 29-01-SUMMARY.md, 29-02-SUMMARY.md, 29-03-SUMMARY.md
started: 2026-05-08T01:00:00Z
updated: 2026-05-08T01:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Browse Menu Page
expected: |
  Navigate to the Menu page. See a list of available dishes (Plats).
result: issue
reported: "[plugin:vite:import-analysis] Failed to resolve import "../../../shared/auth/axiosInstance" from "src/api/menu.ts". Does the file exist?"
severity: major

### 3. View Recommendations
expected: |
  Select a dish from the Menu page. A "Recommandé pour vous" or "Recommendations" section appears, displaying recommended dishes for the selected dish.
result: issue
reported: "n"
severity: major

### 4. Empty Recommendations Fallback
expected: |
  Select a dish that has no similar items yet (or clear the cache). Recommendations still appear (should fallback to the top 5 most frequently ordered active Plats).
result: issue
reported: "n"
severity: major

## Summary

total: 4
passed: 1
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Navigate to the Menu page. See a list of available dishes (Plats)."
  status: failed
  reason: "User reported: [plugin:vite:import-analysis] Failed to resolve import '../../../shared/auth/axiosInstance' from 'src/api/menu.ts'. Does the file exist?"
  severity: major
  test: 2
  root_cause: "The app/frontend/portail/src/api/menu.ts file uses a hardcoded relative path ../../../shared/auth/axiosInstance instead of the @shared alias, breaking in Docker."
  artifacts:
    - path: "app/frontend/portail/src/api/menu.ts"
      issue: "Incorrect relative import path"
  missing:
    - "Update import to use @shared/auth/axiosInstance"
  debug_session: ".planning/debug/plats-api-import-analysis-fail.md"

- truth: "Select a dish from the Menu page. A 'Recommandé pour vous' or 'Recommendations' section appears, displaying recommended dishes for the selected dish."
  status: failed
  reason: "User reported: n"
  severity: major
  test: 3
  root_cause: "Cascading failure from test 2 due to Vite import-analysis crash in src/api/menu.ts."
  artifacts:
    - path: "app/frontend/portail/src/api/menu.ts"
      issue: "Incorrect relative import path crashing the app"
  missing:
    - "Update import to use @shared/auth/axiosInstance"
  debug_session: ".planning/debug/ai-recommender-missing.md"

- truth: "Select a dish that has no similar items yet (or clear the cache). Recommendations still appear (should fallback to the top 5 most frequently ordered active Plats)."
  status: failed
  reason: "User reported: n"
  severity: major
  test: 4
  root_cause: "Cascading failure from test 2 due to Vite import-analysis crash in src/api/menu.ts."
  artifacts:
    - path: "app/frontend/portail/src/api/menu.ts"
      issue: "Incorrect relative import path crashing the app"
  missing:
    - "Update import to use @shared/auth/axiosInstance"
  debug_session: "N/A"

