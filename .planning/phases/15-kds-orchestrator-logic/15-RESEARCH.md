# Phase 15: KDS Orchestrator Logic - Research

**Researched:** 2026-05-02
**Domain:** Backend Orchestration / Just-In-Time (JIT) Logistics
**Confidence:** HIGH

## Summary

This phase implements the "Brain" of the Kitchen Display System. It calculates exactly when each dish in an order should be "launched" (pushed to the kitchen screens) so that all items in the order finish cooking at the same time. This Just-In-Time (JIT) approach ensures food quality (no cold fries while waiting for the steak) and optimizes kitchen flow.

The implementation relies on **Celery's ETA tasks** for precision scheduling and **Django Channels** for real-time broadcasting. The orchestrator is designed to be dynamic, handling late additions to orders by revoking and rescheduling pending tasks.

**Primary recommendation:** Implement a dedicated `KdsOrchestrator` service class triggered by `CommandeLigne` signals, using Celery `apply_async(eta=...)` for scheduling and storing `celery_task_id` on the model for revocation.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Launch Time Calculation | API / Backend | — | Requires access to prep times and order state. |
| Task Scheduling | API / Backend | — | Celery worker management. |
| Launch Notification | API / Backend | Browser / Client | Backend pushes event; Frontend updates UI. |
| Manual Prep Updates | Browser / Client | API / Backend | Chef interacts with UI; Backend updates state/triggers. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Celery | 5.6.3 | Async Task Queue | Ecosystem standard for Python/Django; verified in registry. |
| Redis | 7.0 | Message Broker | Recommended broker for Celery; already in project stack. |
| Django Channels | 4.3.2 | Real-time Broadcast | Handles WebSocket events for the KDS frontend. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| django-celery-results | 2.5.1 | Task persistence | If we need to audit task outcomes (optional for this phase). |

**Installation:**
```bash
# Already in requirements.txt
pip install celery redis
```

**Version verification:** 
- Celery 5.6.3 (Verified via `docker exec backend celery --version`) [VERIFIED: live container]
- Redis 7.0 (Verified via `docker ps`) [VERIFIED: live container]

## Architecture Patterns

### System Architecture Diagram
```
[ Order Update ] --(Signal)--> [ KdsOrchestrator ] 
                                     |
                                     +-- (Revoke) --> [ Old Celery Tasks ]
                                     |
                                     +-- (Schedule) -> [ New Celery Tasks (ETA) ]
                                                            |
                                                            V
                                                   [ Task Execution Time ]
                                                            |
                                     +----------------------+
                                     |
                                     V
                           [ Update Line Status ]
                                     |
                                     +-- (Broadcast) -> [ WebSocket (Cuisine Group) ] --> [ KDS Frontend ]
```

### Recommended Project Structure
```
backend/
├── apps/
│   ├── commandes/
│   │   ├── services/
│   │   │   └── orchestrator.py    # JIT logic and task scheduling
│   │   ├── tasks.py              # Celery task definitions
│   │   └── signals.py            # Model signals to trigger orchestrator
```

### Pattern 1: The JIT Calculation
The goal is to align all items to a `TargetReadyTime`.

**Algorithm:**
1. Determine `TargetReadyTime`: `max(line.prep_time)` for all pending lines + `now`.
2. For each line: `heure_lancement = TargetReadyTime - line.prep_time`.
3. If an item is already cooking, its `heure_fin_estimee` constrains the `TargetReadyTime`.

### Pattern 2: Task Revocation and Idempotency
When an order is updated, existing tasks must be revoked to prevent double-launching or conflicting timings.
- Store `celery_task_id` in `CommandeLigne`.
- Call `app.control.revoke(task_id, terminate=True)` before scheduling the new one.
- The task itself should check `statut == 'EN_ATTENTE'` before executing, as a safety check.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Future scheduling | `time.sleep` or custom loops | Celery `eta` | Celery handles worker persistence, retries, and distributed execution. |
| Task cancellation | Manual "is_cancelled" flags | `app.control.revoke` | Clears the broker queue immediately; more efficient. |
| Real-time push | HTTP Polling | Django Channels | Sub-second latency; less overhead than polling. |

## Common Pitfalls

### Pitfall 1: Redis Visibility Timeout
**What goes wrong:** If a task's ETA is longer than the `visibility_timeout` (default 1h), Redis redelivers the task to another worker.
**How to avoid:** Set `broker_transport_options = {'visibility_timeout': 43200}` (12 hours) in `settings.py`.

### Pitfall 2: Signal Recursion
**What goes wrong:** `post_save` triggers the orchestrator, which saves the model, triggering `post_save` again.
**How to avoid:** Use `update_fields` in `save()` calls and check if the field being updated is the one the signal is watching. Or use a context manager to temporarily disable signals.

### Pitfall 3: Clock Drift
**What goes wrong:** App server and Celery worker have different system times.
**How to avoid:** Force `CELERY_TIMEZONE = 'UTC'` and `USE_TZ = True`.

## Code Examples

### Orchestrator Service
```python
# apps/commandes/services/orchestrator.py
from celery import current_app
from django.utils import timezone

class KdsOrchestrator:
    @staticmethod
    def reorchestrate_order(order):
        lines = order.lignes.filter(statut__in=['EN_ATTENTE', 'EN_PREPARATION'])
        now = timezone.now()
        
        # Calculate Target Ready Time
        max_prep = 0
        for line in lines:
            if line.statut == 'EN_ATTENTE':
                max_prep = max(max_prep, line.plat.temps_preparation)
        
        target_ready = now + timedelta(minutes=max_prep)
        
        # Adjust for items already cooking
        for line in lines.filter(statut='EN_PREPARATION'):
            if line.heure_fin_estimee > target_ready:
                target_ready = line.heure_fin_estimee

        for line in lines.filter(statut='EN_ATTENTE'):
            # Revoke old task
            if line.celery_task_id:
                current_app.control.revoke(line.celery_task_id)
            
            # Schedule new task
            launch_time = target_ready - timedelta(minutes=line.plat.temps_preparation)
            task = launch_item_task.apply_async(
                args=[line.id], 
                eta=launch_time
            )
            
            # Update line (use update() to avoid signal recursion)
            order.lignes.filter(id=line.id).update(
                heure_lancement=launch_time,
                heure_fin_estimee=target_ready,
                celery_task_id=task.id,
                temps_preparation_snapshot=line.plat.temps_preparation
            )
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling DB for due tasks | Celery ETA | — | Lower latency, less DB load. |
| Single "Print" at order time | JIT Launching | — | Improved food quality and synchronization. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Redis Visibility Timeout defaults to 1h | Pitfalls | Tasks might duplicate if prep > 1h. |
| A2 | Celery 5.6.3 is stable for this use case | Standard Stack | Minor API changes if downgraded. |

## Open Questions

1. **How to handle prep times > 1 hour?**
   - Recommendation: Increase visibility timeout as noted.
2. **Should we support "Course" stages (Entrées then Mains)?**
   - Recommendation: Out of scope for this phase (Flat Order decision from CONTEXT.md).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Redis | Celery Broker | ✓ | 7.0 | — |
| Celery | Task execution | ✗ | — | Needs worker service in docker-compose. |
| MySQL | Data persistence | ✓ | 8.0 | — |

**Missing dependencies with no fallback:**
- **Celery Worker Service:** The `docker-compose.yml` does not currently define a worker. The planner MUST add a `celery-worker` service.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.3 |
| Config file | backend/pytest.ini |
| Quick run command | `docker exec backend pytest apps/commandes/tests/test_orchestrator.py` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-15.1 | Correct JIT calculation | unit | `pytest ...` | ❌ Wave 0 |
| REQ-15.2 | Task revocation on update | integration | `pytest ...` | ❌ Wave 0 |
| REQ-15.3 | WebSocket broadcast on launch | integration | `pytest ...` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Validate prep times (min 1, max 240). |
| V4 Access Control | yes | Ensure only internal backend logic triggers the orchestrator. |

### Known Threat Patterns for Celery/Redis

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Task Injection | Tampering | Use a private Redis network (already in Docker). |
| Resource Exhaustion | DoS | Limit concurrent workers and set task time limits. |

## Sources

### Primary (HIGH confidence)
- [Context7: /websites/celeryq_dev_en_stable] - ETA and Revocation APIs.
- [Official Celery Docs] - Redis visibility timeout and ETA memory limits.

### Secondary (MEDIUM confidence)
- [RealPython / Medium] - Django JIT orchestration patterns for POS systems.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Registry verified.
- Architecture: HIGH - Industry standard JIT pattern.
- Pitfalls: HIGH - Documented Redis/Celery edge cases.

**Research date:** 2026-05-02
**Valid until:** 2026-06-02
