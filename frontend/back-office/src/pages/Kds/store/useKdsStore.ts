import { create } from 'zustand'
import axios from '@shared/auth/axiosInstance'
import { Commande } from '../types'

interface KdsState {
  orders: Commande[]
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  addOrUpdateOrder: (order: Commande) => void
  removeOrder: (orderId: number) => void
  handleSocketEvent: (event: any) => void
}

export const useKdsStore = create<KdsState>((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get<Commande[]>('/commandes/')
      // The backend now filters for (EN_COURS | EN_CUISINE) for CUISINIER role
      // Ensure they are sorted by created_at DESC (newest first)
      const orders = response.data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      set({ orders, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch orders', isLoading: false })
    }
  },

  addOrUpdateOrder: (order: Commande) => {
    set((state) => {
      const index = state.orders.findIndex((o) => o.id === order.id)
      let newOrders = [...state.orders]

      if (index !== -1) {
        // Update existing
        newOrders[index] = order
      } else {
        // Add new to front
        newOrders.unshift(order)
      }

      // Re-sort to be safe (LIFO)
      newOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return { orders: newOrders }
    })
  },

  removeOrder: (orderId: number) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId)
    }))
  },

  handleSocketEvent: (event: any) => {
    const { type, payload } = event
    const order = payload?.order

    if (!order) return

    const isKitchenStatus = order.statut === 'EN_CUISINE' || order.statut === 'EN_COURS'

    if (type === 'order_created') {
      if (isKitchenStatus) {
        get().addOrUpdateOrder(order)
      }
    } else if (type === 'order_updated') {
      if (isKitchenStatus) {
        get().addOrUpdateOrder(order)
      } else {
        // If it moved out of kitchen statuses (e.g. PRETE, ANNULEE), remove it from KDS
        get().removeOrder(order.id)
      }
    }
  }
}))
