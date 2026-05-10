import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plat } from '../api/menu';

interface CartItem {
  plat: Plat;
  quantite: number;
}

interface CartState {
  items: CartItem[];
  addItem: (plat: Plat) => void;
  removeItem: (platId: number) => void;
  updateQty: (platId: number, delta: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (plat) => {
        const items = get().items;
        const existing = items.find(i => i.plat.id === plat.id);
        if (existing) {
          set({ items: items.map(i => i.plat.id === plat.id ? { ...i, quantite: i.quantite + 1 } : i) });
        } else {
          set({ items: [...items, { plat, quantite: 1 }] });
        }
      },
      removeItem: (platId) => set({ items: get().items.filter(i => i.plat.id !== platId) }),
      updateQty: (platId, delta) => set({
        items: get().items.map(i => i.plat.id === platId ? { ...i, quantite: Math.max(1, i.quantite + delta) } : i)
      }),
      clearCart: () => set({ items: [] }),
      get total() {
        return get().items.reduce((sum, item) => sum + (parseFloat(item.plat.prix) * item.quantite), 0);
      }
    }),
    { name: 'tastify-client-cart' }
  )
);
