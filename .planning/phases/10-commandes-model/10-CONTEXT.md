# Phase 10: Commandes Model - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the `Commande` and `CommandeLigne` database models in a new `apps/commandes/` bounded context. Implement FK constraints, Django signal to auto-calculate `montant_total`, and backend tests covering signal behavior and model constraints. No REST endpoints, no UI, no seed command.

</domain>

<decisions>
## Implementation Decisions

### App placement
- **D-01:** New bounded context at `backend/apps/commandes/`. Not added to `menu` or `tables`. Follows the strict decoupling rule from PROJECT.md.

### Commande model
- **D-02:** Fields: `table` (FK → Table, PROTECT), `serveur` (FK → User, SET_NULL, null=True), `statut` (TextChoices), `montant_total` (DecimalField, default=0), `est_active` (BooleanField, default=True), `created_at`, `updated_at`.
- **D-03:** `Commande.statut` TextChoices: `EN_COURS`, `EN_CUISINE`, `PRETE`, `PAYEE`, `ANNULEE`. Default: `EN_COURS`.
- **D-04:** `Commande.delete()` uses soft-delete (sets `est_active=False`) — consistent with Categorie, Plat, Table pattern.
- **D-05:** No `code_promo` FK in Phase 10. Deferred to a future loyalty/promo phase.

### CommandeLigne model
- **D-06:** Fields: `commande` (FK → Commande, CASCADE), `plat` (FK → Plat, PROTECT), `quantite` (PositiveIntegerField), `prix_unitaire` (DecimalField — snapshotted from `plat.prix` at creation), `statut` (TextChoices), `notes` (TextField, blank=True).
- **D-07:** `CommandeLigne.statut` TextChoices: `EN_ATTENTE`, `EN_PREPARATION`, `PRET`, `SERVI`, `ANNULE`. Default: `EN_ATTENTE`. Included now to avoid a KDS migration in Phase 14.
- **D-08:** `prix_unitaire` is copied from `plat.prix` at line creation time. Historical accuracy: `montant_total` is not affected by future menu price changes.

### Signal behavior
- **D-09:** `post_save` and `post_delete` signal on `CommandeLigne` recalculates `commande.montant_total` as `SUM(quantite * prix_unitaire)` for all lines where `statut != ANNULE`. Uses `update_fields=['montant_total', 'updated_at']` to avoid recursive signal triggers.

### Seeding
- **D-10:** No seed command for Phase 10. Orders are created through the REST API (Phase 11). Signal behavior is covered by unit tests.

### Claude's Discretion
- Custom QuerySet/Manager implementation style (mirrors Categorie/Plat/Table pattern).
- Whether `CommandeQuerySet.active()` filters on `est_active=True` only, or also on `statut != ANNULEE`.
- Exact test fixture naming and structure.
- Whether to add `__str__` on CommandeLigne as `f"{self.plat.nom} x{self.quantite}"` or simpler.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and constraints
- `docs/brain/03_Architecture/DATABASE_SCHEMA.md` — Defines `commande` and `ligne_commande` column specs, FK `on_delete` policies, required indexes, and the signal implementation pattern (including `statut != annule` exclusion logic).

### Phase scope and prior decisions
- `.planning/ROADMAP.md` — Phase 10 goal, success criteria, and phase dependencies (Phase 6 + Phase 8).
- `.planning/PROJECT.md` — Global stack, RBAC baseline, JSON-only API rule, strict bounded-context decoupling.
- `.planning/phases/06-plats-model-api/06-CONTEXT.md` — `Plat` field contract, soft-delete pattern, QuerySet/Manager conventions.
- `.planning/phases/08-tables-model-api/08-CONTEXT.md` — `Table` model contract, Statut TextChoices pattern, PROTECT FK precedent.

### Current codebase contracts
- `backend/apps/menu/models.py` — Source pattern for QuerySet/Manager + soft-delete + timestamps.
- `backend/apps/tables/models.py` — Source pattern for TextChoices enum + PROTECT-compatible soft-delete.
- `backend/apps/users/permissions.py` — `IsGerant` permission class (referenced for future API phases).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CategorieQuerySet` / `CategorieManager` pattern in `menu/models.py` — exact pattern to replicate for `CommandeQuerySet` / `CommandeManager`.
- `Table.Statut(TextChoices)` inner class — exact pattern to replicate for `Commande.Statut` and `CommandeLigne.Statut`.
- `Table.delete()` override — exact pattern to replicate for `Commande.delete()`.

### Established Patterns
- All models: `est_active + soft-delete override + QuerySet.active() filter`.
- All FKs that reference the same app use string references (e.g., `'Categorie'`) to avoid circular imports.
- Cross-app FKs use direct model imports (e.g., `from apps.menu.models import Plat`).
- Signal placement: project uses `apps.py` `ready()` + `signals.py` module for decoupled signal wiring.

### Integration Points
- `Commande.table` → `apps.tables.models.Table` (cross-app FK)
- `Commande.serveur` → `settings.AUTH_USER_MODEL` (use `settings.AUTH_USER_MODEL` string, not direct import)
- `CommandeLigne.plat` → `apps.menu.models.Plat` (cross-app FK)
- `backend/config/settings.py` — must register `apps.commandes` in `INSTALLED_APPS`

</code_context>

<specifics>
## Specific Ideas

- The signal in `DATABASE_SCHEMA.md` shows `filter(statut__ne='annule')` — in Django ORM this is `exclude(statut=CommandeLigne.Statut.ANNULE)` on the queryset.
- Per D-09, use `update_fields` on the Commande save inside the signal to prevent the Commande `post_save` from triggering cascading behavior.

</specifics>

<deferred>
## Deferred Ideas

- `code_promo` FK on Commande — future loyalty/promo phase (Phase 33 or dedicated promo phase).
- Seed command for orders — deferred; orders created via Phase 11 REST API.
- SERVEUR status-flip endpoint on Commande — Phase 11 or Phase 12 scope.
- Physical deletion protection (PROTECT policy at DB level) — current soft-delete is sufficient; can revisit for compliance if needed.

</deferred>

---

*Phase: 10-commandes-model*
*Context gathered: 2026-04-29*
