---
status: investigating
trigger: "index.tsx:40 GET http://localhost/api/plats/ 404 (Not Found)"
created: 2026-04-28
updated: 2026-04-28
---

# Debug Session: plats-api-404-not-found

## Symptoms
- **Expected:** Get the plat from the database.
- **Actual:** `index.tsx:40 GET http://localhost/api/plats/ 404 (Not Found)`
- **Error Messages:** Backend logs show `WARNING Not Found: /api/plats/`.
- **Timeline:** Started today (2026-04-28) after Phase 7 implementation. Never worked.
- **Reproduction:** Visit the Plats management page in the Back-Office.

## Current Focus
- **hypothesis:** The `/api/plats/` URL is not correctly registered in the backend `urls.py` or the `menu` app's `urls.py`.
- **test:** Check backend URL configuration files.
- **expecting:** To find a missing or incorrectly named route for `plats`.
- **next_action:** "gather initial evidence"

## Evidence
(None yet)

## Eliminated
(None yet)
