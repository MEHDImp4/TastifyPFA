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

  describe('Phase 16 — Fire to Kitchen button', () => {
    const enCoursOrder = {
      id: 501,
      table: 9,
      serveur: 1,
      serveur_name: 'Test User',
      serveur_username: 'serveur_test',
      statut: 'EN_COURS' as const,
      montant_total: '50.00',
      est_active: true,
      created_at: '2026-05-03T10:00:00Z',
      updated_at: '2026-05-03T10:00:00Z',
      lignes: [],
    }

    const setupActiveOrder = (order: any) => {
      ;(axiosInstance.get as any).mockImplementation((url: string) => {
        if (url === '/categories/') return Promise.resolve({ data: [] })
        if (url === '/plats/') return Promise.resolve({ data: [] })
        if (url.startsWith('/commandes/?table=')) return Promise.resolve({ data: [order] })
        return Promise.resolve({ data: [] })
      })
    }

    it('renders the "Tout Envoyer en Cuisine" button for an EN_COURS owned order (P16-FE-01)', async () => {
      setupActiveOrder(enCoursOrder)
      render(
        <MemoryRouter initialEntries={['/tables/9/order']}>
          <Routes>
            <Route path="/tables/:id/order" element={<OrderingPage />} />
          </Routes>
        </MemoryRouter>,
      )
      expect(
        await screen.findByRole('button', { name: /tout envoyer en cuisine/i }),
      ).toBeInTheDocument()
    })

    it('hides the fire button when the order is not owned (P16-FE-01)', async () => {
      setupActiveOrder({ ...enCoursOrder, serveur_username: 'someone_else' })
      render(
        <MemoryRouter initialEntries={['/tables/9/order']}>
          <Routes>
            <Route path="/tables/:id/order" element={<OrderingPage />} />
          </Routes>
        </MemoryRouter>,
      )
      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith('/commandes/?table=9&statut=EN_COURS')
      })
      expect(screen.queryByRole('button', { name: /tout envoyer en cuisine/i })).toBeNull()
    })

    it('hides the fire button once order is EN_CUISINE (P16-FE-01)', async () => {
      setupActiveOrder({ ...enCoursOrder, statut: 'EN_CUISINE' })
      render(
        <MemoryRouter initialEntries={['/tables/9/order']}>
          <Routes>
            <Route path="/tables/:id/order" element={<OrderingPage />} />
          </Routes>
        </MemoryRouter>,
      )
      await waitFor(() => {
        expect(axiosInstance.get).toHaveBeenCalledWith('/commandes/?table=9&statut=EN_COURS')
      })
      expect(screen.queryByRole('button', { name: /tout envoyer en cuisine/i })).toBeNull()
    })

    it('PATCHes /commandes/{id}/ with {statut:"EN_CUISINE"} on click (P16-FE-02)', async () => {
      const { fireEvent } = await import('@testing-library/react')
      setupActiveOrder(enCoursOrder)
      ;(axiosInstance.patch as any) = vi.fn().mockResolvedValue({ data: { ...enCoursOrder, statut: 'EN_CUISINE' } })

      render(
        <MemoryRouter initialEntries={['/tables/9/order']}>
          <Routes>
            <Route path="/tables/:id/order" element={<OrderingPage />} />
          </Routes>
        </MemoryRouter>,
      )

      const button = await screen.findByRole('button', { name: /tout envoyer en cuisine/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(axiosInstance.patch).toHaveBeenCalledWith(
          `/commandes/${enCoursOrder.id}/`,
          { statut: 'EN_CUISINE' },
        )
      })
    })
  })
})
