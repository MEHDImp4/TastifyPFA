# Validation Architecture: Phase 12 - Order Taking Frontend

## Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `frontend/salle/vitest.config.ts` |
| Quick run command | `npm test` |

## Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|-------------|
| ORD-FE-01 | URL parameter `tableId` is parsed | Unit | `npm test -- OrderingPage.test.tsx` | `OrderingPage.test.tsx` |
| ORD-FE-03 | Add to cart updates Zustand state | Unit | `npm test -- useOrderStore.test.ts` | `useOrderStore.test.ts` |
| ORD-FE-02 | Category filtering updates visible dishes | Unit | `npm test -- DishGrid.test.tsx` | `DishGrid.test.tsx` |
| ORD-FE-05 | POST request sent on review confirm | Integration | `npm test -- OrderReview.test.tsx` | `OrderReview.test.tsx` |

## Verification Protocol
- **State Integrity**: Verify that adding a dish to Table A's cart does not affect Table B's cart.
- **Visual Fidelity**: Use `scale(0.97)` on all interactive buttons (add, remove, category tab).
- **Responsiveness**: Verify grid layout switches from 2-columns (mobile) to 3+ columns (tablet/desktop).
