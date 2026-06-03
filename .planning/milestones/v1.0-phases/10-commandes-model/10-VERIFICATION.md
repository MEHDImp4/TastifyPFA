---
status: passed
phase: 10-commandes-model
verified: 2026-04-29
---

# Verification: Phase 10 - Commandes Model

## Result
Phase 10 passed automated verification.

## Must-Haves
- `apps.commandes` is registered in `INSTALLED_APPS`.
- `Commande` exists with table, serveur, statut, montant_total, est_active, timestamps, indexes, manager, and soft-delete behavior.
- `CommandeLigne` exists with order/dish links, quantity, price snapshot, status, notes, timestamps, and index.
- `CommandeLigne.save()` snapshots `Plat.prix` when no unit price is provided.
- Signals recalculate `Commande.montant_total` on line save and delete.
- Cancelled lines are excluded from the total.
- Empty orders total to 0.

## Automated Checks
- `python backend\manage.py check`: passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py check`: passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py makemigrations --check --dry-run`: passed.
- `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test python backend\manage.py test apps.commandes`: 13/13 passed.

## Environment Notes
- Docker Desktop was not running, so commands using the default MySQL host `db` could not connect.
- The project’s existing `tastify_backend.settings.test` SQLite settings were used for unit verification.
