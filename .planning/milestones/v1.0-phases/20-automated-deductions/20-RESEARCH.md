# Phase 20: Automated Deductions - Research

**Researched:** 2026-05-05
**Domain:** Stock Management, Django Signals, Celery Tasks, Atomic Transactions
**Confidence:** HIGH

## Summary

This phase implements automated stock deduction when orders are processed. The core requirement is to subtract ingredient quantities from the stock based on the recipes (`PlatIngredient`) associated with the ordered items (`CommandeLigne`).

Research indicates that the optimal trigger point for deduction is the `apps.commandes.tasks.launch_item_task`, which marks a line as `EN_PREPARATION`. This ensures that stock is only deducted when production actually begins, and it naturally handles the JIT (Just-In-Time) orchestration implemented in previous phases.

**Primary recommendation:** Create a `StockService` to handle atomic deduction using `select_for_update()` to prevent race conditions, and call this service from within the `launch_item_task` Celery task.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stock Deduction Logic | API / Backend (Service) | — | Business logic involving multi-row atomic updates and recipe resolution. |
| Deduction Trigger | API / Backend (Task) | — | Integration with existing JIT orchestration flow (`launch_item_task`). |
| Low Stock Alerts | API / Backend (Signal) | WebSocket | Existing `stock/signals.py` handles broadcasting based on threshold crossing. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 4.2.x | ORM & Transactions | Core framework for data consistency. |
| django.db.transaction | N/A | Atomic operations | Ensures all ingredients for a plat are deducted together. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Celery | 5.x | Task execution | Triggering deduction at the scheduled `heure_lancement`. |

**Installation:**
No new packages required.

## Architecture Patterns

### Recommended Project Structure
```
app/backend/apps/stock/
├── services.py      # New: StockService for deduction logic
├── models.py        # Ingredient, PlatIngredient
└── signals.py       # Existing: low stock alerts
```

### Pattern 1: Service-Based Atomic Deduction
**What:** Encapsulate the deduction logic in a service rather than a signal to ensure explicit execution within tasks and better error handling.
**When to use:** When multiple related records must be updated atomically based on complex relations (Plat -> PlatIngredient -> Ingredient).

### Anti-Patterns to Avoid
- **Implicit Signals for Deduction:** Avoid using `post_save` signals on `CommandeLigne` for deduction, as `launch_item_task` uses `.update()` which bypasses signals. Manual service calls in the task are more reliable. [VERIFIED: Django Docs]
- **Unprotected Increments/Decrements:** Never use `instance.stock -= qty; instance.save()` without locking (`select_for_update()`) or `F()` expressions, as it leads to lost updates in concurrent environments. [VERIFIED: Django Docs]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Race conditions | Custom locking | `select_for_update()` | Database-level row locking is the standard, safe way to handle concurrent stock updates. |
| Alerting | New event system | Existing `stock/signals.py` | The project already has a robust WebSocket-based alerting system for low stock. |

## Common Pitfalls

### Pitfall 1: Bypassing Signals with `.update()`
**What goes wrong:** If the deduction logic uses `QuerySet.update()`, the `post_save` signals in `stock/signals.py` (which broadcast low stock alerts) will NOT fire.
**How to avoid:** Use `select_for_update()` to fetch the `Ingredient` instance, modify it in Python, and call `.save()`. This ensures alerts are still triggered.

### Pitfall 2: Double Deduction on Task Retry
**What goes wrong:** If a Celery task fails after deduction but before completion, a retry might deduct stock again.
**How to avoid:** Leverage the existing idempotency check in `launch_item_task` (checks if status is `EN_ATTENTE`) and ensure deduction only happens if the status transition is successful.

## Code Examples

### Atomic Deduction Service
```python
# apps/stock/services.py
from django.db import transaction
from apps.stock.models import Ingredient, PlatIngredient

class StockService:
    @staticmethod
    @transaction.atomic
    def deduct_stock_for_line(ligne):
        """
        Deducts ingredients for a CommandeLigne.
        Uses select_for_update to prevent race conditions.
        """
        # Prefetch recipes to reduce queries
        recipe = PlatIngredient.objects.filter(plat=ligne.plat).select_related('ingredient')
        
        for item in recipe:
            # Lock the ingredient row to ensure consistency
            ingredient = Ingredient.objects.select_for_update().get(pk=item.ingredient_id)
            deduction = item.quantite_requise * ligne.quantite
            ingredient.stock_actuel -= deduction
            ingredient.save() # Fires alerts if threshold crossed
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Deduct at checkout | Deduct at production start | Phase 20 | Better inventory accuracy for long-running prep items. |
| Manual stock check | Automated JIT deduction | Phase 20 | Reduces human error and provides real-time stock-outs. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `launch_item_task` is the point of no return for ingredients | Summary | If ingredients are actually prepped earlier, stock is inaccurate during "Attente". |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Row locking | ✓ | 15+ | SQLite (supports limited locking) |
| Celery | Triggers | ✓ | 5.x | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest |
| Quick run command | `pytest apps/stock/tests/test_services.py` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| REQ-20-01 | Stock deducted on line launch | Integration | `pytest apps/commandes/tests/test_stock_integration.py` |
| REQ-20-02 | Low stock alert triggers | Integration | `pytest apps/stock/tests/test_signals.py` |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | `DecimalField` validation and `MinValueValidator(0)` |
| V13 API and Web Service | yes | Service-level atomicity to prevent race conditions |

### Known Threat Patterns for Django/Stock

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Race Condition (Double spend) | Tampering | `select_for_update()` + `transaction.atomic` |

## Sources

### Primary (HIGH confidence)
- `apps/commandes/tasks.py` - Current JIT execution point.
- `apps/stock/signals.py` - Current alerting mechanism.
- `django.db.models.F` - Official Django documentation for atomic updates.

### Secondary (MEDIUM confidence)
- Standard F&B POS patterns - "Deduct at Production" vs "Deduct at Sale".

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Core Django
- Architecture: HIGH - Fits existing JIT pattern
- Pitfalls: HIGH - Documented Django signal behavior

**Research date:** 2026-05-05
**Valid until:** 2026-06-05
