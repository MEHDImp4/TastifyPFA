# Phase 7: Plats Frontend - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the back-office UI for managing dishes inside `frontend/back-office/` using the existing authenticated shell, router, and shared auth infrastructure. This phase covers dish listing, category filtering, responsive presentation, create/edit flows, inline status management, and frontend validation against the Phase 6 API contract. It does not add search, bulk actions, drag-and-drop ordering, recipe linking, or menu management features for other SPAs.

</domain>

<decisions>
## Implementation Decisions

### Responsive list layout
- **D-01:** The dishes page uses a hybrid presentation: a desktop data table and mobile cards selected automatically by breakpoint.
- **D-02:** Desktop must always show `image`, `nom`, `categorie`, `prix`, `est_disponible`, `est_active`, and row actions.
- **D-03:** Mobile cards must use a manager snapshot layout with image, name, price, category, and a compact action row for status controls and edit/delete actions.
- **D-04:** There is no manual table/card toggle in this phase; the layout switches responsively only.

### Category handling
- **D-05:** The page manages a single master dish list with a primary category filter instead of category-first sections or dedicated category subpages.
- **D-06:** The default filter state is `All categories`.
- **D-07:** The category filter is a primary top-bar control, not a buried secondary control.
- **D-08:** If a filtered category has no dishes, the empty state stays scoped to that category and offers a create action that preserves the current category context.
- **D-09:** When the manager clicks `New Plat` while a category filter is active, the drawer preselects that category but still allows changing it.

### Status controls
- **D-10:** Both `est_disponible` and `est_active` are editable inline from the list/card view.
- **D-11:** Inline status changes send updates immediately rather than asking for confirmation.
- **D-12:** The UI must keep the two statuses visually distinct with separate labels for `Disponible` and `Actif`.
- **D-13:** Inactive dishes remain visible, visually dimmed, and fully editable so managers can reactivate them easily.
- **D-14:** On mobile cards, the status controls live in a compact action row rather than directly inside the card body.

### Create and edit drawer
- **D-15:** The form should be a practical manager drawer, not a minimal or editorial form.
- **D-16:** Drawer fields are grouped into three sections:
  - Basic info: `categorie`, `nom`, `description`
  - Pricing/operations: `prix`, `temps_preparation`
  - Media/status: `image`, `est_disponible`, `est_active`
- **D-17:** `prix` and `temps_preparation` use strict inline validation, with invalid values blocking submit.
- **D-18:** Image handling reuses the categories pattern: basic file input with preview.
- **D-19:** Editing an existing dish must fully prefill all current values, including category, statuses, and image preview.

### the agent's Discretion
- Exact breakpoint choice for switching between desktop table and mobile cards.
- Whether inline status updates are optimistic in the UI as long as the interaction still behaves as an immediate update from the manager perspective.
- Exact wording and illustration treatment for empty, loading, and error states.
- Whether the category filter uses a native select, styled select, or an equivalent lightweight control that fits the existing design system.

</decisions>

<specifics>
## Specific Ideas

- Phase 7 should feel like a direct extension of the categories management flow rather than a separate admin experience.
- The back-office is optimized for operational speed: managers should be able to change both availability and active state without opening the drawer.
- Mobile remains a true management surface, not a read-only fallback, so the card view must keep direct status controls and quick actions.
- Category context should reduce repetitive work: filtering and creating within a category should carry that context forward automatically.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and prior decisions
- `.planning/ROADMAP.md` — Phase 7 goal, dependency on Phase 6, and success criteria.
- `.planning/PROJECT.md` — Global stack, SPA architecture, and auth rules.
- `.planning/STATE.md` — Current planning resume point and latest locked backend decisions.
- `.planning/phases/05-categories-frontend/05-CONTEXT.md` — Locked categories frontend patterns that Phase 7 should extend.
- `.planning/phases/05-categories-frontend/05-DISCUSSION-LOG.md` — Preserved alternatives behind the categories UI decisions.
- `.planning/phases/06-plats-model-api/06-CONTEXT.md` — Locked dish API contract and backend visibility rules that the UI must honor.
- `.planning/phases/06-plats-model-api/06-RESEARCH.md` — Existing backend research covering dish API shape and expected endpoints.
- `.planning/phases/06-plats-model-api/06-VERIFICATION.md` — Verification expectations for the current dish backend.

### Product and design docs
- `DESIGN.md` — ECO-FRESH design system and interaction rules for responsive, tactile admin UI.
- `docs/cahier_de_charge_tastify.md` — Source product specification for menu and back-office behavior.
- `docs/brain/04_Features/BACKOFFICE_GERANT.md` — Product-level expectations for manager-side dish administration.
- `docs/brain/03_Architecture/API_DESIGN.md` — REST API conventions and authenticated request expectations.

### Existing frontend and backend contracts
- `frontend/back-office/src/App.tsx` — Existing route tree and categories route pattern to extend with `/plats`.
- `frontend/back-office/src/components/layout/AppShell.tsx` — Authenticated shell pattern the plats page must live inside.
- `frontend/back-office/src/components/layout/Sidebar.tsx` — Existing back-office navigation entry point for the dishes route.
- `frontend/back-office/src/pages/Categories/index.tsx` — Current categories page orchestration pattern.
- `frontend/back-office/src/pages/Categories/CategoryList.tsx` — Existing desktop table pattern to reuse or extend.
- `frontend/back-office/src/pages/Categories/CategoryRow.tsx` — Existing inline status toggle and row action pattern.
- `frontend/back-office/src/pages/Categories/CategoryDrawer.tsx` — Existing create/edit drawer pattern, file upload flow, and validation baseline.
- `frontend/back-office/src/components/ui/Drawer.tsx` — Shared drawer implementation to reuse.
- `frontend/back-office/src/components/ui/Switch.tsx` — Shared toggle control already used for inline activation state.
- `frontend/_shared/auth/axiosInstance.ts` — Required authenticated HTTP client for all API calls.
- `frontend/_shared/auth/useAuthStore.ts` — Current auth state contract.
- `backend/apps/menu/serializers.py` — Dish payload shape used by the frontend.
- `backend/apps/menu/views.py` — Dish visibility and filter behavior, including `?categorie=<id>`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/back-office/src/pages/Categories/index.tsx` already contains the fetch-orchestrate-open-drawer pattern the plats page can mirror.
- `frontend/back-office/src/pages/Categories/CategoryList.tsx` provides the current admin table shell and empty-state baseline.
- `frontend/back-office/src/pages/Categories/CategoryDrawer.tsx` already solves multipart form submission, image preview, and drawer-based create/edit flows.
- `frontend/back-office/src/components/ui/Drawer.tsx` and `Switch.tsx` are existing UI primitives for slide-over forms and inline boolean controls.
- `frontend/_shared/auth/axiosInstance.ts` already handles JWT injection and refresh, so Phase 7 should not create a new client layer.

### Established Patterns
- The back-office route structure already uses `AppShell` plus nested routes under `/back-office`.
- Categories use inline row-level actions, direct status toggles, and a right-side drawer rather than modal editing.
- The current design language relies on ECO-FRESH tokens, elevated surfaces, and dense manager-oriented layouts rather than marketing-style cards.

### Integration Points
- `frontend/back-office/src/App.tsx` needs a `/plats` route alongside `/categories`.
- `frontend/back-office/src/components/layout/Sidebar.tsx` needs the `Plats` nav item wired to the real route.
- `frontend/back-office/src/pages/Plats/` should become the new feature slice for page orchestration, responsive list rendering, row/card actions, and drawer form logic.
- `backend/apps/menu/views.py` already supports category filtering through `?categorie=<id>`, so the frontend filter should map directly to that query parameter.
- Frontend tests should cover responsive rendering choices, inline status actions, filtered empty state behavior, and drawer validation flows.

</code_context>

<deferred>
## Deferred Ideas

- Search and multi-filter toolbar for dishes — future refinement phase.
- Batch actions such as bulk activate/deactivate/delete — future admin productivity phase.
- Drag-and-drop ordering or explicit dish sort management — future menu curation phase.
- Recipe, ingredient, or stock linkage inside the dish form — later inventory phases.
- Rich media workflows such as drag-and-drop upload or advanced previews — future UX enhancement phase.

</deferred>

---

*Phase: 07-plats-frontend*
*Context gathered: 2026-04-28*
