---
status: complete
phase: 18-ingredients-stock-model
source: [18-01-SUMMARY.md, 18-02-SUMMARY.md, 18-03-SUMMARY.md, 18-04-SUMMARY.md]
started: 2026-05-05T00:00:00Z
updated: 2026-05-05T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running backend container. Run `docker compose up --build backend` (or equivalent). Server boots without errors, stock.0001_initial and menu.0003_plat_ingredients migrations show as applied (run `docker compose exec backend python manage.py migrate --check` — exits 0, no pending migrations), and `GET /api/stock/ingredients/` with a valid token returns 200.
result: pass

### 2. List Ingredients as Authenticated User
expected: Send `GET /api/stock/ingredients/` with a valid SERVEUR or CUISINIER token. Response is 200 with a JSON array containing only active ingredients (est_active=True). Inactive ingredients are NOT present in the list.
result: pass

### 3. GERANT Can Create an Ingredient
expected: Send `POST /api/stock/ingredients/` with a GERANT token and body `{"nom": "Farine de test", "unite_mesure": "g", "stock_actuel": "100.00", "seuil_alerte": "20.00"}`. Response is 201 with the new ingredient's data including an `id` field. Ingredient persists in DB.
result: pass

### 4. Non-GERANT Cannot Create Ingredient
expected: Send the same `POST /api/stock/ingredients/` request but with a SERVEUR or CUISINIER token. Response is 403 Forbidden. No ingredient is created.
result: pass

### 5. Soft-Delete Returns 204 and Preserves Row
expected: Send `DELETE /api/stock/ingredients/{id}/` for an existing active ingredient with a GERANT token. Response is 204 No Content. The ingredient is NOT removed from the database — it still appears in the GERANT list but is absent from the SERVEUR list (est_active=False).
result: pass

### 6. GERANT Sees Inactive, Non-GERANT Does Not
expected: After soft-deleting an ingredient (test 5), send `GET /api/stock/ingredients/` as GERANT — the deactivated ingredient appears in the response. Then send the same request as SERVEUR — the deactivated ingredient is absent.
result: pass

### 7. GERANT Can Link Ingredient to Plat (PlatIngredient)
expected: Send `POST /api/stock/plat-ingredients/` with a GERANT token and body `{"plat": <plat_id>, "ingredient": <ingredient_id>, "quantite_requise": "150.00"}`. Response is 201 with the created link's data. Link persists in DB.
result: pass

### 8. Non-GERANT Cannot Link Ingredient to Plat
expected: Send the same `POST /api/stock/plat-ingredients/` request with a SERVEUR token. Response is 403 Forbidden. No link is created.
result: pass

### 9. Duplicate Plat-Ingredient Link Rejected
expected: Send `POST /api/stock/plat-ingredients/` twice with the same `plat` + `ingredient` combination (as GERANT). First call returns 201. Second call returns 400 Bad Request (unique_together constraint violation).
result: pass

### 10. Django Admin Shows Stock Models
expected: Open `/admin/` in a browser while logged in as a superuser. Under the Stock section, two entries appear: **Ingredients** and **Plat Ingredients**. The Ingredients list shows columns: nom, unite_mesure, stock_actuel, seuil_alerte, est_active, created_at. The search bar filters by name. The est_active filter works.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
