# Phase 29 UI Spec: Check-list UI & Cron Job

**Phase:** 29  
**Date:** 2026-05-07  
**Status:** Approved for implementation

## Goal

Deliver a backoffice checklist module that lets staff open today's generated checklist executions, complete tasks inline with fast visual feedback, and lets GERANT users manage checklist templates and create manual executions when needed.

## Route and Access

- Add a dedicated `/checklists` page to the backoffice SPA.
- Expose the page to `GERANT`, `SERVEUR`, and `CUISINIER`.
- Keep route-level gating in `App.tsx` with `RoleRoute`.
- Add sidebar navigation alongside the existing operational modules.

## Primary Experience

- The page opens on today's date by default.
- The top of the page presents the date context, execution counts, completion progress, and a manual refresh action.
- The main content is a list of today's executions.
- Each execution card shows checklist title, type, status, completion ratio, and assignee metadata.
- Each task row supports inline completion with an optimistic toggle.
- Completion states must update immediately in local state, then reconcile with the API response.

## Manager Experience

- GERANT users can open a drawer-based management surface from the same page.
- The management surface supports:
  - listing checklist templates
  - creating a new template
  - editing an existing template
  - toggling template active state through save semantics
  - manually creating an execution for a chosen checklist/date
- Template task editing is handled inside the drawer with ordered rows.

## Non-Manager Experience

- `SERVEUR` and `CUISINIER` users see the operational execution view only.
- Secondary manager actions are fully hidden for non-GERANT roles.

## Interaction Design

- Preserve the existing ECO-FRESH backoffice language: dark surfaces, teal emphasis, amber warning accents, rounded cards, and terse operational copy.
- Use one-screen operational hierarchy instead of CRUD tables as the primary experience.
- Keep actions touch-safe with minimum 44px interactive targets.
- Avoid websocket behavior in this phase.
- Use manual refresh rather than polling.

## Data Contract

- `GET /checklists/executions/?date=YYYY-MM-DD` drives the main view.
- `PATCH /checklists/responses/{id}/` updates `est_complete`.
- `GET /checklists/` lists templates for GERANT management.
- `POST /checklists/` and `PATCH /checklists/{id}/` manage templates.
- `POST /checklists/executions/` creates manual executions.

## Validation

- Add frontend tests for the new checklist page behavior.
- Run the backoffice production build before phase completion.
- Validate role-based rendering and optimistic completion behavior through automated tests.
