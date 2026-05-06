import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StepDateTime } from './StepDateTime'
import { WizardProvider, useWizard } from './WizardContext'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

const StateProbe = () => {
  const { state } = useWizard()

  return <output data-testid="wizard-state">{JSON.stringify(state)}</output>
}

const renderStep = () =>
  render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <WizardProvider>
        <StepDateTime />
        <StateProbe />
      </WizardProvider>
    </MemoryRouter>,
  )

describe('StepDateTime', () => {
  beforeEach(() => {
    navigateMock.mockReset()
  })

  it('renders date, heure_debut, heure_fin, and nombre_personnes inputs', () => {
    renderStep()

    expect(screen.getByLabelText(/date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/heure d'arrivee/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/heure de depart/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre de personnes/i)).toBeInTheDocument()
  })

  it('blocks navigation when heure_fin is not after heure_debut', () => {
    renderStep()

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-06-15' } })
    fireEvent.change(screen.getByLabelText(/heure d'arrivee/i), { target: { value: '20:00' } })
    fireEvent.change(screen.getByLabelText(/heure de depart/i), { target: { value: '19:00' } })
    fireEvent.change(screen.getByLabelText(/nombre de personnes/i), { target: { value: '4' } })
    fireEvent.submit(screen.getByRole('form', { name: /formulaire de reservation/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/heure de fin doit etre apres/i)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('saves a valid selection and navigates to /reservations/table', () => {
    renderStep()

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-06-15' } })
    fireEvent.change(screen.getByLabelText(/heure d'arrivee/i), { target: { value: '19:00' } })
    fireEvent.change(screen.getByLabelText(/heure de depart/i), { target: { value: '21:00' } })
    fireEvent.change(screen.getByLabelText(/nombre de personnes/i), { target: { value: '4' } })
    fireEvent.submit(screen.getByRole('form', { name: /formulaire de reservation/i }))

    expect(navigateMock).toHaveBeenCalledWith('/reservations/table')
    expect(screen.getByTestId('wizard-state')).toHaveTextContent('"date":"2026-06-15"')
    expect(screen.getByTestId('wizard-state')).toHaveTextContent('"heure_debut":"19:00"')
    expect(screen.getByTestId('wizard-state')).toHaveTextContent('"heure_fin":"21:00"')
  })

  it('parses nombre_personnes as an integer before storing it in context', () => {
    renderStep()

    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-06-15' } })
    fireEvent.change(screen.getByLabelText(/heure d'arrivee/i), { target: { value: '19:00' } })
    fireEvent.change(screen.getByLabelText(/heure de depart/i), { target: { value: '21:00' } })
    fireEvent.change(screen.getByLabelText(/nombre de personnes/i), { target: { value: '7' } })
    fireEvent.submit(screen.getByRole('form', { name: /formulaire de reservation/i }))

    expect(screen.getByTestId('wizard-state')).toHaveTextContent('"nombre_personnes":7')
    expect(screen.getByTestId('wizard-state')).not.toHaveTextContent('"nombre_personnes":"7"')
  })
})
