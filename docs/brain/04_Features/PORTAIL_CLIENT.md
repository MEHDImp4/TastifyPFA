# Module: Portail Client

The public-facing SPA now follows a public-first model: visitors can browse the menu and search dishes without an account, while reservation actions and loyalty data stay gated behind client authentication.

## 1. Reservations
- The reservation category is visible publicly in the portail navigation and landing content.
- Anonymous visitors are explicitly told that booking, cancellation, and reservation follow-up require a client account.
- Authenticated clients keep the 3-step booking wizard under `/reservations/new`, `/reservations/table`, and `/reservations/confirm`.
- `GET /api/tables/` filters available tables based on capacity and schedule.
- `POST /api/reservations/` attempts to book the table.
- Async confirmation email sent via Celery task.
- Customers can cancel (`PATCH /api/reservations/{id}/annuler/`) as long as the status is `en_attente`.

## 2. AI Recommendations
- Powered by Scikit-learn (Collaborative filtering, SVD, or NearestNeighbors).
- **Cold Start**: If the client has < 3 orders, the system falls back to the top 5 highest rated items globally.
- Endpoint: `GET /api/ia/recommandations/?client_id=X` (Must return under 800ms).
- Model is loaded in memory for fast inference, re-trained periodically via Celery Beat.
- The menu page remains public and now includes a client-side search experience for dish discovery without login friction.

## 3. Loyalty Program
- **Earn Rate**: Configurable (e.g., 1 MAD = 1 Point).
- **Tiers**:
  - Bronze: 0 - 499 pts
  - Argent: 500 - 1999 pts
  - Or: 2000+ pts
- Clients can view their points and redeem coupons (`POST /api/fidelite/coupon/`).
- The loyalty category is now visible publicly, but the portail explains that points, coupons, and account-specific advantages remain tied to a logged-in client profile.
