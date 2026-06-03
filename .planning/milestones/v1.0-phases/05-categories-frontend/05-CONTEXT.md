# Phase 5: Categories Frontend - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the back-office React UI for managing categories. The Gérant (GERANT role) can list, create, edit, toggle active/inactive, and soft-delete categories. The API at `/api/categories/` is fully operational from Phase 4. This phase also establishes the back-office app shell (React Router + sidebar layout) that all subsequent back-office phases (7, 9, 19, 22, 32…) will extend.

Scope is limited to the back-office SPA (`frontend/back-office/`). Read-only visibility in other SPAs (Salle, KDS, Portail Client) is out of scope.

</domain>

<decisions>
## Implementation Decisions

### App Shell & Routing
- **D-01:** Install React Router v6 in the back-office SPA. This is the first phase that introduces real routing — do it now to avoid a disruptive refactor in Phase 7.
- **D-02:** Fixed sidebar layout: sidebar always visible on the left (≈220px), main content area on the right. No collapse toggle — the back-office targets desktop/tablet GERANTs.
- **D-03:** Sidebar style: icon + text label per section. Active route highlighted with teal accent per the ECO-FRESH design system. Navigation entries to stub out: Catégories, Plats, Tables, Stock, HR, Dashboard — all except Catégories are placeholder links (no routes yet).
- **D-04:** The authenticated shell (`<AppShell>`) is the top-level layout after login. The Login page (from Phase 3 `_shared/auth/Login`) is rendered outside the shell when `!isAuthenticated`.

### Category List Display
- **D-05:** Data table layout. Columns: image thumbnail, Nom, Ordre d'affichage, Est active (toggle), Actions (edit + delete).
- **D-06:** The `est_active` column renders as an inline toggle switch. Clicking it sends `PATCH /api/categories/{id}/` with `{ est_active: !current }` immediately — no edit form required for toggling.
- **D-07:** The GERANT sees all categories (active and inactive) per the Phase 4 backend visibility rule. Inactive rows are visually dimmed (reduced opacity) to distinguish them.

### CRUD Interaction Pattern
- **D-08:** Slide-over drawer panel sliding from the right. Same `<CategoryDrawer>` component handles both create (empty form) and edit (pre-filled form). Opening the drawer for edit pre-populates all fields from the row data.
- **D-09:** Delete action uses inline confirmation: clicking the delete icon replaces the row's action buttons with "Confirmer / Annuler" for 3 seconds, then auto-reverts if no action. Soft-delete is sent via `DELETE /api/categories/{id}/` — no dialog needed since the action is reversible via toggle.

### Image Upload
- **D-10:** Standard `<input type="file" accept="image/*">` within the drawer form. Shows a small square preview (≈80px) of the selected image before submitting. Sends as `multipart/form-data` to the API. On edit, shows the existing image URL as the current preview.

### Data Fetching
- **D-11:** No TanStack Query in Phase 5 — raw Axios + `useState`/`useEffect` is sufficient for this phase's scope. TanStack Query can be introduced when caching or optimistic updates become necessary (Phase 7+ with more complex data relationships). Use the shared `axiosInstance` from `_shared/auth/axiosInstance.ts`.

### Form Handling & Validation
- **D-12:** No react-hook-form or Zod in Phase 5. Controlled inputs with basic required validation on `nom` (non-empty) are sufficient. Keep dependencies minimal.

### Claude's Discretion
- Exact sidebar icon set (Heroicons, Lucide, or inline SVGs)
- Pagination vs. full list (categories count is small — full list is fine for now)
- Toast/notification library for success/error feedback (or a lightweight custom toast)
- Loading skeleton vs spinner for the table initial load
- Exact drawer animation spec (should follow DESIGN.md: `scale(0.95)` → `scale(1)`, 200ms ease-out)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system
- `DESIGN.md` — ECO-FRESH palette, typography (Inter), animation spec (150–250ms ease-out, `scale(0.97)` active states, modal/drawer entry from `scale(0.95)`), button standards, WCAG AA contrast requirement.

### Existing shared auth layer
- `frontend/_shared/auth/useAuthStore.ts` — Zustand auth store (`isAuthenticated`, `user`, `role`, `accessToken`). Gate the app shell on `isAuthenticated`.
- `frontend/_shared/auth/axiosInstance.ts` — Pre-configured Axios instance with JWT interceptors. Use this for all API calls — never create a new Axios instance.
- `frontend/_shared/auth/Login.tsx` — Shared Login component already used in all SPAs.

### Theme tokens
- `frontend/_shared/theme.css` — Tailwind CSS 4 `@theme` block with ECO-FRESH tokens: `--color-teal`, `--color-background`, `--color-surface`, `--color-surface-elevated`, `--color-foreground-muted`, `--color-error`, animation utilities (`.animate-enter`).

### Backend API contract
- `backend/apps/menu/serializers.py` — CategorieSerializer fields: `id`, `nom`, `description`, `ordre_affichage`, `image` (absolute URL), `est_active`, `created_at`, `updated_at`.
- `backend/apps/menu/views.py` — RBAC: list/retrieve open to all authenticated; create/update/delete require GERANT role. DELETE returns 204, sets `est_active=False`.
- `.planning/phases/04-categories-model-api/04-VERIFICATION.md` — Verified API contract details.

### Project architecture
- `.planning/PROJECT.md` — RBAC four roles, JWT auth, strict JSON-only API, React 18 + Vite + Tailwind CSS 4.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/_shared/auth/useAuthStore.ts` — `user.role` contains the role string; gate write actions (add, edit, delete) behind `role === 'GERANT'` check on the frontend too.
- `frontend/_shared/auth/axiosInstance.ts` — Handles token refresh automatically; use for all `/api/categories/` calls.
- `frontend/_shared/theme.css` — All ECO-FRESH tokens available as Tailwind utilities (`bg-background`, `bg-surface`, `text-teal`, `text-error`, etc.).
- `frontend/back-office/src/index.css` — Already imports `theme.css` and configures `@custom-variant dark`. No new CSS setup needed.

### Established Patterns
- Dark mode by default: `bg-background` (`#1a323b`) for page, `bg-surface` (`#264653`) for cards/containers.
- Animation: `.animate-enter` (scale 0.95 → 1, 250ms ease-out) already defined — use for drawer and new elements.
- `rounded-3xl` + `border border-white/5` + `shadow-2xl` is the established card style from Phase 3 login.

### Integration Points
- `frontend/back-office/src/App.tsx` — Currently the entire authenticated shell placeholder. Will be refactored: `App.tsx` becomes the router root, a new `AppShell.tsx` handles layout, and `pages/CategoriesPage.tsx` is the categories route.
- `frontend/back-office/src/main.tsx` — Entry point unchanged; `App.tsx` becomes `<BrowserRouter>`.
- React Router v6 must be added to `frontend/back-office/package.json` dependencies.

</code_context>

<specifics>
## Specific Ideas

- The drawer panel should feel like Linear's issue sidebar — slides in smoothly, content list remains visible but dimmed behind a subtle overlay.
- Inactive category rows should be visually distinguished (reduced opacity, e.g. `opacity-50`) so the Gérant can immediately tell what's live vs. hidden from customers.
- The inline delete confirmation ("Confirmer / Annuler") pattern is appropriate here because soft-delete is reversible via the toggle — this avoids dialog fatigue for a management task.

</specifics>

<deferred>
## Deferred Ideas

- **Drag-to-reorder** for `ordre_affichage` — the Gérant would drag rows to set display order. Deferred: use manual number input for now.
- **TanStack Query / react-query** — Introduce in a later phase when caching and optimistic updates become necessary.
- **Batch operations** (select multiple → bulk delete/activate) — future phase.
- **Search/filter** in the category table — future phase.

</deferred>

---

*Phase: 05-categories-frontend*
*Context gathered: 2026-04-28*
