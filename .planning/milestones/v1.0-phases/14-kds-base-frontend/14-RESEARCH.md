# Phase 14 Research: KDS Base Frontend

## 1. Backend Permissions & API Updates
- **File:** `backend/apps/commandes/views.py`
- **Logic:** Currently, `get_queryset` filters by `serveur=user` for non-GERANTs. We need to allow `CUISINIER` to see all orders when filtering by `statut`.
- **Permission Class:** Add `IsCuisinierOrGerant` to `CommandeViewSet.permission_classes`.
- **Queryset Logic:**
  ```python
  if user.role == 'CUISINIER':
      # Cuisinier sees all active orders for the kitchen
      qs = qs.filter(statut=Commande.Statut.EN_CUISINE)
  elif user.role != 'GERANT':
      # Serveur still only sees their own
      qs = qs.filter(serveur=user)
  ```

## 2. Frontend Horizontal Scroll
- **Tailwind Classes:**
  - Container: `flex overflow-x-auto h-full gap-4 pb-4 px-4 scrollbar-hide snap-x snap-mandatory`
  - Ticket: `flex-none w-[320px] snap-start h-full flex flex-col`
- **Mouse Wheel Logic:** Add a simple `onWheel` listener to the container to translate vertical scroll to horizontal scroll.

## 3. Zustand Store (`useKdsStore`)
- **State:** `orders: Commande[]`, `isLoading: boolean`.
- **Actions:**
  - `fetchOrders()`: Calls `api.get('/commandes/?statut=EN_CUISINE')`.
  - `addOrder(order)`: Pushes to the front of the array (LIFO).
  - `updateOrder(order)`: Replaces the existing order in the array.
  - `removeOrder(orderId)`: Removes order when it leaves the kitchen (status change).
- **WS Integration:** The existing `WebSocketProvider` will dispatch these actions when it receives `order_created` or `order_updated` events with `statut="EN_CUISINE"`.

## 4. Performance-Optimized Timer
- **Concept:** A single `useKdsTimer` hook that updates a `now` state every 1 minute.
- **Component:** `KdsTimer` component that calculates `now - created_at` and displays it.
- **Color Coding:** 
  - < 10m: Text Green
  - 10-20m: Text Orange
  - > 20m: Text Red + Pulsing animation.

## 5. UI Components (Lean Production)
- **TicketCard:**
  - Large Table ID header.
  - Scrollable item list to prevent ticket overflow.
  - Large quantities in a badge.
  - Prominent "Notes" section in Orange.
- **Layout:** Use `h-[calc(100vh-theme(spacing.16))]` for the main rail to fill the screen below the header.

## 6. Implementation Plan
- **Step 1:** Backend permissions and viewset update.
- **Step 2:** `useKdsStore` and WebSocket wiring.
- **Step 3:** KDS UI Shell and Horizontal Rail.
- **Step 4:** Ticket Card and Timer components.
