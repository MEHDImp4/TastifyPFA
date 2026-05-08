import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MenuPage } from './MenuPage'

vi.mock('../../api/menu', () => ({
  fetchPlats: vi.fn(),
}))

const { fetchPlats } = await import('../../api/menu')

describe('MenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders fetched dishes and filters them through the public search input', async () => {
    vi.mocked(fetchPlats).mockResolvedValue([
      {
        id: 1,
        nom: 'Tajine poulet citron',
        description: 'Citron confit et olives',
        prix: '95',
        image: null,
        categorie: 1,
      },
      {
        id: 2,
        nom: 'Couscous royal',
        description: 'Semoule fine et legumes',
        prix: '120',
        image: null,
        categorie: 1,
      },
    ])

    render(<MenuPage />)

    await waitFor(() => {
      expect(screen.getByText('Tajine poulet citron')).toBeInTheDocument()
      expect(screen.getByText('Couscous royal')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/Chercher un plat/i), {
      target: { value: 'citron' },
    })

    expect(screen.getByText('Tajine poulet citron')).toBeInTheDocument()
    expect(screen.queryByText('Couscous royal')).not.toBeInTheDocument()
  })
})
