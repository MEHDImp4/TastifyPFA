---
phase: 44
plan: e2e-modernization
type: auto
autonomous: true
wave: 1
depends_on: [43-stabilization]
requirements: []
---

# Phase 44 Plan: E2E Suite Modernization

Objective: Rewrite and align the Playwright E2E test suite with the "Tactical Command" architecture. Remove legacy hacks and implement robust, semantic testing patterns.

## Context
The recent UI overhaul broke 90% of the E2E suite. Temporary "alignment hacks" (hidden headings, aria-labels matching legacy strings) were implemented to improve the pass rate, but a full modernization is required for long-term maintainability.

## Tasks

### 1. Test Infrastructure & Fixtures
- [ ] Update `tests/e2e/fixtures/` to use new `data-testid` constants.
- [ ] Enhance `loginThroughUi` to handle potential "Absolute Visibility" entry animations (if any remain).
- [ ] Refactor `mockConfig` to match the updated `RestaurantConfiguration` schema.

### 2. Backoffice Modernization
- [ ] **Auth Suite**: Update `auth.public.spec.ts` and `auth.a11y.spec.ts` to use semantic locators.
- [ ] **Manager (Gerant) Suite**:
    - [ ] Rewrite `backoffice.gerant.spec.ts` to navigate through the new Sidebar.
    - [ ] Update Sector (Category) and Culinary (Plat) CRUD tests to use the new slide-over editor pattern.
    - [ ] Update Settings test to verify the new multi-column layout.
- [ ] **Staff (Serveur/Cuisinier) Suite**:
    - [ ] **Salle**: Update table interaction tests to account for the new "Table X" label logic.
    - [ ] **KDS**: Replace `.double-bezel` locators with semantic ticket articles. Update status transition assertions (Incoming -> In Progress -> Ready).
    - [ ] **Ordering**: Update cart and search intersection tests for the new dense UI.

### 3. Client Portal Modernization
- [ ] Update `client.auth.spec.ts` to use new `data-testid` attributes.
- [ ] Align `client.menu.spec.ts` with the new "High-End Premium Editorial" menu layout.
- [ ] Verify Reservation Wizard steps in the updated compact flow.

### 4. Coverage Expansion & Cleanup
- [ ] Add E2E tests for the **Delivery Hub**.
- [ ] Add E2E tests for the **Sentiment Analytics (Avis)** page.
- [ ] **Cleanup**: Remove temporary hidden French headings (`Catégories`, `Plats`, etc.) and legacy aria-label hacks from the codebase once tests are modernized.

## Success Criteria
- [ ] `backoffice-app`: `npm run test:e2e` achieves 100% pass rate.
- [ ] `client-app`: `npm run test:e2e` achieves 100% pass rate.
- [ ] No "test-only" hidden elements remaining in the production UI.
- [ ] Dashboard updated and summarized.
