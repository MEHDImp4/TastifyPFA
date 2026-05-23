import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plat } from '../api/menu';

const CART_STORAGE_KEY = 'tastify-client-cart';

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

const readInitialCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const persistedValue = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!persistedValue) {
      return [];
    }

    const parsedValue = JSON.parse(persistedValue);
    return Array.isArray(parsedValue?.state?.items) ? parsedValue.state.items : [];
  } catch {
    return [];
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: readInitialCartItems(),
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
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
    }
  )
);
