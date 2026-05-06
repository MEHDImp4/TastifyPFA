# Phase 23 UAT: Reservations Model & API

## Status: COMPLETE

## Test Results

### 1. Reservation app boots with migration
expected: App exists and migrations are applicable.
result: PASS

### 2. Invalid reservation is rejected
expected: Rejected if heure_fin <= heure_debut or capacity exceeded.
result: PASS

### 3. Cleanup buffer blocks overlapping bookings (Same Day)
expected: 15-minute buffer prevents same-day overlaps.
result: PASS

### 4. Cancelled/Absent reservations don't block
expected: ANNULEE/ABSENTE status allows slot reuse.
result: PASS

### 5. Client Status Injection Prevention (CR-01 Fix)
expected: Clients cannot set initial status via API.
result: PASS (Verified: Error 400 "Les clients ne peuvent pas choisir le statut initial." returned)

### 6. Midnight Wrap Overlap Detection (CR-02 Fix)
expected: Reservation ending at 23:55 (buffered to 00:10 next day) blocks a 00:05 next-day booking.
result: PASS (Fixed: `has_active_conflict` now checks adjacent days)

## Diagnosed Gaps (Resolved)

### GAP-23-01: Incomplete Midnight Wrap Validation
- **Symptoms**: Creating a reservation on Day 1 ending at 23:55 does not prevent a new reservation on Day 2 starting at 00:05, despite the 15-minute buffer.
- **Root Cause**: `Reservation.has_active_conflict` in `models.py` was day-locked.
- **Resolution**: Updated `has_active_conflict` to query `date_reservation__in=[date-1, date, date+1]`.
- **Status**: FIXED
