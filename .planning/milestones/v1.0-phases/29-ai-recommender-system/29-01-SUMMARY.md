---
phase: 29-ai-recommender-system
plan: 01
subsystem: AI
tags:
  - backend
  - celery
  - ai
  - recommendation
requires: []
provides:
  - AI Recommender logic (compute_similarities)
  - Celery task (update_recommendations)
affects:
  - app/backend/requirements.txt
  - app/backend/apps/menu/ml/recommender.py
  - app/backend/apps/menu/tasks.py
tech_stack_added:
  - pandas
  - scikit-learn
key_files:
  created:
    - app/backend/apps/menu/ml/recommender.py
    - app/backend/apps/menu/tasks.py
    - app/backend/apps/menu/tests/test_recommender.py
  modified:
    - app/backend/requirements.txt
key_decisions:
  - Used TruncatedSVD from scikit-learn to reduce dimensionality for calculating similarity between items.
  - Fallback to cosine_similarity when the dataset is too small.
  - Test database user permissions adjusted for automated testing.
metrics:
  tasks_completed: 1
  total_tasks: 1
  duration_minutes: 10
  files_created: 3
  files_modified: 1
  date_completed: "2026-05-08"
---

# Phase 29 Plan 01: AI Recommender Logic and Celery Task Summary

Implemented the foundational machine learning logic for calculating dish similarity using order history. The logic is encapsulated in `recommender.py` utilizing `pandas` for matrix pivoting and `scikit-learn` for TruncatedSVD / Cosine Similarity. A Celery task `update_recommendations` was added to `tasks.py` to pre-calculate these similarities periodically and store the output in the Redis cache.

## Known Stubs
None.

## Threat Flags
None.

## TDD Gate Compliance
Tests were written first (`test(29-01)` commit) followed by implementation (`feat(29-01)` commit) and they passed successfully.