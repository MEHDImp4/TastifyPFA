# Phase 18: Ingredients & Stock Model - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the core database models and APIs for Ingredients and Stock tracking. It handles mapping raw ingredients to menu dishes (Plats), storing inventory levels in standardized units, and tracking when items fall below defined minimum stock thresholds. It enables real-time alerts to the GERANT role when thresholds are breached. Automated deductions based on orders are out of scope (handled in Phase 20).
</domain>

<decisions>
## Implementation Decisions

### Recipe Mapping Strategy
- **D-01:** Implement a direct Many-To-Many relationship (`PlatIngredient` through-table) linking a `Plat` to an `Ingredient` with a required quantity.
- **D-02:** Avoid a complex `FicheTechnique` model to keep database queries simple and maintain high performance.

### Unit of Measurement
- **D-03:** Store all quantities in the database using strict base units (e.g., grams, milliliters, pieces).
- **D-04:** Handle all unit conversions (e.g., grams to kilograms, ml to Liters) strictly on the frontend UI. The backend remains the source of truth for base units.

### Alert Mechanisms
- **D-05:** Surface low-stock alerts in real-time.
- **D-06:** Utilize the existing `broadcast_staff_event` WebSocket infrastructure to push notifications directly to the `GERANT` immediately when an ingredient's stock drops below its minimum threshold.

### Claude's Discretion
None — User provided explicit direction on all key architectural options.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture
- `.planning/PROJECT.md` — Project tech stack and overarching architecture rules.
- `.planning/STATE.md` — Current execution state and port routing configurations.

### Real-Time Infrastructure
- `.planning/phases/13-websocket-infrastructure/13-CONTEXT.md` — Guidelines on the `staff_group` WebSocket configuration.
- `.planning/phases/16-order-push-to-kds/16-CONTEXT.md` — Details on `broadcast_staff_event` usage and conventions.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `broadcast_staff_event` in `backend/core/realtime.py` (or equivalent): To be used for pushing real-time low-stock alerts to the staff channels.
- `SoftDeleteModel` / `est_active` pattern: Must be applied to the `Ingredient` model to ensure historical data integrity and match existing conventions.

### Established Patterns
- **RBAC**: Endpoints must enforce `IsGerant` for write access, mirroring how Categories and Plats were implemented.
- **Signals**: Django signals (`post_save`) should be considered to detect when stock levels fall below thresholds, triggering the WebSocket broadcast.

### Integration Points
- The `Plat` model (from Phase 6) needs an M2M relationship `ingredients` going through the new `PlatIngredient` model.
- The `backend/apps/menu/` or a new `backend/apps/stock/` app will house the models. Given the domain, a dedicated `stock` app is recommended for decoupling.

</code_context>

<specifics>
## Specific Ideas

- Focus on strict base units in the database (g, ml, pieces) with zero backend logic converting units. Keep backend math straightforward.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 18-Ingredients & Stock Model*
*Context gathered: 2026-05-05*
