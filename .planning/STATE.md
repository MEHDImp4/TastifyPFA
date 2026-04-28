# Planning State

**Last Updated:** 2026-04-28
**Stopped At:** Phase 8 Plan 02 complete
**Resume File:** .planning/phases/08-tables-model-api/08-03-PLAN.md

## Notes

- Phase 6 discussion updated the existing placeholder context into the standard GSD context format.
- Locked decisions cover dish visibility, field scope, category-driven hiding, and basic validation boundaries.
- Phase 7 context is now captured for the plats back-office UI, locking the responsive list, category filter, inline status, and drawer form behavior.
- Phase 7 research and executable plans are now in place, split into foundation, responsive list surfaces, and drawer workflow.
- Phase 8 context locked with 6 decisions: pos_x/pos_y included, SERVEUR status-flip deferred to Phase 12, app name apps/tables/, 12 seed tables, visibility mirrors Categorie pattern, 4-value Statut enum.
- Phase 8 plans split into 3: app scaffold+model (08-01), serializer+viewset+URL (08-02), seed+integration tests (08-03).
- Phase 8 Plan 01 complete: Table model with 8 fields, Statut enum (4 values), soft-delete, pos_x/pos_y, 0001_initial migration applied, 3 tests green.
- Phase 8 Plan 02 complete: TableSerializer, TableViewSet (split RBAC + visibility), URL wiring at /api/tables/, 8 RBAC tests green.

## Decisions

- Used string 'Categorie' for the ForeignKey to avoid circular dependencies.
- Implemented soft-delete by overriding delete() and setting est_active=False.
- Added est_disponible for runtime toggle, separate from est_active soft-delete flag.
- Used `use_url=True` on `PlatSerializer.image` for absolute URLs.
- Implemented dual-flag filtering logic for non-GERANTs: `Plat.objects.active().filter(est_disponible=True)`.
- Ensured `destroy()` performs a soft-delete (setting `est_active=False`) mimicking the `Categorie` implementation.
- Allowed optional `categorie` filtering logic in `get_queryset` for all authenticated users.
- Implemented idempotent seeding using get_or_create scoped to (categorie, nom).
- Used force_authenticate in tests to avoid JWT overhead.
- Table.delete() mirrors Categorie/Plat: sets est_active=False + save(), no super().delete().
- Table.Statut TextChoices: LIBRE, OCCUPEE, RESERVEE, ENCAISSEMENT (max_length=20).
- pos_x/pos_y as FloatField(default=0.0) included per D-08-01 for Phase 9 map dependency.
