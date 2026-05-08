# Phase 31: Back-Office Dashboard KPIs - UAT

## Objective
Verify that the Back-Office Dashboard correctly displays real-time KPIs and historical analytics for the restaurant manager.

## Test Environment
- Back-Office SPA running in browser.
- Backend DRF server running.
- WebSocket connection established.

## User Acceptance Criteria

### 1. Real-time KPI Verification
- [ ] **Today's Revenue**: Complete a payment for an order. The "Today's Revenue" KPI should increase immediately without a manual refresh.
- [ ] **Active Tables**: Open a table in the Salle UI. The "Active Tables" count in the Dashboard should increment.
- [ ] **Pending Orders**: Create a new order. The "Pending Orders" count should reflect the change.
- [ ] **Average Prep Time**: Mark several items as "Ready" in the KDS. The average prep time should update based on the actual duration from launch to ready.

### 2. Historical Data Visualization
- [ ] **Revenue Chart**: Confirm the line chart shows data points for the last 7 days. Verify values match the database sum for those days.
- [ ] **Top Dishes**: Confirm the bar chart displays the 5 most sold dishes by quantity.

### 3. Navigation and Access
- [ ] **RBAC**: Login as a SERVEUR. Verify that the Dashboard is NOT accessible and does not appear in the sidebar.
- [ ] **Manager Redirect**: Login as a GERANT. Verify automatic redirection to the `/dashboard` page.
- [ ] **Sidebar**: Verify "Dashboard" is the first link in the sidebar for managers.

### 4. Technical Performance
- [ ] **WebSocket Resilience**: Disconnect and reconnect the network. Verify the dashboard resumes updates once the connection is restored.
- [ ] **Empty States**: Verify the dashboard handles cases with no data (e.g. start of a new day) gracefully (displaying 0 or "No data available").

## Success Signal
Manager can rely on the dashboard as a "single source of truth" for real-time operations and daily performance.
