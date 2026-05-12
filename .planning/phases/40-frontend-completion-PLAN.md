# Frontend Completion Plan (GSD)

## 1. Executive Summary
This plan addresses the gaps identified in the "Frontend Gap Analysis Report" dated 2026-05-12. The goal is to elevate the Tastify PFA frontend from a functional prototype to a production-ready ERP system with full feature parity with the documentation.

## 2. Phase 1: Critical Infrastructure & Real-time Sync
**Goal:** Establish professional feedback mechanisms and ensure the Salle UI is truly real-time.

- **Task 1.1: Global Toast System**
  - Install `sonner` in both frontend apps.
  - Implement a `ToastProvider` and replace all `alert()` calls.
  - Standardize error handling for API failures.
- **Task 1.2: Real-time Salle Map Sync**
  - Connect `SallePage.tsx` to the existing `WebSocketProvider`.
  - Listen for `order_created`, `order_updated`, and `table_status_changed` events.
  - Remove 10s polling in favor of event-driven updates.
- **Task 1.3: Recipe Management (Plat-Ingredient Association)**
  - Update `PlatPage` modal to include an ingredient selection list.
  - Implement nested form logic to send `ingrédients` array to `/api/plats/`.

## 3. Phase 2: Core ERP Features
**Goal:** Deliver complex business logic for Salle and Payment.

- **Task 2.1: Interactive SVG Salle Map**
  - Implement a basic SVG-based table layout manager (replacing the grid).
  - Allow gérants to position tables (Phase 09 gap).
  - Add "Bill Requested" visual state.
- **Task 2.2: Split-Bill Payment System**
  - Update `PaymentPortal.tsx` to support `EGAL` and `INDIVIDUEL` modes.
  - Build the UI for selecting specific items to pay in `INDIVIDUEL` mode.
  - Connect to `/api/paiement/{id}/split-egal/` and `/api/paiement/{id}/split-individuel/`.

## 4. Phase 3: AI, Loyalty & Engagement
**Goal:** Implement the "Intelligent" and "Loyalty" features from the specs.

- **Task 3.1: AI Recommendation UI**
  - Add "Recommended for You" section on `PortalHomePage`.
  - Implement the "Anti-gaspi" (Badge Chef) badge on `MenuPage` based on `/api/ia/badge-chef/`.
- **Task 3.2: Loyalty & Tiers**
  - Add points and tier display (Bronze/Gold) in `AccountPage`.
  - Show discount/benefit previews during `CheckoutPage`.
- **Task 3.3: KDS Audio Alerts**
  - Implement Web Audio API in `KdsPage` to play a subtle "ding" on new tickets.

## 5. Phase 4: Final Polish & PWA
**Goal:** Optimization and professional finishing touches.

- **Task 4.1: Skeleton & Empty States**
  - Standardize `Skeleton` usage across all pages.
  - Create consistent "Empty State" illustrations for Menu, KDS, and Reservations.
- **Task 4.2: PWA Offline Support**
  - Configure `vite-plugin-pwa` for the Salle/KDS interfaces.
  - Implement basic offline caching for the Menu.
- **Task 4.3: Final Design Audit**
  - Enforce `DESIGN.md` animation standards (`scale(0.97)` on click, origin-aware popovers).

## 6. Definition of Done
- All `alert()` removed.
- Salle Map updates in <1s after a change in KDS or Ordering.
- Split-bill logic handles edge cases (rounding, partial payments).
- Design system consistency verified (8px borders, ECO-FRESH palette).
- All tests passing.
