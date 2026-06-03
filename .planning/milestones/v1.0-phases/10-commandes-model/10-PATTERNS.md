# Phase 10: Commandes Model - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 8
**Analogs found:** 6 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/apps/commandes/models.py` | model | CRUD | `backend/apps/menu/models.py` | exact |
| `backend/apps/commandes/apps.py` | config | event-driven | `backend/apps/tables/apps.py` | exact |
| `backend/apps/commandes/signals.py` | utility | event-driven | N/A (New pattern) | no-analog |
| `backend/apps/commandes/tests/test_models.py` | test | N/A | `backend/apps/tables/tests/test_model.py` | exact |
| `backend/apps/commandes/tests/test_signals.py` | test | N/A | `backend/apps/tables/tests/test_model.py` | partial |
| `backend/apps/commandes/migrations/0001_initial.py` | migration | transform | `backend/apps/tables/migrations/0001_initial.py` | exact |
| `backend/tastify_backend/settings/base.py` | config | N/A | N/A | modified |

## Pattern Assignments

### `backend/apps/commandes/models.py` (model, CRUD)

**Analog:** `backend/apps/menu/models.py` (lines 4-20) and `backend/apps/tables/models.py` (lines 17-25)

**Imports pattern**:
```python
from django.db import models
from django.conf import settings
from apps.tables.models import Table
from apps.menu.models import Plat
```

**QuerySet + Manager pattern**:
```python
class CommandeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)

class CommandeManager(models.Manager):
    def get_queryset(self):
        return CommandeQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()
```

**TextChoices pattern**:
```python
class Table(models.Model):
    class Statut(models.TextChoices):
        LIBRE        = 'LIBRE',        'Libre'
        OCCUPEE      = 'OCCUPEE',      'Occupée'
        ...
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.LIBRE,
    )
```

**Soft-delete pattern**:
```python
def delete(self, using=None, keep_parents=False):
    """Soft delete: marks inactive instead of removing the DB row (per D-07)."""
    self.est_active = False
    self.save(update_fields=['est_active', 'updated_at'])
```

---

### `backend/apps/commandes/apps.py` (config, event-driven)

**Analog:** `backend/apps/tables/apps.py`

**AppConfig pattern**:
```python
from django.apps import AppConfig

class CommandesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.commandes'
    verbose_name = 'Commandes'

    def ready(self):
        import apps.commandes.signals  # noqa: F401
```

---

### `backend/apps/commandes/tests/test_models.py` (test, N/A)

**Analog:** `backend/apps/tables/tests/test_model.py`

**Test structure pattern**:
```python
from django.test import TestCase
from apps.commandes.models import Commande

class CommandeSoftDeleteTest(TestCase):
    def setUp(self):
        # Create dependencies first
        self.table = Table.objects.create(numero=1, capacite=4)
        self.commande = Commande.objects.create(table=self.table)

    def test_delete_sets_inactive(self):
        self.commande.delete()
        self.assertFalse(Commande.objects.get(pk=self.commande.pk).est_active)
```

---

## Shared Patterns

### Soft-Delete Implementation
**Source:** `backend/apps/menu/models.py`
**Apply to:** `Commande` model
```python
def delete(self, using=None, keep_parents=False):
    self.est_active = False
    self.save(update_fields=['est_active', 'updated_at'])
```

### ForeignKey Protection
**Source:** `backend/apps/tables/models.py`
**Apply to:** `Commande.table` and `CommandeLigne.plat`
```python
on_delete=models.PROTECT
```

### Timestamp Fields
**Source:** `backend/apps/menu/models.py`
**Apply to:** All new models
```python
created_at = models.DateTimeField(auto_now_add=True)
updated_at = models.DateTimeField(auto_now=True)
```

## No Analog Found

Files with no close match in the codebase:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `backend/apps/commandes/signals.py` | utility | event-driven | No signals currently exist in the codebase. Follow RESEARCH.md for standard Django signal patterns. |

## Metadata

**Analog search scope:** `backend/apps/`, `backend/tastify_backend/settings/`
**Files scanned:** 15
**Pattern extraction date:** 2026-04-29
