---
phase: 43
plan: stabilization
type: auto
autonomous: true
wave: 1
depends_on: [42-tactical-compact-overhaul]
requirements: []
---

# Phase 43 Plan: Stabilization & Regression Fixes

Objective: Achieve 100% Green status for `npm run typecheck` and `npm test` in both `backoffice-app` and `client-app` following the major tactical refactor.

## Context
A recent massive refactor ("Tactical Compact Overhaul") introduced many unused imports, missing icons, and test regressions due to label changes.

## Tasks

### 1. Backoffice App Stabilization
- [ ] Fix TypeScript errors in `app/frontend/backoffice-app/`
    - [ ] Remove unused imports in `App.tsx`, `KdsPage.tsx`, `SettingsPage.tsx`, `HrPage.tsx`, `MaintenancePage.tsx`, `Sidebar.tsx`, `Topbar.tsx`, etc.
    - [ ] Resolve missing/incorrect icons:
        - `Truck` in `Sidebar.tsx`
        - `Inventory` -> `Package` (or correct Lucide name)
        - `Payments` -> `CreditCard` (or correct Lucide name)
        - `Calculate` -> `Calculator`
        - `SupportAgent` -> `Headset`
    - [ ] Fix implicit `any` and possible `undefined` errors.
- [ ] Verify with `npm run typecheck`
- [ ] Run tests with `npm test` and fix any failures

### 2. Client App Stabilization
- [ ] Fix TypeScript errors in `app/frontend/client-app/`
    - [ ] Remove unused imports in `Login.tsx`, `Register.tsx`, `PortalHomePage.tsx`, `MenuPage.tsx`, `AccountPage.tsx`, `ReservationWizard.tsx`.
    - [ ] Resolve missing icons (e.g., `SupportAgent` -> `Headset`).
- [ ] Fix Unit Test failures
    - [ ] Update `*.test.tsx` files to match new 'Absolute Visibility' labels (e.g., 'Identify yourself' -> 'Authenticate').
- [ ] Verify with `npm run typecheck`
- [ ] Run tests with `npm test` and fix any failures

## Success Criteria
- [ ] `backoffice-app`: `npm run typecheck` passes (0 errors).
- [ ] `backoffice-app`: `npm test` passes (0 failures).
- [ ] `client-app`: `npm run typecheck` passes (0 errors).
- [ ] `client-app`: `npm test` passes (0 failures).
- [ ] Dashboard updated and summarized.
