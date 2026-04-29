import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axiosInstance from '@shared/auth/axiosInstance'
import { useAuthStore } from '@shared/auth/useAuthStore'
import { Table } from '@shared/types/tables'
import { MapView } from './MapView'

vi.mock('@shared/auth/axiosInstance')
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const renderMapView = () => render(
  <MemoryRouter>
    <MapView />
  </MemoryRouter>,
)

const makeTable = (overrides: Partial<Table> = {}): Table => ({
  id: 1,
  numero: 1,
  capacite: 4,
  statut: 'LIBRE',
  pos_x: 0,
  pos_y: 0,
  est_active: true,
  created_at: '2026-04-28T00:00:00Z',
  updated_at: '2026-04-28T00:00:00Z',
  ...overrides,
})

const setUserRole = (role: string) => {
  useAuthStore.setState({
    user: { username: `${role.toLowerCase()}_test`, role },
    accessToken: 'token',
    isAuthenticated: true,
  })
}

describe('MapView', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    navigateMock.mockClear()
    localStorage.clear()
    setUserRole('GERANT')
    ;(axiosInstance.get as any).mockResolvedValue({
      data: [
        makeTable({ id: 1, numero: 1 }),
        makeTable({ id: 2, numero: 2, capacite: 8, pos_x: 300, pos_y: 100 }),
      ],
    })
    ;(axiosInstance.patch as any).mockResolvedValue({ data: {} })
  })

  it('shows edit controls for GERANT users', async () => {
    renderMapView()

    expect(await screen.findByText('Mode édition')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Mode édition'))

    expect(screen.getByText('Enregistrer')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
    expect(screen.getByText('0 modification')).toBeInTheDocument()
  })

  it('navigates to ordering when a table is activated', async () => {
    renderMapView()

    fireEvent.pointerUp(await screen.findByTestId('table-1'))

    expect(navigateMock).toHaveBeenCalledWith('/tables/1/order')
  })

  it('hides edit controls from SERVEUR users', async () => {
    setUserRole('SERVEUR')

    renderMapView()

    await waitFor(() => {
      expect(screen.getByText('Plan de Salle')).toBeInTheDocument()
    })

    expect(screen.queryByText('Mode édition')).not.toBeInTheDocument()
    expect(screen.getByText('Positions verrouillées')).toBeInTheDocument()
  })

  it('does not poll while edit mode is active', async () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

    renderMapView()

    expect(await screen.findByText('Mode édition')).toBeInTheDocument()
    expect(axiosInstance.get).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Mode édition'))

    expect(axiosInstance.get).toHaveBeenCalledTimes(1)
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('patches only dirty table positions and refreshes after save', async () => {
    renderMapView()

    fireEvent.click(await screen.findByText('Mode édition'))

    const svg = screen.getByTestId('table-map')
    Object.defineProperty(svg, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
    })

    fireEvent.pointerDown(screen.getByTestId('table-1'), { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 126, clientY: 126, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: 126, clientY: 126, pointerId: 1 })

    expect(screen.getByText('1 modification')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Enregistrer'))

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith('/tables/1/', { pos_x: 120, pos_y: 120 })
    })
    expect(axiosInstance.patch).toHaveBeenCalledTimes(1)
    expect(axiosInstance.get).toHaveBeenCalledTimes(2)
  })

  it('restores last fetched positions when cancelling edits', async () => {
    renderMapView()

    fireEvent.click(await screen.findByText('Mode édition'))

    const svg = screen.getByTestId('table-map')
    Object.defineProperty(svg, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
    })

    fireEvent.pointerDown(screen.getByTestId('table-1'), { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 126, clientY: 126, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: 126, clientY: 126, pointerId: 1 })
    fireEvent.click(screen.getByText('Annuler'))

    expect(screen.getByText('Positions verrouillées')).toBeInTheDocument()
    expect(screen.queryByText('1 modification')).not.toBeInTheDocument()
    expect(axiosInstance.patch).not.toHaveBeenCalled()
  })

  it('keeps edit mode and local changes visible when saving fails', async () => {
    ;(axiosInstance.patch as any).mockRejectedValue(new Error('save failed'))

    renderMapView()

    fireEvent.click(await screen.findByText('Mode édition'))

    const svg = screen.getByTestId('table-map')
    Object.defineProperty(svg, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ left: 0, top: 0, width: 1000, height: 800 }),
    })

    fireEvent.pointerDown(screen.getByTestId('table-1'), { clientX: 100, clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(svg, { clientX: 126, clientY: 126, pointerId: 1 })
    fireEvent.pointerUp(svg, { clientX: 126, clientY: 126, pointerId: 1 })
    fireEvent.click(screen.getByText('Enregistrer'))

    expect(await screen.findByText('Impossible d’enregistrer le plan. Les modifications restent visibles.')).toBeInTheDocument()
    expect(screen.getByText('1 modification')).toBeInTheDocument()
  })
})
