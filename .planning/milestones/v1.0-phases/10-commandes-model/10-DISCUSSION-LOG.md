# Phase 10: Commandes Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-29
**Phase:** 10-commandes-model
**Mode:** discuss
**Areas discussed:** Ligne statuses scope, Code promo FK, Commande delete strategy, Seeding

---

## Ligne statuses scope

| Option | Description | Selected |
|--------|-------------|----------|
| Include now | Add CommandeLigne.statut TextChoices now; signal correctly excludes 'annule' lines; no migration needed at Phase 14 (KDS) | ✓ |
| Defer to Phase 14 | Skip statut on CommandeLigne for now; signal sums all lines; add statut in Phase 14 with a migration | |

**User's choice:** Include now (Recommended)
**Notes:** Including now avoids a future migration when KDS phases arrive and makes the signal logic correct from day one.

---

## Code promo FK

| Option | Description | Selected |
|--------|-------------|----------|
| Defer entirely | No CodePromo model exists; skip the FK; add in a future loyalty/promo phase | ✓ |
| Include null FK placeholder | Add code_promo = ForeignKey(null=True, on_delete=SET_NULL) as a forward reference; avoids a future Commande migration | |

**User's choice:** Defer entirely (Recommended)
**Notes:** Phase 10 roadmap doesn't scope promo codes. Kept minimal.

---

## Commande delete strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Soft-delete only | Commande.delete() sets est_active=False; consistent with all prior models (Categorie, Plat, Table) | ✓ |
| Annulation only, no delete | No delete() override; 'annulee' is the only exit; orders are append-only financial records | |

**User's choice:** Soft-delete only (Recommended)
**Notes:** Consistency with entire codebase is prioritized. 'annulee' status handles business-level cancellation.

---

## Seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Skip seeding | Orders created via REST API (Phase 11); signal behavior covered by unit tests | ✓ |
| Include seed command | Add management command with 3-5 sample Commandes+CommandeLignes; consistent with Phase 6/8 patterns | |

**User's choice:** Skip seeding (Recommended)
**Notes:** Phase 10 is model-only; seeding is more relevant once the API exists.

---

## Claude's Discretion

- Custom QuerySet/Manager implementation style
- Whether CommandeQuerySet.active() filters only on est_active or also excludes ANNULEE
- Exact test fixture naming
- __str__ representation on CommandeLigne

## Deferred Ideas

- code_promo FK — future loyalty/promo phase
- Seed command — deferred to Phase 11 or later
