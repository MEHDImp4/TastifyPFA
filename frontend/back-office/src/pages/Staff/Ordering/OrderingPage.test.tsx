import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axiosInstance from '@shared/auth/axiosInstance'
import { useOrderStore } from './store/useOrderStore'
import { OrderingPage } from './OrderingPage'

vi.mock('@shared/auth/axiosInstance')

describe('OrderingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOrderStore.setState({ carts: {} })
    ;(axiosInstance.get as any).mockImplementation((url: string) => {
      if (url === '/categories/') {
        return Promise.resolve({ data: [{ id: 10, nom: 'Plats' }] })
      }

      return Promise.resolve({
        data: [{ id: 1, categorie: 10, nom: 'Couscous', prix: '75.00', est_disponible: true }],
      })
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

    expect(await screen.findByText('Ordering for Table 7')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Table 7' })).toBeInTheDocument()
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
    })
    expect(screen.getByText('Couscous')).toBeInTheDocument()
  })
})
