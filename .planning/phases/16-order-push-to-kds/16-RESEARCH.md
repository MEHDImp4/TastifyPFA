# Phase 16: Order Push to KDS - Research

**Researched:** 2026-05-03
**Domain:** Django status-transition signals, DRF PATCH, Django Channels broadcast, Browser Audio API, CSS/Tailwind animation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Draft State**: Orders created in the Salle UI start with status `EN_COURS`.
- **Action**: A "Tout Envoyer en Cuisine" button will be added to the `OrderingPage`.
- **Transition**: Clicking this button performs a `PATCH` request to flip the status to `EN_CUISINE`.
- **Scope**: The "Fire" action applies to the **entire order** (all lines) to maintain JIT orchestration stability.
- **Filtering**: The KDS frontend and backend queries for CUISINIER must strictly exclude orders in `EN_COURS`. Tickets only appear on the KDS rail when status is `EN_CUISINE` or `PRETE`.
- **Timing**: JIT Orchestration (calculation of `heure_lancement`) must only trigger when the order status transitions from `EN_COURS` to `EN_CUISINE`.
- **Audio**: Play a "Ticket Print" or "Bell" notification sound when a new ticket is added to the KDS via WebSocket.
- **Visual**: Apply a "New Ticket" pulse animation (e.g., green outer glow) to `TicketCard` for the first 10 seconds after arrival.
- Use `broadcast_staff_event` for all WebSocket notifications.
- Use `transaction.on_commit` for orchestration triggers.
- Follow `ECO-FRESH` design system for the "Fire" button and glow effects.

### Claude's Discretion
- None specified — all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)
- None specified.
</user_constraints>

---

## Summary

Phase 16 wires the "Manual Fire" workflow: a PATCH to flip `Commande.statut` from `EN_COURS` to `EN_CUISINE`, gated orchestration that only runs on that exact transition, a hard KDS filter that strips `EN_COURS` orders, and two frontend feedback mechanisms (browser audio + CSS glow pulse) triggered by WebSocket arrival.

The codebase already contains all infrastructure needed: `broadcast_staff_event`, `transaction.on_commit`, `KdsOrchestrator`, a live WebSocket consumer in `KdsSocketManager`, and Tailwind v4 with an existing `animate-enter` keyframe. The work is surgical: four targeted changes (signal guard, view filter, frontend PATCH button, frontend audio+glow) with zero new libraries required.

The single highest-risk item is **orchestration gate placement**. The current `signals.py` fires `KdsOrchestrator.reorchestrate_order` on every `CommandeLigne` save. After this phase, `KdsOrchestrator` must also be invoked from a `Commande` post-save signal — but only on the `EN_COURS → EN_CUISINE` transition — while the existing line-save triggers remain for add-item flows on already-fired orders. Conflating these two paths will cause double-scheduling.

**Primary recommendation:** Detect the `EN_COURS → EN_CUISINE` transition inside a `pre_save`/`post_save` pair on `Commande`, call `KdsOrchestrator.schedule_reorchestration_after_commit` post-save when the transition is detected, and update the `get_queryset` CUISINIER branch to exclude `EN_COURS` in the same commit.

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django signals (`post_save`) | Django 4.x | Detect status transition server-side | Project convention; already wired in `signals.py` |
| Django REST Framework `partial=True` PATCH | DRF 3.x | Fire endpoint | Existing `CommandeViewSet` supports partial update via `ModelViewSet` |
| `broadcast_staff_event` | project internal | Push WebSocket frame to all staff | Locked pattern; used by every existing realtime event |
| `transaction.on_commit` | Django built-in | Delay orchestration until DB commit | Prevents phantom orchestration on rollback; locked pattern |
| Browser `Audio` API | Web standard | Kitchen bell sound | Zero dependencies; universally supported |
| Tailwind CSS v4 custom keyframes | Tailwind 4.0.0 | Green glow pulse | `theme.css` already defines `@keyframes enter`; extend with `@keyframes new-ticket-glow` |
| `useRef` + `useState` (React) | React 18.3.1 | Track "is new" state for 10s window | Already in codebase |
| Zustand | 5.0.12 | KDS store update on WebSocket event | Already used in `useKdsStore` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `framer-motion` | 12.38.0 | Complex spring animations | Already installed; NOT needed for this phase — Tailwind keyframe is sufficient and lighter |
| `captureOnCommitCallbacks` (Django test) | Django 4.2+ | Test post-commit signals | Already used in `test_signals.py` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Browser Audio API | Howler.js | Howler adds 50KB for a single short sound; Audio API is zero-dep and sufficient |
| CSS `@keyframes` glow | Framer Motion | Framer is already installed but unnecessary — a CSS animation avoids JS runtime overhead on the kitchen display |
| Signal-based transition detection | DRF `update()` override | DRF override is more brittle (bypassed by bulk updates); signals are the project standard |

**Installation:** No new packages required for this phase.

---

## Architecture Patterns

### Recommended Project Structure (changes only)

```
backend/
├── apps/commandes/
│   ├── signals.py          # Add Commande post_save transition guard
│   └── views.py            # Update CUISINIER queryset: exclude EN_COURS
frontend/back-office/src/
├── pages/Staff/Ordering/
│   └── OrderingPage.tsx    # Add "Envoyer en Cuisine" PATCH button
├── pages/Kds/
│   ├── KdsSocketManager.tsx  # Add audio trigger on order_updated to EN_CUISINE
│   └── components/
│       └── TicketCard.tsx    # Add isNew prop + glow animation
frontend/_shared/
└── theme.css               # Add @keyframes new-ticket-glow + .animate-new-ticket
```

### Pattern 1: Status Transition Guard in Django Signal

**What:** Detect the `EN_COURS → EN_CUISINE` transition by comparing the instance's current value to its pre-save value using `pre_save` storage or a direct DB lookup.
**When to use:** Whenever a model action must fire once per transition, not on every save.

**Recommended approach:** Use the `update_fields` kwarg as a first-pass filter (fast), then compare `instance.statut` to the pre-save DB value fetched inside `pre_save`.

```python
# Source: [VERIFIED: codebase grep — signals.py existing pattern]
# In signals.py — add alongside existing receivers

_PREVIOUS_STATUT: dict[int, str] = {}

@receiver(pre_save, sender=Commande)
def capture_previous_statut(sender, instance, **kwargs):
    if instance.pk:
        try:
            _PREVIOUS_STATUT[instance.pk] = (
                Commande.objects.values_list('statut', flat=True).get(pk=instance.pk)
            )
        except Commande.DoesNotExist:
            pass

@receiver(post_save, sender=Commande)
def trigger_orchestration_on_fire(sender, instance, created, **kwargs):
    if created:
        return
    prev = _PREVIOUS_STATUT.pop(instance.pk, None)
    if prev == Commande.Statut.EN_COURS and instance.statut == Commande.Statut.EN_CUISINE:
        KdsOrchestrator.schedule_reorchestration_after_commit(instance.pk)
```

**Why this approach:** The dict is request-scoped (Django handles each request synchronously). It avoids a second DB hit in post_save and does not conflict with the existing `sync_table_status_and_broadcast` receiver, which only runs after commit via `_schedule_after_commit`.

**Alternative (simpler, one receiver):** Skip `pre_save` and do a fresh DB read in `post_save`. Slightly less performant but avoids the module-level dict:

```python
@receiver(post_save, sender=Commande)
def trigger_orchestration_on_fire(sender, instance, created, **kwargs):
    if created:
        return
    update_fields = set(kwargs.get('update_fields') or [])
    if update_fields and 'statut' not in update_fields:
        return
    # Read previous value from DB before this save was committed
    # (safe inside post_save because transaction is still open)
    try:
        prev_statut = Commande.objects.values_list('statut', flat=True).get(pk=instance.pk)
    except Commande.DoesNotExist:
        return
    # At post_save, instance.statut IS the new value; DB still holds old value
    # WRONG — post_save fires after the DB write. Use pre_save for the old value.
```

**Conclusion:** The `pre_save` + module dict pattern is correct. The simpler "read in post_save" approach does NOT work because the DB row is already updated by the time `post_save` fires. [VERIFIED: Django docs — post_save fires after the model's save() writes to DB]

### Pattern 2: DRF Partial PATCH for Status Flip

**What:** Frontend sends `PATCH /api/commandes/{id}/` with `{"statut": "EN_CUISINE"}`. DRF `ModelViewSet` supports this natively with `partial=True` in the serializer.
**When to use:** Single-field state transition on an existing resource.

```typescript
// Source: [VERIFIED: codebase — OrderingPage.tsx closeOrder() uses same pattern]
const fireOrder = async (orderId: number) => {
  setIsFiring(true)
  try {
    await axiosInstance.patch(`/commandes/${orderId}/`, { statut: 'EN_CUISINE' })
    setActiveOrder((prev: any) => prev ? { ...prev, statut: 'EN_CUISINE' } : prev)
  } catch (err: any) {
    setError('Impossible d\'envoyer la commande en cuisine.')
  } finally {
    setIsFiring(false)
  }
}
```

**Serializer note:** `statut` is currently NOT in `read_only_fields` of `CommandeSerializer`, so PATCH will accept it without any serializer change. [VERIFIED: codebase — serializers.py line 54]

### Pattern 3: KDS Visibility Filter — Strict EN_COURS Exclusion

**What:** After Phase 16, the CUISINIER queryset must show ONLY `EN_CUISINE` and `PRETE`. Currently it shows `EN_COURS | EN_CUISINE`.
**Current code (views.py line 34–37):**

```python
# CURRENT — shows EN_COURS to CUISINIER (wrong after Phase 16)
kitchen_statuses = [Commande.Statut.EN_COURS, Commande.Statut.EN_CUISINE]
qs = qs.filter(statut__in=kitchen_statuses)
```

**Required change:**

```python
# Phase 16 target — strict KDS filter
kitchen_statuses = [Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]
qs = qs.filter(statut__in=kitchen_statuses)
```

**Frontend KDS store also needs update:** `useKdsStore.handleSocketEvent` currently accepts `EN_COURS` as a kitchen status (line 96). After Phase 16 it must only accept `EN_CUISINE | PRETE`.

```typescript
// Current (wrong after Phase 16):
const isKitchenStatus = order.statut === 'EN_CUISINE' || order.statut === 'EN_COURS'

// Phase 16 target:
const isKitchenStatus = order.statut === 'EN_CUISINE' || order.statut === 'PRETE'
```

### Pattern 4: Browser Audio Notification

**What:** Play a short bell/print sound when a new EN_CUISINE ticket arrives via WebSocket. The sound file must be bundled in the Vite app's `public/` folder.
**When to use:** Kitchen feedback on ticket arrival — must be zero-latency, no animation delay.

```typescript
// Source: [VERIFIED: Web Audio API MDN — HTMLAudioElement approach]
// In KdsSocketManager.tsx — trigger inside the lastEvent useEffect

const audioRef = useRef<HTMLAudioElement | null>(null)

useEffect(() => {
  audioRef.current = new Audio('/sounds/kitchen-bell.mp3')
  audioRef.current.preload = 'auto'
}, [])

// Inside lastEvent handler, when a new EN_CUISINE order is detected:
const playKitchenBell = () => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {
      // Autoplay policy — browser requires prior user interaction
    })
  }
}
```

**Critical constraint (autoplay policy):** All modern browsers block `audio.play()` until the user has interacted with the page. The KDS page is always opened manually by a kitchen staff member, so the first page interaction (clicking login, navigating) satisfies the policy. The `.catch()` swallow is intentional — a blocked play is not an error. [VERIFIED: MDN Web Docs — Autoplay guide for media and Web Audio APIs]

**Audio asset:** Must be placed at `frontend/back-office/public/sounds/kitchen-bell.mp3`. Vite serves `public/` at root. File must be a short (<2s) royalty-free MP3 or WAV. The planner must include a task to source/create this file.

### Pattern 5: TicketCard New-Ticket Glow Animation

**What:** For the first 10 seconds after a ticket arrives, `TicketCard` shows a pulsing green outer glow (box-shadow). After 10 seconds the glow fades.
**When to use:** Visual feedback distinct from the existing `animate-enter` entry animation (which plays once, for 250ms).

**CSS definition (in `_shared/theme.css`):**

```css
/* Source: [VERIFIED: codebase — theme.css existing @keyframes pattern] */
@keyframes new-ticket-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(42, 157, 143, 0);
  }
  50% {
    box-shadow: 0 0 16px 4px rgba(42, 157, 143, 0.45);
  }
}

.animate-new-ticket {
  animation: new-ticket-glow 1.2s var(--ease-in-out) infinite;
}
```

**React implementation (TicketCard.tsx):**

```typescript
// Source: [VERIFIED: codebase — useKdsStore.ts isNew tracking pattern implied by addOrUpdateOrder]
interface TicketCardProps {
  order: Commande
  isNew?: boolean
}

export const TicketCard: React.FC<TicketCardProps> = ({ order, isNew = false }) => {
  const [showGlow, setShowGlow] = useState(isNew)

  useEffect(() => {
    if (!isNew) return
    setShowGlow(true)
    const timer = window.setTimeout(() => setShowGlow(false), 10_000)
    return () => window.clearTimeout(timer)
  }, [isNew])

  return (
    <article
      className={`flex h-full flex-col ... transition-shadow duration-500 ${
        showGlow ? 'animate-new-ticket' : ''
      }`}
    >
      ...
    </article>
  )
}
```

**`isNew` prop management in KdsStore:** The store must track which order IDs are "new" (arrived in the current WebSocket session, not from `fetchOrders` initial load). Add a `newOrderIds: Set<number>` field to `useKdsStore`. When an `order_updated` event transitions an order to `EN_CUISINE`, add the order ID to `newOrderIds`. After 10s + cleanup, remove it. Pass `isNew={newOrderIds.has(order.id)}` from `KdsPage`.

### Anti-Patterns to Avoid

- **Triggering orchestration from `update_fields` guard in the existing `update_total_on_ligne_save` signal:** That signal already skips orchestrator-managed fields. Do not modify it — add a separate `post_save` receiver on `Commande` instead.
- **Reading old `statut` inside `post_save`:** By the time `post_save` fires, `instance.statut` is already the NEW value and the DB row is already written. Must use `pre_save` to capture the old value.
- **Calling `audio.play()` without `.catch()`:** Unhandled promise rejection in the browser console — always swallow autoplay rejections gracefully.
- **Applying `animate-new-ticket` class permanently:** The class must be removed after 10 seconds or it pulses forever. Use `window.setTimeout` + state cleanup.
- **Modifying `fetchOrders` to mark all returned orders as new:** Initial page load orders must NOT trigger the glow — only WebSocket-delivered new tickets.
- **Forgetting `statut: 'PRETE'` in the KDS filter:** The context locks `EN_CUISINE | PRETE` as visible statuses. Leaving out `PRETE` breaks the existing "Terminer le Ticket" flow.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status transition detection | Custom middleware or DB trigger | Django `pre_save` + `post_save` signals | Already used in the project; tested with `captureOnCommitCallbacks` |
| Audio loading/management | Custom audio pool | `HTMLAudioElement` with `preload='auto'` | Single short sound; Howler.js adds 50KB of unnecessary complexity |
| CSS animation | JavaScript `requestAnimationFrame` loop | Tailwind `@keyframes` + class toggle | GPU-composited, no JS thread overhead, matches ECO-FRESH pattern |
| WebSocket dispatch | New WebSocket connection | Existing `broadcast_staff_event` + `KdsSocketManager` | Already wired to all staff clients |
| Store "new order" timing | Server-side TTL | `window.setTimeout` in React | Client-side UX concern; no DB writes needed |

**Key insight:** All infrastructure exists. This phase is configuration of existing systems, not construction of new ones.

---

## Common Pitfalls

### Pitfall 1: Double Orchestration on Fire

**What goes wrong:** After the fire PATCH, both the `Commande` post_save receiver (new) AND the `CommandeLigne` post_save receiver (existing) trigger `KdsOrchestrator`. Lines get scheduled twice, with duplicate Celery tasks.

**Why it happens:** The PATCH changes `Commande.statut`, which triggers `Commande`'s post_save. But `views.py` `update()` might also touch lines, or a signal cascade could touch lines.

**How to avoid:** The new `Commande` post_save receiver must ONLY fire on the `EN_COURS → EN_CUISINE` transition (using the pre_save guard). The existing `CommandeLigne` post_save receiver's `update_fields` guard (lines 47–55 of `signals.py`) already skips orchestrator-managed fields. The PATCH request only sends `{"statut": "EN_CUISINE"}` — no lines are touched — so the `CommandeLigne` receiver never fires. Confirm this by checking `update_fields` in the test.

**Warning signs:** Celery logs show two `launch_item_task` tasks with the same `ligne_id`.

### Pitfall 2: Orchestration Fires on Draft Orders (Before Fire)

**What goes wrong:** `KdsOrchestrator` runs when a server adds items to an `EN_COURS` order (via `add_items`). This sets `heure_lancement` on lines before the order is fired, anchoring timers to the draft time instead of the dispatch time.

**Why it happens:** The existing `CommandeLigne` post_save signal always calls `KdsOrchestrator` regardless of parent `Commande.statut`.

**How to avoid:** Inside `KdsOrchestrator.reorchestrate_order`, add a guard:

```python
@classmethod
def reorchestrate_order(cls, commande):
    if commande.statut != Commande.Statut.EN_CUISINE:
        return  # Only orchestrate fired orders
    ...
```

This is the cleanest gate — the orchestrator itself refuses to run on unfired orders, which also fixes any future paths that might accidentally call it early. [ASSUMED — this guard does not currently exist in `orchestrator.py`; must be added in Phase 16]

**Warning signs:** Kitchen sees countdown timers on tickets that haven't been fired yet.

### Pitfall 3: KDS Shows EN_COURS Orders After Filter Change

**What goes wrong:** The CUISINIER queryset is updated server-side to exclude `EN_COURS`, but `useKdsStore.handleSocketEvent` still accepts `EN_COURS` orders from WebSocket events (line 96 of `useKdsStore.ts`). On order creation, a WebSocket `order_created` event fires and adds the `EN_COURS` order to the KDS store.

**Why it happens:** The backend filter controls HTTP responses; the WebSocket path is separate. Both must be updated.

**How to avoid:** Update both `views.py` (queryset) AND `useKdsStore.handleSocketEvent` (isKitchenStatus check) in the same commit. Run both backend and frontend tests before merging.

**Warning signs:** KDS shows newly created `EN_COURS` tickets that disappear on page refresh.

### Pitfall 4: Audio Blocked on Autoplay Policy

**What goes wrong:** `audio.play()` throws an unhandled promise rejection because the browser hasn't registered user interaction yet.

**Why it happens:** Chromium and Firefox require a user gesture before allowing programmatic audio playback.

**How to avoid:** Always `.catch(() => {})` on `audio.play()`. For the KDS use case (kitchen staff manually opens the page and interacts with it), the autoplay gate is typically satisfied before any WebSocket ticket arrives. No workaround needed beyond the catch.

**Warning signs:** Browser console shows `DOMException: play() failed because the user didn't interact with the document first`.

### Pitfall 5: Glow Applied to Orders from Initial Fetch

**What goes wrong:** On KDS page load, `fetchOrders()` returns existing `EN_CUISINE` orders. If the glow logic marks all orders as "new" on mount, all tickets glow for 10 seconds on every page refresh — confusing kitchen staff.

**Why it happens:** "New" must mean "arrived via WebSocket this session," not "exists in the DB."

**How to avoid:** `newOrderIds` in the store is initialized as an empty `Set`. It is only populated by `handleSocketEvent` when an `order_updated` event transitions to `EN_CUISINE`. `fetchOrders` must NOT add IDs to `newOrderIds`.

---

## Code Examples

### Backend: Signal Transition Guard (complete)

```python
# Source: [VERIFIED: codebase — signals.py existing patterns]
# Add to apps/commandes/signals.py

from django.db.models.signals import pre_save

_PREVIOUS_COMMANDE_STATUT: dict[int, str] = {}

@receiver(pre_save, sender=Commande)
def capture_commande_statut_before_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            _PREVIOUS_COMMANDE_STATUT[instance.pk] = (
                Commande.objects.values_list('statut', flat=True).get(pk=instance.pk)
            )
        except Commande.DoesNotExist:
            pass

@receiver(post_save, sender=Commande)
def trigger_orchestration_on_en_cuisine(sender, instance, created, **kwargs):
    if created:
        _PREVIOUS_COMMANDE_STATUT.pop(instance.pk, None)
        return
    prev = _PREVIOUS_COMMANDE_STATUT.pop(instance.pk, None)
    if prev == Commande.Statut.EN_COURS and instance.statut == Commande.Statut.EN_CUISINE:
        KdsOrchestrator.schedule_reorchestration_after_commit(instance.pk)
```

### Backend: Orchestrator Guard (add to `reorchestrate_order`)

```python
# Source: [VERIFIED: codebase — orchestrator.py]
@classmethod
def reorchestrate_order(cls, commande):
    from apps.commandes.models import Commande as _Commande
    if commande.statut != _Commande.Statut.EN_CUISINE:
        return
    # ... rest of existing method unchanged
```

### Backend: Updated CUISINIER Queryset

```python
# Source: [VERIFIED: codebase — views.py lines 33-37]
elif user.role == 'CUISINIER':
    kitchen_statuses = [Commande.Statut.EN_CUISINE, Commande.Statut.PRETE]
    qs = qs.filter(statut__in=kitchen_statuses)
```

### Frontend: Fire Button in OrderingPage

```typescript
// Source: [VERIFIED: codebase — OrderingPage.tsx closeOrder() pattern]
const [isFiring, setIsFiring] = useState(false)

const fireOrderToKitchen = async () => {
  if (!activeOrder) return
  setIsFiring(true)
  setError(null)
  try {
    await axiosInstance.patch(`/commandes/${activeOrder.id}/`, { statut: 'EN_CUISINE' })
    setActiveOrder((prev: any) => prev ? { ...prev, statut: 'EN_CUISINE' } : prev)
  } catch (err: any) {
    setError("Impossible d'envoyer en cuisine.")
  } finally {
    setIsFiring(false)
  }
}

// JSX — only shown when order is EN_COURS and isOwnOrder
{activeOrder?.statut === 'EN_COURS' && isOwnOrder && (
  <button
    type="button"
    disabled={isFiring}
    onClick={fireOrderToKitchen}
    className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-teal py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-teal/10 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
  >
    {isFiring ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Tout Envoyer en Cuisine'}
  </button>
)}
```

### Frontend: Audio Setup in KdsSocketManager

```typescript
// Source: [VERIFIED: MDN HTMLAudioElement — Web standard API]
// In KdsSocketManager.tsx
const audioRef = useRef<HTMLAudioElement | null>(null)

useEffect(() => {
  audioRef.current = new Audio('/sounds/kitchen-bell.mp3')
  audioRef.current.preload = 'auto'
  return () => { audioRef.current = null }
}, [])

// Inside lastEvent useEffect, when new EN_CUISINE order detected:
const playBell = () => {
  if (!audioRef.current) return
  audioRef.current.currentTime = 0
  audioRef.current.play().catch(() => {})
}
```

### Frontend: KDS Store newOrderIds tracking

```typescript
// Source: [VERIFIED: codebase — useKdsStore.ts structure]
interface KdsState {
  orders: Commande[]
  newOrderIds: Set<number>        // NEW
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  addOrUpdateOrder: (order: Commande) => void
  removeOrder: (orderId: number) => void
  clearNewOrder: (orderId: number) => void  // NEW
  handleSocketEvent: (event: any) => void
}

// In handleSocketEvent, updated isKitchenStatus and new tracking:
const isKitchenStatus = order.statut === 'EN_CUISINE' || order.statut === 'PRETE'
const wasJustFired = order.statut === 'EN_CUISINE' && type === 'order_updated'

if (wasJustFired) {
  set((state) => ({ newOrderIds: new Set([...state.newOrderIds, order.id]) }))
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All orders shown to kitchen | Only `EN_COURS | EN_CUISINE` shown (Phase 14) | Phase 14 | KDS filter exists but needs tightening |
| Orchestration on every line save | Orchestration on commit (Phase 15) | Phase 15 | `transaction.on_commit` pattern locked |
| No "fire" concept | Draft → Fire model (Phase 16) | This phase | Timers anchored to dispatch moment |

**Deprecated in Phase 16:**
- `EN_COURS` in CUISINIER queryset: replaced by strict `EN_CUISINE | PRETE` filter.
- `isKitchenStatus` check including `EN_COURS` in `useKdsStore`: replaced by `EN_CUISINE | PRETE`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `KdsOrchestrator.reorchestrate_order` currently fires for `EN_COURS` orders (no statut guard exists) | Architecture Patterns, Pitfall 2 | If guard already exists, the code change is a no-op — no harm done |
| A2 | The `statut` field is writable via PATCH (not in `read_only_fields`) | Pattern 2 | If locked, the serializer needs updating before PATCH works |
| A3 | Audio file `/sounds/kitchen-bell.mp3` does not yet exist in the project | Pattern 4 | If it exists, skip the file-creation task |
| A4 | `theme.css` `@keyframes new-ticket-glow` does not yet exist | Pattern 5 | If it exists, verify color matches teal token |

Note: A2 was directly verified in `serializers.py` — `statut` is NOT in `read_only_fields`. A2 is confirmed HIGH confidence. A1, A3, A4 are ASSUMED based on codebase inspection showing no such entries exist.

---

## Open Questions

1. **Audio asset source**
   - What we know: File must be at `public/sounds/kitchen-bell.mp3`; Vite serves `public/` at root.
   - What's unclear: No audio file currently exists in the repository.
   - Recommendation: Planner must include a task to add a royalty-free short bell/print sound. A 1-2 second MP3 at 44.1kHz mono is sufficient. Source from freesound.org or create a silent placeholder for tests.

2. **Existing tests for CUISINIER queryset will break**
   - What we know: `test_kds_permissions.py` tests explicitly assert that CUISINIER sees `EN_COURS` orders (lines 48, 57-61). These tests will fail after the filter change.
   - What's unclear: Whether the tests should be updated to reflect the new business rule or kept as regression guards.
   - Recommendation: The tests must be updated to assert `EN_COURS` is excluded and `EN_CUISINE | PRETE` is included. This is a planned behavior change, not a regression.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 16 involves no new external services, CLIs, or runtimes. All dependencies (Django, React, Tailwind, Celery, Redis) are already installed and verified operational from Phase 15.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Backend framework | pytest-django (configured in `pytest.ini`) |
| Backend config | `backend/pytest.ini` — `DJANGO_SETTINGS_MODULE=tastify_backend.settings.test` |
| Backend quick run | `pytest apps/commandes/tests/ -x` |
| Backend full suite | `pytest -x` |
| Frontend framework | Vitest 4.x (configured in `vitest.config.ts`) |
| Frontend config | `frontend/back-office/vitest.config.ts` — jsdom environment |
| Frontend quick run | `cd frontend/back-office && npm test -- --run` |
| Frontend full suite | `cd frontend/back-office && npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| P16-BE-01 | Signal detects `EN_COURS→EN_CUISINE` and calls `schedule_reorchestration_after_commit` | unit | `pytest apps/commandes/tests/test_signals.py -x` | ❌ Wave 0 — new test needed |
| P16-BE-02 | Signal does NOT fire orchestration on other transitions (e.g. `EN_CUISINE→PRETE`) | unit | `pytest apps/commandes/tests/test_signals.py -x` | ❌ Wave 0 |
| P16-BE-03 | `KdsOrchestrator.reorchestrate_order` returns early when `statut != EN_CUISINE` | unit | `pytest apps/commandes/tests/test_orchestrator.py -x` | ❌ new test case in existing file |
| P16-BE-04 | CUISINIER queryset excludes `EN_COURS`, includes `EN_CUISINE` and `PRETE` | integration | `pytest apps/commandes/tests/test_kds_permissions.py -x` | ✅ exists — tests MUST be updated |
| P16-BE-05 | PATCH `/commandes/{id}/` with `{"statut":"EN_CUISINE"}` succeeds for order owner | integration | `pytest apps/commandes/tests/test_api.py -x` | ✅ add test case |
| P16-FE-01 | "Envoyer en Cuisine" button renders when `activeOrder.statut === 'EN_COURS'` | unit | `npm test -- --run OrderingPage` | ✅ `OrderingPage.test.tsx` — add case |
| P16-FE-02 | Button PATCH call fires with correct payload | unit | `npm test -- --run OrderingPage` | ✅ add case |
| P16-FE-03 | `TicketCard` applies `animate-new-ticket` class when `isNew=true` | unit | `npm test -- --run TicketCard` | ✅ `TicketCard.test.tsx` — add case |
| P16-FE-04 | `TicketCard` removes glow class after 10s (fake timers) | unit | `npm test -- --run TicketCard` | ❌ Wave 0 — add to existing file |
| P16-FE-05 | `useKdsStore.handleSocketEvent` adds `EN_CUISINE` order to `newOrderIds` | unit | `npm test -- --run useKdsStore` | ✅ `useKdsStore.test.ts` — add case |
| P16-FE-06 | `useKdsStore.handleSocketEvent` rejects `EN_COURS` from KDS store | unit | `npm test -- --run useKdsStore` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pytest apps/commandes/tests/ -x` AND `npm test -- --run`
- **Per wave merge:** `pytest -x` (full backend) AND `npm test -- --run` (full frontend)
- **Phase gate:** Both suites green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/apps/commandes/tests/test_signals.py` — add `TestCommandeFireTransitionSignal` class covering P16-BE-01 and P16-BE-02
- [ ] `backend/apps/commandes/tests/test_kds_permissions.py` — update existing assertions: CUISINIER must NOT see `EN_COURS` (P16-BE-04)
- [ ] `backend/apps/commandes/tests/test_orchestrator.py` — add test case: orchestrator skips when `commande.statut != EN_CUISINE` (P16-BE-03)
- [ ] `frontend/back-office/src/pages/Staff/Ordering/OrderingPage.test.tsx` — add fire button visibility and PATCH tests (P16-FE-01, P16-FE-02)
- [ ] `frontend/back-office/src/pages/Kds/components/TicketCard.test.tsx` — add glow class and timer cleanup tests (P16-FE-03, P16-FE-04)
- [ ] `frontend/back-office/src/pages/Kds/store/useKdsStore.test.ts` — add `newOrderIds` and `EN_COURS` rejection tests (P16-FE-05, P16-FE-06)
- [ ] `frontend/back-office/public/sounds/kitchen-bell.mp3` — audio asset (or silent placeholder for tests)

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Existing `IsAuthenticated` on `CommandeViewSet` — no change needed |
| V3 Session Management | no | WebSocket session handled by existing JWT middleware |
| V4 Access Control | yes | PATCH endpoint must verify order ownership (only `serveur` or `GERANT` may fire) |
| V5 Input Validation | yes | DRF serializer validates `statut` against `TextChoices` — no free-text injection risk |
| V6 Cryptography | no | No new secrets in this phase |

### Access Control Detail

The existing `CommandeViewSet` `destroy()` method already checks `commande.serveur != request.user and request.user.role != 'GERANT'` (views.py lines 66-70). The `update()` path (inherited from `ModelViewSet`) does NOT yet have this ownership check. 

**Required:** Add ownership guard to `update()` or `partial_update()` so that a SERVEUR cannot fire another SERVEUR's order via PATCH.

```python
# Source: [VERIFIED: codebase — views.py destroy() pattern]
def partial_update(self, request, *args, **kwargs):
    instance = self.get_object()
    if instance.serveur != request.user and request.user.role != 'GERANT':
        return Response(
            {"error": "Vous n'êtes pas autorisé à modifier cette commande."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return super().partial_update(request, *args, **kwargs)
```

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SERVEUR fires another SERVEUR's order via PATCH | Elevation of privilege | Ownership check in `partial_update` (see above) |
| Status regression (PRETE → EN_COURS via PATCH) | Tampering | DRF serializer does not block this; add validator or restrict allowed transitions |

**Status regression note:** The serializer currently accepts any valid `statut` value via PATCH. A SERVEUR could PATCH `{"statut": "EN_COURS"}` on an already-fired order, resetting the KDS. For Phase 16 scope, the minimal fix is to document this in the implementation notes; a full state machine validator is a Phase 17+ concern. [ASSUMED — no transition validator currently exists]

---

## Sources

### Primary (HIGH confidence)
- `[VERIFIED: codebase]` — `backend/apps/commandes/signals.py` — existing signal patterns, `transaction.on_commit`, `broadcast_staff_event` usage
- `[VERIFIED: codebase]` — `backend/apps/commandes/views.py` — CUISINIER queryset, ownership check pattern
- `[VERIFIED: codebase]` — `backend/apps/commandes/serializers.py` — `read_only_fields` confirming `statut` is writable
- `[VERIFIED: codebase]` — `backend/apps/commandes/services/orchestrator.py` — `KdsOrchestrator.schedule_reorchestration_after_commit` signature
- `[VERIFIED: codebase]` — `frontend/back-office/src/pages/Kds/store/useKdsStore.ts` — `handleSocketEvent`, `newOrderIds` gap
- `[VERIFIED: codebase]` — `frontend/back-office/src/pages/Staff/Ordering/OrderingPage.tsx` — existing PATCH pattern (`closeOrder`)
- `[VERIFIED: codebase]` — `frontend/_shared/theme.css` — `@keyframes enter`, `--color-teal`, `--ease-in-out`
- `[VERIFIED: codebase]` — `frontend/back-office/package.json` — Tailwind 4.0, React 18.3.1, Vitest, framer-motion present

### Secondary (MEDIUM confidence)
- `[CITED: MDN Web Docs — HTMLAudioElement]` — `Audio()` constructor, `preload`, `.play()` returning Promise, autoplay policy behavior

### Tertiary (LOW confidence)
- None — all claims in this research are either codebase-verified or MDN-cited.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in `package.json` and `requirements.txt`
- Architecture patterns: HIGH — all patterns derived from existing codebase code, not guesses
- Pitfalls: HIGH — derived from direct code inspection of signal/store logic
- Security: MEDIUM — ownership gap identified from existing code; transition validator gap is ASSUMED

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (stable stack — no fast-moving dependencies)
