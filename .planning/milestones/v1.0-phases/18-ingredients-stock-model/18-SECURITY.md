---
phase: 18
slug: 18-ingredients-stock-model
status: verified
threats_open: 0
asvs_level: 1
created: 2026-05-05
---

# Phase 18 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| client→IngredientViewSet | Unauthenticated or under-privileged clients must not create/modify/delete ingredients | Ingredient CRUD (nom, stock_actuel, seuil_alerte, unite_mesure) |
| client→PlatIngredientViewSet | Unauthenticated or under-privileged clients must not modify recipe-ingredient links | PlatIngredient CRUD (plat FK, ingredient FK, quantite_requise) |
| signal→WebSocket broadcast | Low-stock alert must only fire on genuine threshold crossings, not on default-value creation noise | stock.alert event payload (ingredient_id, nom, stock_actuel, seuil_alerte, unite_mesure) |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-18-04-01 | Elevation of Privilege | PlatIngredientViewSet | mitigate | `get_permissions()` returns `[IsAuthenticated, IsGerant]` for all write actions (create/update/partial_update/destroy). Read actions (list/retrieve) require `IsAuthenticated` only — mirrors IngredientViewSet pattern. Verified in `views.py:40-43`. | closed |
| T-18-04-02 | Tampering | PlatIngredient unique_together | mitigate | `Meta.unique_together = ('plat', 'ingredient')` enforced at DB level; DRF serializer surfaces `IntegrityError` as HTTP 400 ValidationError. Verified in `models.py:51`. | closed |
| T-18-S01 | Elevation of Privilege | IngredientViewSet write endpoints | mitigate | `get_permissions()` returns `[IsAuthenticated, IsGerant]` for create/update/partial_update/destroy. `IsGerant` checks `user.role == User.Role.GERANT` (enum, not string literal). Verified in `views.py:16-20`, `permissions.py:8-12`. | closed |
| T-18-S02 | Spoofing / Info Disclosure | Ingredient active-filter bypass | mitigate | `get_queryset()` filters `est_active=True` for non-GERANT roles. GERANT access gated by `User.Role.GERANT` enum (not raw string). Verified in `views.py:22-27`. | closed |
| T-18-S03 | Tampering | Signal false-positive alert on default-valued creation | mitigate | `alert_low_stock` post_save handler guards with `if instance.seuil_alerte <= 0: return` — suppresses spurious alerts when no threshold is configured. Verified in `signals.py:22-23`. | closed |
| T-18-S04 | Tampering | Bulk QuerySet delete bypasses soft-delete | mitigate | `IngredientAdmin.actions = None` disables Django admin bulk-delete action. Verified in `admin.py:7`. | closed |
| T-18-S05 | Tampering | `est_active` writable via PATCH endpoint | mitigate | `est_active` added to `read_only_fields` in `IngredientSerializer`. Lifecycle managed exclusively through `DELETE` endpoint. Verified in `serializers.py:18`. | closed |
| T-18-S06 | Tampering | Negative stock/quantity values via API | mitigate | `MinValueValidator(0)` on `stock_actuel`, `seuil_alerte`; `MinValueValidator(Decimal('0.01'))` on `quantite_requise`. Validated at serializer layer before DB write. Verified in `models.py:16-17,48`. | closed |

---

## Accepted Risks Log

No accepted risks.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-05-05 | 8 | 8 | 0 | gsd-secure-phase (orchestrator) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-05-05
