---
phase: 07-plats-frontend
type: research
confidence_overall: HIGH
---

# Phase 07: Plats Frontend — Research

## 1. Executive Summary

Phase 7 builds the back-office dishes management UI on top of the completed categories frontend and the shipped dishes API. The codebase already has the layout shell, shared drawer/switch primitives, category CRUD flow, and backend dish filtering contract needed for implementation. The main work is extending the existing manager workflow to a denser, responsive dishes surface without drifting from the locked Phase 7 context.

The recommended split is:
- `07-01` foundation: route, sidebar entry, typed contracts, page scaffold, category filter state, responsive seam.
- `07-02` list surface: desktop table, mobile cards, labeled inline status controls, actions.
- `07-03` drawer workflow: create/edit drawer, strict validation, category-aware defaults, filtered empty state.

## 2. Existing Frontend Baseline

### 2.1 App shell and routing

[VERIFIED: `frontend/back-office/src/App.tsx`, `frontend/back-office/src/components/layout/Sidebar.tsx`]

- The back-office already uses React Router v6 with `AppShell`.
- Categories is the current management route.
- Sidebar already includes a placeholder `Plats` navigation item using `#`, so Phase 7 should replace that placeholder with `/plats` instead of introducing a new navigation pattern.

### 2.2 Reusable UI primitives

[VERIFIED: `frontend/back-office/src/components/ui/Drawer.tsx`, `frontend/back-office/src/components/ui/Switch.tsx`]

- `Drawer` already supports the right-side management pattern used by categories.
- `Switch` exists and is suitable for inline boolean state changes, but Phase 7 needs two distinct statuses (`Disponible`, `Actif`), so labeling and testability matter more than in the current categories flow.

### 2.3 Categories page pattern

[VERIFIED: `frontend/back-office/src/pages/Categories/index.tsx`, `CategoryDrawer.tsx`, `CategoryRow.tsx`]

Categories establishes the operational baseline:
- table-first manager UI
- right-side drawer for create/edit
- direct inline active toggle
- inline delete confirmation
- optimistic manager workflow without extra modal layers

Phase 7 should preserve that rhythm and expand it for the richer dish record.

## 3. Backend Contract Available to Frontend

[VERIFIED: `backend/apps/menu/tests/test_plats_api.py`]

The dish API already exposes the fields needed by the UI:
- `id`
- `categorie`
- `nom`
- `description`
- `prix`
- `temps_preparation`
- `image`
- `est_disponible`
- `est_active`

The API also supports category scoping via `?categorie=<id>`, which fits the locked decision of a single master list with a primary category filter.

## 4. Testing Baseline

[VERIFIED: `frontend/back-office/package.json`, `frontend/back-office/src/App.test.tsx`, `frontend/back-office/src/pages/Categories/CategoryDrawer.test.tsx`, `frontend/back-office/src/pages/Categories/CategoryRow.test.tsx`]

- Frontend tests use `vitest` and Testing Library.
- Existing coverage focuses on route rendering, row interaction, drawer interaction, and mutation flows.
- Phase 7 should follow the same TDD shape with component tests around:
  - route registration
  - responsive seam selection
  - desktop table/card rendering
  - inline status actions
  - drawer validation and prefill

## 5. Gaps Between Current UI and Phase 7 Needs

### 5.1 Two-status clarity

Categories only deals with `est_active`. Dishes introduce:
- `est_disponible` for operational availability
- `est_active` for catalog activity / soft-delete visibility

The existing `Switch` component is reusable, but the dishes UI must visibly label both controls to avoid accidental misuse.

### 5.2 Responsive surface split

Categories is table-oriented. Phase 7 is explicitly locked to:
- desktop table
- mobile cards
- automatic breakpoint switch

That means the page needs a small view-selection seam so tests can verify desktop/mobile behavior without coupling to browser layout implementation details.

### 5.3 Category-aware create flow

The page must remember category filter state and preselect it in the create drawer while still allowing edits. Categories does not currently solve this problem because category is the entity itself.

### 5.4 Validation expectations

The user locked strict inline validation for `prix` and `temps_preparation`. That is stronger than the current category drawer, so the drawer plan needs dedicated validation tests rather than relying only on submit-time errors.

## 6. Implementation Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Confusing the two status toggles | `Disponible` and `Actif` have different business meanings | Shared labeled status control component and explicit tests for both labels |
| Duplicated responsive logic | Table/card branching can sprawl into the page container | Centralize view selection in a dedicated seam/hook |
| Filter and drawer default drift | Wrong preselected category slows creation and creates data entry mistakes | Keep selected category in page state and feed it directly into drawer initialization |
| Validation regression | Numeric parsing and empty values can silently pass | Add drawer tests covering invalid price and prep time states before submit |

## 7. Recommended Plan Split

### 07-01: foundation

Create the route and page shell:
- wire `/plats` route and sidebar navigation
- define typed API contracts for categories and dishes
- add page container with top-bar category filter
- add responsive view-selection seam
- fetch categories and dishes through existing axios infrastructure

### 07-02: responsive management surface

Build the actual list UIs:
- desktop table with locked columns
- mobile manager snapshot cards
- inline labeled `Disponible` and `Actif` controls
- row/card actions and inactive dimming

### 07-03: drawer workflow

Finish the manager workflow:
- grouped create/edit drawer
- strict inline validation
- current image preview support
- create preselects filtered category
- edit fully prefills current values
- filtered empty state preserves category context

## 8. Planning Notes

- Keep the page aligned with the categories visual and interaction language; this is an extension of the same admin system, not a redesign.
- Avoid broad cleanup outside the phase scope. The existing `@types/react-router-dom` version mismatch is real but orthogonal unless it blocks Phase 7 implementation.
- `.planning/REQUIREMENTS.md` is absent locally, so plans should rely on the locked context, roadmap goal, and code-verified contracts instead of a missing requirements file.

## RESEARCH COMPLETE
