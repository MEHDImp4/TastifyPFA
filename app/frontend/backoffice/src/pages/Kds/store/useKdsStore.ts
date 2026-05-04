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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeCommande = (value: unknown): Commande | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = typeof value.id === 'number' ? value.id : null
  const createdAt = typeof value.created_at === 'string' ? value.created_at : null
  const updatedAt = typeof value.updated_at === 'string' ? value.updated_at : createdAt
  const lignes = Array.isArray(value.lignes) ? value.lignes : []
  const statut = typeof value.statut === 'string' ? value.statut : null

  if (id === null || createdAt === null || updatedAt === null || statut === null) {
    return null
  }

  return {
    id,
    table: typeof value.table === 'number' ? value.table : 0,
    serveur: typeof value.serveur === 'number' ? value.serveur : null,
    serveur_name: typeof value.serveur_name === 'string' ? value.serveur_name : null,
    serveur_username: typeof value.serveur_username === 'string' ? value.serveur_username : null,
    statut: statut as Commande['statut'],
    montant_total: typeof value.montant_total === 'string' || typeof value.montant_total === 'number'
      ? value.montant_total
      : 0,
    est_active: typeof value.est_active === 'boolean' ? value.est_active : true,
    created_at: createdAt,
    updated_at: updatedAt,
    lignes: lignes
      .filter(isRecord)
      .map((ligne) => ({
        id: typeof ligne.id === 'number' ? ligne.id : 0,
        plat: typeof ligne.plat === 'number' ? ligne.plat : 0,
        plat_details: isRecord(ligne.plat_details)
          ? {
              id: typeof ligne.plat_details.id === 'number' ? ligne.plat_details.id : 0,
              nom:
                typeof ligne.plat_details.nom === 'string'
                  ? ligne.plat_details.nom
                  : 'Plat inconnu',
              prix:
                typeof ligne.plat_details.prix === 'string' ||
                typeof ligne.plat_details.prix === 'number'
                  ? ligne.plat_details.prix
                  : 0,
            }
          : {
              id: 0,
              nom: 'Plat inconnu',
              prix: 0,
            },
        quantite: typeof ligne.quantite === 'number' ? ligne.quantite : 0,
        prix_unitaire:
          typeof ligne.prix_unitaire === 'string' || typeof ligne.prix_unitaire === 'number'
            ? ligne.prix_unitaire
            : 0,
        statut:
          typeof ligne.statut === 'string' ? (ligne.statut as Commande['lignes'][number]['statut']) : 'EN_ATTENTE',
        notes: typeof ligne.notes === 'string' ? ligne.notes : '',
        heure_lancement: typeof ligne.heure_lancement === 'string' ? ligne.heure_lancement : null,
        heure_fin_estimee: typeof ligne.heure_fin_estimee === 'string' ? ligne.heure_fin_estimee : null,
        created_at: typeof ligne.created_at === 'string' ? ligne.created_at : createdAt,
        updated_at: typeof ligne.updated_at === 'string' ? ligne.updated_at : updatedAt,
      })),
  }
}

const sortOrdersByPriorityDesc = (orders: Commande[]) =>
  [...orders].sort((a, b) => {
    const aPriority = a.lignes.length > 0 ? Math.max(...a.lignes.map((l) => l.id)) : 0
    const bPriority = b.lignes.length > 0 ? Math.max(...b.lignes.map((l) => l.id)) : 0

    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }

    // Fallback to ID if priorities are equal (shouldn't happen with unique line IDs)
    return b.id - a.id
  })

export const useKdsStore = create<KdsState>((set, get) => ({
  orders: [],
  newOrderIds: new Set<number>(),
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get<Commande[]>('/commandes/')
      const orders = Array.isArray(response.data)
        ? sortOrdersByPriorityDesc(
            response.data
              .map(normalizeCommande)
              .filter((order): order is Commande => order !== null)
          )
        : []
      set({ orders, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch orders', isLoading: false })
    }
  },

  addOrUpdateOrder: (order: Commande) => {
    const normalizedOrder = normalizeCommande(order)
    if (!normalizedOrder) {
      return
    }

    set((state) => {
      const index = state.orders.findIndex((o) => o.id === order.id)
      const newOrders = [...state.orders]

      if (index !== -1) {
        newOrders[index] = normalizedOrder
      } else {
        newOrders.unshift(normalizedOrder)
      }

      return { orders: sortOrdersByPriorityDesc(newOrders) }
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

    const order = normalizeCommande(payload?.order)
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
