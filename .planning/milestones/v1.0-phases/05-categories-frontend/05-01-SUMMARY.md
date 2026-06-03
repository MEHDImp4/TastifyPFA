---
phase: 05-categories-frontend
plan: 01
subsystem: back-office
tags: [frontend, routing, layout, auth-gate]
dependency_graph:
  requires: [PHASE-03-auth-api-login]
  provides: [AppShell, Routing]
  affects: [frontend/back-office]
tech_stack:
  added: [react-router-dom]
  patterns: [TDD, Auth Gating, Layout/Outlet]
key_files:
  created:
    - frontend/back-office/src/components/layout/AppShell.tsx
    - frontend/back-office/src/components/layout/AppShell.test.tsx
    - frontend/back-office/src/components/layout/Sidebar.tsx
    - frontend/back-office/src/pages/Categories/index.tsx
    - frontend/back-office/src/App.test.tsx
  modified:
    - frontend/back-office/package.json
    - frontend/back-office/src/App.tsx
decisions:
  - use react-router-dom v6 for declarative routing
  - gate access to AppShell routes via useAuthStore
  - use NavLink in Sidebar for active route highlighting
metrics:
  duration: 1h
  completed_date: 2026-04-28
---

# Phase 05 Plan 01: AppShell and Routing Summary

Established the foundation for the back-office SPA by implementing a tested AppShell layout with a sidebar and integrated routing with authentication gating.

## Key Achievements

- **Authentication Gating**: Implemented `AppShell` component that checks `isAuthenticated` from Zustand store and redirects to `/login` if needed.
- **Sidebar Layout**: Created a fixed Sidebar with navigation links to key modules (Catégories, Plats, etc.) using Tailwind CSS and Lucide icons.
- **Routing Setup**: Configured `react-router-dom` in `App.tsx` with nested routes under the authenticated `AppShell`.
- **TDD Compliance**: Wrote and passed unit tests for `AppShell` (auth logic) and `App` (routing logic).

## Deviations from Plan

None - plan executed as written. Tasks 2 and 3 were completed following the TDD approach started by the previous agent.

## Known Stubs

- `frontend/back-office/src/pages/Categories/index.tsx`: Basic placeholder heading for the categories module.
- `Sidebar.tsx`: Several links (`Plats`, `Tables`, `Stock`, `RH`, `Dashboard`) point to `#` as their respective pages are not yet implemented.

## Self-Check: PASSED
- [x] AppShell redirects to /login if not authenticated.
- [x] Sidebar renders and highlights active route.
- [x] / redirect to /categories when authenticated.
- [x] All tests pass.
