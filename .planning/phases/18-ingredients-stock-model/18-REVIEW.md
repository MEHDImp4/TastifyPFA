---
phase: "18"
plan: "review"
status: issues_found
files_reviewed: 15
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
---

# Phase 18: Code Review Report

**Reviewed:** 2026-05-05T10:00:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

This phase delivers the Ingredient/Stock model, a PlatIngredient M2M through-table, a DRF REST API with RBAC guards, Django signals for WebSocket threshold alerts, admin registrations, and migrations. The core architecture is sound — soft-delete, signal-based alerting, and GERANT-only write permissions are correctly wired. Two critical defects were found: a signal edge-case that fires false low-stock alerts on every newly created ingredient with default values, and an incorrect mock-patch path in the signal test suite that causes the entire signal test class to test against a live `broadcast_staff_event` instead of the mock — meaning all "mock was called" assertions are vacuously wrong. Six warnings cover writable `est_active`, a queryset bypass on bulk delete, missing non-negative constraints, a role string literal, and an over-restrictive permission on `PlatIngredientViewSet`.

---

## Critical Issues

### CR-001: Signal fires spurious alert on every default-valued Ingredient creation

**File:** `app/backend/apps/stock/signals.py:22-26`

**Issue:** When an `Ingredient` is created with the default values (`stock_actuel=0`, `seuil_alerte=0`), `is_now_low = 0 <= 0` evaluates to `True`. For a new record `_old_stock` is `None`, so `was_low = False`. The condition `is_now_low and not was_low` is satisfied, and a `stock.alert` WebSocket event is broadcast. Every ingredient created without explicit stock values (e.g., via admin, seeding, or import scripts) will spam staff with a false low-stock notification. This includes the case where `seuil_alerte=0` is intentional (meaning "no threshold set"), which is indistinguishable from a legitimate threshold crossing.

**Fix:** Add a guard that suppresses the alert when `seuil_alerte` is zero (or less), since a zero threshold means no alert boundary has been configured:

```python
@receiver(post_save, sender=Ingredient)
def alert_low_stock(sender, instance, created, **kwargs):
    from core.realtime import broadcast_staff_event

    if instance.seuil_alerte <= 0:
        return

    old_stock = getattr(instance, '_old_stock', None)
    is_now_low = instance.stock_actuel <= instance.seuil_alerte
    was_low = old_stock is not None and old_stock <= instance.seuil_alerte

    if is_now_low and not was_low:
        broadcast_staff_event(
            event_type='stock.alert',
            payload={
                'ingredient_id': instance.id,
                'nom': instance.nom,
                'stock_actuel': str(instance.stock_actuel),
                'seuil_alerte': str(instance.seuil_alerte),
                'unite_mesure': instance.unite_mesure,
            },
        )
```

Also add a corresponding test:

```python
def test_no_alert_when_seuil_alerte_is_zero(self, db):
    with patch(BROADCAST_PATH) as mock_broadcast:
        Ingredient.objects.create(nom='Test', unite_mesure='g')
    mock_broadcast.assert_not_called()
```

---

### CR-002: Signal test suite patches the wrong import path — all mock assertions are void

**File:** `app/backend/apps/stock/tests/test_signals.py:9`

**Issue:** The test file sets `BROADCAST_PATH = 'core.realtime.broadcast_staff_event'` and patches at the module-level attribute. The signal handler in `signals.py` does a **lazy in-function import**: `from core.realtime import broadcast_staff_event`. When Python executes this import at call time, it reads `sys.modules['core.realtime'].broadcast_staff_event`. If `unittest.mock.patch` has replaced that attribute, the lazy import picks up the mock — so the patch target appears correct.

However, the problem is that `broadcast_staff_event` is called **inside the `with patch(...)` block only in some tests**. In `test_broadcast_not_fired_when_stock_already_low` (lines 31-40), the first `save()` (which crosses the threshold) happens **outside** the `with patch(...)` block, and the second `save()` is inside it. The first save triggers a real call to `broadcast_staff_event` (or raises a `RuntimeError` if no channel layer is available in the test environment), not the mock. If the test environment has no Redis, the first save will raise an error propagating through `async_to_sync`. If it silently passes (e.g., `channel_layer is None` guard in `realtime.py` line 17), the test still passes but only by coincidence — it is not actually verifying that the signal does not double-fire across two saves.

The same structural issue exists in `test_broadcast_not_fired_when_stock_rises_above_threshold` (lines 90-99): the first save (to low stock) runs outside the patch block.

**Fix:** Wrap the entire test body — including the setup save — inside the `patch` context, and assert on call count rather than `assert_not_called` after only a partial window:

```python
def test_broadcast_not_fired_when_stock_already_low(self, ingredient_above_threshold):
    with patch(BROADCAST_PATH) as mock_broadcast:
        ingredient_above_threshold.stock_actuel = Decimal('50.00')
        ingredient_above_threshold.save()
        # First save crosses threshold: 1 call expected
        assert mock_broadcast.call_count == 1

        ingredient_above_threshold.stock_actuel = Decimal('30.00')
        ingredient_above_threshold.save()
        # Second save while already low: still only 1 call
        assert mock_broadcast.call_count == 1

def test_broadcast_not_fired_when_stock_rises_above_threshold(self, ingredient_above_threshold):
    with patch(BROADCAST_PATH) as mock_broadcast:
        ingredient_above_threshold.stock_actuel = Decimal('50.00')
        ingredient_above_threshold.save()
        mock_broadcast.reset_mock()

        ingredient_above_threshold.stock_actuel = Decimal('1000.00')
        ingredient_above_threshold.save()
        mock_broadcast.assert_not_called()
```

---

## Warnings

### WR-001: Bulk QuerySet `.delete()` bypasses soft-delete on Ingredient

**File:** `app/backend/apps/stock/models.py:27-30`

**Issue:** The overridden `delete()` method applies only when called on a model instance. Django's `QuerySet.delete()` executes a SQL `DELETE` directly and never calls the instance method. Any code path using `Ingredient.objects.filter(...).delete()` — including Django admin's bulk-delete action — will hard-delete rows, violating the soft-delete invariant.

**Fix:** Override the default manager with a custom `QuerySet` that overrides `delete()`, or disable bulk delete in admin:

```python
# In IngredientAdmin, disable bulk hard-delete:
class IngredientAdmin(admin.ModelAdmin):
    actions = None  # Removes "Delete selected" bulk action
    # ... rest of config
```

For a more robust solution, add a custom manager:

```python
class IngredientQuerySet(models.QuerySet):
    def delete(self):
        return self.update(est_active=False)

class IngredientManager(models.Manager):
    def get_queryset(self):
        return IngredientQuerySet(self.model, using=self._db)
```

---

### WR-002: `est_active` is writable via API — bypasses soft-delete semantics

**File:** `app/backend/apps/stock/serializers.py:8-17`

**Issue:** `est_active` is included in `fields` and absent from `read_only_fields`, making it writable via `PATCH /api/stock/ingredients/<id>/`. A GERANT can directly set `est_active=True` to re-activate a soft-deleted ingredient via the update endpoint, or set `est_active=False` without going through the dedicated `DELETE` endpoint (bypassing any future pre-delete hooks). This fragments the lifecycle management into two inconsistent code paths.

**Fix:** Mark `est_active` as read-only in the serializer and expose a separate `activate` action if re-activation is a supported operation:

```python
read_only_fields = ['id', 'est_active', 'created_at', 'updated_at']
```

---

### WR-003: `get_queryset` compares role against a raw string literal instead of `Role` enum

**File:** `app/backend/apps/stock/views.py:22`

**Issue:** `user.role == 'GERANT'` hardcodes a string. Every other permission check in the codebase uses `User.Role.GERANT` (see `permissions.py`). If the `Role` enum values are ever changed, this check will silently fail — non-GERANT users get the full unfiltered queryset — while the permission classes that use the enum constant would still work correctly.

**Fix:**

```python
from django.contrib.auth import get_user_model

User = get_user_model()

# In get_queryset:
if user.is_authenticated and user.role == User.Role.GERANT:
```

---

### WR-004: `PlatIngredientViewSet` blocks read access for non-GERANT roles

**File:** `app/backend/apps/stock/views.py:33-36`

**Issue:** `permission_classes = [IsAuthenticated, IsGerant]` applies to all actions including `list` and `retrieve`. This means CUISINIER and SERVEUR roles cannot query which ingredients are linked to which dishes — information they need operationally (e.g., a cook verifying dish composition). This is inconsistent with `IngredientViewSet`, which allows all authenticated users to read.

**Fix:** Mirror the pattern from `IngredientViewSet`:

```python
class PlatIngredientViewSet(viewsets.ModelViewSet):
    serializer_class = PlatIngredientSerializer
    queryset = PlatIngredient.objects.select_related('plat', 'ingredient').all()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsGerant()]
```

---

### WR-005: No non-negative constraints on `quantite_requise`, `stock_actuel`, `seuil_alerte`

**File:** `app/backend/apps/stock/models.py:13-14,44`

**Issue:** All three decimal fields accept negative values at both the model and database levels. Negative stock quantity is nonsensical and will corrupt threshold-crossing logic in the signal. Negative `quantite_requise` is also semantically invalid.

**Fix:** Add `MinValueValidator` and database-level `CheckConstraint`:

```python
from django.core.validators import MinValueValidator
from django.db import models

# In Ingredient:
stock_actuel = models.DecimalField(
    max_digits=10, decimal_places=2, default=0,
    validators=[MinValueValidator(0)]
)
seuil_alerte = models.DecimalField(
    max_digits=10, decimal_places=2, default=0,
    validators=[MinValueValidator(0)]
)

class Meta:
    constraints = [
        models.CheckConstraint(check=models.Q(stock_actuel__gte=0), name='stock_actuel_non_negative'),
        models.CheckConstraint(check=models.Q(seuil_alerte__gte=0), name='seuil_alerte_non_negative'),
    ]

# In PlatIngredient:
quantite_requise = models.DecimalField(
    max_digits=10, decimal_places=2,
    validators=[MinValueValidator(0)]
)

class Meta:
    unique_together = ('plat', 'ingredient')
    constraints = [
        models.CheckConstraint(check=models.Q(quantite_requise__gt=0), name='quantite_requise_positive'),
    ]
```

---

### WR-006: `Ingredient.delete()` does not return the standard Django delete tuple

**File:** `app/backend/apps/stock/models.py:27-30`

**Issue:** Django's `Model.delete()` contract is to return `(int, dict)` — the number of objects deleted and a breakdown by model. The overridden method returns `None` implicitly. Any caller that unpacks the return value (e.g., `count, _ = ingredient.delete()`) will raise a `TypeError`. The DRF `destroy()` override in `views.py` doesn't unpack it, but this is an API contract violation that will cause failures in third-party or future code.

**Fix:**

```python
def delete(self, using=None, keep_parents=False):
    self.est_active = False
    self.save(update_fields=['est_active', 'updated_at'])
    return 1, {self._meta.label: 1}
```

---

## Info

### IN-001: `from datetime import timedelta` appears mid-file in settings

**File:** `app/backend/tastify_backend/settings/base.py:42`

**Issue:** The import is placed after module-level assignments rather than at the top of the file. This is a PEP 8 violation and makes the dependency non-obvious to readers scanning imports.

**Fix:** Move `from datetime import timedelta` to the top of the file with the other imports.

---

### IN-002: `PlatIngredientSerializer` exposes raw FK integer IDs — no nested representation

**File:** `app/backend/apps/stock/serializers.py:21-30`

**Issue:** `plat` and `ingredient` fields serialize as bare integer PKs. API consumers must perform additional lookups to resolve names. For a read-heavy use-case like a KDS or menu display, a nested serializer (or `SlugRelatedField`) would provide more usable responses without extra round-trips.

**Fix (optional, design decision):** Add a `depth = 1` or explicit nested serializers for read operations if clients need human-readable data.

---

### IN-003: No `__init__.py` signals that tests directory is a package — test discovery may be fragile

**File:** `app/backend/apps/stock/tests/` (the `__init__.py` exists but is empty)

**Issue:** The test files reference fixtures defined within the same file (e.g., `ingredient` fixture in `test_models.py` vs. `ingredient` in `test_api.py`). There is no shared `conftest.py` for the stock app. If a shared fixture is needed in the future, there is no established place for it, leading to duplication. Currently the tests in `test_models.py` and `test_api.py` each define an `ingredient` fixture independently with different field values (`stock_actuel=5000` vs `stock_actuel=500`), which is fine now but could cause confusion.

**Fix:** Create `app/backend/apps/stock/tests/conftest.py` with shared fixtures to eliminate duplication and provide a canonical fixture location.

---

_Reviewed: 2026-05-05T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
