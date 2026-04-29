import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CartItem } from '../store/useOrderStore'
import { OrderReview } from './OrderReview'

const items: CartItem[] = [
  { plat: { id: 1, categorie: 10, nom: 'Couscous', prix: '75.00' }, quantity: 2 },
  { plat: { id: 2, categorie: 20, nom: 'Pastilla', prix: '90.00' }, quantity: 1 },
]

describe('OrderReview', () => {
  it('renders all cart items and totals', () => {
    render(<OrderReview isOpen items={items} total={240} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByText('Couscous')).toBeInTheDocument()
    expect(screen.getByText('Pastilla')).toBeInTheDocument()
    expect(screen.getByText('240.00 DH')).toBeInTheDocument()
  })

  it('calls submit when the confirmation button is clicked', () => {
    const onSubmit = vi.fn()

    render(<OrderReview isOpen items={items} total={240} onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la commande' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not render when closed', () => {
    render(<OrderReview isOpen={false} items={items} total={240} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.queryByText('Revue de commande')).not.toBeInTheDocument()
  })
})
