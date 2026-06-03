# Phase 18: Ingredients & Stock Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 18-Ingredients & Stock Model
**Areas discussed:** Recipe Mapping Strategy, Unit of Measurement, Alert Mechanisms

---

## Recipe Mapping Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Direct M2M (PlatIngredient) | A direct through-table linking a Plat to an Ingredient with a required quantity. Simpler queries. | ✓ |
| Dedicated FicheTechnique Model | A dedicated FicheTechnique model grouping ingredients, mapped to a Plat. Better for complex menus/variants. | |

**User's choice:** Direct M2M (PlatIngredient)
**Notes:** User opted for simplicity and performance over complex recipe structures.

---

## Unit of Measurement

| Option | Description | Selected |
|--------|-------------|----------|
| Strict Base Units in DB | All DB values are stored in base units (g, ml, pieces). Conversions (to kg, L) happen strictly in the frontend UI. Less error-prone backend. | ✓ |
| Dynamic Units in DB | Store the unit type (e.g., 'kg', 'L', 'g') alongside the quantity in the database. Requires backend conversion logic. | |

**User's choice:** Strict Base Units in DB
**Notes:** Backend remains the absolute source of truth with standardized base units to simplify math and threshold triggers.

---

## Alert Mechanisms

| Option | Description | Selected |
|--------|-------------|----------|
| Real-Time WebSocket Push | Use existing `broadcast_staff_event` to push real-time low-stock alerts to GERANT via WebSocket as soon as a threshold is breached. | ✓ |
| On-Demand API Calculation | Calculate low stock dynamically via an API endpoint only when the GERANT opens the stock dashboard. Simpler but not real-time. | |

**User's choice:** Real-Time WebSocket Push
**Notes:** Real-time visibility is critical; leverages the existing Channels/Redis layer deployed in Phase 13.

---

## Claude's Discretion

None requested.

## Deferred Ideas

None.
