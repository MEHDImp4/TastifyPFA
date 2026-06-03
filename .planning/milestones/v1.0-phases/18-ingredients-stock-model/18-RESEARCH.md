<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Implement a direct Many-To-Many relationship (`PlatIngredient` through-table) linking a `Plat` to an `Ingredient` with a required quantity.
- **D-02:** Avoid a complex `FicheTechnique` model to keep database queries simple and maintain high performance.
- **D-03:** Store all quantities in the database using strict base units (e.g., grams, milliliters, pieces).
- **D-04:** Handle all unit conversions (e.g., grams to kilograms, ml to Liters) strictly on the frontend UI. The backend remains the source of truth for base units.
- **D-05:** Surface low-stock alerts in real-time.
- **D-06:** Utilize the existing `broadcast_staff_event` WebSocket infrastructure to push notifications directly to the `GERANT` immediately when an ingredient's stock drops below its minimum threshold.

### the agent's Discretion
None — User provided explicit direction on all key architectural options.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

# Phase 18: Ingredients & Stock Model - Research

**Researched:** 2026-05-05
**Domain:** Django Models, DRF APIs, WebSocket Signals, Database Design
**Confidence:** HIGH

## Summary

This phase establishes the foundational inventory system. It introduces a decoupled `stock` Django app containing the `Ingredient` and `PlatIngredient` models. The models enforce strict base units (grams, milliliters, pieces) in the database with zero backend conversion logic. It extends the existing `Plat` model with a Many-To-Many relationship to `Ingredient`. A Django `post_save` signal is used to detect when an ingredient's `stock_actuel` falls below its `seuil_alerte`, immediately pushing a WebSocket alert via `broadcast_staff_event` to the GERANT. 

**Primary recommendation:** Use Django's `pre_save` and `post_save` signals to detect the exact moment `stock_actuel` crosses `seuil_alerte` to avoid spamming the WebSocket channel on every subsequent deduction.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Unit Conversion | Browser / Client | — | D-04 dictates all UI math (kg to g) happens strictly on frontend. |
| Threshold Alerts | API / Backend | WebSocket | Backend detects stock dropping via Signals and emits the event over Redis/Channels. |
| CRUD Permissions | API / Backend | — | DRF Permissions (`IsGerant`) enforce write access at the API layer. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | ^4.2 | ORM and Core Logic | Established project framework. |
| DRF | ^3.14 | REST API | Established project framework. |
| Django Channels | ^4.0 | Real-time events | Established project framework. |

## Architecture Patterns

### Recommended Project Structure
```
app/backend/apps/stock/
├── models.py       # Ingredient, PlatIngredient models
├── views.py        # IngredientViewSet API
├── serializers.py  # Validation and API formatting
├── signals.py      # post_save hooks for WebSocket alerts
├── apps.py         # App config (where signals are connected)
└── tests/          # TDD validation
```

### Pattern 1: Signal-Based WebSocket Alerts
**What:** Using Django signals to trigger real-time alerts.
**When to use:** When state changes in the database (like a stock reduction) need to immediately notify connected clients without coupling the view logic.
**Example:**
```python
# apps/stock/signals.py
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from apps.stock.models import Ingredient
from core.realtime import broadcast_staff_event

@receiver(pre_save, sender=Ingredient)
def capture_previous_stock(sender, instance, **kwargs):
    if instance.pk:
        # Cache previous state to avoid spamming alerts
        instance._old_stock = sender.objects.get(pk=instance.pk).stock_actuel

@receiver(post_save, sender=Ingredient)
def alert_low_stock(sender, instance, created, **kwargs):
    old_stock = getattr(instance, '_old_stock', None)
    is_now_low = instance.stock_actuel <= instance.seuil_alerte
    was_low = old_stock is not None and old_stock <= instance.seuil_alerte
    
    # Broadcast only if it crosses the threshold downwards or is created low
    if is_now_low and not was_low:
        broadcast_staff_event(
            event_type="stock.alert",
            payload={
                "ingredient_id": instance.id,
                "nom": instance.nom,
                "stock_actuel": str(instance.stock_actuel),
                "seuil_alerte": str(instance.seuil_alerte),
                "unite_mesure": instance.unite_mesure,
            }
        )
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| M2M Linking | Custom linking tables with manual joins | Django's `ManyToManyField(through='...')` | Built-in ORM features provide `.ingredients.all()` access directly on the `Plat` model. |
| Soft Delete | Manual boolean flipping in views | Overriding `.delete()` on the model | Maintains project consistency (as seen in `Categorie` and `Plat`). |

## Common Pitfalls

### Pitfall 1: Unit Conversion Sprawl
**What goes wrong:** Backend serializers convert grams to kilograms for the UI, leading to rounding errors and mismatched DB states.
**Why it happens:** Trying to be "helpful" to the frontend.
**How to avoid:** Return raw `Decimal` values from the DB strictly as base units (g, ml, pcs). Ensure frontend parsing handles display logic exclusively.

### Pitfall 2: Alert Spam
**What goes wrong:** WebSocket pushes a `stock.alert` every time an order deducts 1 gram from a low-stock ingredient.
**Why it happens:** Signal only checks `stock_actuel <= seuil_alerte` without checking previous state.
**How to avoid:** Use `pre_save` to cache the old `stock_actuel` and only emit the WebSocket event if the threshold was explicitly crossed during *this* transaction.

## Code Examples

### Ingredient Model Setup
```python
# apps/stock/models.py
from django.db import models
from apps.menu.models import Plat

class Ingredient(models.Model):
    UNITE_CHOICES = [
        ('g', 'Grammes'),
        ('ml', 'Millilitres'),
        ('pcs', 'Pièces'),
    ]
    nom = models.CharField(max_length=100, unique=True)
    unite_mesure = models.CharField(max_length=5, choices=UNITE_CHOICES)
    stock_actuel = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seuil_alerte = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    est_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nom']
        
    def delete(self, using=None, keep_parents=False):
        """Soft delete pattern."""
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])

class PlatIngredient(models.Model):
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE, related_name='plat_ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='ingredient_plats')
    quantite_requise = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('plat', 'ingredient')
```

*(Note: We must also update `apps.menu.models.Plat` to include `ingredients = models.ManyToManyField(Ingredient, through='stock.PlatIngredient')`)*

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest-django |
| Config file | app/backend/pytest.ini |
| Quick run command | `docker compose exec backend pytest apps/stock/` |
| Full suite command | `docker compose exec backend pytest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-01 | CRUD Ingredient (GERANT vs Others) | unit | `pytest apps/stock/tests/test_api.py -x` | ❌ Wave 0 |
| REQ-02 | Plat to Ingredient M2M Mapping | unit | `pytest apps/stock/tests/test_models.py -x` | ❌ Wave 0 |
| REQ-03 | Soft Delete behavior | unit | `pytest apps/stock/tests/test_models.py -x` | ❌ Wave 0 |
| REQ-04 | WebSocket alert on threshold cross | unit | `pytest apps/stock/tests/test_signals.py -x` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `apps/stock/tests/test_api.py` — API CRUD permissions
- [ ] `apps/stock/tests/test_models.py` — Models validation and DB queries
- [ ] `apps/stock/tests/test_signals.py` — Signal mocking and test broadcast validation

## Sources

### Primary (HIGH confidence)
- `.planning/phases/18-ingredients-stock-model/18-CONTEXT.md` - Phase constraints and DB directives.
- `app/backend/apps/users/permissions.py` - Verified `IsGerant` permission structure.
- `app/backend/core/realtime.py` - Verified `broadcast_staff_event` existence and signature.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Directly follows Phase 1-17 configurations.
- Architecture: HIGH - M2M and SoftDelete explicitly directed by D-01 and prior patterns.
- Pitfalls: HIGH - Alert spam is a known WebSocket signaling consequence.

**Research date:** 2026-05-05
**Valid until:** 2026-06-05