# Phase 28 Research: Celery & Infrastructure

## Docker Configuration
- **Image**: Reuse the backend `Dockerfile`.
- **Command**: `celery -A tastify_backend worker -l info` for worker, `celery -A tastify_backend beat -l info` for beat.
- **Broker**: `redis://redis:6379/1` (use DB 1 to isolate from Channels on DB 0).

## Model Design
### `Checklist`
- `titre`: CharField
- `type`: Enum (OUVERTURE, FERMETURE, HEBDOMADAIRE)
- `active`: Boolean

### `TaskChecklist`
- `checklist`: ForeignKey(Checklist)
- `description`: TextField
- `ordre`: Integer
- `est_obligatoire`: Boolean

### `ChecklistExecution` (Instance)
- `checklist`: ForeignKey(Checklist)
- `date`: DateField
- `execute_par`: ForeignKey(User)
- `statut`: Enum (EN_COURS, TERMINE)

## Periodic Logic
- Need `django-celery-beat` for database-backed scheduling.
- Task `reset_daily_checklists` to run at night.

## Dependencies
- `celery`
- `redis`
- `django-celery-beat`
- `django-celery-results` (for task monitoring)
