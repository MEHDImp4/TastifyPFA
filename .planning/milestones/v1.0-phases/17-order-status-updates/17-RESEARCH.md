# Phase 17: Order Status Updates - Research

**Researched:** 2026-05-04
**Domain:** DRF ViewSets, WebSocket Real-time, Staff Notifications, Audio API
**Confidence:** HIGH

---

## Summary
Phase 17 enables the feedback loop from Kitchen to Salle. It introduces the ability for chefs to mark individual items or entire tickets as ready, triggering real-time WebSocket broadcasts that update the Salle UI (Ordering and Map views) and notify servers via audio/visual cues.

The infrastructure for WebSockets (`broadcast_staff_event`) is already operational and used for `order_created` and `order_updated` events. The KDS already has a `KdsSocketManager` and `useKdsStore` that handle these events. The work involves extending this pattern to the Salle-side UI.

---

## Tech Stack (Verified)
- **Backend**: Django REST Framework, Django Channels.
- **Frontend**: React (Vite), Zustand, Lucide-React.
- **WebSocket**: `@shared/websocket/WebSocketProvider` and `useStaffWebSocket`.

---

## Proposed Architecture

### 1. Backend: CommandeLigne Access
Currently, there is no direct endpoint to update a `CommandeLigne`. We will add a `CommandeLigneViewSet` to allow PATCHing the `statut` field.

**Endpoint**: `PATCH /api/commandelignes/{id}/`
**Payload**: `{"statut": "PRET"}`
**Permissions**: 
- `CUISINIER`: Allowed to change status to `EN_PREPARATION` or `PRET`.
- `SERVEUR`: Allowed to change status to `SERVI` (if it was `PRET`).
- `GERANT`: Full access.

### 2. Backend: Order Completion action
Marking an entire order as `PRETE` should be a single action. We can use the existing `CommandeViewSet.partial_update` with `{"statut": "PRETE"}`.

### 3. Frontend: KDS Interactions
- **Line Ready**: Add a checkmark button next to each line in `TicketCard`.
- **Order Ready**: Complete the "Terminer le Ticket" button logic.

### 4. Frontend: Salle Real-time updates
- **OrderingPage**: Use `useStaffWebSocket` to listen for `order_updated`. Update local `activeOrder` state if the ID matches.
- **MapView**: Use `useStaffWebSocket` to trigger a silent `fetchTables()` when any order is updated.
- **Notification**: Add a notification sound (e.g., `salle-bell.mp3`) to the Salle UI.

---

## Standard Patterns

### Pattern 1: CommandeLigne ViewSet
```python
class CommandeLigneViewSet(viewsets.GenericViewSet, mixins.UpdateModelMixin):
    queryset = CommandeLigne.objects.all()
    serializer_class = CommandeLigneSerializer
    permission_classes = [IsAuthenticated, IsCuisinierOrGerant | IsServeurOrGerant]

    def partial_update(self, request, *args, **kwargs):
        # Add role-based status transition logic here
        return super().partial_update(request, *args, **kwargs)
```

### Pattern 2: WebSocket Listener in Salle
```typescript
const { lastEvent } = useStaffWebSocket();

useEffect(() => {
  if (lastEvent?.type === 'order_updated' && lastEvent.payload.order.id === activeOrder.id) {
    setActiveOrder(lastEvent.payload.order);
    if (lastEvent.payload.order.statut === 'PRETE') {
      playNotificationSound();
    }
  }
}, [lastEvent]);
```

---

## Risks & Pitfalls
- **Risk**: WebSocket event loop. Updating state from a socket event shouldn't trigger another broadcast. (Backend signals already handle this via `_schedule_after_commit` and logic guards).
- **Pitfall**: Audio autoplay policies. Servers must interact with the `OrderingPage` before sounds can play.
- **Optimization**: The full order snapshot is broadcasted on every line change. While heavy, it ensures Salle is always in sync without complex delta merges.

---

## Research Tasks Complete
- [x] Verified `CommandeLigneSerializer` allows `statut` updates.
- [x] Verified `sync_table_status_and_broadcast` signal handles `order_updated` broadcasts.
- [x] Verified `useStaffWebSocket` is available for all staff pages.
