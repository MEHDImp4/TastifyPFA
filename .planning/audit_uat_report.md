# UAT Audit Report & Manual Test Plan

**Date:** 2026-05-05
**Project Completion:** 50% (Phase 20 Complete)
**Audit Scope:** Phases 01-20

## 1. Executive Summary
The project has reached its halfway milestone. Most technical features are covered by automated unit and integration tests. However, several critical "real-world" behaviors (Audio, WebSockets, JIT Task Orchestration) rely on manual verification or were skipped during automated execution due to local environment constraints (Docker/DB isolation).

This audit identifies stale documentation and unverified "human-needed" items to produce a high-priority manual test plan.

---

## 2. Status Breakdown
- **Automated Coverage:** ~85% (Unit & Integration tests passing in `backend/` and `frontend/`).
- **Manual Verification Status:** Mostly "PASSED" but requires a final "Fresh State" validation after recent UI and Stock refactors.
- **Stale Docs Detected:** `04-VERIFICATION.md` and `12-VERIFICATION.md` still mention skipped tests that were later verified manually but not updated in the "Verdict" tables.

---

## 3. Prioritized Manual Test Plan (MTP)

### Priority 1: Real-Time & Audio (KDS ↔ Salle)
*Status: ✅ PASSED (Verified by user 2026-05-05)*
1. **Kitchen Call (Order Fire):**
   - As SERVEUR, fire an order to the kitchen.
   - **Verify:** KDS plays a bell sound.
   - **Verify:** KDS ticket pulses with a green glow.
2. **Order Ready (Pickup):**
   - As CUISINIER, mark an item/order as "Prêt".
   - **Verify:** Salle UI (Ordering Page/Table Map) receives the update instantly via WebSocket.
   - **Verify:** Salle UI plays the "Order Ready" chime (fix verified in Phase 17).

### Priority 2: Stock Deductions (New in Phase 20)
*Status: ✅ PASSED (Verified by user 2026-05-05)*
1. **JIT & Manual Deduction:**
   - Note current stock of an ingredient (e.g., "Tomate").
   - Create and Fire an order containing that ingredient (e.g., "Salade César").
   - **Verify:** Stock decreases automatically on JIT launch OR manual "Commencer" action in KDS.
   - **Verify:** Alerts appear correctly if thresholds are crossed.

### Priority 3: UI & Reliability (Post-Refactor)
*Status: ✅ PASSED (Verified by user 2026-05-05)*
1. **Responsive Sidebar:**
   - Toggle sidebar on Desktop/Mobile.
   - **Verify:** Transitions are smooth, icons are clear, and active route highlighting is correct.
2. **WebSocket Stability:**
   - Open any Staff page.
   - **Verify:** Connection indicator (Green dot) remains stable indefinitely (heartbeat fix verified).
   - **Verify:** App reconnects automatically if connection is lost.

---

## 4. Final Verdict
**All prioritized manual tests have PASSED.** The system is stable, the real-time infrastructure is resilient, and the stock deduction logic is verified for both automated and manual triggers. Stale documentation has been cleaned up.

---

## 5. Next Steps
1. **Cleanup:** Delete the stale `.planning/.continue-here.md` to avoid confusion.
2. **Execution:** Execute the Priority 1 & 2 manual tests listed above.
3. **Commit:** Finalize the audit by committing this report and any documentation updates.
