import { beforeEach, describe, expect, it } from 'vitest'
import { MenuDish } from '../types'
import { useOrderStore } from './useOrderStore'

const couscous: MenuDish = {
  id: 1,
  categorie: 10,
  nom: 'Couscous',
  prix: '75.50',
}

const tajine: MenuDish = {
  id: 2,
  categorie: 10,
  nom: 'Tajine',
  prix: 60,
}

describe('useOrderStore', () => {
  beforeEach(() => {
    useOrderStore.setState({ carts: {} })
  })

  it('keeps carts isolated by table', () => {
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().addItem(2, tajine)

    expect(useOrderStore.getState().getCart(1)).toEqual([{ plat: couscous, quantity: 1 }])
    expect(useOrderStore.getState().getCart(2)).toEqual([{ plat: tajine, quantity: 1 }])
  })

  it('increments and decrements quantities per dish', () => {
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().removeItem(1, couscous.id)

    expect(useOrderStore.getState().getCart(1)).toEqual([{ plat: couscous, quantity: 1 }])
  })

  it('removes items when quantity reaches zero', () => {
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().removeItem(1, couscous.id)

    expect(useOrderStore.getState().getCart(1)).toEqual([])
  })

  it('calculates totals and item counts for a specific table', () => {
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().addItem(1, tajine)
    useOrderStore.getState().addItem(2, tajine)

    expect(useOrderStore.getState().getCartTotal(1)).toBe(211)
    expect(useOrderStore.getState().getCartItemCount(1)).toBe(3)
  })

  it('clears only the requested table cart', () => {
    useOrderStore.getState().addItem(1, couscous)
    useOrderStore.getState().addItem(2, tajine)
    useOrderStore.getState().clearCart(1)

    expect(useOrderStore.getState().getCart(1)).toEqual([])
    expect(useOrderStore.getState().getCart(2)).toEqual([{ plat: tajine, quantity: 1 }])
  })
})
