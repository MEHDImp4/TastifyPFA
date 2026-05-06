# Phase 25 Patterns: Reservations Admin UI

## 1. List View (Table)
- **Base Component**: `HrPage.tsx` table structure.
- **Styling**: `ECO-FRESH` palette (Ardoise background, Teal accents).
- **Pagination**: Use the shared `Pagination` component from `backoffice/src/components/ui/Pagination.tsx`.
- **Search/Filters**: Follow `PlatsPage` or `StockPage` filter bar layout.

## 2. Forms (Drawer)
- **Base Component**: `IngredientDrawer.tsx` or `PlatDrawer.tsx`.
- **Validation**: Inline validation for required fields (Client, Date, Slot, Table).
- **Table Selection**: Use the `available_tables` API action to populate the table dropdown based on selected date/time.

## 3. Status Badges
- `CONFIRMEE`: `bg-teal/10 text-teal` (Standard confirmed).
- `ANNULEE`: `bg-error/10 text-error` (Cancelled).
- `PRESENTE`: `bg-amber/10 text-amber` (Checked-in).
- `ABSENTE`: `bg-white/5 text-foreground-muted` (No-show).

## 4. API Service
- **Pattern**: `hrService.ts` or `platsService.ts`.
- **Methods**: `getReservations`, `createReservation`, `updateReservation`, `deleteReservation`.

## 5. WebSocket Integration
- **Pattern**: `KdsSocketManager.tsx` or `OrderingPage.tsx` usage of `useStaffWebSocket`.
- **Behavior**: Use `useEffect` to listen for `reservation_updated` events and trigger a list refetch or optimistic store update.
