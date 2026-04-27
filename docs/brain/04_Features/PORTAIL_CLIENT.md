# Module: Portail Client

The public-facing SPA for customers to make reservations, browse the menu, and manage their loyalty points.

## 1. Reservations
- Allows selecting dates and party sizes.
- `GET /api/tables/` filters available tables based on capacity and schedule.
- `POST /api/reservations/` attempts to book the table.
- Async confirmation email sent via Celery task.
- Customers can cancel (`PATCH /api/reservations/{id}/annuler/`) as long as the status is `en_attente`.

## 2. AI Recommendations
- Powered by Scikit-learn (Collaborative filtering, SVD, or NearestNeighbors).
- **Cold Start**: If the client has < 3 orders, the system falls back to the top 5 highest rated items globally.
- Endpoint: `GET /api/ia/recommandations/?client_id=X` (Must return under 800ms).
- Model is loaded in memory for fast inference, re-trained periodically via Celery Beat.

## 3. Loyalty Program
- **Earn Rate**: Configurable (e.g., 1 MAD = 1 Point).
- **Tiers**:
  - Bronze: 0 - 499 pts
  - Argent: 500 - 1999 pts
  - Or: 2000+ pts
- Clients can view their points and redeem coupons (`POST /api/fidelite/coupon/`).
