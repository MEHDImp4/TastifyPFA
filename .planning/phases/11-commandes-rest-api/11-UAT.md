# Phase 11 UAT: Commandes REST API

## Status: IN_PROGRESS
Started: 2026-04-30

## Test Cases

| ID | Feature | Description | Status | Notes |
|---|---|---|---|---|
| UAT-11-01 | Nested Order Creation | Creating an order with multiple lines in one POST request works. | PASSED | Verified via Phase 12 UAT. |
| UAT-11-02 | Table Status Sync | Table status changes to OCCUPEE when an order is created. | PASSED | Verified via Phase 12 UAT. |
| UAT-11-03 | Ownership Filtering | Serveurs can only see their own orders; Gerants see everything. | PENDING | |
| UAT-11-04 | Table Availability Guard | Cannot create an order for a table that is already OCCUPEE. | PENDING | |
| UAT-11-05 | Table Reset on Close | Table status returns to LIBRE when an order is PAYEE or ANNULEE. | PENDING | |

## Issues & Diagnosis
*No issues found yet.*

## Fix Plans
*No fix plans required yet.*
