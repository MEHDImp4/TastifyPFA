import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useKdsStore } from './useKdsStore'
import { Commande } from '../types'

// Mock axios
vi.mock('@shared/auth/axiosInstance', () => ({
  default: {
    get: vi.fn(),
  },
}))

import axios from '@shared/auth/axiosInstance'

const mockOrder: Commande = {
  id: 1,
  table: 5,
  serveur: 1,
  serveur_name: 'John Doe',
  serveur_username: 'john',
  statut: 'EN_CUISINE',
  montant_total: '50.00',
  est_active: true,
  created_at: '2026-05-01T20:00:00Z',
  updated_at: '2026-05-01T20:00:00Z',
  lignes: [],
}

describe('useKdsStore', () => {
  beforeEach(() => {
    // @ts-ignore - newOrderIds doesn't exist yet
    useKdsStore.setState({ orders: [], isLoading: false, error: null, newOrderIds: new Set() })
    vi.clearAllMocks()
  })

  it('should initialize with empty orders', () => {
    const state = useKdsStore.getState()
    expect(state.orders).toEqual([])
  })

  it('should fetch orders successfully', async () => {
    const orders = [mockOrder]
    vi.mocked(axios.get).mockResolvedValue({ data: orders })

    await useKdsStore.getState().fetchOrders()

    expect(useKdsStore.getState().orders).toEqual(orders)
    expect(useKdsStore.getState().isLoading).toBe(false)
  })

  it('should add a new order to the front (LIFO)', () => {
    const order1 = { ...mockOrder, id: 1, created_at: '2026-05-01T20:00:00Z' }
    const order2 = { ...mockOrder, id: 2, created_at: '2026-05-01T20:05:00Z' }

    useKdsStore.getState().addOrUpdateOrder(order1)
    useKdsStore.getState().addOrUpdateOrder(order2)

    const state = useKdsStore.getState()
    expect(state.orders).toHaveLength(2)
    expect(state.orders[0].id).toBe(2) // LIFO
    expect(state.orders[1].id).toBe(1)
  })

  it('should update an existing order', () => {
    const order1 = { ...mockOrder, id: 1, statut: 'EN_CUISINE' as const }
    useKdsStore.getState().addOrUpdateOrder(order1)

    const updatedOrder = { ...order1, statut: 'PRETE' as const }
    useKdsStore.getState().addOrUpdateOrder(updatedOrder)

    const state = useKdsStore.getState()
    expect(state.orders).toHaveLength(1)
    expect(state.orders[0].statut).toBe('PRETE')
  })

  it('should remove an order', () => {
    useKdsStore.getState().addOrUpdateOrder(mockOrder)
    expect(useKdsStore.getState().orders).toHaveLength(1)

    useKdsStore.getState().removeOrder(mockOrder.id)
    expect(useKdsStore.getState().orders).toHaveLength(0)
  })

  describe('handleSocketEvent', () => {
    it('should add order on order_created if isKitchenStatus', () => {
      useKdsStore.getState().handleSocketEvent({
        type: 'order_created',
        payload: { order: mockOrder }
      })
      expect(useKdsStore.getState().orders).toHaveLength(1)
    })

    it('should update order on order_updated if isKitchenStatus', () => {
      useKdsStore.getState().addOrUpdateOrder(mockOrder)
      const updatedOrder = { ...mockOrder, montant_total: '60.00' }
      
      useKdsStore.getState().handleSocketEvent({
        type: 'order_updated',
        payload: { order: updatedOrder }
      })
      
      expect(useKdsStore.getState().orders[0].montant_total).toBe('60.00')
    })

    it('should remove order on order_updated if NOT isKitchenStatus anymore', () => {
      useKdsStore.getState().addOrUpdateOrder(mockOrder)
      const updatedOrder = { ...mockOrder, statut: 'PAYEE' as const }
      
      useKdsStore.getState().handleSocketEvent({
        type: 'order_updated',
        payload: { order: updatedOrder }
      })
      
      expect(useKdsStore.getState().orders).toHaveLength(0)
    })

    it('rejects EN_COURS orders on order_created (P16-FE-06)', () => {
      const orderEnCours = { ...mockOrder, statut: 'EN_COURS' as const }
      useKdsStore.getState().handleSocketEvent({
        type: 'order_created',
        payload: { order: orderEnCours },
      })
      expect(useKdsStore.getState().orders).toHaveLength(0)
      // @ts-ignore - newOrderIds doesn't exist yet
      expect(useKdsStore.getState().newOrderIds.size).toBe(0)
    })

    it('rejects EN_COURS orders on order_updated (P16-FE-06)', () => {
      // @ts-ignore - newOrderIds doesn't exist yet
      useKdsStore.setState({ orders: [], newOrderIds: new Set() })
      const orderEnCours = { ...mockOrder, statut: 'EN_COURS' as const }
      useKdsStore.getState().handleSocketEvent({
        type: 'order_updated',
        payload: { order: orderEnCours },
      })
      expect(useKdsStore.getState().orders).toHaveLength(0)
    })

    it('adds the order id to newOrderIds when EN_CUISINE arrives via order_updated (P16-FE-05)', () => {
      // @ts-ignore - newOrderIds doesn't exist yet
      useKdsStore.setState({ orders: [], newOrderIds: new Set() })
      useKdsStore.getState().handleSocketEvent({
        type: 'order_updated',
        payload: { order: mockOrder }, // statut already 'EN_CUISINE'
      })
      // @ts-ignore - newOrderIds doesn't exist yet
      expect(useKdsStore.getState().newOrderIds.has(mockOrder.id)).toBe(true)
    })

    it('clearNewOrder removes the id from newOrderIds (P16-FE-05)', () => {
      // @ts-ignore - newOrderIds/clearNewOrder doesn't exist yet
      useKdsStore.setState({ newOrderIds: new Set([42]) })
      // @ts-ignore - clearNewOrder doesn't exist yet
      useKdsStore.getState().clearNewOrder(42)
      // @ts-ignore - newOrderIds doesn't exist yet
      expect(useKdsStore.getState().newOrderIds.has(42)).toBe(false)
    })

    it('fetchOrders does NOT populate newOrderIds (P16-FE-05 / Pitfall 5)', async () => {
      vi.mocked(axios.get).mockResolvedValue({ data: [mockOrder] })
      await useKdsStore.getState().fetchOrders()
      // @ts-ignore - newOrderIds doesn't exist yet
      expect(useKdsStore.getState().newOrderIds.size).toBe(0)
    })

    it('should ignore other event types', () => {
      useKdsStore.getState().handleSocketEvent({
        type: 'other_event',
        data: {}
      })
      expect(useKdsStore.getState().orders).toHaveLength(0)
    })
  })
})
