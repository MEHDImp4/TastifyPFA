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

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useKdsStore).mockImplementation((selector) => selector({ handleSocketEvent: mockHandleSocketEvent }))
  })

  it('should call handleSocketEvent when lastEvent changes', () => {
    const mockEvent = { type: 'order_created', order: { id: 1 } }
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: mockEvent, connectionStatus: 'open' })

    render(<KdsSocketManager />)

    expect(mockHandleSocketEvent).toHaveBeenCalledWith(mockEvent)
  })

  it('should not call handleSocketEvent when lastEvent is null', () => {
    vi.mocked(useStaffWebSocket).mockReturnValue({ lastEvent: null, connectionStatus: 'open' })

    render(<KdsSocketManager />)

    expect(mockHandleSocketEvent).not.toHaveBeenCalled()
  })
})
