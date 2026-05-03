import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { KdsSocketManager } from './KdsSocketManager'
import { useKdsStore } from './store/useKdsStore'
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider'

vi.mock('@shared/websocket/WebSocketProvider', () => ({
  useStaffWebSocket: vi.fn()
}))

vi.mock('./store/useKdsStore', () => ({
  useKdsStore: vi.fn()
}))

describe('KdsSocketManager', () => {
  const mockHandleSocketEvent = vi.fn()
  const mockFetchOrders = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useKdsStore).mockImplementation((selector: any) =>
      selector({
        handleSocketEvent: mockHandleSocketEvent,
        fetchOrders: mockFetchOrders,
      })
    )
  })

  it('should call handleSocketEvent on order_created but not fetchOrders', () => {
    const mockEvent = { type: 'order_created', order: { id: 1 }, payload: {} }
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: mockEvent as any, connectionStatus: 'closed' })

    render(<KdsSocketManager />)

    expect(mockHandleSocketEvent).toHaveBeenCalledWith(mockEvent)
    // order_created events are EN_COURS and won't appear on the KDS; skipping
    // fetchOrders here avoids a race that would overwrite the order_updated result.
    expect(mockFetchOrders).not.toHaveBeenCalled()
  })

  it('should call handleSocketEvent and fetchOrders on order_updated', () => {
    const mockEvent = { type: 'order_updated', payload: { order: { id: 1, statut: 'PRETE' } } }
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: mockEvent as any, connectionStatus: 'closed' })

    render(<KdsSocketManager />)

    expect(mockHandleSocketEvent).toHaveBeenCalledWith(mockEvent)
    expect(mockFetchOrders).toHaveBeenCalledTimes(1)
  })

  it('should not call handleSocketEvent when lastEvent is null', () => {
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: null, connectionStatus: 'closed' })

    render(<KdsSocketManager />)

    expect(mockHandleSocketEvent).not.toHaveBeenCalled()
    expect(mockFetchOrders).not.toHaveBeenCalled()
  })

  it('should refetch orders when the websocket connection opens', () => {
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: null, connectionStatus: 'open' })

    render(<KdsSocketManager />)

    expect(mockFetchOrders).toHaveBeenCalledTimes(1)
  })

  it('should not refetch for unrelated websocket events', () => {
    const mockEvent = { type: 'table_updated', payload: { table: { id: 7 } } }
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: mockEvent as any, connectionStatus: 'closed' })

    render(<KdsSocketManager />)

    expect(mockHandleSocketEvent).toHaveBeenCalledWith(mockEvent)
    expect(mockFetchOrders).not.toHaveBeenCalled()
  })
})
