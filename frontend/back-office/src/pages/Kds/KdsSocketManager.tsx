import { useEffect } from 'react'
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider'
import { useKdsStore } from './store/useKdsStore'

/**
 * Invisible component that bridges WebSocket events to the KDS store.
 */
export const KdsSocketManager = () => {
  const { connectionStatus, lastEvent } = useStaffWebSocket()
  const handleSocketEvent = useKdsStore((state) => state.handleSocketEvent)
  const fetchOrders = useKdsStore((state) => state.fetchOrders)

  useEffect(() => {
    if (connectionStatus === 'open') {
      // Re-sync after reconnect so missed realtime events do not leave the KDS stale.
      void fetchOrders()
    }
  }, [connectionStatus, fetchOrders])

  useEffect(() => {
    if (lastEvent) {
      handleSocketEvent(lastEvent)
      if (lastEvent.type === 'order_created' || lastEvent.type === 'order_updated') {
        void fetchOrders()
      }
    }
  }, [fetchOrders, handleSocketEvent, lastEvent])

  return null
}
