# Module: Back-Office Gérant

This SPA is the central command center for the restaurant owner/manager.

## 1. Dashboard (`/api/dashboard/`)
- **KPIs**: Daily orders, Revenue (CA), Average ticket size, Table occupancy rate.
- **Stock Alerts**: Real-time component showing ingredients below their threshold.
- **Charts**: 7-day rolling revenue chart (Recharts LineChart).
- **Reservations**: Today's reservations list.

*Performance criteria*: Initial load < 1.5s.

## 2. Menu Management
- **Categories**: Name, image, active status, display order.
- **Plats**: Name, category, description, price, image, `temps_preparation`, `badge_chef` (anti-waste flag).
- **Ingredients Linking**: Define recipes (`plat ↔ ingredients` + `quantite_utilisee`).
- **Real-time Availability**: Toggling availability triggers a WS push to the Serveur SPA immediately.

## 3. Inventory (Stocks)
- Visual colored gauges (Green/Orange/Red) based on `quantite / seuil` ratio.
- Automatic decrement via Django signal when a `LigneCommande` status changes to `servi`.
- Celery email alerts sent to the manager when stock drops below `seuil_alerte`.

## 4. HR Management (Employés)
- Creates a combined `Employe` profile and `Utilisateur` (AbstractUser) account.
- **Soft deletes**: Archiving an employee (`is_active=False`) revokes login access but preserves order history.
- Asynchronous PDF export of employee roster via Celery.

## 5. Daily Check-list
- Generated daily at 07:00 via Celery Beat.
- Immutable append-only log when items are checked.
- Alerts if critical items are not checked by closing time (e.g., 23:00).
