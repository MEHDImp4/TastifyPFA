# Phase 31: Back-Office Dashboard KPIs - Context

## Objective
Implement a real-time analytics dashboard in the Back-Office to provide the restaurant manager with immediate insights into operational performance and historical trends.

## User Decisions
### Locked Decisions
- **D-31-01: Real-time KPIs** — Display Today's Revenue, Active Tables, Pending Orders, and Average Prep Time.
- **D-31-02: Historical Charts** — Use Recharts for 7-day Revenue trend and Top 5 Best Selling Dishes.
- **D-31-03: Real-time Updates** — Wire dashboard KPIs to existing WebSocket infrastructure to avoid manual refreshes for critical stats.
- **D-31-04: Tech Stack** — React (frontend), DRF (backend), Recharts (visualization).

### the agent's Discretion
- **Aggregation Logic** — Use Django's `Aggregation` and `Annotation` for performant data fetching.
- **Polling vs. WebSockets** — Use WebSockets for live counters (Active Tables, Pending Orders) and standard API fetching (with optional periodic refresh) for historical charts.
- **Layout** — A grid-based layout following the "ECO-FRESH" design manifesto, prioritizing "Ardoise" background and "Teal" highlights.

## Deferred Ideas
- **Advanced Forecasting** — Predictive analytics based on weather or external factors (scoped for Phase 37).
- **Export to PDF/CSV** — Scoped for a future reporting phase.

## Discovery Summary
- **Existing Apps**:
  - `commandes`: Contains Order models and status.
  - `paiements`: Contains transaction/payment data.
  - `menu`: Contains Dishes (Plats).
  - `tables`: Contains Table status.
- **WebSockets**: Phase 13 established the base infrastructure. We can reuse the `orders` or `staff` group for updates.

## Success Criteria
- Manager can see "Today's Revenue" updated as payments are processed.
- "Active Tables" count reflects real-time status changes.
- "Pending Orders" shows the current load in the kitchen.
- "Average Prep Time" gives a metric for kitchen efficiency.
- Charts correctly visualize 7-day revenue and popular items.
