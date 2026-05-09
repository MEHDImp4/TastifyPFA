import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  platId: number
  nom: string
  prix: number
  image?: string
  quantity: number
  notes: string
}

interface CartState {
  items: CartItem[]
  addItem: (plat: { id: number; nom: string; prix: number | string; image?: string }, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (plat, quantity = 1) => {
        const items = get().items
        const existingItem = items.find((i) => i.platId === plat.id)
        
        if (existingItem) {
          set({
            items: items.map((i) =>
              i.platId === plat.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                id: Math.random().toString(36).substr(2, 9),
                platId: plat.id,
                nom: plat.nom,
                prix: typeof plat.prix === 'string' ? parseFloat(plat.prix) : plat.prix,
                image: plat.image,
                quantity,
                notes: '',
              },
            ],
          })
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) })
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        set({
          items: get().items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.prix * item.quantity, 0)
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'tastify-cart-storage',
    }
  )
)
