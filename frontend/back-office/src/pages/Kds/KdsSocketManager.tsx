import { useEffect, useRef } from 'react'
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider'
import { useKdsStore } from './store/useKdsStore'

/**
 * Bridges WebSocket events to the KDS store and plays the kitchen bell on
 * EN_CUISINE arrivals (Phase 16 — manual fire UX feedback).
 */
export const KdsSocketManager = () => {
  const { connectionStatus, lastEvent } = useStaffWebSocket()
  const handleSocketEvent = useKdsStore((state) => state.handleSocketEvent)
  const fetchOrders = useKdsStore((state) => state.fetchOrders)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const getOrderStatus = (payload: Record<string, unknown>) => {
    const order = payload.order
    if (!order || typeof order !== 'object' || Array.isArray(order)) {
      return undefined
    }

    const status = (order as Record<string, unknown>).statut
    return typeof status === 'string' ? status : undefined
  }

  useEffect(() => {
    audioRef.current = new Audio('/sounds/kitchen-bell.mp3')
    audioRef.current.preload = 'auto'
    return () => {
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (connectionStatus === 'open') {
      // Re-sync after reconnect so missed realtime events do not leave the KDS stale.
      void fetchOrders()
    }
  }, [connectionStatus, fetchOrders])

  useEffect(() => {
    if (!lastEvent) return

    handleSocketEvent(lastEvent)

    const isOrderEvent = lastEvent.type === 'order_created' || lastEvent.type === 'order_updated'
    if (isOrderEvent) {
      void fetchOrders()
    }

    const wasJustFired =
      lastEvent.type === 'order_updated' &&
      getOrderStatus(lastEvent.payload) === 'EN_CUISINE'

    if (wasJustFired && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Autoplay policy: browser blocks .play() until first user gesture.
        // Silent swallow is intentional — this is not an error condition.
      })
    }
  }, [fetchOrders, handleSocketEvent, lastEvent])

  return null
}
