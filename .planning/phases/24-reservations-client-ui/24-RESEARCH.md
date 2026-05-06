# Phase 24: Reservations Client UI — Research

**Researched:** 2026-05-06
**Domain:** React Vite SPA routing, multi-step wizard, SVG table map reuse, DRF custom action
**Confidence:** HIGH

---

## Summary

Phase 24 adds a booking flow inside the Portail Client SPA. The backend (Phase 23) is complete: `POST /api/reservations/` is live and the `is_table_available` service exists. The frontend starting point is a single-file `App.tsx` with no routing — the SPA renders a placeholder welcome card after login.

The plan has three distinct deliverables: (1) a new `GET /api/reservations/available_tables/` custom DRF action that returns only tables matching the requested slot, (2) `react-router-dom` routing scaffolded into `portail/App.tsx`, and (3) a 3-step wizard (`ReservationWizard`) built from three page components that share wizard state via a local React context.

The `TableMap` + `TableItem` components from `app/frontend/shared/components/map/` are ready to reuse. They accept a `tables: Table[]` prop and an `onTableClick` handler. The only adaptation needed for the booking wizard is setting `isEditMode={false}` (already the default) and interpreting `onTableClick` as "select this table" instead of "open ordering page". `framer-motion` is a peer dependency of `TableItem` — it must be added to the portail's `package.json`.

**Primary recommendation:** Add `react-router-dom`, `framer-motion`, and a `vitest` test stack to `portail/package.json`. Scaffold routing. Build a three-page wizard sharing state via `WizardContext`. Add one new DRF `@action` to `ReservationViewSet` for available-table lookup.

---

## Project Constraints (from CLAUDE.md)

- No trivial comments. Self-documenting code only. Comments explain WHY, never WHAT.
- Auto-commit after every successful change.
- `dashboard.html` must be updated after every change/commit.
- `docs/brain/00_Meta/FILE_MAP.md` must be kept in sync.
- Always read `DESIGN.md` before UI changes. Strict adherence to Eco-Fresh design system.
- No `git push` without explicit permission.
- Windows PowerShell environment: use `;` for command chaining, not `&&`.
- Test-driven delivery: write validation tests alongside features.
- Use `npx @claude-flow/cli@latest` for swarm coordination when needed.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Available-table lookup | API / Backend | — | Overlap check requires DB access; cannot run client-side |
| Wizard state (date/time/guests/table) | Browser / Client | — | Ephemeral form state; lives in a React context, never persisted |
| Reservation creation | API / Backend | — | Transactional `create_reservation` service enforces integrity |
| Table visual display | Browser / Client | — | `TableMap` is an SVG component; purely presentational |
| JWT authentication | Frontend Server (proxy) | API | Token stored in Zustand + localStorage; refreshed via axiosInstance interceptor |
| Routing | Browser / Client | — | SPA with `BrowserRouter`; no SSR |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router-dom | `^7.5.3` (latest) | SPA routing, `BrowserRouter`, `Routes`, `Route` | Used by backoffice; same version family [VERIFIED: npm registry] |
| framer-motion | `^12.38.0` | Animation for `TableItem.tsx` (already imported in shared) | Required by existing shared component; already in backoffice [VERIFIED: codebase] |
| vitest | `^4.1.5` | Unit/component testing | Same version as backoffice; standard project pattern [VERIFIED: codebase] |
| @testing-library/react | `^16.3.2` | React component testing | Used in backoffice [VERIFIED: codebase] |
| @testing-library/jest-dom | `^6.9.1` | DOM matchers | Used in backoffice [VERIFIED: codebase] |
| jsdom | `^29.1.0` | Test browser environment | Used in backoffice [VERIFIED: codebase] |

> **Note on react-router-dom:** Backoffice pins `^6.30.3` but the registry latest is `7.5.3`. Use `^6.30.3` to match the existing in-tree version exactly — mixing v6 and v7 across frontends is not a problem since they are separate packages.json, but consistency simplifies future upgrades. [VERIFIED: npm registry shows both 6.x and 7.x; backoffice pins 6.x]

**Installation (portail):**
```bash
cd app/frontend/portail ; npm install react-router-dom framer-motion
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @types/react-router-dom
```

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | `^1.11.0` | Icons | Already in portail; use for wizard step indicators and buttons |
| zustand | `^5.0.12` | Auth store | Already in portail; no new store needed |
| axios (via axiosInstance) | `^1.15.2` | API calls | Shared interceptor handles JWT; already in portail |

### Date/Time Input

No date-picker library exists in the project. The wizard's Step 1 uses native `<input type="date">` and `<input type="time">`. This is correct for the project's current complexity. Avoid adding a third-party date-picker unless the UX requirement explicitly demands one.

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| native `<input type="date">` | react-datepicker | No extra dependency; native inputs respect mobile OS pickers; sufficient for this phase |

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Portail Client SPA, port 3000/3003)
│
├─ BrowserRouter
│   ├─ /login              → LoginRoute (reuse Login shared component)
│   ├─ /                   → redirect → /reservations
│   └─ /reservations/*     → ReservationWizardShell
│        ├─ step 1: /reservations/new        → StepDateTime
│        ├─ step 2: /reservations/table      → StepTableSelect
│        └─ step 3: /reservations/confirm    → StepConfirm
│
├─ WizardContext (React.createContext)
│   └─ shared state: { date, heure_debut, heure_fin, nombre_personnes, selectedTable }
│
└─ axiosInstance (shared, JWT interceptor)
    │
    ▼
Vite proxy /api → http://backend:8000
    │
    ├─ GET  /api/reservations/available_tables/?date=&heure_debut=&heure_fin=&nombre_personnes=
    │   └─ ReservationViewSet @action → filters Table.objects.active() by slot + capacity
    │
    └─ POST /api/reservations/
        └─ create_reservation() service (transactional, overlap-safe)
```

### Recommended Project Structure (portail/src)

```
src/
├── App.tsx                          # BrowserRouter + routes (replaces current placeholder)
├── main.tsx                         # unchanged
├── index.css                        # unchanged
├── vite-env.d.ts                    # unchanged
└── pages/
    └── Reservations/
        ├── WizardContext.tsx         # createContext + provider, wizard state type
        ├── ReservationWizardShell.tsx # layout shell, step progress indicator, outlet
        ├── StepDateTime.tsx          # Step 1: date, heure_debut, heure_fin, nombre_personnes
        ├── StepTableSelect.tsx       # Step 2: TableMap with available tables
        ├── StepConfirm.tsx           # Step 3: summary + submit
        └── useReservationApi.ts      # API calls: fetchAvailableTables, createReservation
```

### Pattern 1: WizardContext for Cross-Step State

**What:** A React context holds the wizard's accumulated form data. Each step reads from and writes to the context. No URL parameters carry data between steps (avoids deep-link complexity for a client booking flow).

**When to use:** Multi-step flows where steps are sequential and data accumulates.

```typescript
// src/pages/Reservations/WizardContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react'
import { Table } from '@shared/types/tables'

interface WizardState {
  date: string           // 'YYYY-MM-DD'
  heure_debut: string    // 'HH:MM'
  heure_fin: string      // 'HH:MM'
  nombre_personnes: number
  selectedTable: Table | null
}

interface WizardContextValue {
  state: WizardState
  setDateTime: (fields: Pick<WizardState, 'date' | 'heure_debut' | 'heure_fin' | 'nombre_personnes'>) => void
  setTable: (table: Table) => void
  reset: () => void
}

const WizardContext = createContext<WizardContextValue | null>(null)

export const useWizard = () => {
  const ctx = useContext(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside WizardProvider')
  return ctx
}
```

### Pattern 2: DRF `@action` for Available Tables

**What:** A custom read-only action on `ReservationViewSet` that accepts `date`, `heure_debut`, `heure_fin`, `nombre_personnes` as query params and returns active tables whose capacity meets the guest count AND which are available (no conflicting reservation).

**Why not a separate view:** Keeps reservation domain logic in one viewset; matches DRF router conventions.

```python
# app/backend/apps/reservations/views.py
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.tables.models import Table
from apps.tables.serializers import TableSerializer
from apps.reservations.services import is_table_available

class ReservationViewSet(viewsets.ModelViewSet):
    ...

    @action(detail=False, methods=['get'], url_path='available_tables')
    def available_tables(self, request):
        date = request.query_params.get('date')
        heure_debut = request.query_params.get('heure_debut')
        heure_fin = request.query_params.get('heure_fin')
        nombre_personnes = request.query_params.get('nombre_personnes', 1)

        # Input validation belongs here — return 400 on missing/invalid params
        tables = Table.objects.active().filter(capacite__gte=int(nombre_personnes))
        available = [
            t for t in tables
            if is_table_available(
                table_id=t.pk,
                date_reservation=date,
                heure_debut=heure_debut,
                heure_fin=heure_fin,
            )
        ]
        return Response(TableSerializer(available, many=True).data)
```

**Endpoint:** `GET /api/reservations/available_tables/?date=2026-05-10&heure_debut=19:00&heure_fin=21:00&nombre_personnes=3`

**Response shape:** Array of `TableSerializer` objects (same shape as `/api/tables/`):
```json
[
  { "id": 2, "numero": 2, "capacite": 4, "statut": "LIBRE", "statut_effectif": "LIBRE", "pos_x": 220.0, "pos_y": 100.0, "est_active": true, ... }
]
```

### Pattern 3: TableMap Reuse (Read-Only Mode)

`TableMap` from `@shared/components/map/TableMap` is already abstracted. For the booking wizard Step 2:
- Pass `isEditMode={false}` (default — drag is disabled).
- Pass `onTableClick` as the "select this table" handler.
- Pass only the *available* tables (from `available_tables` endpoint) so unavailable tables are simply absent.
- Highlight selected table: overlay a selection ring. `TableItem` does not natively support a "selected" state — add a `selectedTableId?: number` prop to a local wrapper or pass a pre-modified tables array with a sentinel status. The cleanest approach is a thin `BookingTableMap` wrapper that adds a `selectedTableId` prop and renders a `<circle>` / `<rect>` selection ring in a separate SVG layer.

**Important:** Do NOT modify `TableMap.tsx` or `TableItem.tsx` — they live in `shared/` and are used by the staff app. Wrap them.

### Pattern 4: BrowserRouter Setup (matching backoffice)

```tsx
// portail/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <AppErrorBoundary appLabel="Le portail client">
      <AuthBootstrap>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<ClientLoginRoute />} />
            <Route element={<ProtectedClientShell />}>
              <Route index element={<Navigate to="/reservations/new" replace />} />
              <Route path="/reservations/*" element={<ReservationWizardShell />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthBootstrap>
    </AppErrorBoundary>
  )
}
```

### Anti-Patterns to Avoid

- **Modifying shared components:** `TableMap.tsx` and `TableItem.tsx` serve the staff app. Never edit them for Phase 24 — create thin wrappers.
- **Storing wizard state in URL params:** Creates deep-link complexity. Use WizardContext.
- **Calling `POST /api/reservations/` with `statut` field:** The serializer will reject it for non-staff users (CR-01). Only send `table`, `date_reservation`, `heure_debut`, `heure_fin`, `nombre_personnes`, and optionally `notes`.
- **Passing `nombre_personnes` as a string to the backend:** DRF expects an integer. Always `parseInt()` before sending.
- **Using `transition: all`:** DESIGN.md explicitly forbids it. Specify `transform` and `opacity` only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Client-side availability check | Custom overlap logic in React | `GET /api/reservations/available_tables/` | Overlap logic is complex (midnight wrap, 15-min buffer, multi-day windows). Already implemented server-side in `is_table_available`. |
| JWT refresh | Custom interceptor | `axiosInstance` from `@shared/auth/axiosInstance` | Already handles 401 → refresh → retry queue. |
| Auth state | Local useState | `useAuthStore` from `@shared/auth/useAuthStore` | Zustand store with localStorage persistence and rehydration guard. |
| Date/time validation | Custom regex | native `<input type="date/time">` constraints + backend validation | Backend `clean()` and serializer catch invalid ranges. |

---

## Key Facts About the Phase 23 API

### Exact Serializer Fields (POST /api/reservations/)

```
Required: table (integer FK), date_reservation (YYYY-MM-DD), heure_debut (HH:MM:SS),
          heure_fin (HH:MM:SS), nombre_personnes (integer)
Optional: notes (string, default "")
Forbidden for CLIENT role: statut (raises 400 if sent)
Read-only: id, client, created_at, updated_at
```

### Validation Rules Enforced by Backend

1. `heure_fin` must be after `heure_debut`.
2. `nombre_personnes` must not exceed `table.capacite`.
3. No active reservation overlap including 15-minute cleanup buffer (`RESERVATION_CLEANUP_BUFFER = timedelta(minutes=15)`).
4. Midnight-wrapping windows handled correctly (datetime comparison, not time comparison).

### Statut Choices

```
CONFIRMEE  (default, set automatically on client create)
ANNULEE    (client can PATCH to this; only allowed status change for CLIENT role)
PRESENTE   (staff only)
ABSENTE    (staff only)
```

### `is_table_available` Signature

```python
def is_table_available(
    *,
    table_id: int,
    date_reservation: str | date,
    heure_debut: str | time,
    heure_fin: str | time,
    exclude_reservation_id: int | None = None,
) -> bool
```

All keyword-only. Called internally by the model's `has_active_conflict()`. The `available_tables` action will call it per table.

### `Table` Type Shape (frontend)

From `@shared/types/tables`:
```typescript
interface Table {
  id: number; numero: number; capacite: number;
  statut: TableStatus;  // 'LIBRE' | 'OCCUPEE' | 'RESERVEE' | 'ENCAISSEMENT'
  pos_x: number; pos_y: number;
  est_active: boolean; created_at: string; updated_at: string;
}
```

`TableSerializer` also returns `statut_effectif` (same string union) — include it in a `TableWithEffectif` type extension in the portail if the wizard needs to show the real-time status.

---

## Common Pitfalls

### Pitfall 1: TableMap imports framer-motion but portail doesn't have it

**What goes wrong:** `TableItem.tsx` imports `motion` from `framer-motion`. The portail currently has no `framer-motion` dependency. The Vite build will fail with "Cannot find module 'framer-motion'".

**Why it happens:** `TableItem` lives in `@shared/components/map/` — shared code is resolved at build time by the portail's own `node_modules`. The backoffice has framer-motion; the portail does not.

**How to avoid:** Add `framer-motion` to `portail/package.json` dependencies as the first task of Wave 1.

**Warning signs:** TypeScript error `Cannot find module 'framer-motion' or its corresponding type declarations`.

### Pitfall 2: Sending `statut` field from the client

**What goes wrong:** `POST /api/reservations/` with any `statut` value returns HTTP 400: "Les clients ne peuvent pas choisir le statut initial."

**Why it happens:** `ReservationSerializer.validate_statut` blocks non-staff users from setting `statut` on create.

**How to avoid:** Never include `statut` in the POST body. The backend defaults it to `CONFIRMEE`.

### Pitfall 3: React Router v6 future flags missing

**What goes wrong:** Console warnings about v7 compatibility in React Router v6 — `No future flag for v7_startTransition` etc.

**How to avoid:** Mirror the backoffice setup exactly — pass `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}` to `BrowserRouter`.

### Pitfall 4: `nombre_personnes` string vs integer

**What goes wrong:** `<input type="number">` in React returns a string. Sending `"3"` to DRF's `PositiveIntegerField` may cause a validation error or silently fail capacity checks.

**How to avoid:** Always `parseInt(value, 10)` before including in the POST body. Validate > 0 on the frontend before submitting Step 1.

### Pitfall 5: `available_tables` action — date/time string formats

**What goes wrong:** `is_table_available` internally creates `Reservation` instances and calls `has_active_conflict()`, which does `datetime.datetime.combine(date_reservation, heure_debut)`. If `date_reservation` is a string `"2026-05-10"` and `heure_debut` is a string `"19:00"`, Django will need to parse them. Django's ORM and model `.clean()` handle ISO strings, but the service function receives raw query params — add explicit parsing in the view action.

**How to avoid:** In the `available_tables` action view, parse with `datetime.date.fromisoformat(date)` and `datetime.time.fromisoformat(heure_debut)` before passing to `is_table_available`. Return 400 on parse failure.

### Pitfall 6: Wizard navigation without guard

**What goes wrong:** User navigates directly to `/reservations/table` (Step 2) without going through Step 1 — `WizardContext.state.date` is empty, API call fails or shows all tables.

**How to avoid:** Each step component checks if its prerequisite context fields are filled. If not, imperatively navigate to `/reservations/new`. Use `useEffect` + `useNavigate` for this guard.

---

## Code Examples

### Step 1 → Step 2 navigation trigger

```typescript
// StepDateTime.tsx
import { useNavigate } from 'react-router-dom'
import { useWizard } from './WizardContext'

const StepDateTime = () => {
  const navigate = useNavigate()
  const { setDateTime } = useWizard()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setDateTime({
      date: fd.get('date') as string,
      heure_debut: fd.get('heure_debut') as string,
      heure_fin: fd.get('heure_fin') as string,
      nombre_personnes: parseInt(fd.get('nombre_personnes') as string, 10),
    })
    navigate('/reservations/table')
  }
  ...
}
```

### POST body for reservation creation

```typescript
// useReservationApi.ts
const createReservation = async (state: WizardState) => {
  const payload = {
    table: state.selectedTable!.id,
    date_reservation: state.date,
    heure_debut: state.heure_debut + ':00',  // backend expects HH:MM:SS
    heure_fin: state.heure_fin + ':00',
    nombre_personnes: state.nombre_personnes,
  }
  return axiosInstance.post('/reservations/', payload)
}
```

### Available tables fetch

```typescript
const fetchAvailableTables = async (params: {
  date: string; heure_debut: string; heure_fin: string; nombre_personnes: number
}) => {
  const { data } = await axiosInstance.get<Table[]>('/reservations/available_tables/', { params })
  return data
}
```

---

## Runtime State Inventory

> Not applicable — this is a greenfield frontend feature with a new backend action. No renames, migrations, or stored state changes are involved.

None — verified by phase description analysis.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | portail frontend build | Assumed available | — | — |
| react-router-dom | SPA routing | Not yet in portail | — | Install as Wave 1 task |
| framer-motion | TableItem (shared) | Not in portail | Already in backoffice node_modules | Install as Wave 1 task |
| vitest + @testing-library | Tests | Not in portail | Already in backoffice | Install as Wave 1 task |

**Missing dependencies with no fallback:**
- `react-router-dom` in portail — blocks all routing (Wave 1 install required)
- `framer-motion` in portail — blocks TableMap render (Wave 1 install required)

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.5 + @testing-library/react 16.3.2 |
| Config file | `app/frontend/portail/vitest.config.ts` — does not exist yet (Wave 0 gap) |
| Quick run command | `cd app/frontend/portail && npx vitest run` |
| Full suite command | `cd app/frontend/portail && npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-24-A | `available_tables` Django action returns only capacity-fitting, conflict-free tables | unit (Python) | `python manage.py test apps.reservations.tests.test_available_tables -v2` | No — Wave 0 gap |
| REQ-24-B | WizardContext state flows correctly across 3 steps | unit (React) | `npx vitest run src/pages/Reservations/WizardContext.test.tsx` | No — Wave 0 gap |
| REQ-24-C | StepDateTime blocks navigation when `heure_fin <= heure_debut` | unit (React) | `npx vitest run src/pages/Reservations/StepDateTime.test.tsx` | No — Wave 0 gap |
| REQ-24-D | StepTableSelect renders only returned tables on TableMap | unit (React) | `npx vitest run src/pages/Reservations/StepTableSelect.test.tsx` | No — Wave 0 gap |
| REQ-24-E | StepConfirm POSTs correct payload and navigates on success | unit (React) | `npx vitest run src/pages/Reservations/StepConfirm.test.tsx` | No — Wave 0 gap |
| REQ-24-F | Full portail build passes tsc -b && vite build | build check | `cd app/frontend/portail && npx tsc -b && npx vite build` | Infra exists |

### Sampling Rate

- **Per task commit:** `cd app/frontend/portail && npx vitest run`
- **Per wave merge:** Full suite + Python reservation tests
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `app/frontend/portail/vitest.config.ts` — mirrors backoffice config
- [ ] `app/frontend/portail/src/test/setup.ts` — imports `@testing-library/jest-dom`
- [ ] `app/backend/apps/reservations/tests/test_available_tables.py` — covers REQ-24-A
- [ ] Framework installs: `cd app/frontend/portail && npm install react-router-dom framer-motion && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom @types/react-router-dom`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | JWT via `axiosInstance` — already implemented in shared layer |
| V3 Session Management | yes | Zustand + localStorage + refresh interceptor — already in shared |
| V4 Access Control | yes | `IsStaffOrOwnReservation` permission class on all ReservationViewSet actions; `CLIENT_ROLES` gate in portail App.tsx |
| V5 Input Validation | yes | Backend: `ReservationSerializer` + `Reservation.clean()`. Frontend: HTML5 native input constraints + parseInt guard |
| V6 Cryptography | no | No new crypto; JWT handled by existing infrastructure |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client setting `statut=PRESENTE` on create | Elevation of Privilege | `validate_statut` in serializer blocks this (CR-01 fix already in place) |
| Querying another client's reservations | Information Disclosure | `get_queryset` filters `client=request.user` for CLIENT role |
| Booking race condition (simultaneous POST) | Tampering | `create_reservation` wraps in `transaction.atomic()` with `select_for_update` on Table row |
| Integer overflow on `nombre_personnes` | Tampering | `PositiveIntegerField` + capacity check in `clean()` |
| Missing auth on `available_tables` action | Elevation of Privilege | `IsStaffOrOwnReservation.has_permission` requires `is_authenticated` — covers all actions on the viewset |

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No routing in portail | `BrowserRouter` + `Routes` (react-router-dom v6) | Phase 24 | Enables multi-page wizard |
| Table status computed at DB save | `statut_effectif` as derived serializer field | Phase 23 | TableMap displays reservation-aware status without DB mutations |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Use `react-router-dom ^6.30.3` matching backoffice, not latest 7.x | Standard Stack | Low: v6 and v7 coexist fine; upgrade path is clear |
| A2 | Native `<input type="date/time">` is sufficient UX for MVP booking | Standard Stack | Medium: if UX review demands calendar picker, a library like react-day-picker must be added |
| A3 | `available_tables` action should use `IsStaffOrOwnReservation` (requires auth) | Security Domain | Low: booking requires login; anonymous booking is not in scope |

---

## Open Questions

1. **My Reservations list page**
   - What we know: ROADMAP Phase 24 says "booking flow" — the wizard creates a reservation.
   - What's unclear: Should Phase 24 also include a "My Reservations" list page where clients can see and cancel bookings?
   - Recommendation: Keep Phase 24 scoped to the creation wizard. Add a "My Reservations" management view as an early task in Phase 25 or as a discrete plan within Phase 24 (24-02).

2. **`heure_fin` default logic**
   - What we know: The wizard asks for `heure_debut` and `heure_fin`. Users may not know how long their meal takes.
   - What's unclear: Should the UI auto-suggest `heure_fin = heure_debut + 2h`?
   - Recommendation: Auto-compute `heure_fin` as `heure_debut + 2:00` in Step 1 with a user-overridable field. Reduces friction.

3. **Portail dev port**
   - What we know: `vite.config.ts` sets `port: 3003` for the portail. STATE.md documents "Client (3000)".
   - What's unclear: Minor inconsistency; does not block Phase 24.
   - Recommendation: Note in the plan but do not fix in this phase.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `app/frontend/portail/src/App.tsx` — current portail state (no router, placeholder UI)
- Codebase: `app/frontend/portail/package.json` — confirmed missing react-router-dom and framer-motion
- Codebase: `app/frontend/shared/components/map/TableMap.tsx` + `TableItem.tsx` — exact prop API
- Codebase: `app/frontend/shared/types/tables.ts` — Table interface
- Codebase: `app/frontend/shared/auth/axiosInstance.ts` — JWT interceptor already handles auth
- Codebase: `app/backend/apps/reservations/views.py` — no `available_tables` action yet
- Codebase: `app/backend/apps/reservations/serializers.py` — exact fields and CR-01 statut guard
- Codebase: `app/backend/apps/reservations/services.py` — `is_table_available` signature
- Codebase: `app/backend/apps/reservations/constants.py` — `RESERVATION_CLEANUP_BUFFER = timedelta(minutes=15)`
- Codebase: `app/backend/apps/tables/serializers.py` — `statut_effectif` derived field
- Codebase: `app/frontend/backoffice/src/App.tsx` — BrowserRouter pattern to mirror
- Codebase: `app/frontend/backoffice/package.json` — framer-motion 12.38.0, react-router-dom 6.30.3, vitest 4.1.5
- Codebase: `DESIGN.md` — Eco-Fresh tokens, animation rules, mobile-first mandate
- Codebase: `app/frontend/shared/theme.css` — exact CSS custom property names

### Secondary (MEDIUM confidence)

- npm registry: react-router-dom latest = 7.15.0; framer-motion latest = 12.38.0; vitest latest = 4.1.5 [VERIFIED: npm view]

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in npm registry and existing codebase
- Architecture: HIGH — directly derived from inspecting existing backoffice patterns
- Pitfalls: HIGH — sourced from actual code analysis (serializer validation, missing deps)
- API contract: HIGH — read from actual models.py, serializers.py, services.py

**Research date:** 2026-05-06
**Valid until:** 2026-06-06 (stable libraries; backend code unlikely to change)
