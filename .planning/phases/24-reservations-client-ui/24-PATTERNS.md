# Phase 24: Reservations Client UI — Pattern Map

**Mapped:** 2026-05-06
**Files analyzed:** 16 (2 backend + 14 frontend)
**Analogs found:** 14 / 16 (2 frontend config files are new but mirror exact backoffice analogs)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/backend/apps/reservations/views.py` | controller | request-response | self (existing ViewSet) | exact — add @action |
| `app/backend/apps/reservations/tests/test_available_tables.py` | test | request-response | `tests/test_services.py` + `tests/test_api.py` | role-match |
| `app/frontend/portail/package.json` | config | — | `app/frontend/backoffice/package.json` | exact |
| `app/frontend/portail/vite.config.ts` | config | — | `app/frontend/backoffice/vite.config.ts` | exact (already identical) |
| `app/frontend/portail/vitest.config.ts` | config | — | `app/frontend/backoffice/vitest.config.ts` | exact |
| `app/frontend/portail/src/test/setup.ts` | config | — | `app/frontend/backoffice/src/test/setup.ts` | exact |
| `app/frontend/portail/src/App.tsx` | component | request-response | `app/frontend/backoffice/src/App.tsx` | exact |
| `app/frontend/portail/src/api/reservations.ts` | service | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` (axiosInstance usage) | role-match |
| `app/frontend/portail/src/pages/Reservations/WizardContext.tsx` | provider | event-driven | no wizard context in codebase | no analog (use RESEARCH.md) |
| `app/frontend/portail/src/pages/Reservations/ReservationsWizard.tsx` | component | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` | role-match |
| `app/frontend/portail/src/pages/Reservations/StepDateTime.tsx` | component | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` (form + navigate) | role-match |
| `app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx` | component | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` (TableMap usage) | exact for map reuse |
| `app/frontend/portail/src/pages/Reservations/StepConfirm.tsx` | component | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` (axiosInstance.post) | role-match |
| `app/frontend/portail/src/pages/Reservations/WizardContext.test.tsx` | test | event-driven | `app/frontend/backoffice/src/pages/Staff/Map/MapView.test.tsx` | role-match |
| `app/frontend/portail/src/pages/Reservations/StepDateTime.test.tsx` | test | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.test.tsx` | role-match |
| `app/frontend/portail/src/pages/Reservations/StepTableSelect.test.tsx` | test | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.test.tsx` | role-match |
| `app/frontend/portail/src/pages/Reservations/StepConfirm.test.tsx` | test | request-response | `app/frontend/backoffice/src/pages/Staff/Map/MapView.test.tsx` | role-match |

---

## Pattern Assignments

### `app/backend/apps/reservations/views.py` (controller, request-response)

**Analog:** self — existing `ReservationViewSet` at lines 1-18 plus RESEARCH.md pattern

**Current state** (lines 1-18 of `app/backend/apps/reservations/views.py`):
```python
from rest_framework import viewsets

from apps.reservations.models import Reservation
from apps.reservations.permissions import IsStaffOrOwnReservation, STAFF_ROLES
from apps.reservations.serializers import ReservationSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsStaffOrOwnReservation]

    def get_queryset(self):
        user = self.request.user
        base_qs = Reservation.objects.select_related('client', 'table')
        if user.role in STAFF_ROLES:
            return base_qs.all()
        return base_qs.filter(client=user)
```

**@action to append** (RESEARCH.md pattern + pitfall guidance):
```python
import datetime
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from apps.tables.models import Table
from apps.tables.serializers import TableSerializer
from apps.reservations.services import is_table_available

    @action(detail=False, methods=['get'], url_path='available_tables')
    def available_tables(self, request):
        date_str = request.query_params.get('date')
        heure_debut_str = request.query_params.get('heure_debut')
        heure_fin_str = request.query_params.get('heure_fin')
        nombre_personnes_str = request.query_params.get('nombre_personnes', '1')

        try:
            date = datetime.date.fromisoformat(date_str)
            heure_debut = datetime.time.fromisoformat(heure_debut_str)
            heure_fin = datetime.time.fromisoformat(heure_fin_str)
            nombre_personnes = int(nombre_personnes_str)
        except (TypeError, ValueError):
            return Response(
                {'detail': 'Paramètres date/heure invalides ou manquants.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tables = Table.objects.active().filter(capacite__gte=nombre_personnes)
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

**Permission note:** `IsStaffOrOwnReservation.has_permission` (line 14-15 of `permissions.py`) already requires `is_authenticated` — the @action inherits it automatically. No extra decorator needed.

---

### `app/backend/apps/reservations/tests/test_available_tables.py` (test, request-response)

**Analog:** `app/backend/apps/reservations/tests/test_api.py` (lines 1-75) + `test_services.py` (lines 1-11)

**Imports + fixtures pattern** (from `test_api.py` lines 1-75):
```python
import datetime

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.reservations.models import Reservation
from apps.tables.models import Table
from apps.users.models import Utilisateur


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def client_user(db):
    return Utilisateur.objects.create_user(
        username="avail-client-user",
        password="password123",
        role=Utilisateur.Role.CLIENT,
    )


@pytest.fixture
def table(db):
    return Table.objects.create(numero=99, capacite=4)
```

**Core test pattern** (from `test_services.py` lines 10-49):
```python
@pytest.mark.django_db
class TestAvailableTablesAction:
    def test_returns_available_tables_matching_capacity(self, api_client, client_user, table):
        api_client.force_authenticate(user=client_user)
        url = reverse('reservation-available-tables')
        response = api_client.get(url, {
            'date': '2026-06-01',
            'heure_debut': '19:00',
            'heure_fin': '21:00',
            'nombre_personnes': 3,
        })
        assert response.status_code == status.HTTP_200_OK
        assert any(t['id'] == table.id for t in response.data)

    def test_excludes_booked_table(self, api_client, client_user, table):
        ...  # create conflicting Reservation first, then assert table absent

    def test_returns_400_on_missing_params(self, api_client, client_user):
        api_client.force_authenticate(user=client_user)
        url = reverse('reservation-available-tables')
        response = api_client.get(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_requires_authentication(self, api_client):
        url = reverse('reservation-available-tables')
        response = api_client.get(url, {
            'date': '2026-06-01',
            'heure_debut': '19:00',
            'heure_fin': '21:00',
            'nombre_personnes': 2,
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

**URL name:** DRF router auto-generates `reservation-available-tables` for `url_path='available_tables'` on `ReservationViewSet` registered as `reservation`.

---

### `app/frontend/portail/package.json` (config)

**Analog:** `app/frontend/backoffice/package.json` (lines 1-36)

**Exact additions required** (diff from backoffice `package.json`):
```json
{
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "framer-motion": "^12.38.0",
    "react-router-dom": "^6.30.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react-router-dom": "^5.3.3",
    "jsdom": "^29.1.0",
    "vitest": "^4.1.5"
  }
}
```

---

### `app/frontend/portail/vite.config.ts` (config)

**Analog:** `app/frontend/backoffice/vite.config.ts` (lines 1-66)

The portail `vite.config.ts` is already identical in structure to the backoffice. Only `port` differs (`3003` vs `3000`). No `/ws` proxy block in portail (portail has no WebSocket). No changes needed for Phase 24. The `test` block goes into the separate `vitest.config.ts`.

---

### `app/frontend/portail/vitest.config.ts` (config)

**Analog:** `app/frontend/backoffice/vitest.config.ts` (lines 1-13) — copy verbatim:

```typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }),
)
```

---

### `app/frontend/portail/src/test/setup.ts` (config)

**Analog:** `app/frontend/backoffice/src/test/setup.ts` (line 1) — copy verbatim:

```typescript
import '@testing-library/jest-dom';
```

---

### `app/frontend/portail/src/App.tsx` (component, request-response)

**Analog:** `app/frontend/backoffice/src/App.tsx` (lines 1-117)

**Imports pattern** (backoffice lines 1-27, adapted for portail):
```typescript
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthBootstrap } from '@shared/auth/AuthBootstrap'
import { useAuthStore } from '@shared/auth/useAuthStore'
import Login from '@shared/auth/Login'
import { AppErrorBoundary } from '@shared/ui/AppErrorBoundary'
import { CLIENT_ROLES, isRoleAllowed } from '@shared/auth/roleAccess'
```

**BrowserRouter + Routes pattern** (backoffice lines 84-116):
```typescript
function App() {
  return (
    <AppErrorBoundary appLabel="Le portail client">
      <AuthBootstrap>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
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

**LoginRoute guard pattern** (backoffice lines 44-82 — adapt `CLIENT_ROLES` / `STAFF_PORTAL_DENIED_MESSAGE`):
```typescript
const ClientLoginRoute = () => {
  const { isAuthenticated, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const [kickMessage, setKickMessage] = useState<string | undefined>()

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role && !isRoleAllowed(user.role, CLIENT_ROLES)) {
        clearAuth()
        setKickMessage("Ce compte est réservé à l'espace staff.")
        return
      }
      navigate('/', { replace: true })
    }
  }, [clearAuth, isAuthenticated, navigate, user?.role])

  return (
    <Login
      onSuccess={() => navigate('/')}
      allowedRoles={CLIENT_ROLES}
      appLabel="Portail Client"
      appDescription="Accès réservé aux clients du restaurant"
      deniedMessage="Ce compte est réservé à l'espace staff."
      variant="client"
      initialError={kickMessage}
    />
  )
}
```

**Key difference from current portail App.tsx:** The current `App.tsx` (lines 1-77) uses inline conditional rendering (`!isAuthenticated ? <Login> : <placeholder>`). Phase 24 replaces this with `BrowserRouter` + route-based guards.

---

### `app/frontend/portail/src/api/reservations.ts` (service, request-response)

**Analog:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` — axiosInstance usage pattern (lines 1-43)

**Imports pattern** (MapView.tsx lines 1-8):
```typescript
import axiosInstance from '@shared/auth/axiosInstance'
import { Table } from '@shared/types/tables'
```

**Core API module pattern** (adapted from MapView's `fetchTables` callback, lines 27-43):
```typescript
import axiosInstance from '@shared/auth/axiosInstance'
import { Table } from '@shared/types/tables'
import type { WizardState } from './WizardContext'

interface AvailableTablesParams {
  date: string
  heure_debut: string
  heure_fin: string
  nombre_personnes: number
}

export const fetchAvailableTables = async (params: AvailableTablesParams): Promise<Table[]> => {
  const { data } = await axiosInstance.get<Table[]>('/reservations/available_tables/', { params })
  return data
}

export const createReservation = async (state: WizardState) => {
  const payload = {
    table: state.selectedTable!.id,
    date_reservation: state.date,
    heure_debut: state.heure_debut + ':00',
    heure_fin: state.heure_fin + ':00',
    nombre_personnes: state.nombre_personnes,
  }
  const { data } = await axiosInstance.post('/reservations/', payload)
  return data
}
```

**Error handling pattern** (MapView.tsx lines 32-42 — catch, set error string, setLoading false in finally):
```typescript
try {
  const response = await axiosInstance.get('/tables/')
  setTables(response.data)
} catch (err) {
  console.error('Failed to fetch tables', err)
  setError('Impossible de charger le plan de salle.')
} finally {
  setLoading(false)
}
```

---

### `app/frontend/portail/src/pages/Reservations/WizardContext.tsx` (provider, event-driven)

**Analog:** No wizard/multi-step context exists in the codebase. Use RESEARCH.md Pattern 1 directly.

**Pattern from RESEARCH.md** (lines 142-168):
```typescript
import { createContext, useContext, useState, ReactNode } from 'react'
import { Table } from '@shared/types/tables'

interface WizardState {
  date: string
  heure_debut: string
  heure_fin: string
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

const INITIAL_STATE: WizardState = {
  date: '',
  heure_debut: '',
  heure_fin: '',
  nombre_personnes: 1,
  selectedTable: null,
}

export const WizardProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)

  const setDateTime = (fields: Pick<WizardState, 'date' | 'heure_debut' | 'heure_fin' | 'nombre_personnes'>) =>
    setState((prev) => ({ ...prev, ...fields }))

  const setTable = (table: Table) =>
    setState((prev) => ({ ...prev, selectedTable: table }))

  const reset = () => setState(INITIAL_STATE)

  return (
    <WizardContext.Provider value={{ state, setDateTime, setTable, reset }}>
      {children}
    </WizardContext.Provider>
  )
}

export type { WizardState }
```

---

### `app/frontend/portail/src/pages/Reservations/ReservationsWizard.tsx` (component, request-response)

**Analog:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` — layout shell + nested routing via Outlet

**Shell + Outlet pattern** (using react-router-dom v6 `Outlet`):
```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { WizardProvider } from './WizardContext'
import { StepDateTime } from './StepDateTime'
import { StepTableSelect } from './StepTableSelect'
import { StepConfirm } from './StepConfirm'

export const ReservationWizardShell = () => (
  <WizardProvider>
    <Routes>
      <Route path="new" element={<StepDateTime />} />
      <Route path="table" element={<StepTableSelect />} />
      <Route path="confirm" element={<StepConfirm />} />
      <Route index element={<Navigate to="new" replace />} />
    </Routes>
  </WizardProvider>
)
```

**Loading/error state pattern** (MapView.tsx lines 14-18):
```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

---

### `app/frontend/portail/src/pages/Reservations/StepDateTime.tsx` (component, request-response)

**Analog:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` — form submit + navigate pattern

**Navigate + context write pattern** (RESEARCH.md lines 382-405):
```typescript
import { useNavigate } from 'react-router-dom'
import { useWizard } from './WizardContext'

export const StepDateTime = () => {
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

**Guard pattern** (Pitfall 6 in RESEARCH.md — useEffect redirect if prerequisite fields empty):
```typescript
useEffect(() => {
  // No prerequisite for Step 1 — it is the entry point
}, [])
```
Step 2 and Step 3 each add:
```typescript
useEffect(() => {
  if (!state.date) navigate('/reservations/new', { replace: true })
}, [state.date, navigate])
```

---

### `app/frontend/portail/src/pages/Reservations/StepTableSelect.tsx` (component, request-response)

**Analog:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` (lines 1-43 for fetch, lines 1-8 for TableMap import)

**TableMap import and usage** (from `app/frontend/shared/components/map/TableMap.tsx` lines 91-96 — prop API):
```typescript
import { TableMap } from '@shared/components/map/TableMap'
import { Table } from '@shared/types/tables'

// TableMap prop API (from TableMap.tsx lines 5-10):
// tables: Table[]
// onTableClick: (table: Table) => void
// isEditMode?: boolean   — default false, MUST stay false here
// onTablePositionChange? — omit entirely

<TableMap
  tables={availableTables}
  onTableClick={(table) => {
    setTable(table)
    navigate('/reservations/confirm')
  }}
  isEditMode={false}
/>
```

**Fetch on mount pattern** (MapView.tsx lines 27-47):
```typescript
const [availableTables, setAvailableTables] = useState<Table[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const load = async () => {
    try {
      const tables = await fetchAvailableTables({
        date: state.date,
        heure_debut: state.heure_debut,
        heure_fin: state.heure_fin,
        nombre_personnes: state.nombre_personnes,
      })
      setAvailableTables(tables)
    } catch {
      setError('Impossible de charger les tables disponibles.')
    } finally {
      setLoading(false)
    }
  }
  void load()
}, [state])
```

**Do NOT modify shared components.** Wrap `TableMap` — never edit `TableMap.tsx` or `TableItem.tsx`.

---

### `app/frontend/portail/src/pages/Reservations/StepConfirm.tsx` (component, request-response)

**Analog:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` — axiosInstance.post + error handling

**POST + navigate pattern** (adapted from MapView.tsx save pattern):
```typescript
import { useNavigate } from 'react-router-dom'
import { useWizard } from './WizardContext'
import { createReservation } from '../../api/reservations'

export const StepConfirm = () => {
  const navigate = useNavigate()
  const { state, reset } = useWizard()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await createReservation(state)
      reset()
      navigate('/reservations/new')
    } catch {
      setError('La réservation a échoué. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }
  ...
}
```

---

### React Test Files: `WizardContext.test.tsx`, `StepDateTime.test.tsx`, `StepTableSelect.test.tsx`, `StepConfirm.test.tsx`

**Analog:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.test.tsx` (lines 1-178)

**Imports pattern** (MapView.test.tsx lines 1-8):
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axiosInstance from '@shared/auth/axiosInstance'
```

**Mock pattern** (MapView.test.tsx lines 9-18):
```typescript
vi.mock('@shared/auth/axiosInstance')
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})
```

**Render helper pattern** (MapView.test.tsx lines 20-24):
```typescript
const renderStep = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <WizardProvider>{ui}</WizardProvider>
    </MemoryRouter>
  )
```

**Axios mock setup pattern** (MapView.test.tsx lines 47-61):
```typescript
beforeEach(() => {
  vi.clearAllMocks()
  navigateMock.mockClear()
  ;(axiosInstance.get as any).mockResolvedValue({ data: [] })
  ;(axiosInstance.post as any).mockResolvedValue({ data: { id: 1 } })
})
```

**Assertion pattern** (MapView.test.tsx lines 63-73):
```typescript
it('navigates to next step after valid submit', async () => {
  renderStep(<StepDateTime />)
  // fill inputs and submit
  fireEvent.submit(screen.getByRole('form'))
  await waitFor(() => {
    expect(navigateMock).toHaveBeenCalledWith('/reservations/table')
  })
})
```

---

## Shared Patterns

### Authentication (apply to all frontend components)

**Source:** `app/frontend/shared/auth/axiosInstance.ts` (lines 23-31) + `app/frontend/portail/src/App.tsx` (lines 11-19)

No new auth code needed. All API calls go through `axiosInstance` which injects `Authorization: Bearer <token>` automatically. Client role guard is already in `isRoleAllowed` + `CLIENT_ROLES`.

```typescript
import axiosInstance from '@shared/auth/axiosInstance'
// axiosInstance already has: baseURL '/api', Bearer token injection, 401→refresh→retry
```

### Error Handling (apply to all components making API calls)

**Source:** `app/frontend/backoffice/src/pages/Staff/Map/MapView.tsx` (lines 32-42)

```typescript
const [error, setError] = useState<string | null>(null)

try {
  const response = await axiosInstance.get('/...')
  setData(response.data)
} catch (err) {
  console.error('context: what failed', err)
  setError('Message utilisateur en français.')
} finally {
  setLoading(false)
}
```

Always show `error` string in UI. Never swallow silently. Always reset `loading` in `finally`.

### BrowserRouter future flags (apply to portail App.tsx)

**Source:** `app/frontend/backoffice/src/App.tsx` (lines 88-92)

```typescript
<BrowserRouter
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}
>
```

Both flags required to suppress React Router v6 console warnings about v7 migration.

### DRF @action permission inheritance

**Source:** `app/backend/apps/reservations/permissions.py` (lines 8-20) + `views.py` (lines 8-10)

`permission_classes = [IsStaffOrOwnReservation]` on the ViewSet applies to all actions including custom `@action`s. `has_permission` requires `is_authenticated` — covers the `available_tables` action automatically. No additional `@permission_classes` decorator on the action method.

### Python test fixtures

**Source:** `app/backend/apps/reservations/tests/test_api.py` (lines 14-57) + `test_services.py` (lines 10-31)

Use `@pytest.fixture` + `db` marker, `APIClient().force_authenticate(user=...)`, `reverse('reservation-available-tables')`. Mirror `make_reservation` helper from `test_api.py` line 65-74 for seeding conflicting reservations.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `app/frontend/portail/src/pages/Reservations/WizardContext.tsx` | provider | event-driven | No multi-step wizard context exists anywhere in the codebase. Use RESEARCH.md Pattern 1 (lines 142-168) as the implementation blueprint. |

---

## Metadata

**Analog search scope:** `app/frontend/backoffice/src/`, `app/frontend/portail/src/`, `app/frontend/shared/`, `app/backend/apps/reservations/`
**Files scanned:** 14 source files read directly
**Pattern extraction date:** 2026-05-06
