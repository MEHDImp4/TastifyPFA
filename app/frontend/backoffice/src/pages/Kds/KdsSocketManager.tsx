import { useEffect } from 'react'
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider'
import { useKdsStore } from './store/useKdsStore'

const POLL_INTERVAL_MS = 15_000

export const KdsSocketManager = () => {
  const { connectionStatus, lastEvent } = useStaffWebSocket()
  const handleSocketEvent = useKdsStore((state) => state.handleSocketEvent)
  const fetchOrders = useKdsStore((state) => state.fetchOrders)

  // Polling fallback — keeps KDS current when WebSocket is disconnected or events are missed.
  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchOrders()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [fetchOrders])

  useEffect(() => {
    if (connectionStatus === 'open') {
      void fetchOrders()
    }
  }, [connectionStatus, fetchOrders])

  useEffect(() => {
    if (!lastEvent) return

    handleSocketEvent(lastEvent)

    // Only re-fetch on order_updated — order_created events are EN_COURS and
    // won't appear on the KDS, and triggering fetchOrders for them races with the
    // subsequent order_updated fetch, potentially overwriting a valid list with [].
    if (lastEvent.type === 'order_updated') {
      void fetchOrders()
    }
  }, [fetchOrders, handleSocketEvent, lastEvent])

  return null
}
