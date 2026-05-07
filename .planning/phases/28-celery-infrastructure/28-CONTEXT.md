# Phase 28: Celery Infrastructure & Check-list Model

## Goal
Establish the asynchronous task backbone for Tastify using Celery and Redis. Implement a periodic "Daily Checklist" system for restaurant opening/closing procedures.

## Context
- **Infrastructure**: Redis is already running (used by Channels). We need to add Celery worker and Celery Beat containers.
- **Async Needs**: 
    - JIT Stock Deductions (already exists as sync service, move to async for scale).
    - Daily Checklist resets.
    - Future AI model training and inference.
    - Push notifications (future).

## Success Criteria
1. Celery worker and Beat services start in Docker.
2. `Checklist` and `TaskChecklist` models implemented.
3. Periodic task (Beat) successfully resets daily checklists at a configurable time (e.g., 04:00 AM).
4. Staff can see and interact with the checklist via API.
