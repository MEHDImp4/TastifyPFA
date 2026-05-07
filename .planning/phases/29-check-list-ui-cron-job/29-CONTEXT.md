# Phase 29: Check-list UI & Cron Job - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the backoffice checklist UI on top of the existing checklist API and daily generation backend so staff can open today's operational checklists, complete items inline, and managers can manage templates from the same module.

</domain>

<decisions>
## Implementation Decisions

### Placement and Access
- Add a dedicated `/checklists` route in the existing backoffice sidebar.
- Expose the page to `GERANT`, `SERVEUR`, and `CUISINIER`.
- Keep the integration aligned with the current route-gated staff SPA instead of embedding checklist execution under `/salle`.

### Page Structure
- Build one operational checklist module centered on today's executions.
- Keep GERANT-only template management in the same module instead of splitting it into a separate route for this phase.
- Preserve role-based behavior inside the page rather than through separate pages.

### Execution Flow
- Default the page to today's auto-generated executions.
- Let staff complete checklist items inline from the execution view.
- Allow GERANT to create an execution manually only as an exception path when needed.

### Realtime and Sync
- Fetch checklist data on page load.
- Provide manual refresh controls.
- Use optimistic item completion toggles for responsiveness.
- Do not add websocket sync in this phase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/frontend/backoffice/src/App.tsx` already defines role-gated route registration patterns.
- `app/frontend/backoffice/src/components/layout/Sidebar.tsx` already owns the staff navigation surface.
- `app/frontend/backoffice/src/pages/Reservations/index.tsx` provides a strong pattern for a data-heavy operational page with filters, drawer-based secondary actions, and shared pagination.
- `app/frontend/backoffice/src/pages/Stock/index.tsx` provides a strong pattern for inline operational actions, mobile/desktop adaptation, and optimistic local state updates.

### Established Patterns
- Backoffice pages are route-based and mounted under the shared `AppShell`.
- Role gating is enforced at the route level with `RoleRoute`, then refined inside pages as needed.
- Data is fetched with `axiosInstance` from the shared auth layer.
- Existing staff pages favor one primary operational screen with lightweight secondary surfaces instead of fragmented workflows.

### Integration Points
- Add a new backoffice page under `app/frontend/backoffice/src/pages/Checklists/`.
- Register the route in `app/frontend/backoffice/src/App.tsx`.
- Add a sidebar entry in `app/frontend/backoffice/src/components/layout/Sidebar.tsx`.
- Integrate with `/api/checklists/`, `/api/checklists/executions/`, and `/api/checklists/responses/{id}/`.

</code_context>

<specifics>
## Specific Ideas

- The page should feel like an operations console for opening/closing routines, not like a generic CRUD table.
- Today's executions should be the default focal point because the backend already generates them daily at `04:00`.
- Template management should remain available to GERANT inside the same module so the feature is operationally complete in one place.

</specifics>

<deferred>
## Deferred Ideas

- Live websocket checklist updates are deferred beyond this phase.
- Splitting template management and execution into separate pages is deferred unless the single-module approach proves too dense during implementation.

</deferred>
