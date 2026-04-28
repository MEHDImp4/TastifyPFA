# Phase 5: Categories Frontend - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 05-categories-frontend
**Areas discussed:** App structure, List display style, CRUD interaction pattern, Image upload scope

---

## App Structure

| Option | Description | Selected |
|--------|-------------|----------|
| React Router + sidebar layout now | Install React Router v6, fixed sidebar with icon+label, all future routes extend from here | ✓ |
| Defer routing, tabs for now | Keep App.tsx as shell with tab bar, refactor later | |

**User's choice:** React Router v6 + sidebar layout now

| Sub-option | Selected |
|------------|----------|
| Icon + label, always visible sidebar (≈220px, no collapse) | ✓ |
| Collapsible sidebar | |
| Top navigation bar | |

**Notes:** User confirmed the sidebar-first approach to avoid a disruptive refactor when Phase 7 (Plats Frontend) arrives.

---

## List Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Data table | Rows with image thumbnail, nom, ordre, active toggle, actions | ✓ |
| Card grid | Visual cards with large images, name badge, active indicator | |

**User's choice:** Data table

| Sub-option | Selected |
|------------|----------|
| Direct inline toggle (instant PATCH on click) | ✓ |
| Edit form only for active state | |

**Notes:** Direct toggle chosen because the operation is fast and common — the Gérant may need to enable/disable many categories in one pass.

---

## CRUD Interaction Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Slide-over drawer | Panel from the right, same component for create/edit, list remains visible | ✓ |
| Modal dialog | Centered overlay, focused, traditional | |
| Inline editing | Row expands in-place | |

**User's choice:** Slide-over drawer

| Sub-option | Selected |
|------------|----------|
| Inline confirmation (Confirm/Cancel buttons in row for 3s) | ✓ |
| Confirmation dialog | |

**Notes:** Inline confirmation chosen because soft-delete is reversible via the toggle — dialog-level confirmation would be overkill.

---

## Image Upload Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Basic file input with preview | `<input type="file">` + small preview, multipart/form-data | ✓ |
| Drag-and-drop with preview | react-dropzone, polished UX | |
| Defer image upload | Text fields only in Phase 5 | |

**User's choice:** Basic file input with preview

**Notes:** Keeps Phase 5 scope focused without adding a new library dependency.

---

## Claude's Discretion

- Sidebar icon set (Heroicons, Lucide, or inline SVGs)
- Pagination vs. full list rendering
- Toast/notification library or custom toast
- Loading state: skeleton vs spinner
- Drawer animation implementation details

## Deferred Ideas

- Drag-to-reorder for `ordre_affichage` — future phase
- TanStack Query — future phase
- Batch operations (bulk select/delete/activate) — future phase
- Search/filter in category table — future phase
