import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MenuDish } from '../types'
import { useOrderStore } from '../store/useOrderStore'
import { DishGrid } from './DishGrid'

const dishes: MenuDish[] = [
  { id: 1, categorie: 10, nom: 'Couscous', prix: '75.00', est_disponible: true },
  { id: 2, categorie: 20, nom: 'Pastilla', prix: '90.00', est_disponible: true },
  { id: 3, categorie: 10, nom: 'Plat indisponible', prix: '30.00', est_disponible: false },
]

describe('DishGrid', () => {
  beforeEach(() => {
    useOrderStore.setState({ carts: {} })
  })

  it('renders all available dishes when no category is selected', () => {
    render(<DishGrid tableId={1} dishes={dishes} selectedCategoryId={null} />)

    expect(screen.getByText('Couscous')).toBeInTheDocument()
    expect(screen.getByText('Pastilla')).toBeInTheDocument()
    expect(screen.queryByText('Plat indisponible')).not.toBeInTheDocument()
  })

  it('filters dishes by selected category', () => {
    render(<DishGrid tableId={1} dishes={dishes} selectedCategoryId={20} />)

    expect(screen.queryByText('Couscous')).not.toBeInTheDocument()
    expect(screen.getByText('Pastilla')).toBeInTheDocument()
  })

  it('updates the cart from dish controls', () => {
    render(<DishGrid tableId={4} dishes={dishes} selectedCategoryId={10} />)

    fireEvent.click(screen.getByLabelText('Ajouter Couscous'))

    expect(useOrderStore.getState().getCart(4)).toHaveLength(1)
    expect(useOrderStore.getState().getCart(4)[0].quantity).toBe(1)
  })
})
