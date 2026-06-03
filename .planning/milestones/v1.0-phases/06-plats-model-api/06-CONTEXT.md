# Phase 6: Plats Model & API - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the backend data model and REST API for dishes (`Plat`) inside the existing `menu` app. This phase covers the dish schema, serializer, viewset, route registration, RBAC enforcement, non-manager visibility filtering, soft delete behavior, and backend tests. It does not add new back-office UI capabilities, recipe linking, stock deduction, or real-time availability pushes.

</domain>

<decisions>
## Implementation Decisions

### Dish field contract
- **D-01:** Phase 6 locks the dish payload to `categorie`, `nom`, `description`, `prix`, `temps_preparation`, `image`, `est_disponible`, and `est_active`, with `id`, `created_at`, and `updated_at` read-only.
- **D-02:** No extra business fields are introduced in this phase. `badge_chef`, recipe links, and ingredient mapping stay out of scope for later phases.
- **D-03:** `prix` remains a `DecimalField` and `temps_preparation` remains an integer number of minutes.

### Visibility rules
- **D-04:** Non-`GERANT` users only see plats where `plat.est_active=True`, `plat.est_disponible=True`, and the linked `categorie.est_active=True`.
- **D-05:** `GERANT` users see all plats, including unavailable and inactive rows, so they can manage and reactivate menu items.
- **D-06:** The same visibility rule applies to both list and retrieve endpoints. A non-manager requesting a hidden plat by ID should receive `404`.

### Category dependency behavior
- **D-07:** If a category becomes inactive, its dishes are hidden automatically through queryset filtering only.
- **D-08:** Category deactivation must not mutate dish rows. It does not auto-set `est_disponible=False` or `est_active=False` on related plats.
- **D-09:** The category relationship remains the source of truth for whether a dish is publicly visible.

### Validation rules
- **D-10:** `nom` and `categorie` are required.
- **D-11:** `prix` must be strictly greater than `0`.
- **D-12:** `temps_preparation` must be strictly greater than `0`.
- **D-13:** Validation stays basic in this phase. No unique-per-category naming rule, minimum description length, or advanced business constraints are added yet.

### the agent's Discretion
- Exact serializer implementation style for field validation (`validate_<field>` vs object-level validation).
- Whether the plat queryset centralizes filtering in a custom queryset helper or directly in the viewset.
- Test data naming and fixture shape, as long as the locked API behavior is covered.

</decisions>

<specifics>
## Specific Ideas

- The existing `Plat` model already matches the agreed field set closely, so planning should favor finishing the API contract around it rather than redesigning the schema.
- Dish availability and category activation are separate concepts: a dish can remain stored and manageable even when temporarily hidden from non-managers.
- The public menu should behave conservatively: if either the dish or its category is not available to customers/staff readers, the API should hide it.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and prior decisions
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria, and plan split.
- `.planning/PROJECT.md` — Global stack, RBAC baseline, and JSON-only API rules.
- `.planning/phases/04-categories-model-api/04-CONTEXT.md` — Locked category soft-delete and visibility decisions that Phase 6 must extend.
- `.planning/phases/06-plats-model-api/06-RESEARCH.md` — Existing Phase 6 research artifact to reconcile against these locked decisions.
- `.planning/phases/06-plats-model-api/06-VERIFICATION.md` — Existing verification expectations for the phase.

### Product and architecture docs
- `docs/cahier_de_charge_tastify.md` — Source product specification for menu and back-office behavior.
- `docs/brain/03_Architecture/DATABASE_SCHEMA.md` — Global soft-delete, timestamp, and index conventions; includes `plat` indexing guidance.
- `docs/brain/03_Architecture/API_DESIGN.md` — REST API conventions and authentication rules.
- `docs/brain/04_Features/BACKOFFICE_GERANT.md` — Product-level definition of dish management fields and manager expectations.

### Current codebase contract
- `backend/apps/menu/models.py` — Existing `Categorie` and `Plat` model definitions.
- `backend/apps/menu/serializers.py` — Current serializer pattern used for categories.
- `backend/apps/menu/views.py` — Current RBAC and visibility implementation pattern used for categories.
- `backend/apps/menu/urls.py` — Current router registration pattern.
- `backend/apps/menu/tests/test_api.py` — Existing category CRUD test style.
- `backend/apps/menu/tests/test_rbac.py` — Existing RBAC test style.
- `backend/apps/menu/tests/test_visibility.py` — Existing visibility test style.
- `backend/apps/menu/tests/test_plat_soft_delete.py` — Existing plat soft-delete expectations already present in the repo.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/apps/menu/models.py` already contains `Plat`, `PlatQuerySet`, and `PlatManager`, including `est_active`, `est_disponible`, image support, timestamps, and a soft-delete override.
- `backend/apps/menu/views.py` provides the exact RBAC split to mirror: `IsAuthenticated` for reads and `IsAuthenticated + IsGerant` for writes.
- `backend/apps/menu/serializers.py` provides the current `ImageField` configuration pattern for optional media fields.
- `apps.users.permissions.IsGerant` is already the project-standard manager write gate.

### Established Patterns
- Category endpoints use `ModelViewSet`, route registration through `DefaultRouter`, and queryset-based visibility enforcement.
- Soft delete means persisting the row and flipping an activity flag, not issuing a database delete.
- Non-manager hidden resources should disappear at the queryset layer so both list and detail endpoints naturally enforce visibility.

### Integration Points
- `backend/apps/menu/serializers.py` needs a `PlatSerializer`.
- `backend/apps/menu/views.py` needs a `PlatViewSet` that extends the category endpoint pattern with the stricter dish visibility rule.
- `backend/apps/menu/urls.py` needs `/api/plats/` registration.
- `backend/apps/menu/tests/` should cover CRUD, RBAC, visibility, and category-inactive filtering for plats.

</code_context>

<deferred>
## Deferred Ideas

- `badge_chef` field — future menu-management phase.
- Ingredient and recipe linking (`plat ↔ ingredients`) — later stock/inventory phases.
- Real-time availability WebSocket pushes — later real-time integration phase.
- Advanced validation such as unique dish names per category or richer catalog business rules — future refinement phase.

</deferred>

---

*Phase: 06-plats-model-api*
*Context gathered: 2026-04-28*
