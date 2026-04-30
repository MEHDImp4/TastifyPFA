---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: phase_complete
stopped_at: Phase 12 completed
last_updated: "2026-04-30T18:19:00.000+01:00"
progress:
  total_phases: 35
  completed_phases: 12
  total_plans: 33
  completed_plans: 33
  percent: 34
---

# Planning State

**Last Updated:** 2026-04-30
**Stopped At:** Phase 12 completed
**Resume File: .planning/phases/01-project-skeleton/01-DIRECT-PORTS-AMENDMENT.md**

## Notes

- Phase 11 Complete.
- Phase 12 Complete.
- Salle order-taking flow delivered: table route, per-table cart store, category menu browser, review drawer, and `POST /api/commandes/` submission.
- Infrastructure amendment complete: Nginx removed from `docker-compose.yml`; backend and SPAs are exposed directly on ports 8000, 3000, 3001, 3002, and 3003.
- Direct-port login redirect regression fixed: GERANT login from Salle now redirects to Back-Office on port 3000 through shared role redirect logic.
- Ready to discuss or plan Phase 13 (WebSocket Infrastructure).

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
- TableSerializer: Added explicit `default=True` to `est_active` to ensure DRF correctly handles its creation default when missing from request data.
- Commande uses soft-delete by setting `est_active=False`.
- CommandeLigne snapshots `Plat.prix` into `prix_unitaire` on save when no explicit price is provided.
- Commande totals are recalculated from non-cancelled lines via Django signals.
- Salle ordering carts are isolated per `tableId` with a Zustand record registry.
- Salle order submission uses the Phase 11 `CommandeSerializer` contract: `table` plus nested `lignes`.
- Local development routing no longer uses Nginx path prefixes; Vite apps run at root on their own ports and proxy `/api` plus `/media` to `http://backend:8000`.
- Cross-frontend role redirects are centralized in `frontend/_shared/auth/roleRedirect.ts` and map GERANT/SERVEUR/CUISINIER to ports 3000/3001/3002.
