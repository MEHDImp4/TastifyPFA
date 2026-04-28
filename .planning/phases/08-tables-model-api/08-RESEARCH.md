# Phase 8: Tables Model & API — Research

**Gathered:** 2026-04-28  
**Updated:** 2026-04-28 (post-context-lock refresh)  
**Confidence key:** HIGH = verified in codebase / docs · MEDIUM = inferred from patterns · LOW = assumed

> **Status**: All open questions from original research are now LOCKED in `08-CONTEXT.md` (D-08-01 through D-08-06). Section 14 is updated to reflect resolved decisions.

---

## 1. Phase Boundary

Implement the `Table` model and its REST API inside the `apps/tables/` Django app.  
This phase covers:
- The `Table` DB model with status enum, capacity, soft-delete, and position fields
- `TableSerializer` with correct field exposure
- `TableViewSet` with RBAC: GERANT owns config; read-only for all authenticated users
- URL registration under `/api/tables/`
- Dev seed command (12 tables) and integration tests

Out of scope: Phase 9 SVG map rendering, Phase 10 `Commande.table_id` FK, SERVEUR status-flip (Phase 12), real-time WebSocket pushes (Phase 13+).

---

## 2. Current Scaffold State

> These files already exist — do NOT recreate them. [VERIFIED: filesystem]

```
backend/apps/tables/
    __init__.py              ← exists (empty)
    apps.py                  ← exists (TablesConfig)
    migrations/__init__.py   ← exists (empty)
    tests/__init__.py        ← exists (empty)
    management/__init__.py   ← exists (empty)
    management/commands/__init__.py ← exists (empty)
```

`'apps.tables'` is **already registered** in `INSTALLED_APPS` at `backend/tastify_backend/settings/base.py:27`. [VERIFIED: settings/base.py]

**Files that still need to be created:**
- `backend/apps/tables/models.py`
- `backend/apps/tables/admin.py`
- `backend/apps/tables/serializers.py`
- `backend/apps/tables/views.py`
- `backend/apps/tables/urls.py`
- `backend/apps/tables/migrations/0001_initial.py`
- `backend/apps/tables/tests/test_model.py`
- `backend/apps/tables/tests/test_rbac.py`
- `backend/apps/tables/tests/test_api.py`
- `backend/apps/tables/management/commands/seed_tables.py`

---

## 3. Table Model Fields

| Field | Type | Notes | Source |
|---|---|---|---|
| `numero` | `PositiveIntegerField(unique=True)` | Human-readable table number | [VERIFIED: 08-CONTEXT.md D-08-04] |
| `capacite` | `PositiveIntegerField` | Seat count | [VERIFIED: 08-CONTEXT.md] |
| `statut` | `CharField(choices=Statut, default=LIBRE)` | 4-value enum (see section 4) | [VERIFIED: 08-CONTEXT.md D-08-06] |
| `pos_x` | `FloatField(default=0.0)` | X coordinate for Phase 9 SVG map | [VERIFIED: 08-CONTEXT.md D-08-01] |
| `pos_y` | `FloatField(default=0.0)` | Y coordinate for Phase 9 SVG map | [VERIFIED: 08-CONTEXT.md D-08-01] |
| `est_active` | `BooleanField(default=True)` | Soft-delete flag | [VERIFIED: backend/apps/menu/models.py] |
| `created_at` | `DateTimeField(auto_now_add=True)` | Global schema rule | [VERIFIED: backend/apps/menu/models.py] |
| `updated_at` | `DateTimeField(auto_now=True)` | Global schema rule | [VERIFIED: backend/apps/menu/models.py] |

---

## 4. Status Enum

**LOCKED: D-08-06** — 4 values, `Table.Statut(TextChoices)` inner class, default `LIBRE`.

```python
class Statut(models.TextChoices):
    LIBRE        = 'LIBRE',        'Libre'
    OCCUPEE      = 'OCCUPEE',      'Occupée'
    RESERVEE     = 'RESERVEE',     'Réservée'
    ENCAISSEMENT = 'ENCAISSEMENT', 'Encaissement'
```

`max_length=20` covers `ENCAISSEMENT` (12 chars) with headroom. [ASSUMED]  
`RESERVEE` reserved for Phase 23 (Reservations). All 4 must be present now. [VERIFIED: 08-CONTEXT.md D-08-06]

---

## 5. App Location

**LOCKED: D-08-03** — `backend/apps/tables/` only. Do not place in `apps/menu/` or `apps/salle/`. [VERIFIED: 08-CONTEXT.md]

---

## 6. RBAC Design

**LOCKED: D-08-02** — Option C: full `update`/`destroy` = `IsGerant` only. No `changer_statut` action in Phase 8.

| Action | Permission |
|---|---|
| `list`, `retrieve` | `IsAuthenticated` |
| `create`, `update`, `partial_update`, `destroy` | `IsAuthenticated` + `IsGerant` |

SERVEUR status-flip is deferred to Phase 12 (order workflow).

Existing permission classes: [VERIFIED: backend/apps/users/permissions.py]
- `IsGerant` — `user.role == User.Role.GERANT`
- `IsServeurOrGerant` — role in SERVEUR, GERANT (available for Phase 12)

---

## 7. Serializer Design

Follows `PlatSerializer` pattern exactly. [VERIFIED: backend/apps/menu/serializers.py]

```python
class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'numero', 'capacite', 'statut', 'pos_x', 'pos_y',
                  'est_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
```

No image field. `statut` validated by DRF `choices` parameter. [ASSUMED]

---

## 8. Soft-Delete Pattern

**Identical to `Categorie` and `Plat`.** [VERIFIED: backend/apps/menu/models.py:36-39]

```python
class TableQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)

class TableManager(models.Manager):
    def get_queryset(self):
        return TableQuerySet(self.model, using=self._db)
    def active(self):
        return self.get_queryset().active()

class Table(models.Model):
    # ...
    objects = TableManager()

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])
        # CRITICAL: must NOT call super().delete()
```

---

## 9. Visibility Rules

**LOCKED: D-08-05** — mirrors Categorie/Plat pattern.

| Role | Queryset |
|---|---|
| GERANT | `Table.objects.all()` (includes soft-deleted) |
| All others | `Table.objects.active()` (`est_active=True` only) |

ViewSet `get_queryset` pattern: [VERIFIED: backend/apps/menu/views.py:42-50]
```python
def get_queryset(self):
    user = self.request.user
    if user.is_authenticated and user.role == 'GERANT':
        return Table.objects.all().order_by('numero')
    return Table.objects.active().order_by('numero')
```

---

## 10. URL Layout

| Method | URL | Action |
|---|---|---|
| GET | `/api/tables/` | list |
| POST | `/api/tables/` | create |
| GET | `/api/tables/{id}/` | retrieve |
| PUT/PATCH | `/api/tables/{id}/` | update |
| DELETE | `/api/tables/{id}/` | destroy (soft) |

Root URL config: add `path('api/', include('apps.tables.urls'))` after the menu include. [VERIFIED: backend/tastify_backend/urls.py pattern]

---

## 11. Migration Notes

- New app → first migration named `0001_initial.py`. [VERIFIED: backend/apps/menu/migrations/0001_initial.py pattern]
- `apps.tables` is already in `INSTALLED_APPS` — `makemigrations tables` will work once `models.py` exists.
- MySQL `STRICT_TRANS_TABLES` active — all NOT NULL fields need defaults. All Table fields have defaults. [VERIFIED: backend/tastify_backend/settings/base.py]
- `numero` unique constraint → DB-level unique index generated automatically. [ASSUMED]
- `statut` choices validated at application layer only; no DB-level CHECK constraint. [ASSUMED]

---

## 12. Seeding

**LOCKED: D-08-04** — 12 tables, numbers 1–12, mixed capacities (2/4/6), all LIBRE, idempotent.

Pattern from `seed_menu.py`: [VERIFIED: backend/apps/menu/management/commands/seed_menu.py]
```python
Table.objects.get_or_create(
    numero=n,
    defaults={'capacite': cap, 'statut': Table.Statut.LIBRE, 'est_active': True}
)
```

Capacity split: tables 1–4 → 2, tables 5–8 → 4, tables 9–12 → 6.

---

## 13. Test Strategy

Follow `apps/menu/tests/` pattern. [VERIFIED: backend/apps/menu/tests/]

| File | Covers | Count |
|---|---|---|
| `test_model.py` | Soft-delete: est_active=False, row persists, active() manager | 3 tests |
| `test_rbac.py` | GERANT write/delete, SERVEUR read-only, unauthenticated 401, visibility | 8 tests |
| `test_api.py` | Full CRUD lifecycle, response shape, uniqueness constraint, pos_x/pos_y | 10 tests |

**Total: 21 tests.** Use `force_authenticate` (established convention). [VERIFIED: backend/apps/menu/tests/test_api.py]

---

## 14. Locked Decisions (All Open Questions Resolved)

| Decision | Value | Source |
|---|---|---|
| D-08-01: pos_x/pos_y | Include in Phase 8 (`FloatField(default=0.0)`) | 08-CONTEXT.md |
| D-08-02: SERVEUR status-flip | Defer to Phase 12 | 08-CONTEXT.md |
| D-08-03: App name | `apps/tables/` | 08-CONTEXT.md |
| D-08-04: Seed count | 12 tables (1–12), mixed caps (2/4/6) | 08-CONTEXT.md |
| D-08-05: Visibility | Non-GERANT sees only est_active=True | 08-CONTEXT.md |
| D-08-06: Statut enum | 4 values: LIBRE, OCCUPEE, RESERVEE, ENCAISSEMENT | 08-CONTEXT.md |

---

## 15. Downstream Impact

| Phase | Impact |
|---|---|
| Phase 9 | Needs `pos_x`/`pos_y` (included) and `statut` readable — both present |
| Phase 10 | `Commande.table_id = FK(Table, on_delete=PROTECT)` — soft-delete is safe |
| Phase 12 | SERVEUR status-flip added here (deferred from Phase 8) |
| Phase 13+ | WebSocket pushes for table status use same `statut` enum — stable contract |
| Phase 23 | Reservations use `RESERVEE` statut — enum value reserved now |

---

## 16. Confidence Summary

| Topic | Confidence | Basis |
|---|---|---|
| Scaffold already partially exists | HIGH | Verified filesystem |
| `apps.tables` already in INSTALLED_APPS | HIGH | Verified settings/base.py:27 |
| App location (`apps/tables/`) | HIGH | Verified + D-08-03 locked |
| Status enum values (4 states) | HIGH | D-08-06 locked |
| Soft-delete pattern | HIGH | menu/models.py verified |
| RBAC permission classes | HIGH | users/permissions.py verified |
| Migration convention | HIGH | existing migrations verified |
| `pos_x`/`pos_y` inclusion | HIGH | D-08-01 locked |
| SERVEUR status action deferred | HIGH | D-08-02 locked |
| Seed: 12 tables, 1–12 | HIGH | D-08-04 locked |
| Visibility mirrors Categorie | HIGH | D-08-05 locked |
| `statut` max_length=20 | ASSUMED | Covers longest value (12 chars) + headroom |
