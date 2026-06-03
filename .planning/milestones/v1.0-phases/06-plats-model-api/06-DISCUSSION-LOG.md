# Phase 6: Plats Model & API - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 06-plats-model-api
**Areas discussed:** Visibility rules, Dish field contract, Category inactivation behavior, Validation rules

---

## Visibility Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Only expose plats where `est_active`, `est_disponible`, and `categorie.est_active` are all true for non-`GERANT` users | Strict public/read-only menu filter | ✓ |
| Expose active plats even if category is inactive | Weakens category-level hide behavior | |
| Expose unavailable plats and hide only soft-deleted ones | Makes unavailable dishes visible to non-managers | |

**User's choice:** Strict filter requiring active dish, available dish, and active category.

---

## Dish Field Contract

| Option | Description | Selected |
|--------|-------------|----------|
| `categorie`, `nom`, `description`, `prix`, `temps_preparation`, `image`, `est_disponible`, `est_active` | Matches the current model and roadmap scope | ✓ |
| Add `badge_chef` now | Pulls Phase 6 toward a broader product scope | |
| Exclude `image` until the frontend phase | Diverges from current model and planned back-office workflow | |

**User's choice:** Keep the current model field set only, with no extra product fields added in Phase 6.

---

## Category Inactivation Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hide dishes automatically via queryset filtering only | Reversible, no side-effect writes | ✓ |
| Auto-set related dishes `est_disponible=False` | Mutates dish rows on category toggle | |
| Auto-set related dishes `est_active=False` | Turns category toggle into dish soft-delete side effect | |

**User's choice:** Hide dishes through filtering only; do not mutate related plats when a category is inactivated.

---

## Validation Rules

| Option | Description | Selected |
|--------|-------------|----------|
| Require `nom` and `categorie`; enforce `prix > 0` and `temps_preparation > 0`; keep the rest basic | Focused Phase 6 CRUD validation | ✓ |
| Allow `temps_preparation = 0` | Supports instant-prep dishes but loosens current assumption | |
| Add stricter business rules now | Expands phase complexity | |

**User's choice:** Basic serializer validation only: required `nom` and `categorie`, strictly positive `prix` and `temps_preparation`.

---

## the agent's Discretion

- Exact DRF validation method structure.
- Queryset helper naming and placement.
- Test fixture details and naming.

## Deferred Ideas

- `badge_chef`
- Recipe and ingredient linking
- Real-time availability push behavior
- Advanced business validation rules
