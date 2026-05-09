import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartOverlay } from './CartOverlay'

const navigateMock = vi.hoisted(() => vi.fn())
const alertMock = vi.hoisted(() => vi.fn())
const postMock = vi.hoisted(() => vi.fn())

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as { username: string; role: string } | null,
}))

const cartState = vi.hoisted(() => ({
  items: [
    {
      id: 'line-1',
      platId: 4,
      nom: 'Tajine',
      prix: 95,
      quantity: 1,
      notes: '',
    },
  ],
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  getTotal: () => 95,
  clearCart: vi.fn(),
}))

vi.mock('@shared/auth/useAuthStore', () => ({
  useAuthStore: () => authState,
}))

vi.mock('../../store/useCartStore', () => ({
  useCartStore: () => cartState,
}))

vi.mock('@shared/auth/axiosInstance', () => ({
  default: {
    post: postMock,
    patch: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('CartOverlay', () => {
  beforeEach(() => {
    authState.isAuthenticated = false
    authState.user = null
    navigateMock.mockReset()
    alertMock.mockReset()
    postMock.mockReset()
    cartState.clearCart.mockReset()
    vi.stubGlobal('alert', alertMock)
  })

  it('redirects anonymous visitors to login before checkout', () => {
    const onClose = vi.fn()

    render(
      <MemoryRouter>
        <CartOverlay isOpen onClose={onClose} />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText(/Votre nom/i), {
      target: { value: 'Client Test' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Commander & Payer/i }))

    expect(alertMock).toHaveBeenCalledWith(
      'Connectez-vous avec un compte client pour valider une commande a emporter.',
    )
    expect(onClose).toHaveBeenCalledOnce()
    expect(navigateMock).toHaveBeenCalledWith('/login')
    expect(postMock).not.toHaveBeenCalled()
  })
})
