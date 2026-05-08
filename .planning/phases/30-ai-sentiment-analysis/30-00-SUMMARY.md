# Phase 30: AI Sentiment Analysis - Planning Summary

## Goal
Integrate HuggingFace BERT for customer review sentiment analysis.

## Context
Phase 30 requires setting up a new `avis` app to capture customer reviews and run sentiment analysis asynchronously via Celery using a HuggingFace NLP pipeline.

## Execution Plans
- **30-01-PLAN.md**: Models and Celery Infrastructure (Avis model, `analyze_review_sentiment` task, lazy-loaded pipeline, CPU PyTorch dependencies).
- **30-02-PLAN.md**: DRF API Endpoints (`AvisViewSet`, async task dispatching on `perform_create`, RBAC).
- **30-03-PLAN.md**: Frontend Integration (Portail Client submission UI, Back-Office management view).

All architectural considerations from `30-RESEARCH.md` are integrated.