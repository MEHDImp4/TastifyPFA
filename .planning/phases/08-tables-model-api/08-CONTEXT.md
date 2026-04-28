---
phase: 08-tables-model-api
type: context
status: locked
---

# Phase 8: Tables Model & API — Context

## Goal

Implement the `Table` model and its REST API inside a new `apps/tables/` Django app.
GERANT can fully manage tables (create, update, soft-delete). All authenticated users can list/retrieve.
Status update (SERVEUR flipping `statut`) is deferred to Phase 12.

## Depends on

- Phase 3 (JWT + permissions infrastructure)
- `apps/users/permissions.py` — `IsGerant` class (confirmed present)

## Success Criteria

1. `GET /api/tables/` returns 200 for any authenticated user.
2. `POST /api/tables/` returns 403 for non-GERANT roles.
3. `DELETE /api/tables/{id}/` soft-deletes (sets `est_active=False`, row persists).
4. `GET /api/tables/` returns only `est_active=True` tables for non-GERANT.
5. `GET /api/tables/` returns all tables (including soft-deleted) for GERANT.
6. Integration tests and seed command are green.

---

## Locked Decisions

### D-08-01: Include `pos_x` / `pos_y` in Phase 8
**Decision**: ADD `pos_x` and `pos_y` (`FloatField(default=0.0)`) to the `Table` model in Phase 8.
**Rationale**: Phase 9 needs these fields for SVG map rendering. Adding them now avoids a backend migration during a frontend phase and keeps Phase 9 fully frontend-only.
**Non-negotiable**: Do not defer these fields.

### D-08-02: SERVEUR status update deferred to Phase 12
**Decision**: Use Option C — full update requires `IsGerant`. No `changer_statut` action in Phase 8.
**Rationale**: Phase 8 success criterion is "Tables state is queryable." SERVEUR status-flip is tied to the order workflow (Phase 12). Adding it now would be scope creep.
**Non-negotiable**: Do not add a `changer_statut` endpoint in Phase 8.

### D-08-03: App name is `apps/tables/`
**Decision**: New bounded context lives at `backend/apps/tables/`.
**Rationale**: Tables are physical floor domain, not menu domain. Strict decoupling rule from PROJECT.md.
**Non-negotiable**: Do not add to `apps/menu/` or rename to `apps/salle/`.

### D-08-04: Seed 12 tables, numbers 1–12
**Decision**: Seed command creates 12 tables (numbers 1–12), capacities mixed (2, 4, 6), all `LIBRE`, all `est_active=True`.
**Rationale**: Enough data for Phase 9 map rendering. Idempotent via `get_or_create(numero=...)`.

### D-08-05: Visibility mirrors Categorie pattern
**Decision**: Non-GERANT roles see only `est_active=True` tables. GERANT sees all.
**Rationale**: Consistent with Categorie and Plat visibility patterns already established.

### D-08-06: Status enum — 4 values
**Decision**: `LIBRE`, `OCCUPEE`, `RESERVEE`, `ENCAISSEMENT` — inner class `Table.Statut(TextChoices)`.
**Default**: `LIBRE` (a new table starts unoccupied).
**Non-negotiable**: All 4 values must be present; `RESERVEE` is reserved for Phase 23.

---

## Plans

- [ ] 08-01-PLAN.md — App scaffold, Table model, migration, soft-delete tests (Wave 1)
- [ ] 08-02-PLAN.md — TableSerializer, TableViewSet (RBAC + visibility), URL registration (Wave 2)
- [ ] 08-03-PLAN.md — Seed command + integration tests (Wave 2, depends on 08-02)
