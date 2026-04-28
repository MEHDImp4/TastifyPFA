# Planning State

**Last Updated:** 2026-04-28
**Stopped At:** Phase 7 completed
**Resume File:** .planning/phases/08-tables-model-api/08-CONTEXT.md

## Notes

- Phase 6 discussion updated the existing placeholder context into the standard GSD context format.
- Locked decisions cover dish visibility, field scope, category-driven hiding, and basic validation boundaries.
- Phase 7 context is now captured for the plats back-office UI, locking the responsive list, category filter, inline status, and drawer form behavior.
- Phase 7 research and executable plans are now in place, split into foundation, responsive list surfaces, and drawer workflow.

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
