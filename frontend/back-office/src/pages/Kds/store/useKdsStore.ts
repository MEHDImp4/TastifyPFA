import { create } from 'zustand'
import axios from '@shared/auth/axiosInstance'
import { Commande } from '../types'

interface KdsState {
  orders: Commande[]
  newOrderIds: Set<number>
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  addOrUpdateOrder: (order: Commande) => void
  removeOrder: (orderId: number) => void
  clearNewOrder: (orderId: number) => void
  handleSocketEvent: (event: any) => void
}

export const useKdsStore = create<KdsState>((set, get) => ({
  orders: [],
  newOrderIds: new Set<number>(),
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get<Commande[]>('/commandes/')
      // The backend now filters for (EN_CUISINE | PRETE) for CUISINIER role
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

  clearNewOrder: (orderId: number) => {
    set((state) => {
      if (!state.newOrderIds.has(orderId)) return state
      const next = new Set(state.newOrderIds)
      next.delete(orderId)
      return { newOrderIds: next }
    })
  },

  handleSocketEvent: (event: any) => {
    const { type, payload } = event

    if (type === 'line_launched') {
      const { ligne_id, commande_id, heure_lancement, heure_fin_estimee } = payload
      set((state) => {
        const orderIndex = state.orders.findIndex((o) => o.id === commande_id)
        if (orderIndex === -1) return state

        const newOrders = [...state.orders]
        const order = { ...newOrders[orderIndex] }
        const ligneIndex = order.lignes.findIndex((l) => l.id === ligne_id)

        if (ligneIndex !== -1) {
          const newLignes = [...order.lignes]
          newLignes[ligneIndex] = {
            ...newLignes[ligneIndex],
            statut: 'EN_PREPARATION',
            heure_lancement,
            heure_fin_estimee,
            updated_at: new Date().toISOString()
          }
          order.lignes = newLignes
          newOrders[orderIndex] = order
        }
        return { orders: newOrders }
      })
      return
    }

    const order = payload?.order
    if (!order) return

    const isKitchenStatus = order.statut === 'EN_CUISINE' || order.statut === 'PRETE'
    const wasJustFired = order.statut === 'EN_CUISINE' && type === 'order_updated'

    if (type === 'order_created') {
      if (isKitchenStatus) {
        get().addOrUpdateOrder(order)
      }
    } else if (type === 'order_updated') {
      if (isKitchenStatus) {
        get().addOrUpdateOrder(order)
        if (wasJustFired) {
          set((state) => ({
            newOrderIds: new Set([...state.newOrderIds, order.id]),
          }))
        }
      } else {
        // Statut moved out of kitchen scope (PAYEE, ANNULEE, EN_COURS regression)
        get().removeOrder(order.id)
        // Also clean up any stale newOrderIds entry
        set((state) => {
          if (!state.newOrderIds.has(order.id)) return state
          const next = new Set(state.newOrderIds)
          next.delete(order.id)
          return { newOrderIds: next }
        })
      }
    }
  }
}))
