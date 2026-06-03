# Phase 10: Commandes Model - Research

**Researched:** 2026-04-29
**Domain:** Django model definition, cross-app FK constraints, post_save/post_delete signals, soft-delete pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** New bounded context at `backend/apps/commandes/`. Not added to `menu` or `tables`.
- **D-02:** `Commande` fields: `table` (FK→Table, PROTECT), `serveur` (FK→User, SET_NULL, null=True), `statut` (TextChoices), `montant_total` (DecimalField, default=0), `est_active` (BooleanField, default=True), `created_at`, `updated_at`.
- **D-03:** `Commande.statut` TextChoices: `EN_COURS`, `EN_CUISINE`, `PRETE`, `PAYEE`, `ANNULEE`. Default: `EN_COURS`.
- **D-04:** `Commande.delete()` uses soft-delete (sets `est_active=False`) — consistent with Categorie, Plat, Table pattern.
- **D-05:** No `code_promo` FK in Phase 10.
- **D-06:** `CommandeLigne` fields: `commande` (FK→Commande, CASCADE), `plat` (FK→Plat, PROTECT), `quantite` (PositiveIntegerField), `prix_unitaire` (DecimalField snapshotted), `statut` (TextChoices), `notes` (TextField, blank=True).
- **D-07:** `CommandeLigne.statut` TextChoices: `EN_ATTENTE`, `EN_PREPARATION`, `PRET`, `SERVI`, `ANNULE`. Default: `EN_ATTENTE`.
- **D-08:** `prix_unitaire` copied from `plat.prix` at line creation time.
- **D-09:** `post_save` + `post_delete` signal on `CommandeLigne` recalculates `commande.montant_total` as `SUM(quantite * prix_unitaire)` excluding lines where `statut == ANNULE`. Uses `update_fields=['montant_total', 'updated_at']`.
- **D-10:** No seed command.

### Claude's Discretion

- Custom QuerySet/Manager implementation style (mirrors Categorie/Plat/Table pattern).
- Whether `CommandeQuerySet.active()` filters on `est_active=True` only, or also on `statut != ANNULEE`.
- Exact test fixture naming and structure.
- Whether to add `__str__` on CommandeLigne as `f"{self.plat.nom} x{self.quantite}"` or simpler.

### Deferred Ideas (OUT OF SCOPE)

- `code_promo` FK — future loyalty/promo phase (Phase 33 or dedicated promo phase).
- Seed command for orders — deferred; orders created via Phase 11 REST API.
- SERVEUR status-flip endpoint on Commande — Phase 11 or Phase 12 scope.
- Physical deletion protection (PROTECT policy at DB level).
</user_constraints>

---

## Summary

Phase 10 creates two Django models (`Commande` and `CommandeLigne`) inside a new `apps/commandes/` bounded context. The models follow patterns established across Phases 4–8 (QuerySet/Manager soft-delete, TextChoices inner class). The primary new element is a Django signal that auto-calculates `montant_total`. No signals exist yet in the codebase — this is the first signal wiring, using the `apps.py ready()` + `signals.py` module pattern referenced in CONTEXT.md.

Migration dependencies are concrete: the commandes app depends on `apps.menu` (for Plat) and `apps.tables` (for Table), both of which have a single migration each (`menu 0002_plat`, `tables 0001_initial`). The `AUTH_USER_MODEL` is `users.Utilisateur`.

All existing apps use `django.test.TestCase` with inline `setUp()` object creation — no factories, no fixtures files. Signal tests must be careful to distinguish `post_save` from bulk operations (which do not fire signals).

**Primary recommendation:** Mirror the `Table` app structure exactly: `apps.py`, `models.py`, `migrations/`, `tests/` (subdirectory). Add `signals.py` + wire via `ready()` in `apps.py`. Register `apps.commandes` in `INSTALLED_APPS`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 5.0.14 | ORM, signals, migrations | Project stack [VERIFIED: migration file header] |
| django.db.models.signals | built-in | post_save / post_delete hooks | Standard Django signal infrastructure |
| decimal.Decimal | stdlib | Monetary calculations | Avoids float rounding errors |

**No additional packages needed.** This phase is pure model + signal work within the existing Django installation.

### INSTALLED_APPS Registration Pattern

The current `base.py` registers apps as dotted strings:

```python
INSTALLED_APPS = [
    ...
    'apps.users',
    'apps.menu',
    'apps.tables',
    # Phase 10 adds:
    'apps.commandes',
]
```

[VERIFIED: `backend/tastify_backend/settings/base.py` line 26–28]

---

## Architecture Patterns

### Recommended Project Structure

```
backend/apps/commandes/
├── __init__.py
├── apps.py               # CommandesConfig with ready() signal wiring
├── models.py             # Commande + CommandeLigne + QuerySet/Manager
├── signals.py            # recalcul_montant_total handler
├── admin.py
├── migrations/
│   ├── __init__.py
│   └── 0001_initial.py
└── tests/
    ├── __init__.py
    ├── test_models.py     # soft-delete, QuerySet, __str__, FK constraints
    └── test_signals.py    # post_save / post_delete signal behavior
```

### Pattern 1: QuerySet + Manager (soft-delete)

The entire codebase uses a two-class pattern — a `QuerySet` subclass for chainable filters, and a `Manager` that exposes those filters directly.

```python
# Source: backend/apps/menu/models.py (verified)
class CategorieQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)

class CategorieManager(models.Manager):
    def get_queryset(self):
        return CategorieQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()
```

Apply identically for `CommandeQuerySet` / `CommandeManager`.

**Discretion note:** `active()` should filter `est_active=True` only (mirrors all prior apps). Excluding `ANNULEE` at the queryset level would be a new behavioral contract not established in this codebase — recommend keeping `active()` purely structural and leaving status filtering to callers.

### Pattern 2: TextChoices Inner Class

```python
# Source: backend/apps/tables/models.py (verified)
class Table(models.Model):
    class Statut(models.TextChoices):
        LIBRE        = 'LIBRE',        'Libre'
        OCCUPEE      = 'OCCUPEE',      'Occupée'
        RESERVEE     = 'RESERVEE',     'Réservée'
        ENCAISSEMENT = 'ENCAISSEMENT', 'Encaissement'

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.LIBRE,
    )
```

Apply this pattern for both `Commande.Statut` and `CommandeLigne.Statut`. The `max_length` must accommodate the longest value: `EN_PREPARATION` = 14 chars → set `max_length=20` for both.

### Pattern 3: Soft-Delete Override

```python
# Source: backend/apps/tables/models.py (verified)
def delete(self, using=None, keep_parents=False):
    self.est_active = False
    self.save(update_fields=['est_active', 'updated_at'])
```

`Commande.delete()` applies this pattern identically. `CommandeLigne` does NOT need a soft-delete override — only `Commande` has `est_active`.

### Pattern 4: apps.py + signals.py wiring

No signals exist yet in the codebase, but the pattern is established in CONTEXT.md (D-09 and specifics section) and is standard Django practice. [ASSUMED — no existing `signals.py` in repo, but Django `ready()` + signal module is the documented approach]

```python
# apps.py
from django.apps import AppConfig

class CommandesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.commandes'
    verbose_name = 'Commandes'

    def ready(self):
        import apps.commandes.signals  # noqa: F401
```

```python
# signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

# Imported lazily inside ready() to avoid circular imports at module load time.
# Models imported here (not at top-level) to respect Django app registry order.

def recalcul_montant_total(sender, instance, **kwargs):
    from django.db.models import F, Sum
    commande = instance.commande
    result = commande.lignes.exclude(
        statut=sender.Statut.ANNULE
    ).aggregate(
        total=Sum(F('quantite') * F('prix_unitaire'))
    )
    commande.montant_total = result['total'] or 0
    commande.save(update_fields=['montant_total', 'updated_at'])
```

**Critical implementation note from DATABASE_SCHEMA.md:** The schema shows `filter(statut__ne='annule')`. In Django ORM the correct form is `exclude(statut=CommandeLigne.Statut.ANNULE)`. [VERIFIED: DATABASE_SCHEMA.md section 3, CONTEXT.md Specifics section]

**Critical signal safety:** Use `update_fields=['montant_total', 'updated_at']` on `commande.save()` inside the signal handler. This prevents the Commande `post_save` from recursively triggering further signals if any Commande signal is added later. [VERIFIED: D-09 in CONTEXT.md]

**Aggregate approach vs. iteration:** Use `aggregate(Sum(F('quantite') * F('prix_unitaire')))` rather than Python-side `sum(l.prix_unitaire * l.quantite for l in ...)`. The aggregate is a single SQL query; the Python loop issues N+1 queries. [ASSUMED — Django ORM best practice from training knowledge]

### Pattern 5: Cross-app FK references

```python
# Same-app FK: use string reference
commande = models.ForeignKey('Commande', on_delete=models.CASCADE, ...)

# Cross-app FK: direct model import
from apps.tables.models import Table
from apps.menu.models import Plat
table = models.ForeignKey(Table, on_delete=models.PROTECT, ...)
plat  = models.ForeignKey(Plat,  on_delete=models.PROTECT, ...)

# User FK: always use settings string, never direct import
from django.conf import settings
serveur = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='commandes',
)
```

[VERIFIED: CONTEXT.md code_context section; `AUTH_USER_MODEL = 'users.Utilisateur'` confirmed in base.py]

### Pattern 6: __str__ convention

| Model | __str__ | Source |
|-------|---------|--------|
| Categorie | `return self.nom` | menu/models.py |
| Plat | `return self.nom` | menu/models.py |
| Table | `return f'Table {self.numero}'` | tables/models.py |
| Commande | `return f'Commande #{self.pk} — Table {self.table_id}'` | [RECOMMENDED] |
| CommandeLigne | `return f'{self.plat.nom} x{self.quantite}'` | [RECOMMENDED — matches CONTEXT.md discretion suggestion] |

### Anti-Patterns to Avoid

- **Bulk-create in signal tests:** `QuerySet.bulk_create()` and `QuerySet.update()` do not fire `post_save` / `post_delete` signals. Test fixtures must use individual `save()` / `delete()` calls to exercise signal handlers. [ASSUMED — Django ORM documented behavior]
- **Importing models at module top-level in signals.py:** Importing models before the app registry is ready causes `AppRegistryNotReady`. Always import inside the signal handler function or defer via `ready()`. [ASSUMED — Django app loading best practice]
- **Missing `update_fields` on signal-triggered save:** Without `update_fields`, any future `post_save` on `Commande` would trigger on every field change, not just `montant_total`. [VERIFIED: D-09 rationale in CONTEXT.md]
- **`montant_total` default:** Must be `Decimal('0')` or `default=0` on `DecimalField` — do not use `default=0.0` (float). Django stores decimal correctly but using `0` (int) is idiomatic. [ASSUMED — Django DecimalField docs]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `montant_total` calculation | Python loop on all lines | `aggregate(Sum(F('quantite') * F('prix_unitaire')))` | Single SQL query, handles NULL correctly via `or 0` fallback |
| Signal registration | Manual `connect()` calls at module level | `apps.py ready()` + `signals.py` | Avoids double-registration on auto-reload in dev server |
| Soft-delete | Custom `is_deleted` flag with custom logic | Override `delete()`, set `est_active=False` | Consistent with all 3 prior apps; manager-level filtering already established |

---

## Migration Dependencies

The `0001_initial.py` for commandes must declare:

```python
dependencies = [
    ('menu', '0002_plat'),       # Plat FK
    ('tables', '0001_initial'),  # Table FK
    ('users', '<latest>'),       # AUTH_USER_MODEL FK
]
```

[VERIFIED: migration files `menu/migrations/0002_plat.py` and `tables/migrations/0001_initial.py` exist. Users migration label must be confirmed at generation time.]

The migration app labels use the short names (`menu`, `tables`, `users`), NOT the full dotted paths. This is because `AppConfig.name = 'apps.menu'` but `AppConfig.label` defaults to the last component (`menu`). [VERIFIED: confirmed from migration files — `to='menu.categorie'` in `0002_plat.py`]

---

## Common Pitfalls

### Pitfall 1: app_label vs. app name in migration dependencies
**What goes wrong:** Using `('apps.tables', '0001_initial')` in migration dependencies instead of `('tables', '0001_initial')`.
**Why it happens:** The INSTALLED_APPS entry is `'apps.tables'` but the migration label is just `'tables'` (the last dotted segment).
**How to avoid:** Verify by reading existing migration files — `to='menu.categorie'` confirms label is `menu` not `apps.menu`.
**Warning signs:** `ValueError: App 'apps.tables' could not be found` during migration.

### Pitfall 2: Signal fires twice on create
**What goes wrong:** `post_save` is connected twice (once via `ready()`, once via top-level import).
**Why it happens:** Django dev server auto-reloads modules; signals connected at module load time get registered twice.
**How to avoid:** Only register signals inside `AppConfig.ready()`, never at module top level.
**Warning signs:** `montant_total` doubles on each line save.

### Pitfall 3: aggregate returns None on empty queryset
**What goes wrong:** `SUM()` on an empty set returns `None`, not `0`. `commande.montant_total = None` raises `IntegrityError` or sets wrong value.
**How to avoid:** `result['total'] or 0` (or use `Coalesce(Sum(...), 0)`).
**Warning signs:** `montant_total` is `None` after deleting the last line.

### Pitfall 4: prix_unitaire not snapshotted at save
**What goes wrong:** `prix_unitaire` left as `null` or not set explicitly; signal calculates `0 * quantite = 0`.
**Why it happens:** Forgetting to copy `plat.prix` into `prix_unitaire` at `CommandeLigne` creation.
**How to avoid:** Override `CommandeLigne.save()` — if `prix_unitaire` is `None` and `self.plat_id` is set, copy `self.plat.prix`.
**Warning signs:** `montant_total` is always `0` even with lines present.

### Pitfall 5: Commande soft-delete cascades to lines
**What goes wrong:** Soft-deleting a `Commande` does not affect `CommandeLigne` rows at the DB level (they remain, since the FK is to the PK, which still exists).
**Why it happens:** Soft-delete does not trigger `CASCADE` at the DB level.
**How to avoid:** This is intentional and correct for Phase 10. Documenting it so the planner does not add line cascading logic. Line visibility is handled via `est_active` on the Commande — queries join through the active Commande.
**Warning signs:** N/A — this is expected behavior.

---

## Code Examples

### Commande model skeleton

```python
# Source pattern: backend/apps/tables/models.py (TextChoices) + menu/models.py (soft-delete)
from django.conf import settings
from django.db import models
from apps.tables.models import Table


class CommandeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(est_active=True)


class CommandeManager(models.Manager):
    def get_queryset(self):
        return CommandeQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()


class Commande(models.Model):

    class Statut(models.TextChoices):
        EN_COURS   = 'EN_COURS',   'En cours'
        EN_CUISINE = 'EN_CUISINE', 'En cuisine'
        PRETE      = 'PRETE',      'Prête'
        PAYEE      = 'PAYEE',      'Payée'
        ANNULEE    = 'ANNULEE',    'Annulée'

    table = models.ForeignKey(
        Table,
        on_delete=models.PROTECT,
        related_name='commandes',
    )
    serveur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commandes',
    )
    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_COURS,
    )
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    est_active    = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    objects = CommandeManager()

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['statut', 'created_at']),
            models.Index(fields=['table']),
        ]

    def __str__(self):
        return f'Commande #{self.pk} — Table {self.table_id}'

    def delete(self, using=None, keep_parents=False):
        self.est_active = False
        self.save(update_fields=['est_active', 'updated_at'])
```

### CommandeLigne model skeleton

```python
# Source pattern: menu/models.py cross-app FK (Plat uses string for same-app, direct import for cross-app)
from apps.menu.models import Plat


class CommandeLigne(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE     = 'EN_ATTENTE',     'En attente'
        EN_PREPARATION = 'EN_PREPARATION', 'En préparation'
        PRET           = 'PRET',           'Prêt'
        SERVI          = 'SERVI',          'Servi'
        ANNULE         = 'ANNULE',         'Annulé'

    commande      = models.ForeignKey(
        'Commande',
        on_delete=models.CASCADE,
        related_name='lignes',
    )
    plat          = models.ForeignKey(
        Plat,
        on_delete=models.PROTECT,
        related_name='lignes_commande',
    )
    quantite      = models.PositiveIntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    statut        = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )
    notes         = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
        indexes = [
            models.Index(fields=['commande', 'statut']),
        ]

    def __str__(self):
        return f'{self.plat.nom} x{self.quantite}'

    def save(self, *args, **kwargs):
        if not self.prix_unitaire and self.plat_id:
            self.prix_unitaire = Plat.objects.get(pk=self.plat_id).prix
        super().save(*args, **kwargs)
```

### Signal handler

```python
# signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F, Sum


@receiver(post_save, sender='commandes.CommandeLigne')
@receiver(post_delete, sender='commandes.CommandeLigne')
def recalcul_montant_total(sender, instance, **kwargs):
    from apps.commandes.models import CommandeLigne
    commande = instance.commande
    result = commande.lignes.exclude(
        statut=CommandeLigne.Statut.ANNULE
    ).aggregate(
        total=Sum(F('quantite') * F('prix_unitaire'))
    )
    commande.montant_total = result['total'] or 0
    commande.save(update_fields=['montant_total', 'updated_at'])
```

**Note on sender string:** Using `sender='commandes.CommandeLigne'` (string) avoids import-order issues at `ready()` time. [ASSUMED — Django docs pattern for lazy signal connections]

### apps.py with ready()

```python
from django.apps import AppConfig


class CommandesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.commandes'
    verbose_name = 'Commandes'

    def ready(self):
        import apps.commandes.signals  # noqa: F401
```

### Test patterns (matches codebase style)

```python
# Source pattern: backend/apps/tables/tests/test_model.py + menu/tests/test_soft_delete.py
from django.test import TestCase
from apps.commandes.models import Commande, CommandeLigne
from apps.menu.models import Categorie, Plat
from apps.tables.models import Table
from apps.users.models import Utilisateur


class CommandeSoftDeleteTest(TestCase):
    def setUp(self):
        self.table = Table.objects.create(numero=99, capacite=4)
        self.commande = Commande.objects.create(table=self.table)

    def test_delete_sets_inactive(self):
        self.commande.delete()
        self.assertFalse(Commande.objects.get(pk=self.commande.pk).est_active)

    def test_delete_does_not_remove_row(self):
        pk = self.commande.pk
        self.commande.delete()
        self.assertTrue(Commande.objects.filter(pk=pk).exists())


class SignalTest(TestCase):
    def setUp(self):
        cat = Categorie.objects.create(nom='Test Cat', ordre_affichage=0)
        self.plat = Plat.objects.create(
            categorie=cat, nom='Tajine', prix='45.00', temps_preparation=20
        )
        self.table = Table.objects.create(numero=88, capacite=2)
        self.commande = Commande.objects.create(table=self.table)

    def test_signal_updates_montant_total_on_line_add(self):
        CommandeLigne.objects.create(
            commande=self.commande, plat=self.plat, quantite=2,
            prix_unitaire=self.plat.prix
        )
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.montant_total, 90.00)

    def test_signal_excludes_annule_lines(self):
        CommandeLigne.objects.create(
            commande=self.commande, plat=self.plat, quantite=1,
            prix_unitaire=self.plat.prix, statut=CommandeLigne.Statut.ANNULE
        )
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.montant_total, 0)

    def test_signal_updates_on_line_delete(self):
        ligne = CommandeLigne.objects.create(
            commande=self.commande, plat=self.plat, quantite=1,
            prix_unitaire=self.plat.prix
        )
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.montant_total, 45.00)
        ligne.delete()
        self.commande.refresh_from_db()
        self.assertEqual(self.commande.montant_total, 0)
```

---

## Required Indexes (from DATABASE_SCHEMA.md)

DATABASE_SCHEMA.md section 4 defines these indexes for commandes tables:

| Table | Columns | Django `models.Index` fields |
|-------|---------|------------------------------|
| `commande` | `statut, date_heure` | `['statut', 'created_at']` |
| `commande` | `table_id` | `['table']` |
| `ligne_commande` | `commande_id, statut_plat` | `['commande', 'statut']` |

[VERIFIED: DATABASE_SCHEMA.md section 4]

The `date_heure` column referenced in the schema maps to `created_at` in the Django model (the schema uses the SQL name; the Django model uses `auto_now_add` timestamped field). [ASSUMED — schema doc predates model naming finalization]

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Django TestCase (built-in) |
| Config file | `backend/tastify_backend/settings/test.py` |
| Quick run command | `python manage.py test apps.commandes --verbosity=2` |
| Full suite command | `python manage.py test apps` |

[VERIFIED: all existing tests use `django.test.TestCase`; `settings/test.py` exists in repo]

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command |
|----------|-----------|-------------------|
| Commande soft-delete sets est_active=False | unit | `python manage.py test apps.commandes.tests.test_models` |
| Commande row not removed on delete | unit | same |
| CommandeManager.active() filters correctly | unit | same |
| signal updates montant_total on line save | unit | `python manage.py test apps.commandes.tests.test_signals` |
| signal excludes ANNULE lines from total | unit | same |
| signal updates montant_total on line delete | unit | same |
| prix_unitaire snapshotted from plat.prix | unit | `python manage.py test apps.commandes.tests.test_models` |
| FK PROTECT prevents Table deletion with active order | unit | same |
| montant_total = 0 when all lines ANNULE | unit | `python manage.py test apps.commandes.tests.test_signals` |

### Wave 0 Gaps

- [ ] `backend/apps/commandes/tests/__init__.py` — test package
- [ ] `backend/apps/commandes/tests/test_models.py` — covers soft-delete, FK, __str__, snapshot
- [ ] `backend/apps/commandes/tests/test_signals.py` — covers signal behaviors

---

## Environment Availability

Step 2.6: SKIPPED — This phase is purely Django model/signal code. No external tools, services, or CLIs beyond the existing Docker stack are required. The Docker stack (Django + MySQL) is confirmed operational from Phase 8/9 completion.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | models only, no endpoints |
| V3 Session Management | no | models only |
| V4 Access Control | no | no endpoints in this phase |
| V5 Input Validation | yes | `PositiveIntegerField` for quantite, `DecimalField` for prix |
| V6 Cryptography | no | no secrets stored |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Negative quantite | Tampering | `PositiveIntegerField` enforces DB-level > 0 |
| prix_unitaire = 0 to fake free items | Tampering | Snapshot at save time from `plat.prix`; validate non-zero in serializer (Phase 11) |
| Cascade delete wiping order history | Tampering | `PROTECT` on Table FK prevents accidental loss |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `apps.py ready()` + `signals.py` is the correct signal wiring pattern for this project | Architecture Patterns — Pattern 4 | Low — standard Django; if wrong, signals simply won't connect |
| A2 | Using string sender `'commandes.CommandeLigne'` in `@receiver` avoids import-order issues | Code Examples — Signal handler | Low — if string form fails, switch to direct import after model is defined |
| A3 | Aggregate `Sum(F('quantite') * F('prix_unitaire'))` is preferred over Python-side summation | Don't Hand-Roll | Low — functional either way; aggregate is more efficient |
| A4 | `date_heure` in DATABASE_SCHEMA.md maps to `created_at` in the Django model | Required Indexes | Low — only affects index column naming, not model behavior |
| A5 | Django bulk_create/update do not fire signals | Anti-Patterns section | Medium — if test setup uses bulk create, signal tests will silently pass even if signal is broken |

---

## Open Questions

1. **Users migration label**
   - What we know: `AUTH_USER_MODEL = 'users.Utilisateur'`; users app exists with migrations
   - What's unclear: the exact latest migration file name in `apps/users/migrations/` (needed for FK dependency in commandes `0001_initial.py`)
   - Recommendation: Migration generator (`makemigrations`) will auto-detect this; planner should note that `makemigrations apps.commandes` must be run after model creation and the generated file must be inspected to confirm correct dependency resolution.

2. **`CommandeQuerySet.active()` scope**
   - What we know: All prior apps filter only on `est_active=True`
   - What's unclear: Whether `active()` should also exclude `ANNULEE` orders (CONTEXT.md marks this as discretion)
   - Recommendation: Keep `active()` purely structural (`est_active=True`). Future API phase can add a named queryset method `en_cours()` for status-based filtering. This matches the pattern established by all 3 prior apps.

---

## Sources

### Primary (HIGH confidence)
- `backend/apps/menu/models.py` — QuerySet/Manager/soft-delete pattern, verified by direct read
- `backend/apps/tables/models.py` — TextChoices inner class, PROTECT FK, soft-delete, verified by direct read
- `backend/tastify_backend/settings/base.py` — INSTALLED_APPS, AUTH_USER_MODEL, verified by direct read
- `backend/apps/menu/migrations/0002_plat.py` — app label convention (`menu`, not `apps.menu`), migration dependency format
- `backend/apps/tables/migrations/0001_initial.py` — Table model migration, max_length=20 for TextChoices
- `docs/brain/03_Architecture/DATABASE_SCHEMA.md` — required indexes, signal pseudocode, FK policies
- `.planning/phases/10-commandes-model/10-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- `backend/apps/tables/tests/test_model.py` — test naming/structure pattern
- `backend/apps/menu/tests/test_soft_delete.py` — test assertion style
- `backend/apps/menu/tests/test_api.py` — force_authenticate pattern, APIClient usage

### Tertiary (LOW confidence / ASSUMED)
- Django signal double-registration behavior on dev server reload
- `bulk_create`/`update` not firing signals (Django documented but not observed in this codebase)
- `Sum(F(...) * F(...))` aggregate efficiency claim

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — entire stack verified in existing codebase
- Architecture: HIGH — exact patterns extracted from production files
- Migration dependencies: HIGH — migration files directly read
- Signal wiring: MEDIUM — pattern referenced in CONTEXT.md, standard Django, but no existing signals.py to copy from
- Pitfalls: MEDIUM — drawn from Django patterns and codebase analysis

**Research date:** 2026-04-29
**Valid until:** 2026-05-29 (stable — Django model/signal APIs do not change rapidly)
