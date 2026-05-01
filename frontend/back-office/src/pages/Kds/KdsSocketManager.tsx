import { useEffect } from 'react'
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider'
import { useKdsStore } from './store/useKdsStore'

/**
 * Invisible component that bridges WebSocket events to the KDS store.
 */
export const KdsSocketManager = () => {
  const { lastEvent } = useStaffWebSocket()
  const handleSocketEvent = useKdsStore((state) => state.handleSocketEvent)

  useEffect(() => {
    if (lastEvent) {
      handleSocketEvent(lastEvent)
    }
  }, [lastEvent, handleSocketEvent])

  return null
}
