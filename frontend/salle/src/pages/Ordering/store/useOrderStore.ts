import { create } from 'zustand'
import { MenuDish } from '../types'

export interface CartItem {
  plat: MenuDish
  quantity: number
}

interface OrderState {
  carts: Record<number, CartItem[]>
  addItem: (tableId: number, plat: MenuDish) => void
  removeItem: (tableId: number, platId: number) => void
  clearCart: (tableId: number) => void
  getCart: (tableId: number) => CartItem[]
  getCartTotal: (tableId: number) => number
  getCartItemCount: (tableId: number) => number
}

const priceToNumber = (price: string | number) => Number(price) || 0

export const useOrderStore = create<OrderState>((set, get) => ({
  carts: {},

  addItem: (tableId, plat) => {
    set((state) => {
      const cart = state.carts[tableId] ?? []
      const existingItem = cart.find((item) => item.plat.id === plat.id)
      const nextCart = existingItem
        ? cart.map((item) => (
          item.plat.id === plat.id ? { ...item, quantity: item.quantity + 1 } : item
        ))
        : [...cart, { plat, quantity: 1 }]

      return {
        carts: {
          ...state.carts,
          [tableId]: nextCart,
        },
      }
    })
  },

  removeItem: (tableId, platId) => {
    set((state) => {
      const cart = state.carts[tableId] ?? []
      const nextCart = cart
        .map((item) => (
          item.plat.id === platId ? { ...item, quantity: item.quantity - 1 } : item
        ))
        .filter((item) => item.quantity > 0)

      return {
        carts: {
          ...state.carts,
          [tableId]: nextCart,
        },
      }
    })
  },

  clearCart: (tableId) => {
    set((state) => ({
      carts: {
        ...state.carts,
        [tableId]: [],
      },
    }))
  },

  getCart: (tableId) => get().carts[tableId] ?? [],

  getCartTotal: (tableId) => (
    get().getCart(tableId).reduce((total, item) => total + priceToNumber(item.plat.prix) * item.quantity, 0)
  ),

  getCartItemCount: (tableId) => (
    get().getCart(tableId).reduce((total, item) => total + item.quantity, 0)
  ),
}))
