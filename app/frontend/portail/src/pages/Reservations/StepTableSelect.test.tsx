import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StepTableSelect } from './StepTableSelect'
import { WizardProvider, useWizard } from './WizardContext'

const navigateMock = vi.fn()
const fetchAvailableTablesMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../api/reservations', () => ({
  fetchAvailableTables: (...args: unknown[]) => fetchAvailableTablesMock(...args),
}))

vi.mock('@shared/components/map/TableMap', () => ({
  TableMap: ({
    tables,
    onTableClick,
    isEditMode,
  }: {
    tables: Array<{ id: number; numero: number }>
    onTableClick: (table: { id: number; numero: number }) => void
    isEditMode?: boolean
  }) => (
    <div data-testid="table-map" data-edit-mode={String(isEditMode)}>
      {tables.map((table) => (
        <button key={table.id} data-testid={`table-${table.id}`} onClick={() => onTableClick(table)}>
          Table {table.numero}
        </button>
      ))}
    </div>
  ),
}))

const TABLE_FIXTURE = [
  {
    id: 3,
    numero: 3,
    capacite: 4,
    statut: 'LIBRE' as const,
    pos_x: 100,
    pos_y: 120,
    est_active: true,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
  {
    id: 5,
    numero: 5,
    capacite: 6,
    statut: 'LIBRE' as const,
    pos_x: 300,
    pos_y: 220,
    est_active: true,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
  },
]

const WizardWithDate = () => {
  const { setDateTime } = useWizard()

  useEffect(() => {
    setDateTime({
      date: '2026-06-15',
      heure_debut: '19:00',
      heure_fin: '21:00',
      nombre_personnes: 3,
    })
  }, [])

  return <StepTableSelect />
}

const renderWithDate = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <WizardProvider>
        <WizardWithDate />
      </WizardProvider>
    </MemoryRouter>,
  )

const renderWithoutDate = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <WizardProvider>
        <StepTableSelect />
      </WizardProvider>
    </MemoryRouter>,
  )

describe('StepTableSelect', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    fetchAvailableTablesMock.mockReset()
  })

  it('calls fetchAvailableTables on mount with params from wizard state', async () => {
    fetchAvailableTablesMock.mockResolvedValue(TABLE_FIXTURE)

    renderWithDate()

    await waitFor(() => {
      expect(fetchAvailableTablesMock).toHaveBeenCalledWith({
        date: '2026-06-15',
        heure_debut: '19:00',
        heure_fin: '21:00',
        nombre_personnes: 3,
      })
    })
  })

  it('renders one element per returned table', async () => {
    fetchAvailableTablesMock.mockResolvedValue(TABLE_FIXTURE)

    renderWithDate()

    expect(await screen.findByTestId('table-3')).toBeInTheDocument()
    expect(screen.getByTestId('table-5')).toBeInTheDocument()
    expect(screen.getByTestId('table-map')).toHaveAttribute('data-edit-mode', 'false')
  })

  it('redirects to /reservations/new when wizard date is missing', async () => {
    fetchAvailableTablesMock.mockResolvedValue([])

    renderWithoutDate()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/reservations/new', { replace: true })
    })
  })
})
