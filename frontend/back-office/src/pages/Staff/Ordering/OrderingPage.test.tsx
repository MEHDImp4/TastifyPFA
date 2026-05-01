import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axiosInstance from '@shared/auth/axiosInstance'
import { useAuthStore } from '@shared/auth/useAuthStore'
import { useOrderStore } from './store/useOrderStore'
import { OrderingPage } from './OrderingPage'

vi.mock('@shared/auth/axiosInstance')

describe('OrderingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOrderStore.setState({ carts: {} })
    useAuthStore.setState({
      user: { username: 'serveur_test', role: 'SERVEUR' },
      accessToken: 'access-token',
      isAuthenticated: true,
    })
    ;(axiosInstance.get as any).mockImplementation((url: string) => {
      if (url === '/categories/') {
        return Promise.resolve({ data: [{ id: 10, nom: 'Plats' }] })
      }

      if (url === '/plats/') {
        return Promise.resolve({
          data: [{ id: 1, categorie: 10, nom: 'Couscous', prix: '75.00', est_disponible: true }],
        })
      }

      return Promise.resolve({ data: [] })
    })
  })

  it('renders the table id from route params', async () => {
    render(
      <MemoryRouter initialEntries={['/tables/7/order']}>
        <Routes>
          <Route path="/tables/:id/order" element={<OrderingPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Table 7' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retour au plan/i })).toBeInTheDocument()
  })

  it('loads categories and dishes from the API', async () => {
    render(
      <MemoryRouter initialEntries={['/tables/2/order']}>
        <Routes>
          <Route path="/tables/:id/order" element={<OrderingPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/categories/')
      expect(axiosInstance.get).toHaveBeenCalledWith('/plats/')
      expect(axiosInstance.get).toHaveBeenCalledWith('/commandes/?table=2&statut=EN_COURS')
    })
    expect(screen.getByText('Couscous')).toBeInTheDocument()
  })
})
