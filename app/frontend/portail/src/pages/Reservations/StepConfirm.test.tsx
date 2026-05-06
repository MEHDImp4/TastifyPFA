import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createReservation } from '../../api/reservations'
import { StepConfirm } from './StepConfirm'
import { WizardProvider, useWizard } from './WizardContext'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../api/reservations', () => ({
  createReservation: vi.fn(),
}))

const TABLE_FIXTURE = {
  id: 3,
  numero: 3,
  capacite: 4,
  statut: 'LIBRE' as const,
  pos_x: 100,
  pos_y: 100,
  est_active: true,
  created_at: '',
  updated_at: '',
}

const WizardWithSelection = () => {
  const { setDateTime, setTable } = useWizard()

  useEffect(() => {
    setDateTime({
      date: '2026-06-15',
      heure_debut: '19:00',
      heure_fin: '21:00',
      nombre_personnes: 3,
    })
    setTable(TABLE_FIXTURE)
  }, [])

  return <StepConfirm />
}

const renderWithSelection = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <WizardProvider>
        <WizardWithSelection />
      </WizardProvider>
    </MemoryRouter>,
  )

const renderWithoutSelection = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <WizardProvider>
        <StepConfirm />
      </WizardProvider>
    </MemoryRouter>,
  )

describe('StepConfirm', () => {
  beforeEach(() => {
    navigateMock.mockReset()
    vi.mocked(createReservation).mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders booking summary with date, times, and table numero', async () => {
    renderWithSelection()

    expect(await screen.findByText('2026-06-15')).toBeInTheDocument()
    expect(screen.getByText('19:00')).toBeInTheDocument()
    expect(screen.getByText('21:00')).toBeInTheDocument()
    expect(screen.getByText('Table 3')).toBeInTheDocument()
  })

  it('calls createReservation, resets state, and navigates to /reservations/new on success', async () => {
    vi.mocked(createReservation).mockResolvedValue({ id: 42 })

    renderWithSelection()
    fireEvent.click(await screen.findByRole('button', { name: /confirmer la reservation/i }))

    await waitFor(() => {
      expect(createReservation).toHaveBeenCalledTimes(1)
      expect(navigateMock).toHaveBeenCalledWith('/reservations/new')
    })
  })

  it('passes wizard state without statut and keeps nombre_personnes numeric', async () => {
    vi.mocked(createReservation).mockResolvedValue({ id: 42 })

    renderWithSelection()
    fireEvent.click(await screen.findByRole('button', { name: /confirmer la reservation/i }))

    await waitFor(() => expect(createReservation).toHaveBeenCalledTimes(1))

    const payload = vi.mocked(createReservation).mock.calls[0][0]
    expect('statut' in payload).toBe(false)
    expect(typeof payload.nombre_personnes).toBe('number')
    expect(payload.heure_debut).toBe('19:00')
  })

  it('shows an error and does not navigate when reservation creation fails', async () => {
    vi.mocked(createReservation).mockRejectedValue(new Error('Network error'))

    renderWithSelection()
    fireEvent.click(await screen.findByRole('button', { name: /confirmer la reservation/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/reservation a echoue/i)
    })
    expect(navigateMock).not.toHaveBeenCalledWith('/reservations/new')
  })

  it('redirects to /reservations/new when no table is selected', async () => {
    renderWithoutSelection()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/reservations/new', { replace: true })
    })
  })
})
