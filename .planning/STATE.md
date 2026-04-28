# Planning State

**Last Updated:** 2026-04-28
**Stopped At:** Completed 06-02-PLAN.md
**Resume File:** `.planning/phases/06-plats-model-api/06-03-PLAN.md`

## Notes

- Phase 6 discussion updated the existing placeholder context into the standard GSD context format.
- Locked decisions cover dish visibility, field scope, category-driven hiding, and basic validation boundaries.

## Decisions

- Used string 'Categorie' for the ForeignKey to avoid circular dependencies.
- Implemented soft-delete by overriding delete() and setting est_active=False.
- Added est_disponible for runtime toggle, separate from est_active soft-delete flag.
- Used `use_url=True` on `PlatSerializer.image` for absolute URLs.
- Implemented dual-flag filtering logic for non-GERANTs: `Plat.objects.active().filter(est_disponible=True)`.
- Ensured `destroy()` performs a soft-delete (setting `est_active=False`) mimicking the `Categorie` implementation.
- Allowed optional `categorie` filtering logic in `get_queryset` for all authenticated users.
