import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ClientReservationRoute, ClientLoyaltyRoute } from './App'

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as { username: string; role: string } | null,
}))

vi.mock('@shared/auth/useAuthStore', () => ({
  useAuthStore: () => authState,
}))

describe('Portal route guards', () => {
  beforeEach(() => {
    authState.isAuthenticated = false
    authState.user = null
  })

  it('shows a login prompt for anonymous reservation access', () => {
    render(
      <MemoryRouter>
        <ClientReservationRoute />
      </MemoryRouter>,
    )

    expect(screen.getByText(/La reservation en ligne demande un compte client/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Se connecter/i })).toHaveAttribute('href', '/login')
  })

  it('renders the reservation wizard for authenticated clients', () => {
    authState.isAuthenticated = true
    authState.user = { username: 'client', role: 'CLIENT' }

    render(
      <MemoryRouter>
        <ClientReservationRoute />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Etape 1/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument()
  })

  it('keeps loyalty behind a dedicated notice for anonymous visitors', () => {
    render(
      <MemoryRouter>
        <ClientLoyaltyRoute />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Le programme de fidelite demande un compte client/i)).toBeInTheDocument()
  })
})
