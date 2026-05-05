# Phase 17 — Validation Strategy

## 1. Automated Tests
| Req ID | Behavior | Test Type | File |
|--------|----------|-----------|------|
| P17-BE-01 | CUISINIER can PATCH line status to PRET | unit | `test_ligne_api.py` |
| P17-BE-02 | SERVEUR can PATCH line status to SERVI | unit | `test_ligne_api.py` |
| P17-BE-03 | WebSocket broadcast fires on line status change | integration | `test_ligne_api.py` |
| P17-FE-01 | KDS line ready button updates UI via PATCH | unit/e2e | `TicketCard.test.tsx` |
| P17-FE-02 | Salle OrderingPage updates on line ready event | unit/e2e | `OrderingPage.test.tsx` |

## 2. Manual UAT
- [x] Mark a burger as Ready in KDS -> Verify pulse in Salle Ordering UI. (PASSED 2026-05-05)
- [x] Mark entire order as Ready in KDS -> Verify audio ding and status change in Salle. (PASSED 2026-05-05)
- [x] Verify Table Map reflects order status change instantly. (PASSED 2026-05-05)
