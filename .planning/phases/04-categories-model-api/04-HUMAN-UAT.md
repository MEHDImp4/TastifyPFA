---
status: partial
phase: 04-categories-model-api
source: [04-VERIFICATION.md]
started: 2026-04-28T00:00:00Z
updated: 2026-04-28T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Image Upload — Absolute URL in Response
expected: POST /api/categories/ with a multipart JPEG (GERANT token) → HTTP 201, `image` field is an absolute URL (`http://localhost/media/categories/<file>.jpg`), file physically written to `backend/media/categories/`
result: [pending]

### 2. django-cleanup: Old Image Deleted on PATCH
expected: PATCH a category that already has an image, supplying a replacement image → old file removed from `backend/media/categories/`, new file present
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
