# Phase 28: Celery Infrastructure - Research

## 1. Stack Selection
- **Broker**: Redis (DB 1).
- **Library**: Celery 5.x.
- **Beat**: django-celery-beat.
- **Results**: django-celery-results.

## 2. Infrastructure Setup
- Single Redis container, separate databases for WS (0) and Celery (1).
- Docker service `celery-worker` and `celery-beat`.
